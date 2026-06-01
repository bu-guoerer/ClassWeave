import axios from 'axios'

const baseURL = '/api'
const instance = axios.create({
  baseURL,
  timeout: 6 * 60 * 1000,
})

const isSuccessCode = (code) => [0, 1, 200, '0', '1', '200'].includes(code)
const isTechnicalErrorMessage = (message) => {
  const text = String(message || '').trim()
  if (!text) return false
  return /SuperPPT|I\/O error|POST request|GET request|http:\/\/|https:\/\/|localhost|127\.0\.0\.1|\/sessions\/|\/api\/|Axios|Network Error|ECONN|ETIMEDOUT|ENOTFOUND|Exception|java\.|stack trace|null$/i.test(
    text
  )
}

const getSafeBackendMessage = (message, fallback) => {
  const text = String(message || '').trim()
  if (!text || isTechnicalErrorMessage(text)) return fallback
  return text
}

const getErrorMessage = (error) => {
  const backendMessage =
    error.response?.data?.message ||
    error.response?.data?.msg ||
    error.response?.data?.errorMessage ||
    error.response?.data?.error
  if (backendMessage) {
    return getSafeBackendMessage(backendMessage, '服务暂时没有完成处理，请稍后重试。')
  }

  if (!error.response) {
    return '服务暂时连接不上，请稍后再试。'
  }

  if (error.response.status === 400) {
    return '当前请求条件不满足，请检查信息是否完整，或稍后重新生成。'
  }

  if (error.response.status === 401 || error.response.status === 403) {
    return '当前没有权限完成这个操作，请重新登录或联系管理员。'
  }

  if (error.response.status === 404) {
    return '没有找到对应的生成结果，请重新生成后再试。'
  }

  if (error.response.status >= 500) {
    return '服务处理时遇到问题，请稍后重试。'
  }

  return '操作没有成功，请稍后重试。'
}

// 请求拦截器
instance.interceptors.request.use(
  function (config) {
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

// 响应拦截器
instance.interceptors.response.use(
  function (response) {
    if (response?.data == null) {
      return response
    }

    if (response.data.code === undefined || isSuccessCode(response.data.code)) {
      return response.data
    }

    const message = getSafeBackendMessage(
      response.data.message || response.data.msg,
      '服务异常，请稍后重试。'
    )
    const businessError = new Error(message)
    businessError.userMessage = message
    return Promise.reject(businessError)
  },
  function (error) {
    const message = getErrorMessage(error)
    error.userMessage = message
    return Promise.reject(error)
  },
)

export default instance
export { baseURL }
