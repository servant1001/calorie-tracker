<script setup lang="ts">
import {
  DataAnalysis,
  Food,
  Histogram,
  House,
  Setting,
  SwitchButton,
  TrendCharts,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { showError, showSuccess } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = [
  { path: '/', label: '儀表板', icon: House },
  { path: '/foods', label: '飲食紀錄', icon: Food },
  { path: '/exercises', label: '運動紀錄', icon: Histogram },
  { path: '/weights', label: '體重紀錄', icon: TrendCharts },
  { path: '/statistics', label: '統計分析', icon: DataAnalysis },
  { path: '/settings', label: '個人設定', icon: Setting },
]

const activePath = computed(() => route.path)
const accountLabel = computed(() => authStore.displayName || authStore.email || '未登入')

async function handleLogout() {
  try {
    await authStore.signOut()
    showSuccess('已成功登出。')
    await router.push('/login')
  } catch (error) {
    showError(error, '登出失敗，請稍後再試。')
  }
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside class="app-aside" width="260px">
      <div class="brand-block">
        <p class="brand-kicker">Daily wellness</p>
        <h1>Calorie Tracker</h1>
        <p class="brand-copy">記錄飲食、運動與體重，讓每日熱量管理更清楚。</p>
      </div>

      <div class="account-panel">
        <p class="account-panel__label">目前帳號</p>
        <strong>{{ accountLabel }}</strong>
        <el-button :icon="SwitchButton" text @click="handleLogout">登出</el-button>
      </div>

      <el-menu :default-active="activePath" class="side-menu" router>
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div>
          <p class="page-kicker">每日熱量攝取與消耗管理系統</p>
          <h2>{{ route.meta.title }}</h2>
        </div>
        <el-tag type="success" effect="dark" round>Vue 3 + Firebase MVP</el-tag>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
