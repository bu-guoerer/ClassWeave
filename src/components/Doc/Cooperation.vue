<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="cooperate">
    <div class="big">无缝协作</div>
    <div class="small">
      实时同步可确保你不会覆盖同事的工作。你可以在统一的“心流状态”下共同<br />评论、提建议和编辑内容。
    </div>
    <div class="pic"></div>

    <hr class="my-divider" />
    <div class="ready">准备好全自动内容创作了吗？</div>
    <div class="samll">加入数千专业人士的行列，将ClassWeave织课作为日常 AI 写作工具。</div>
    <div class="btn">
      <!-- 绑定点击事件 -->
      <button @click="goToLogin">立即免费试用</button>
    </div>
  </div>
</template>

<style scoped>
.cooperate {
  width: 100%;
  height: 1100px;
  /* background-color: skyblue; */
  text-align: center;
}

.cooperate .big {
  margin: 10px auto;
  width: 500px;
  padding-top: 50px;
  height: 100px;
  color: black;
  font-size: 50px;
  font-weight: 300;
  text-align: center;
}

.cooperate .small {
  width: 600px;
  height: 120px;
  margin: 0 auto;
  padding-top: 30px;
  font-size: 17px;
  color: rgba(0, 0, 0, 0.5);
}

.cooperate .pic {
  margin: 0 auto;
  width: 1000px;
  height: 500px;
  border: 1px rgba(0, 0, 0, 0.3) solid;
  border-radius: 20px;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.3);
  margin-bottom: 100px;
}

.cooperate .my-divider {
  color: rgba(0, 0, 0, 0.3);
}

.cooperate .ready {
  margin: 0 auto;
  padding: 50px 0;
  width: 600px;
  height: 100px;
  color: black;
  text-align: center;
  font-size: 30px;
}

.cooperate .btn {
  width: 400px;
  height: 100px;
  text-align: center;
  padding-top: 50px;
  margin: 0 auto;
}

.cooperate .btn button {
  display: inline-block;
  width: 200px;
  height: 50px;
  border-radius: 25px;
  background-color: black;
  color: white;
  font-size: 20px;
  cursor: pointer; /* 增加手型，提升用户体验 */
  border: none; /* 去掉默认边框 */
  transition: background-color 0.3s; /* 平滑过渡 */
}

.cooperate .btn button:hover {
  background-color: #333; /* 悬停效果 */
}
</style>
