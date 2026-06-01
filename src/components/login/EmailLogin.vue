<!-- 邮箱登录逻辑 -->
<template>
  <div class="email-login">
    <!-- 邮箱输入框 + 错误提示 -->
    <div class="form-item">
      <input
        type="email"
        placeholder="邮箱"
        class="form-input"
        :class="{ 'input-error': emailError }"
        v-model="email"
        @input="validateEmail"
        ref="emailInput"
      />
      <div class="error-message" v-if="emailError">{{ emailError }}</div>
    </div>

    <!-- 图形验证码：输入框 + 动态验证码图片（点击刷新）+ 错误提示 -->
    <div class="form-item">
      <div class="captcha-row">
        <div class="captcha-input">
          <input
            type="text"
            placeholder="图形验证码"
            class="form-input"
            :class="{ 'input-error': captchaError }"
            v-model="captchaInput"
            @input="captchaError = ''"
            ref="captchaInputRef"
          />
        </div>
        <div class="captcha-image" aria-label="图形验证码" @click="handleRefreshClick">
          <canvas ref="captchaCanvas" width="100" height="48"></canvas>
        </div>
      </div>
      <div class="error-message" v-if="captchaError">{{ captchaError }}</div>
    </div>

    <!-- 邮箱验证码：输入框 + 获取按钮 + 错误提示 -->
    <div class="form-item sms-row">
      <div class="sms-input">
        <input
          type="text"
          placeholder="邮箱验证码"
          class="form-input"
          :class="{ 'input-error': emailCodeError }"
          v-model="emailCode"
          @input="validateEmailCode"
          ref="emailCodeInput"
        />
      </div>
      <button class="sms-btn" @click="handleGetEmailCode" :disabled="emailCodeCountdown > 0">
        {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}秒后重新获取` : '获取验证码' }}
      </button>
    </div>
    <div class="error-message" v-if="emailCodeError">{{ emailCodeError }}</div>

    <!-- 提示：未注册邮箱将自动注册 -->
    <div class="form-tip">未注册的邮箱将自动注册账号</div>

    <!-- 登录按钮 -->
    <button class="login-btn" @click="handleLogin" :disabled="loginLoading">
      <span v-if="loginLoading" class="loading-spinner"></span>
      {{ loginLoading ? '登录中...' : '登录' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useCaptcha } from '@/composables/useCaptcha'
import { useCountdown } from '@/composables/useCountdown'

// 表单数据
const email = ref('')
const captchaInput = ref('')
const emailCode = ref('')

// 错误信息
const emailError = ref('')
const captchaError = ref('')
const emailCodeError = ref('')

// 登录 loading
const loginLoading = ref(false)

// 邮箱验证码倒计时
const { countdown: emailCodeCountdown, start: startEmailCodeCountdown } = useCountdown(60)

// DOM 引用
const emailInput = ref(null)
const captchaInputRef = ref(null)
const emailCodeInput = ref(null)

// 图形验证码
const { captchaCode, captchaCanvas, initCaptcha, refreshCaptcha, drawCaptcha } = useCaptcha()

// 邮箱合法性检查
function validateEmail() {
  const value = email.value.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!value) {
    emailError.value = '邮箱不能为空'
  } else if (!emailRegex.test(value)) {
    emailError.value = '请输入合法的邮箱地址'
  } else {
    emailError.value = ''
  }
}

// 邮箱验证码格式检查
function validateEmailCode() {
  const value = emailCode.value.trim()
  if (value && !/^\d{6}$/.test(value)) {
    emailCodeError.value = '验证码必须为6位数字'
  } else {
    emailCodeError.value = ''
  }
}

// 获取邮箱验证码（模拟）
async function handleGetEmailCode() {
  validateEmail()
  if (emailError.value) {
    emailInput.value?.focus()
    return
  }

  if (captchaInput.value !== captchaCode.value) {
    captchaError.value = '图形验证码不正确'
    refreshCaptcha()
    await nextTick()
    captchaInputRef.value?.focus()
    return
  }

  alert('验证码已发送至邮箱（模拟）')
  startEmailCodeCountdown()
}

// 登录操作
async function handleLogin() {
  validateEmail()
  if (emailError.value) {
    emailInput.value?.focus()
    return
  }

  if (captchaInput.value !== captchaCode.value) {
    captchaError.value = '图形验证码不正确'
    refreshCaptcha()
    await nextTick()
    captchaInputRef.value?.focus()
    return
  }

  validateEmailCode()
  if (emailCodeError.value) {
    emailCodeInput.value?.focus()
    return
  }

  loginLoading.value = true
  setTimeout(() => {
    alert('邮箱登录成功（模拟）')
    loginLoading.value = false
  }, 1000)
}

// 主动刷新（点击图片时调用）
function handleRefreshClick() {
  refreshCaptcha()
  captchaError.value = ''
  captchaInput.value = ''
}

onMounted(() => {
  initCaptcha()
})
</script>

<style scoped>
/* 样式与 PhoneLogin.vue 完全相同，此处略（可复制相同样式） */
.email-login {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  width: 100%;
  position: relative;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  font-size: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 40px;
  background-color: #ffffff;
  outline: none;
  box-sizing: border-box;
  transition:
    border 0.2s ease,
    box-shadow 0.2s ease;
  color: #333;
}

.form-input.input-error {
  border-color: #e53e3e;
}

.form-input::placeholder {
  color: #aaa;
  font-weight: 300;
}

.form-input:focus {
  border-color: #888;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.02);
}

.error-message {
  font-size: 12px;
  color: #e53e3e;
  margin-top: 4px;
  margin-left: 16px;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-image {
  flex-shrink: 0;
  width: 100px;
  height: 48px;
  border-radius: 40px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  box-sizing: border-box;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.captcha-image:hover {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.captcha-image canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.sms-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sms-input {
  flex: 1;
  min-width: 0;
}

.sms-btn {
  flex-shrink: 0;
  padding: 14px 18px;
  font-size: 15px;
  color: #3a3a3a;
  background-color: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 40px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.3px;
  outline: none;
}

.sms-btn:hover {
  background-color: #f5f5f5;
  border-color: #aaa;
  color: #111;
}

.sms-btn:active {
  background-color: #eaeaea;
}

.form-tip {
  font-size: 14px;
  color: #777;
  text-align: center;
  margin-top: 5px;
  margin-bottom: 5px;
  letter-spacing: 0.3px;
  border-top: 1px dashed #d0d0d0;
  padding-top: 18px;
}

.login-btn {
  width: 100%;
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  background-color: #2a2a2a;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  letter-spacing: 1px;
  margin-top: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.login-btn:hover {
  background-color: #111;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.login-btn:active {
  background-color: #222;
  transform: scale(0.98);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 按钮禁用样式 */
.sms-btn:disabled,
.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
