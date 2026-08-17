import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applySeo, SEO } from '@/utils/seo'

const routes = [
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { public: true, title: '登录 · ' + SEO.title },
      },
      {
        path: 'ca',
        name: 'ca-auth',
        component: () => import('@/views/auth/CaCertView.vue'),
        meta: { public: true, title: 'CA 证书认证 · ' + SEO.title },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '控制台 · ' + SEO.title,
          roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor', 'viewer'],
        },
      },
      {
        path: 'identification',
        name: 'identification',
        component: () => import('@/views/identification/IdentificationView.vue'),
        meta: {
          title: '参数辨识工作台 · ' + SEO.title,
          roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor', 'viewer'],
        },
      },
      {
        path: 'test-bench',
        name: 'test-bench',
        component: () => import('@/views/test-bench/TestBenchView.vue'),
        meta: {
          title: '程控测试台 · ' + SEO.title,
          roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor', 'viewer'],
        },
      },
      {
        path: 'waveform',
        name: 'waveform',
        component: () => import('@/views/waveform/WaveformView.vue'),
        meta: {
          title: '瞬态品质分析 · ' + SEO.title,
          roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor'],
        },
      },
      {
        path: 'tender',
        name: 'tender',
        component: () => import('@/views/tender/TenderHubView.vue'),
        meta: {
          title: '招标合规中心 · ' + SEO.title,
          roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor', 'viewer'],
        },
      },
      {
        path: 'compliance',
        name: 'compliance',
        component: () => import('@/views/compliance/ComplianceMatrixView.vue'),
        meta: {
          title: 'DO-178C 追溯矩阵 · ' + SEO.title,
          roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor', 'viewer'],
        },
      },
      {
        path: 'audit',
        name: 'audit',
        component: () => import('@/views/audit/AuditLogView.vue'),
        meta: {
          title: '安全审计日志 · ' + SEO.title,
          roles: ['admin', 'auditor', 'vv_engineer', 'dev_engineer'],
        },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@/views/admin/AdminUsersView.vue'),
        meta: {
          title: '用户与安全策略 · ' + SEO.title,
          roles: ['admin'],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.user && auth.token) {
    await auth.fetchMe()
  }

  applySeo({
    title: to.meta.title || SEO.title,
  })

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') return { name: 'dashboard' }
    return true
  }

  if (to.meta.requiresAuth !== false && !to.meta.public) {
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    const roles = to.meta.roles
    if (roles && !auth.hasRole(roles)) {
      return { name: 'dashboard', query: { denied: '1' } }
    }
  }
  return true
})

export default router
