<!-- 左插槽组件（纯CSS版：白色卡片，简洁高级）——按钮固定为“去试试” -->
<template>
  <div class="left-card">
    <!-- 左侧视频插槽 -->
    <div class="left-video">
      <slot name="video">
        <!-- 默认视频占位 -->
        <img class="default-video">
          <source src="" />
        </img>
      </slot>
    </div>

    <!-- 右侧文字区域插槽（移除了按钮插槽，按钮固定） -->
    <div class="right-content">
      <!-- 标题插槽 -->
      <div class="title-slot">
        <slot name="title">
          <h3 class="default-title">默认标题</h3>
        </slot>
      </div>
      <!-- 内容插槽 -->
      <div class="content-slot">
        <slot name="content">
          <p class="default-content">默认内容描述，使用更舒适的阅读间距和字体大小。</p>
        </slot>
      </div>
      <button class="default-button" @click="goToLogin">去试试</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* 卡片容器 */
.left-card {
  width: 100%;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.left-video {
  width: 100%;
}

.right-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: flex-start;      /* 子元素左对齐 */
}

.default-video {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 标题：梦幻紫罗兰渐变 */
.default-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #8b5cf6, #c084fc, #e9d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  max-width: 600px;             /* 限制最大宽度，避免过宽 */
  width: 100%;
}

.default-content {
  color: #4b5563;
  line-height: 1.625;
  font-size: 1.125rem;
  margin: 0;
  max-width: 600px;             /* 限制最大宽度 */
  width: 100%;
}

/* 按钮样式：静止黑色背景，悬浮灰色背景 */
.default-button {
  align-self: flex-start;       /* 改为左对齐 */
  padding: 0.75rem 2rem;
  border: 1px solid #000000;
  background-color: #000000; /* 纯黑背景 */
  color: #ffffff; /* 白色文字 */
  border-radius: 9999px;
  font-weight: 500;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  cursor: pointer;
}
.default-button:hover {
  background-color: #4a4a4a; /* 灰色背景 */
  border-color: #595b5e;
  color: #ffffff; /* 保持白色文字 */
}

@media (min-width: 768px) {
  .left-card {
    flex-direction: row;
    padding: 2.5rem;
  }
  .left-video {
    width: 50%;
  }
  .right-content {
    width: 50%;
    padding-left: 2rem;         /* 左右留白，使文字不贴边 */
    padding-right: 2rem;
  }
}
</style>