<template>
  <div class="split-layout">
    <!-- 左侧对话面板（老师与AI的交互） -->
    <div class="chat-panel">
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-list">
          <!-- 动态消息，增加 fileAttachment 判断 -->
          <div v-for="(msg, idx) in displayedMessages" :key="idx" class="message-wrapper">
            <div class="message" :class="msg.role" :style="{ animationDelay: `${idx * 0.1}s` }">
              <!-- 用户头像保持原样 -->
              <div class="avatar" v-if="msg.role === 'user'">👤</div>
              <!-- AI 头像使用 ThinkingLogo 组件，静态显示（思考完成态） -->
              <div class="avatar ai-avatar" v-else>
                <ThinkingLogo :is-thinking="false" />
              </div>
              <div class="bubble">{{ msg.content }}</div>
            </div>
            <!-- 如果该消息需要显示文件附件，则在气泡下方显示 -->
            <div v-if="msg.fileAttachment" class="file-attachment">
              <div class="file-card">
                <span class="file-icon">📽️</span>
                <span class="file-name">沁园春长沙.pptx</span>
                <span class="file-size">(2.3 MB)</span>
                <span class="download-icon" title="下载文件">⬇️</span>
              </div>
            </div>
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

    <!-- 右侧面板：PPT大纲缩略图(左) + 大图预览(右) - 优化滚动条分离 -->
    <div class="document-panel">
      <div class="doc-content">
        <h3>📽️ 幻灯片预览 · 《沁园春·长沙》课件</h3>

        <!-- 双栏预览布局：两个独立滚动区域 -->
        <div class="preview-layout">
          <!-- 左侧缩略图大纲 (占1/4，独立滚动) -->
          <div class="thumbnail-list" ref="thumbnailList">
            <div
              v-for="(img, index) in slideImages"
              :key="index"
              class="thumbnail-item"
              @click="scrollToLarge(index)"
            >
              <img :src="img.thumb" :alt="'缩略图' + (index + 1)" loading="lazy" />
              <span class="thumb-page">{{ index + 1 }}</span>
            </div>
          </div>

          <!-- 右侧大图预览 (占3/4，独立滚动) -->
          <div class="large-preview" ref="largePreviewContainer">
            <div
              v-for="(img, index) in slideImages"
              :key="index"
              class="large-item"
              :data-index="index"
            >
              <img :src="img.large" :alt="'幻灯片' + (index + 1)" loading="lazy" />
              <div class="page-number">{{ index + 1 }} / {{ slideImages.length }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import ThinkingLogo from '../ThinkingLogo.vue' // 请根据实际路径调整

// 使用 import.meta.glob 加载 pre_ppt 文件夹下的所有 png 图片（按顺序 ppt1.png ~ ppt24.png）
const imageModules = import.meta.glob('../../assets/images/pre_ppt/*.png', { eager: true })

// 提取路径并按文件名中的数字排序
const imagePaths = Object.keys(imageModules)
  .sort((a, b) => {
    const numA = parseInt(a.match(/ppt(\d+)\.png/)?.[1] || '0')
    const numB = parseInt(b.match(/ppt(\d+)\.png/)?.[1] || '0')
    return numA - numB
  })
  .map((key) => imageModules[key].default)

const slideImages = ref(imagePaths.map((src) => ({ large: src, thumb: src })))

// 对话流程：依据《沁园春·长沙》PPT内容设计，用户身份为老师
// 为第二条消息（AI的详细回复）增加 fileAttachment 属性
const conversationFlow = [
  {
    role: 'user',
    content:
      '我想制作一份关于毛泽东《沁园春·长沙》的语文教学PPT，需要涵盖词作原文、背景、意象分析、艺术特色和课堂练习，大概20多页。',
  },
  {
    role: 'ai',
    content:
      '好的老师。根据您的要求，我参考您提供的PPT素材，为您设计了24页的结构：\n1.封面\n2.导入·诗歌分类简表\n3.题解（沁园春·长沙）\n4.诵读全词\n5.整体感知·四幅图画（独立寒秋、湘江秋景、峥嵘岁月、中流击水）\n6.湘江秋景图（上阙：看万山红遍…）\n7.意象分析·从“看”字领起\n8.意象与意境（结合李可染画作）\n9.上阙小结\n10.峥嵘岁月图（下阙：恰同学少年…）\n11.中流击水图\n12.下阙小结\n13.当堂背诵（挖空练习）\n14.鉴赏拓展·秋诗对比\n15.艺术特色\n16.主题思想\n17.课堂讨论\n18-24.扩展与作业页。右侧预览区已生成全部缩略图。',
    fileAttachment: true, // 标记此消息下方显示文件附件
  },
  {
    role: 'user',
    content: '结构很专业。请在湘江秋景图那页强调意象与意境的关系，以及“万类霜天竞自由”的象征意义。',
  },
  {
    role: 'ai',
    content:
      '已补充。第7页详细分析了“万山红遍”“层林尽染”“鹰击长空”等意象，指出“竞自由”暗含对自由解放的向往。第8页加入“意象·意境”概念解析，并配以李可染《万山红遍》画作示意。您可以滚动右侧大图查看第7、8页细节。',
  },
  {
    role: 'user',
    content:
      '很好。我还想在最后增加一页“课堂讨论：秋天诗词比较”，对比马致远《天净沙·秋思》的意境。',
  },
  {
    role: 'ai',
    content:
      '没问题，已加入第23页，标题为“拓展·秋意对比”，并附上问题引导。第24页为课程结束语。现在全部24页已根据您上传的PPT内容填充完毕，所有图片均来自您的素材文件夹。',
  },
  {
    role: 'user',
    content: '太好了，这样学生就能通过意象深入理解词人的豪情了。',
  },
  {
    role: 'ai',
    content: '感谢老师认可！您可以在右侧预览每页具体内容，如需调整某页文字或顺序，随时告诉我。',
  },
]

const displayedMessages = ref([])
const isTyping = ref(false)
const isPlaying = ref(false)

// DOM 引用
const messagesContainer = ref(null)
const messagesEnd = ref(null)
const largePreviewContainer = ref(null)
const thumbnailList = ref(null)

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

const scrollToLarge = (index) => {
  if (largePreviewContainer.value) {
    const container = largePreviewContainer.value
    const items = container.children
    if (items && items[index]) {
      items[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

onMounted(() => {
  playConversation()
})

defineExpose({ resetAndPlay })
</script>

<style scoped>
/* 基础布局 */
.split-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  height: 600px;
  max-height: 600px;
  overflow: hidden;
}

/* 左侧对话面板样式 */
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

/* 消息包装，用于在消息下方显示文件附件 */
.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

/* 文件附件卡片样式 */
.file-attachment {
  display: flex;
  justify-content: flex-start;
  padding-left: 48px; /* 与气泡对齐（考虑头像宽度） */
}

.file-card {
  background-color: #f0f4f9;
  border: 1px solid #d4dee8;
  border-radius: 16px;
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2c3e50;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
  cursor: default;
}

.file-card:hover {
  background-color: #e6edf5;
}

.file-icon {
  font-size: 20px;
}

.file-name {
  font-weight: 500;
  color: #1a2b3c;
}

.file-size {
  color: #7f8c8d;
  font-size: 13px;
}

.download-icon {
  font-size: 16px;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.2s;
}

.download-icon:hover {
  opacity: 1;
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

/* 右侧文档面板：优化滚动条分离 */
.document-panel {
  background-color: #ffffff;
  border-radius: 24px;
  border: 1px solid #eaeef2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  padding: 24px;
  height: 100%;
  max-height: 100%;
  overflow: hidden; /* 父容器不滚动，由内部子容器滚动 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.doc-content {
  color: #1a2b3c;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.doc-content h3 {
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #2c3e50;
  border-bottom: 2px solid #f0f2f5;
  padding-bottom: 8px;
  flex-shrink: 0;
}

/* 双栏预览布局：左右两个独立滚动容器 */
.preview-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0; /* 关键：让子元素能正确收缩滚动 */
  height: 100%;
}

/* 左侧缩略图列表：独立滚动 */
.thumbnail-list {
  width: 25%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 8px;
  border: 1px solid #eaeef2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  height: 100%; /* 占满父容器高度 */
}

.thumbnail-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition:
    border 0.2s,
    transform 0.1s;
  flex-shrink: 0;
}

.thumbnail-item:hover {
  border-color: #3498db;
  transform: scale(1.02);
}

.thumbnail-item img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: 6px;
}

.thumb-page {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 12px;
  line-height: 1;
}

/* 右侧大图预览：独立滚动 */
.large-preview {
  width: 75%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 8px;
  border: 1px solid #eaeef2;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%; /* 占满父容器高度 */
}

.large-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  flex-shrink: 0;
}

.large-item img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  border: 1px solid #eaeef2;
}

.page-number {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
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
  .preview-layout {
    flex-direction: column;
  }
  .thumbnail-list {
    width: 100%;
    flex-direction: row;
    overflow-y: hidden;
    overflow-x: auto;
    padding: 12px;
    gap: 8px;
    height: 120px; /* 固定高度，横向滚动 */
  }
  .thumbnail-item {
    min-width: 100px;
    width: auto;
  }
  .large-preview {
    width: 100%;
    height: calc(100% - 140px); /* 减去缩略图区域和间距 */
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
  .thumbnail-item {
    min-width: 80px;
  }
  .file-attachment {
    padding-left: 48px;
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
}
</style>
