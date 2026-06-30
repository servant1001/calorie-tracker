import { createRouter, createWebHistory } from 'vue-router'

import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        title: '登入',
        guestOnly: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: {
        title: '註冊',
        guestOnly: true,
      },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: {
            title: '儀表板',
          },
        },
        {
          path: 'foods',
          name: 'foods',
          component: () => import('@/views/FoodsView.vue'),
          meta: {
            title: '飲食紀錄',
          },
        },
        {
          path: 'exercises',
          name: 'exercises',
          component: () => import('@/views/ExercisesView.vue'),
          meta: {
            title: '運動紀錄',
          },
        },
        {
          path: 'weights',
          name: 'weights',
          component: () => import('@/views/WeightsView.vue'),
          meta: {
            title: '體重紀錄',
          },
        },
        {
          path: 'statistics',
          name: 'statistics',
          component: () => import('@/views/StatisticsView.vue'),
          meta: {
            title: '統計分析',
          },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: {
            title: '個人設定',
          },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)

  if (!authStore.isReady) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some((record) => Boolean(record.meta.requiresAuth))
  const guestOnly = to.matched.some((record) => Boolean(record.meta.guestOnly))

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  document.title = `Calorie Tracker | ${String(to.meta.title ?? '每日熱量管理')}`
})

export default router
