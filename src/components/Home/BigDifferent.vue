<!-- BigDifferent.vue -->
<template>
  <div class="big-different">
    <div class="video"><video src="../../assets/videos/1.mp4" class="total" controls></video></div>
    <div class="text">ClassWeave织课，大不同</div>
    <!-- different 盒子：放入 left.vue 和 right.vue -->
    <div class="different">
      <!-- 第一个 Left 组件：幻灯片，完全不同的猛兽 -->
      <Left>
        <template #video>
          <video src="../../assets/videos/3.mp4" class="custom-video" controls></video>
        </template>
        <template #title>
          <h3 class="custom-title">重塑幻灯片创作：AI 驱动的全新物种</h3>
        </template>
        <template #content>
          <p class="custom-content">
            从高质量生成到精细打磨，一站式完成。你将体验排版与编辑能力最强的 AI 幻灯片，
            无需再导出到其他工具进行二次处理。这，就是新的行业标准。
          </p>
        </template>
      </Left>

      <!-- 第一个 Right 组件：一站式搞定，无需来回导出切换 -->
      <Right>
        <template #video>
          <video src="../../assets/videos/2.mp4" class="custom-video" controls></video>
        </template>
        <template #title>
          <h3 class="custom-title">无缝工作流：从生成到精修，全程无需切换</h3>
        </template>
        <template #content>
          <p class="custom-content">
            扩展内容、润色措辞、突出重点——所有操作都在ClassWeave织课内完成，让你的心流永不中断。
          </p>
        </template>
      </Right>

      <!-- 第二个 Left 组件：和你一起共创，而不只是生成 -->
      <Left>
        <template #video>
          <video src="../../assets/videos/6.mp4" class="custom-video" controls></video>
        </template>
        <template #title>
          <h3 class="custom-title">智能创作伙伴：支持多种导出方式与插件系统</h3>
        </template>
        <template #content>
          <p class="custom-content">
            多样化功能设计，满足您的需求，
            真正的创作需要自由，快速生成只是起点。
          </p>
        </template>
      </Left>

      <!-- 第二个 Right 组件：别的 AI 在猜，我们的在核查 -->
      <Right>
        <template #video>
          <video src="../../assets/videos/4.mp4" class="custom-video" controls></video>
        </template>
        <template #title>
          <h3 class="custom-title">数字人机制：一站式搭配讲解</h3>
        </template>
        <template #content>
          <p class="custom-content">
            一个 AI 负责生成，另一个独立讲解PPT内容，
            将需要传递的知识准确传达，确保专业性。
          </p>
        </template>
      </Right>

      <!-- 第三个 Left 组件：别再独自费力想指令，AI 带你思考 -->
      <Left>
        <template #video>
          <video src="../../assets/videos/5.mp4" class="custom-video" controls></video>
        </template>
        <template #title>
          <h3 class="custom-title">引导式创作：告别指令焦虑，AI 带你精准抵达</h3>
        </template>
        <template #content>
          <p class="custom-content">
            结构化的引导提问，层层梳理你的需求，让产出始终锚定在理想方向。
          </p>
        </template>
      </Left>
    </div>
  </div>
</template>

<script setup>
import Left from '../different/left.vue'
import Right from '../different/right.vue'
</script>

<style scoped>
/* 基础样式，移动优先 */
.big-different {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 顶部视频区域：桌面高度 690px，移动端使用视口相对单位 */
.big-different .video {
  width: 100%;
  height: 600px;
  border-radius: 5px;
}

.big-different .video .total {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  box-shadow: 1px 1px 5px gray;
}

/* 主标题：桌面 50px，移动端通过 clamp 动态调整，并减小垂直间距 */
.big-different .text {
  color: black;
  font-size: clamp(32px, 8vw, 50px);
  width: 100%;
  margin: 30px auto;
  text-align: center;
}

.different {
  width: 100%;
}

/* 自定义插槽样式（与 left/right 组件风格统一） */
.custom-video {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.custom-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #8b5cf6, #c084fc, #e9d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.custom-content {
  color: #4b5563;
  line-height: 1.625;
  font-size: 1.125rem; /* 18px */
  margin: 0 0 1rem 0;
}

/* ---------- 移动端优化 (宽度 ≤ 767px) ---------- */
@media (max-width: 767px) {
  /* 顶部视频高度调整为视口的 40%，避免占满屏幕 */
  .big-different .video {
    height: 40vh;
  }

  /* 主标题字号由 clamp 自动控制，但可以微调边距 */
  .big-different .text {
    margin: 20px auto;
  }

  /* 卡片内标题和内容字号略微缩小，提升小屏阅读体验 */
  .custom-title {
    font-size: 1.5rem; /* 24px */
  }

  .custom-content {
    font-size: 1rem; /* 16px */
  }
}

/* 针对更小屏幕 (≤ 480px) 进一步优化 */
@media (max-width: 480px) {
  .custom-title {
    font-size: 1.25rem; /* 20px */
  }

  .custom-content {
    font-size: 0.9375rem; /* 15px */
  }

  .big-different .text {
    font-size: clamp(28px, 7vw, 40px);
  }
}
</style>
