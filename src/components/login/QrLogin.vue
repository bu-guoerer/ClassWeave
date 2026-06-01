<!-- QQ微信登录共同逻辑 -->
<template>
  <div class="qr-login">
    <!-- 状态提示 -->
    <div class="qr-message">
      {{ statusMessage }}
    </div>

    <!-- 二维码区域（点击触发状态变化/刷新） -->
    <div
      class="qr-container"
      :class="{ 'state-scanned': qrState === 'scanned', 'state-success': qrState === 'success' }"
      @click="handleClick"
    >
      <canvas ref="qrCanvas" width="200" height="200"></canvas>

      <!-- 加载动画（刷新时显示） -->
      <div v-if="isRefreshing" class="qr-loading">
        <div class="spinner"></div>
      </div>

      <!-- 状态覆盖层（非等待状态时显示） -->
      <div v-if="qrState !== 'waiting'" class="qr-overlay">
        <div v-if="qrState === 'scanned'">已扫码<br />请在手机上确认</div>
        <div v-if="qrState === 'success'">登录成功</div>
        <div v-if="qrState === 'expired'">二维码已过期<br />点击刷新</div>
      </div>
    </div>

    <!-- 倒计时和刷新提示 -->
    <div class="qr-footer">
      <span class="qr-timer" v-if="qrState === 'waiting' || qrState === 'expired'">
        剩余时间 {{ timeLeft }}秒
      </span>
      <span class="qr-refresh-hint" v-if="qrState !== 'success'" @click.stop="refreshQR">
        点击刷新
      </span>
    </div>

    <!-- 自动注册提示 -->
    <div class="form-tip">未注册的{{ platform === 'qq' ? 'QQ号' : '微信号' }}将自动注册账号</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  platform: {
    type: String,
    required: true,
    validator: (value) => ['qq', 'wechat'].includes(value),
  },
})

const emit = defineEmits(['login-success'])

// 二维码状态：waiting(等待扫码) | scanned(已扫码待确认) | success(登录成功) | expired(过期)
const qrState = ref('waiting')
const timeLeft = ref(120) // 剩余秒数
let timer = null
const isRefreshing = ref(false) // 刷新动画标志

const qrCanvas = ref(null)

// 根据平台和状态生成提示文案
const statusMessage = computed(() => {
  if (qrState.value === 'waiting')
    return `请用手机${props.platform === 'qq' ? 'QQ' : '微信'}扫码登录`
  if (qrState.value === 'scanned') return '已扫码，请在手机上确认'
  if (qrState.value === 'success') return '登录成功，即将跳转'
  if (qrState.value === 'expired') return '二维码已过期，请刷新'
  return ''
})

// 绘制模拟二维码
function drawQR() {
  const canvas = qrCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const size = 200
  const cellSize = 8
  const cols = size / cellSize

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const seed = props.platform === 'qq' ? 31 : 37
  const mod = props.platform === 'qq' ? 17 : 19
  const threshold = props.platform === 'qq' ? 8 : 9

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      if ((i * seed + j * (seed + 10)) % mod < threshold) {
        ctx.fillStyle = '#000000'
        ctx.fillRect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1)
      }
    }
  }

  // 定位方块
  ctx.fillStyle = '#000000'
  // 左上
  ctx.fillRect(10, 10, 30, 30)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(14, 14, 22, 22)
  ctx.fillStyle = '#000000'
  ctx.fillRect(18, 18, 14, 14)
  // 右上
  ctx.fillRect(160, 10, 30, 30)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(164, 14, 22, 22)
  ctx.fillStyle = '#000000'
  ctx.fillRect(168, 18, 14, 14)
  // 左下
  ctx.fillRect(10, 160, 30, 30)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(14, 164, 22, 22)
  ctx.fillStyle = '#000000'
  ctx.fillRect(18, 168, 14, 14)
}

// 刷新二维码（重置状态、重新绘制、重启倒计时）
function refreshQR() {
  if (isRefreshing.value) return // 避免重复刷新
  isRefreshing.value = true
  setTimeout(() => {
    qrState.value = 'waiting'
    timeLeft.value = 120
    drawQR()
    startTimer()
    isRefreshing.value = false
  }, 300) // 模拟加载动画
}

// 启动倒计时
function startTimer() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (qrState.value === 'success') {
      // 登录成功后停止倒计时
      return
    }
    if (qrState.value === 'scanned') {
      // 已扫码后停止倒计时（真实场景二维码不再过期）
      return
    }
    if (timeLeft.value <= 1) {
      // 倒计时结束，设为过期
      qrState.value = 'expired'
      clearInterval(timer)
      timer = null
    } else {
      timeLeft.value--
    }
  }, 1000)
}

// 停止倒计时（用于组件卸载或状态变化时）
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 点击二维码的处理
function handleClick() {
  if (isRefreshing.value) return

  if (qrState.value === 'waiting') {
    // 模拟扫码
    qrState.value = 'scanned'
    stopTimer() // 暂停倒计时
  } else if (qrState.value === 'scanned') {
    // 模拟手机端确认登录
    qrState.value = 'success'
    // 1.5秒后触发登录成功事件，模拟跳转
    setTimeout(() => {
      emit('login-success', props.platform)
    }, 1500)
  } else if (qrState.value === 'expired') {
    // 点击过期状态直接刷新
    refreshQR()
  }
  // success状态下点击无反应，可留空
}

// 初始化
onMounted(() => {
  drawQR()
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.qr-login {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.qr-message {
  font-size: 16px;
  color: #3a3a3a;
  text-align: center;
  margin-top: 10px;
  letter-spacing: 0.5px;
  min-height: 24px;
}

.qr-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #d9d9d9;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.1s;
}

.qr-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qr-container:active {
  transform: scale(0.98);
}

/* 状态特殊样式（可选） */
.qr-container.state-scanned {
  border-color: #f0b400; /* 橙色提示 */
}

.qr-container.state-success {
  border-color: #52c41a; /* 绿色成功 */
}

.qr-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 加载动画层 */
.qr-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #888;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 状态覆盖层 */
.qr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  backdrop-filter: blur(2px);
}

.qr-footer {
  display: flex;
  justify-content: space-between;
  width: 200px;
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

.qr-timer {
  color: #e53e3e;
  font-weight: 500;
}

.qr-refresh-hint {
  cursor: pointer;
  text-decoration: underline dotted;
  transition: color 0.2s;
}

.qr-refresh-hint:hover {
  color: #111;
}

.form-tip {
  font-size: 14px;
  color: #777;
  text-align: center;
  margin-top: 5px;
  margin-bottom: 5px;
  letter-spacing: 0.3px;
  border-top: 1px dashed #d0d0d0;
  padding-top: 18px;
  width: 100%;
}
</style>
