<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'
import { ShieldAlert } from 'lucide-vue-next'

const logs = ref([])
const immutable = ref(true)

onMounted(async () => {
  try {
    const res = await api('/audit')
    logs.value = res.data || []
    immutable.value = res.immutable !== false
  } catch {
    logs.value = []
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-white">三员审计合规日志</h1>
        <p class="text-sm text-slate-400">不可篡改记录流 · 系统安全与操作审计</p>
      </div>
      <div v-if="immutable" class="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100">
        <ShieldAlert class="h-4 w-4" /> 只读 · 防篡改
      </div>
    </div>

    <div class="panel overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr>
            <th class="px-4 py-3">时间</th>
            <th class="px-4 py-3">操作者</th>
            <th class="px-4 py-3">动作</th>
            <th class="px-4 py-3">模块</th>
            <th class="px-4 py-3">密级</th>
            <th class="px-4 py-3">详情</th>
            <th class="px-4 py-3">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" class="border-b border-slate-800/80">
            <td class="px-4 py-2.5 whitespace-nowrap font-mono text-xs text-slate-400">{{ log.created_at }}</td>
            <td class="px-4 py-2.5">{{ log.user_name || log.user_id }}</td>
            <td class="px-4 py-2.5 font-mono text-xs text-aviation-200">{{ log.action }}</td>
            <td class="px-4 py-2.5">{{ log.target_module }}</td>
            <td class="px-4 py-2.5">
              <span class="badge bg-rose-500/15 text-rose-200">{{ log.security_level }}</span>
            </td>
            <td class="max-w-xs truncate px-4 py-2.5 text-slate-300" :title="log.details">{{ log.details }}</td>
            <td class="px-4 py-2.5 font-mono text-xs text-slate-500">{{ log.ip_address }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!logs.length" class="p-6 text-center text-sm text-slate-500">暂无审计记录（需后端/D1 或登录后产生）。</p>
    </div>
  </div>
</template>
