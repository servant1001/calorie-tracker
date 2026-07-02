<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import {
  ArrowRight,
  Bot,
  ChartLine,
  Dumbbell,
  Leaf,
  Lock,
  Mail,
  Sparkles,
  Weight,
} from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import calorieTrackerLogo from '@/assets/calorie-tracker-logo.png'
import { loginWithEmail } from '@/firebase/auth'
import { useAuthStore } from '@/stores/auth'
import type { AuthForm } from '@/types/auth'
import { showError, showSuccess } from '@/utils/message'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive<AuthForm>({
  email: '',
  password: '',
})

const featureItems = [
  { icon: Leaf, title: '飲食紀錄', description: '記錄每一餐與每日攝取熱量。' },
  { icon: Dumbbell, title: '運動管理', description: '掌握運動時間與消耗熱量。' },
  { icon: Weight, title: '體重追蹤', description: '持續觀察 BMI 與身體變化。' },
  { icon: ChartLine, title: '熱量分析', description: '用統計圖表看懂日常趨勢。' },
  { icon: Bot, title: 'AI 健康助手', description: '為下一階段的飲食分析預留空間。' },
]

const rules: FormRules<AuthForm> = {
  email: [
    { required: true, message: '請輸入 Email', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的 Email 格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 8, message: '密碼至少需要 8 碼', trigger: 'blur' },
  ],
}

async function handleLogin() {
  if (!formRef.value) {
    return
  }

  const isValid = await formRef.value.validate().catch(() => false)

  if (!isValid) {
    return
  }

  isSubmitting.value = true

  try {
    await loginWithEmail(form.email, form.password)
    showSuccess('登入成功。')

    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirectTarget)
  } catch (error) {
    showError(error, '登入失敗，請確認帳號密碼是否正確。')
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleLogin() {
  isSubmitting.value = true

  try {
    await authStore.signInWithGoogle()
    showSuccess('Google 登入成功。')

    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirectTarget)
  } catch (error) {
    showError(error, 'Google 登入失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-page__blur login-page__blur--green"></div>
    <div class="login-page__blur login-page__blur--blue"></div>
    <div class="login-page__blur login-page__blur--yellow"></div>

    <div class="login-layout">
      <aside class="login-hero">
        <div class="login-brand">
          <div class="login-brand__logo-shell">
            <img class="login-brand__logo" :src="calorieTrackerLogo" alt="Calorie Tracker logo" />
          </div>
          <div class="login-brand__copy">
            <p class="login-brand__name">Calorie Tracker</p>
            <p class="login-brand__kicker">Healthy Starts Here.</p>
          </div>
        </div>

        <div class="login-copy">
          <p class="login-copy__eyebrow">Daily wellness platform</p>
          <h1>健康，從今天開始。</h1>
          <p>
            紀錄每一餐，追蹤每一次運動，讓每日熱量管理變成一件清楚、柔和、可持續的事情。
          </p>
        </div>

        <div class="login-feature-grid">
          <article
            v-for="item in featureItems"
            :key="item.title"
            class="login-feature-card"
          >
            <div class="login-feature-card__icon">
              <component :is="item.icon" :size="18" />
            </div>
            <div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>

        <div class="login-illustration" aria-hidden="true">
          <div class="login-illustration__panel">
            <div class="login-illustration__pill">
              <Sparkles :size="16" />
              <span>Premium health experience</span>
            </div>
            <div class="login-illustration__chart">
              <div class="login-illustration__line"></div>
              <div class="login-illustration__dot login-illustration__dot--one"></div>
              <div class="login-illustration__dot login-illustration__dot--two"></div>
              <div class="login-illustration__dot login-illustration__dot--three"></div>
            </div>
            <div class="login-illustration__stats">
              <div>
                <strong>2,200</strong>
                <span>daily goal</span>
              </div>
              <div>
                <strong>+5</strong>
                <span>smart insights</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="login-panel">
        <div class="login-card">
          <div class="login-card__header">
            <div class="login-card__brand">
              <div class="login-card__brand-mark">
                <img :src="calorieTrackerLogo" alt="Calorie Tracker logo" />
              </div>
              <span>Calorie Tracker</span>
            </div>
            <p class="login-card__eyebrow">Welcome Back</p>
            <h2>歡迎回來</h2>
            <p>登入你的帳號，以繼續管理健康生活。</p>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item label="Email" prop="email">
              <el-input v-model="form.email" placeholder="name@example.com" size="large">
                <template #prefix>
                  <Mail :size="18" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Password" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                show-password
                placeholder="請輸入密碼"
                size="large"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <Lock :size="18" />
                </template>
              </el-input>
            </el-form-item>

            <el-button
              type="primary"
              size="large"
              class="login-form__primary"
              :loading="isSubmitting"
              native-type="submit"
            >
              登入
              <ArrowRight :size="18" />
            </el-button>

            <el-button
              size="large"
              plain
              class="login-form__google"
              :loading="isSubmitting"
              @click="handleGoogleLogin"
            >
              <span class="login-form__google-mark">G</span>
              <span>Google Login</span>
            </el-button>

            <div class="login-form__footer">
              <span>還沒有帳號？</span>
              <router-link to="/register">立即註冊</router-link>
            </div>
          </el-form>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 52%, #eff6ff 100%);
  padding: 32px;
}

.login-page__blur {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.28;
  pointer-events: none;
}

.login-page__blur--green {
  width: 340px;
  height: 340px;
  background: #10b981;
  top: -60px;
  left: -40px;
}

.login-page__blur--blue {
  width: 300px;
  height: 300px;
  background: #3b82f6;
  right: 8%;
  top: 14%;
}

.login-page__blur--yellow {
  width: 260px;
  height: 260px;
  background: #f4c84d;
  left: 38%;
  bottom: -40px;
}

.login-layout {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: 1.22fr 1fr;
  gap: 28px;
  align-items: stretch;
}

.login-hero,
.login-panel {
  min-height: 100%;
}

.login-hero {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  padding: 12px 8px;
}

.login-brand {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  width: fit-content;
  padding: 14px 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 24px 60px rgba(17, 24, 39, 0.08);
  backdrop-filter: blur(24px);
}

.login-brand__logo-shell {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(242, 252, 248, 0.92));
  box-shadow:
    inset 0 0 0 1px rgba(16, 185, 129, 0.1),
    0 18px 36px rgba(17, 24, 39, 0.08);
}

.login-brand__logo {
  width: 58px;
  height: 58px;
  object-fit: contain;
  flex: 0 0 auto;
  filter: drop-shadow(0 10px 18px rgba(59, 130, 246, 0.1));
}

.login-brand__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-brand__name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
}

.login-brand__kicker {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.login-copy__eyebrow,
.login-card__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #10b981;
  font-weight: 700;
}

.login-copy h1 {
  margin: 0;
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.04;
  letter-spacing: -0.04em;
  color: #111827;
}

.login-copy p:last-child {
  margin: 18px 0 0;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.7;
  color: #6b7280;
}

.login-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.login-feature-card {
  display: flex;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 60px rgba(17, 24, 39, 0.06);
  backdrop-filter: blur(20px);
  transition: transform 0.25s ease;
}

.login-feature-card:hover {
  transform: translateY(-2px);
}

.login-feature-card__icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.login-feature-card h2 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #111827;
}

.login-feature-card p {
  margin: 0;
  color: #6b7280;
  line-height: 1.55;
  font-size: 14px;
}

.login-illustration {
  display: flex;
  align-items: flex-end;
}

.login-illustration__panel {
  width: min(100%, 580px);
  border-radius: 28px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 30px 80px rgba(17, 24, 39, 0.08);
  backdrop-filter: blur(24px);
}

.login-illustration__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.1);
  color: #0f766e;
  font-size: 13px;
  font-weight: 600;
}

.login-illustration__chart {
  position: relative;
  margin-top: 22px;
  height: 110px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.03)),
    #ffffff;
  overflow: hidden;
}

.login-illustration__line {
  position: absolute;
  inset: auto 20px 26px 20px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6 0%, #10b981 55%, #f59e0b 100%);
  transform: skewY(-8deg);
}

.login-illustration__dot {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #10b981;
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
}

.login-illustration__dot--one {
  left: 22%;
  bottom: 43px;
}

.login-illustration__dot--two {
  left: 54%;
  bottom: 58px;
}

.login-illustration__dot--three {
  right: 12%;
  bottom: 71px;
}

.login-illustration__stats {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.login-illustration__stats div {
  padding: 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.9);
}

.login-illustration__stats strong {
  display: block;
  font-size: 28px;
  color: #111827;
}

.login-illustration__stats span {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-panel {
  display: grid;
  place-items: center;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(24px);
  padding: 40px;
  transition: transform 0.25s ease;
}

.login-card:hover {
  transform: translateY(-2px);
}

.login-card__header h2 {
  margin: 0;
  font-size: 34px;
  line-height: 1.15;
  color: #111827;
}

.login-card__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 6px 10px 6px 6px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.08);
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.login-card__brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(16, 185, 129, 0.12);
}

.login-card__brand-mark img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.login-card__header p:last-child {
  margin: 14px 0 0;
  color: #6b7280;
  line-height: 1.7;
}

.login-form {
  margin-top: 28px;
}

.login-form :deep(.el-form-item__label) {
  color: #111827;
  font-weight: 600;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.08) inset;
  background: rgba(255, 255, 255, 0.92);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 2px rgba(16, 185, 129, 0.18),
    0 0 0 1px #10b981 inset;
}

.login-form :deep(.el-input__prefix) {
  color: #6b7280;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.login-form__primary,
.login-form__google {
  width: 100%;
  min-height: 48px;
  margin-left: 0;
  margin-top: 8px;
  border-radius: 14px;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.login-form__primary {
  border: none;
  background: #10b981;
  box-shadow: 0 16px 32px rgba(16, 185, 129, 0.24);
}

.login-form__primary:hover,
.login-form__google:hover {
  transform: translateY(-2px);
}

.login-form__primary :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.login-form__google {
  border-color: rgba(17, 24, 39, 0.08);
  background: #ffffff;
  color: #111827;
}

.login-form__google-mark {
  margin: 0 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
}

.login-form__footer {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  color: #6b7280;
}

.login-form__footer a {
  font-weight: 700;
  color: #10b981;
}

@media (max-width: 1100px) {
  .login-layout {
    grid-template-columns: 1fr 0.92fr;
    gap: 20px;
  }

  .login-feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .login-page {
    padding: 20px;
  }

  .login-layout {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-hero {
    display: none;
  }

  .login-panel {
    min-height: calc(100vh - 40px);
  }

  .login-card {
    max-width: 420px;
    margin-inline: auto;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 14px;
  }

  .login-panel {
    min-height: calc(100vh - 28px);
  }

  .login-card {
    padding: 24px 20px;
    border-radius: 22px;
  }

  .login-card__header h2 {
    font-size: 28px;
  }

  .login-brand {
    padding: 12px 14px;
    gap: 12px;
  }

  .login-brand__logo-shell {
    width: 64px;
    height: 64px;
    border-radius: 20px;
  }

  .login-brand__logo {
    width: 46px;
    height: 46px;
  }

  .login-brand__name {
    font-size: 18px;
  }
}
</style>
