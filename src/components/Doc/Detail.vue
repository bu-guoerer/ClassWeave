<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="detail">
    <div class="left total">
      <div class="pic">
        <div class="img"><img src="" alt="" /></div>
      </div>
      <div class="big">不止是编辑器，更是强大的 AI 写作助手</div>
      <div class="small">
        立即生成内容块。使用我们的无干扰界面，只需一键即可扩展、缩短或重写文本。
      </div>
      <div class="btn"><button @click="goToLogin">去试试</button></div>
    </div>
    <div class="right total">
      <div class="pic">
        <div class="img"><img src="" alt="" /></div>
      </div>
      <div class="big">借助对话式 AI 优化内容</div>
      <div class="small">
        这是唯一支持反复迭代的 AI 文本生成器。别满足于初稿 — 借助侧边栏与 AI 交流，将文档打磨至完美
      </div>
      <div class="btn"><button @click="goToLogin">去试试</button></div>
    </div>
  </div>
</template>

<style scoped>
.detail {
  padding: 20px;
  width: 100%;
  height: 700px;
  /* background-color: skyblue; */
}

.detail .total {
  margin: 0 auto;
  width: 60%;
  height: 300px;
  /* border: 1px rgba(128, 126, 126, 0.1) solid; */
  background-color: rgba(128, 126, 126, 0.1);
  border-radius: 20px;
}

.detail .total .pic {
  width: 50%;
  height: 100%;
  /* background-color: skyblue; */
  border-radius: 20px;
}

.detail .total .big {
  width: 40%;
  height: 40%;
  font-size: 30px;
  color: black;
}

.detail .total .small {
  width: 40%;
  height: 20%;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.5);
}

.detail .total .btn {
  width: 40%;
  height: 20%;
}

.detail .total .btn button {
  display: inline-block;
  width: 100px;
  height: 40px;
  border-radius: 20px;
  background-color: black;
  color: white;
}

.detail .total .btn button:hover {
  background-color: rgb(61, 60, 60);
}

.detail .left {
  position: relative;
  margin: 0 auto;
}

.detail .left .pic {
  position: absolute;
  background: url(../../assets/images/bgi1.png) no-repeat;
  background-color: cover;
}

.detail .left .big {
  position: absolute;
  padding: 10px;
  right: 0;
  top: 30px;
  right: 45px;
}

.detail .left .small {
  padding: 10px;
  position: absolute;
  top: 130px;
  right: 45px;
}

.detail .left .btn {
  padding-left: 10px;
  position: absolute;
  /* background-color: skyblue; */
  right: 45px;
  bottom: 10px;
}

.detail .left .pic .img {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 90%;
  border: 1px black solid;
  border-radius: 20px 20px 0 0;
}

.detail .right {
  position: relative;
  margin: 40px auto 0;
}

.detail .right .big {
  position: absolute;
  padding: 10px;
  top: 30px;
  left: 45px;
}

.detail .right .small {
  padding: 10px;
  position: absolute;
  top: 100px;
  left: 45px;
}

.detail .right .btn {
  padding-left: 10px;
  position: absolute;
  /* background-color: skyblue; */
  left: 45px;
  bottom: 40px;
}

.detail .right .pic {
  position: absolute;
  right: 0;
  background: url(../../assets/images/bgi2.jpg) no-repeat;
  background-color: cover;
}

.detail .right .pic .img {
  position: absolute;
  bottom: 0;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  height: 90%;
  border: 1px black solid;
  border-radius: 20px;
}

@media (max-width: 768px) {
  .detail {
    padding: 10px;
    height: auto; /* 高度自适应 */
  }

  .detail .total {
    width: 100%; /* 宽度撑满 */
    height: auto;
    margin: 0 auto 20px; /* 底部留白 */
  }

  .detail .left,
  .detail .right {
    position: relative; /* 取消绝对定位上下文 */
    margin: 0 auto 20px;
  }

  /* 图片区域：调整宽高，恢复相对定位 */
  .detail .left .pic,
  .detail .right .pic {
    position: relative;
    width: 100%;
    height: 180px; /* 固定图片区域高度 */
    background-size: cover;
    background-position: center;
    margin-bottom: 15px;
  }

  /* 图片内的 img 占位框 */
  .detail .left .pic .img,
  .detail .right .pic .img {
    position: absolute;
    bottom: auto;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    height: 90%;
    border-radius: 12px;
  }

  /* 文字区块取消绝对定位，改为块级布局 */
  .detail .left .big,
  .detail .right .big {
    position: static;
    width: 90%;
    margin: 0 auto 10px;
    padding: 0;
    font-size: 24px;
    text-align: center;
  }

  .detail .left .small,
  .detail .right .small {
    position: static;
    width: 90%;
    margin: 0 auto 15px;
    padding: 0;
    font-size: 14px;
    text-align: center;
  }

  .detail .left .btn,
  .detail .right .btn {
    position: static;
    width: 100%;
    text-align: center;
    padding: 0;
    margin: 10px 0 20px;
  }

  .detail .total .btn button {
    width: 120px;
    height: 44px;
    font-size: 16px;
  }

  /* 调整左右两个盒子的背景色圆角 */
  .detail .total {
    border-radius: 16px;
    overflow: hidden;
  }

  /* 去除原来多余的 right/left 偏移 */
  .detail .left .big,
  .detail .left .small,
  .detail .left .btn {
    right: auto;
  }

  .detail .right .big,
  .detail .right .small,
  .detail .right .btn {
    left: auto;
  }
}

/* 超小屏（max-width: 480px）进一步微调 */
@media (max-width: 480px) {
  .detail .left .big,
  .detail .right .big {
    font-size: 20px;
  }

  .detail .left .small,
  .detail .right .small {
    font-size: 13px;
  }

  .detail .total .btn button {
    width: 100px;
    height: 40px;
    font-size: 14px;
  }
}
</style>
