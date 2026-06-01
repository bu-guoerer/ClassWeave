<template>
  <div class="total">
    <div class="icon">
      <div class="pie-chart">
        <div class="pie-main"></div>
        <div class="pie-slice"></div>
      </div>
    </div>
    <div class="big">能制作完美幻灯片的 AI 工具</div>
    <div class="small">
      行业领先的品质、原生 PowerPoint 编辑功能和立即可用的演示文稿布局<br />——数秒即可创建完成。
    </div>
    <button class="experience" @click="goToLogin">立即体验 <span class="arrow">→</span></button>
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
.total {
  margin: 50px auto 0px;
  width: 100%;
  height: 500px;
  /* border: 1px black solid; */
  text-align: center; /* 让内联元素居中 */
}

.icon {
  margin: 20px auto;
  width: 80px;
  height: 80px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(110, 106, 106, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-chart {
  width: 50px;
  height: 50px;
  position: relative;
}

.pie-main {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #f2784b;
  position: absolute;
  top: 0;
  left: 0;
}

.pie-slice {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #f9b9a3;
  position: absolute;
  top: 0;
  left: 0;
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%);
  transform: translate(3px, -3px);
}

.total .big {
  margin: 10px auto;
  width: 100%;
  font-size: 70px;
  font-weight: bold;
  line-height: 100px;
  color: black;
  text-align: center;
}

.total .small {
  margin: 10px auto;
  width: 100%;
  color: gray;
  font-size: 20px;
  text-align: center;
}

.total .experience {
  flex-shrink: 0;
  width: min(300px, 80%);
  height: 50px;
  background-color: black;
  color: white;
  margin: 30px auto;
  font-size: clamp(16px, 4vw, 25px);
  border-radius: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.total .experience:hover {
  background-color: #333; /* 更明显的悬浮色 */
}

.total .experience .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.total .experience:hover .arrow {
  transform: translateX(5px);
}
</style>
