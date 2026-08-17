<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'

const users = ref([])
const configs = ref([])

const roleMap = {
  admin: '系统管理员',
  vv_engineer: '适航验证工程师',
  dev_engineer: '算法研发工程师',
  auditor: '安全审计员',
  viewer: '访客/外部专家',
}

onMounted(async () => {
  try {
    const [u, c] = await Promise.all([api('/users'), api('/configs')])
    users.value = u.data || []
    configs.value = c.data || []
  } catch {
    users.value = [
      { id: 'usr-admin-01', username: 'admin', email: 'admin@avic-sepc.com', real_name: '李德强', role: 'admin', department: '试验测试部', status: 'active' },
      { id: 'usr-tester-01', username: 'tester', email: 'tester@avic-sepc.com', real_name: '管子婧', role: 'vv_engineer', department: '适航验证中心', status: 'active' },
      { id: 'usr-auditor-01', username: 'auditor', email: 'auditor@avic-sepc.com', real_name: '李桐', role: 'auditor', department: '纪检审计处', status: 'active' },
    ]
    configs.value = [
      { key: 'FEATURE_AUTO_CALC_IDENTIFICATION', value: 'true', description: '发电机参数自动辨识' },
      { key: 'FEATURE_MIL_STD_704F_CHECK', value: 'true', description: '供电品质标准实时校验' },
    ]
  }
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="font-display text-2xl font-semibold text-white">平台用户与安全策略配置</h1>
      <p class="text-sm text-slate-400">仅系统管理员可 CRUD · 三员分立 RBAC</p>
    </div>

    <div class="panel overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr>
            <th class="px-4 py-3">姓名</th>
            <th class="px-4 py-3">账号</th>
            <th class="px-4 py-3">角色</th>
            <th class="px-4 py-3">部门</th>
            <th class="px-4 py-3">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b border-slate-800/80">
            <td class="px-4 py-2.5 text-slate-100">{{ u.real_name }}</td>
            <td class="px-4 py-2.5 font-mono text-xs">{{ u.email }}</td>
            <td class="px-4 py-2.5">{{ roleMap[u.role] || u.role }}</td>
            <td class="px-4 py-2.5 text-slate-400">{{ u.department }}</td>
            <td class="px-4 py-2.5"><span class="status-passed">{{ u.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="panel p-5">
      <h2 class="mb-3 text-sm font-semibold text-slate-200">Feature Flags</h2>
      <ul class="space-y-2">
        <li v-for="c in configs" :key="c.key" class="flex items-center justify-between rounded-md bg-slate-950/50 px-3 py-2 text-sm">
          <div>
            <div class="font-mono text-xs text-aviation-200">{{ c.key }}</div>
            <div class="text-xs text-slate-500">{{ c.description }}</div>
          </div>
          <span class="badge bg-emerald-500/15 text-emerald-300">{{ c.value }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
