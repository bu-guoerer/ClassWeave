<template>
  <div class="template-page">
    <!-- 顶部导航和分类 Tab -->
    <header class="tpl-header">
      <div class="header-top">
        <button class="back-btn" @click="goBack">◀ 返回工作台</button>
      </div>
      <div class="tab-list">
        <div 
          v-for="tab in tabs" 
          :key="tab"
          :class="['tab-item', { active: currentTab === tab }]"
          @click="currentTab = tab"
        >
          {{ tab }}
        </div>
        <div class="tab-divider"></div>
        <div class="tab-item my-tpl">
          <span>🔔 我的模板</span>
        </div>
      </div>
    </header>

    <!-- 模板网格内容区 -->
    <div class="tpl-content">
      <div class="tpl-grid">
        
        <!-- 特殊卡片 1：上传 PPTX -->
        <div class="tpl-card special-card">
          <div class="special-cover">
            <div class="icon-circle ppt-icon">P</div>
          </div>
          <div class="special-title">上传 PPTX 文件作为模板</div>
        </div>

        <!-- 特殊卡片 2：创建空白文档 -->
        <div class="tpl-card special-card">
          <div class="special-cover">
            <div class="icon-circle add-icon">+</div>
          </div>
          <div class="special-title">创建空白文档</div>
        </div>

        <!-- 真实模板卡片 -->
        <div class="tpl-card" v-for="tpl in filteredTemplates" :key="tpl.id">
          <div class="tpl-cover-wrapper">
            <!-- 模板封面图 -->
            <img :src="tpl.cover" class="tpl-cover" :alt="tpl.title">
            
            <!-- 悬浮遮罩层 (Hover Mask) -->
            <div class="hover-mask">
              <button class="use-btn" @click="useTemplate(tpl)">使用模板</button>
              <button class="preview-btn" title="预览" @click="previewTemplate(tpl)">👁️</button>
            </div>
          </div>
          
          <!-- 模板信息 -->
          <div class="tpl-info">
            <h4 class="tpl-title">{{ tpl.title }}</h4>
            <div class="tpl-meta">
              <span class="tpl-tag">Slides</span>
              <span class="tpl-uses">{{ tpl.uses }} 次使用</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/chat')
}

const tabs = ['全部模板', '创意与设计', '通用', '营销增长', '产品调研', '市场推广', '学习与成长', '求职发展']
const currentTab = ref('全部模板')

// 👇 【解答你的问题：真实的 PPT 模板数据如何模拟？】
// 真实环境中，一个模板本质上是：一张预览封面图 (cover) + 一个真实的 .pptx 文件地址 (fileUrl)
const templates = ref([
  {
    id: 1,
    title: 'Technology Data Report',
    category: '通用',
    uses: 996,
    cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/mock-ppts/tech-report.pptx' // 真实使用时，将真实的 pptx 文件放在 public/mock-ppts 目录下
  },
  {
    id: 2,
    title: 'YouTube Thumbnail & Video Hook',
    category: '创意与设计',
    uses: '2.3w',
    cover: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/mock-ppts/youtube-style.pptx'
  },
  {
    id: 3,
    title: 'The Intelligence Age (AI 主题)',
    category: '学习与成长',
    uses: '4,025',
    cover: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/mock-ppts/ai-theme.pptx'
  },
  {
    id: 4,
    title: 'White Noise Webpage Design',
    category: '创意与设计',
    uses: '3,542',
    cover: 'https://images.unsplash.com/photo-1497215848147-3801f60045e7?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/mock-ppts/white-noise.pptx'
  }
])

// 根据顶部 Tab 过滤
const filteredTemplates = computed(() => {
  if (currentTab.value === '全部模板') return templates.value
  return templates.value.filter(t => t.category === currentTab.value)
})

// 点击使用模板
const useTemplate = (tpl) => {
  // 实际业务逻辑：携带模板 ID 或文件 URL 跳转回聊天页面，并通知 AI 使用此模板
  alert(`你选择了模板：${tpl.title}\n即将返回对话界面并应用该模板主题。`)
  router.push({ path: '/chat', query: { templateId: tpl.id } })
}

// 点击预览模板
const previewTemplate = (tpl) => {
  alert(`打开弹窗预览幻灯片：${tpl.title}`)
}
</script>

<style scoped>
.template-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

/* 顶部导航与 Tab */
.tpl-header {
  background: #fff;
  padding: 16px 40px 0;
  border-bottom: 1px solid #eaeaea;
}

.header-top {
  margin-bottom: 16px;
}

.back-btn {
  background: none; border: none; font-size: 14px; color: #666; cursor: pointer;
}
.back-btn:hover { color: #1677ff; }

.tab-list {
  display: flex;
  align-items: center;
  gap: 24px;
  overflow-x: auto;
}

.tab-item {
  padding: 12px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tab-item.active {
  color: #333;
  font-weight: 600;
}

.tab-item.active::after {
  content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px;
  background-color: #333;
}

.tab-divider {
  width: 1px; height: 16px; background-color: #ddd; margin: 0 8px;
}

.my-tpl {
  color: #666;
}

/* 内容区与网格 */
.tpl-content {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
}

.tpl-grid {
  display: grid;
  /* 响应式列，和你的截图类似，每行大致 3-4 个 */
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* 统一卡片样式 */
.tpl-card {
  cursor: pointer;
}

/* 1. 特殊卡片 (上传/新建) */
.special-card {
  display: flex; flex-direction: column;
}
.special-cover {
  height: 180px;
  background-color: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
}
.special-card:hover .special-cover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.icon-circle {
  width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: bold;
}
.ppt-icon { background: #ffe8e6; color: #ff4d4f; }
.add-icon { background: #e6f0ff; color: #1677ff; }
.special-title { font-size: 15px; color: #333; text-align: left; }

/* 2. 真实模板卡片 & 悬浮遮罩 (核心功能) */
.tpl-cover-wrapper {
  position: relative;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #eaeaea;
}

.tpl-cover {
  width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;
}

.tpl-card:hover .tpl-cover {
  transform: scale(1.05); /* 鼠标移入图片微放大 */
}

/* 遮罩层 UI */
.hover-mask {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.65); /* 半透明黑底 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.3s ease; /* 渐隐渐现动画 */
}

.tpl-cover-wrapper:hover .hover-mask {
  opacity: 1; /* 鼠标悬浮时显示 */
}

/* 遮罩层上的按钮 */
.use-btn {
  background: #333; color: white; border: none; padding: 8px 20px; border-radius: 20px;
  font-size: 14px; cursor: pointer; transition: background 0.2s;
}
.use-btn:hover { background: #000; }

.preview-btn {
  background: rgba(255, 255, 255, 0.2); color: white; border: none; 
  width: 36px; height: 36px; border-radius: 50%; font-size: 16px; 
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.preview-btn:hover { background: rgba(255, 255, 255, 0.4); }

/* 模板信息文字 */
.tpl-title { margin: 0 0 6px 0; font-size: 15px; color: #333; }
.tpl-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #999; }
.tpl-tag { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; color: #666; }
</style>
