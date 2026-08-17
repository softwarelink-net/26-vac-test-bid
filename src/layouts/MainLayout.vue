<script setup>
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Cpu,
  FlaskConical,
  Activity,
  FileText,
  GitBranch,
  ShieldCheck,
  Users,
  LogOut,
  Menu,
  X,
  Plane,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const roleLabel = {
  admin: '系统管理员',
  vv_engineer: '适航验证工程师',
  dev_engineer: '算法研发工程师',
  auditor: '安全审计员',
  viewer: '访客/外部专家',
}

const nav = computed(() => {
  const all = [
    { to: '/', name: '控制台总览', icon: LayoutDashboard, roles: null },
    { to: '/identification', name: '参数辨识工作台', icon: Cpu, roles: null },
    { to: '/test-bench', name: '程控集成测试台', icon: FlaskConical, roles: null },
    { to: '/waveform', name: '瞬态品质分析', icon: Activity, roles: ['admin', 'vv_engineer', 'dev_engineer', 'auditor'] },
    { to: '/tender', name: '招标合规中心', icon: FileText, roles: null },
    { to: '/compliance', name: 'DO-178C 追溯矩阵', icon: GitBranch, roles: null },
    { to: '/audit', name: '安全审计日志', icon: ShieldCheck, roles: ['admin', 'auditor', 'vv_engineer', 'dev_engineer'] },
    { to: '/admin', name: '用户与安全策略', icon: Users, roles: ['admin'] },
  ]
  return all.filter((item) => !item.roles || auth.hasRole(item.roles))
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-40px)]">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-700/80 bg-slate-950/95 pt-10 transition-transform lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      style="top: 40px; height: calc(100vh - 40px)"
    >
      <div class="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-aviation-600 text-white">
          <Plane class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <div class="truncate font-display text-lg font-semibold tracking-wide text-white">VAC Test Bid</div>
          <div class="truncate text-[11px] text-slate-400">26-vac-test-bid</div>
        </div>
        <button class="ml-auto text-slate-400 lg:hidden" @click="sidebarOpen = false">
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-3">
        <p class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">航空测试工程树</p>
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition"
          :class="
            isActive(item.to)
              ? 'bg-aviation-600/20 text-aviation-200 ring-1 ring-aviation-500/30'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          "
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0 opacity-80" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <div class="border-t border-slate-800 p-3 text-xs text-slate-400">
        <div class="font-medium text-slate-200">{{ auth.user?.real_name }}</div>
        <div>{{ roleLabel[auth.user?.role] || auth.user?.role }}</div>
        <div class="truncate">{{ auth.user?.department }}</div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" style="top: 40px" @click="sidebarOpen = false" />

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-10 z-20 flex h-14 items-center gap-3 border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur">
        <button class="btn-ghost !p-2 lg:hidden" @click="sidebarOpen = true">
          <Menu class="h-5 w-5" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-white">115VAC变频交流发电软件测试平台</div>
          <div class="truncate text-xs text-slate-400">陕西航空电气 · 0730-2611010438/01 · MIL-STD-704F / GJB 181B</div>
        </div>
        <button class="btn-ghost" @click="logout">
          <LogOut class="h-4 w-4" />
          退出
        </button>
      </header>

      <main class="flex-1 overflow-auto p-4 md:p-6">
        <RouterView />
      </main>

      <footer class="border-t border-slate-800/80 px-4 py-2 text-[11px] text-slate-500">
        DO-178C Traceability Engine · Parameter Identification Studio · Transient Quality Analyzer · 状态：在线演示
      </footer>
    </div>
  </div>
</template>
