<template>
  <div class="split-layout">
    <!-- 左侧对话面板（老师与AI的交互） -->
    <div class="chat-panel">
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-list">
          <!-- 动态消息 -->
          <div
            v-for="(msg, idx) in displayedMessages"
            :key="idx"
            class="message"
            :class="msg.role"
            :style="{ animationDelay: `${idx * 0.1}s` }"
          >
            <!-- 用户头像保持原样 -->
            <div class="avatar" v-if="msg.role === 'user'">👤</div>
            <!-- AI 头像使用 ThinkingLogo 组件，静态显示（思考完成态） -->
            <div class="avatar ai-avatar" v-else>
              <ThinkingLogo :is-thinking="false" />
            </div>
            <div class="bubble">{{ msg.content }}</div>
          </div>

          <!-- 思考指示器：完全使用 ThinkingLogo 组件的思考态 -->
          <div v-if="isTyping" class="thinking-message">
            <ThinkingLogo :is-thinking="true" />
          </div>

          <div ref="messagesEnd" class="scroll-anchor"></div>
        </div>
      </div>

      <!-- 只读输入框（演示用） -->
      <div class="input-area">
        <input
          type="text"
          :placeholder="isPlaying ? 'AI正在思考中...' : '请输入您的需求...'"
          readonly
        />
        <button :disabled="isPlaying">
          {{ isPlaying ? '思考中...' : '发送' }}
        </button>
      </div>
    </div>

    <!-- 右侧数据分析面板（独立滚动） -->
    <div class="document-panel">
      <div class="doc-content">
        <h3>📊 教学数据分析 · 班级概览</h3>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-label">学生总数</div>
            <div class="stat-value">48</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-label">平均分</div>
            <div class="stat-value">82.5</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-label">作业提交率</div>
            <div class="stat-value">94%</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-label">课堂参与率</div>
            <div class="stat-value">78%</div>
          </div>
        </div>

        <!-- 成绩分布柱状图（分布直方图） -->
        <h4>📈 成绩分布（分数段人数）</h4>
        <div class="chart-container">
          <div class="bar-item" v-for="(item, index) in gradeDistribution" :key="index">
            <span class="bar-label">{{ item.range }}</span>
            <div class="bar-wrapper">
              <div class="bar-fill" :style="{ width: item.percentage + '%' }"></div>
            </div>
            <span class="bar-value">{{ item.count }}人</span>
          </div>
        </div>

        <!-- 新增：学生等级占比饼状图 -->
        <h4>🥧 学生等级占比</h4>
        <div class="pie-container">
          <div class="pie-chart" :style="{ background: pieConicGradient }"></div>
          <div class="pie-legend">
            <div v-for="(item, index) in gradeLevels" :key="index" class="legend-item">
              <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.percentage }}% ({{ item.count }}人)</span>
            </div>
          </div>
        </div>

        <!-- 最近五次作业平均分趋势（折线图） -->
        <h4>📉 近五次作业平均分趋势</h4>
        <div class="trend-container">
          <div class="trend-line">
            <div
              v-for="(score, idx) in homeworkTrend"
              :key="idx"
              class="trend-point"
              :style="{ left: idx * 25 + '%', bottom: (score / 100) * 100 + '%' }"
            >
              <span class="trend-tooltip">{{ score }}分</span>
            </div>
            <div class="trend-axis"></div>
          </div>
          <div class="trend-labels">
            <span v-for="(label, idx) in homeworkLabels" :key="idx">{{ label }}</span>
          </div>
        </div>

        <!-- 学生表现列表（前五/后五） -->
        <h4>🏆 学生表现亮点</h4>
        <div class="student-lists">
          <div class="student-list">
            <div class="list-title">⭐ 前五名</div>
            <div v-for="(s, idx) in topStudents" :key="idx" class="student-item">
              <span>{{ s.name }}</span>
              <span class="student-score">{{ s.score }}分</span>
            </div>
          </div>
          <div class="student-list">
            <div class="list-title">📌 后五名（需关注）</div>
            <div v-for="(s, idx) in bottomStudents" :key="idx" class="student-item">
              <span>{{ s.name }}</span>
              <span class="student-score">{{ s.score }}分</span>
            </div>
          </div>
        </div>

        <div class="info-note">⚡ 数据为模拟演示，实际接入后可实现实时教学数据分析。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import ThinkingLogo from '../ThinkingLogo.vue' // 请根据实际路径调整

// 模拟对话流程（老师与AI关于数据分析的交互）
const conversationFlow = [
  {
    role: 'user',
    content: '最近班级的语文学习情况怎么样？能给我一些数据分析吗？',
  },
  {
    role: 'ai',
    content:
      '好的老师。我整理了班级近期的学习数据，包括成绩分布、作业完成率和课堂参与情况。右侧面板已生成可视化报告，您可以直观了解整体表现。',
  },
  {
    role: 'user',
    content: '这次期中考试的成绩分布如何？',
  },
  {
    role: 'ai',
    content:
      '期中考试平均分82.5，优秀率（90分以上）为25%，及格率91%。从分布看，70-89分段人数最多，占52%。柱状图在右侧第一块区域。',
  },
  {
    role: 'user',
    content: '有哪些学生进步明显或者需要特别关注？',
  },
  {
    role: 'ai',
    content:
      '王小明、李思琪等同学较上次提高了10分以上；赵小萌、陈宇轩等同学近期作业提交不及时，建议单独沟通。右侧列表展示了前五名和后五名。',
  },
  {
    role: 'user',
    content: '作业提交率比上周有提升吗？',
  },
  {
    role: 'ai',
    content:
      '是的，上周提交率89%，本周升至94%，课堂参与度也从72%提升到78%，整体趋势向好。近五次作业平均分趋势图在右侧展示，可以看到稳步上升。',
  },
  {
    role: 'user',
    content: '非常好，这样我就能针对性地调整教学了。',
  },
  {
    role: 'ai',
    content: '很高兴能帮到您！有任何需要深入分析的地方，随时告诉我。',
  },
]

// 模拟数据
const gradeDistribution = ref([
  { range: '90-100', count: 12, percentage: 25 },
  { range: '80-89', count: 18, percentage: 37.5 },
  { range: '70-79', count: 10, percentage: 20.8 },
  { range: '60-69', count: 6, percentage: 12.5 },
  { range: '0-59', count: 2, percentage: 4.2 },
])

const homeworkTrend = ref([78, 81, 79, 84, 86]) // 最近五次平均分
const homeworkLabels = ref(['作业1', '作业2', '作业3', '作业4', '作业5'])

const topStudents = ref([
  { name: '李华', score: 98 },
  { name: '张敏', score: 96 },
  { name: '王小明', score: 94 },
  { name: '赵雅', score: 92 },
  { name: '陈晨', score: 91 },
])

const bottomStudents = ref([
  { name: '刘东', score: 58 },
  { name: '孙莉', score: 62 },
  { name: '周杰', score: 63 },
  { name: '吴茜', score: 65 },
  { name: '郑爽', score: 67 },
])

// 新增饼状图数据：学生等级占比
const gradeLevels = ref([
  { label: '优秀 (90分以上)', count: 12, percentage: 25, color: '#2ecc71' },
  { label: '良好 (80-89分)', count: 18, percentage: 37.5, color: '#3498db' },
  { label: '及格 (60-79分)', count: 16, percentage: 33.3, color: '#f39c12' },
  { label: '不及格 (60分以下)', count: 2, percentage: 4.2, color: '#e74c3c' },
])

// 计算饼图的 conic-gradient 背景
const pieConicGradient = computed(() => {
  let cumulative = 0
  const stops = gradeLevels.value.map((item) => {
    const start = cumulative
    cumulative += item.percentage
    return `${item.color} ${start}% ${cumulative}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

const displayedMessages = ref([])
const isTyping = ref(false)
const isPlaying = ref(false)

// DOM 引用
const messagesContainer = ref(null)
const messagesEnd = ref(null)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

const playConversation = async () => {
  for (let i = 0; i < conversationFlow.length; i++) {
    const msg = conversationFlow[i]

    if (msg.role === 'ai') {
      isTyping.value = true
      await scrollToBottom()
      await sleep(800 + Math.random() * 600)
      isTyping.value = false
    } else {
      await sleep(600)
    }

    displayedMessages.value.push(msg)
    await scrollToBottom()
    await sleep(1000)
  }
  isPlaying.value = false
}

const resetAndPlay = () => {
  displayedMessages.value = []
  isTyping.value = false
  isPlaying.value = true
  playConversation()
}

onMounted(() => {
  playConversation()
})

defineExpose({ resetAndPlay })
</script>

<style scoped>
/* 复用之前的分栏布局样式，并添加数据分析专属样式 */
.split-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  height: 600px;
  max-height: 600px;
  overflow: hidden;
}

.chat-panel {
  background-color: #f8fafc;
  border-radius: 24px;
  border: 1px solid #eaeef2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
}

.messages-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d0d9e0 transparent;
  scrollbar-gutter: stable;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}
.messages-container::-webkit-scrollbar-thumb {
  background-color: #d0d9e0;
  border-radius: 3px;
}
.messages-container::-webkit-scrollbar-thumb:hover {
  background-color: #b0c0d0;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: min-content;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  opacity: 0;
  animation: slideIn 0.4s ease forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

/* 普通头像样式（用户） */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

/* AI 头像专用样式：去除背景和阴影，让 ThinkingLogo 组件完整展示 */
.message.ai .avatar.ai-avatar {
  width: auto;
  height: auto;
  background: transparent;
  box-shadow: none;
  padding: 0;
  margin-right: 8px;
}

.message.user .avatar {
  background-color: #e1f5fe;
}

.bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  font-size: 15px;
  line-height: 1.6;
  color: #1a2b3c;
  word-break: break-word;
}

.message.user .bubble {
  background-color: #d9f0fe;
  border-bottom-right-radius: 4px;
}

.message.ai .bubble {
  background-color: #ffffff;
  border-bottom-left-radius: 4px;
}

/* 思考指示器：完全使用 ThinkingLogo 组件思考态，无需额外气泡 */
.thinking-message {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 8px 0 8px 12px;
}

.scroll-anchor {
  height: 0;
  margin: 0;
  padding: 0;
}

.input-area {
  display: flex;
  padding: 16px 24px;
  border-top: 1px solid #eaeef2;
  background-color: #f8fafc;
  gap: 8px;
  flex-shrink: 0;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d0d9e0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  background-color: #ffffff;
  color: #7f8c8d;
  cursor: default;
  transition: all 0.3s;
}

.input-area input:read-only {
  background-color: #f1f4f7;
  border-color: #d0d9e0;
  color: #7f8c8d;
}

.input-area button {
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  background-color: #e0e7ed;
  color: #a0b3c6;
  font-size: 14px;
  font-weight: 500;
  cursor: default;
  transition: all 0.3s;
  white-space: nowrap;
}

.input-area button:not(:disabled) {
  background-color: #3498db;
  color: white;
  cursor: pointer;
}

/* 右侧文档面板（独立滚动） */
.document-panel {
  background-color: #ffffff;
  border-radius: 24px;
  border: 1px solid #eaeef2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  padding: 24px;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d0d9e0 transparent;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}

.document-panel::-webkit-scrollbar {
  width: 6px;
}
.document-panel::-webkit-scrollbar-track {
  background: transparent;
}
.document-panel::-webkit-scrollbar-thumb {
  background-color: #d0d9e0;
  border-radius: 3px;
}
.document-panel::-webkit-scrollbar-thumb:hover {
  background-color: #b0c0d0;
}

.doc-content {
  color: #1a2b3c;
  min-height: 100%;
}

.doc-content h3 {
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #2c3e50;
  border-bottom: 2px solid #f0f2f5;
  padding-bottom: 8px;
}

.doc-content h4 {
  font-size: 16px;
  margin: 24px 0 12px 0;
  color: #34495e;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  border: 1px solid #eaeef2;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

/* 柱状图 */
.chart-container {
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #eaeef2;
  margin-bottom: 24px;
}

.bar-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.bar-label {
  width: 70px;
  font-size: 14px;
  color: #4a5a6e;
}

.bar-wrapper {
  flex: 1;
  height: 24px;
  background-color: #e0e7ed;
  border-radius: 12px;
  margin: 0 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 12px;
  transition: width 0.3s;
}

.bar-value {
  width: 45px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

/* 饼状图容器 */
.pie-container {
  display: flex;
  align-items: center;
  gap: 24px;
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #eaeef2;
  margin-bottom: 24px;
}

.pie-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    #2ecc71 0% 25%,
    #3498db 25% 62.5%,
    #f39c12 62.5% 95.8%,
    #e74c3c 95.8% 100%
  );
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a5a6e;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-label {
  width: 110px;
}

.legend-value {
  font-weight: 500;
  color: #2c3e50;
}

/* 趋势图（模拟折线） */
.trend-container {
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 24px 16px 16px 16px;
  border: 1px solid #eaeef2;
  margin-bottom: 24px;
  position: relative;
  height: 160px;
}

.trend-line {
  position: relative;
  height: 100px;
  border-bottom: 2px solid #d0d9e0;
  border-left: 2px solid #d0d9e0;
  margin-left: 20px;
  margin-right: 20px;
}

.trend-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #3498db;
  border-radius: 50%;
  transform: translateX(-50%);
  cursor: default;
  transition: transform 0.2s;
}

.trend-point:hover {
  transform: translateX(-50%) scale(1.5);
  background-color: #e67e22;
}

.trend-point:hover .trend-tooltip {
  display: block;
}

.trend-tooltip {
  display: none;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2c3e50;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.trend-axis {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;
  border-top: 1px dashed #cbd5e0;
}

.trend-labels {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
  padding: 0 10px;
}

/* 学生列表双栏 */
.student-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.student-list {
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #eaeef2;
}

.list-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e7ed;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #4a5a6e;
}

.student-item:not(:last-child) {
  border-bottom: 1px dashed #e0e7ed;
}

.student-score {
  font-weight: 500;
  color: #2c3e50;
}

.info-note {
  margin-top: 24px;
  padding: 12px 16px;
  background-color: #f0f7ff;
  border-left: 4px solid #3498db;
  border-radius: 8px;
  font-size: 14px;
  color: #2c3e50;
}

/* 响应式 */
@media (max-width: 968px) {
  .split-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 300px 500px;
    height: auto;
    max-height: none;
    gap: 16px;
  }

  .chat-panel {
    height: 300px;
    max-height: 300px;
  }

  .document-panel {
    height: 500px;
    max-height: 500px;
  }
}

@media (max-width: 768px) {
  .bubble {
    max-width: 85%;
    font-size: 14px;
  }

  .input-area {
    padding: 12px 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pie-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .pie-chart {
    align-self: center;
  }

  .legend-item {
    flex-wrap: wrap;
  }

  .legend-label {
    width: auto;
  }

  .student-lists {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .split-layout {
    grid-template-rows: 250px 450px;
  }

  .chat-panel {
    height: 250px;
    max-height: 250px;
  }

  .document-panel {
    height: 450px;
    max-height: 450px;
  }

  .bubble {
    max-width: 90%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
