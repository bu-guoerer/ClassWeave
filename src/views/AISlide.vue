<template>
  <div>
    <!-- 为每个组件包裹一层 div，用于观察视口进入状态并应用动画 -->
    <div ref="totalWrap" class="fade-in-section" :class="{ 'section-visible': visible.total }">
      <Total />
    </div>

    <div
      ref="advantagesWrap"
      class="fade-in-section"
      :class="{ 'section-visible': visible.advantages }"
    >
      <Advantages />
    </div>

    <div
      ref="professionalWrap"
      class="fade-in-section"
      :class="{ 'section-visible': visible.professional }"
    >
      <ProfessionalComments />
    </div>

    <div
      ref="questionsWrap"
      class="fade-in-section"
      :class="{ 'section-visible': visible.questions }"
    >
      <SimpleQuestions />
    </div>

    <div ref="bottomWrap" class="fade-in-section" :class="{ 'section-visible': visible.bottom }">
      <BottomBar />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import Total from '@/components/Slide/Total.vue'
import Advantages from '@/components/Slide/Advantages.vue'
import ProfessionalComments from '@/components/Slide/ProfessionalComments.vue'
import SimpleQuestions from '@/components/Slide/SimpleQuestions.vue'
import BottomBar from '@/components/Home/BottomBar.vue'

// 可见性状态，分别对应五个区块
const visible = reactive({
  total: false,
  advantages: false,
  professional: false,
  questions: false,
  bottom: false,
})

// 模板引用，用于获取包裹层的 DOM 元素
const totalWrap = ref(null)
const advantagesWrap = ref(null)
const professionalWrap = ref(null)
const questionsWrap = ref(null)
const bottomWrap = ref(null)

// 保存 IntersectionObserver 实例，以便在组件卸载时断开连接
let observer = null

onMounted(() => {
  // 创建观察器，当目标元素有 20% 进入视口时触发回调
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // 只处理进入视口的元素
        if (!entry.isIntersecting) return

        const target = entry.target
        // 根据触发元素更新对应的 visible 状态
        if (target === totalWrap.value) {
          visible.total = true
        } else if (target === advantagesWrap.value) {
          visible.advantages = true
        } else if (target === professionalWrap.value) {
          visible.professional = true
        } else if (target === questionsWrap.value) {
          visible.questions = true
        } else if (target === bottomWrap.value) {
          visible.bottom = true
        }

        // 元素已出现，停止观察它（避免重复触发）
        observer.unobserve(target)
      })
    },
    {
      threshold: 0.2, // 20% 可见时触发
      // 可选的 rootMargin，例如 '0px 0px -50px 0px' 可提前或延迟触发
    },
  )

  // 开始观察各个包裹层（确保元素存在）
  if (totalWrap.value) observer.observe(totalWrap.value)
  if (advantagesWrap.value) observer.observe(advantagesWrap.value)
  if (professionalWrap.value) observer.observe(professionalWrap.value)
  if (questionsWrap.value) observer.observe(questionsWrap.value)
  if (bottomWrap.value) observer.observe(bottomWrap.value)
})

// 组件卸载时断开观察器，避免内存泄漏
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
/* 初始状态：透明并稍微下移 */
.fade-in-section {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.8s cubic-bezier(0.2, 0.8, 0.3, 1),
    transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1);
  will-change: opacity, transform;
}

/* 进入视口后的可见状态 */
.fade-in-section.section-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
