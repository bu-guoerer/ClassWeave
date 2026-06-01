<template>
  <div class="fit-team">
    <div class="big">赋能每一支团队，成就每一位创作者</div>
    <div class="small">无论独立探索，还是百人协作，AI 助你效率跃升 3 倍，专注真正重要的事。</div>

    <button class="try" @click="goToLogin">限时免费试用</button>

    <div class="card-grid">
      <!-- 卡片 1：智能教案生成 -->
      <div class="feature-card card-1">
        <i class="card-icon iconfont icon-wendang" style="color: #3b82f6"></i>
        <h4 class="card-title">智能教案生成</h4>
        <p class="card-desc">输入主题，AI 自动生成结构化教案，支持个性化调整，节省备课时间。</p>
        <ul class="card-details">
          <li>结构化教案模板</li>
          <li>一键个性化调整</li>
        </ul>
      </div>

      <!-- 卡片 2：AI PPT 制作 -->
      <div class="feature-card card-2">
        <i class="card-icon iconfont icon-huandengpianicon" style="color: #f97316"></i>
        <h4 class="card-title">AI PPT 制作</h4>
        <p class="card-desc">从大纲到精美演示文稿，一键生成，内置教育主题模板，让课堂更生动。</p>
        <div class="card-preview">
          <div class="preview-img"></div>
        </div>
      </div>

      <!-- 卡片 3：课堂数据分析 -->
      <div class="feature-card card-3">
        <i class="card-icon iconfont icon-tubiao" style="color: #22c55e"></i>
        <h4 class="card-title">课堂数据分析</h4>
        <p class="card-desc">自动统计学生表现，生成可视化图表，洞察教学效果，优化课程设计。</p>
        <div class="card-slides">17 Slides <span>17张幻灯片</span></div>
        <div class="card-preview-card"></div>
      </div>

      <!-- 卡片 4：通用智能体 -->
      <div class="feature-card card-4">
        <i class="card-icon iconfont icon-zhinengti" style="color: #1e40af"></i>
        <h4 class="card-title">通用智能体</h4>
        <p class="card-desc">7×24小时智能助手，解答疑问、生成创意、处理任务，随时响应师生需求。</p>
        <div class="card-chart">
          <div class="chart-bar bar-1"></div>
          <div class="chart-bar bar-2"></div>
          <div class="chart-bar bar-3"></div>
        </div>
      </div>
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
.fit-team {
  width: 100%;
  margin: 80px auto;
}

.fit-team .big {
  width: 100%;
  margin: 10px auto;
  text-align: center;
  font-size: 50px;
  font-weight: 500;
  color: #111;
}

.fit-team .small {
  width: 100%;
  margin: 30px auto;
  text-align: center;
  font-size: 20px;
  color: #666;
  max-width: 800px;
}

.fit-team .try {
  display: block;
  margin: 30px auto 80px;
  width: 180px;
  height: 56px;
  background-color: #000;
  color: #fff;
  border-radius: 28px;
  font-size: 18px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fit-team .try:hover {
  background-color: #333;
  transform: translateY(-2px);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px;
}

.feature-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 48px 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-align: left;
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  will-change: transform;
  z-index: 1;
}

.card-1,
.card-3 {
  rotate: -1deg;
}

.card-2,
.card-4 {
  rotate: 1deg;
}

.card-1:hover,
.card-3:hover {
  transform: rotate(-4deg) translateY(-30px) scale(1.08);
  box-shadow: 0 40px 60px rgba(0, 0, 0, 0.15);
  border-color: #e0e0e0;
  z-index: 20;
}

.card-2:hover,
.card-4:hover {
  transform: rotate(4deg) translateY(-30px) scale(1.08);
  box-shadow: 0 40px 60px rgba(0, 0, 0, 0.15);
  border-color: #e0e0e0;
  z-index: 20;
}

.card-icon {
  font-size: 36px;
  margin-bottom: 20px;
  line-height: 1;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #111;
  line-height: 1.3;
}

.card-desc {
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 24px 0;
  flex: 1;
}

.card-details {
  list-style: none;
  padding: 0;
  margin: 0;
}

.card-details li {
  color: #555;
  font-size: 0.95rem;
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;
}

.card-details li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #888;
  font-size: 14px;
}

.card-preview {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: auto;
}

.preview-img {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #e67e22, #34495e, #95a5a6);
  opacity: 0.8;
}

.card-slides {
  color: #777;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.card-slides span {
  margin-left: 8px;
  color: #999;
}

.card-preview-card {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  background: linear-gradient(90deg, #fefefe, #f5f5f5, #eee);
  margin-top: auto;
}

.card-chart {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  height: 80px;
  margin-top: auto;
}

.chart-bar {
  flex: 1;
  background-color: #eee;
  border-radius: 4px 4px 0 0;
}

.chart-bar.bar-1 {
  height: 40%;
  background-color: #ddd;
}

.chart-bar.bar-2 {
  height: 60%;
  background-color: #999;
}

.chart-bar.bar-3 {
  height: 80%;
  background-color: #333;
}

@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
  }
  .card-1,
  .card-3 {
    rotate: -0.5deg;
  }
  .card-2,
  .card-4 {
    rotate: 0.5deg;
  }
  .card-1:hover,
  .card-3:hover {
    transform: rotate(-3deg) translateY(-25px) scale(1.06);
  }
  .card-2:hover,
  .card-4:hover {
    transform: rotate(3deg) translateY(-25px) scale(1.06);
  }
}

@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .fit-team .big {
    font-size: 36px;
  }
  .fit-team .small {
    font-size: 18px;
  }
  .fit-team .try {
    margin: 30px auto 40px;
  }
  .card-1,
  .card-2,
  .card-3,
  .card-4 {
    rotate: 0deg;
  }
  .card-1:hover,
  .card-2:hover,
  .card-3:hover,
  .card-4:hover {
    transform: translateY(-15px) scale(1.03);
    box-shadow: 0 25px 40px rgba(0, 0, 0, 0.1);
    z-index: 20;
  }
  .feature-card {
    padding: 32px 20px;
  }
}
</style>
