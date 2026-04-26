<template>
  <div :class="['sidebar-container', { 'is-collapsed': !isOpen }]">
    <div class="sidebar-header">
      <div class="logo-area" v-show="isOpen">
        <button class="new-chat-btn" @click="$emit('new-chat')">
          <span class="plus-icon">＋</span>
          <span class="btn-text">开启新对话</span>
        </button>
      </div>
      <button class="toggle-btn" @click="$emit('toggle')">
        {{ isOpen ? '◀' : '▶' }}
      </button>
    </div>

    <div class="sidebar-content" v-show="isOpen">
      <!-- 1. 个人画像 -->
      <section class="menu-section">
        <h4 class="section-title interactive-title">
          <div class="title-left">
            <!-- 默认显示的黑色图标 -->
            <img src="../assets/images/个人画像.png" alt="" class="icon-img icon-default" />
            <!-- 悬浮时显示的蓝色图标 -->
            <img src="../assets/images/个人画像2.png" alt="" class="icon-img icon-hover" />
            <span class="title-text">个人画像</span>
          </div>
          <!-- 绑定 v-model 控制开关 -->
          <label class="switch" @click.stop>
            <input type="checkbox" v-model="isProfileEnabled" />
            <span class="slider"></span>
          </label>
        </h4>

        <!-- 新增：开启开关后显示的课程列表 -->
        <div class="list-items" v-show="isProfileEnabled">
          <div class="course-wrapper" v-for="course in courseList" :key="course.id">
            <!-- 课程名称层级 -->
            <div class="item" @click="toggleCourse(course)">
              <span class="item-text">{{ course.name }}</span>
              <!-- 展开/收起箭头 -->
              <span class="expand-icon" :class="{ 'is-expanded': course.isExpanded }">▶</span>
            </div>

            <!-- 课程大纲层级 (点击课程后展开) -->
            <div class="course-outline" v-show="course.isExpanded">
              <div class="outline-header">课程大纲</div>
              <div class="outline-item" v-for="(detail, index) in course.outline" :key="index">
                <div class="outline-info" @click="previewDocument(course)">
                  <span class="outline-title" :title="detail.title">{{ detail.title }}</span>
                  <span class="outline-hours">{{ detail.hours }}</span>
                </div>
                <!-- 新增：悬浮显示的操作区 -->
                <div class="outline-actions">
                  <span class="action-btn" @click.stop="previewDocument(course)">预览</span>
                  <span class="action-btn quote-btn" @click.stop="quoteLesson(course, detail)"
                    >引用</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. 历史记录 -->
      <section class="menu-section">
        <h4 class="section-title interactive-title">
          <div class="title-left">
            <img src="../assets/images/历史记录.png" alt="" class="icon-img icon-default" />
            <img src="../assets/images/历史记录2.png" alt="" class="icon-img icon-hover" />
            <span class="title-text">历史记录</span>
          </div>
        </h4>
        <div class="list-items">
          <div
            class="item history-item-wrapper"
            v-for="item in history"
            :key="item.id"
            @click="$emit('load-history', item)"
          >
            <!-- 文本区域 -->
            <span class="item-text" :title="item.title">{{ item.title }}</span>

            <!-- 新增：右侧三个点操作区 -->
            <div
              class="more-action-box"
              :class="{ 'is-active': activeMenuId === item.id }"
              @click.stop
            >
              <button class="more-action-btn" @click.stop="toggleHistoryMenu(item.id, $event)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5"></circle>
                  <circle cx="12" cy="12" r="1.5"></circle>
                  <circle cx="19" cy="12" r="1.5"></circle>
                </svg>
              </button>

              <Teleport to="body">
                <div
                  class="action-menu-dropdown"
                  v-if="activeMenuId === item.id"
                  :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }"
                  @click.stop
                >
                  <div class="menu-item" @click.stop="handleMenuClick('top', item)">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    置顶
                  </div>

                  <div class="menu-item" @click.stop="handleMenuClick('rename', item)">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    重命名
                  </div>

                  <div class="menu-item menu-danger" @click.stop="handleMenuClick('delete', item)">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                    </svg>
                    删除
                  </div>
                </div>
              </Teleport>
            </div>
          </div>
        </div>
      </section>
      <!-- 3. 项目 -->
      <section class="menu-section">
        <h4 class="section-title interactive-title" @click="goToLigong">
          <div class="title-left">
            <!-- 默认显示的黑色图标 -->
            <img src="../assets/images/项目.png" alt="" class="icon-img icon-default" />
            <!-- 悬浮时显示的蓝色图标 -->
            <img src="../assets/images/项目2.png" alt="" class="icon-img icon-hover" />
            <span class="title-text">项目</span>
          </div>
          <span class="enter-arrow">进入 ➔</span>
        </h4>
        <div class="list-items">
          <div
            class="item"
            v-for="(kb, index) in knowledgeBases"
            :key="index"
            @click.stop="toggleMention(kb)"
          >
            <!-- 自定义勾选框：选中时显示黄色 @ -->
            <div class="mention-checkbox" :class="{ 'is-checked': kb.checked }">
              <span v-if="kb.checked">@</span>
            </div>
            <span class="item-text" @click="goToLigong">{{ kb.name }}</span>
          </div>
        </div>
      </section>
      <section class="menu-section">
        <h4 class="section-title interactive-title" @click="goToKnowledge">
          <div class="title-left">
            <!-- 默认显示的黑色图标 -->
            <img src="../assets/images/知识库.png" alt="" class="icon-img icon-default" />
            <!-- 悬浮时显示的蓝色图标 -->
            <img src="../assets/images/知识库2.png" alt="" class="icon-img icon-hover" />
            <span class="title-text">个人知识库</span>
          </div>
          <span class="enter-arrow">进入 ➔</span>
        </h4>
        <div class="list-items">
          <div class="item">2026人工智能白皮书.pdf</div>
          <div class="item">市场调研数据.xlsx</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const activeMenuId = ref(null) // 记录当前打开菜单的项的 ID
const menuPosition = ref({ x: 0, y: 0 }) // 新增：记录弹窗的绝对坐标
// ====== 新增：个人画像开关与课程数据 ======
const isProfileEnabled = ref(false) // 控制开关状态

// 课程列表数据
const courseList = ref([
  {
    id: 1,
    name: '人工智能导论',
    isExpanded: false, // 控制是否展开课程大纲
    outline: [
      { title: '人工智能基本原理', hours: '2学时' },
      { title: '机器学习基础概念', hours: '2学时' },
      { title: '深度学习神经网络', hours: '4学时' },
    ],
  },
  {
    id: 2,
    name: 'Python数据分析',
    isExpanded: false,
    outline: [
      { title: 'Pandas数据清洗', hours: '2学时' },
      { title: 'Matplotlib数据可视化', hours: '2学时' },
    ],
  },
])

// 点击课程展开/收起大纲
const toggleCourse = (course) => {
  course.isExpanded = !course.isExpanded
}
// 点击三个点图标，切换显示菜单
const toggleHistoryMenu = (id, event) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null // 如果已经打开，再次点击就关闭
    return
  }

  // 获取当前点击的按钮在整个屏幕中的位置
  const btnRect = event.currentTarget.getBoundingClientRect()

  // 设置菜单出现的位置：按钮的右侧(加上一点间距)，以及跟按钮稍微顶部对齐
  menuPosition.value = {
    x: btnRect.right + 12, // 距离按钮右边缘再往右 12px
    y: btnRect.top - 8, // 纵向上轻微往上提一点
  }

  activeMenuId.value = id
}
// 点击网页空白处，自动关闭悬浮菜单
const closeAllMenus = () => {
  activeMenuId.value = null
}

onMounted(() => {
  document.addEventListener('click', closeAllMenus)
})

onUnmounted(() => {
  document.removeEventListener('click', closeAllMenus)
})

// 处理菜单内各项的点击
const handleMenuClick = (action, item) => {
  activeMenuId.value = null // 自动闭合菜单
  if (action === 'delete') {
    console.log('sha')
    ElMessageBox.confirm(`确定要删除【${item.title}】吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        console.log('准备触发 delete-history，item.id =', item.id)
        emit('delete-history', item.id)
        console.log('已触发 delete-history')
        ElMessage.success('已删除')
      })
      .catch((err) => {
        // 取消删除，不做任何事
        console.log('取消或出错:', err)
      })
  } else if (action === 'top') {
    emit('pin-history', item.id) // 👈 抛出置顶
  } else if (action === 'rename') {
    emit('rename-history', item) // 👈 抛出重命名
  } else {
    console.log(`点击了 ${action}`, item.title)
  }
}
const goToKnowledge = () => {
  router.push('/knowledge')
}

const knowledgeBases = ref([
  { name: '理工大学人工智能专业知识库', checked: false },
  { name: '综合大学AI通识课程知识库', checked: false },
  { name: '实验小学AI启蒙教育知识库', checked: false },
  { name: '实验中学科创人工智能知识库', checked: false },
])

const toggleMention = (kb) => {
  kb.checked = !kb.checked
  emit('mention', kb.name, kb.checked)
}

// ================= 新增核心逻辑 =================
// 1. 遍历知识库数组，把所有 checked 状态设为 false
const resetKnowledgeBase = () => {
  knowledgeBases.value.forEach((kb) => {
    kb.checked = false
  })
}

// 2. 暴露给父组件使用，父组件通过 ref 即可调用这个方法！
defineExpose({
  resetKnowledgeBase,
})
// ================================================

defineProps({
  isOpen: Boolean,
  history: Array,
})

const emit = defineEmits([
  'toggle',
  'logout',
  'new-chat',
  'load-history',
  'mention',
  'delete-history',
  'pin-history',  
  'rename-history',  
   'preview-doc', // 👈 新增：预览文档事件
  'quote-lesson' // 👈 新增：引用单节课事件
])
const previewDocument = (course) => {
  emit('preview-doc', course)
}
const quoteLesson = (course, lesson) => {
  emit('quote-lesson', {
    courseName: course.name,
    lessonTitle: lesson.title,
    hours: lesson.hours
  })
}
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    emit('logout')
  }
}

const goToLigong = () => {
  router.push('/ligong')
}
</script>

<style scoped>
/* =========== 基础布局 =========== */
.sidebar-container {
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid #f5f5f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100vh;
}

.sidebar-container.is-collapsed {
  width: 60px;
}

.sidebar-header {
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f5f5f5;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  font-size: 18px;
  color: #1677ff;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
}

.menu-section {
  margin-bottom: 24px;
}

/* =========== 核心优化：标题与排版 =========== */
.section-title {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  user-select: none;
}

/* 带有交互效果的标题容器 */
.interactive-title {
  cursor: pointer;
}

/* 左侧：图标 + 文字的包裹层 */
.title-left {
  display: flex;
  align-items: center;
  gap: 10px;
  /* 图标与文字的标准间距 */
}

/* 统一图标样式（稍微调小一点，让侧边栏显得更精致） */
.icon-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 统一文字样式 */
.title-text {
  font-size: 15px;
  color: #333;
  font-weight: 800;
  transform-origin: left center;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 右侧箭头提示（默认隐藏，悬浮时飞入） */
.enter-arrow {
  font-size: 13px;
  color: #1677ff;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

/* =========== 核心优化：Hover 动态交互效果 =========== */

.interactive-title:hover {
}

.interactive-title:hover .title-text {
  color: #1677ff;
  transform: scale(1.08);
  /* 文字放大 1.08倍 */
}

/* 3. 悬浮时：图片放大 + 变蓝 */
.interactive-title:hover .icon-img {
  transform: scale(1.15);
}
.icon-hover {
  display: none; /* 默认状态隐藏蓝色图标 */
}
.interactive-title:hover .icon-default {
  display: none;
}

.interactive-title:hover .icon-hover {
  display: block; /* 悬浮时显示蓝色图标 */
}
/* 4. 悬浮时：箭头淡入滑出 */
.interactive-title:hover .enter-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* =========== 下方列表与个人信息区域 =========== */
.list-items .item {
  padding: 8px 12px 8px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  font-weight: normal;
  cursor: pointer;

  display: flex; /* 新增 */
  align-items: center; /* 新增 */
  gap: 8px; /* 新增：勾选框和文字的间距 */
}
.item-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mention-checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  transition: all 0.2s;
  flex-shrink: 0;
}

/* 选中后的黄色 @ 样式 */
.mention-checkbox.is-checked {
  border-color: #1677ff;
  background-color: #f5f7fa; /* 背景浅黄 */
  color: #1677ff; /* @ 符号的颜色(深黄色/橘色) */
}
.list-items .item:hover {
  background-color: #f5f7fa; /* 原为 #f5f7fa，现改为浅黄背景 */
  color: #1677ff;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f5f5f5;
  cursor: pointer;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
}

.user-avatar img {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
}

/* Switch 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 18px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #ccc;
  border-radius: 24px;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .slider {
  background-color: #4e78f6;
}

input:checked + .slider:before {
  transform: translateX(15px);
}
.new-chat-btn-wrapper {
  margin-bottom: 24px;
}
.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.2);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #1677ff;
}
.new-chat-btn:hover {
  background-color: #4096ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}

.new-chat-btn:active {
  transform: translateY(1px);
  box-shadow: none;
}

.plus-icon {
  font-size: 18px;
  font-weight: bold;
}
.history-item-wrapper {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px !important;
}

.more-action-box {
  position: relative;
  opacity: 0;
  transition: opacity 0.2s;
}

/* 当鼠标悬浮在这一行，或者菜单已经打开时，保持三个点和菜单显示 */
.history-item-wrapper:hover .more-action-box,
.more-action-box.is-active {
  opacity: 1;
}

/* --- 剩余的原样保留 --- */
.more-action-btn {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-action-btn:hover {
  background: #e6e6e6;
  color: #333;
}

.action-menu-dropdown {
  position: fixed;
  width: 110px;
  background: #ffffff;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 6px 0;
  z-index: 99999; /* 层级拉满，保证盖住任何组件 */
}
.action-menu-dropdown .menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-menu-dropdown .menu-item:hover {
  background: #f5f5f5;
}

/* 删除按钮的危险颜色 */
.action-menu-dropdown .menu-danger {
  color: #ff4d4f;
}

.action-menu-dropdown .menu-danger svg {
  stroke: #ff4d4f;
}
.course-wrapper {
  margin-bottom: 4px;
}

.expand-icon {
  font-size: 10px;
  color: #999;
  transition: transform 0.3s ease;
}

.expand-icon.is-expanded {
  transform: rotate(90deg); /* 展开时箭头向下 */
}

.course-outline {
  margin: 2px 0 8px 12px;
  padding: 8px 12px;
  background-color: #fafafa; /* 浅灰色背景区分层级 */
  border-radius: 6px;
  border-left: 2px solid #1677ff; /* 左侧加个蓝条增加辨识度 */
}

.outline-header {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #e5e5e5;
}

.outline-item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
  padding: 4px 0;
}

.outline-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 12px;
}

.outline-item:hover .outline-title,
.outline-item:hover .outline-hours {
  color: #1677ff;
}

.outline-hours {
  font-weight: bold;
  color: #999;
  flex-shrink: 0;
}

.outline-info {
  display: flex;
  width: 100%;
  cursor: pointer;
}

.outline-info:hover .outline-title {
  color: #1677ff;
}
.outline-actions {
  position: absolute;
  right: 0;
  background: #fafafa;
  display: none; /* 默认隐藏 */
  gap: 8px;
  padding-left: 10px;
}

/* 鼠标悬浮在这一行时，显示操作按钮 */
.outline-item:hover .outline-actions {
  display: flex;
}
.action-btn {
  cursor: pointer;
  color: #1677ff;
  font-weight: bold;
}
.action-btn:hover {
  text-decoration: underline;
}
.quote-btn {
  color: #fa8c16; /* 引用按钮用橘色区分 */
}
</style>