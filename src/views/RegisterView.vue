<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import {
  Apple,
  ArrowRight,
  Bot,
  ChartLine,
  Dumbbell,
  Leaf,
  Lock,
  Mail,
  Sparkles,
  User,
  Weight,
} from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { registerWithEmail } from '@/firebase/auth'
import type { RegisterForm } from '@/types/auth'
import { showError, showSuccess } from '@/utils/message'

const router = useRouter()
const formRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive<RegisterForm>({
  nickname: '',
  email: '',
  password: '',
})

const featureItems = [
  { icon: Leaf, title: '飲食紀錄', description: '建立自己的每日飲食與熱量檔案。' },
  { icon: Dumbbell, title: '運動管理', description: '累積每次運動與消耗數據。' },
  { icon: Weight, title: '體重追蹤', description: '持續記錄體重與 BMI 變化。' },
  { icon: ChartLine, title: '熱量分析', description: '逐步建立專屬的健康趨勢圖表。' },
  { icon: Bot, title: 'AI 健康助手', description: '為未來的 AI 建議功能先準備好資料。' },
]

const rules: FormRules<RegisterForm> = {
  nickname: [
    { required: true, message: '請輸入暱稱', trigger: 'blur' },
    { min: 2, message: '暱稱至少需要 2 個字元', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '請輸入 Email', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的 Email 格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 8, message: '密碼至少需要 8 碼', trigger: 'blur' },
  ],
}

async function handleRegister() {
  if (!formRef.value) {
    return
  }

  const isValid = await formRef.value.validate().catch(() => false)

  if (!isValid) {
    return
  }

  isSubmitting.value = true

  try {
    await registerWithEmail(form)
    showSuccess('註冊成功，已為你建立基本個人資料。')
    await router.push('/')
  } catch (error) {
    showError(error, '註冊失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="register-page">
    <div class="register-page__blur register-page__blur--green"></div>
    <div class="register-page__blur register-page__blur--blue"></div>
    <div class="register-page__blur register-page__blur--yellow"></div>

    <div class="register-layout">
      <aside class="register-hero">
        <div class="register-brand">
          <div class="register-brand__mark">
            <Apple :size="18" />
            <Leaf :size="18" />
          </div>
          <div>
            <p class="register-brand__name">Calorie Tracker</p>
            <p class="register-brand__kicker">Healthy Starts Here.</p>
          </div>
        </div>

        <div class="register-copy">
          <p class="register-copy__eyebrow">Account setup</p>
          <h1>建立你的健康起點。</h1>
          <p>
            只要幾個欄位，就能開始建立每日熱量、運動與體重管理的專屬空間。
          </p>
        </div>

        <div class="register-feature-grid">
          <article
            v-for="item in featureItems"
            :key="item.title"
            class="register-feature-card"
          >
            <div class="register-feature-card__icon">
              <component :is="item.icon" :size="18" />
            </div>
            <div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>

        <div class="register-illustration" aria-hidden="true">
          <div class="register-illustration__panel">
            <div class="register-illustration__pill">
              <Sparkles :size="16" />
              <span>Build your healthy routine</span>
            </div>
            <div class="register-illustration__stack">
              <div class="register-illustration__mini-card">
                <strong>Profile</strong>
                <span>height · weight · goal</span>
              </div>
              <div class="register-illustration__mini-card">
                <strong>Tracking</strong>
                <span>food · exercise · weight</span>
              </div>
              <div class="register-illustration__mini-card">
                <strong>Insights</strong>
                <span>calories · trends · progress</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="register-panel">
        <div class="register-card">
          <div class="register-card__header">
            <p class="register-card__eyebrow">Create Account</p>
            <h2>開始建立帳號</h2>
            <p>完成註冊後，系統會依照你的帳號建立個人健康資料。</p>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="register-form"
            @submit.prevent="handleRegister"
          >
            <el-form-item label="暱稱" prop="nickname">
              <el-input v-model="form.nickname" placeholder="請輸入暱稱" size="large">
                <template #prefix>
                  <User :size="18" />
                </template>
              </el-input>
            </el-form-item>

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
                placeholder="至少 8 碼"
                size="large"
                @keyup.enter="handleRegister"
              >
                <template #prefix>
                  <Lock :size="18" />
                </template>
              </el-input>
            </el-form-item>

            <el-button
              type="primary"
              size="large"
              class="register-form__primary"
              :loading="isSubmitting"
              native-type="submit"
            >
              建立帳號
              <ArrowRight :size="18" />
            </el-button>

            <div class="register-form__footer">
              <span>已經有帳號？</span>
              <router-link to="/login">前往登入</router-link>
            </div>
          </el-form>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.register-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 52%, #eff6ff 100%);
  padding: 32px;
}

.register-page__blur {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.28;
  pointer-events: none;
}

.register-page__blur--green {
  width: 340px;
  height: 340px;
  background: #10b981;
  top: -60px;
  left: -40px;
}

.register-page__blur--blue {
  width: 300px;
  height: 300px;
  background: #3b82f6;
  right: 8%;
  top: 14%;
}

.register-page__blur--yellow {
  width: 260px;
  height: 260px;
  background: #f4c84d;
  left: 38%;
  bottom: -40px;
}

.register-layout {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: 1.22fr 1fr;
  gap: 28px;
  align-items: stretch;
}

.register-hero,
.register-panel {
  min-height: 100%;
}

.register-hero {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  padding: 12px 8px;
}

.register-brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.register-brand__mark {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(16, 185, 129, 0.18);
  box-shadow: 0 20px 50px rgba(17, 24, 39, 0.08);
  display: grid;
  place-items: center;
  color: #10b981;
  position: relative;
}

.register-brand__mark :deep(svg:last-child) {
  position: absolute;
  bottom: 10px;
  right: 8px;
  color: #3b82f6;
}

.register-brand__name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.register-brand__kicker {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.register-copy__eyebrow,
.register-card__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #10b981;
  font-weight: 700;
}

.register-copy h1 {
  margin: 0;
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.04;
  letter-spacing: -0.04em;
  color: #111827;
}

.register-copy p:last-child {
  margin: 18px 0 0;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.7;
  color: #6b7280;
}

.register-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.register-feature-card {
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

.register-feature-card:hover {
  transform: translateY(-2px);
}

.register-feature-card__icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.register-feature-card h2 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #111827;
}

.register-feature-card p {
  margin: 0;
  color: #6b7280;
  line-height: 1.55;
  font-size: 14px;
}

.register-illustration {
  display: flex;
  align-items: flex-end;
}

.register-illustration__panel {
  width: min(100%, 580px);
  border-radius: 28px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 30px 80px rgba(17, 24, 39, 0.08);
  backdrop-filter: blur(24px);
}

.register-illustration__pill {
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

.register-illustration__stack {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.register-illustration__mini-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
}

.register-illustration__mini-card strong {
  display: block;
  font-size: 20px;
  color: #111827;
}

.register-illustration__mini-card span {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 14px;
}

.register-panel {
  display: grid;
  place-items: center;
}

.register-card {
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

.register-card:hover {
  transform: translateY(-2px);
}

.register-card__header h2 {
  margin: 0;
  font-size: 34px;
  line-height: 1.15;
  color: #111827;
}

.register-card__header p:last-child {
  margin: 14px 0 0;
  color: #6b7280;
  line-height: 1.7;
}

.register-form {
  margin-top: 28px;
}

.register-form :deep(.el-form-item__label) {
  color: #111827;
  font-weight: 600;
}

.register-form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.08) inset;
  background: rgba(255, 255, 255, 0.92);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.register-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 2px rgba(16, 185, 129, 0.18),
    0 0 0 1px #10b981 inset;
}

.register-form :deep(.el-input__prefix) {
  color: #6b7280;
}

.register-form :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.register-form__primary {
  width: 100%;
  min-height: 48px;
  margin-left: 0;
  margin-top: 8px;
  border-radius: 14px;
  font-weight: 600;
  border: none;
  background: #10b981;
  box-shadow: 0 16px 32px rgba(16, 185, 129, 0.24);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.register-form__primary:hover {
  transform: translateY(-2px);
}

.register-form__primary :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.register-form__footer {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  color: #6b7280;
}

.register-form__footer a {
  font-weight: 700;
  color: #10b981;
}

@media (max-width: 1100px) {
  .register-layout {
    grid-template-columns: 1fr 0.92fr;
    gap: 20px;
  }

  .register-feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .register-page {
    padding: 20px;
  }

  .register-layout {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .register-hero {
    display: none;
  }

  .register-panel {
    min-height: calc(100vh - 40px);
  }

  .register-card {
    max-width: 420px;
    margin-inline: auto;
  }
}

@media (max-width: 640px) {
  .register-page {
    padding: 14px;
  }

  .register-panel {
    min-height: calc(100vh - 28px);
  }

  .register-card {
    padding: 24px 20px;
    border-radius: 22px;
  }

  .register-card__header h2 {
    font-size: 28px;
  }
}
</style>
