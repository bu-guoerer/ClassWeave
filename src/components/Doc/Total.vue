<template>
  <div class="total">
    <div class="icon">
      <div class="list-icon">
        <div class="list-row">
          <span class="dot"></span>
          <span class="bar full"></span>
        </div>
        <div class="list-row">
          <span class="dot"></span>
          <span class="bar half"></span>
        </div>
        <div class="list-row">
          <span class="dot"></span>
          <span class="bar partial"></span>
          <span class="bar empty"></span>
        </div>
        <div class="list-row placeholder">
          <span class="bar empty"></span>
        </div>
      </div>
    </div>
    <div class="big">终极 AI 教案生成与写作工具</div>
    <div class="small">
      别再对着空白页面发呆了。使用我们专业的 AI 报告生成器，几秒钟内即可<br />起草文章、创建商务文档并自动格式化报告。
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
/* 原有 total 样式保持不变 */
.total {
  margin: 50px auto 0px;
  width: 100%;
  height: 500px;
  text-align: center;
}

/* 图标容器：移除额外内边距，让内部元素贴近边框 */
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
  padding: 0; /* 确保无额外内边距 */
}

/* 核心调整：扩大列表宽度（贴近容器边框）+ 极致窄间距 */
.list-icon {
  width: 40px; /* 从32px扩到40px，贴近80px容器的左右边框 */
  display: flex;
  flex-direction: column;
  gap: 3px; /* 行间距缩到极致3px */
  padding: 0; /* 移除列表自身内边距 */
}

.list-row {
  display: flex;
  align-items: center;
  gap: 3px; /* 点和条的间距缩到极致3px */
  width: 100%; /* 确保行占满列表宽度，横线能拉到最长 */
}

/* 保持6px超小圆点 */
.dot {
  width: 6px;
  height: 6px;
  background-color: #1677ff;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 保持3px极细横线 */
.bar {
  height: 3px;
  border-radius: 1.5px;
  flex-shrink: 1; /* 允许横线自适应拉伸 */
}

/* 极致拉长横线：占满可用宽度 */
.bar.full {
  width: calc(100% - 9px); /* 100% - 圆点宽度(6px) - 间距(3px)，拉满剩余宽度 */
  background-color: #1677ff;
}
.bar.half {
  width: calc(85% - 9px); /* 85%占比 + 扣除圆点/间距，更长 */
  background-color: #1677ff;
}
.bar.partial {
  width: calc(70% - 9px); /* 70%占比 + 扣除圆点/间距，更长 */
  background-color: #1677ff;
}
.bar.empty {
  width: calc(50% - 9px); /* 50%占比 + 扣除圆点/间距，更长 */
  background-color: #e5e7eb;
}

/* 占位行横线拉满：无圆点，直接占满宽度 */
.list-row.placeholder {
  padding-left: 9px; /* 6px圆点 + 3px间距 = 9px，精准对齐 */
}
.list-row.placeholder .bar.empty {
  width: 100%; /* 占位行横线直接拉满 */
}

/* 原有文字和按钮样式保持不变 */
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
  background-color: #333;
}
.total .experience .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}
.total .experience:hover .arrow {
  transform: translateX(5px);
}

@media (max-width: 768px) {
  .total {
    height: auto; /* 高度自适应 */
    margin: 30px auto 0;
    padding: 0 15px; /* 左右留边距 */
  }

  .total .big {
    font-size: 40px; /* 缩小主标题 */
    line-height: 1.2;
    margin: 15px 0;
  }

  .total .small {
    font-size: 16px;
    margin: 15px 0;
    padding: 0 10px;
  }

  .total .experience {
    width: 200px; /* 按钮固定宽度略小 */
    height: 46px;
    font-size: 18px;
    margin: 20px auto;
  }

  /* 图标稍微缩小一点 */
  .icon {
    width: 70px;
    height: 70px;
    border-radius: 20px;
  }

  .list-icon {
    width: 36px; /* 图标内列表宽度微调 */
  }
}

@media (max-width: 480px) {
  .total .big {
    font-size: 32px;
  }

  .total .small {
    font-size: 14px;
  }

  .total .experience {
    width: 180px;
    height: 42px;
    font-size: 16px;
  }

  .icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
  }

  .list-icon {
    width: 30px;
    gap: 2px;
  }

  .list-row {
    gap: 2px;
  }

  .dot {
    width: 5px;
    height: 5px;
  }

  .bar {
    height: 2px;
  }
}
</style>
