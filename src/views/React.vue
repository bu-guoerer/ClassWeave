<template>
  <div class="feedback">
    <div class="feedback-card">
      <!-- 头部 -->
      <header class="header">
        <h2 class="title">分享您的想法</h2>
        <p class="subtitle">您的反馈将帮助我们打造更出色的产品</p>
      </header>

      <!-- 反馈类型选择 -->
      <div class="form-group">
        <label class="form-label">反馈类型 <span class="required">*</span></label>
        <div class="type-selector">
          <button
            v-for="type in feedbackTypes"
            :key="type.value"
            :class="['type-btn', { active: selectedType === type.value }]"
            @click="selectedType = type.value"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <span class="type-text">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- 反馈内容输入 -->
      <div class="form-group">
        <label class="form-label">反馈内容 <span class="required">*</span></label>
        <div class="textarea-wrapper">
          <textarea
            v-model="message"
            class="form-textarea"
            placeholder="请详细描述你的建议、问题或创意……"
            rows="5"
            maxlength="1000"
            @input="handleInput"
          ></textarea>
          <div class="textarea-footer">
            <span class="char-count" :class="{ 'near-limit': message.length > 900 }">
              {{ message.length }}/1000
            </span>
          </div>
        </div>
      </div>

      <!-- 联系方式（可选） -->
      <div class="form-group">
        <label class="form-label">联系方式（可选）</label>
        <div class="contact-inputs">
          <div class="input-wrapper">
            <input v-model="contact.email" type="email" class="form-input" placeholder="邮箱地址" />
            <span class="input-icon">✉</span>
          </div>
          <div class="input-wrapper">
            <input v-model="contact.phone" type="tel" class="form-input" placeholder="手机号码" />
            <span class="input-icon">☎</span>
          </div>
        </div>
        <p class="hint">留下联系方式，方便我们及时跟进反馈</p>
      </div>

      <!-- 附件上传区域 -->
      <div class="form-group">
        <label class="form-label">附件（可选）</label>
        <div
          class="upload-area"
          :class="{ 'drag-over': isDragOver }"
          @click="triggerUpload"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            class="hidden-input"
            @change="handleFileChange"
          />
          <div class="upload-content">
            <div class="upload-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div class="upload-text">
              <span class="upload-primary">点击或拖拽文件至此处</span>
              <span class="upload-secondary">支持图片、PDF、Word、TXT，单个文件不超过 10MB</span>
            </div>
          </div>
        </div>

        <!-- 已上传文件列表 -->
        <transition-group name="list" tag="div" class="file-list">
          <div v-for="(file, idx) in fileList" :key="file.id" class="file-item">
            <div class="file-preview" v-if="file.isImage">
              <img :src="file.preview" alt="preview" />
            </div>
            <div class="file-icon" v-else>
              {{ getFileIcon(file.name) }}
            </div>

            <div class="file-info">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>

            <div class="file-actions">
              <div v-if="file.status === 'uploading'" class="progress-ring">
                <div class="progress-circle" :style="{ '--progress': file.progress + '%' }"></div>
                <span class="progress-text">{{ file.progress }}%</span>
              </div>
              <button v-else class="remove-btn" @click.stop="removeFile(idx)" title="移除">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <button
          class="submit-btn"
          :class="{ loading: isSubmitting, disabled: !isValid }"
          :disabled="!isValid || isSubmitting"
          @click="handleSubmit"
        >
          <span v-if="isSubmitting" class="spinner"></span>
          <span v-else>提交反馈</span>
        </button>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- 成功弹框 -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 class="modal-title">提交成功</h3>
          <p class="modal-message">感谢您的宝贵意见，我们会尽快处理并通过邮件回复您。</p>
          <button class="modal-btn" @click="closeModal">确定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

// 反馈类型
const feedbackTypes = [
  { value: 'feature', label: '功能建议', icon: '💡' },
  { value: 'bug', label: '问题反馈', icon: '🐛' },
  { value: 'experience', label: '使用体验', icon: '✨' },
  { value: 'other', label: '其他', icon: '📝' },
]

// 表单数据
const selectedType = ref('feature')
const message = ref('')
const contact = ref({ email: '', phone: '' })
const fileList = ref([])
const fileInputRef = ref(null)
const isDragOver = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const showModal = ref(false)

// 验证
const isValid = computed(() => {
  return selectedType.value && message.value.trim().length >= 10
})

// 处理输入
const handleInput = () => {
  errorMessage.value = ''
}

// 触发上传
const triggerUpload = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileChange = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 处理拖拽
const handleDrop = (e) => {
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

// 处理文件
const processFiles = (files) => {
  files.forEach((file) => {
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = '单个文件不能超过 10MB'
      return
    }

    const id = Date.now() + Math.random()
    const isImage = file.type.startsWith('image/')
    const fileData = {
      id,
      name: file.name,
      size: file.size,
      file,
      isImage,
      preview: null,
      status: 'pending',
      progress: 0,
    }

    if (isImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileData.preview = e.target.result
      }
      reader.readAsDataURL(file)
    }

    fileList.value.push(fileData)

    // 模拟上传进度
    simulateUpload(id)
  })
}

// 模拟上传
const simulateUpload = (id) => {
  const file = fileList.value.find((f) => f.id === id)
  if (!file) return

  file.status = 'uploading'
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 30
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)
      file.status = 'done'
    }
    file.progress = Math.floor(progress)
  }, 200)
}

// 获取文件图标
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const icons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📃',
  }
  return icons[ext] || '📎'
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 删除文件
const removeFile = (index) => {
  fileList.value.splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  if (!isValid.value) {
    errorMessage.value =
      message.value.trim().length < 10 ? '反馈内容至少需要10个字符' : '请填写完整信息'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  // 模拟API提交
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 重置表单
  message.value = ''
  contact.value = { email: '', phone: '' }
  fileList.value = []
  selectedType.value = 'feature'
  isSubmitting.value = false
  showModal.value = true
}

// 关闭弹框
const closeModal = () => {
  showModal.value = false
}

// 清理
onUnmounted(() => {
  fileList.value.forEach((file) => {
    if (file.preview) URL.revokeObjectURL(file.preview)
  })
})
</script>

<style scoped>
/* CSS Reset & Base */
* {
  box-sizing: border-box;
}

.feedback {
  width: 100%;
  max-width: 1000px; /* 增大宽度，减少两侧留白 */
  margin: 0 auto;
  padding: 40px 20px; /* 适当缩小左右内边距 */
  background-color: #ffffff; /* 与卡片背景统一，减少空白感 */
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  min-height: 100vh; /* 至少占满一屏，内容少时居中，多时正常滚动 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直方向居中，使卡片在视口中央 */
}

.feedback-card {
  background-color: #ffffff;
  border-radius: 24px;
  padding: 48px 56px; /* 可根据需要微调，此处保持原样 */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  width: 100%; /* 确保卡片占满容器宽度 */
}
/* Header */
.header {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f5f5f5;
}

.title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 auto;
  margin-bottom: 8px;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  text-align: center;
}

.subtitle {
  font-size: 15px;
  color: #666;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
}

/* Form Elements */
.form-group {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 12px;
  letter-spacing: 0.01em;
}

.required {
  color: #dc2626;
  margin-left: 2px;
}

.hint {
  font-size: 13px;
  color: #999;
  margin: 8px 0 0 0;
}

/* Type Selector */
.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover {
  border-color: #d0d0d0;
  background: #fafafa;
}

.type-btn.active {
  border-color: #1a1a1a;
  background: #1a1a1a;
  color: #fff;
}

.type-icon {
  font-size: 24px;
  line-height: 1;
}

.type-text {
  font-size: 13px;
  font-weight: 500;
}

/* Textarea */
.textarea-wrapper {
  position: relative;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.textarea-wrapper:focus-within {
  border-color: #1a1a1a;
}

.form-textarea {
  width: 100%;
  padding: 16px;
  font-size: 15px;
  border: none;
  background: transparent;
  color: #1a1a1a;
  resize: vertical;
  min-height: 140px;
  font-family: inherit;
  line-height: 1.6;
}

.form-textarea::placeholder {
  color: #bbb;
}

.form-textarea:focus {
  outline: none;
}

.textarea-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.char-count {
  font-size: 12px;
  color: #999;
  transition: color 0.2s;
}

.char-count.near-limit {
  color: #dc2626;
}

/* Contact Inputs */
.contact-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  font-size: 14px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  background: #fff;
  color: #1a1a1a;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #1a1a1a;
}

.form-input::placeholder {
  color: #bbb;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
}

/* Upload Area */
.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #ccc;
  background: #f5f5f5;
}

.upload-area.drag-over {
  border-color: #1a1a1a;
  background: #f0f0f0;
}

.hidden-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #999;
  transition: color 0.2s;
}

.upload-area:hover .upload-icon {
  color: #666;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-primary {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.upload-secondary {
  font-size: 12px;
  color: #999;
}

/* File List */
.file-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.file-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #e8e8e8;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 14px;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.file-actions {
  flex-shrink: 0;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #ff4444;
  color: #fff;
}

/* Progress Ring */
.progress-ring {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(#1a1a1a calc(var(--progress) * 1%), #e0e0e0 0);
  mask: radial-gradient(transparent 55%, black 56%);
  -webkit-mask: radial-gradient(transparent 55%, black 56%);
}

.progress-text {
  font-size: 10px;
  font-weight: 600;
  color: #1a1a1a;
  z-index: 1;
}

/* Submit Section */
.submit-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.submit-btn {
  width: 100%;
  max-width: 240px;
  height: 48px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: #333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn.disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.submit-btn.loading {
  opacity: 0.8;
  cursor: wait;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-text {
  font-size: 13px;
  color: #dc2626;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: modalSlideUp 0.3s ease;
}

.modal-icon {
  width: 64px;
  height: 64px;
  background: #1a1a1a;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1a1a1a;
}

.modal-message {
  font-size: 15px;
  color: #666;
  margin: 0 0 32px;
  line-height: 1.5;
}

.modal-btn {
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.modal-btn:hover {
  background: #333;
  transform: scale(1.02);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .feedback {
    padding: 24px 16px;
    background: #fff;
  }

  .feedback-card {
    padding: 32px 24px;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  .type-selector {
    grid-template-columns: repeat(2, 1fr);
  }

  .contact-inputs {
    grid-template-columns: 1fr;
  }

  .header {
    padding-bottom: 24px;
    margin-bottom: 32px;
  }

  .title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .type-selector {
    grid-template-columns: 1fr;
  }

  .type-btn {
    flex-direction: row;
    justify-content: flex-start;
    padding: 12px 16px;
  }
}
</style>
