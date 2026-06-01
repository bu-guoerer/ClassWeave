import { ref, nextTick } from 'vue'
import {
  registerFileApi,
  fetchEditorConfigApi,
  getMockOnlyOfficePreviewApi,
} from '@/api/onlyoffice'
import {
  fetchPptOnlyofficePreviewApi,
  fetchPptTaskOnlyofficePreviewApi,
} from '@/api/ppt'
import { loadOnlyOfficeScript } from '@/utils/onlyoffice-helper'

const DEFAULT_API_BASE_URL = ''
const DEFAULT_PREVIEW_REQUEST_TIMEOUT = 20000
const unwrapResponseData = (payload) => payload?.data ?? payload ?? null
const deriveApiJsUrl = (documentServerUrl) =>
  documentServerUrl
    ? `${String(documentServerUrl).replace(/\/$/, '')}/web-apps/apps/api/documents/api.js`
    : ''
const buildMockPreviewPayload = (config, payload) => ({
  apiBaseUrl: config.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  bucketName: payload.bucketName,
  creatorId: payload.creatorId,
  userId: payload.userId,
  mode: payload.mode,
  lang: payload.lang || 'zh-CN',
  beforeFile: {
    fileId: payload.fileId,
    fileName: payload.fileName,
    objectKey: payload.objectKey,
    directDownloadUrl: payload.directDownloadUrl,
  },
  afterFile: {
    fileId: `${payload.fileId}_preview`,
    fileName: payload.fileName,
    objectKey: payload.objectKey,
    directDownloadUrl: payload.directDownloadUrl,
  },
})
const pickPreviewField = (data, ...keys) => {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null && data?.[key] !== '') {
      return data[key]
    }
  }
  return ''
}
const hasDirectOnlyOfficeConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return false
  }

  const editorConfig = config.editorConfig || config.editor_config
  const apiJsUrl =
    config.apiJsUrl ||
    config.api_js_url ||
    deriveApiJsUrl(config.documentServerUrl || config.document_server_url)

  return Boolean(editorConfig && apiJsUrl)
}
const normalizeEditorData = (payload, fallbackName = '') => {
  const data = unwrapResponseData(payload) || {}
  const editorConfig = data.editorConfig || data.editor_config || null
  const documentServerUrl = data.documentServerUrl || data.document_server_url || ''
  const apiJsUrl = data.apiJsUrl || data.api_js_url || deriveApiJsUrl(documentServerUrl)

  return {
    ...data,
    editorConfig,
    documentServerUrl,
    apiJsUrl,
    fileName:
      data.fileName ||
      data.file_name ||
      fallbackName ||
      editorConfig?.document?.title ||
      '',
    directDownloadUrl:
      pickPreviewField(
        data,
        'directDownloadUrl',
        'direct_download_url',
      ) ||
      editorConfig?.document?.url ||
      editorConfig?.document?.directUrl ||
      '',
  }
}
const createDebugInfo = () => ({
  phase: 'idle',
  requestSource: '',
  previewSource: '',
  sessionId: '',
  taskId: '',
  apiJsUrl: '',
  documentServerUrl: '',
  documentUrl: '',
  fileName: '',
  sourceType: '',
  directDownloadUrl: '',
  lastError: '',
})
const withTimeout = (promise, timeoutMs, message) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })

export function useOnlyOffice(editorElementId) {
  const isLoading = ref(false)
  const loadingText = ref('')
  const errorMessage = ref('')
  const resolvedEditorData = ref(null)
  const debugInfo = ref(createDebugInfo())

  let docEditor = null

  const setDebugInfo = (patch = {}) => {
    debugInfo.value = {
      ...debugInfo.value,
      ...patch,
    }
  }

  const destroyEditor = (editorEl) => {
    if (docEditor?.destroyEditor) {
      docEditor.destroyEditor()
    }
    docEditor = null
    resolvedEditorData.value = null
    if (editorEl) {
      editorEl.innerHTML = ''
    }
  }

  const buildEditorConfig = (editorData) => {
    const baseConfig =
      editorData?.editorConfig && editorData.editorConfig.document
        ? editorData.editorConfig
        : editorData?.editorConfig || editorData || {}
    const baseEvents = baseConfig.events || {}
    const innerEditorConfig = baseConfig.editorConfig || {}
    const basePermissions = baseConfig.document?.permissions || {}
    const documentFileType = String(baseConfig.document?.fileType || '').toLowerCase()
    const isPdf = documentFileType === 'pdf'
    const requestedMode = isPdf ? 'view' : 'edit'
    const pluginDataList = innerEditorConfig.plugins?.pluginsData || []

    return {
      ...baseConfig,
      type: 'desktop',
      width: baseConfig.width || '100%',
      height: baseConfig.height || '100%',
      lang: baseConfig.lang || innerEditorConfig.lang || 'zh-CN',
      document: {
        ...baseConfig.document,
        permissions: {
          ...basePermissions,
          edit: !isPdf,
          review: !isPdf,
          comment: !isPdf,
          fillForms: !isPdf,
          modifyContentControl: !isPdf,
          modifyFilter: !isPdf,
          download: basePermissions.download ?? true,
          print: basePermissions.print ?? true,
        },
      },
      editorConfig: {
        ...innerEditorConfig,
        mode: requestedMode,
        lang: innerEditorConfig.lang || baseConfig.lang || 'zh-CN',
        customization: {
          ...(innerEditorConfig.customization || {}),
          autosave: innerEditorConfig.customization?.autosave ?? true,
          forcesave: innerEditorConfig.customization?.forcesave ?? true,
        },
        plugins: {
          ...(innerEditorConfig.plugins || {}),
          autostart: innerEditorConfig.plugins?.autostart || [],
          pluginsData: pluginDataList,
        },
      },
      events: {
        ...baseEvents,
        onDownloadAs: (event) => {
          const downloadUrl = event?.data?.url
          if (downloadUrl) {
            window.open(downloadUrl, '_blank')
          }
          if (typeof baseEvents.onDownloadAs === 'function') {
            baseEvents.onDownloadAs(event)
          }
        },
        onAppReady: (...args) => {
          isLoading.value = false
          loadingText.value = 'ONLYOFFICE is ready.'
          setDebugInfo({ phase: 'app-ready' })
          if (typeof baseEvents.onAppReady === 'function') {
            baseEvents.onAppReady(...args)
          }
        },
        onRequestRefreshFile: () => {
          setDebugInfo({ phase: 'refresh-requested' })
          if (typeof baseEvents.onRequestRefreshFile === 'function') {
            baseEvents.onRequestRefreshFile()
          }
        },
        onDocumentReady: (...args) => {
          isLoading.value = false
          setDebugInfo({ phase: 'document-ready' })
          if (typeof baseEvents.onDocumentReady === 'function') {
            baseEvents.onDocumentReady(...args)
          }
        },
        onError: (event) => {
          isLoading.value = false
          errorMessage.value = event?.data?.message || 'ONLYOFFICE failed to load.'
          setDebugInfo({
            phase: 'doceditor-error',
            lastError:
              event?.data?.message ||
              event?.data?.description ||
              JSON.stringify(event?.data || event || {}),
          })
          if (typeof baseEvents.onError === 'function') {
            baseEvents.onError(event)
          }
        },
        onDocumentStateChange: (event) => {
          if (typeof baseEvents.onDocumentStateChange === 'function') {
            baseEvents.onDocumentStateChange(event)
          }
        },
      },
    }
  }

  const initPreview = async (config, editorEl) => {
    if (!config) {
      errorMessage.value = 'Missing preview config.'
      debugInfo.value = {
        ...createDebugInfo(),
        phase: 'missing-config',
        lastError: 'Missing preview config.',
      }
      return
    }

    isLoading.value = true
    loadingText.value = 'Loading ONLYOFFICE editor...'
    errorMessage.value = ''
    debugInfo.value = {
      ...createDebugInfo(),
      phase: 'initializing',
      previewSource: config.previewSource || '',
      sessionId: config.sessionId || '',
      taskId: config.taskId || '',
      fileName: config.fileName || '',
      directDownloadUrl: config.directDownloadUrl || '',
    }
    destroyEditor(editorEl)

    try {
      let editorData

      if (hasDirectOnlyOfficeConfig(config)) {
        setDebugInfo({
          phase: 'using-inline-config',
          requestSource: 'inline-config',
        })
        editorData = normalizeEditorData(config, config.fileName)
      } else if (config.previewSource === 'ppt-session-onlyoffice' && config.sessionId) {
        loadingText.value = 'Fetching ONLYOFFICE preview config...'
        setDebugInfo({
          phase: 'fetching-session-preview',
          requestSource: `/api/ppt/sessions/${config.sessionId}/onlyoffice-preview`,
        })
        try {
          const response = await withTimeout(
            fetchPptOnlyofficePreviewApi(config.sessionId, { mode: config.mode || 'edit' }),
            DEFAULT_PREVIEW_REQUEST_TIMEOUT,
            'Fetching ONLYOFFICE preview config timed out.',
          )
          editorData = normalizeEditorData(response, config.fileName)
        } catch (sessionPreviewError) {
          if (!config.taskId) {
            throw sessionPreviewError
          }

          loadingText.value = 'Retrying with task preview config...'
          setDebugInfo({
            phase: 'retrying-task-preview',
            requestSource: `/api/ppt/tasks/${config.taskId}/onlyoffice-preview`,
            lastError:
              sessionPreviewError instanceof Error
                ? sessionPreviewError.message
                : String(sessionPreviewError || ''),
          })
          const taskResponse = await withTimeout(
            fetchPptTaskOnlyofficePreviewApi(config.taskId, { mode: config.mode || 'edit' }),
            DEFAULT_PREVIEW_REQUEST_TIMEOUT,
            'Fetching ONLYOFFICE task preview config timed out.',
          )
          editorData = normalizeEditorData(taskResponse, config.fileName)
        }
      } else if (config.previewSource === 'ppt-task-onlyoffice' && config.taskId) {
        loadingText.value = 'Fetching ONLYOFFICE preview config...'
        setDebugInfo({
          phase: 'fetching-task-preview',
          requestSource: `/api/ppt/tasks/${config.taskId}/onlyoffice-preview`,
        })
        const response = await withTimeout(
          fetchPptTaskOnlyofficePreviewApi(config.taskId, { mode: config.mode || 'edit' }),
          DEFAULT_PREVIEW_REQUEST_TIMEOUT,
          'Fetching ONLYOFFICE task preview config timed out.',
        )
        editorData = normalizeEditorData(response, config.fileName)
      } else if (!config.fileId) {
        throw new Error('Preview fileId is missing.')
      } else {
        const apiBaseUrl = config.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
        const payload = {
          fileId: config.fileId,
          objectKey: config.objectKey,
          fileName: config.fileName,
          creatorId: config.creatorId,
          bucketName: config.bucketName,
          userId: config.userId || config.creatorId,
          mode: config.mode || 'edit',
          lang: config.lang || 'zh-CN',
          directDownloadUrl: config.directDownloadUrl,
        }

        setDebugInfo({
          phase: 'registering-file',
          requestSource: `${apiBaseUrl || '/api'}/onlyoffice/files/register`,
        })

        try {
          loadingText.value = 'Registering file...'
          await withTimeout(
            registerFileApi(apiBaseUrl, payload),
            DEFAULT_PREVIEW_REQUEST_TIMEOUT,
            'Registering the preview file timed out.',
          )

          loadingText.value = 'Fetching editor config...'
          setDebugInfo({
            phase: 'fetching-editor-config',
            requestSource: `${apiBaseUrl || '/api'}/onlyoffice/files/${payload.fileId}/editor-config`,
          })
          const res = await withTimeout(
            fetchEditorConfigApi(apiBaseUrl, payload),
            DEFAULT_PREVIEW_REQUEST_TIMEOUT,
            'Fetching ONLYOFFICE editor config timed out.',
          )
          editorData = {
            ...normalizeEditorData(res, payload.fileName),
            mode: payload.mode,
          }
        } catch (primaryError) {
          if (!payload.directDownloadUrl) {
            throw primaryError
          }

          loadingText.value = 'Falling back to preview config...'
          setDebugInfo({
            phase: 'fallback-mock-preview',
            requestSource: '/api/onlyoffice/files/mock-preview',
            lastError:
              primaryError instanceof Error ? primaryError.message : String(primaryError || ''),
          })
          const fallbackRes = await withTimeout(
            getMockOnlyOfficePreviewApi(buildMockPreviewPayload(config, payload)),
            DEFAULT_PREVIEW_REQUEST_TIMEOUT,
            'Fetching fallback preview config timed out.',
          )
          editorData = {
            ...normalizeEditorData(fallbackRes, payload.fileName),
            mode: payload.mode,
          }

          if (!editorData?.apiJsUrl) {
            throw primaryError
          }
        }
      }

      const requestedPreviewMode =
        config.mode ||
        (config.previewSource && String(config.previewSource).includes('ppt') ? 'edit' : '')

      if (requestedPreviewMode) {
        editorData = {
          ...editorData,
          mode: requestedPreviewMode,
        }
      }

      editorData = {
        ...editorData,
        mode: editorData?.editorConfig?.document?.fileType === 'pdf' ? 'view' : 'edit',
        readOnlyPreview: editorData?.editorConfig?.document?.fileType === 'pdf',
      }

      resolvedEditorData.value = editorData
      setDebugInfo({
        phase: 'preview-config-ready',
        apiJsUrl: editorData?.apiJsUrl || '',
        documentServerUrl: editorData?.documentServerUrl || '',
        documentUrl:
          editorData?.editorConfig?.document?.url ||
          editorData?.editorConfig?.document?.directUrl ||
          '',
        fileName: editorData?.fileName || config.fileName || '',
        sourceType: editorData?.sourceType || editorData?.source_type || '',
        directDownloadUrl: editorData?.directDownloadUrl || '',
      })

      if (!editorData?.apiJsUrl) {
        throw new Error('Backend did not return apiJsUrl.')
      }

      if (!editorData?.editorConfig) {
        throw new Error('Backend did not return editorConfig.')
      }

      loadingText.value = 'Loading ONLYOFFICE API...'
      setDebugInfo({ phase: 'loading-api-script' })
      await loadOnlyOfficeScript(editorData.apiJsUrl)
      await nextTick()

      if (!window.DocsAPI) {
        throw new Error('ONLYOFFICE DocsAPI is unavailable.')
      }

      loadingText.value = 'Initializing ONLYOFFICE editor...'
      setDebugInfo({ phase: 'creating-doceditor' })
      docEditor = new window.DocsAPI.DocEditor(editorElementId, buildEditorConfig(editorData))

      window.setTimeout(() => {
        if (isLoading.value && !errorMessage.value) {
          isLoading.value = false
        }
      }, 5000)
    } catch (error) {
      isLoading.value = false
      errorMessage.value = error instanceof Error ? error.message : 'Preview initialization failed.'
      setDebugInfo({
        phase: 'init-failed',
        lastError: error instanceof Error ? error.message : String(error || ''),
      })
      console.error('ONLYOFFICE init failed:', error)
    }
  }

  const enterFullscreen = async (editorEl) => {
    if (editorEl?.requestFullscreen) {
      await editorEl.requestFullscreen()
    }
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen()
    }
  }

  return {
    isLoading,
    loadingText,
    errorMessage,
    resolvedEditorData,
    debugInfo,
    initPreview,
    destroyEditor,
    enterFullscreen,
    exitFullscreen,
    getEditor: () => docEditor,
  }
}
