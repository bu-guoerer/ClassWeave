import request from '@/utils/request'

const DEFAULT_ATTACHMENT_UPLOAD_URL =
  import.meta.env.VITE_PPT_ATTACHMENT_UPLOAD_URL || '/ppt/uploads'

export function uploadPptAttachmentApi(file, extraData = {}) {
  const formData = new FormData()
  formData.append('file', file)

  Object.entries(extraData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value)
    }
  })

  return request({
    url: DEFAULT_ATTACHMENT_UPLOAD_URL,
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function createPptSessionApi(payload) {
  return request({
    url: '/ppt/sessions',
    method: 'POST',
    data: payload,
  })
}

export function appendPptSessionAssetsApi(sessionId, payload) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/assets`,
    method: 'POST',
    data: payload,
  })
}

export function fetchPptSessionApi(sessionId) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}`,
    method: 'GET',
  })
}

export function submitPptClarificationsApi(sessionId, payload) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/clarifications`,
    method: 'POST',
    data: payload,
  })
}

export function fetchPptOutlineApi(sessionId) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/outline`,
    method: 'GET',
  })
}

export function reviewPptOutlineApi(sessionId, payload) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/outline/review`,
    method: 'POST',
    data: payload,
  })
}

export function fetchPptDraftApi(sessionId) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/draft`,
    method: 'GET',
  })
}

export function revisePptDraftApi(sessionId, payload) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/draft/revise`,
    method: 'POST',
    data: payload,
  })
}

export function finalizePptApi(sessionId) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/finalize`,
    method: 'POST',
  })
}

export function fetchPptArtifactsApi(sessionId) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/artifacts`,
    method: 'GET',
  })
}

export function fetchPptOnlyofficePreviewApi(sessionId, options = {}) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/onlyoffice-preview`,
    method: 'GET',
    params: {
      mode: options.mode || 'edit',
    },
  })
}

export function fetchPptTaskOnlyofficePreviewApi(taskId, options = {}) {
  return request({
    url: `/ppt/tasks/${encodeURIComponent(taskId)}/onlyoffice-preview`,
    method: 'GET',
    params: {
      mode: options.mode || 'edit',
    },
  })
}

export function fetchPptDigitalHumanApi(sessionId) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/plugins/digital-human`,
    method: 'GET',
  })
}

export function createPptDigitalHumanApi(sessionId, payload = {}) {
  return request({
    url: `/ppt/sessions/${encodeURIComponent(sessionId)}/plugins/digital-human`,
    method: 'POST',
    data: payload,
  })
}
