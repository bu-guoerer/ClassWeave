<template>
  <div class="activity-introduce">
    <!-- 导航栏 -->
    <div class="nav-grid">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="nav-item"
        :class="{ selected: selectedIndex === index }"
        @click="selectItem(index)"
      >
        <i :class="['iconfont', item.icon]" :style="{ color: item.color }"></i>
        {{ item.text }}
      </div>
    </div>

    <!-- 内容区域：根据选中项展示不同内容 -->
    <div class="content-area">
      <LessonPlan v-if="selectedIndex === 0" ref="lessonPlanRef" />
      <GeneralAgent v-else-if="selectedIndex === 1" ref="generalAgentRef" />
      <SlideMaker v-else-if="selectedIndex === 2" ref="slideMakerRef" />
      <DataAnalysis v-else-if="selectedIndex === 3" ref="dataAnalysisRef" />
      <div v-else class="content-placeholder">
        <p>✨ 其他功能开发中，敬请期待</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LessonPlan from '../activity/LessonPlan.vue'
import GeneralAgent from '../activity/GeneralAgent.vue'
import SlideMaker from '../activity/SlideMaker.vue'
import DataAnalysis from '../activity/DataAnalysis.vue'

const items = [
  { icon: 'icon-wendang', text: '编写教案', color: '#3b82f6' }, // 蓝色
  { icon: 'icon-zhinengti', text: '通用智能体', color: '#1e40af' }, // 深蓝色
  { icon: 'icon-huandengpianicon', text: '制作幻灯片', color: '#f97316' }, // 橙色
  { icon: 'icon-tubiao', text: '数据分析', color: '#22c55e' }, // 绿色
]

const selectedIndex = ref(0)

const lessonPlanRef = ref(null)
const generalAgentRef = ref(null)
const slideMakerRef = ref(null)
const dataAnalysisRef = ref(null)

const selectItem = (index) => {
  if (selectedIndex.value === index) {
    if (index === 0) lessonPlanRef.value?.resetAndPlay()
    else if (index === 1) generalAgentRef.value?.resetAndPlay()
    else if (index === 2) slideMakerRef.value?.resetAndPlay()
    else if (index === 3) dataAnalysisRef.value?.resetAndPlay()
  } else {
    selectedIndex.value = index
  }
}
</script>

<style scoped>
.activity-introduce {
  width: 100%;
  padding: 40px 20px;
  background-color: #ffffff;
}

.nav-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto 40px auto;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 1 auto;
  min-width: 160px;
  padding: 16px 24px;
  background-color: #ffffff;
  border: 1px solid transparent;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  font-size: 18px;
  font-weight: 500;
  color: #1a2b3c;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
  line-height: 1.4;
}

.nav-item:hover {
  border-color: #eaeef2;
  background-color: #f9fafc;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

.nav-item.selected {
  background-color: #e0e0e0;
}

.nav-item.selected:hover {
  background-color: #d0d0d0;
  border-color: #eaeef2;
}

/* 图标样式 */
.nav-item i {
  font-size: 24px;
  line-height: 1;
}

.content-area {
  max-width: 1200px;
  margin: 0 auto;
}

.content-placeholder {
  text-align: center;
  padding: 80px 20px;
  background-color: #f9fafc;
  border-radius: 32px;
  border: 1px dashed #d0d9e0;
  color: #7f8c8d;
  font-size: 18px;
}

@media (max-width: 768px) {
  .nav-grid {
    gap: 16px;
  }
  .nav-item {
    min-width: 140px;
    padding: 12px 16px;
    font-size: 16px;
  }
  .nav-item i {
    font-size: 20px;
  }
}
</style>
