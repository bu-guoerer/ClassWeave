<script setup>
import { ref, onMounted, nextTick } from 'vue'
import ThinkingLogo from '../ThinkingLogo.vue' // 请根据实际路径调整

// 常见问题问答数据（源自 image.png）
const faqFlow = [
  {
    role: 'user',
    content: 'ClassWeave织课 与其他 AI 演示文稿生成器（如 Gamma、Manus 或 Genspark）有何本质区别？',
  },
  {
    role: 'ai',
    content:
      '核心区别在于我们的底层技术。其他工具采用基于网页的格式（HTML），在 PPTX 转换时易出错且限制编辑，而 ClassWeave织课 从一开始就生成原生、结构化的演示文稿文件。这确保了卓越的编辑能力、可编辑图表、严格遵循模板以及完美导出。',
  },
  {
    role: 'user',
    content: '我可以使用我上传的 PowerPoint 模板吗？',
  },
  {
    role: 'ai',
    content:
      '是的，ClassWeave织课 在这方面表现出色。上传你现有的 PPTX 模板，我们的 AI 会在生成新幻灯片时智能遵循其样式、主版式、字体和配色方案。',
  },
  {
    role: 'user',
    content: '图表导出到 PowerPoint 后可以编辑吗？',
  },
  {
    role: 'ai',
    content:
      '当然可以。ClassWeave织课 可创建原生图表对象。当你在 PowerPoint 中打开 PPTX 文件时，可双击图表编辑底层数据，就像编辑手动创建的图表一样。',
  },
  {
    role: 'user',
    content: 'AI 生成后，我可以手动编辑幻灯片吗？',
  },
  {
    role: 'ai',
    content:
      '是的。我们相信人机协作的力量。ClassWeave织课 提供了一个功能齐全的编辑器，让你在 AI 首次生成内容后能够修改布局、插入形状、添加新幻灯片，并对每一处细节进行微调。',
  },
]

const displayedMessages = ref([])
const isTyping = ref(false)
const messagesContainer = ref(null)
const messagesEnd = ref(null)

// 睡眠函数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

// 播放问答动画
const playConversation = async () => {
  for (let i = 0; i < faqFlow.length; i++) {
    const msg = faqFlow[i]

    // AI 回答前显示“正在输入”动画
    if (msg.role === 'ai') {
      isTyping.value = true
      await scrollToBottom()
      await sleep(800 + Math.random() * 600) // 模拟思考时间
      isTyping.value = false
    } else {
      await sleep(400) // 用户问题间隔稍短
    }

    // 添加消息
    displayedMessages.value.push(msg)
    await scrollToBottom()
    await sleep(1000) // 每条消息停留时间
  }
}

// 组件挂载时自动播放
onMounted(() => {
  playConversation()
})
</script>

<template>
  <div class="simplequestions">
    <div class="title">常见问题解答</div>
    <div class="answer">
      <!-- 消息列表容器（仿 GeneralAgent 左侧面板） -->
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-list">
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

          <!-- 滚动锚点 -->
          <div ref="messagesEnd" class="scroll-anchor"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础重置（仅作用于本组件，避免干扰全局） */
.simplequestions * {
  box-sizing: border-box;
}

.simplequestions {
  width: 100%;
  min-height: 900px; /* 改为最小高度，适应内容 */
  height: auto;
  background-color: #ffffff; /* 柔和背景，替代原来的 skyblue */
}

.simplequestions .title {
  padding-top: 50px;
  width: 100%;
  height: 150px;
  font-size: 50px;
  font-weight: 300;
  text-align: center;
  color: #1a2b3c;
}

/* answer 盒子改造为 flex 列，内部滚动 */
.simplequestions .answer {
  margin: 10px auto;
  width: 70%;
  height: 700px; /* 保持原固定高度，内部滚动 */
  border: 1px solid #e0e7ed;
  border-radius: 24px;
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 隐藏溢出，由内部容器滚动 */
  padding: 0; /* 去掉内边距，让消息容器填满 */
}

/* 消息容器：滚动区域 */
.simplequestions .messages-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d0d9e0 transparent;
  scrollbar-gutter: stable;
}

.simplequestions .messages-container::-webkit-scrollbar {
  width: 6px;
}
.simplequestions .messages-container::-webkit-scrollbar-track {
  background: transparent;
}
.simplequestions .messages-container::-webkit-scrollbar-thumb {
  background-color: #d0d9e0;
  border-radius: 3px;
}
.simplequestions .messages-container::-webkit-scrollbar-thumb:hover {
  background-color: #b0c0d0;
}

/* 消息列表 */
.simplequestions .messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: min-content;
}

/* 单条消息 */
.simplequestions .message {
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

/* 用户消息右对齐 */
.simplequestions .message.user {
  flex-direction: row-reverse;
}

/* 普通头像样式（用户） */
.simplequestions .avatar {
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
.simplequestions .message.ai .avatar.ai-avatar {
  width: auto;
  height: auto;
  background: transparent;
  box-shadow: none;
  padding: 0;
  margin-right: 8px;
}

.simplequestions .message.user .avatar {
  background-color: #e1f5fe;
}

/* 气泡 */
.simplequestions .bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  font-size: 15px;
  line-height: 1.6;
  color: #1a2b3c;
  word-break: break-word;
  white-space: pre-wrap; /* 保留回答中的换行 */
}

.simplequestions .message.user .bubble {
  background-color: #d9f0fe;
  border-bottom-right-radius: 4px;
}

.simplequestions .message.ai .bubble {
  background-color: #ffffff;
  border-bottom-left-radius: 4px;
}

/* 思考指示器：完全使用 ThinkingLogo 组件思考态，无需额外气泡 */
.simplequestions .thinking-message {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 8px 0 8px 12px;
}

/* 滚动锚点 */
.simplequestions .scroll-anchor {
  height: 0;
  margin: 0;
  padding: 0;
}

/* ---------- 移动端适配 ---------- */
@media (max-width: 968px) {
  .simplequestions .answer {
    width: 85%;
  }
}

@media (max-width: 768px) {
  .simplequestions {
    min-height: 800px;
  }

  .simplequestions .title {
    padding-top: 40px;
    height: 120px;
    font-size: 36px;
  }

  .simplequestions .answer {
    width: 92%;
    height: 600px;
    margin: 0 auto;
  }

  .simplequestions .bubble {
    max-width: 85%;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .simplequestions .title {
    padding-top: 30px;
    height: 100px;
    font-size: 28px;
  }

  .simplequestions .answer {
    height: 550px;
  }

  .simplequestions .bubble {
    max-width: 90%;
    font-size: 13px;
  }

  .simplequestions .avatar {
    width: 30px;
    height: 30px;
    font-size: 18px;
  }
}
</style>
