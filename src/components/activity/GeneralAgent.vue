<template>
  <div class="split-layout">
    <!-- 左侧对话面板：固定高度，内部滚动 -->
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

    <!-- 右侧面板：固定高度，内部滚动，展示智能体信息 -->
    <div class="document-panel" ref="documentPanel">
      <div class="doc-content">
        <h3>🤖 通用智能体 · 功能介绍</h3>

        <h4>✨ 核心能力</h4>
        <p>
          • <strong>多轮对话</strong>：自然流畅的上下文理解，支持复杂任务拆解。<br />
          • <strong>知识问答</strong>：涵盖科学、历史、文化、技术等广泛领域。<br />
          • <strong>文本生成</strong>：撰写邮件、报告、创意故事、代码片段等。<br />
          • <strong>逻辑推理</strong>：数学计算、数据分析、方案规划。<br />
          • <strong>学习辅助</strong>：解释概念、出题练习、学习路径建议。
        </p>

        <h4>📌 使用场景</h4>
        <p>
          • 日常办公助手<br />
          • 编程调试伙伴<br />
          • 语言学习陪练<br />
          • 创意灵感生成器<br />
          • 信息快速摘要
        </p>

        <h4>🔧 参数配置（开发中）</h4>
        <p>未来可在此调整模型参数，如温度、最大输出长度、角色设定等。敬请期待！</p>

        <div class="info-note">
          ⚡ 当前为演示模式，对话内容为预设示例。实际使用时将接入大语言模型 API。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import ThinkingLogo from '../ThinkingLogo.vue' // 请根据实际路径调整

// 通用智能体示例对话流程
const conversationFlow = [
  {
    role: 'user',
    content: '你好！听说你是一个通用智能体，能帮我做什么？',
  },
  {
    role: 'ai',
    content:
      '你好！我可以帮你解答问题、生成文本、提供建议、辅助学习等。比如写一封邮件、解释量子计算、制定旅行计划，或者只是聊聊天。',
  },
  {
    role: 'user',
    content: '太好了！你能帮我写一封申请实习的邮件吗？',
  },
  {
    role: 'ai',
    content:
      '当然可以。请告诉我你的姓名、目标岗位以及简单的个人优势，我会为你生成一封得体的申请邮件。',
  },
  {
    role: 'user',
    content: '我叫张三，申请前端开发实习生，我有React和Vue的项目经验。',
  },
  {
    role: 'ai',
    content:
      '好的，根据你提供的信息，我为你草拟了以下邮件内容：\n\n尊敬的招聘经理：\n\n您好！我是张三，目前是一名计算机科学专业的学生，对贵公司的前端开发实习生岗位非常感兴趣。我有过React和Vue的实际项目经验，能够快速融入团队并产出高质量的代码。附件是我的简历，期待您的回复。\n\n此致\n敬礼\n张三',
  },
  {
    role: 'user',
    content: '非常棒！再帮我解释一下什么是“区块链”？',
  },
  {
    role: 'ai',
    content:
      '区块链是一种去中心化的分布式账本技术。它由一系列按时间顺序相连的数据块组成，每个块包含一定数量的交易记录，并通过密码学方式保证不可篡改和不可伪造。最著名的应用是比特币，但区块链还可用于供应链追溯、数字身份、智能合约等领域。',
  },
  {
    role: 'user',
    content: '谢谢，你的回答很清晰！',
  },
  {
    role: 'ai',
    content: '不客气！有任何问题随时问我，我很乐意帮忙。',
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

  // 播放完成后 isPlaying 设为 false
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
/* 复用之前的样式，并添加与 DataAnalysis 一致的 AI 头像和思考指示器样式 */
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
  margin: 16px 0 8px 0;
  color: #34495e;
}

.doc-content p {
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0;
  color: #4a5a6e;
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
