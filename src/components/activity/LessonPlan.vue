<template>
  <div class="split-layout">
    <!-- 左侧对话面板：固定高度，内部滚动 -->
    <div class="chat-panel">
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-list">
          <!-- 动态消息 -->
          <template v-for="(msg, idx) in displayedMessages" :key="idx">
            <!-- 普通消息（非最后一条AI消息） -->
            <div
              v-if="!msg.isFinal"
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

            <!-- 最后一条AI消息（包含教案卡片组件） -->
            <div v-else class="message ai" :style="{ animationDelay: `${idx * 0.1}s` }">
              <!-- AI 头像使用 ThinkingLogo 组件，静态显示（思考完成态） -->
              <div class="avatar ai-avatar">
                <ThinkingLogo :is-thinking="false" />
              </div>
              <div class="bubble">
                <div>{{ msg.content }}</div>
                <!-- 教案摘要卡片组件 -->
                <div class="lesson-summary">
                  <div class="summary-header">
                    <span class="file-icon">📄</span>
                    <span class="file-name">教案摘要.docx</span>
                    <span class="download-icon">⬇️</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 思考指示器：完全使用 ThinkingLogo 组件的思考态 -->
          <div v-if="isTyping" class="thinking-message">
            <ThinkingLogo :is-thinking="true" />
          </div>

          <div ref="messagesEnd" class="scroll-anchor"></div>
        </div>
      </div>

      <!-- 底部输入框（只读演示） -->
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

    <!-- 右侧文档预览：固定高度，内部滚动（始终显示教案内容） -->
    <div class="document-panel" ref="documentPanel">
      <div class="doc-content">
        <h3>🎓 《人工智能导论》教案（大学通识课 · 2学时）</h3>

        <h4>一、教学目标</h4>
        <p>
          📚
          <strong>知识目标：</strong
          >了解人工智能的定义、发展简史及主要研究领域；理解机器学习的基本思想（监督学习、无监督学习）；熟悉AI在图像识别、自然语言处理等领域的典型应用。<br />
          💡
          <strong>能力目标：</strong
          >能够分析生活中AI应用的原理；通过体验式学习，初步建立"数据-模型-预测"的思维框架；能就AI伦理问题展开理性讨论。<br />
          ❤️ <strong>素养目标：</strong>培养对新兴科技的敏感度与批判性思维，树立科技向善的价值观。
        </p>

        <h4>二、教学重难点</h4>
        <p>
          🔴
          <strong>重点：</strong
          >机器学习的基本概念（训练、特征、模型）；AI主流应用的社会影响。<br />
          🔵 <strong>难点：</strong>理解神经网络的黑箱特性；辩证看待AI的机遇与挑战。
        </p>

        <h4>三、教学准备</h4>
        <p>
          📦 教师：多媒体课件（含AI发展时间轴、算法偏见短片）、Teachable
          Machine在线演示链接、分组讨论话题卡。<br />
          📦 学生：课前阅读一篇关于AlphaGo或ChatGPT的短文章，准备一个自己感兴趣的AI应用案例。
        </p>

        <h4>四、教学过程（90分钟）</h4>
        <p>
          <strong>1. 导入：图灵测试与AI之源（10分钟）</strong><br />
          &nbsp;&nbsp;🎥 播放1分钟电影片段《模仿游戏》引出图灵，简述图灵测试。<br />
          &nbsp;&nbsp;🗣️
          提问："如果一台机器能让你误以为它是人，它算有智能吗？"学生自由发言，教师总结AI的哲学起点。
        </p>
        <p>
          <strong>2. 核心概念：机器学习 ≠ 魔法（20分钟）</strong><br />
          &nbsp;&nbsp;📊 以"识别猫的照片"为例，讲解传统编程 vs. 机器学习：规则由数据自动发现。<br />
          &nbsp;&nbsp;📈
          简单介绍监督学习（带标签的数据）、无监督学习（聚类），避免数学公式，多用类比（如"教小孩认动物"）。<br />
          &nbsp;&nbsp;💡 强调"数据质量决定模型上限"。
        </p>
        <p>
          <strong>3. 案例与体验：让AI动手（25分钟）</strong><br />
          &nbsp;&nbsp;🖼️ 图像识别案例：展示ImageNet竞赛演变，现场用Teachable
          Machine训练手势识别（教师快速演示，学生分组在手机/电脑上尝试）。<br />
          &nbsp;&nbsp;🗣️
          NLP案例：对比早期ELIZA与现代ChatGPT的对话效果，讨论"理解"与"生成"的区别。<br />
          &nbsp;&nbsp;👥 学生分享自己准备的AI应用，教师简要点评。
        </p>
        <p>
          <strong>4. 深度思辨：AI伦理圆桌（20分钟）</strong><br />
          &nbsp;&nbsp;⚖️ 播放3分钟短片《算法偏见：当AI学会歧视》。<br />
          &nbsp;&nbsp;💬 分组讨论（每桌一个议题）：<br />
          &nbsp;&nbsp;&nbsp;&nbsp;· 议题1：自动驾驶的"电车难题"该由谁决定？<br />
          &nbsp;&nbsp;&nbsp;&nbsp;· 议题2：AI生成的内容，版权归谁？<br />
          &nbsp;&nbsp;&nbsp;&nbsp;· 议题3：人脸识别应否在公共场所禁用？<br />
          &nbsp;&nbsp;🎤 每组派代表发言，教师引导总结：技术中立，但使用需要伦理边界。
        </p>
        <p>
          <strong>5. 课程总结与延伸（10分钟）</strong><br />
          &nbsp;&nbsp;📌 回顾核心：AI = 数据 + 算法 + 算力；机器学习是当前AI的主流路径。<br />
          &nbsp;&nbsp;📌 推荐资源：在线课程（Andrew Ng的AI For Everyone）、书籍《人工智能简史》。<br />
          &nbsp;&nbsp;📌
          课后任务：选择一项AI服务（如推荐系统、语音助手），分析其可能的训练数据与潜在偏见，写200字短文。
        </p>

        <h4>五、板书设计</h4>
        <p
          style="
            font-family: monospace;
            background: #f4f7fa;
            padding: 16px;
            border-radius: 16px;
            line-height: 1.8;
          "
        >
          🧠 人工智能导论 · 思维蓝图<br />
          ─────────────────<br />
          📅 历史：图灵 → 达特茅斯 → 深度学习<br />
          ⚙️ 原理：数据 ➔ 训练 ➔ 模型 ➔ 预测<br />
          📦 分支：CV | NLP | 机器人 | 专家系统<br />
          ⚖️ 伦理：公平 · 透明 · 责任 · 向善<br />
          ─────────────────<br />
          🌐 "AI不会取代你，但会用AI的人会。"
        </p>

        <h4>六、教学反思（预设）</h4>
        <p>
          ✏️ 大学生对AI伦理话题参与度高，可适当延长辩论时间；Teachable
          Machine体验环节需提前确认网络畅通；部分文科生对"训练"概念仍感抽象，后续可引入"没有免费午餐定理"的通俗解释。建议布置小组项目：用现成AI工具（如Runway
          ML）创作一个小作品，激发创造力。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import ThinkingLogo from '../ThinkingLogo.vue' // 请根据实际路径调整

// 完整的对话流程
const conversationFlow = [
  {
    role: 'user',
    content:
      '我正在准备一门大学通识课《人工智能导论》，面向非计算机专业的学生。你能帮我设计一份教案吗？',
  },
  {
    role: 'ai',
    content:
      '当然可以！对于非专业学生，我们可以从概念、原理、应用和伦理四个维度展开。您希望更侧重理论还是实践？',
  },
  {
    role: 'user',
    content: '理论为主，但也要有直观的案例和简单动手环节，让学生感受到AI的"能"与"不能"。',
  },
  {
    role: 'ai',
    content:
      '好的，我初步构思了一个框架：\n1. 导入：图灵测试与AI历史剪影\n2. 核心概念：机器学习、神经网络（比喻式讲解）\n3. 案例演示：图像识别/自然语言处理经典应用\n4. 动手体验：用Google Colab运行简单的线性回归（代码已写好，学生只需点击运行）\n5. 伦理辩论：算法偏见、AI与就业\n您觉得如何？',
  },
  {
    role: 'user',
    content: '框架很好！但代码部分可能太难，能否换成更简单的AI体验平台，比如Teachable Machine？',
  },
  {
    role: 'ai',
    content:
      '没问题，改成Teachable Machine手势识别体验，学生只需上传几张图片就能看到模型训练过程，非常适合非专业学生理解"数据-训练-模型"的关系。',
  },
  {
    role: 'user',
    content: '完美！请把详细教案写出来，包括课时分配、板书和课后思考题。',
  },
  {
    role: 'ai',
    content:
      '已生成完整教案，涵盖教学目标、重难点、详细过程、板书设计及拓展资源，请您查阅右侧预览。',
    isFinal: true, // 标记为最后一条，使用特殊渲染
  },
]

const displayedMessages = ref([])
const isTyping = ref(false)
const isPlaying = ref(false)

// DOM 引用
const messagesContainer = ref(null)
const messagesEnd = ref(null)

// 睡眠函数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 滚动到底部（仅容器内滚动）
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

// 播放对话动画
const playConversation = async () => {
  for (let i = 0; i < conversationFlow.length; i++) {
    const msg = conversationFlow[i]

    // AI 消息前显示"正在输入"
    if (msg.role === 'ai') {
      isTyping.value = true
      await scrollToBottom()
      await sleep(800 + Math.random() * 600) // 模拟思考时间
      isTyping.value = false
    } else {
      await sleep(600) // 用户"输入"时间
    }

    // 添加消息
    displayedMessages.value.push(msg)

    await scrollToBottom()
    await sleep(1000) // 消息间隔
  }

  // 播放完成后 isPlaying 设为 false（如果需要）
  isPlaying.value = false
}

// 重置并重新播放（暴露给父组件）
const resetAndPlay = () => {
  displayedMessages.value = []
  isTyping.value = false
  isPlaying.value = true
  playConversation()
}

// 组件挂载时自动开始
onMounted(() => {
  playConversation()
})

// 暴露方法给父组件
defineExpose({ resetAndPlay })
</script>

<style scoped>
/* 左右分栏布局：固定高度，防止撑开 */
.split-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  height: 600px; /* 统一总高度 */
  max-height: 600px;
  overflow: hidden; /* 防止内部溢出影响布局 */
}

/* 左侧对话面板 */
.chat-panel {
  background-color: #f8fafc;
  border-radius: 24px;
  border: 1px solid #eaeef2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%; /* 撑满父容器 */
  max-height: 100%;
  box-sizing: border-box; /* 关键：height包含border */
}

/* 消息容器 - 可滚动区域 */
.messages-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d0d9e0 transparent;
  /* 预留滚动条空间，防止宽度变化导致晃动 */
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

/* 单条消息 */
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

/* 滚动锚点（不可见） */
.scroll-anchor {
  height: 0;
  margin: 0;
  padding: 0;
}

/* 底部输入区域 */
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

/* 右侧文档面板 */
.document-panel {
  background-color: #ffffff;
  border-radius: 24px;
  border: 1px solid #eaeef2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  padding: 24px;
  height: 100%; /* 撑满父容器 */
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d0d9e0 transparent;
  scrollbar-gutter: stable; /* 预留滚动条空间，防晃动 */
  box-sizing: border-box; /* 关键：height包含padding和border */
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

/* 文档内容 */
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
  margin: 16px 0 8px 0;
  color: #34495e;
}

.doc-content p {
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0;
  color: #4a5a6e;
}

/* 教案摘要卡片 */
.lesson-summary {
  margin-top: 12px;
  border: 2px solid #b1d5ec; /* 醒目的蓝色边框 */
  border-radius: 12px;
  background-color: #f0f7ff; /* 浅蓝色背景，与边框呼应 */
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影增加立体感 */
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.summary-header .file-icon {
  font-size: 20px;
}

.summary-header .file-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.summary-header .download-icon {
  font-size: 16px;
  color: #3498db;
  cursor: pointer;
  transition: transform 0.2s;
}

.summary-header .download-icon:hover {
  transform: translateY(2px);
  color: #2980b9;
}

/* 响应式布局 */
@media (max-width: 968px) {
  .split-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 300px 400px;
    height: auto;
    max-height: none;
    gap: 16px;
  }

  .chat-panel {
    height: 300px;
    max-height: 300px;
  }

  .document-panel {
    height: 400px;
    max-height: 400px;
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
}

@media (max-width: 480px) {
  .split-layout {
    grid-template-rows: 250px 350px;
  }

  .chat-panel {
    height: 250px;
    max-height: 250px;
  }

  .document-panel {
    height: 350px;
    max-height: 350px;
  }

  .bubble {
    max-width: 90%;
  }
}
</style>
