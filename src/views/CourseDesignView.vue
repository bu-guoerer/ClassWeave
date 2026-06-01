<template>
  <div class="course-design-page">
    <aside class="course-design-rail">
      <div class="rail-title">宏观课程设计</div>
      <button class="rail-primary" type="button" @click="resetWorkspace">新建课程设计</button>
      <div class="rail-list">
        <button
          v-for="plan in storedPlans"
          :key="plan.id"
          type="button"
          :class="['rail-plan', { 'is-active': plan.id === currentPlan?.id }]"
          @click="loadStoredPlan(plan)"
        >
          <span class="rail-plan-title">{{ plan.title }}</span>
          <span class="rail-plan-meta">{{ plan.totalHours || plan.lessons?.length || 0 }} 学时</span>
        </button>
      </div>
    </aside>

    <main class="course-design-main">
      <section class="course-design-input">
        <div class="input-copy">
          <h1>整门课程的宏观设计</h1>
          <p>先规划每个学时的主题、目标、要点和活动，再选择某一节课进入单节课 PPT 生成。</p>
        </div>
        <textarea
          v-model="prompt"
          :disabled="isBusy"
          placeholder="例如：我是一个高中普及人工智能通识教育的教师，总共需要16学时的课程，请为我安排每节课课时的教学设计。"
        />
        <div class="input-actions">
          <button class="secondary-btn" type="button" :disabled="isBusy" @click="fillExample">
            填入示例
          </button>
          <button class="primary-btn" type="button" :disabled="isBusy || !prompt.trim()" @click="createCourseDesign">
            {{ isBusy ? '生成中...' : '生成总体设计' }}
          </button>
        </div>
      </section>

      <section v-if="thinkingText || isBusy" class="thinking-panel">
        <div class="thinking-head">
          <span>思考过程</span>
          <span>{{ statusText }}</span>
        </div>
        <div class="thinking-body">{{ thinkingText || '正在连接课程设计流程...' }}</div>
      </section>

      <section v-if="clarificationMessage" class="clarification-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">需要补充</span>
            <h2>完善课程约束</h2>
          </div>
        </div>
        <div v-for="item in clarificationMessage.items" :key="item.key" class="clarification-item">
          <label>{{ item.question }}</label>
          <div class="option-row">
            <button
              v-for="option in getClarificationOptions(item)"
              :key="option.value"
              type="button"
              :class="['option-chip', { 'is-selected': clarificationMessage.answers[item.key] === option.value }]"
              :disabled="isBusy"
              @click="clarificationMessage.answers[item.key] = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <button class="primary-btn" type="button" :disabled="isBusy || !isClarificationComplete" @click="submitClarifications">
          提交补充信息
        </button>
      </section>

      <section v-if="currentPlan" class="plan-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">课程设计预览</span>
            <h2>{{ currentPlan.title }}</h2>
          </div>
          <div class="plan-stats">
            <span>{{ currentPlan.totalHours || currentPlan.lessons.length }} 学时</span>
            <span>{{ currentPlan.periodMinutes || 45 }} 分钟/学时</span>
          </div>
        </div>

        <div class="plan-summary">
          <div>
            <span>授课对象</span>
            <strong>{{ currentPlan.targetAudience || '未注明' }}</strong>
          </div>
          <div>
            <span>课程目标</span>
            <strong>{{ currentPlan.courseGoal || '通识启蒙' }}</strong>
          </div>
          <div>
            <span>评价方式</span>
            <strong>{{ currentPlan.assessmentText || '课堂表现、学习单与展示' }}</strong>
          </div>
        </div>

        <div class="objective-list" v-if="currentPlan.objectives?.length">
          <span v-for="objective in currentPlan.objectives" :key="objective">{{ objective }}</span>
        </div>

        <div class="lesson-grid">
          <article v-for="lesson in currentPlan.lessons" :key="lesson.key" class="lesson-card">
            <div class="lesson-card-head">
              <span>{{ lesson.hourIndex ? `第 ${lesson.hourIndex} 学时` : '课时' }}</span>
              <button type="button" @click="startSingleLesson(lesson)">生成本节课 PPT</button>
            </div>
            <h3>{{ lesson.title }}</h3>
            <p v-if="lesson.unitTitle">{{ lesson.unitTitle }}</p>
            <div class="lesson-tags">
              <span v-for="point in lesson.keyPoints.slice(0, 4)" :key="point">{{ point }}</span>
            </div>
          </article>
        </div>

        <div class="revision-box">
          <textarea
            v-model="revisionText"
            :disabled="isBusy"
            placeholder="对总体课程设计继续提修改意见，例如：把第2学时改成更多生活案例，减少编程要求。"
          />
          <div class="input-actions">
            <button class="secondary-btn" type="button" :disabled="!artifactLinks.length" @click="openFirstArtifact">
              下载课程设计文档
            </button>
            <button class="primary-btn" type="button" :disabled="isBusy || !revisionText.trim()" @click="revisePlan">
              {{ isBusy ? '修改中...' : '按自然语言修改' }}
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createCourseDesignSessionApi,
  fetchCourseDesignArtifactsApi,
  fetchCourseDesignPlanApi,
  fetchCourseDesignProgressStreamApi,
  fetchCourseDesignSessionApi,
  refreshCourseDesignProgressStreamApi,
  reviewCourseDesignPlanApi,
  submitCourseDesignClarificationsApi,
} from '@/api/ppt'
import { readCourseDesignPlans, upsertCourseDesignPlan } from '@/utils/courseDesignStore'

const POLL_INTERVAL_MS = 2500
const POLL_MAX_TIMES = 180

const router = useRouter()
const prompt = ref('')
const revisionText = ref('')
const isBusy = ref(false)
const statusText = ref('待开始')
const currentSessionId = ref('')
const currentPlan = ref(null)
const artifactLinks = ref([])
const storedPlans = ref(readCourseDesignPlans())
const clarificationMessage = ref(null)
const thinkingText = ref('')
const progressState = ref({ sessionId: '', nextOffset: 0, events: [] })
let progressTimer = null

const isClarificationComplete = computed(() => {
  const msg = clarificationMessage.value
  return Boolean(msg?.items?.length) && msg.items.every((item) => String(msg.answers[item.key] || '').trim())
})

function unwrapData(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload || {}
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTechnicalErrorMessage(message) {
  const text = String(message || '').trim()
  if (!text) return false
  return /SuperPPT|I\/O error|POST request|GET request|http:\/\/|https:\/\/|localhost|127\.0\.0\.1|\/sessions\/|\/api\/|Axios|ECONN|ETIMEDOUT|ENOTFOUND|Exception|java\.|stack trace|null$/i.test(
    text
  )
}

function getUserFacingErrorMessage(error, fallback = '操作没有成功，请稍后重试。') {
  const text = String(error?.userMessage || error?.message || '').trim()
  if (!text || isTechnicalErrorMessage(text)) return fallback
  return text
}

function fillExample() {
  prompt.value =
    '我是一个高中普及人工智能通识教育的教师，总共需要16学时的课程，请为我安排每节课课时的教学设计。每节课需要包含主题、目标、主要要点、教师活动、学生活动、评价方式和课后任务。'
}

function refreshStoredPlans() {
  storedPlans.value = readCourseDesignPlans()
}

function resetWorkspace() {
  prompt.value = ''
  revisionText.value = ''
  currentSessionId.value = ''
  currentPlan.value = null
  artifactLinks.value = []
  clarificationMessage.value = null
  thinkingText.value = ''
  statusText.value = '待开始'
  stopProgressPolling()
}

function normalizeSnapshot(payload) {
  const data = unwrapData(payload)
  return {
    ...data,
    sessionId: data.session_id || data.sessionId || '',
    planId: data.plan_id || data.planId || '',
    status: data.status || '',
    currentStage: data.current_stage || data.currentStage || '',
    nextAction: data.next_action || data.nextAction || '',
    clarificationItems: data.clarification_items || data.clarificationItems || [],
    clarificationQuestions: data.clarification_questions || data.clarificationQuestions || [],
  }
}

function getSnapshotPhase(snapshot) {
  if (!snapshot) return 'idle'
  if (snapshot.status === 'needs_clarification' || snapshot.nextAction === 'submit_clarifications') {
    return 'clarification'
  }
  if (snapshot.status === 'completed' || snapshot.nextAction === 'review_or_revise_plan') {
    return 'plan_review'
  }
  if (['failed', 'error'].includes(snapshot.status)) return 'failed'
  return 'poll'
}

function resolveProgressEventText(event) {
  if (!event) return ''
  if (typeof event === 'string') return event
  return String(
    event.text ||
      event.message ||
      event.content ||
      event.summary ||
      event.title ||
      event.stage_text ||
      ''
  ).trim()
}

async function pullProgressOnce(sessionId) {
  if (!sessionId) return
  const since =
    progressState.value.sessionId === sessionId && Number.isFinite(progressState.value.nextOffset)
      ? progressState.value.nextOffset
      : 0
  const payload = await fetchCourseDesignProgressStreamApi(sessionId, { since, limit: 50 })
  const data = unwrapData(payload)
  const events = Array.isArray(data.events) ? data.events : Array.isArray(data.data) ? data.data : []
  const nextOffset =
    data.next_since ?? data.nextSince ?? data.next_offset ?? data.nextOffset ?? data.cursor ?? data.since ?? data.offset

  if (progressState.value.sessionId !== sessionId) {
    progressState.value = { sessionId, nextOffset: 0, events: [] }
  }
  progressState.value.events = [...progressState.value.events, ...events.filter(Boolean)]
  if (nextOffset !== undefined && nextOffset !== null && nextOffset !== '') {
    progressState.value.nextOffset = Number(nextOffset) || progressState.value.nextOffset
  }
  thinkingText.value = progressState.value.events.map(resolveProgressEventText).filter(Boolean).join('\n')
}

function startProgressPolling(sessionId) {
  stopProgressPolling()
  progressState.value = { sessionId, nextOffset: 0, events: [] }
  refreshCourseDesignProgressStreamApi(sessionId, {}).catch(() => {})
  pullProgressOnce(sessionId).catch(() => {})
  progressTimer = setInterval(() => {
    pullProgressOnce(sessionId).catch(() => {})
  }, 1200)
}

function stopProgressPolling() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

async function pollUntilActionable(sessionId, initialPayload) {
  let snapshot = normalizeSnapshot(initialPayload || (await fetchCourseDesignSessionApi(sessionId)))
  for (let round = 0; round < POLL_MAX_TIMES; round += 1) {
    statusText.value = getStatusText(snapshot)
    if (getSnapshotPhase(snapshot) !== 'poll') return snapshot
    await wait(POLL_INTERVAL_MS)
    snapshot = normalizeSnapshot(await fetchCourseDesignSessionApi(sessionId))
  }
  throw new Error('课程设计生成超时，请稍后重试')
}

function getStatusText(snapshot) {
  const stage = snapshot?.currentStage || snapshot?.status || ''
  if (stage.includes('clarification')) return '等待补充信息'
  if (stage.includes('revise')) return '正在修改课程设计'
  if (stage.includes('export')) return '正在整理课程设计文档'
  if (stage.includes('generate')) return '正在生成课时规划'
  if (stage.includes('collect')) return '正在分析课程需求'
  return '正在处理'
}

function normalizeOptions(options) {
  const list = Array.isArray(options)
    ? options
    : String(options || '')
        .split(/[\/,，、|]/)
        .map((item) => item.trim())
        .filter(Boolean)
  return list.map((option) => {
    const label = typeof option === 'object' ? option.label || option.name || option.text || option.value : option
    const value = typeof option === 'object' ? option.value || option.key || option.id || label : option
    return { label: String(label || '').trim(), value: String(value || '').trim() }
  }).filter((item) => item.label && item.value)
}

function getClarificationOptions(item) {
  const options = normalizeOptions(item.options)
  if (options.length) return options
  if (/基础|学情|能力/.test(item.question)) {
    return normalizeOptions(['零基础', '有信息科技基础', '有编程基础', '水平差异较大'])
  }
  if (/目标|定位/.test(item.question)) {
    return normalizeOptions(['通识启蒙', '实践体验', '竞赛拓展', '综合项目'])
  }
  return normalizeOptions(['采用推荐设置'])
}

function extractClarifications(snapshot) {
  const items = snapshot.clarificationItems?.length
    ? snapshot.clarificationItems.map((item, index) => ({
        key: item.field || `question_${index + 1}`,
        field: item.field || '',
        question: item.question || `问题 ${index + 1}`,
        options: item.options || item.choices || [],
      }))
    : (snapshot.clarificationQuestions || []).map((question, index) => ({
        key: `question_${index + 1}`,
        field: '',
        question,
        options: [],
      }))
  clarificationMessage.value = {
    items,
    answers: Object.fromEntries(items.map((item) => [item.key, ''])),
  }
}

function flattenText(value) {
  if (Array.isArray(value)) return value.flatMap(flattenText)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(flattenText)
  }
  const text = String(value || '').trim()
  return text ? [text] : []
}

function normalizePlan(payload, sessionId = currentSessionId.value) {
  const data = unwrapData(payload)
  const preview = data.plan_preview || data.planPreview || data.preview || data
  const hours = Array.isArray(preview.hours) ? preview.hours : []
  const lessons = hours.map((hour, index) => {
    const hourIndex = hour.hour_index || hour.hourIndex || index + 1
    const title =
      hour.period_title || hour.periodTitle || hour.lesson_title || hour.lessonTitle || hour.title || `第 ${hourIndex} 学时`
    return {
      key: `${sessionId}-${hourIndex}`,
      hourIndex,
      title,
      unitTitle: hour.unit_title || hour.unitTitle || '',
      goals: flattenText(hour.goals || hour.objectives).slice(0, 6),
      keyPoints: flattenText(hour.key_points || hour.keyPoints || hour.points || hour.content).slice(0, 8),
      teacherActions: flattenText(hour.teacher_actions || hour.teacherActions).slice(0, 6),
      studentActivities: flattenText(hour.student_activities || hour.studentActivities).slice(0, 6),
      assessment: flattenText(hour.assessment || hour.evaluation).slice(0, 4),
      homework: flattenText(hour.homework || hour.after_class_task || hour.afterClassTask).slice(0, 4),
    }
  })

  return {
    id: sessionId || data.session_id || data.sessionId || data.plan_id || data.planId || `course-${Date.now()}`,
    sessionId: sessionId || data.session_id || data.sessionId || '',
    planId: data.plan_id || data.planId || sessionId || '',
    title: preview.course_title || preview.courseTitle || preview.title || '整门课程设计',
    topic: preview.topic || '',
    totalHours: preview.total_hours || preview.totalHours || lessons.length,
    periodMinutes: preview.period_minutes || preview.periodMinutes || 45,
    targetAudience: preview.target_audience || preview.targetAudience || '',
    learnerProfile: preview.learner_profile || preview.learnerProfile || '',
    courseGoal: preview.course_goal || preview.courseGoal || '',
    constraints: preview.teaching_constraints || preview.teachingConstraints || '',
    objectives: flattenText(preview.overall_objectives || preview.overallObjectives).slice(0, 8),
    overview: flattenText(preview.course_overview || preview.courseOverview).slice(0, 8),
    assessmentText: flattenText(preview.assessment_strategy || preview.assessmentStrategy).join('、'),
    lessons,
  }
}

function persistPlan(plan) {
  currentPlan.value = plan
  upsertCourseDesignPlan(plan)
  refreshStoredPlans()
}

async function fetchAndPersistPlan(sessionId) {
  const planPayload = await fetchCourseDesignPlanApi(sessionId)
  const plan = normalizePlan(planPayload, sessionId)
  persistPlan(plan)
  try {
    const artifacts = unwrapData(await fetchCourseDesignArtifactsApi(sessionId))
    const urls = artifacts.minio_download_urls || artifacts.minioDownloadUrls || {}
    artifactLinks.value = Object.values(urls).filter(Boolean)
    if (!artifactLinks.value.length && artifacts.download_url) artifactLinks.value = [artifacts.download_url]
  } catch (error) {
    artifactLinks.value = []
  }
}

async function presentSnapshot(snapshot) {
  const phase = getSnapshotPhase(snapshot)
  currentSessionId.value = snapshot.sessionId
  if (phase === 'clarification') {
    stopProgressPolling()
    statusText.value = '等待补充信息'
    extractClarifications(snapshot)
    return
  }
  if (phase === 'plan_review') {
    stopProgressPolling()
    statusText.value = '课程设计已生成'
    clarificationMessage.value = null
    await fetchAndPersistPlan(snapshot.sessionId)
    return
  }
  if (phase === 'failed') {
    stopProgressPolling()
    throw new Error(snapshot.error || '课程设计生成失败')
  }
}

async function createCourseDesign() {
  if (!prompt.value.trim()) return
  isBusy.value = true
  statusText.value = '正在创建课程设计任务'
  clarificationMessage.value = null
  currentPlan.value = null
  thinkingText.value = ''
  try {
    const response = await createCourseDesignSessionApi({
      user_input: prompt.value.trim(),
      user_assets: [],
      session_options: {
        session_id: `course_design_${Date.now()}`,
      },
    })
    const snapshot = normalizeSnapshot(response)
    if (!snapshot.sessionId) throw new Error('课程设计任务未返回 session_id')
    currentSessionId.value = snapshot.sessionId
    startProgressPolling(snapshot.sessionId)
    const finalSnapshot = await pollUntilActionable(snapshot.sessionId, response)
    await presentSnapshot(finalSnapshot)
  } catch (error) {
    console.warn('Course design generation failed:', error)
    ElMessage.error(getUserFacingErrorMessage(error, '课程设计生成失败，请稍后重试。'))
  } finally {
    isBusy.value = false
  }
}

async function submitClarifications() {
  const msg = clarificationMessage.value
  if (!msg || !isClarificationComplete.value || !currentSessionId.value) return
  isBusy.value = true
  statusText.value = '正在提交补充信息'
  const answers = Object.fromEntries(
    msg.items.map((item) => [item.field || item.key, String(msg.answers[item.key] || '').trim()])
  )
  try {
    const response = await submitCourseDesignClarificationsApi(currentSessionId.value, { answers })
    startProgressPolling(currentSessionId.value)
    const finalSnapshot = await pollUntilActionable(currentSessionId.value, response)
    await presentSnapshot(finalSnapshot)
  } catch (error) {
    console.warn('Course design clarification submit failed:', error)
    ElMessage.error(getUserFacingErrorMessage(error, '提交补充信息失败，请稍后重试。'))
  } finally {
    isBusy.value = false
  }
}

async function revisePlan() {
  if (!currentSessionId.value || !revisionText.value.trim()) return
  isBusy.value = true
  statusText.value = '正在修改课程设计'
  try {
    const response = await reviewCourseDesignPlanApi(currentSessionId.value, {
      action: 'revise',
      instructions: revisionText.value.trim(),
    })
    revisionText.value = ''
    const snapshot = normalizeSnapshot(response)
    if (snapshot.plan_preview || snapshot.planPreview) {
      persistPlan(normalizePlan(response, currentSessionId.value))
    } else {
      startProgressPolling(currentSessionId.value)
      const finalSnapshot = await pollUntilActionable(currentSessionId.value, response)
      await presentSnapshot(finalSnapshot)
    }
    ElMessage.success('课程设计已更新')
  } catch (error) {
    console.warn('Course design revision failed:', error)
    ElMessage.error(getUserFacingErrorMessage(error, '修改课程设计失败，请稍后重试。'))
  } finally {
    isBusy.value = false
  }
}

function loadStoredPlan(plan) {
  currentPlan.value = plan
  currentSessionId.value = plan.sessionId || plan.id
  artifactLinks.value = []
  clarificationMessage.value = null
}

function openFirstArtifact() {
  if (!artifactLinks.value.length) return
  window.open(artifactLinks.value[0], '_blank', 'noopener,noreferrer')
}

function startSingleLesson(lesson) {
  if (!currentPlan.value) return
  router.push({
    path: '/chat',
    query: {
      courseDesignId: currentPlan.value.id,
      lessonKey: lesson.key,
    },
  })
}

onMounted(() => {
  refreshStoredPlans()
  window.addEventListener('course-design-plans-updated', refreshStoredPlans)
})

onBeforeUnmount(() => {
  stopProgressPolling()
  window.removeEventListener('course-design-plans-updated', refreshStoredPlans)
})
</script>

<style scoped>
.course-design-page {
  display: flex;
  min-height: calc(100vh - 100px);
  background: #f7f9fc;
}

.course-design-rail {
  width: 280px;
  padding: 22px;
  background: #fff;
  border-right: 1px solid #e7ebf2;
}

.rail-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2a3d;
  margin-bottom: 14px;
}

.rail-primary,
.primary-btn,
.secondary-btn {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.rail-primary,
.primary-btn {
  background: #1769e0;
  color: #fff;
}

.rail-primary {
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
}

.rail-list {
  display: grid;
  gap: 8px;
}

.rail-plan {
  display: grid;
  gap: 4px;
  text-align: left;
  border: 1px solid #edf1f7;
  background: #fbfcff;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
}

.rail-plan.is-active {
  border-color: #1769e0;
  background: #eef5ff;
}

.rail-plan-title {
  font-weight: 700;
  color: #27364f;
}

.rail-plan-meta {
  font-size: 12px;
  color: #77849a;
}

.course-design-main {
  flex: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px;
}

.course-design-input,
.thinking-panel,
.clarification-card,
.plan-card {
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 10px 28px rgba(32, 54, 96, 0.05);
}

.input-copy h1,
.section-head h2 {
  margin: 0;
  color: #1f2a3d;
}

.input-copy p {
  margin: 8px 0 18px;
  color: #66758d;
}

textarea {
  width: 100%;
  min-height: 118px;
  resize: vertical;
  border: 1px solid #dfe6f1;
  border-radius: 10px;
  padding: 14px;
  line-height: 1.7;
  font: inherit;
  outline: none;
}

textarea:focus {
  border-color: #1769e0;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.primary-btn,
.secondary-btn {
  padding: 11px 16px;
}

.secondary-btn {
  background: #edf2f8;
  color: #24344d;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.thinking-head,
.section-head,
.plan-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.thinking-head {
  color: #526078;
  font-weight: 700;
  margin-bottom: 10px;
}

.thinking-body {
  white-space: pre-wrap;
  color: #5d687a;
  line-height: 1.7;
  border-left: 3px solid #d7dfec;
  padding-left: 14px;
}

.eyebrow {
  display: inline-block;
  color: #1769e0;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}

.plan-stats span {
  background: #eef4fb;
  color: #40516c;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 13px;
}

.plan-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.plan-summary div {
  background: #f7f9fc;
  border-radius: 8px;
  padding: 12px;
}

.plan-summary span {
  display: block;
  color: #768399;
  font-size: 12px;
  margin-bottom: 6px;
}

.plan-summary strong {
  color: #25344f;
}

.objective-list,
.lesson-tags,
.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.objective-list span,
.lesson-tags span,
.option-chip {
  background: #eef4fb;
  color: #41516c;
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 13px;
}

.lesson-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.lesson-card {
  border: 1px solid #e6ebf3;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.lesson-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: #6f7c91;
  font-size: 12px;
}

.lesson-card-head button {
  border: 0;
  border-radius: 7px;
  padding: 7px 9px;
  color: #1769e0;
  background: #eef5ff;
  cursor: pointer;
  font-weight: 700;
}

.lesson-card h3 {
  margin: 12px 0 6px;
  color: #23324a;
  font-size: 16px;
}

.lesson-card p {
  margin: 0 0 10px;
  color: #75839a;
}

.revision-box {
  margin-top: 20px;
  border-top: 1px solid #edf1f7;
  padding-top: 18px;
}

.clarification-item {
  margin: 14px 0;
}

.clarification-item label {
  display: block;
  font-weight: 700;
  color: #26364f;
  margin-bottom: 10px;
}

.option-chip {
  border: 1px solid transparent;
  cursor: pointer;
}

.option-chip.is-selected {
  background: #1769e0;
  color: #fff;
}

@media (max-width: 900px) {
  .course-design-page {
    display: block;
  }

  .course-design-rail {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid #e7ebf2;
  }

  .plan-summary {
    grid-template-columns: 1fr;
  }
}
</style>
