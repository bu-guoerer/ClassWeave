<script>
export default {
  methods: {
    goToLogin() {
      // 确保项目中已配置 Vue Router，且登录路径为 '/login'
      this.$router.push('/login')
    },
  },
}
</script>

<template>
  <div class="profession">
    <div class="professional">
      <div class="title">受追求品质与效率的专业人士信赖</div>
      <ul>
        <li>
          <div class="career">品牌经理</div>
          <div class="comment">
            "We have strict VI guidelines. ClassWeave is the first AI that perfectly followed our
            uploaded corporate templates—fonts, colors, complex layouts. It automated brand
            compliance and saved us hours."
          </div>
          <div class="name">Emma</div>
          <div class="degree">伦敦 全球品牌经理</div>
        </li>
        <li>
          <div class="career">品牌经理</div>
          <div class="comment">
            "We have strict VI guidelines. ClassWeave is the first AI that perfectly followed our
            uploaded corporate templates—fonts, colors, complex layouts. It automated brand
            compliance and saved us hours."
          </div>
          <div class="name">Emma</div>
          <div class="degree">伦敦 全球品牌经理</div>
        </li>
        <li>
          <div class="career">品牌经理</div>
          <div class="comment">
            "We have strict VI guidelines. ClassWeave is the first AI that perfectly followed our
            uploaded corporate templates—fonts, colors, complex layouts. It automated brand
            compliance and saved us hours."
          </div>
          <div class="name">Emma</div>
          <div class="degree">伦敦 全球品牌经理</div>
        </li>
        <li>
          <div class="career">品牌经理</div>
          <div class="comment">
            "We have strict VI guidelines. ClassWeave is the first AI that perfectly followed our
            uploaded corporate templates—fonts, colors, complex layouts. It automated brand
            compliance and saved us hours."
          </div>
          <div class="name">Emma</div>
          <div class="degree">伦敦 全球品牌经理</div>
        </li>
      </ul>
      <!-- 按钮改造：文字与箭头分离，添加点击事件 -->
      <div class="btn">
        <button class="try" @click="goToLogin">免费试用 <span class="arrow">→</span></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  list-style: none;
}

.profession {
  width: 100%;
  min-height: 900px; /* 改为最小高度，内容增多时自动扩展 */
  height: auto; /* 确保高度自适应 */
  background: url(../../assets/images/bg.jpg) no-repeat;
  background-size: cover;
  background-color: black;
}

.profession .professional {
  width: 100%;
  min-height: 900px; /* 与父级保持一致，确保渐变覆盖 */
  height: auto;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.5) 0%,
    black 15%,
    black 50%,
    black 75%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.profession .professional .title {
  padding: 80px;
  width: 100%;
  text-align: center;
  color: white;
  font-weight: 300;
  font-size: 50px;
}

.profession .professional ul {
  display: grid;
  grid-template-columns: repeat(2, 500px);
  gap: 30px;
  justify-content: center;
  padding: 0;
  margin: 0 auto;
  width: fit-content;
}

.profession .professional li {
  width: 500px;
  height: 250px;
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  /* 保证长单词换行 */
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.profession .professional li .career {
  display: inline-block;
  margin-top: 20px;
  margin-left: 20px;
  width: 100px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.3);
  text-align: center;
  border-radius: 15px;
}

.profession .professional li .comment {
  margin-top: 20px;
  margin-left: 20px;
  width: 80%;
  height: 40%; /* 桌面端依赖父级固定高度 */
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.profession .professional li .name {
  margin-top: 10px;
  margin-left: 20px;
}

.profession .professional li .degree {
  margin-left: 20px;
  color: rgba(134, 127, 127, 0.8);
}

.profession .professional .btn {
  margin: 0 auto;
  width: 150px;
  height: 50px;
  text-align: center;
}

/* 按钮基础样式 */
.profession .professional .try {
  display: inline-block;
  margin: 40px auto 0;
  padding: 0 25px;
  height: 50px;
  font-size: 15px;
  border-radius: 25px;
  border: none;
  background-color: white;
  color: black;
  cursor: pointer;
  line-height: 50px;
  transition: background-color 0.2s;
}

.profession .professional .try:hover {
  background-color: #f0f0f0;
}

/* 箭头动画 */
.profession .professional .try .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.profession .professional .try:hover .arrow {
  transform: translateX(5px);
}

/* ---------- 平板适配 (769px ~ 1024px) ---------- */
@media (min-width: 769px) and (max-width: 1024px) {
  .profession .professional .title {
    padding: 60px 30px;
    font-size: 44px;
  }

  .profession .professional ul {
    grid-template-columns: repeat(2, 1fr); /* 两列自适应 */
    width: 100%;
    padding: 0 30px;
    gap: 20px;
  }

  .profession .professional li {
    width: auto; /* 取消固定宽度，由网格控制 */
    height: auto; /* 高度自适应 */
    min-height: 250px; /* 保持最小高度，视觉统一 */
  }

  .profession .professional li .comment {
    height: auto; /* 取消百分比高度 */
    width: calc(100% - 40px); /* 留出左右边距 */
  }
}

/* ---------- 手机适配 (max-width: 768px) ---------- */
@media (max-width: 768px) {
  .profession .professional .title {
    padding: 40px 20px;
    font-size: 32px;
  }

  .profession .professional ul {
    grid-template-columns: 1fr; /* 单列布局 */
    width: 100%;
    padding: 0 20px;
    gap: 20px;
  }

  .profession .professional li {
    width: auto;
    height: auto;
    min-height: 220px; /* 适当降低最小高度，避免过于空旷 */
  }

  .profession .professional li .comment {
    height: auto;
    width: calc(100% - 40px);
    margin-top: 15px; /* 微调间距 */
  }

  .profession .professional li .name {
    margin-top: 8px;
  }

  .profession .professional li .degree {
    margin-bottom: 15px; /* 底部留白，避免紧贴边缘 */
  }

  .profession .professional .btn {
    width: 100%; /* 让按钮容器充满，便于居中 */
    margin-top: 20px;
  }

  .profession .professional .try {
    margin-top: 20px; /* 减小上边距 */
  }
}
</style>
