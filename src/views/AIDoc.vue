<template>
  <div>
    <!-- 为每个组件包裹一个用于动画的容器，并绑定 ref -->
    <div ref="totalWrap" class="animate-section">
      <Total />
    </div>
    <div ref="detailWrap" class="animate-section">
      <Detail />
    </div>
    <div ref="transformWrap" class="animate-section">
      <Transform />
    </div>
    <div ref="cooperationWrap" class="animate-section">
      <Cooperation />
    </div>
    <div ref="bottomBarWrap" class="animate-section">
      <BottomBar />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Total from '@/components/Doc/Total.vue'
import Detail from '@/components/Doc/Detail.vue'
import Transform from '@/components/Doc/Transform.vue'
import Cooperation from '@/components/Doc/Cooperation.vue'
import BottomBar from '@/components/Home/BottomBar.vue'

// 为每个包装元素创建 ref
const totalWrap = ref(null)
const detailWrap = ref(null)
const transformWrap = ref(null)
const cooperationWrap = ref(null)
const bottomBarWrap = ref(null)

let observer = null

onMounted(() => {
  // 初始化 IntersectionObserver
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 当元素进入视口时，添加 visible 类触发动画
          entry.target.classList.add('visible')
          // 可选：一旦触发，停止观察该元素（避免重复触发）
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.2, // 元素 20% 进入视口时触发
      // rootMargin: '0px 0px -50px 0px' // 可调整触发区域
    },
  )

  // 开始观察所有包装元素
  if (totalWrap.value) observer.observe(totalWrap.value)
  if (detailWrap.value) observer.observe(detailWrap.value)
  if (transformWrap.value) observer.observe(transformWrap.value)
  if (cooperationWrap.value) observer.observe(cooperationWrap.value)
  if (bottomBarWrap.value) observer.observe(bottomBarWrap.value)
})

onUnmounted(() => {
  // 组件卸载时断开观察，避免内存泄漏
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
/* 动画初始状态：透明并向下偏移 */
.animate-section {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
  /* 确保包装容器不影响子组件的布局（外边距仍由子组件控制） */
  margin: 0;
  padding: 0;
}

/* 进入视口后的可见状态 */
.animate-section.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
