// 生成图形验证码的逻辑
import { ref } from 'vue'

export function useCaptcha() {
  const captchaCode = ref('')
  const captchaCanvas = ref(null)

  // 生成随机验证码（4位字符）
  function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  // 绘制验证码到 Canvas（更真实的风格）
  function drawCaptcha() {
    const canvas = captchaCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const code = captchaCode.value

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 背景色（随机浅色）
    ctx.fillStyle = `hsl(${Math.random() * 60 + 200}, 30%, 95%)`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 干扰线条（3条）
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(100, 100, 100, ${Math.random() * 0.3})`
      ctx.lineWidth = Math.random() * 1.5 + 0.5
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // 干扰点（30个）
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(80, 80, 80, ${Math.random() * 0.4})`
      ctx.beginPath()
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        2 * Math.PI,
      )
      ctx.fill()
    }

    // 绘制验证码字符
    const chars = code.split('')
    const charWidth = canvas.width / chars.length
    for (let i = 0; i < chars.length; i++) {
      ctx.save()
      const fontSize = 24 + Math.floor(Math.random() * 8)
      ctx.font = `${fontSize}px 'Courier New', monospace`
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`
      ctx.translate(charWidth * i + charWidth / 2, canvas.height / 2 + Math.random() * 4 - 2)
      ctx.rotate(((Math.random() * 30 - 15) * Math.PI) / 180)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(chars[i], 0, 0)
      ctx.restore()
    }
  }

  // 刷新验证码
  function refreshCaptcha() {
    captchaCode.value = generateCaptcha()
    drawCaptcha()
  }

  // 初始化验证码
  function initCaptcha() {
    captchaCode.value = generateCaptcha()
    drawCaptcha()
  }

  return {
    captchaCode,
    captchaCanvas,
    initCaptcha,
    refreshCaptcha,
    drawCaptcha,
  }
}
