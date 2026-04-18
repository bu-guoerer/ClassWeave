import request from '@/utils/request'

const DEFAULT_MOCK_PREVIEW_PAYLOAD = {
  apiBaseUrl: 'http://47.109.139.75:8080',
  bucketName: 'ppt-files',
  creatorId: 'u100',
  userId: 'u100',
  mode: 'edit',
  lang: 'zh-CN',
  beforeFile: {
    fileId: 'pptchapter2process',
    fileName: '第二章 进程管理-融合第9章与12章.pptx',
    objectKey: '第二章 进程管理-融合第9章与12章.pptx',
    directDownloadUrl:
      'http://47.109.139.75:9000/ppt-files/%E7%AC%AC%E4%BA%8C%E7%AB%A0%20%E8%BF%9B%E7%A8%8B%E7%AE%A1%E7%90%86-%E8%9E%8D%E5%90%88%E7%AC%AC9%E7%AB%A0%E4%B8%8E12%E7%AB%A0.pptx',
  },
  afterFile: {
    fileId: 'pptchapter2process_edited',
    fileName: '第二章 进程管理-融合第9章与12章-修改版.pptx',
    objectKey: '第二章 进程管理-融合第9章与12章-修改版.pptx',
    directDownloadUrl:
      'http://47.109.139.75:9000/ppt-files/%E7%AC%AC%E4%BA%8C%E7%AB%A0%20%E8%BF%9B%E7%A8%8B%E7%AE%A1%E7%90%86-%E8%9E%8D%E5%90%88%E7%AC%AC9%E7%AB%A0%E4%B8%8E12%E7%AB%A0-%E4%BF%AE%E6%94%B9%E7%89%88.pptx',
  },
}

const normalizeApiBaseUrl = (apiBaseUrl) => {
  if (!apiBaseUrl) {
    return ''
  }

  // Port 8080 is plain HTTP for the Spring Boot service in this project.
  return apiBaseUrl.replace(/^https:\/\/([^/]+:8080)(\/|$)/i, 'http://$1$2')
}

export function registerFileApi(apiBaseUrl, payload) {
  const resolvedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl)
  const url = resolvedApiBaseUrl
    ? `${resolvedApiBaseUrl}/api/onlyoffice/files/register`
    : '/onlyoffice/files/register'

  return request({ url, method: 'POST', data: payload })
}

export function fetchEditorConfigApi(apiBaseUrl, payload) {
  const fileId = encodeURIComponent(payload.fileId || '')
  const userId = encodeURIComponent(payload.userId || payload.creatorId || 'u100')
  const mode = encodeURIComponent(payload.mode || 'edit')
  const resolvedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl)
  const url = resolvedApiBaseUrl
    ? `${resolvedApiBaseUrl}/api/onlyoffice/files/${fileId}/editor-config`
    : `/onlyoffice/files/${fileId}/editor-config`

  return request({
    url,
    method: 'GET',
    params: { userId, mode },
  })
}

export function getMockOnlyOfficePreviewApi(payload = DEFAULT_MOCK_PREVIEW_PAYLOAD) {
  return request({
    url: '/onlyoffice/files/mock-preview',
    method: 'POST',
    data: payload,
  })
}
