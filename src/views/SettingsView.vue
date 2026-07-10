<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import type { UserProfile } from '@/types/profile'
import { calculateBmi, getBmiLabel } from '@/utils/health'
import { showError, showSuccess } from '@/utils/message'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const formRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive<UserProfile>({
  nickname: '',
  gender: 'other',
  age: 18,
  height: 170,
  weight: 70,
  targetWeight: 65,
  dailyGoal: 2200,
  dailyExerciseGoal: 300,
  activityLevel: 'medium',
  dietaryPreferences: [],
})

const currentBmi = computed(() => calculateBmi(form.weight, form.height))

const rules: FormRules<UserProfile> = {
  nickname: [{ required: true, message: '請輸入暱稱', trigger: 'blur' }],
  age: [{ required: true, message: '請輸入年齡', trigger: 'blur' }],
  height: [{ required: true, message: '請輸入身高', trigger: 'blur' }],
  weight: [{ required: true, message: '請輸入目前體重', trigger: 'blur' }],
  targetWeight: [{ required: true, message: '請輸入目標體重', trigger: 'blur' }],
  dailyGoal: [{ required: true, message: '請輸入每日目標熱量', trigger: 'blur' }],
  dailyExerciseGoal: [{ required: true, message: '請輸入每日運動消耗目標', trigger: 'blur' }],
}

function syncFormFromProfile() {
  Object.assign(form, profileStore.profile)
}

async function loadProfile() {
  if (!authStore.userId) {
    return
  }

  try {
    await profileStore.fetchProfile(authStore.userId)
    syncFormFromProfile()
  } catch (error) {
    showError(error, '讀取個人設定失敗，請稍後再試。')
  }
}

async function handleSave() {
  if (!formRef.value || !authStore.userId) {
    return
  }

  const isValid = await formRef.value.validate().catch(() => false)

  if (!isValid) {
    return
  }

  isSubmitting.value = true

  try {
    await profileStore.saveProfile(authStore.userId, { ...form })
    showSuccess('個人設定已更新。')
  } catch (error) {
    showError(error, '儲存個人設定失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await loadProfile()
})
</script>

<template>
  <div class="page-stack journal-page settings-page">
    <section class="hero-panel hero-panel--settings journal-hero settings-hero">
      <div>
        <p class="section-kicker">Profile Settings</p>
        <h3>把個人資料設定完整，後續分析才會更準</h3>
        <p class="section-copy section-copy--dark">
          這裡會影響每日目標熱量、每日運動消耗目標、體重與 BMI 顯示，以及後續 TDEE、減脂增肌分析的基礎資料。
        </p>
      </div>

      <div class="hero-stats">
        <article class="hero-stat-card">
          <span>目前 BMI</span>
          <strong>{{ currentBmi }} ({{ getBmiLabel(currentBmi) }})</strong>
        </article>
        <article class="hero-stat-card">
          <span>每日目標熱量</span>
          <strong>{{ form.dailyGoal }} kcal</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--cool">
          <span>每日運動消耗目標</span>
          <strong>{{ form.dailyExerciseGoal }} kcal</strong>
        </article>
      </div>
    </section>

    <el-card shadow="hover" class="content-card journal-shell-card settings-shell-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>個人設定</span>
            <p class="card-subtitle">管理身高、體重、目標體重、活動量、每日目標攝取熱量與每日運動消耗目標</p>
          </div>
          <el-button type="primary" plain :loading="isSubmitting" @click="handleSave">儲存設定</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        v-loading="profileStore.isLoading"
        :model="form"
        :rules="rules"
        label-position="top"
        class="settings-grid settings-form"
      >
        <el-form-item label="暱稱" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="性別" prop="gender">
          <el-select v-model="form.gender">
            <el-option label="男性" value="male" />
            <el-option label="女性" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="年齡" prop="age">
          <el-input-number v-model="form.age" :min="1" :max="120" />
        </el-form-item>
        <el-form-item label="身高 (cm)" prop="height">
          <el-input-number v-model="form.height" :min="80" :max="250" />
        </el-form-item>
        <el-form-item label="目前體重 (kg)" prop="weight">
          <el-input-number v-model="form.weight" :min="20" :max="300" />
        </el-form-item>
        <el-form-item label="目標體重 (kg)" prop="targetWeight">
          <el-input-number v-model="form.targetWeight" :min="20" :max="300" />
        </el-form-item>
        <el-form-item label="每日目標熱量" prop="dailyGoal">
          <el-input-number v-model="form.dailyGoal" :min="800" :max="5000" />
          <div class="card-subtitle">代表你每天希望攝取的熱量上限。</div>
        </el-form-item>
        <el-form-item label="每日運動消耗目標" prop="dailyExerciseGoal">
          <el-input-number v-model="form.dailyExerciseGoal" :min="0" :max="3000" />
          <div class="card-subtitle">代表你每天希望透過運動消耗的熱量。</div>
        </el-form-item>
        <el-form-item label="活動量" prop="activityLevel">
          <el-select v-model="form.activityLevel">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="飲食偏好" class="form-item-span-2">
          <el-select
            v-model="form.dietaryPreferences"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="可選擇 AI 餐點建議偏好"
          >
            <el-option label="高蛋白" value="高蛋白" />
            <el-option label="低醣" value="低醣" />
            <el-option label="低脂少油" value="低脂少油" />
            <el-option label="蔬食優先" value="蔬食優先" />
            <el-option label="快速方便" value="快速方便" />
            <el-option label="台式家常" value="台式家常" />
          </el-select>
          <div class="card-subtitle">會套用在 AI 個人化下一餐建議，未選擇時 AI 會提供均衡建議。</div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
