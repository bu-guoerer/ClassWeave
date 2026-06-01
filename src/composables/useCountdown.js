// 倒计时函数
import { ref } from 'vue'

export function useCountdown(initialSeconds = 60) {
  const countdown = ref(0)
  let timer = null

  const start = () => {
    if (countdown.value > 0) return
    countdown.value = initialSeconds
    timer = setInterval(() => {
      if (countdown.value <= 1) {
        clearInterval(timer)
        timer = null
        countdown.value = 0
      } else {
        countdown.value--
      }
    }, 1000)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = 0
  }

  return {
    countdown,
    start,
    stop,
  }
}
