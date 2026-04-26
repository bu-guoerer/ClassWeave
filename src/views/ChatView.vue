<template>
  <div ref="layoutRef" class="chat-app-layout">
    <SideBar
      :is-open="sidebarOpen"
      :history="historyList"
      :active-id="activeConversationId"
      @toggle="sidebarOpen = !sidebarOpen"
      @new-chat="startNewChat"
      @load-history="handleLoadHistory"
      @delete-history="deleteConversation"
      @pin-history="handlePinHistory"
      @rename-history="handleRenameHistory"
      @mention="handleMention"
      @preview-doc="handlePreviewDoc"
      @quote-lesson="handleQuoteLesson"
    />

    <div class="chat-main-area">
      <div ref="chatListRef" class="chat-messages">
        <div
          v-for="(msg, index) in messages"
          :key="`${msg.type}-${index}`"
          :class="['message', msg.role === 'user' ? 'message-user' : 'message-ai']"
        >
          <div class="message-wrapper">
            <div v-if="msg.role === 'user'" class="user-content-wrapper">
              <div v-if="msg.attachments?.length" class="msg-attachments">
                <div
                  v-for="(att, attIndex) in msg.attachments"
                  :key="attIndex"
                  class="msg-attach-card"
                >
                  <span class="att-icon">{{ att.type === 'audio' ? '🎵' : '📄' }}</span>
                  <div class="att-info">
                    <span class="att-name">{{ att.name }}</span>
                    <span class="att-size">{{
                      att.type === 'audio' ? '音频文件' : '参考文档'
                    }}</span>
                  </div>
                </div>
              </div>
              <div v-if="msg.content" class="text-content">{{ msg.content }}</div>
            </div>

            <ThinkingLogo v-if="msg.role === 'ai'" :is-thinking="msg.isThinking" />

            <div v-if="msg.role === 'ai' && msg.isThinking" class="deep-thinking-container">
              <!-- 头部控制栏 (点击展开/折叠) -->
              <div class="deep-thinking-header" @click="toggleThought(msg)">
                <div class="header-left">
                  <!-- 旋转的原子/思考图标 -->
                  <svg
                    class="thinking-spin-icon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="10 4"
                    />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span class="header-title">深度思考中</span>
                  <span class="header-timer">（用时 {{ msg.elapsedLabel || '1 秒' }}）</span>
                </div>
                <!-- 展开/折叠箭头 -->
                <svg
                  class="header-chevron"
                  :class="{ 'is-collapsed': !msg.isThoughtExpanded }"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              <!-- 内容区：左侧灰线 + 灰色文字 (受 isThoughtExpanded 控制) -->
              <div class="deep-thinking-content" v-show="msg.isThoughtExpanded">
                <div class="typewriter-text">
                  {{ displayedThought }}<span class="typing-cursor"></span>
                </div>
              </div>
            </div>
            <div v-else-if="msg.role === 'ai' && msg.type === 'text'" class="content ai-text">
              {{ msg.content }}
            </div>

            <div v-if="msg.type === 'clarification'" class="content form-card">
              <div v-for="item in msg.items" :key="item.key" class="form-group">
                <div class="clarification-question">
                  <h4>{{ item.question }}</h4>
                  <span v-if="msg.answers[item.key]" class="clarification-picked">已选择</span>
                </div>
                <div class="clarification-options">
                  <button
                    v-for="option in getClarificationOptions(item)"
                    :key="`${item.key}-${option.value}`"
                    type="button"
                    :class="[
                      'clarification-option',
                      { 'is-selected': msg.answers[item.key] === option.value },
                    ]"
                    :disabled="msg.isSubmitted"
                    @click="selectClarificationAnswer(msg, item, option.value)"
                  >
                    <span class="clarification-option__check" aria-hidden="true"></span>
                    <span class="clarification-option__label">{{ option.label }}</span>
                  </button>
                </div>
              </div>
              <div class="clarification-footer">
                <div class="clarification-progress">
                  已完成 {{ getClarificationAnsweredCount(msg) }} / {{ msg.items.length }}
                </div>
                <div class="clarification-progress-bar" aria-hidden="true">
                  <span :style="{ width: `${getClarificationProgress(msg)}%` }"></span>
                </div>
              </div>
              <div class="form-actions">
                <button
                  class="submit-form-btn"
                  :disabled="msg.isSubmitted || isSubmitting || !isClarificationComplete(msg)"
                  @click="submitClarifications(msg)"
                >
                  {{ msg.isSubmitted ? '已提交' : '提交澄清信息' }}
                </button>
              </div>
            </div>

            <div v-if="msg.type === 'outline-review'" class="content form-card outline-review-card">
              <div class="outline-review-head">
                <div>
                  <div class="outline-review-eyebrow">大纲预览</div>
                  <h4>课程结构已整理完成</h4>
                </div>
                <div class="outline-review-count">
                  {{ msg.slideCount || msg.slides?.length || 0 }} 页
                </div>
              </div>

              <div class="outline-summary-row">
                <div class="outline-summary-item">
                  <span class="outline-summary-value">{{
                    msg.slideCount || msg.slides?.length || 0
                  }}</span>
                  <span class="outline-summary-label">页面</span>
                </div>
                <div class="outline-summary-item">
                  <span class="outline-summary-value">{{ getOutlineBulletCount(msg) }}</span>
                  <span class="outline-summary-label">要点</span>
                </div>
                <div class="outline-summary-item">
                  <span class="outline-summary-value">{{
                    getVisibleOutlineSlides(msg).length
                  }}</span>
                  <span class="outline-summary-label">当前展示</span>
                </div>
              </div>

              <div v-if="msg.slides?.length" class="outline-grid">
                <article
                  v-for="slide in getVisibleOutlineSlides(msg)"
                  :key="slide.slideId"
                  class="outline-item"
                >
                  <div class="outline-item-head">
                    <span class="outline-page-badge">P{{ slide.index }}</span>
                    <span class="outline-point-count">{{ slide.bullets?.length || 0 }} 个要点</span>
                  </div>
                  <div class="outline-title">{{ slide.title || `第 ${slide.index} 页` }}</div>
                  <div v-if="slide.bullets?.length" class="outline-bullets">
                    <div
                      v-for="(bullet, bulletIndex) in getOutlinePreviewBullets(slide)"
                      :key="bulletIndex"
                      class="outline-bullet"
                    >
                      {{ bullet }}
                    </div>
                    <div v-if="getHiddenOutlineBulletCount(slide)" class="outline-more-bullets">
                      还有 {{ getHiddenOutlineBulletCount(slide) }} 个要点
                    </div>
                  </div>
                </article>
              </div>

              <div v-else class="outline-empty">暂时没有可展示的大纲内容</div>

              <div v-if="getHiddenOutlineSlideCount(msg)" class="outline-expand-row">
                <button
                  type="button"
                  class="outline-expand-btn"
                  @click="toggleOutlineExpanded(msg)"
                >
                  {{ msg.isOutlineExpanded ? '收起大纲' : `展开全部 ${msg.slides.length} 页` }}
                </button>
              </div>

              <div class="form-actions">
                <button
                  class="submit-form-btn"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="acceptOutline(msg)"
                >
                  {{ msg.isSubmitted ? '处理中...' : '接受大纲' }}
                </button>
              </div>
            </div>

            <div
              v-if="msg.type === 'file'"
              class="content file-card"
              @click="
                openPreview(msg.fileUrl || msg.previewPayload, {
                  sessionId: msg.sessionId,
                  taskId: msg.taskId,
                  fileName: msg.content,
                  previewType: msg.previewType,
                  fileUrl: msg.fileUrl,
                })
              "
            >
              <div :class="['file-cover', `file-cover--${msg.previewType || 'ppt'}`]">
                {{ msg.fileBadge || 'PPT' }}
              </div>
              <div class="file-info">
                <div class="file-name">{{ msg.content }}</div>
                <div class="file-desc">{{ msg.description || '点击查看预览' }}</div>
              </div>
            </div>

            <div v-if="msg.type === 'draft-actions'" class="content form-card">
              <div class="form-group">
                <h4>草稿已就绪</h4>
                <div class="card-tip">
                  可以先预览当前
                  draft。若想改稿，直接在输入框输入修改意见；满意后点击下方按钮导出最终结果。
                </div>
              </div>
              <div class="draft-action-row">
                <button
                  class="secondary-btn"
                  @click="
                    openPreview(msg.downloadUrl || msg.fileUrl || msg.previewPayload, {
                      sessionId: msg.sessionId,
                      taskId: msg.taskId,
                      fileName: 'draft.pptx',
                      fileUrl: msg.downloadUrl || msg.fileUrl,
                    })
                  "
                >
                  预览草稿
                </button>
                <button class="secondary-btn" @click="openExternalLink(msg.downloadUrl)">
                  下载草稿
                </button>
                <button
                  class="submit-form-btn"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="finalizeCurrentSession(msg)"
                >
                  {{ msg.isSubmitted ? '导出中...' : '导出最终结果' }}
                </button>
              </div>
            </div>

            <div v-if="msg.type === 'artifact-links'" class="content form-card">
              <div class="form-group">
                <h4>{{ msg.title || '最终产物' }}</h4>
                <div class="artifact-links">
                  <a
                    v-for="link in msg.links"
                    :key="link.label"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="artifact-link"
                  >
                    {{ link.label }}
                  </a>
                </div>
              </div>
            </div>

            <div v-if="msg.type === 'digital-human-actions'" class="content form-card">
              <div class="form-group">
                <h4>数字人讲解</h4>
                <div class="card-tip">
                  最终结果已经准备好了。如果你还需要数字人讲解，我可以继续帮你生成。先选择是否需要，再补充讲解要求。
                </div>
              </div>

              <div class="choice-row">
                <button
                  :class="['choice-btn', msg.choice === 'yes' ? 'is-active' : '']"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="selectDigitalHumanChoice(msg, 'yes')"
                >
                  需要
                </button>
                <button
                  :class="['choice-btn', msg.choice === 'no' ? 'is-active is-muted' : 'is-muted']"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="selectDigitalHumanChoice(msg, 'no')"
                >
                  先不用
                </button>
              </div>

              <div v-if="msg.choice === 'yes'" class="form-group form-group--compact">
                <div class="card-tip">
                  请补充讲解视频的必要信息，比如讲解对象、语气风格、时长和重点内容。建议直接描述成“数字人讲解视频”，生成效果会更准确。
                </div>
                <textarea
                  v-model="msg.prompt"
                  class="embedded-textarea"
                  :disabled="msg.isSubmitted || isSubmitting"
                  placeholder="例如：请生成一个面向本科生的数字人讲解视频，语气自然亲切，每页控制在 30-40 秒，重点强调应用案例。"
                />
                <div
                  :class="[
                    'card-tip',
                    getDigitalHumanPromptFeedback(msg.prompt).tone === 'success'
                      ? 'card-tip--success'
                      : 'card-tip--warning',
                  ]"
                >
                  {{ getDigitalHumanPromptFeedback(msg.prompt).text }}
                </div>
                <div class="form-actions">
                  <button
                    class="submit-form-btn"
                    :disabled="msg.isSubmitted || isSubmitting || !msg.prompt?.trim()"
                    @click="generateDigitalHuman(msg)"
                  >
                    {{
                      msg.isSubmitted
                        ? '生成中...'
                        : msg.hasGenerated
                        ? '重新生成数字人'
                        : '开始生成数字人'
                    }}
                  </button>
                </div>
              </div>

              <div v-else-if="msg.choice === 'no'" class="card-tip card-tip--quiet">
                好的，当前先不生成数字人讲解。后面如果你想加上这一部分，随时再点“需要”并补充要求就行。
              </div>
            </div>

            <div v-if="msg.suggestions?.length" class="suggestions-list">
              <div
                v-for="(suggestion, suggestionIndex) in msg.suggestions"
                :key="suggestionIndex"
                class="suggestion-item"
                @click="fillSuggestion(suggestion)"
              >
                <span class="sug-text">{{ suggestion }}</span>
                <span class="sug-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div :class="['input-wrapper', { 'is-recording': isListening }]">
          <div class="quoted-box" v-if="quotedLessonData">
            <div class="quote-content">
              <span class="quote-icon">📌</span>
              <span class="quote-text">
                正在基于 <b>{{ quotedLessonData.courseName }}</b> 生成：
                <span style="color: #1677ff">{{ quotedLessonData.lessonTitle }}</span>
              </span>
            </div>
            <button class="close-quote-btn" @click="cancelQuote">×</button>
          </div>
          <div v-if="pendingAttachments.length" class="selected-attachments">
            <div
              v-for="(att, index) in pendingAttachments"
              :key="`${att.name}-${index}`"
              class="att-tag"
            >
              <span>{{ att.type === 'audio' ? '🎵' : '📄' }} {{ att.name }}</span>
              <button class="remove-att" @click="removeAttachment(index)">×</button>
            </div>
          </div>

          <textarea
            v-model="inputText"
            :placeholder="inputPlaceholder"
            @keydown.enter.prevent="handleSend"
          />

          <div
            v-if="isListening || voiceInterimTranscript"
            class="voice-recognition-status"
            aria-live="polite"
          >
            <div class="voice-wave" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="voice-status-text">{{ voiceStatusText }}</span>
            <span v-if="voiceInterimTranscript" class="voice-draft-text">{{
              voiceInterimTranscript
            }}</span>
          </div>

          <div class="input-toolbar">
            <div class="toolbar-left">
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,audio/*"
                style="display: none"
                @change="handleFileSelect"
              />
              <button class="tool-btn" title="文件上传" @click="triggerFileInput">
                <span class="tool-btn__icon" aria-hidden="true">📁</span>
                <span class="tool-btn__label">文件上传</span>
              </button>
              <button
                :class="['tool-btn', 'mic-btn', { 'recording-active': isListening }]"
                :disabled="isRecordingBusy"
                :aria-busy="isRecordingBusy ? 'true' : 'false'"
                :aria-pressed="isListening ? 'true' : 'false'"
                title="语音输入"
                @click="toggleListening"
              >
                <svg class="tool-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v3" />
                  <path d="M8.5 21h7" />
                </svg>
                <span class="tool-btn__label">{{ isListening ? '停止识别' : '语音输入' }}</span>
              </button>
            </div>
            <button class="send-btn" :disabled="sendDisabled" @click="handleSend">发送</button>
          </div>
        </div>
      </div>
    </div>

    <template v-if="showPreviewRegion">
      <div
        class="preview-resizer"
        :class="{ 'is-dragging': isPreviewResizing }"
        title="拖动调整预览宽度"
        @mousedown.prevent="startPreviewResize"
      >
        <span class="preview-resizer__handle"></span>
      </div>

      <div v-if="currentPreviewConfig" class="preview-panel" :style="previewPanelStyle">
        <component
          :is="activePreviewComponent"
          :key="currentPreviewKey"
          :document-config="currentPreviewConfig"
          @close="closePreview"
        />
      </div>

      <div v-else class="preview-panel preview-panel--placeholder" :style="previewPanelStyle">
        <div class="preview-panel__status-card">
          <div class="preview-panel__status-title">
            {{ previewLoading ? '正在打开 PPT 预览' : 'PPT 预览暂时无法打开' }}
          </div>
          <div class="preview-panel__status-text">
            {{
              previewLoading
                ? '正在请求 ONLYOFFICE 预览配置，请稍候...'
                : previewError || '预览配置获取失败，请稍后重试。'
            }}
          </div>
          <div class="preview-panel__status-actions">
            <button v-if="previewError" class="secondary-btn" @click="closePreview">关闭</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SideBar from '@/components/SideBar.vue'
import ThinkingLogo from '@/components/ThinkingLogo.vue'
import PptPreview from '@/components/PptPreview.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import {
  appendPptSessionAssetsApi,
  createPptDigitalHumanApi,
  createPptSessionApi,
  fetchPptArtifactsApi,
  fetchPptDigitalHumanApi,
  fetchPptDraftApi,
  fetchPptOutlineApi,
  fetchPptSessionApi,
  finalizePptApi,
  reviewPptOutlineApi,
  revisePptDraftApi,
  submitPptClarificationsApi,
  uploadPptAttachmentApi,
} from '@/api/ppt'

const router = useRouter()
const route = useRoute()

const POLL_INTERVAL_MS = 2500
const POLL_MAX_TIMES = 180
const DIGITAL_HUMAN_POLL_INTERVAL_MS = 5000
const DIGITAL_HUMAN_POLL_MAX_TIMES = 240
const PREVIEW_BUCKET = 'ppt-files'
const STORAGE_KEY = 'classweave-ppt-chat-history-v2'
const OUTLINE_COLLAPSED_SLIDE_COUNT = 4
const OUTLINE_PREVIEW_BULLET_COUNT = 3
const MIN_PREVIEW_WIDTH = 420
const DEFAULT_PREVIEW_WIDTH = 720
const MIN_CHAT_MAIN_WIDTH = 560
const SIDEBAR_EXPANDED_WIDTH = 280
const SIDEBAR_COLLAPSED_WIDTH = 56
const DIGITAL_HUMAN_INTENT =
  /(数字人|數字人|digital\s*human|讲解视频|講解視頻|口播|数字教师|数字老师|虚拟人|虛擬人|avatar)/i

const layoutRef = ref(null)
const sidebarOpen = ref(true)
const currentPreviewConfig = ref(null)
const currentPreviewType = ref('ppt')
const currentPreviewKey = ref('')
const previewLoading = ref(false)
const previewError = ref('')
const previewWidth = ref(DEFAULT_PREVIEW_WIDTH)
const isPreviewResizing = ref(false)
const inputText = ref('')
const chatListRef = ref(null)
const fileInputRef = ref(null)
const currentSessionId = ref(route.query.sessionId ? String(route.query.sessionId) : '')
const currentSessionSnapshot = ref(null)
const isSubmitting = ref(false)
const messages = ref([createGreetingMessage()])
const pendingAttachments = ref([])
const historyList = ref([])
const activeConversationId = ref('')
const isListening = ref(false)
const isRecordingBusy = ref(false)
const voiceInterimTranscript = ref('')
const voiceStatusText = ref('点击后开始实时识别')

const uploadType = ref('pdf')
let speechRecognition = null
let voiceInputBaseText = ''
let voiceFinalTranscript = ''
let voiceStopRequested = false
const quotedLessonData = ref(null)

// 处理“引用单节课”事件
const handleQuoteLesson = (data) => {
  quotedLessonData.value = data
  inputText.value = '' // 聚焦或清空当前输入
}

const cancelQuote = () => {
  quotedLessonData.value = null
}
const displayedThought = ref('')
let typingInterval = null
const fullThoughtText = `一、审题与核心定位（PPT创作前置思考，先明确方向不跑偏）\n1. 核心主题拆解：“人工智能时代”——不是单纯讲AI技术，而是讲“时代”，需覆盖「过去-现在-未来」，串联技术、应用、影响、挑战，避免沦为纯技术堆砌，要体现“时代变革”的核心逻辑。\n2. 听众画像预判：默认是通用受众（学生/职场人/普通听众），不追求过深的技术原理，重点放在“易懂、有共鸣、有启发”，同时预留少量专业细节，兼顾不同认知水平，避免太浅显无价值、太深奥听不懂。\n3. 汇报核心目标：让听众听懂3件事——① 人工智能时代已经到来，体现在哪里；② 这个时代给我们带来了什么（机遇+挑战）；③ 我们该如何适应这个时代，不被淘汰。\n4. 逻辑闭环设定：必须遵循「认知规律」——从熟悉的场景切入，再讲原理简化版，接着讲应用落地，然后讲问题与应对，最后总结升华，让听众从“知道”到“理解”再到“思考”，形成完整认知链。\n5. 禁忌与侧重点：避免夸大AI能力（不渲染“AI取代人类”的焦虑，也不神化AI的无所不能）；侧重点放在“落地场景”和“个人/社会适配”，弱化复杂算法推导，突出“时代性”而非“技术性”。`
// 处理“预览课程大纲”事件（完美融合现有预览结构）
const handlePreviewDoc = (course) => {
  // 因为现在没有后端真实的文件流，这里给一个占位的虚假 URL
  // 等后端接口写好了，直接把这里的 mockDocUrl 换成 course 里面真实的大纲 url 即可
  const mockDocUrl = 'https://example-domain.com/dummy-outline.docx'

  // 直接调用你现有的 openPreview 核心方法
  // 传入 previewType: 'document' 就会自动使用 DocumentPreview 组件在右侧打开
  openPreview(mockDocUrl, {
    fileName: `${course.name}-完整大纲.docx`,
    previewType: 'document',
  })
}
const uploadedPending = computed(() =>
  pendingAttachments.value.some((item) => item.status === 'uploading')
)
const hasAudioPendingAttachments = computed(() =>
  pendingAttachments.value.some((item) => item.type === 'audio')
)
const currentPhase = computed(() => getSessionPhase(currentSessionSnapshot.value))
const showPreviewRegion = computed(() =>
  Boolean(currentPreviewConfig.value || previewLoading.value || previewError.value)
)
const activePreviewComponent = computed(() =>
  currentPreviewType.value === 'document' ? DocumentPreview : PptPreview
)
const previewPanelStyle = computed(() => ({
  width: `${previewWidth.value}px`,
  minWidth: `${MIN_PREVIEW_WIDTH}px`,
}))
const inputPlaceholder = computed(() => {
  if (isListening.value) return '正在聆听中，请讲话...'
  if (currentPhase.value === 'clarification') return '请先完成上方澄清问题后再继续'
  if (currentPhase.value === 'outline_review')
    return '如需修改大纲，直接输入修改意见；满意可点击“接受大纲”'
  if (currentPhase.value === 'draft_review')
    return '如需改稿，直接输入修改意见；满意可点击“导出最终结果”'
  if (quotedLessonData.value) {
    return '根据这节课概括性大纲生成丰富的单节课教学大纲，制作PPT...'
  }
  return '输入主题，或上传参考资料生成 PPT...'
})
const sendDisabled = computed(() => {
  const hasPrompt = Boolean(inputText.value.trim())
  const hasAttachments = pendingAttachments.value.length > 0

  if (isListening.value || uploadedPending.value || isSubmitting.value || isRecordingBusy.value)
    return true
  if (getAttachmentSendBlockMessage(hasAttachments)) return true
  if (hasAttachments && !hasPrompt && !hasAudioPendingAttachments.value) return true
  if (currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review') {
    return !hasPrompt
  }
  return !hasPrompt && !hasAttachments
})

const progressLabels = ['分析资料', '规划结构', '生成草稿', '导出结果']
const progressTips = [
  '正在持续轮询后端状态，生成完成后会自动切换到下一步。',
  '我会先把结构跑通，再把可预览的文件和操作卡片回填到聊天里。',
  '资料越多，grounding 和整理耗时会越长，这是正常现象。',
  '你现在不用手动刷新，状态变化后这里会自动更新。',
]
const ignoredOutlineKeys = new Set([
  'id',
  'slideId',
  'slide_id',
  'pageId',
  'page_id',
  'index',
  'order',
  'sort',
  'position',
  'type',
  'layout',
  'template',
  'style',
  'score',
  'confidence',
  'metadata',
  'meta',
  'image',
  'images',
  'icon',
  'illustration',
  'speaker_notes',
  'speakerNotes',
])
const sidebarRef = ref(null)
const preferredOutlineFields = [
  'title',
  'heading',
  'subtitle',
  'topic',
  'label',
  'name',
  'text',
  'content',
  'summary',
  'description',
  'desc',
  'point',
  'bullet',
]

function createGreetingMessage() {
  return {
    role: 'ai',
    type: 'text',
    content:
      '你好！我是你的 AI PPT 助手。当前对话会持续承接这次生成流程；如果你想开始一个全新的主题，可以点左侧“新建对话”。',
  }
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value))
}

function isGreetingOnlyConversation(messagesData) {
  if (!Array.isArray(messagesData) || messagesData.length !== 1) return false
  const [message] = messagesData
  const greeting = createGreetingMessage()
  return (
    message?.role === greeting.role &&
    message?.type === greeting.type &&
    cleanText(message?.content) === cleanText(greeting.content)
  )
}

function normalizeConversationRecord(item) {
  const messagesData =
    Array.isArray(item.messagesData) && item.messagesData.length
      ? item.messagesData
      : [createGreetingMessage()]

  if (!isGreetingOnlyConversation(messagesData)) {
    return {
      ...item,
      messagesData,
    }
  }

  return {
    ...item,
    messagesData,
    sessionId: '',
    sessionState: null,
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function unwrapData(payload) {
  return payload?.data ?? payload ?? {}
}

function getPreviewError(error) {
  return error?.response?.data?.message || error?.message || '预览配置获取失败，请稍后重试。'
}

function clampPreviewWidth(nextWidth) {
  const layoutWidth = layoutRef.value?.clientWidth || window.innerWidth
  const sidebarWidth = sidebarOpen.value ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH
  const maxPreviewWidth = Math.max(
    MIN_PREVIEW_WIDTH,
    layoutWidth - sidebarWidth - MIN_CHAT_MAIN_WIDTH
  )
  return Math.min(Math.max(nextWidth, MIN_PREVIEW_WIDTH), maxPreviewWidth)
}

function syncPreviewWidthWithinViewport() {
  previewWidth.value = clampPreviewWidth(previewWidth.value)
}

function handlePreviewResize(event) {
  if (!isPreviewResizing.value) return
  const layoutRect = layoutRef.value?.getBoundingClientRect()
  if (!layoutRect) return
  const nextWidth = layoutRect.right - event.clientX
  previewWidth.value = clampPreviewWidth(nextWidth)
}

function stopPreviewResize() {
  if (!isPreviewResizing.value) return
  isPreviewResizing.value = false
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', handlePreviewResize)
  window.removeEventListener('mouseup', stopPreviewResize)
}

function startPreviewResize(event) {
  if (!showPreviewRegion.value) return
  isPreviewResizing.value = true
  document.body.style.userSelect = 'none'
  handlePreviewResize(event)
  window.addEventListener('mousemove', handlePreviewResize)
  window.addEventListener('mouseup', stopPreviewResize)
}

function normalizeStatus(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase()
  return value === 'awaiting_clarification' ? 'needs_clarification' : value
}

function formatElapsed(ms) {
  const seconds = Math.max(1, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return remain === 0 ? `${minutes} 分钟` : `${minutes} 分 ${remain} 秒`
}

function getCurrentStage(snapshot) {
  return String(snapshot?.currentStage || snapshot?.status || snapshot?.nextAction || '')
    .trim()
    .toLowerCase()
}

function buildProgressSteps(activeIndex) {
  return progressLabels.map((label, index) => ({
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }))
}

function getProgressMeta(snapshot) {
  const stage = getCurrentStage(snapshot)
  if (
    stage.includes('artifact') ||
    stage.includes('final') ||
    stage.includes('export') ||
    stage.includes('package')
  ) {
    return {
      title: '正在导出最终文件',
      subtitle: 'PPT、讲义和其他产物正在打包，完成后会直接展示下载与预览入口。',
      badge: '收尾中',
      stepIndex: 3,
    }
  }
  if (
    stage.includes('draft') ||
    stage.includes('slide') ||
    stage.includes('render') ||
    stage.includes('compose')
  ) {
    return {
      title: '正在生成课件草稿',
      subtitle: '已经进入正文内容生成阶段，接下来会尽快给出可预览的草稿。',
      badge: '写作中',
      stepIndex: 2,
    }
  }
  if (
    stage.includes('outline') ||
    stage.includes('plan') ||
    stage.includes('structure') ||
    stage.includes('storyboard')
  ) {
    return {
      title: '正在规划课件结构',
      subtitle: '后端正在整理章节顺序、重点信息和页面结构，准备输出大纲。',
      badge: '搭结构',
      stepIndex: 1,
    }
  }
  if (
    stage.includes('clarif') ||
    stage.includes('ground') ||
    stage.includes('analysis') ||
    stage.includes('analy') ||
    stage.includes('extract') ||
    stage.includes('material') ||
    stage.includes('parse')
  ) {
    return {
      title: '正在分析资料与需求',
      subtitle: '我在对 PDF、音频和你的要求做 grounding，确保后续生成内容尽量贴合原始资料。',
      badge: '理解中',
      stepIndex: 0,
    }
  }
  return {
    title: '正在整理生成任务',
    subtitle: '任务已经提交成功，正在等待后端进入可展示的处理阶段。',
    badge: '排队中',
    stepIndex: 0,
  }
}

function buildProgressPatch(snapshot, startedAt, round) {
  const meta = getProgressMeta(snapshot)
  return {
    progressTitle: meta.title,
    progressSubtitle: meta.subtitle,
    progressBadge: meta.badge,
    progressSteps: buildProgressSteps(meta.stepIndex),
    elapsedLabel: formatElapsed(Date.now() - startedAt),
    progressTip: progressTips[round % progressTips.length],
  }
}

function normalizeSessionSnapshot(payload) {
  const data = unwrapData(payload)
  return {
    raw: data,
    sessionId: String(
      data.sessionId || data.session_id || data.taskId || data.task_id || data.id || ''
    ),
    status: normalizeStatus(data.status || ''),
    currentStage: data.currentStage || data.current_stage || '',
    nextAction: String(data.nextAction || data.next_action || ''),
    clarificationItems: data.clarificationItems || data.clarification_items || [],
    clarificationQuestions: data.clarificationQuestions || data.clarification_questions || [],
    error: data.error || data.message || '',
  }
}

function getSessionPhase(snapshot) {
  if (!snapshot) return 'idle'
  if (['failed', 'interrupted'].includes(snapshot.status)) return 'failed'
  if (snapshot.status === 'completed') return 'completed'
  if (snapshot.status === 'needs_clarification' || snapshot.nextAction === 'submit_clarifications')
    return 'clarification'
  if (snapshot.status === 'awaiting_outline_review' || snapshot.nextAction === 'review_outline')
    return 'outline_review'
  if (
    snapshot.status === 'awaiting_draft_review' ||
    snapshot.nextAction === 'revise_draft_or_finalize'
  )
    return 'draft_review'
  return 'poll'
}

function sanitizeFileId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '') || `preview${Date.now()}`
}

function uniqueTruthy(values) {
  return [...new Set(values.filter(Boolean))]
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function flattenReadableText(value, depth = 0) {
  if (value == null || depth > 3) return []
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = cleanText(value)
    return text && text !== '[object Object]' ? [text] : []
  }
  if (Array.isArray(value))
    return uniqueTruthy(value.flatMap((item) => flattenReadableText(item, depth + 1)))
  if (typeof value === 'object') {
    const fromPreferred = preferredOutlineFields.flatMap((field) =>
      flattenReadableText(value[field], depth + 1)
    )
    if (fromPreferred.length) return uniqueTruthy(fromPreferred)
    return uniqueTruthy(
      Object.entries(value)
        .filter(([key]) => !ignoredOutlineKeys.has(key))
        .flatMap(([, nested]) => flattenReadableText(nested, depth + 1))
    )
  }
  return []
}

function pickReadableText(value, fallback = '') {
  return flattenReadableText(value)[0] || fallback
}

function deriveObjectKeyFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname
      .split('/')
      .filter(Boolean)
      .map((item) => decodeURIComponent(item))
    const bucketIndex = parts.findIndex((item) => item === PREVIEW_BUCKET)
    if (bucketIndex >= 0) {
      return parts.slice(bucketIndex + 1).join('/') || fallback
    }
  } catch {
    return fallback
  }
  return fallback
}

function deriveStorageInfoFromUrl(url, fallbackBucket = PREVIEW_BUCKET, fallbackObjectKey = '') {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname
      .split('/')
      .filter(Boolean)
      .map((item) => decodeURIComponent(item))
    const knownBucketIndex = parts.findIndex((item) => item === PREVIEW_BUCKET)

    if (knownBucketIndex >= 0 && parts[knownBucketIndex + 1]) {
      return {
        bucketName: parts[knownBucketIndex],
        objectKey: parts.slice(knownBucketIndex + 1).join('/') || fallbackObjectKey,
      }
    }

    if (parts.length >= 2) {
      return {
        bucketName: parts[0],
        objectKey: parts.slice(1).join('/') || fallbackObjectKey,
      }
    }
  } catch {
    return {
      bucketName: fallbackBucket,
      objectKey: fallbackObjectKey,
    }
  }

  return {
    bucketName: fallbackBucket,
    objectKey: fallbackObjectKey,
  }
}

function getFileNameFromUrl(url, fallback) {
  if (!url) return fallback
  try {
    const last = new URL(url).pathname.split('/').pop()
    return last ? decodeURIComponent(last) : fallback
  } catch {
    return fallback
  }
}

function buildDirectPreviewPayload(url, options = {}) {
  if (!url) return null
  const fileName = options.fileName || getFileNameFromUrl(url, 'generated.pptx')
  const fileId = sanitizeFileId(
    options.fileId || `${options.sessionId || 'session'}-${options.phase || 'preview'}`
  )
  const { bucketName, objectKey } = deriveStorageInfoFromUrl(url, PREVIEW_BUCKET, fileName)
  return {
    fileId,
    fileName,
    objectKey: objectKey || fileName,
    creatorId: 'u100',
    userId: 'u100',
    bucketName: bucketName || PREVIEW_BUCKET,
    directDownloadUrl: url,
    mode: 'edit',
    lang: 'zh-CN',
  }
}

function getFileExtension(name) {
  const match = String(name || '')
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

function isDocumentFileName(name) {
  return ['pdf', 'docx'].includes(getFileExtension(name))
}

function getDocumentFileBadge(name) {
  return getFileExtension(name) === 'pdf' ? 'PDF' : 'DOC'
}

function inferPreviewType(source, fileName = '') {
  const sourceName =
    fileName ||
    source?.fileName ||
    source?.file_name ||
    source?.editorConfig?.document?.title ||
    source?.editor_config?.document?.title ||
    (typeof source === 'string' ? getFileNameFromUrl(source, '') : '')

  return isDocumentFileName(sourceName) ? 'document' : 'ppt'
}

function buildDocumentPreviewPayload(url, options = {}) {
  if (!url) return null

  const fileName = options.fileName || getFileNameFromUrl(url, 'document.docx')
  const extension = getFileExtension(fileName)
  const fileId = sanitizeFileId(
    options.fileId || `${options.sessionId || 'session'}-${options.phase || 'document-preview'}`
  )
  const { bucketName, objectKey } = deriveStorageInfoFromUrl(url, PREVIEW_BUCKET, fileName)

  return {
    fileId,
    fileName,
    objectKey: objectKey || fileName,
    creatorId: 'u100',
    userId: 'u100',
    bucketName: bucketName || PREVIEW_BUCKET,
    directDownloadUrl: url,
    mode: extension === 'docx' ? 'edit' : 'view',
    lang: 'zh-CN',
  }
}

function buildSessionPreviewPayload(sessionId, options = {}) {
  return {
    previewSource: 'ppt-session-onlyoffice',
    sessionId,
    taskId: options.taskId || '',
    fileName: options.fileName || 'generated.pptx',
    mode: 'edit',
  }
}

function resolvePreviewPayload(payload, downloadUrl, options = {}) {
  const data = unwrapData(payload)
  const direct =
    data.previewPayload ||
    data.preview_payload ||
    data.onlyofficePayload ||
    data.onlyoffice_payload ||
    data.editorPayload ||
    data.editor_payload ||
    data.onlyoffice ||
    data.preview
  if (direct && typeof direct === 'object') return unwrapData(direct)
  if (data.apiJsUrl && data.editorConfig) return data
  return buildDirectPreviewPayload(downloadUrl, options)
}

function normalizeUploadResult(payload) {
  const data = unwrapData(payload)
  const source = {
    ...payload,
    ...data,
  }
  return {
    uploadId: source.uploadId || source.upload_id || source.id || '',
    assetType: source.assetType || source.asset_type || '',
    role: source.role || '',
    fileName: source.fileName || source.filename || source.original_filename || source.name || '',
  }
}

function buildCreateSessionPayload(prompt, attachments) {
  return {
    user_input: prompt || '请基于上传的资料生成一份教学 PPT。',
    user_assets: attachments.map((item) => ({
      type: item.type === 'audio' ? 'audio' : 'document',
      upload_id: item.uploadId || item.upload_id,
    })),
    pipeline_options: {
      pipeline_id: `front_chat_${Date.now()}`,
      runtime_mode: 'prod-like',
      force_restart: true,
    },
  }
}

function buildAppendAssetsPayload(prompt, attachments) {
  return {
    instructions: prompt || '请把我刚上传的资料补充到当前 PPT 生成流程中，并据此更新内容。',
    user_assets: attachments.map((item) => ({
      type: item.type === 'audio' ? 'audio' : 'document',
      upload_id: item.uploadId || item.upload_id,
    })),
  }
}

function extractClarificationItems(snapshot) {
  if (snapshot.clarificationItems?.length) {
    return snapshot.clarificationItems.map((item, index) => ({
      key: item.field || `question_${index + 1}`,
      field: item.field || '',
      question: item.question || `问题 ${index + 1}`,
      options: normalizeClarificationOptions(item.options || item.choices || item.values || []),
    }))
  }
  return (snapshot.clarificationQuestions || []).map((question, index) => ({
    key: `question_${index + 1}`,
    field: '',
    question,
    options: inferClarificationOptions(question),
  }))
}

function normalizeClarificationOptions(options) {
  const optionList = Array.isArray(options)
    ? options
    : String(options || '')
        .split(/[\/,，、|]/)
        .map((item) => item.trim())
        .filter(Boolean)

  return optionList
    .map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        const value = String(option).trim()
        return value ? { label: value, value } : null
      }
      const label = String(
        option?.label || option?.name || option?.text || option?.title || option?.value || ''
      ).trim()
      const value = String(option?.value || option?.key || option?.id || label).trim()
      return label && value ? { label, value } : null
    })
    .filter(Boolean)
}

function inferClarificationOptions(question) {
  const text = String(question || '')
  if (/谁|受众|对象|用户|学生|audience/i.test(text)) {
    return normalizeClarificationOptions(['本科生', '研究生', '中小学', '普通大众'])
  }
  if (/多久|时长|时间|分钟|duration/i.test(text)) {
    return normalizeClarificationOptions(['15分钟', '30分钟', '45分钟', '60分钟'])
  }
  if (/教学|方式|风格|讲解|method|style/i.test(text)) {
    return normalizeClarificationOptions(['概念讲解', '原理推导', '案例驱动', '练习工作坊'])
  }
  if (/难度|基础|level|difficulty/i.test(text)) {
    return normalizeClarificationOptions(['零基础入门', '基础巩固', '进阶理解', '专业深入'])
  }
  return normalizeClarificationOptions(['采用推荐设置'])
}

function getClarificationOptions(item) {
  const normalizedOptions = normalizeClarificationOptions(item.options || [])
  return normalizedOptions.length ? normalizedOptions : inferClarificationOptions(item.question)
}

function selectClarificationAnswer(actionMessage, item, value) {
  if (actionMessage.isSubmitted) return
  actionMessage.answers[item.key] = value
}

function getClarificationAnsweredCount(actionMessage) {
  return actionMessage.items.filter((item) => String(actionMessage.answers[item.key] || '').trim())
    .length
}

function getClarificationProgress(actionMessage) {
  if (!actionMessage.items.length) return 0
  return Math.round(
    (getClarificationAnsweredCount(actionMessage) / actionMessage.items.length) * 100
  )
}

function isClarificationComplete(actionMessage) {
  return getClarificationAnsweredCount(actionMessage) === actionMessage.items.length
}

function extractOutline(payload) {
  const data = unwrapData(payload)
  const preview = data.outline_preview || data.outlinePreview || {}
  const slides = (preview.slides || data.slides || []).map((slide, index) => {
    const title =
      pickReadableText(slide.title || slide.heading || slide.topic || slide.name, '') ||
      `第 ${index + 1} 页`
    const bullets = uniqueTruthy(
      [
        slide.bullets,
        slide.points,
        slide.key_points,
        slide.keyPoints,
        slide.summary,
        slide.content,
        slide.outline,
      ]
        .flatMap((item) => flattenReadableText(item))
        .filter((item) => item !== title)
    ).slice(0, 6)
    return {
      index: index + 1,
      slideId: slide.slide_id || slide.slideId || `slide_${index + 1}`,
      title,
      bullets,
    }
  })
  return {
    slideCount: preview.slide_count || preview.slideCount || slides.length,
    slides,
  }
}

function extractDraft(payload, sessionId) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.minio_download_urls || {}
  const downloadUrl =
    data.downloadUrl ||
    data.minio_download_url ||
    downloadUrls.draft_pptx ||
    downloadUrls.pptx ||
    ''
  const fileName = getFileNameFromUrl(downloadUrl, 'draft.pptx')
  const displayName = buildDisplayFileName(fileName, 'draft')
  const previewPayload =
    resolvePreviewPayload(payload, downloadUrl, { sessionId, phase: 'draft', fileName }) ||
    (sessionId
      ? buildSessionPreviewPayload(sessionId, {
          fileName,
          taskId: data.taskId || data.task_id || '',
        })
      : null)
  return {
    downloadUrl,
    fileName,
    displayName,
    taskId: String(data.taskId || data.task_id || ''),
    previewPayload,
  }
}

function getVisibleOutlineSlides(actionMessage) {
  const slides = Array.isArray(actionMessage?.slides) ? actionMessage.slides : []
  if (actionMessage?.isOutlineExpanded) return slides
  return slides.slice(0, OUTLINE_COLLAPSED_SLIDE_COUNT)
}

function getOutlinePreviewBullets(slide) {
  const bullets = Array.isArray(slide?.bullets) ? slide.bullets : []
  return bullets.slice(0, OUTLINE_PREVIEW_BULLET_COUNT)
}

function getHiddenOutlineSlideCount(actionMessage) {
  const slides = Array.isArray(actionMessage?.slides) ? actionMessage.slides : []
  return actionMessage?.isOutlineExpanded
    ? 0
    : Math.max(0, slides.length - OUTLINE_COLLAPSED_SLIDE_COUNT)
}

function getHiddenOutlineBulletCount(slide) {
  const bullets = Array.isArray(slide?.bullets) ? slide.bullets : []
  return Math.max(0, bullets.length - OUTLINE_PREVIEW_BULLET_COUNT)
}

function getOutlineBulletCount(actionMessage) {
  const slides = Array.isArray(actionMessage?.slides) ? actionMessage.slides : []
  return slides.reduce(
    (sum, slide) => sum + (Array.isArray(slide?.bullets) ? slide.bullets.length : 0),
    0
  )
}

function toggleOutlineExpanded(actionMessage) {
  actionMessage.isOutlineExpanded = !actionMessage.isOutlineExpanded
}

function buildDisplayFileName(fileName, kind = 'ppt') {
  const extension = getFileExtension(fileName) || (kind === 'teaching-plan' ? 'docx' : 'pptx')
  const nameMap = {
    draft: '课程PPT草稿',
    final: '课程PPT最终版',
    'teaching-plan': extension === 'pdf' ? '教学方案' : '教学方案',
    ppt: '课程PPT',
  }
  return `${nameMap[kind] || nameMap.ppt}.${extension}`
}

function extractArtifacts(payload, sessionId) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.minio_download_urls || {}
  const pptxUrl = downloadUrls.pptx || ''
  const fileName = getFileNameFromUrl(pptxUrl, 'final.pptx')
  const displayName = buildDisplayFileName(fileName, 'final')
  const previewPayload =
    resolvePreviewPayload(payload, pptxUrl, { sessionId, phase: 'final', fileName }) ||
    (sessionId
      ? buildSessionPreviewPayload(sessionId, {
          fileName,
          taskId: data.taskId || data.task_id || '',
        })
      : null)
  const documentUrl =
    downloadUrls.teaching_plan_docx ||
    downloadUrls.docx ||
    downloadUrls.teaching_plan_pdf ||
    downloadUrls.pdf ||
    ''
  const documentFileName = getFileNameFromUrl(
    documentUrl,
    downloadUrls.teaching_plan_pdf ? 'teaching-plan.pdf' : 'teaching-plan.docx'
  )
  const documentDisplayName = buildDisplayFileName(documentFileName, 'teaching-plan')
  return {
    downloadUrls,
    pptxUrl,
    taskId: String(data.taskId || data.task_id || ''),
    previewPayload,
    fileName,
    displayName,
    documentArtifact:
      documentUrl && isDocumentFileName(documentFileName)
        ? {
            fileName: documentFileName,
            displayName: documentDisplayName,
            fileUrl: documentUrl,
            previewPayload: buildDocumentPreviewPayload(documentUrl, {
              sessionId,
              phase: 'final-doc',
              fileName: documentFileName,
            }),
            previewType: 'document',
            fileBadge: getDocumentFileBadge(documentFileName),
            description: '最终文档已生成完成，点击查看',
          }
        : null,
  }
}

function extractArtifactLinks(downloadUrls) {
  return [
    ['PPT 下载', downloadUrls.pptx],
    ['Draft 下载', downloadUrls.draft_pptx],
    ['教案下载', downloadUrls.teaching_plan_docx],
    ['H5 入口', downloadUrls.h5_entry_html],
    ['H5 压缩包', downloadUrls.h5_package_zip],
    ['全量打包', downloadUrls.package_zip],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({ label, url }))
}

function isDigitalHumanIntent(value) {
  return DIGITAL_HUMAN_INTENT.test(String(value || ''))
}

function getDigitalHumanPromptFeedback(value) {
  const prompt = String(value || '').trim()
  if (!prompt) {
    return {
      tone: 'warning',
      text: '信息不全：请补充讲解视频的具体要求，比如面向谁讲、语气风格、预计时长和重点内容。',
    }
  }

  if (!/数字人/.test(prompt)) {
    return {
      tone: 'warning',
      text: '信息不全：请把需求描述得更完整一些，比如“生成数字人讲解视频”，并补充讲解对象、风格或时长。',
    }
  }

  return {
    tone: 'success',
    text: '信息已齐全，可以开始生成。建议继续补充讲解对象、语气风格、时长和重点内容，让成片更贴合预期。',
  }
}

function validateDigitalHumanPrompt(value) {
  const feedback = getDigitalHumanPromptFeedback(value)
  return {
    valid: feedback.tone === 'success',
    message: feedback.tone === 'success' ? '' : feedback.text,
  }
}

function hasExplicitDigitalHumanInstructions(value) {
  return validateDigitalHumanPrompt(value).valid
}

function normalizeDigitalHumanResult(payload) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.download_urls || data.urls || {}
  const videoUrl =
    data.videoUrl ||
    data.video_url ||
    data.resultUrl ||
    data.result_url ||
    downloadUrls.video ||
    downloadUrls.mp4 ||
    downloadUrls.digital_human_video ||
    downloadUrls.digital_human_mp4 ||
    ''
  return {
    raw: data,
    status: normalizeStatus(data.status || data.state || data.resultStatus || data.stage || ''),
    message: data.message || data.statusMessage || data.status_message || '',
    taskId: String(data.taskId || data.task_id || data.id || ''),
    videoUrl,
    downloadUrls: {
      ...downloadUrls,
      ...(videoUrl ? { video: videoUrl } : {}),
    },
  }
}

function shouldContinuePollingDigitalHuman(result) {
  if (!result || result.videoUrl) return false
  if (['failed', 'error', 'cancelled', 'canceled'].includes(result.status)) return false
  return (
    !result.status ||
    ['pending', 'queued', 'running', 'processing', 'in_progress', 'submitted', 'created'].includes(
      result.status
    )
  )
}

async function waitForDigitalHumanResult(sessionId, initialPayload) {
  let result = normalizeDigitalHumanResult(
    initialPayload || (await fetchPptDigitalHumanApi(sessionId))
  )
  if (!shouldContinuePollingDigitalHuman(result)) return result
  for (let round = 0; round < DIGITAL_HUMAN_POLL_MAX_TIMES; round += 1) {
    await wait(DIGITAL_HUMAN_POLL_INTERVAL_MS)
    result = normalizeDigitalHumanResult(await fetchPptDigitalHumanApi(sessionId))
    if (!shouldContinuePollingDigitalHuman(result)) return result
  }
  throw new Error('数字人生成超时，请稍后重试')
}

function extractDigitalHumanLinks(downloadUrls) {
  return [
    ['数字人视频', downloadUrls.video || downloadUrls.mp4 || downloadUrls.digital_human_video],
    ['字幕文件', downloadUrls.subtitle || downloadUrls.srt],
    ['讲解脚本', downloadUrls.script || downloadUrls.script_docx || downloadUrls.docx],
    [
      '在线播放',
      downloadUrls.preview || downloadUrls.play_url || downloadUrls.hls || downloadUrls.m3u8,
    ],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({ label, url }))
}

function finishThinkingMessage(index, content) {
  if (typingInterval) clearInterval(typingInterval) // 👈 新增：结束时清理定时器
  if (!messages.value[index]) return
  messages.value[index].isThinking = false
  messages.value[index].type = 'text'
  messages.value[index].content = content
}

function patchMessage(index, patch) {
  if (!messages.value[index]) return
  Object.assign(messages.value[index], patch)
}

function toggleThought(msg) {
  msg.isThoughtExpanded = !msg.isThoughtExpanded
}
function appendThinkingMessage() {
  const index = messages.value.length
  messages.value.push({
    role: 'ai',
    type: 'text',
    isThinking: true,
    isThoughtExpanded: true, // 👈 新增：默认让思考框处于展开状态
    content: '',
    progressTitle: '正在整理生成任务',
    progressSubtitle: '我会持续轮询后端状态，并把每一步的结果自动展示在聊天里。',
    progressBadge: '启动中',
    progressSteps: buildProgressSteps(0),
    elapsedLabel: '不到 1 秒',
    progressTip: progressTips[0],
  })
  displayedThought.value = ''
  if (typingInterval) clearInterval(typingInterval)
  let charIndex = 0
  typingInterval = setInterval(() => {
    if (charIndex < fullThoughtText.length) {
      displayedThought.value += fullThoughtText[charIndex]
      charIndex++
      // 每吐出 5 个字稍微向下滚动一下，防止文字超过屏幕
      if (charIndex % 5 === 0) scrollToBottom()
    } else {
      clearInterval(typingInterval)
    }
  }, 25) // 👈 25代表每秒吐出约40个字，你可以改这个数字调节快慢
  // 👆 新增结束 👆
  scrollToBottom()
  return index
}

function markSessionCardsSubmitted(sessionId) {
  messages.value.forEach((message) => {
    if (
      message.sessionId === sessionId &&
      ['clarification', 'outline-review', 'draft-actions'].includes(message.type)
    ) {
      message.isSubmitted = true
    }
  })
}

function ensureDigitalHumanActionCard(sessionId) {
  const existing = messages.value.find(
    (message) => message.type === 'digital-human-actions' && message.sessionId === sessionId
  )
  if (existing) return existing

  const actionMessage = {
    role: 'ai',
    type: 'digital-human-actions',
    sessionId,
    isSubmitted: false,
    hasGenerated: false,
    choice: '',
    prompt: '',
  }
  messages.value.push(actionMessage)
  return actionMessage
}

async function pollSessionUntilActionable(sessionId, initialPayload, onProgress) {
  const startedAt = Date.now()
  let snapshot = normalizeSessionSnapshot(initialPayload || (await fetchPptSessionApi(sessionId)))
  onProgress?.(snapshot, 0, startedAt)
  for (let round = 0; round < POLL_MAX_TIMES; round += 1) {
    if (getSessionPhase(snapshot) !== 'poll') return snapshot
    await wait(POLL_INTERVAL_MS)
    snapshot = normalizeSessionSnapshot(await fetchPptSessionApi(sessionId))
    onProgress?.(snapshot, round + 1, startedAt)
  }
  throw new Error('PPT generation timed out')
}

function updateCurrentSession(snapshot) {
  currentSessionSnapshot.value = snapshot
  if (snapshot?.sessionId) {
    currentSessionId.value = snapshot.sessionId
  }
}

async function presentSessionState(snapshot, thinkingIndex) {
  updateCurrentSession(snapshot)
  markSessionCardsSubmitted(snapshot.sessionId)

  const phase = getSessionPhase(snapshot)
  if (phase === 'clarification') {
    finishThinkingMessage(thinkingIndex, '我还需要一些补充信息，填完下面的问题后我就继续生成。')
    const items = extractClarificationItems(snapshot)
    messages.value.push({
      role: 'ai',
      type: 'clarification',
      sessionId: snapshot.sessionId,
      items,
      answers: Object.fromEntries(items.map((item) => [item.key, ''])),
      isSubmitted: false,
    })
    scrollToBottom()
    return
  }

  if (phase === 'outline_review') {
    const outline = extractOutline(await fetchPptOutlineApi(snapshot.sessionId))
    finishThinkingMessage(
      thinkingIndex,
      '大纲已经生成好了。你可以先看大纲，满意后继续生成；如果想改，直接在输入框告诉我。'
    )
    messages.value.push({
      role: 'ai',
      type: 'outline-review',
      sessionId: snapshot.sessionId,
      slideCount: outline.slideCount,
      slides: outline.slides,
      isOutlineExpanded: false,
      isSubmitted: false,
    })
    scrollToBottom()
    return
  }

  if (phase === 'draft_review') {
    const draft = extractDraft(await fetchPptDraftApi(snapshot.sessionId), snapshot.sessionId)
    if (!draft.downloadUrl || !draft.previewPayload) {
      throw new Error('草稿预览地址缺失')
    }
    finishThinkingMessage(
      thinkingIndex,
      '草稿已经生成好了，可以先预览；如果想改，直接在输入框告诉我，满意后点“导出最终结果”。'
    )
    messages.value.push({
      role: 'ai',
      type: 'file',
      sessionId: snapshot.sessionId,
      taskId: draft.taskId,
      content: draft.displayName,
      description: '当前 draft 已可预览，点击查看',
      previewPayload: draft.previewPayload,
      fileUrl: draft.downloadUrl,
      suggestions: ['减少公式页，增加应用案例', '整体风格改成更适合课堂授课的简洁版'],
    })
    messages.value.push({
      role: 'ai',
      type: 'draft-actions',
      sessionId: snapshot.sessionId,
      taskId: draft.taskId,
      previewPayload: draft.previewPayload,
      downloadUrl: draft.downloadUrl,
      isSubmitted: false,
    })
    scrollToBottom()
    return
  }

  if (phase === 'completed') {
    const artifacts = extractArtifacts(
      await fetchPptArtifactsApi(snapshot.sessionId),
      snapshot.sessionId
    )
    finishThinkingMessage(thinkingIndex, '最终结果已导出完成，可以预览或下载。')
    if (artifacts.pptxUrl && artifacts.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        taskId: artifacts.taskId,
        content: artifacts.displayName,
        description: '最终 PPT 已生成完成，点击查看',
        previewPayload: artifacts.previewPayload,
        fileUrl: artifacts.pptxUrl,
        previewType: 'ppt',
        fileBadge: 'PPT',
      })
    }
    if (artifacts.documentArtifact?.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        content: artifacts.documentArtifact.displayName,
        description: artifacts.documentArtifact.description,
        previewPayload: artifacts.documentArtifact.previewPayload,
        fileUrl: artifacts.documentArtifact.fileUrl,
        previewType: artifacts.documentArtifact.previewType,
        fileBadge: artifacts.documentArtifact.fileBadge,
      })
    }
    const links = extractArtifactLinks(artifacts.downloadUrls)
    if (links.length) {
      messages.value.push({
        role: 'ai',
        type: 'artifact-links',
        links,
      })
    }
    ensureDigitalHumanActionCard(snapshot.sessionId)
    scrollToBottom()
    return
  }

  if (phase === 'failed') {
    throw new Error(snapshot.error || '生成失败，请稍后重试')
  }

  finishThinkingMessage(thinkingIndex, '当前生成状态已更新。')
}

async function createSessionFromPrompt(prompt, attachments) {
  const thinkingIndex = appendThinkingMessage()
  await new Promise((resolve) => setTimeout(resolve, 15000))
  try {
    const response = await createPptSessionApi(buildCreateSessionPayload(prompt, attachments))
    const snapshot = normalizeSessionSnapshot(response)
    if (!snapshot.sessionId) {
      throw new Error('创建任务失败：未返回有效标识')
    }
    const finalSnapshot = await pollSessionUntilActionable(
      snapshot.sessionId,
      response,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(finalSnapshot, thinkingIndex)
  } catch (error) {
    finishThinkingMessage(thinkingIndex, error?.message || '生成失败，请稍后重试。')
    ElMessage.error(error?.message || '生成失败，请稍后重试')
  }
}

async function appendAssetsToCurrentSession(prompt, attachments) {
  if (!currentSessionId.value) return
  const thinkingIndex = appendThinkingMessage()
  try {
    const response = await appendPptSessionAssetsApi(
      currentSessionId.value,
      buildAppendAssetsPayload(prompt, attachments)
    )
    const finalSnapshot = await pollSessionUntilActionable(
      currentSessionId.value,
      response,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(finalSnapshot, thinkingIndex)
  } catch (error) {
    finishThinkingMessage(thinkingIndex, error?.message || '补充资料失败，请稍后重试。')
    ElMessage.error(error?.message || '补充资料失败，请稍后重试')
  }
}

async function submitClarifications(actionMessage) {
  if (isSubmitting.value || !actionMessage.sessionId) return
  const completedAnswers = actionMessage.items
    .map((item) => ({
      ...item,
      answer: String(actionMessage.answers[item.key] || '').trim(),
    }))
    .filter((item) => item.answer)
  if (!completedAnswers.length || completedAnswers.length !== actionMessage.items.length) {
    ElMessage.warning('请先补全所有澄清问题')
    return
  }
  const payload = completedAnswers.every((item) => item.field)
    ? { answers: Object.fromEntries(completedAnswers.map((item) => [item.field, item.answer])) }
    : {
        answers: completedAnswers.map((item) => ({ question: item.question, answer: item.answer })),
      }

  actionMessage.isSubmitted = true
  isSubmitting.value = true
  messages.value.push({
    role: 'user',
    type: 'text',
    content: completedAnswers.map((item) => `${item.question}：${item.answer}`).join('\n'),
  })
  scrollToBottom()

  const thinkingIndex = appendThinkingMessage()
  try {
    await submitPptClarificationsApi(actionMessage.sessionId, payload)
    const snapshot = await pollSessionUntilActionable(
      actionMessage.sessionId,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    finishThinkingMessage(thinkingIndex, error?.message || '提交澄清信息失败。')
    ElMessage.error(error?.message || '提交澄清信息失败')
  } finally {
    isSubmitting.value = false
  }
}

async function acceptOutline(actionMessage) {
  if (isSubmitting.value || !actionMessage.sessionId) return
  actionMessage.isSubmitted = true
  isSubmitting.value = true
  messages.value.push({ role: 'user', type: 'text', content: '确认大纲并继续生成' })
  scrollToBottom()

  const thinkingIndex = appendThinkingMessage()
  try {
    await reviewPptOutlineApi(actionMessage.sessionId, { action: 'accept' })
    const snapshot = await pollSessionUntilActionable(
      actionMessage.sessionId,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    finishThinkingMessage(thinkingIndex, error?.message || '确认大纲失败。')
    ElMessage.error(error?.message || '确认大纲失败')
  } finally {
    isSubmitting.value = false
  }
}

async function reviseOutline(instructions) {
  if (!currentSessionId.value) return
  const thinkingIndex = appendThinkingMessage()
  try {
    await reviewPptOutlineApi(currentSessionId.value, { action: 'revise', instructions })
    const snapshot = await pollSessionUntilActionable(
      currentSessionId.value,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    finishThinkingMessage(thinkingIndex, error?.message || '修改大纲失败。')
    ElMessage.error(error?.message || '修改大纲失败')
  }
}

async function reviseDraft(instructions) {
  if (!currentSessionId.value) return
  const thinkingIndex = appendThinkingMessage()
  try {
    await revisePptDraftApi(currentSessionId.value, { instructions })
    const snapshot = await pollSessionUntilActionable(
      currentSessionId.value,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    finishThinkingMessage(thinkingIndex, error?.message || '改稿失败。')
    ElMessage.error(error?.message || '改稿失败')
  }
}

async function finalizeCurrentSession(actionMessage) {
  if (isSubmitting.value || !actionMessage.sessionId) return
  actionMessage.isSubmitted = true
  isSubmitting.value = true
  messages.value.push({ role: 'user', type: 'text', content: '导出最终结果' })
  scrollToBottom()

  const thinkingIndex = appendThinkingMessage()
  try {
    await finalizePptApi(actionMessage.sessionId)
    const snapshot = await pollSessionUntilActionable(
      actionMessage.sessionId,
      undefined,
      (current, round, startedAt) => {
        patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
      }
    )
    await presentSessionState(snapshot, thinkingIndex)
  } catch (error) {
    actionMessage.isSubmitted = false
    finishThinkingMessage(thinkingIndex, error?.message || '导出最终结果失败。')
    ElMessage.error(error?.message || '导出最终结果失败')
  } finally {
    isSubmitting.value = false
  }
}

async function triggerDigitalHumanGeneration(instructions = '', options = {}) {
  const sessionId = options.sessionId || currentSessionId.value || ''
  if (!sessionId) {
    ElMessage.warning('当前还没有可继续使用的 PPT 内容，请先完成一次 PPT 生成')
    return
  }

  const prompt = String(instructions || '').trim()
  const validation = validateDigitalHumanPrompt(prompt)
  if (!validation.valid) {
    ElMessage.warning(validation.message)
    return
  }

  if (options.actionMessage) {
    options.actionMessage.isSubmitted = true
  }

  const thinkingIndex = appendThinkingMessage()
  patchMessage(thinkingIndex, {
    progressTitle: '正在生成数字人',
    progressSubtitle: '我会基于当前已经完成的 PPT 继续生成数字人讲解，不会开启新的生成流程。',
    progressBadge: '处理中',
    progressSteps: [
      { label: '提交任务', state: 'active' },
      { label: '等待结果', state: 'pending' },
      { label: '整理产物', state: 'pending' },
      { label: '返回下载', state: 'pending' },
    ],
    progressTip: '如果接口支持异步处理，这里会自动轮询数字人任务状态。',
  })

  try {
    const payload = {
      trigger_prompt: prompt,
      instructions: prompt,
      prompt,
    }
    const submitResult = await createPptDigitalHumanApi(sessionId, payload)
    patchMessage(thinkingIndex, {
      progressSteps: [
        { label: '提交任务', state: 'done' },
        { label: '等待结果', state: 'active' },
        { label: '整理产物', state: 'pending' },
        { label: '返回下载', state: 'pending' },
      ],
    })
    const result = await waitForDigitalHumanResult(sessionId, submitResult)
    if (['failed', 'error', 'cancelled', 'canceled'].includes(result.status)) {
      throw new Error(result.message || '数字人生成失败，请稍后重试')
    }
    finishThinkingMessage(
      thinkingIndex,
      result.message || '数字人任务已完成，我已经把可下载的产物整理到聊天里了。'
    )
    const links = extractDigitalHumanLinks(result.downloadUrls)
    if (links.length) {
      messages.value.push({
        role: 'ai',
        type: 'artifact-links',
        title: '数字人产物',
        links,
      })
    }
    if (options.actionMessage) {
      options.actionMessage.hasGenerated = true
    }
  } catch (error) {
    finishThinkingMessage(thinkingIndex, error?.message || '数字人生成失败，请稍后重试')
    ElMessage.error(error?.message || '数字人生成失败，请稍后重试')
  } finally {
    if (options.actionMessage) {
      options.actionMessage.isSubmitted = false
    }
    scrollToBottom()
  }
}

function selectDigitalHumanChoice(actionMessage, choice) {
  actionMessage.choice = choice
  if (choice === 'no') {
    actionMessage.prompt = ''
  }
}

async function generateDigitalHuman(actionMessage) {
  const prompt = String(actionMessage?.prompt || '').trim()
  const validation = validateDigitalHumanPrompt(prompt)
  if (!validation.valid) {
    ElMessage.warning(validation.message)
    return
  }
  await triggerDigitalHumanGeneration(prompt, {
    sessionId: actionMessage?.sessionId,
    actionMessage,
  })
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function resolveAttachmentType(file) {
  const mimeType = String(file?.type || '').toLowerCase()
  const fileName = String(file?.name || '').toLowerCase()
  if (mimeType.startsWith('audio/') || /\.(wav|mp3|m4a|aac|ogg|webm)$/i.test(fileName)) {
    return 'audio'
  }
  return 'document'
}

function updatePendingAttachment(localId, updates) {
  pendingAttachments.value = pendingAttachments.value.map((item) =>
    item.localId === localId ? { ...item, ...updates } : item
  )
}

function removePendingAttachment(localId) {
  pendingAttachments.value = pendingAttachments.value.filter((item) => item.localId !== localId)
}

function getAttachmentSendBlockMessage(hasAttachments = pendingAttachments.value.length > 0) {
  if (!hasAttachments) return ''
  if (currentPhase.value === 'poll') {
    return 'The current session is still processing. Your audio attachment has been kept for later.'
  }
  if (currentPhase.value === 'clarification') {
    return 'Please finish the clarification questions first. Your audio attachment has been kept for later.'
  }
  if (currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review') {
    return 'This review step only accepts text instructions. Your audio attachment has been kept for later.'
  }
  return ''
}

async function uploadPendingAttachment(file, attachmentType = resolveAttachmentType(file)) {
  const localId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const attachment = {
    localId,
    type: attachmentType === 'audio' ? 'audio' : 'document',
    name: file.name,
    size: file.size,
    status: 'uploading',
    uploadId: '',
  }
  pendingAttachments.value.push(attachment)

  try {
    const response = await uploadPptAttachmentApi(file, {
      asset_type: attachmentType === 'audio' ? 'audio' : 'document',
    })
    const result = normalizeUploadResult(response)
    if (!result.uploadId) {
      throw new Error('Upload succeeded but upload_id is missing')
    }
    updatePendingAttachment(localId, {
      status: 'done',
      uploadId: result.uploadId,
      name: result.fileName || attachment.name,
      assetType: result.assetType,
      role: result.role,
    })
    ElMessage.success('Attachment uploaded successfully')
  } catch (error) {
    removePendingAttachment(localId)
    ElMessage.error(error?.message || 'Attachment upload failed')
    throw error
  }
}

async function handleFileSelect(event) {
  const input = event.target
  if (!input.files?.length) return
  const file = input.files[0]

  try {
    await uploadPendingAttachment(file)
  } catch (error) {
  } finally {
    input.value = ''
  }
}
function removeAttachment(index) {
  pendingAttachments.value.splice(index, 1)
}

function scrollToBottom() {
  nextTick(() => {
    if (chatListRef.value) {
      chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
  })
}

async function handleSend(options = {}) {
  const allowDuringRecordingBusy = Boolean(options?.allowDuringRecordingBusy)

  if (currentSessionId.value && isGreetingOnlyConversation(messages.value)) {
    currentSessionId.value = ''
    currentSessionSnapshot.value = null
  }

  const prompt = inputText.value.trim()
  const hasAttachments = pendingAttachments.value.length > 0
  const hasAudioAttachments = pendingAttachments.value.some((item) => item.type === 'audio')
  const hasMissingUploadId = pendingAttachments.value.some(
    (item) => !(item.uploadId || item.upload_id)
  )

  if (!prompt && !hasAttachments) return

  if (isListening.value) {
    ElMessage.warning('请先停止语音识别，再发送。')
    return
  }

  if (isRecordingBusy.value && !allowDuringRecordingBusy) {
    ElMessage.warning('语音识别正在启动，请稍等片刻。')
    return
  }

  if (uploadedPending.value) {
    ElMessage.warning('Attachments are still uploading. Please wait before sending.')
    return
  }

  const attachmentSendBlockMessage = getAttachmentSendBlockMessage(hasAttachments)
  if (attachmentSendBlockMessage) {
    ElMessage.warning(attachmentSendBlockMessage)
    return
  }

  if (hasAttachments && !prompt && !hasAudioAttachments) {
    ElMessage.warning('Please enter text first, then send it together with the uploaded files.')
    return
  }

  if (currentSessionId.value && hasAttachments) {
    if (hasMissingUploadId) {
      ElMessage.warning('Attachment is missing upload_id. Please re-upload and try again.')
      return
    }
    if (currentPhase.value === 'poll') {
      ElMessage.warning(
        'The current session is still processing. Please wait before sending more files.'
      )
      return
    }

    const attachments = [...pendingAttachments.value]
    messages.value.push({
      role: 'user',
      type: 'text',
      content:
        prompt ||
        (hasAudioAttachments
          ? 'Please use my uploaded audio instructions in the current session.'
          : 'Please add the uploaded files to the current session and use them in follow-up processing.'),
      attachments,
    })
    inputText.value = ''
    quotedLessonData.value = null
    pendingAttachments.value = []
    scrollToBottom()
    await appendAssetsToCurrentSession(prompt, attachments)
    return
  }

  if (currentPhase.value === 'clarification') {
    ElMessage.warning('Please finish the clarification questions first.')
    return
  }

  if (
    currentPhase.value !== 'outline_review' &&
    currentPhase.value !== 'draft_review' &&
    !prompt &&
    !hasAttachments
  ) {
    ElMessage.warning('Please enter a prompt or upload reference files first.')
    return
  }

  if (hasMissingUploadId) {
    ElMessage.warning('Attachment is missing upload_id. Please re-upload and try again.')
    return
  }

  if (currentSessionId.value && currentPhase.value === 'poll') {
    ElMessage.warning(
      'The current session is still processing. Please wait for it to finish first.'
    )
    return
  }

  if (
    currentPhase.value === 'completed' &&
    currentSessionId.value &&
    !hasAttachments &&
    isDigitalHumanIntent(prompt)
  ) {
    const validation = validateDigitalHumanPrompt(prompt)
    if (!validation.valid) {
      const actionMessage = ensureDigitalHumanActionCard(currentSessionId.value)
      if (actionMessage) {
        actionMessage.choice = 'yes'
        if (!actionMessage.prompt?.trim()) {
          actionMessage.prompt = prompt
        }
      }
      scrollToBottom()
      ElMessage.warning(validation.message)
      return
    }
    messages.value.push({ role: 'user', type: 'text', content: prompt, attachments: [] })
    inputText.value = ''
    scrollToBottom()
    await triggerDigitalHumanGeneration(prompt, { sessionId: currentSessionId.value })
    return
  }

  if (currentSessionId.value && ['idle', 'completed', 'failed'].includes(currentPhase.value)) {
    ElMessage.warning(
      'This conversation has finished its current generation flow. Start a new chat for a new topic.'
    )
    return
  }

  const attachments =
    currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review'
      ? []
      : [...pendingAttachments.value]

  messages.value.push({
    role: 'user',
    type: 'text',
    content:
      prompt ||
      (hasAudioAttachments
        ? 'Please generate a PPT based on my uploaded audio instructions.'
        : 'Please generate a PPT based on the uploaded materials.'),
    attachments,
  })
  inputText.value = ''
  if (currentPhase.value !== 'outline_review' && currentPhase.value !== 'draft_review') {
    pendingAttachments.value = []
  }
  scrollToBottom()

  if (currentPhase.value === 'outline_review') {
    await reviseOutline(prompt)
    return
  }
  if (currentPhase.value === 'draft_review') {
    await reviseDraft(prompt)
    return
  }
  await createSessionFromPrompt(prompt, attachments)
}

function fillSuggestion(value) {
  inputText.value = value
}

function openExternalLink(url) {
  if (!url) {
    ElMessage.warning('下载地址缺失')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 处理 @知识库
function handleMention(kbName, isChecked) {
  if (isChecked) {
    const currentText = inputText.value.trim()
    inputText.value = currentText ? `${currentText} @${kbName} ` : `@${kbName} `
  } else {
    // 动态生成正则，匹配对应的 @知识库名称 及后面可能跟的空格，将其替换为空
    const regex = new RegExp(`@${kbName}\\s*`, 'g')
    inputText.value = inputText.value.replace(regex, '')
  }
}

// 处理置顶
function handlePinHistory(id) {
  const index = historyList.value.findIndex((entry) => entry.id === id)
  if (index > 0) {
    const [item] = historyList.value.splice(index, 1)
    historyList.value.unshift(item)
    persistHistory()
    ElMessage.success('已置顶')
  }
}

// 处理重命名
function handleRenameHistory(item) {
  ElMessageBox.prompt('请输入新的对话名称', '重命名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: item.title,
  })
    .then(({ value }) => {
      if (value.trim()) {
        item.title = value.trim()
        persistHistory()
        ElMessage.success('重命名成功')
      }
    })
    .catch(() => {})
}
async function openPreview(payload, options = {}) {
  const sessionId = options.sessionId || currentSessionId.value || ''
  const taskId = options.taskId || ''
  const fallbackFileUrl = options.fileUrl || options.downloadUrl || ''
  const source = payload && typeof payload === 'object' ? unwrapData(payload) : payload
  const previewType = options.previewType || inferPreviewType(source, options.fileName)

  previewLoading.value = true
  previewError.value = ''
  currentPreviewConfig.value = null
  currentPreviewType.value = previewType

  try {
    if (source?.editorConfig && (source.apiJsUrl || source.documentServerUrl)) {
      currentPreviewConfig.value = source
    } else if (previewType === 'document' && source && typeof source === 'object') {
      currentPreviewConfig.value = source
    } else if (previewType === 'document' && typeof source === 'string') {
      currentPreviewConfig.value = buildDocumentPreviewPayload(source, {
        fileName: options.fileName || 'document.docx',
        sessionId,
        phase: 'preview',
      })
    } else if (source && typeof source === 'object') {
      currentPreviewConfig.value = source
    } else if (sessionId) {
      currentPreviewConfig.value = buildSessionPreviewPayload(sessionId, {
        fileName: options.fileName || 'generated.pptx',
        taskId,
      })
    } else if (taskId) {
      currentPreviewConfig.value = {
        previewSource: 'ppt-task-onlyoffice',
        taskId,
        fileName: options.fileName || 'generated.pptx',
      }
    } else {
      currentPreviewConfig.value =
        typeof source === 'string'
          ? previewType === 'document'
            ? buildDocumentPreviewPayload(source, {
                fileName: options.fileName || 'document.docx',
                sessionId,
                phase: 'preview',
              })
            : buildDirectPreviewPayload(source, { fileName: options.fileName || 'generated.pptx' })
          : null
    }

    if (!currentPreviewConfig.value) {
      throw new Error('未找到可用的预览配置。')
    }

    currentPreviewKey.value =
      currentPreviewConfig.value.fileId ||
      currentPreviewConfig.value.sessionId ||
      currentPreviewConfig.value.taskId ||
      currentPreviewConfig.value.directDownloadUrl ||
      `${previewType}-${Date.now()}`
  } catch (error) {
    currentPreviewConfig.value = null
    previewError.value = getPreviewError(error)
  } finally {
    previewLoading.value = false
  }
}

function closePreview() {
  currentPreviewConfig.value = null
  currentPreviewType.value = 'ppt'
  currentPreviewKey.value = ''
  previewLoading.value = false
  previewError.value = ''
}

function createConversation(overrides = {}) {
  const timestamp = Date.now()
  return {
    id: `chat-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    title: '新对话',
    sessionId: '',
    sessionState: null,
    messagesData: [createGreetingMessage()],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function getConversationTitle(messagesData, fallback = '新对话') {
  const normalizeTitle = (value) => cleanText(String(value || '').replace(/\n+/g, ' '))
  const firstUserMessage = messagesData.find((item) => item.role === 'user' && item.content)
  const firstFileMessage = messagesData.find((item) => item.type === 'file' && item.content)

  const candidates = [firstUserMessage?.content, firstFileMessage?.content]
    .map(normalizeTitle)
    .filter(Boolean)

  const title = candidates[0] || ''
  if (!title) return fallback
  return title.length > 22 ? `${title.slice(0, 22)}...` : title
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historyList.value))
}

function syncActiveConversation() {
  if (!activeConversationId.value) return
  const target = historyList.value.find((item) => item.id === activeConversationId.value)
  if (!target) return
  target.messagesData = cloneDeep(messages.value)
  target.sessionId = currentSessionId.value || ''
  target.sessionState = cloneDeep(currentSessionSnapshot.value)
  target.title = getConversationTitle(messages.value, target.title)
  target.updatedAt = Date.now()
  historyList.value = [...historyList.value]
  persistHistory()
}

function restoreConversation(conversation) {
  const normalizedConversation = normalizeConversationRecord(conversation)
  conversation.messagesData = cloneDeep(normalizedConversation.messagesData)
  conversation.sessionId = normalizedConversation.sessionId || ''
  conversation.sessionState = cloneDeep(normalizedConversation.sessionState || null)

  activeConversationId.value = conversation.id
  messages.value = cloneDeep(conversation.messagesData)
  currentSessionId.value = conversation.sessionId
  currentSessionSnapshot.value = cloneDeep(conversation.sessionState)
  pendingAttachments.value = []
  inputText.value = ''
  closePreview()
  cancelListening()
  scrollToBottom()
}

function loadConversations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(parsed) && parsed.length) {
      historyList.value = parsed
        .map((item) => ({
          ...createConversation(),
          ...item,
          messagesData:
            Array.isArray(item.messagesData) && item.messagesData.length
              ? item.messagesData
              : [createGreetingMessage()],
        }))
        .map((item) => normalizeConversationRecord(item))
        .map((item) => ({
          ...item,
          title: getConversationTitle(item.messagesData, item.title || '新对话'),
        }))
    }
  } catch {
    historyList.value = []
  }

  if (!historyList.value.length) {
    const first = createConversation()
    historyList.value = [first]
    restoreConversation(first)
    persistHistory()
    return
  }

  const routeChatId = route.query.chatId ? String(route.query.chatId) : ''
  const target = historyList.value.find((item) => item.id === routeChatId) || historyList.value[0]
  restoreConversation(target)
}

function startNewChat() {
  const conversation = createConversation()
  historyList.value = [conversation, ...historyList.value]
  restoreConversation(conversation)
  persistHistory()
}

function handleLoadHistory(item) {
  const target = historyList.value.find((entry) => entry.id === item.id) || item
  restoreConversation(target)
}

function deleteConversation(payload) {
  // 核心修复：兼容传入的是完整 item 对象还是直接传入 id
  const targetId = typeof payload === 'object' ? payload.id : payload
  const deleteIndex = historyList.value.findIndex((entry) => entry.id === targetId)
  if (deleteIndex < 0) return

  const isDeletingActive = activeConversationId.value === targetId
  const nextCandidate =
    historyList.value[deleteIndex + 1] || historyList.value[deleteIndex - 1] || null

  historyList.value = historyList.value.filter((entry) => entry.id !== targetId)

  if (!historyList.value.length) {
    const fallbackConversation = createConversation()
    historyList.value = [fallbackConversation]
    restoreConversation(fallbackConversation)
    persistHistory()
    return
  }

  if (isDeletingActive && nextCandidate) {
    const target =
      historyList.value.find((entry) => entry.id === nextCandidate.id) || historyList.value[0]
    restoreConversation(target)
  }

  persistHistory()
}

function toggleListening() {
  if (isRecordingBusy.value) {
    ElMessage.warning('语音识别正在启动，请稍等...')
    return
  }

  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

function cancelListening() {
  voiceStopRequested = true
  if (speechRecognition) {
    speechRecognition.abort()
  }
  isListening.value = false
  isRecordingBusy.value = false
  speechRecognition = null
  voiceInterimTranscript.value = ''
  voiceFinalTranscript = ''
  voiceStatusText.value = '点击后开始实时识别'
}

function startListening() {
  if (isListening.value || isRecordingBusy.value) return

  const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!RecognitionConstructor) {
    ElMessage.warning('当前浏览器不支持实时语音识别，请使用 Chrome 或 Edge 访问。')
    return
  }

  isRecordingBusy.value = true
  voiceInputBaseText = inputText.value
  voiceFinalTranscript = ''
  voiceInterimTranscript.value = ''
  voiceStatusText.value = '正在连接麦克风...'
  voiceStopRequested = false

  const recognition = new RecognitionConstructor()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    speechRecognition = recognition
    isListening.value = true
    isRecordingBusy.value = false
    voiceStatusText.value = '正在识别，说完后点“停止识别”'
  }

  recognition.onresult = (event) => {
    let finalText = ''
    let interimText = ''

    for (let index = 0; index < event.results.length; index += 1) {
      const transcript = event.results[index][0]?.transcript || ''
      if (event.results[index].isFinal) {
        finalText += transcript
      } else {
        interimText += transcript
      }
    }

    voiceFinalTranscript = finalText
    voiceInterimTranscript.value = interimText.trim()
    syncSpeechTextToInput()
    voiceStatusText.value = voiceInterimTranscript.value ? '正在转写...' : '正在聆听...'
  }

  recognition.onerror = (event) => {
    const messageMap = {
      'not-allowed': '麦克风权限未开启，无法进行语音识别。',
      'service-not-allowed': '浏览器语音识别服务不可用。',
      'no-speech': '没有识别到语音，请再试一次。',
      network: '语音识别网络连接失败，请稍后重试。',
    }
    const message = messageMap[event.error] || '语音识别失败，请重试。'
    voiceStatusText.value = message
    ElMessage.warning(message)
  }

  recognition.onend = () => {
    const hadSpeech = Boolean((voiceFinalTranscript + voiceInterimTranscript.value).trim())
    finalizeSpeechText()
    isListening.value = false
    isRecordingBusy.value = false
    speechRecognition = null
    voiceStatusText.value = '点击后开始实时识别'

    if (hadSpeech && !voiceStopRequested) {
      ElMessage.success('语音已自动填入输入框。')
    }
  }

  try {
    recognition.start()
  } catch (error) {
    isListening.value = false
    isRecordingBusy.value = false
    speechRecognition = null
    voiceStatusText.value = '点击后开始实时识别'
    ElMessage.warning(error?.message || '语音识别启动失败，请重试。')
  }
}

function stopListening() {
  if (!isListening.value && !isRecordingBusy.value) {
    finalizeSpeechText()
    return
  }

  voiceStopRequested = true
  finalizeSpeechText()
  isListening.value = false
  isRecordingBusy.value = false

  if (speechRecognition) {
    speechRecognition.stop()
  }
}

function syncSpeechTextToInput() {
  const transcript = `${voiceFinalTranscript}${voiceInterimTranscript.value}`.trim()
  inputText.value = mergeSpeechWithBaseText(voiceInputBaseText, transcript)
}

function finalizeSpeechText() {
  const transcript = `${voiceFinalTranscript}${voiceInterimTranscript.value}`.trim()
  if (transcript) {
    inputText.value = mergeSpeechWithBaseText(voiceInputBaseText, transcript)
  }
  voiceInputBaseText = inputText.value
  voiceFinalTranscript = ''
  voiceInterimTranscript.value = ''
}

function mergeSpeechWithBaseText(baseText, transcript) {
  const normalizedTranscript = String(transcript || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalizedTranscript) return baseText

  const normalizedBase = String(baseText || '').replace(/\s+$/g, '')
  if (!normalizedBase) return normalizedTranscript

  const needsSpace =
    /[a-zA-Z0-9]$/.test(normalizedBase) && /^[a-zA-Z0-9]/.test(normalizedTranscript)
  return `${normalizedBase}${needsSpace ? ' ' : ''}${normalizedTranscript}`
}

watch(
  [messages, currentSessionId, currentSessionSnapshot, activeConversationId],
  syncActiveConversation,
  {
    deep: true,
  }
)

watch([sidebarOpen, showPreviewRegion], () => {
  syncPreviewWidthWithinViewport()
})

onMounted(() => {
  loadConversations()
  syncPreviewWidthWithinViewport()
  window.addEventListener('resize', syncPreviewWidthWithinViewport)
  scrollToBottom()
})

onBeforeUnmount(() => {
  cancelListening()
  stopPreviewResize()
  window.removeEventListener('resize', syncPreviewWidthWithinViewport)
})
</script>

<style scoped>
.chat-app-layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
  background: #fff;
}

.chat-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 420px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.message {
  display: flex;
  width: 100%;
  max-width: 860px;
  margin: 0 auto 30px;
}

.message-user {
  justify-content: flex-end;
}

.message-wrapper {
  max-width: 82%;
}

.user-content-wrapper {
  background: #eff3fd;
  border-radius: 14px 4px 14px 14px;
  padding: 12px;
}

.text-content,
.ai-text {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
}

.content {
  margin-top: 10px;
}

.ai-text,
.form-card,
.file-card {
  background: #fff;
  border: 1px solid #e9edf3;
  border-radius: 16px;
  box-shadow: 0 8px 26px rgba(20, 33, 61, 0.04);
}

.ai-text {
  padding: 14px 18px;
}

.msg-attachments,
.selected-attachments,
.draft-action-row,
.artifact-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.msg-attach-card,
.att-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e2e8f4;
  border-radius: 999px;
  padding: 8px 12px;
}

.form-card {
  width: 100%;
  max-width: 560px;
  padding: 20px;
}

.form-group + .form-group {
  margin-top: 14px;
}

.form-group h4 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #1f2d3d;
}

.clarification-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.clarification-question h4 {
  margin: 0;
}

.clarification-picked {
  flex-shrink: 0;
  padding: 5px 9px;
  border-radius: 999px;
  background: #eef4ff;
  color: #1f4fd6;
  font-size: 12px;
  font-weight: 700;
}

.clarification-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.clarification-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  min-height: 40px;
  min-width: 96px;
  border: 1px solid #d9e2f2;
  border-radius: 12px;
  background: #f7f9fc;
  color: #42526a;
  padding: 9px 13px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease,
    color 0.18s ease, box-shadow 0.18s ease;
}

.clarification-option__label {
  min-width: 0;
  white-space: nowrap;
}

.clarification-option:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(31, 79, 214, 0.35);
  background: #eef4ff;
  color: #1f4fd6;
  box-shadow: 0 10px 22px rgba(31, 79, 214, 0.08);
}

.clarification-option.is-selected {
  border-color: rgba(31, 79, 214, 0.42);
  background: #eaf2ff;
  color: #1f4fd6;
  box-shadow: 0 12px 24px rgba(31, 79, 214, 0.1);
}

.clarification-option:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.clarification-option__check {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 2px solid #b7c4d9;
  border-radius: 50%;
  background: #fff;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.clarification-option__check::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.clarification-option.is-selected .clarification-option__check {
  border-color: #1677ff;
  background: #1677ff;
}

.clarification-option.is-selected .clarification-option__check::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

.clarification-footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #edf1f6;
}

.clarification-progress {
  display: flex;
  justify-content: flex-end;
  color: #66758c;
  font-size: 12px;
  font-weight: 700;
}

.clarification-progress-bar {
  height: 6px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f8;
}

.clarification-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8eb8ff, #1677ff);
  transition: width 0.24s ease;
}

.card-tip {
  color: #66758c;
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 12px;
}

.card-tip--quiet {
  margin-top: 12px;
  margin-bottom: 0;
}

.card-tip--warning {
  color: #b54708;
  background: #fff4e5;
  border-radius: 12px;
  padding: 10px 12px;
}

.card-tip--success {
  color: #047857;
  background: #ecfdf3;
  border-radius: 12px;
  padding: 10px 12px;
}

.form-group--compact {
  margin-top: 14px;
}

.embedded-textarea {
  width: 100%;
  min-height: 84px;
  resize: vertical;
  border: 1px solid #d8e0ee;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
}

.embedded-textarea:focus,
.input-wrapper textarea:focus {
  border-color: #1677ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.choice-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.choice-btn {
  border: 1px solid #d9e2f2;
  background: #f7f9fc;
  color: #42526a;
  border-radius: 999px;
  padding: 10px 18px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.choice-btn:hover {
  border-color: #a9c4ff;
  background: #eef4ff;
}

.choice-btn.is-active {
  border-color: rgba(31, 79, 214, 0.3);
  background: #eef4ff;
  color: #1f4fd6;
}

.choice-btn.is-muted.is-active {
  border-color: rgba(120, 134, 156, 0.24);
  background: #f1f4f8;
  color: #5f6c80;
}

.submit-form-btn,
.secondary-btn,
.artifact-link,
.send-btn,
.tool-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transform: translateY(0) scale(1);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease,
    color 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
}

.submit-form-btn::before,
.secondary-btn::before,
.artifact-link::before,
.send-btn::before,
.tool-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0));
  opacity: 0;
  transform: translateX(-18px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.submit-form-btn {
  background: #333;
  color: #fff;
  padding: 10px 18px;
}

.secondary-btn,
.artifact-link,
.tool-btn {
  background: #eef3ff;
  color: #1f4fd6;
  padding: 10px 16px;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.tool-btn__icon {
  font-size: 15px;
  line-height: 1;
}

.tool-btn__svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  flex-shrink: 0;
}

.tool-btn__label {
  line-height: 1;
}

.artifact-link {
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.submit-form-btn:hover,
.secondary-btn:hover,
.artifact-link:hover,
.send-btn:hover,
.tool-btn:hover {
  transform: translateY(-1px);
  filter: saturate(1.03);
}

.submit-form-btn:hover::before,
.secondary-btn:hover::before,
.artifact-link:hover::before,
.send-btn:hover::before,
.tool-btn:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.submit-form-btn:active,
.secondary-btn:active,
.artifact-link:active,
.send-btn:active,
.tool-btn:active {
  transform: translateY(1px) scale(0.985);
}

.submit-form-btn:disabled,
.secondary-btn:disabled,
.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.outline-review-card {
  max-width: 680px;
}

.outline-review-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.outline-review-head h4 {
  margin: 4px 0 0;
  font-size: 18px;
  color: #1f2d3d;
}

.outline-review-eyebrow {
  color: #1f4fd6;
  font-size: 12px;
  font-weight: 800;
}

.outline-review-count {
  flex-shrink: 0;
  border-radius: 999px;
  background: #eef4ff;
  color: #1f4fd6;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
}

.outline-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.outline-summary-item {
  border: 1px solid #e8eef8;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff, #f2f6fc);
  padding: 12px;
}

.outline-summary-value {
  display: block;
  color: #1f2d3d;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.outline-summary-label {
  display: block;
  margin-top: 6px;
  color: #66758c;
  font-size: 12px;
  font-weight: 700;
}

.outline-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.outline-item {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e5edf8;
  border-radius: 14px;
  padding: 14px;
  min-height: 168px;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.outline-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #1677ff, #79c4ff);
}

.outline-item:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 79, 214, 0.24);
  box-shadow: 0 12px 26px rgba(31, 79, 214, 0.08);
}

.outline-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.outline-page-badge,
.outline-point-count {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.outline-page-badge {
  background: #1f4fd6;
  color: #fff;
  padding: 7px 9px;
}

.outline-point-count {
  background: #eef3f8;
  color: #5d6b82;
  padding: 7px 9px;
}

.outline-title {
  min-height: 42px;
  font-size: 14px;
  font-weight: 800;
  color: #1f2d3d;
  line-height: 1.45;
}

.outline-bullets {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.outline-bullet {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  color: #5e6d82;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.outline-bullet::before {
  content: '';
  position: absolute;
  top: 0.7em;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1f4fd6;
}

.outline-more-bullets {
  align-self: flex-start;
  margin-top: 2px;
  border-radius: 999px;
  background: #edf4ff;
  color: #1f4fd6;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 800;
}

.outline-empty {
  border: 1px dashed #d7dfec;
  border-radius: 12px;
  padding: 18px;
  color: #66758c;
  text-align: center;
}

.outline-expand-row {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.outline-expand-btn {
  border: 1px solid #dce6f5;
  border-radius: 999px;
  background: #fff;
  color: #1f4fd6;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.outline-expand-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 79, 214, 0.28);
  background: #f5f8ff;
}

.file-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 16px;
  width: min(360px, 100%);
  max-width: 100%;
  cursor: pointer;
  box-sizing: border-box;
}

.file-info {
  min-width: 0;
}

.file-cover {
  width: 56px;
  height: 56px;
  aspect-ratio: 1;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff7a45, #fa541c);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  box-sizing: border-box;
  overflow: hidden;
}

.file-cover--ppt {
  background: linear-gradient(135deg, #ff7a45, #fa541c);
}

.file-cover--document {
  background: linear-gradient(135deg, #5b8def, #3457d5);
}

.file-name {
  font-size: 14px;
  font-weight: 700;
  color: #24344d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #7a889d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestions-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f5f7fb;
  color: #35465f;
  cursor: pointer;
}

.chat-input-area {
  padding: 18px 30px 26px;
}

.input-wrapper {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid #e5ebf5;
  border-radius: 20px;
  padding: 14px;
  box-shadow: 0 16px 36px rgba(15, 28, 53, 0.05);
}

.input-wrapper textarea {
  width: 100%;
  border: none;
  resize: none;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  font-family: inherit;
  transition: color 0.2s ease;
}

.voice-recognition-status {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #f3f7ff;
  color: #1f4fd6;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
}

.voice-wave {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  width: 22px;
  height: 18px;
  flex-shrink: 0;
}

.voice-wave span {
  width: 3px;
  height: 8px;
  border-radius: 999px;
  background: #1677ff;
  animation: voice-wave 0.9s ease-in-out infinite;
}

.voice-wave span:nth-child(2) {
  animation-delay: 0.12s;
}

.voice-wave span:nth-child(3) {
  animation-delay: 0.24s;
}

.voice-wave span:nth-child(4) {
  animation-delay: 0.36s;
}

.voice-status-text {
  flex-shrink: 0;
  font-weight: 700;
}

.voice-draft-text {
  min-width: 0;
  color: #44546a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-wrapper.is-recording {
  border-color: rgba(22, 119, 255, 0.4);
  box-shadow: 0 0 0 5px rgba(22, 119, 255, 0.08);
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.send-btn {
  background: #1677ff;
  color: #fff;
  padding: 11px 22px;
  min-width: 92px;
  box-shadow: 0 10px 22px rgba(22, 119, 255, 0.18);
}

.send-btn:hover:not(:disabled) {
  box-shadow: 0 14px 26px rgba(22, 119, 255, 0.24);
}

.recording-active {
  background: #e6f4ff;
  box-shadow: 0 10px 22px rgba(22, 119, 255, 0.1);
}

@keyframes voice-wave {
  0%,
  100% {
    height: 7px;
    opacity: 0.55;
  }

  50% {
    height: 18px;
    opacity: 1;
  }
}

.preview-resizer {
  width: 12px;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  background: linear-gradient(
    180deg,
    rgba(237, 241, 246, 0),
    rgba(237, 241, 246, 0.92),
    rgba(237, 241, 246, 0)
  );
}

.preview-resizer::before {
  content: '';
  position: absolute;
  inset: 0;
}

.preview-resizer__handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 56px;
  border-radius: 999px;
  background: #d7dfec;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.preview-resizer:hover .preview-resizer__handle,
.preview-resizer.is-dragging .preview-resizer__handle {
  background: #8fb3ff;
  box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
}

.preview-panel {
  flex-shrink: 0;
  min-width: 420px;
  border-left: 1px solid #edf1f6;
  background: #f5f7fb;
  overflow: hidden;
}

.preview-panel--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-panel__status-card {
  max-width: 420px;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(31, 79, 214, 0.14);
  background: linear-gradient(180deg, #f7faff, #eef4ff);
}

.preview-panel__status-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}

.preview-panel__status-text {
  margin-top: 12px;
  color: #5c6c83;
  line-height: 1.7;
}

.preview-panel__status-actions {
  margin-top: 18px;
}

@media (max-width: 1280px) {
  .preview-resizer {
    width: 10px;
  }

  .preview-panel {
    min-width: 360px;
  }
}

@media (max-width: 760px) {
  .outline-summary-row,
  .outline-grid {
    grid-template-columns: 1fr;
  }

  .outline-review-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
.quoted-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px dashed #c0c4cc;
}

.quote-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.close-quote-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #909399;
  padding: 0 4px;
}

.close-quote-btn:hover {
  color: #f56c6c;
}
 
 
@keyframes blinkCursor {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.deep-thinking-container {
  width: 100%;
  max-width: 800px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
}

/* 头部点击栏 */
.deep-thinking-header {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  align-self: flex-start;
  margin-left: -10px; /* 让文字与外层对话边界对齐 */
}

.deep-thinking-header:hover {
  background-color: #f3f4f6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 蓝色旋转图标 */
.thinking-spin-icon {
  color: #4f46e5;
  animation: spinSlow 4s linear infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.header-timer {
  font-size: 14px;
  color: #6b7280;
}

/* 右侧折叠箭头 */
.header-chevron {
  color: #6b7280;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-chevron.is-collapsed {
  transform: rotate(-90deg);
}

/* 底部文字内容区 (左侧灰线设计) */
.deep-thinking-content {
  margin-top: 6px;
  margin-left: 9px; /* 精确对齐图标的中轴线 */
  padding-left: 16px;
  padding-top: 4px;
  padding-bottom: 4px;
  border-left: 2px solid #e5e7eb;
}

.typewriter-text {
  font-size: 14px;
  line-height: 1.75;
  color: #6b7280; /* 截图同款灰字 */
  white-space: pre-wrap;
  word-break: break-all;
}

/* 灰色的光标 */
.typing-cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  background-color: #9ca3af; 
  margin-left: 3px;
  vertical-align: baseline;
  animation: blinkCursor 0.8s step-end infinite;
}

@keyframes blinkCursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
