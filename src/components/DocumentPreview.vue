<template>
  <div class="document-preview-container" ref="containerEl">
    <div class="preview-header">
      <span class="title">{{ previewTitle }}</span>
      <div class="header-actions">
        <a
          v-if="fallbackDownloadUrl"
          :href="fallbackDownloadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="download-link"
        >
          下载原文件
        </a>

        <button class="close-btn" type="button" @click="closePreview">关闭预览</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">{{ loadingText }}</div>
    <div :id="editorElementId" ref="editorEl" class="onlyoffice-wrapper"></div>

    <div
      v-if="!isLoading && !displayError && normalizedConfig && !resolvedEditorData"
      class="empty-state"
    >
      正在准备文档预览容器...
    </div>

    <div v-if="displayError" class="error-banner">
      {{ displayError }}
    </div>

    <div v-if="displayError" class="error-panel">
      <div class="error-panel__title">文档预览暂时不可用</div>
      <div class="error-panel__text">{{ displayError }}</div>
      <a
        v-if="fallbackDownloadUrl"
        :href="fallbackDownloadUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="error-panel__link"
      >
        下载原文件
      </a>
    </div>

    <div class="menu" role="toolbar" aria-label="Document preview actions">
      <button class="menu__item" type="button" @click="enterFullscreen" title="Fullscreen" aria-label="Fullscreen">
        ▶
      </button>
      <button class="menu__item" type="button" @click="exitFullscreen" title="Exit fullscreen" aria-label="Exit fullscreen">
        ■
      </button>
      <button class="menu__item" type="button" @click="reloadPreview" title="Reload" aria-label="Reload">
        ↻
      </button>
      <button class="menu__item" type="button" @click="openDownload" title="Download" aria-label="Download">
        ↓
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useOnlyOffice } from '@/hooks/useOnlyOffice.js'

const SUPPORTED_EXTENSIONS = new Set(['pdf', 'docx'])

const props = defineProps({
  documentConfig: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const editorEl = ref(null)
const containerEl = ref(null)
const normalizedConfig = ref(null)
const validationError = ref('')
const editorElementId = `onlyoffice-document-${Math.random().toString(36).slice(2)}`

const {
  isLoading,
  loadingText,
  errorMessage,
  resolvedEditorData,
  initPreview,
  destroyEditor,
} = useOnlyOffice(editorElementId)

const displayError = computed(() => validationError.value || errorMessage.value || '')

const previewTitle = computed(() => {
  if (!normalizedConfig.value) {
    return '文档预览'
  }

  return normalizedConfig.value.fileName || resolvedEditorData.value?.fileName || '文档预览'
})

const fallbackDownloadUrl = computed(() => {
  if (!normalizedConfig.value) {
    return ''
  }

  return getDownloadUrl(normalizedConfig.value) || resolvedEditorData.value?.directDownloadUrl || ''
})

function pickFirstValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) {
        return trimmed
      }
      continue
    }

    return value
  }

  return ''
}

function unwrapConfigEnvelope(source) {
  if (source && typeof source === 'object' && source.data && typeof source.data === 'object') {
    return source.data
  }

  return source && typeof source === 'object' ? source : null
}

function getEditorConfig(source) {
  return source?.editorConfig || source?.editor_config || null
}

function getDownloadUrl(source) {
  const editorConfig = getEditorConfig(source)
  const documentConfig = editorConfig?.document || {}

  return pickFirstValue(
    source?.directDownloadUrl,
    source?.direct_download_url,
    documentConfig.directUrl,
    documentConfig.url,
  )
}

function getFileNameFromUrl(url) {
  if (!url) {
    return ''
  }

  try {
    const pathname = new URL(url, window.location.origin).pathname
    const lastSegment = pathname.split('/').filter(Boolean).pop()
    return lastSegment ? decodeURIComponent(lastSegment) : ''
  } catch {
    const normalized = String(url).split('?')[0].split('#')[0]
    const lastSegment = normalized.split('/').filter(Boolean).pop()
    return lastSegment ? decodeURIComponent(lastSegment) : ''
  }
}

function getExtensionFromName(name) {
  const normalized = String(name || '').trim().toLowerCase()
  const match = normalized.match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

function sanitizeOnlyOfficeFileId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '') || `document${Date.now()}`
}

function deriveDocumentExtension(source, preferredName = '') {
  const editorConfig = getEditorConfig(source)
  const documentConfig = editorConfig?.document || {}

  return (
    getExtensionFromName(preferredName) ||
    getExtensionFromName(source?.objectKey || source?.object_key || '') ||
    getExtensionFromName(getDownloadUrl(source)) ||
    String(documentConfig.fileType || '').trim().toLowerCase()
  )
}

function buildInlinePreviewConfig(source) {
  const editorConfig = getEditorConfig(source)
  const documentConfig = editorConfig?.document || {}
  const apiJsUrl = pickFirstValue(source?.apiJsUrl, source?.api_js_url)
  const documentServerUrl = pickFirstValue(
    source?.documentServerUrl,
    source?.document_server_url,
  )
  const fileName = pickFirstValue(
    source?.fileName,
    source?.file_name,
    documentConfig.title,
    getFileNameFromUrl(getDownloadUrl(source)),
  )

  if (!apiJsUrl && !documentServerUrl) {
    return {
      config: null,
      error: '缺少 ONLYOFFICE 服务地址，无法打开文档预览。',
    }
  }

  const extension = deriveDocumentExtension(source, fileName)
  if (!extension) {
    return {
      config: null,
      error: '无法识别文档类型，请提供带扩展名的 fileName。',
    }
  }

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      config: null,
      error: `暂仅支持 PDF / DOCX 预览，当前文件类型为 ${extension.toUpperCase()}。`,
    }
  }

  return {
    config: {
      ...source,
      fileName: fileName || `document.${extension}`,
      directDownloadUrl: getDownloadUrl(source),
      mode: extension === 'pdf' ? 'view' : 'edit',
      readOnlyPreview: extension === 'pdf',
    },
    error: '',
  }
}

function buildMetadataPreviewConfig(source) {
  const rawFileId = pickFirstValue(source?.fileId, source?.file_id)
  const fileName = pickFirstValue(source?.fileName, source?.file_name)
  const objectKey = pickFirstValue(source?.objectKey, source?.object_key)
  const bucketName = pickFirstValue(source?.bucketName, source?.bucket_name)
  const missingFields = []

  if (!rawFileId) missingFields.push('fileId')
  if (!fileName) missingFields.push('fileName')
  if (!objectKey) missingFields.push('objectKey')
  if (!bucketName) missingFields.push('bucketName')

  if (missingFields.length) {
    return {
      config: null,
      error: `文档预览缺少关键字段：${missingFields.join('、')}。`,
    }
  }

  const extension = deriveDocumentExtension(source, fileName)
  if (!extension) {
    return {
      config: null,
      error: '无法识别文档类型，请提供带扩展名的 fileName。',
    }
  }

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      config: null,
      error: `暂仅支持 PDF / DOCX 预览，当前文件类型为 ${extension.toUpperCase()}。`,
    }
  }

  const fileId = sanitizeOnlyOfficeFileId(rawFileId)

  return {
    config: {
      ...source,
      fileId,
      fileName,
      objectKey,
      bucketName,
      directDownloadUrl: getDownloadUrl(source),
      mode: extension === 'pdf' ? 'view' : 'edit',
      lang: pickFirstValue(source?.lang, source?.editorConfig?.lang) || 'zh-CN',
      readOnlyPreview: extension === 'pdf',
    },
    error: '',
  }
}

function preparePreviewConfig(source) {
  const normalizedSource = unwrapConfigEnvelope(source)

  if (!normalizedSource) {
    return {
      config: null,
      error: '缺少文档预览配置。',
    }
  }

  if (getEditorConfig(normalizedSource)) {
    return buildInlinePreviewConfig(normalizedSource)
  }

  return buildMetadataPreviewConfig(normalizedSource)
}

function syncPreview() {
  const { config, error } = preparePreviewConfig(props.documentConfig)
  validationError.value = error
  normalizedConfig.value = config

  if (!editorEl.value) {
    return
  }

  if (!config || error) {
    destroyEditor(editorEl.value)
    return
  }

  initPreview(config, editorEl.value)
}

async function enterFullscreen() {
  if (containerEl.value?.requestFullscreen) {
    await containerEl.value.requestFullscreen()
  }
}

async function exitFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen()
  }
}

function reloadPreview() {
  if (!normalizedConfig.value || validationError.value) {
    return
  }

  initPreview(normalizedConfig.value, editorEl.value)
}

function openDownload() {
  if (!fallbackDownloadUrl.value) {
    return
  }

  window.open(fallbackDownloadUrl.value, '_blank', 'noopener,noreferrer')
}

function closePreview() {
  emit('close')
}

onMounted(() => {
  syncPreview()
})

watch(
  () => props.documentConfig,
  () => {
    syncPreview()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  destroyEditor(editorEl.value)
})
</script>

<style scoped>
.document-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 2;
}

.title {
  min-width: 0;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.download-link {
  color: #1677ff;
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
}

.close-btn {
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  background: #ff4d4f;
  color: #fff;
  cursor: pointer;
}

.loading-state {
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(22, 119, 255, 0.92);
  color: #fff;
  font-size: 14px;
}

.onlyoffice-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: calc(100% - 52px);
}

.error-banner {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(255, 77, 79, 0.92);
  color: #fff;
  font-size: 14px;
}

.empty-state,
.error-panel {
  position: absolute;
  inset: 72px 24px 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px dashed #c9d7ee;
  background: linear-gradient(180deg, #f7faff, #eef4ff);
  color: #52627b;
  text-align: center;
  padding: 24px;
}

.error-panel {
  border-style: solid;
  border-color: #ffd0d0;
  background: linear-gradient(180deg, #fff8f8, #fff2f2);
  color: #8f3535;
}

.error-panel__title {
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 700;
}

.error-panel__text {
  max-width: 440px;
  font-size: 14px;
  line-height: 1.7;
}

.error-panel__link {
  margin-top: 16px;
  color: #1677ff;
  text-decoration: none;
  font-weight: 600;
}

.menu {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid rgba(227, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  box-shadow:
    0 14px 36px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  z-index: 100;
}

.menu__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(180deg, #fbfbfb, #efefef);
  color: #505765;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 1px 3px rgba(15, 23, 42, 0.08);
}

.menu__item:hover {
  background: linear-gradient(180deg, #ffffff, #f4f4f4);
  color: #2f3640;
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 8px 18px rgba(15, 23, 42, 0.08);
}

@media (max-width: 960px) {
  .preview-header {
    padding: 10px 14px;
  }

  .header-actions {
    gap: 8px;
  }

  .download-link {
    font-size: 13px;
  }

  .close-btn {
    padding: 6px 12px;
  }

  .menu {
    width: calc(100% - 32px);
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 14px;
  }

  .menu__item {
    height: 42px;
    width: 42px;
  }
}
</style>
