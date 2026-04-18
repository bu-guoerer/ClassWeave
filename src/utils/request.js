import axios from 'axios'

import { ElMessage } from 'element-plus'

const baseURL = '/api'
const instance = axios.create({
  baseURL,
  timeout: 6 * 60 * 1000,
})

const isSuccessCode = (code) => [0, 1, 200, '0', '1', '200'].includes(code)
const getErrorMessage = (error) => {
  const backendMessage = error.response?.data?.message
  if (backendMessage) {
    return backendMessage
  }

  if (!error.response) {
    return 'API server is unreachable. Check whether the backend is running, or verify VITE_API_PROXY_TARGET / VITE_API_BASE_URL.'
  }

  if (error.response.status >= 500) {
    return `API server error (${error.response.status}). Check backend logs or the proxy target.`
  }

  return error.message || 'Service error'
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

    ElMessage.error(response.data.message || '服务异常')
    return Promise.reject(new Error(response.data.message || '服务异常'))
  },
  function (error) {
    ElMessage.error(getErrorMessage(error))
    return Promise.reject(error)
  },
)

export default instance
export { baseURL }
