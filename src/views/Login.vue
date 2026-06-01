<template>
  <div class="login">
    <nav class="login-nav">
      <span class="nav-item" :class="{ active: activeTab === 'phone' }" @click="switchTab('phone')"
        >手机号</span
      >
      <span class="nav-item" :class="{ active: activeTab === 'email' }" @click="switchTab('email')"
        >邮箱</span
      >
      <span class="nav-item" :class="{ active: activeTab === 'qq' }" @click="switchTab('qq')"
        >QQ</span
      >
      <span
        class="nav-item"
        :class="{ active: activeTab === 'wechat' }"
        @click="switchTab('wechat')"
        >微信</span
      >
    </nav>

    <div class="login-form-container" v-show="activeTab === 'phone'">
      <PhoneLogin :key="'phone-' + activeTab" />
    </div>
    <div class="login-form-container" v-show="activeTab === 'email'">
      <EmailLogin :key="'email-' + activeTab" />
    </div>
    <div class="login-form-container" v-show="activeTab === 'qq'">
      <QrLogin platform="qq" @login-success="handleLoginSuccess" />
    </div>
    <div class="login-form-container" v-show="activeTab === 'wechat'">
      <QrLogin platform="wechat" @login-success="handleLoginSuccess" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PhoneLogin from '@/components/login/PhoneLogin.vue'
import EmailLogin from '@/components/login/EmailLogin.vue'
import QrLogin from '@/components/login/QrLogin.vue'

const activeTab = ref('phone')

function switchTab(tab) {
  activeTab.value = tab
}

function handleLoginSuccess(platform) {
  alert(`${platform === 'qq' ? 'QQ' : '微信'}登录成功（模拟跳转）`)
  // 实际开发可在此跳转到首页
  // router.push('/')
}
</script>

<style scoped>
/* 样式保持不变，仅展示关键部分 */
.login {
  margin: 100px auto;
  width: 900px;
  height: 600px;
  border: 1px rgb(255, 255, 255) solid;
  border-radius: 100px;
  box-shadow: 1px 1px 5px gray;
  background-color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
  overflow-y: auto;
}

.login-nav {
  display: flex;
  margin-top: 40px;
  padding: 0 30px;
  width: 100%;
  box-sizing: border-box;
}

.nav-item {
  flex: 1;
  text-align: center;
  padding: 16px 0 14px;
  font-size: 18px;
  font-weight: 500;
  color: #3a3a3a;
  border-bottom: 2px solid transparent;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.nav-item.active {
  color: #111;
  border-bottom-color: #222;
}

.nav-item:hover {
  color: #000;
  border-bottom-color: #888;
}

.login-form-container {
  width: 70%;
  max-width: 440px;
  margin: 60px auto 0;
}
</style>
