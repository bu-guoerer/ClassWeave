<template>
  <div class="total">
    <div class="english">A whole <span>different way</span></div>
    <div class="english">
      to do great work with AI.
      <!-- 办公套件卡片容器 -->
      <div class="card-container">
        <!-- 文档卡片 -->
        <div class="card doc-card">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="icon">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
        <!-- 表格卡片 -->
        <div class="card sheet-card">
          <div class="icon">
            <div class="header"></div>
            <div class="cell"></div>
            <div class="cell"></div>
            <div class="cell"></div>
            <div class="cell"></div>
          </div>
        </div>
        <!-- 图表卡片 -->
        <div class="card chart-card">
          <div class="icon">
            <div class="pie-chart"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="text">
      超越一键生成。与 AI 深度协同编辑，润色打磨出让你能从容分享给客户和同事的高品质成果。
    </div>

    <!-- 添加点击事件，跳转到登录页 -->
    <button class="experience" @click="goToLogin">立即体验 <span class="arrow">→</span></button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.total {
  margin: 20px auto;
  width: 100%;
  min-height: 300px; /* 改为 min-height，内容自适应 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 20px; /* 添加内边距防止贴边 */
}

.total .english {
  width: 100%;
  max-width: 1200px; /* 限制最大宽度 */
  margin: 10px auto;
  font-size: clamp(24px, 5vw, 50px); /* 响应式字体 */
  text-align: center;
  line-height: 1.4;
  color: black;
  font-family: 'Noto Sans SC Black', sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap; /* 允许换行 */
}

.total .english span {
  color: blueviolet;
}

/* 办公卡片样式 */
.card-container {
  display: flex;
  gap: -10px; /* 保留重叠效果 */
  margin-left: 10px;
  flex-wrap: wrap; /* 允许卡片换行 */
  justify-content: center;
}

.card {
  width: 60px;
  height: 60px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid #e0e0e0;
  z-index: 1;
  transition: transform 0.3s ease;
}

.doc-card {
  z-index: 3;
  transform: rotate(-30deg);
}

.chart-card {
  z-index: 1;
  transform: rotate(30deg);
}

.sheet-card {
  z-index: 2;
  transform: none;
}

.card-container:hover .doc-card {
  transform: rotate(-45deg) scale(1.2);
}
.card-container:hover .sheet-card {
  transform: scale(1.2);
}
.card-container:hover .chart-card {
  transform: rotate(45deg) scale(1.2);
}

/* 文档卡片内部细节 */
.doc-card .icon {
  width: 60%;
  height: 60%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.doc-card .line {
  height: 4px;
  border-radius: 2px;
}
.doc-card .line:nth-child(1) {
  width: 80%;
  background-color: #4285f4;
}
.doc-card .line:nth-child(2) {
  width: 60%;
  background-color: #4285f4;
}
.doc-card .line:nth-child(3) {
  width: 70%;
  background-color: #4285f4;
}
.doc-card .line:nth-child(4) {
  width: 40%;
  background-color: #e0e0e0;
}
.doc-card .dot {
  width: 5px;
  height: 5px;
  background-color: #4285f4;
  border-radius: 50%;
  position: absolute;
  left: 25%;
}
.doc-card .dot:nth-child(1) {
  top: 35%;
}
.doc-card .dot:nth-child(2) {
  top: 50%;
}
.doc-card .dot:nth-child(3) {
  top: 65%;
}

/* 表格卡片内部细节 */
.sheet-card .icon {
  width: 70%;
  height: 70%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 12px 1fr 1fr;
  border-radius: 4px;
  overflow: hidden;
}
.sheet-card .header {
  grid-column: 1 / -1;
  background-color: #34a853;
}
.sheet-card .cell {
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
}

/* 图表卡片内部细节 */
.chart-card .icon {
  width: 70%;
  height: 70%;
  position: relative;
}
.chart-card .pie-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(#ea4335 0% 75%, #fbbcad 75% 100%);
}

.total .text {
  max-width: 1000px;
  width: 90%;
  margin: 10px auto;
  color: gray;
  text-align: center;
  font-size: clamp(14px, 2.5vw, 20px);
  line-height: 1.6;
  padding: 0 10px;
}

.total .experience {
  flex-shrink: 0;
  width: min(300px, 80%);
  height: 50px;
  background-color: black;
  color: white;
  margin: 10px auto;
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
  background-color: rgb(37, 37, 37);
}

.total .experience .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.total .experience:hover .arrow {
  transform: translateX(5px);
}

/* 小屏幕优化 */
@media (max-width: 768px) {
  .total .english {
    gap: 10px;
  }
  .card-container {
    margin-left: 0;
    gap: -5px;
  }
  .card {
    width: 50px;
    height: 50px;
  }
  .total .text {
    width: 100%;
  }
}
</style>
