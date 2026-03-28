<template>
  <div class="ppt-preview-container" ref="containerEl">
    <div class="preview-header">
      <span class="title">{{ previewTitle }}</span>
      <div class="header-actions">
        <a
          v-if="fallbackDownloadUrl"
          :href="fallbackDownloadUrl"
          rel="noopener noreferrer"
          class="download-link"
        >
          下载原文件
        </a>

        <button class="close-btn" @click="closePreview">关闭预览</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">{{ loadingText }}</div>
    <div :id="editorElementId" ref="editorEl" class="onlyoffice__wrapper"></div>

    <div v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </div>

    <div
      class="digital-human-layer"
      v-show="isDigitalHumanActive"
      :class="{ 'is-speaking': isSpeaking }"
    >
      <transition name="fade">
        <div class="speech-bubble" v-if="currentSpeechText">
          {{ currentSpeechText }}
          <div class="wave-animation" v-if="isSpeaking">
            <span></span><span></span><span></span>
          </div>
        </div>
      </transition>

      <div class="avatar-model">
        <video
          src="../assets/videos/shuziren.mp4"
          ref="dhVideoRef"
          loop
          muted
          playsinline
          class="digital-human-video"
        ></video>
        <div class="glow-ring"></div>
      </div>
    </div>

    <ul class="menu">
      <li class="menu__item" @click="enterFullscreen" title="全屏">▶</li>
      <li class="menu__item" @click="exitFullscreen" title="退出全屏">⏹</li>
      <li class="menu__item" @click="reloadPreview" title="重新加载">↺</li>
      <li class="menu__item" @click="openDownload" title="下载文件">↓</li>

      <li
        class="menu__item dh-btn"
        :class="{ active: isDigitalHumanActive }"
        @click="toggleDigitalHuman"
        title="数字人讲解"
      >
        AI
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch, onMounted } from 'vue'
import { useOnlyOffice } from '@/hooks/useOnlyOffice.js'

const props = defineProps<{
  documentConfig?: any // 你的 PreviewEnvelope 配置
  fileUrl?: string
}>()

const emit = defineEmits(['close'])

// DOM 引用
const editorEl = ref<HTMLElement | null>(null)
const containerEl = ref<HTMLElement | null>(null)
const editorElementId = `onlyoffice-editor-${Math.random().toString(36).slice(2)}`

// ====== 引入抽离的核心 Hook ======
const {
  isLoading,
  loadingText,
  errorMessage,
  resolvedEditorData,
  initPreview,
  destroyEditor,
  getEditor,
} = useOnlyOffice(editorElementId)

// 提取规范化的配置参数
const normalizedConfig = computed(() => {
  const source = props.documentConfig
  let config = null

  if (source && typeof source === 'object' && 'data' in source) {
    config = source.data
  } else if (source && typeof source === 'object') {
    config = source
  } else if (props.fileUrl) {
    config = { directDownloadUrl: props.fileUrl }
  }

  return config
})

const previewTitle = computed(
  () => resolvedEditorData.value?.fileName || normalizedConfig.value?.fileName || 'ONLYOFFICE 预览'
)

const fallbackDownloadUrl = computed(
  () =>
    resolvedEditorData.value?.directDownloadUrl ||
    normalizedConfig.value?.directDownloadUrl ||
    props.fileUrl ||
    ''
)

// ==================== 核心：监听数据变化自动加载 ====================
// 替代原先的 onMounted，这样无论父组件异步还是同步传值，都能成功加载！
onMounted(() => {
  // 必须等 DOM 渲染完，才能交给 ONLYOFFICE 去挂载
  initPreview(normalizedConfig.value, editorEl.value)
})
onBeforeUnmount(() => {
  destroyEditor(editorEl.value)
})

// ==================== 操作方法 ====================
// 1. 全屏
const enterFullscreen = async () => {
  if (containerEl.value?.requestFullscreen) {
    await containerEl.value.requestFullscreen()
  }
}

// 2. 退出全屏
const exitFullscreen = async () => {
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen()
  }
}

// 3. 重新加载
const reloadPreview = () => {
  initPreview(normalizedConfig.value, editorEl.value)
}

// 4. 下载文件
const openDownload = () => {
  const editor = getEditor()
  // 优先调用 ONLYOFFICE 原生 API，直接下载包含最新修改的当前文件
  if (editor && typeof editor.downloadAs === 'function') {
    console.log('1. 已向 ONLYOFFICE 发送打包指令，要求格式为: pptx')
    editor.downloadAs('pptx')
  } else if (fallbackDownloadUrl.value) {
    // 降级方案
    window.open(fallbackDownloadUrl.value, '_blank', 'noopener,noreferrer')
  }
}

// 5. 关闭预览
const closePreview = () => {
  emit('close')
}

// ==================== 数字人语音讲解 ====================
/** 每页课件对应的讲解文案 */
const lectureNotes: Record<number, string> = {
  1: '我们先从当前这一页开始讲解本次课件的核心主题。',
  2: '这一页通常会给出重点概念，建议结合标题和关键词一起理解。',
  3: '接下来这页更适合配合案例来讲，我会帮你抓重点。',
}
const dhVideoRef = ref<HTMLVideoElement | null>(null)
const isDigitalHumanActive = ref(false)
const isSpeaking = ref(false)
const currentSpeechText = ref('')
let slideIndex = 1

function speak(text: string) {
  if (!('speechSynthesis' in window)) {
    currentSpeechText.value = text
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  
  // 1. 基础设置
  utterance.lang = 'zh-CN'
  utterance.rate = 1 
  utterance.pitch = 1 // 【修改】将 pitch 从 1.1 改回 1，恢复正常音调，避免声音发飘

  // 2. 【新增】尝试获取系统中更自然的真人语音包
  const voices = window.speechSynthesis.getVoices()
  // 优先寻找 Edge 浏览器或 Windows 系统自带的高质量语音（如晓晓），它们非常接近真人
  const naturalVoice = voices.find(voice => 
    voice.name.includes('Xiaoxiao') || 
    voice.name.includes('Yaoyao') ||
    voice.name.includes('Tingting')
  )
  
  if (naturalVoice) {
    utterance.voice = naturalVoice
  }

  // 3. 状态管理 (保留你原有的逻辑)
  utterance.onstart = () => {
    isSpeaking.value = true
    currentSpeechText.value = text
  }
  utterance.onend = () => {
    isSpeaking.value = false
    window.setTimeout(() => {
      if (!isSpeaking.value) currentSpeechText.value = ''
    }, 2000)
  }
  
  window.speechSynthesis.speak(utterance)
}

const toggleDigitalHuman = () => {
  isDigitalHumanActive.value = !isDigitalHumanActive.value
  if (isDigitalHumanActive.value) {
    slideIndex = 1
    speak(lectureNotes[slideIndex] || '准备就绪，开始为您讲解。')
  } else {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
    currentSpeechText.value = ''
  }
}
watch(isSpeaking, (newVal) => {
  if (!dhVideoRef.value) return

  if (newVal) {
    // isSpeaking 为 true 时，播放视频
    dhVideoRef.value.play().catch((err) => {
      console.warn('视频播放失败，可能是浏览器限制:', err)
    })
  } else {
    // isSpeaking 为 false 时，暂停视频
    dhVideoRef.value.pause()
  }
})
</script>
<style scoped>
.ppt-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #f0f2f5;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 2;
}

.title {
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.download-link {
  color: #1677ff;
  text-decoration: none;
  font-size: 14px;
}

.close-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
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

.onlyoffice__wrapper {
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

.menu {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  list-style: none;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 40px;
  padding: 10px 20px;
  margin: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.menu__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 16px;
  cursor: pointer;
  background-color: #f5f5f5;
  color: #333;
  border-radius: 50%;
  user-select: none;
  transition: all 0.2s;
  margin: 0 6px;
}

.menu__item:hover {
  background-color: #e6f7ff;
  color: #1677ff;
  transform: scale(1.1);
}

.dh-btn.active {
  background-color: #1677ff;
  color: #fff;
  box-shadow: 0 0 10px rgba(22, 119, 255, 0.5);
}

.digital-human-layer {
  position: absolute;
  right: 40px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 90;
  pointer-events: none;
  transition: opacity 0.3s ease; 
}
.digital-human-layer:hover {
  opacity: 0.25; 
}
.speech-bubble {
  max-width: 250px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
  backdrop-filter: blur(4px);
  border: 1px solid #eee;
  pointer-events: auto;
  position: relative;
}

.wave-animation {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 8px;
  height: 14px;
}

.wave-animation span {
  display: block;
  width: 3px;
  height: 4px;
  background-color: #1677ff;
  border-radius: 3px;
  animation: wave 1s infinite ease-in-out;
}

.wave-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.wave-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%,
  100% {
    height: 4px;
  }

  50% {
    height: 12px;
  }
}

.avatar-model {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  position: relative;
  border: 4px solid #fff;
  overflow: visible;
  pointer-events: auto;
}

.avatar-model video {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: #000;
}
.is-speaking .glow-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid #1677ff;
  animation: pulse 1.5s infinite;
  z-index: -1;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }

  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
