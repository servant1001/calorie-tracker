<script setup lang="ts">
import {
  DataAnalysis,
  Food,
  Histogram,
  House,
  Menu as MenuIcon,
  Setting,
  SwitchButton,
  TrendCharts,
} from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { showError, showSuccess } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const mobileBreakpoint = 992
const isMobile = ref(false)
const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

const menuItems = [
  { path: '/', label: '首頁總覽', icon: House },
  { path: '/foods', label: '飲食紀錄', icon: Food },
  { path: '/exercises', label: '運動紀錄', icon: Histogram },
  { path: '/weights', label: '體重紀錄', icon: TrendCharts },
  { path: '/statistics', label: '統計分析', icon: DataAnalysis },
  { path: '/settings', label: '個人設定', icon: Setting },
]

const pageTitleMap: Record<string, string> = {
  dashboard: '首頁總覽',
  foods: '飲食紀錄',
  exercises: '運動紀錄',
  weights: '體重紀錄',
  statistics: '統計分析',
  settings: '個人設定',
}

const activePath = computed(() => route.path)
const accountLabel = computed(() => authStore.displayName || authStore.email || '已登入使用者')
const accountEmail = computed(() => authStore.email || 'calorie-tracker user')
const accountInitial = computed(() => String(accountLabel.value).trim().slice(0, 1).toUpperCase() || 'C')
const currentPageTitle = computed(() => pageTitleMap[String(route.name ?? '')] ?? 'Calorie Tracker')
const sidebarClasses = computed(() => ({
  'app-aside--open': isSidebarOpen.value,
  'app-aside--collapsed': !isMobile.value && isSidebarCollapsed.value,
}))

function syncViewportState() {
  const nextIsMobile = window.innerWidth <= mobileBreakpoint

  if (nextIsMobile !== isMobile.value) {
    isMobile.value = nextIsMobile
  }

  if (isMobile.value) {
    isSidebarOpen.value = false
  } else {
    isSidebarOpen.value = true
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    isSidebarOpen.value = !isSidebarOpen.value
    return
  }

  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function closeMobileSidebar() {
  if (isMobile.value) {
    isSidebarOpen.value = false
  }
}

async function handleLogout() {
  try {
    await authStore.signOut()
    showSuccess('已成功登出。')
    await router.push('/login')
  } catch (error) {
    showError(error, '登出失敗，請稍後再試。')
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMobileSidebar()
  },
)

onMounted(() => {
  syncViewportState()
  window.addEventListener('resize', syncViewportState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewportState)
})
</script>

<template>
  <div v-if="isMobile && isSidebarOpen" class="app-overlay" @click="closeMobileSidebar"></div>

  <el-container class="app-shell" :class="{ 'app-shell--mobile': isMobile }">
    <el-aside
      :class="['app-aside', sidebarClasses]"
      :width="isMobile ? '280px' : isSidebarCollapsed ? '92px' : '260px'"
      @click.stop
    >
      <div class="brand-block" :class="{ 'brand-block--compact': !isMobile && isSidebarCollapsed }">
        <p v-if="!isSidebarCollapsed || isMobile" class="brand-kicker">Daily wellness</p>
        <h1>{{ !isSidebarCollapsed || isMobile ? 'Calorie Tracker' : 'CT' }}</h1>
        <p v-if="!isSidebarCollapsed || isMobile" class="brand-copy">
          追蹤飲食、運動與體重，把每天的熱量變化看得更清楚。
        </p>
      </div>

      <div v-if="!isSidebarCollapsed || isMobile" class="account-panel account-panel--featured">
        <div class="account-panel__glow"></div>
        <div class="account-panel__top">
          <div class="account-avatar">{{ accountInitial }}</div>
          <div class="account-copy">
            <p class="account-panel__label">目前登入</p>
            <strong>{{ accountLabel }}</strong>
            <span>{{ accountEmail }}</span>
          </div>
        </div>

        <div class="account-panel__footer">
          <span class="account-status">Wellness mode active</span>
          <el-button :icon="SwitchButton" text @click="handleLogout">登出</el-button>
        </div>
      </div>

      <div v-else class="account-panel account-panel--compact">
        <strong>{{ accountInitial }}</strong>
      </div>

      <el-menu :default-active="activePath" class="side-menu" router :collapse="!isMobile && isSidebarCollapsed">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>
            <span>{{ item.label }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="app-content-shell">
      <el-header class="app-header">
        <div class="app-header__group">
          <el-button circle plain class="sidebar-toggle" :icon="MenuIcon" @click="toggleSidebar" />
          <div>
            <p class="page-kicker">Calorie tracker dashboard</p>
            <h2>{{ currentPageTitle }}</h2>
          </div>
        </div>
        <el-tag type="success" effect="dark" round>Vue 3 + Firebase MVP</el-tag>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
