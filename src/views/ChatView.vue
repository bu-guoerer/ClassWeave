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
                <div v-for="(att, attIndex) in msg.attachments" :key="attIndex" class="msg-attach-card">
                  <span class="att-icon">{{ att.type === 'audio' ? '🎵' : '📄' }}</span>
                  <div class="att-info">
                    <span class="att-name">{{ att.name }}</span>
                    <span class="att-size">{{ att.type === 'audio' ? '音频文件' : '参考文档' }}</span>
                  </div>
                </div>
              </div>
              <div v-if="msg.content" class="text-content">{{ msg.content }}</div>
            </div>

            <ThinkingLogo v-if="msg.role === 'ai'" :is-thinking="msg.isThinking" />

            <div v-if="msg.role === 'ai' && msg.isThinking" class="content generation-card">
              <div class="generation-card__header">
                <div>
                  <div class="generation-card__eyebrow">生成中</div>
                  <div class="generation-card__title">{{ msg.progressTitle || '正在为你生成课件' }}</div>
                </div>
                <div class="generation-card__badge">{{ msg.progressBadge || '轮询中' }}</div>
              </div>
              <div class="generation-card__subtitle">
                {{ msg.progressSubtitle || '后端正在处理资料与生成流程，拿到结果后会第一时间展示。' }}
              </div>
              <div class="generation-card__bar">
                <span class="generation-card__bar-fill"></span>
              </div>
              <div class="generation-card__steps">
                <div
                  v-for="(step, stepIndex) in msg.progressSteps || []"
                  :key="`${step.label}-${stepIndex}`"
                  :class="['generation-step', `is-${step.state}`]"
                >
                  <span class="generation-step__dot"></span>
                  <span class="generation-step__label">{{ step.label }}</span>
                </div>
              </div>
              <div class="generation-card__footer">
                <span class="generation-card__meta">已等待 {{ msg.elapsedLabel || '不到 1 秒' }}</span>
                <span v-if="msg.progressTip" class="generation-card__meta">{{ msg.progressTip }}</span>
              </div>
            </div>

            <div v-else-if="msg.role === 'ai' && msg.type === 'text'" class="content ai-text">
              {{ msg.content }}
            </div>

            <div v-if="msg.type === 'clarification'" class="content form-card">
              <div v-for="item in msg.items" :key="item.key" class="form-group">
                <h4>{{ item.question }}</h4>
                <div v-if="item.options?.length" class="card-tip">
                  推荐选项：{{ item.options.join(' / ') }}
                </div>
                <textarea
                  v-model="msg.answers[item.key]"
                  class="embedded-textarea"
                  :disabled="msg.isSubmitted"
                  placeholder="请输入补充信息"
                />
              </div>
              <div class="form-actions">
                <button
                  class="submit-form-btn"
                  :disabled="msg.isSubmitted || isSubmitting"
                  @click="submitClarifications(msg)"
                >
                  {{ msg.isSubmitted ? '已提交' : '提交澄清信息' }}
                </button>
              </div>
            </div>

            <div v-if="msg.type === 'outline-review'" class="content form-card">
              <div class="form-group">
                <h4>大纲已生成</h4>
                <div class="card-tip">
                  共 {{ msg.slideCount || msg.slides?.length || 0 }} 页。满意后可以继续生成；如果想改，直接在下方输入框发送修改意见。
                </div>
                <div class="outline-list">
                  <div v-for="slide in msg.slides" :key="slide.slideId" class="outline-item">
                    <div class="outline-title">{{ slide.title || `第 ${slide.index} 页` }}</div>
                    <div v-if="slide.bullets?.length" class="outline-bullets">
                      <div v-for="(bullet, bulletIndex) in slide.bullets" :key="bulletIndex" class="outline-bullet">
                        {{ bullet }}
                      </div>
                    </div>
                  </div>
                </div>
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
              @click="openPreview(msg.previewPayload || msg.fileUrl, { sessionId: msg.sessionId, taskId: msg.taskId, fileName: msg.content })"
            >
              <div class="file-cover">PPT</div>
              <div class="file-info">
                <div class="file-name">{{ msg.content }}</div>
                <div class="file-desc">{{ msg.description || '点击查看预览' }}</div>
              </div>
            </div>

            <div v-if="msg.type === 'draft-actions'" class="content form-card">
              <div class="form-group">
                <h4>草稿已就绪</h4>
                <div class="card-tip">
                  可以先预览当前 draft。若想改稿，直接在输入框输入修改意见；满意后点击下方按钮导出最终结果。
                </div>
              </div>
              <div class="draft-action-row">
                <button
                  class="secondary-btn"
                  @click="openPreview(msg.previewPayload, { sessionId: msg.sessionId, taskId: msg.taskId, fileName: 'draft.pptx' })"
                >
                  预览草稿
                </button>
                <button class="secondary-btn" @click="openExternalLink(msg.downloadUrl)">下载草稿</button>
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
                    getDigitalHumanPromptFeedback(msg.prompt).tone === 'success' ? 'card-tip--success' : 'card-tip--warning',
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
                    {{ msg.isSubmitted ? '生成中...' : msg.hasGenerated ? '重新生成数字人' : '开始生成数字人' }}
                  </button>
                </div>
              </div>

              <div v-else-if="msg.choice === 'no'" class="card-tip card-tip--quiet">
                好的，当前先不生成数字人讲解。后面如果你想加上这一部分，随时再点“需要”并补充要求就行。
              </div>
            </div>

            <div v-if="msg.suggestions?.length" class="suggestions-list">
              <div v-for="(suggestion, suggestionIndex) in msg.suggestions" :key="suggestionIndex" class="suggestion-item" @click="fillSuggestion(suggestion)">
                <span class="sug-text">{{ suggestion }}</span>
                <span class="sug-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div :class="['input-wrapper', { 'is-recording': isListening }]">
          <div v-if="pendingAttachments.length" class="selected-attachments">
            <div v-for="(att, index) in pendingAttachments" :key="`${att.name}-${index}`" class="att-tag">
              <span>{{ att.type === 'audio' ? '🎵' : '📄' }} {{ att.name }}</span>
              <button class="remove-att" @click="removeAttachment(index)">×</button>
            </div>
          </div>

          <textarea
            v-model="inputText"
            :placeholder="inputPlaceholder"
            @keydown.enter.prevent="handleSend"
          />

          <div class="input-toolbar">
            <div class="toolbar-left">
              <input ref="fileInputRef" type="file" style="display: none" @change="handleFileSelect" />
              <button class="tool-btn" title="上传 PDF" @click="triggerFileInput('pdf')">📄 PDF</button>
              <button class="tool-btn" title="上传音频" @click="triggerFileInput('audio')">🎵 音频</button>
              <button :class="['tool-btn', 'mic-btn', { 'recording-active': isListening }]" title="语音输入" @click="toggleListening">
                🎙️ 语音
              </button>
              <button class="tool-btn" title="选择模板" @click="router.push('/templates')">🧩 选择模板</button>
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

      <div
        v-if="currentPreviewConfig"
        class="preview-panel"
        :style="previewPanelStyle"
      >
        <PptPreview :key="currentPreviewKey" :document-config="currentPreviewConfig" @close="closePreview" />
      </div>

      <div
        v-else
        class="preview-panel preview-panel--placeholder"
        :style="previewPanelStyle"
      >
        <div class="preview-panel__status-card">
          <div class="preview-panel__status-title">
            {{ previewLoading ? '正在打开 PPT 预览' : 'PPT 预览暂时无法打开' }}
          </div>
          <div class="preview-panel__status-text">
            {{ previewLoading ? '正在请求 ONLYOFFICE 预览配置，请稍候...' : previewError || '预览配置获取失败，请稍后重试。' }}
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
import {
  appendPptSessionAssetsApi,
  createPptDigitalHumanApi,
  createPptSessionApi,
  fetchPptArtifactsApi,
  fetchPptDigitalHumanApi,
  fetchPptDraftApi,
  fetchPptOnlyofficePreviewApi,
  fetchPptOutlineApi,
  fetchPptSessionApi,
  fetchPptTaskOnlyofficePreviewApi,
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

const uploadType = ref('pdf')
let speechRecognition = null

const uploadedPending = computed(() => pendingAttachments.value.some((item) => item.status === 'uploading'))
const currentPhase = computed(() => getSessionPhase(currentSessionSnapshot.value))
const showPreviewRegion = computed(() => Boolean(currentPreviewConfig.value || previewLoading.value || previewError.value))
const previewPanelStyle = computed(() => ({
  width: `${previewWidth.value}px`,
  minWidth: `${MIN_PREVIEW_WIDTH}px`,
}))
const inputPlaceholder = computed(() => {
  if (isListening.value) return '正在聆听中，请讲话...'
  if (currentPhase.value === 'clarification') return '请先完成上方澄清问题后再继续'
  if (currentPhase.value === 'outline_review') return '如需修改大纲，直接输入修改意见；满意可点击“接受大纲”'
  if (currentPhase.value === 'draft_review') return '如需改稿，直接输入修改意见；满意可点击“导出最终结果”'
  return '输入主题，或上传参考资料生成 PPT...'
})
const sendDisabled = computed(() => {
  if (uploadedPending.value || isSubmitting.value || currentPhase.value === 'clarification') return true
  if (currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review') {
    return !inputText.value.trim() && pendingAttachments.value.length === 0
  }
  return !inputText.value.trim() && pendingAttachments.value.length === 0
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
    layoutWidth - sidebarWidth - MIN_CHAT_MAIN_WIDTH,
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
  const value = String(status || '').trim().toLowerCase()
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
  return String(snapshot?.currentStage || snapshot?.status || snapshot?.nextAction || '').trim().toLowerCase()
}

function buildProgressSteps(activeIndex) {
  return progressLabels.map((label, index) => ({
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }))
}

function getProgressMeta(snapshot) {
  const stage = getCurrentStage(snapshot)
  if (stage.includes('artifact') || stage.includes('final') || stage.includes('export') || stage.includes('package')) {
    return {
      title: '正在导出最终文件',
      subtitle: 'PPT、讲义和其他产物正在打包，完成后会直接展示下载与预览入口。',
      badge: '收尾中',
      stepIndex: 3,
    }
  }
  if (stage.includes('draft') || stage.includes('slide') || stage.includes('render') || stage.includes('compose')) {
    return {
      title: '正在生成课件草稿',
      subtitle: '已经进入正文内容生成阶段，接下来会尽快给出可预览的草稿。',
      badge: '写作中',
      stepIndex: 2,
    }
  }
  if (stage.includes('outline') || stage.includes('plan') || stage.includes('structure') || stage.includes('storyboard')) {
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
    sessionId: String(data.sessionId || data.session_id || data.taskId || data.task_id || data.id || ''),
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
  if (snapshot.status === 'needs_clarification' || snapshot.nextAction === 'submit_clarifications') return 'clarification'
  if (snapshot.status === 'awaiting_outline_review' || snapshot.nextAction === 'review_outline') return 'outline_review'
  if (snapshot.status === 'awaiting_draft_review' || snapshot.nextAction === 'revise_draft_or_finalize') return 'draft_review'
  return 'poll'
}

function sanitizeFileId(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `ppt-${Date.now()}`
}

function uniqueTruthy(values) {
  return [...new Set(values.filter(Boolean))]
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function flattenReadableText(value, depth = 0) {
  if (value == null || depth > 3) return []
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = cleanText(value)
    return text && text !== '[object Object]' ? [text] : []
  }
  if (Array.isArray(value)) return uniqueTruthy(value.flatMap((item) => flattenReadableText(item, depth + 1)))
  if (typeof value === 'object') {
    const fromPreferred = preferredOutlineFields.flatMap((field) => flattenReadableText(value[field], depth + 1))
    if (fromPreferred.length) return uniqueTruthy(fromPreferred)
    return uniqueTruthy(
      Object.entries(value)
        .filter(([key]) => !ignoredOutlineKeys.has(key))
        .flatMap(([, nested]) => flattenReadableText(nested, depth + 1)),
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
    const parts = pathname.split('/').filter(Boolean).map((item) => decodeURIComponent(item))
    const bucketIndex = parts.findIndex((item) => item === PREVIEW_BUCKET)
    if (bucketIndex >= 0) {
      return parts.slice(bucketIndex + 1).join('/') || fallback
    }
  } catch {
    return fallback
  }
  return fallback
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
  const fileId = sanitizeFileId(options.fileId || `${options.sessionId || 'session'}-${options.phase || 'preview'}`)
  return {
    fileId,
    fileName,
    objectKey: deriveObjectKeyFromUrl(url, fileName),
    creatorId: 'u100',
    userId: 'u100',
    bucketName: PREVIEW_BUCKET,
    directDownloadUrl: url,
    mode: 'edit',
    lang: 'zh-CN',
  }
}

function buildSessionPreviewPayload(sessionId, options = {}) {
  return {
    previewSource: 'ppt-session-onlyoffice',
    sessionId,
    taskId: options.taskId || '',
    fileName: options.fileName || 'generated.pptx',
  }
}

function resolvePreviewPayload(payload, downloadUrl, options = {}) {
  const data = unwrapData(payload)
  const direct = data.previewPayload || data.preview_payload || data.onlyofficePayload || data.onlyoffice_payload || data.editorPayload || data.editor_payload || data.onlyoffice || data.preview
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
      options: item.options || [],
    }))
  }
  return (snapshot.clarificationQuestions || []).map((question, index) => ({
    key: `question_${index + 1}`,
    field: '',
    question,
    options: [],
  }))
}

function extractOutline(payload) {
  const data = unwrapData(payload)
  const preview = data.outline_preview || data.outlinePreview || {}
  const slides = (preview.slides || data.slides || []).map((slide, index) => {
    const title = pickReadableText(slide.title || slide.heading || slide.topic || slide.name, '') || `第 ${index + 1} 页`
    const bullets = uniqueTruthy(
      [slide.bullets, slide.points, slide.key_points, slide.keyPoints, slide.summary, slide.content, slide.outline]
        .flatMap((item) => flattenReadableText(item))
        .filter((item) => item !== title),
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
  const downloadUrl = data.downloadUrl || data.minio_download_url || downloadUrls.draft_pptx || downloadUrls.pptx || ''
  const fileName = getFileNameFromUrl(downloadUrl, 'draft.pptx')
  return {
    downloadUrl,
    fileName,
    taskId: String(data.taskId || data.task_id || ''),
    previewPayload: sessionId
      ? buildSessionPreviewPayload(sessionId, { fileName, taskId: data.taskId || data.task_id || '' })
      : resolvePreviewPayload(payload, downloadUrl, { sessionId, phase: 'draft', fileName }),
  }
}

function extractArtifacts(payload, sessionId) {
  const data = unwrapData(payload)
  const downloadUrls = data.downloadUrls || data.minio_download_urls || {}
  const pptxUrl = downloadUrls.pptx || ''
  const fileName = getFileNameFromUrl(pptxUrl, 'final.pptx')
  return {
    downloadUrls,
    pptxUrl,
    taskId: String(data.taskId || data.task_id || ''),
    previewPayload: sessionId
      ? buildSessionPreviewPayload(sessionId, { fileName, taskId: data.taskId || data.task_id || '' })
      : resolvePreviewPayload(payload, pptxUrl, { sessionId, phase: 'final', fileName }),
    fileName,
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
  return !result.status || ['pending', 'queued', 'running', 'processing', 'in_progress', 'submitted', 'created'].includes(result.status)
}

async function waitForDigitalHumanResult(sessionId, initialPayload) {
  let result = normalizeDigitalHumanResult(initialPayload || (await fetchPptDigitalHumanApi(sessionId)))
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
    ['在线播放', downloadUrls.preview || downloadUrls.play_url || downloadUrls.hls || downloadUrls.m3u8],
  ]
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({ label, url }))
}

function finishThinkingMessage(index, content) {
  if (!messages.value[index]) return
  messages.value[index].isThinking = false
  messages.value[index].type = 'text'
  messages.value[index].content = content
}

function patchMessage(index, patch) {
  if (!messages.value[index]) return
  Object.assign(messages.value[index], patch)
}

function appendThinkingMessage() {
  const index = messages.value.length
  messages.value.push({
    role: 'ai',
    type: 'text',
    isThinking: true,
    content: '',
    progressTitle: '正在整理生成任务',
    progressSubtitle: '我会持续轮询后端状态，并把每一步的结果自动展示在聊天里。',
    progressBadge: '启动中',
    progressSteps: buildProgressSteps(0),
    elapsedLabel: '不到 1 秒',
    progressTip: progressTips[0],
  })
  scrollToBottom()
  return index
}

function markSessionCardsSubmitted(sessionId) {
  messages.value.forEach((message) => {
    if (message.sessionId === sessionId && ['clarification', 'outline-review', 'draft-actions'].includes(message.type)) {
      message.isSubmitted = true
    }
  })
}

function ensureDigitalHumanActionCard(sessionId) {
  const existing = messages.value.find((message) => message.type === 'digital-human-actions' && message.sessionId === sessionId)
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
    finishThinkingMessage(thinkingIndex, '大纲已经生成好了。你可以先看大纲，满意后继续生成；如果想改，直接在输入框告诉我。')
    messages.value.push({
      role: 'ai',
      type: 'outline-review',
      sessionId: snapshot.sessionId,
      slideCount: outline.slideCount,
      slides: outline.slides,
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
    finishThinkingMessage(thinkingIndex, '草稿已经生成好了，可以先预览；如果想改，直接在输入框告诉我，满意后点“导出最终结果”。')
    messages.value.push({
      role: 'ai',
      type: 'file',
      sessionId: snapshot.sessionId,
      taskId: draft.taskId,
      content: draft.fileName,
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
    const artifacts = extractArtifacts(await fetchPptArtifactsApi(snapshot.sessionId), snapshot.sessionId)
    finishThinkingMessage(thinkingIndex, '最终结果已导出完成，可以预览或下载。')
    if (artifacts.pptxUrl && artifacts.previewPayload) {
      messages.value.push({
        role: 'ai',
        type: 'file',
        sessionId: snapshot.sessionId,
        taskId: artifacts.taskId,
        content: artifacts.fileName,
        description: '最终 PPT 已生成完成，点击查看',
        previewPayload: artifacts.previewPayload,
        fileUrl: artifacts.pptxUrl,
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
  try {
    const response = await createPptSessionApi(buildCreateSessionPayload(prompt, attachments))
    const snapshot = normalizeSessionSnapshot(response)
    if (!snapshot.sessionId) {
      throw new Error('创建任务失败：未返回有效标识')
    }
    const finalSnapshot = await pollSessionUntilActionable(snapshot.sessionId, response, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
      buildAppendAssetsPayload(prompt, attachments),
    )
    const finalSnapshot = await pollSessionUntilActionable(currentSessionId.value, response, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
    : { answers: completedAnswers.map((item) => ({ question: item.question, answer: item.answer })) }

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
    const snapshot = await pollSessionUntilActionable(actionMessage.sessionId, undefined, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
    const snapshot = await pollSessionUntilActionable(actionMessage.sessionId, undefined, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
    const snapshot = await pollSessionUntilActionable(currentSessionId.value, undefined, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
    const snapshot = await pollSessionUntilActionable(currentSessionId.value, undefined, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
    const snapshot = await pollSessionUntilActionable(actionMessage.sessionId, undefined, (current, round, startedAt) => {
      patchMessage(thinkingIndex, buildProgressPatch(current, startedAt, round))
    })
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
    finishThinkingMessage(thinkingIndex, result.message || '数字人任务已完成，我已经把可下载的产物整理到聊天里了。')
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

function triggerFileInput(type) {
  uploadType.value = type
  if (fileInputRef.value) {
    fileInputRef.value.accept = type === 'pdf' ? '.pdf' : 'audio/*'
    fileInputRef.value.click()
  }
}

async function handleFileSelect(event) {
  const input = event.target
  if (!input.files?.length) return
  const file = input.files[0]
  const attachment = {
    type: uploadType.value,
    name: file.name,
    size: file.size,
    status: 'uploading',
    uploadId: '',
  }
  pendingAttachments.value.push(attachment)

  try {
    const response = await uploadPptAttachmentApi(file, {
      asset_type: uploadType.value === 'audio' ? 'audio' : 'document',
    })
    const result = normalizeUploadResult(response)
    if (!result.uploadId) {
      throw new Error('Upload succeeded but upload_id is missing')
    }
    Object.assign(attachment, {
      status: 'done',
      uploadId: result.uploadId,
      name: result.fileName || attachment.name,
      assetType: result.assetType,
      role: result.role,
    })
    ElMessage.success('附件上传成功')
  } catch (error) {
    pendingAttachments.value = pendingAttachments.value.filter((item) => item !== attachment)
    ElMessage.error(error?.message || '附件上传失败')
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

async function handleSend() {
  const prompt = inputText.value.trim()
  if (!prompt && pendingAttachments.value.length === 0) return
  if (uploadedPending.value) {
    ElMessage.warning('附件仍在上传，请稍后再发送')
    return
  }
  if (currentPhase.value === 'clarification') {
    ElMessage.warning('请先提交上方的澄清问题')
    return
  }
  if (currentPhase.value !== 'outline_review' && currentPhase.value !== 'draft_review' && !prompt && pendingAttachments.value.length === 0) {
    ElMessage.warning('请先输入需求描述，或上传参考资料')
    return
  }
  if (pendingAttachments.value.some((item) => !(item.uploadId || item.upload_id))) {
    ElMessage.warning('附件缺少 upload_id，请重新上传后再试')
    return
  }
  if (currentSessionId.value && currentPhase.value === 'poll') {
    ElMessage.warning('当前内容还在处理中，请等待这一轮生成结束')
    return
  }
  if (currentSessionId.value && pendingAttachments.value.length > 0) {
    const attachments = [...pendingAttachments.value]
    messages.value.push({
      role: 'user',
      type: 'text',
      content: prompt || '请把我刚上传的资料补充到当前 PPT 生成流程中。',
      attachments,
    })
    inputText.value = ''
    pendingAttachments.value = []
    scrollToBottom()
    await appendAssetsToCurrentSession(prompt, attachments)
    return
  }
  if (currentPhase.value === 'completed' && currentSessionId.value && pendingAttachments.value.length === 0 && isDigitalHumanIntent(prompt)) {
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
    ElMessage.warning('当前对话已经承接过这次生成流程了。如需开始新主题，请点击左侧“新建对话”。')
    return
  }

  const attachments = currentPhase.value === 'outline_review' || currentPhase.value === 'draft_review' ? [] : [...pendingAttachments.value]
  messages.value.push({
    role: 'user',
    type: 'text',
    content: prompt || '请基于上传的资料生成一份教学 PPT。',
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

async function openPreview(payload, options = {}) {
  const sessionId = options.sessionId || currentSessionId.value || ''
  const taskId = options.taskId || ''
  const source = payload && typeof payload === 'object' ? unwrapData(payload) : payload

  previewLoading.value = true
  previewError.value = ''
  currentPreviewConfig.value = null

  try {
    if (source?.editorConfig && (source.apiJsUrl || source.documentServerUrl)) {
      currentPreviewConfig.value = source
    } else if (source?.previewSource === 'ppt-session-onlyoffice' && source.sessionId) {
      try {
        currentPreviewConfig.value = unwrapData(await fetchPptOnlyofficePreviewApi(source.sessionId))
      } catch (error) {
        if (!source.taskId) throw error
        currentPreviewConfig.value = unwrapData(await fetchPptTaskOnlyofficePreviewApi(source.taskId))
      }
    } else if (source?.previewSource === 'ppt-task-onlyoffice' && source.taskId) {
      currentPreviewConfig.value = unwrapData(await fetchPptTaskOnlyofficePreviewApi(source.taskId))
    } else if (source && typeof source === 'object') {
      currentPreviewConfig.value = source
    } else if (sessionId) {
      try {
        currentPreviewConfig.value = unwrapData(await fetchPptOnlyofficePreviewApi(sessionId))
      } catch (error) {
        if (!taskId) throw error
        currentPreviewConfig.value = unwrapData(await fetchPptTaskOnlyofficePreviewApi(taskId))
      }
    } else if (taskId) {
      currentPreviewConfig.value = unwrapData(await fetchPptTaskOnlyofficePreviewApi(taskId))
    } else {
      currentPreviewConfig.value = typeof source === 'string'
        ? buildDirectPreviewPayload(source, { fileName: options.fileName || 'generated.pptx' })
        : null
    }

    if (!currentPreviewConfig.value) {
      throw new Error('未找到可用的预览配置。')
    }

    currentPreviewKey.value =
      currentPreviewConfig.value.fileId ||
      currentPreviewConfig.value.directDownloadUrl ||
      `${Date.now()}`
  } catch (error) {
    currentPreviewConfig.value = null
    previewError.value = getPreviewError(error)
  } finally {
    previewLoading.value = false
  }
}

function closePreview() {
  currentPreviewConfig.value = null
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

  const candidates = [
    firstUserMessage?.content,
    firstFileMessage?.content,
  ]
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
  activeConversationId.value = conversation.id
  messages.value = cloneDeep(conversation.messagesData?.length ? conversation.messagesData : [createGreetingMessage()])
  currentSessionId.value = conversation.sessionId || ''
  currentSessionSnapshot.value = cloneDeep(conversation.sessionState || null)
  pendingAttachments.value = []
  inputText.value = ''
  closePreview()
  stopListening()
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
          messagesData: Array.isArray(item.messagesData) && item.messagesData.length ? item.messagesData : [createGreetingMessage()],
        }))
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
  const target =
    historyList.value.find((item) => item.id === routeChatId) ||
    historyList.value[0]
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

function deleteConversation(item) {
  const deleteIndex = historyList.value.findIndex((entry) => entry.id === item.id)
  if (deleteIndex < 0) return

  const isDeletingActive = activeConversationId.value === item.id
  const nextCandidate =
    historyList.value[deleteIndex + 1] ||
    historyList.value[deleteIndex - 1] ||
    null

  historyList.value = historyList.value.filter((entry) => entry.id !== item.id)

  if (!historyList.value.length) {
    const fallbackConversation = createConversation()
    historyList.value = [fallbackConversation]
    restoreConversation(fallbackConversation)
    persistHistory()
    return
  }

  if (isDeletingActive && nextCandidate) {
    const target = historyList.value.find((entry) => entry.id === nextCandidate.id) || historyList.value[0]
    restoreConversation(target)
  }

  persistHistory()
}

function toggleListening() {
  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    startDemoRecognition()
    return
  }
  speechRecognition = new SpeechRecognition()
  speechRecognition.lang = 'zh-CN'
  speechRecognition.interimResults = true
  speechRecognition.onstart = () => {
    isListening.value = true
  }
  speechRecognition.onresult = (event) => {
    let transcript = ''
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript
    }
    inputText.value = transcript
  }
  speechRecognition.onerror = () => {
    ElMessage.warning('语音识别失败或未授权麦克风，已切换为演示模式')
    startDemoRecognition()
  }
  speechRecognition.onend = () => {
    isListening.value = false
  }
  speechRecognition.start()
}

function stopListening() {
  if (speechRecognition) {
    speechRecognition.stop()
  }
  isListening.value = false
}

function startDemoRecognition() {
  isListening.value = true
  inputText.value = ''
  window.setTimeout(() => {
    inputText.value = '帮我总结一下这份材料，并做成一份教学 PPT。'
  }, 800)
  window.setTimeout(() => {
    isListening.value = false
  }, 1800)
}

watch([messages, currentSessionId, currentSessionSnapshot, activeConversationId], syncActiveConversation, {
  deep: true,
})

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
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    filter 0.18s ease,
    opacity 0.18s ease;
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

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.outline-item {
  background: #f7f9fc;
  border: 1px solid #edf1f6;
  border-radius: 12px;
  padding: 12px;
}

.outline-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2d3d;
}

.outline-bullets {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outline-bullet {
  position: relative;
  padding-left: 14px;
  font-size: 13px;
  color: #5e6d82;
  line-height: 1.6;
}

.outline-bullet::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #1f4fd6;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  width: 320px;
  cursor: pointer;
}

.file-cover {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff7a45, #fa541c);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.file-name {
  font-size: 14px;
  font-weight: 700;
  color: #24344d;
}

.file-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #7a889d;
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
  min-height: 120px;
  border: none;
  resize: none;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  font-family: inherit;
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

.preview-resizer {
  width: 12px;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(237, 241, 246, 0), rgba(237, 241, 246, 0.92), rgba(237, 241, 246, 0));
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

.generation-card {
  width: 100%;
  max-width: 560px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(31, 79, 214, 0.14);
  background: linear-gradient(135deg, rgba(244, 248, 255, 0.98), rgba(255, 255, 255, 0.98));
  box-shadow: 0 12px 30px rgba(31, 79, 214, 0.08);
}

.generation-card__header,
.generation-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.generation-card__header {
  align-items: flex-start;
}

.generation-card__eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #1f4fd6;
  letter-spacing: 0.08em;
}

.generation-card__title {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1d2736;
}

.generation-card__badge {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(31, 79, 214, 0.1);
  color: #1f4fd6;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.generation-card__subtitle {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #5d6b82;
}

.generation-card__bar {
  margin-top: 14px;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(31, 79, 214, 0.08);
}

.generation-card__bar-fill {
  display: block;
  width: 42%;
  height: 100%;
  background: linear-gradient(90deg, #8eb8ff, #1677ff, #59a8ff);
  animation: loading-flow 1.8s ease-in-out infinite;
}

.generation-card__steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.generation-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e8eef9;
  background: rgba(255, 255, 255, 0.82);
}

.generation-step__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ccd7ea;
}

.generation-step__label,
.generation-card__meta {
  font-size: 12px;
  color: #66758c;
}

.generation-step.is-active {
  background: #eff5ff;
  border-color: rgba(31, 79, 214, 0.22);
}

.generation-step.is-active .generation-step__dot {
  background: #1677ff;
}

.generation-step.is-done {
  background: #effcf5;
  border-color: rgba(33, 168, 102, 0.18);
}

.generation-step.is-done .generation-step__dot {
  background: #21a866;
}

.remove-att {
  border: none;
  background: transparent;
  color: #8a96a8;
  cursor: pointer;
}

@keyframes loading-flow {
  0% {
    transform: translateX(-16%);
  }
  50% {
    transform: translateX(92%);
  }
  100% {
    transform: translateX(-16%);
  }
}

@media (max-width: 1280px) {
  .preview-resizer {
    width: 10px;
  }

  .preview-panel {
    min-width: 360px;
  }
}
</style>
