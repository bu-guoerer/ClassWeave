<template>
  <div class="knowledge-base-page">
    <!-- 顶部导航栏 -->
    <header class="kb-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回对话
        </button>
        <h2 class="page-title"><img src="../assets/images/知识库2.png" alt="" class="icon-img">个人本地知识库</h2>
      </div>
      <div class="header-right">
        <input
          ref="fileInputRef"
          class="upload-input"
          type="file"
          multiple
          @change="handleFakeUpload"
        >
        <button class="upload-btn" type="button" @click="openFilePicker">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          上传新资料
        </button>
      </div>
    </header>

    <!-- 知识库内容区 -->
    <div class="kb-content">
      <div class="files-grid">
        <div class="file-card" v-for="file in fileList" :key="file.id">
          <!-- 文件类型图标 -->
          <div class="file-icon" :class="'icon-' + file.type">
            <img :src="getFileIcon(file.type)" alt="icon" class="file-type-img">
          </div>
          <!-- 文件信息 -->
          <div class="file-info">
            <h4 class="file-name" :title="file.name">{{ file.name }}</h4>
            <div class="file-meta">
              <span>{{ file.size }}</span>
              <!-- <span>{{ file.date }}</span> -->
            </div>
          </div>
          <!-- 悬浮操作菜单 -->
          <div class="file-actions">
            <button class="action-btn" title="引用到对话">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button class="action-btn" title="预览文件">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="action-btn" title="删除" @click="deleteFile(file.id)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fileInputRef = ref(null)

const goBack = () => {
  router.push('/chat') // 返回首页聊天界面
}

// 获取文件图标的辅助函数
const getFileIcon = (type) => {
  const iconMap = {
    pdf: new URL('../assets/images/pdf.png', import.meta.url).href,
    word: new URL('../assets/images/word.png', import.meta.url).href,
    ppt: new URL('../assets/images/ppt.png', import.meta.url).href,
    video: new URL('../assets/images/video.png', import.meta.url).href,
    excel: new URL('../assets/images/excel.png', import.meta.url).href
  }
  return iconMap[type] || '📁'
}

const getFileType = (fileName = '') => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['ppt', 'pptx'].includes(ext)) return 'ppt'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video'
  return 'word'
}

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

const getToday = () => new Date().toISOString().slice(0, 10)

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const handleFakeUpload = (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  const uploadedFiles = files.map((file, index) => ({
    id: `${Date.now()}-${index}`,
    name: file.name,
    type: getFileType(file.name),
    size: formatFileSize(file.size),
    date: getToday()
  }))

  fileList.value = [...uploadedFiles, ...fileList.value]
  event.target.value = ''
}

const deleteFile = (fileId) => {
  fileList.value = fileList.value.filter((file) => file.id !== fileId)
}

// 模拟本地知识库文件数据
const fileList = ref([
  { id: 1, name: 'd2l-zh.pdf', type: 'pdf', size: '32.67 MB', date: '2023-10-24' },
  { id: 2, name: 'EasyRL_v1.0.6.pdf', type: 'pdf', size: '172.34 MB', date: '2023-10-25' },
  { id: 3, name: 'Introduction-to-Autonomous-Robots.pdf', type: 'pdf', size: '13.26 MB', date: '2023-10-26' },
  { id: 4, name: 'math-for-ai.pdf', type: 'pdf', size: '47.26 MB', date: '2023-10-26' },
  { id: 5, name: '人工智能.pdf', type: 'pdf', size: '23.06 MB', date: '2023-10-27' },
  { id: 6, name: '人工智能导论.pdf', type: 'pdf', size: '17.86 MB', date: '2023-10-28' },
  { id: 7, name: '人工智能机器人学导论.pdf', type: 'pdf', size: '20.93 MB', date: '2023-10-29' },
  {
    id: 8,
    name: 'Artificial-Intelligence-and-the-Future-of-Teaching-and-Learning.pdf',
    type: 'pdf',
    size: '1.86 MB',
    date: '2023-10-29'
  }
])
</script>

<style scoped>
.knowledge-base-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f6f9;
}

/* 顶部导航 */
.kb-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #1677ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover {
  background-color: #4096ff;
}

.upload-input {
  display: none;
}

/* 内容区与网格布局 */
.kb-content {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
}

.files-grid {
  display: grid;
  /* 响应式网格布局，最小宽度220px */
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

/* 文件卡片样式 */
.file-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.file-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #1677ff;
}

/* 各类文件的图标颜色区分 */
.file-icon {
  font-size: 48px;
  margin-bottom: 16px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.icon-pdf {
  background: #ffe6e6;
  color: #ff4d4f;
}

.icon-word {
  background: #e6f0ff;
  color: #1677ff;
}

.icon-ppt {
  background: #fff1f0;
  color: #fa541c;
}

.icon-video {
  background: #f9f0ff;
  color: #722ed1;
}

.icon-excel {
  background: #f6ffed;
  color: #52c41a;
}

.file-info {
  width: 100%;
}

.file-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* 最多显示两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  height: 40px;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

/* 鼠标悬浮时显示的操作按钮 */
.file-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s;
}

.file-card:hover .file-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.file-type-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.icon-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  padding: 10px;
}
</style>
