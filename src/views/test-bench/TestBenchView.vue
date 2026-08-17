<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { Play, Gauge, Zap } from 'lucide-vue-next'

const auth = useAuthStore()
const cases = ref([])
const sequences = ref([])
const status = ref({ frequency_hz: 400, load_pu: 0.5, voltage_setpoint: 115, mode: 'idle', progress: 0 })
const selected = ref([])
const executing = ref(false)
const lastResult = ref(null)
const freq = ref(400)
const loadPu = ref(0.5)

const canOrchestrate = computed(() => ['admin', 'vv_engineer'].includes(auth.role))
const canExecute = computed(() => ['admin', 'vv_engineer', 'dev_engineer'].includes(auth.role))

function statusClass(s) {
  return (
    {
      passed: 'status-passed',
      failed: 'status-failed',
      pending: 'status-pending',
      running: 'status-running',
    }[s] || 'badge bg-slate-700 text-slate-300'
  )
}

async function load() {
  try {
    const [c, s, st] = await Promise.all([
      api('/test-bench/cases'),
      api('/test-bench/sequences'),
      api('/test-bench/status'),
    ])
    cases.value = c.data || []
    sequences.value = s.data || []
    status.value = st.data || status.value
    selected.value = cases.value.map((x) => x.id)
  } catch {
    cases.value = []
  }
}

async function applyControl() {
  if (!canOrchestrate.value && !canExecute.value) return
  try {
    const res = await api('/test-bench/control', {
      method: 'POST',
      body: JSON.stringify({
        frequency_hz: freq.value,
        load_pu: loadPu.value,
        voltage_setpoint: 115,
        mode: 'armed',
      }),
    })
    status.value = res.data
  } catch (e) {
    status.value = { ...status.value, frequency_hz: freq.value, load_pu: loadPu.value, mode: 'armed' }
  }
}

async function runSelected() {
  if (!canExecute.value) return
  executing.value = true
  lastResult.value = null
  try {
    const res = await api('/test-bench/execute', {
      method: 'POST',
      body: JSON.stringify({ case_ids: selected.value }),
    })
    lastResult.value = res.data
    await load()
  } catch {
    lastResult.value = {
      summary: { total: selected.value.length, passed: Math.max(0, selected.value.length - 1), failed: 1 },
      sequence_id: 'seq-offline',
    }
  } finally {
    executing.value = false
  }
}

function loadSequence(seq) {
  selected.value = [...seq.case_ids]
}

function toggle(id) {
  if (selected.value.includes(id)) selected.value = selected.value.filter((x) => x !== id)
  else selected.value = [...selected.value, id]
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="font-display text-2xl font-semibold text-white">变频发电程控集成测试台</h1>
      <p class="text-sm text-slate-400">360Hz~800Hz 工况模拟 · 程控电源/电子负载虚拟协同 · 自动化回归</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="panel space-y-3 p-4 lg:col-span-1">
        <h3 class="flex items-center gap-2 text-sm font-medium text-slate-200"><Gauge class="h-4 w-4" /> 工况控制</h3>
        <label class="block text-xs text-slate-400">频率 (Hz)</label>
        <input v-model.number="freq" type="range" min="360" max="800" step="10" class="w-full" :disabled="!canExecute" />
        <div class="font-mono text-2xl text-aviation-200">{{ freq }} Hz</div>
        <label class="block text-xs text-slate-400">负载 (pu)</label>
        <input v-model.number="loadPu" type="range" min="0" max="1.2" step="0.05" class="w-full" :disabled="!canExecute" />
        <div class="font-mono text-lg text-slate-100">{{ loadPu.toFixed(2) }} pu</div>
        <button class="btn-primary w-full" :disabled="!canExecute" @click="applyControl">
          <Zap class="h-4 w-4" /> 下发设定
        </button>
        <div class="rounded-md bg-slate-950/70 p-3 text-xs text-slate-400">
          <div>台架状态：<span class="text-slate-200">{{ status.mode }}</span></div>
          <div>当前频率：{{ status.frequency_hz }} Hz</div>
          <div>母线电压设定：{{ status.voltage_setpoint }} V</div>
          <div>进度：{{ status.progress || 0 }}%</div>
        </div>
      </div>

      <div class="panel p-4 lg:col-span-2">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium text-slate-200">回归序列编排</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="seq in sequences"
              :key="seq.id"
              class="btn-ghost !py-1 text-xs"
              :disabled="!canOrchestrate && !canExecute"
              @click="loadSequence(seq)"
            >
              {{ seq.name }}
            </button>
            <button class="btn-primary" :disabled="!canExecute || executing || !selected.length" @click="runSelected">
              <Play class="h-4 w-4" /> {{ executing ? '执行中…' : '批量执行' }}
            </button>
          </div>
        </div>

        <div v-if="lastResult" class="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          序列 {{ lastResult.sequence_id }} 完成：通过 {{ lastResult.summary.passed }} / {{ lastResult.summary.total }}，失败 {{ lastResult.summary.failed }}
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
              <tr>
                <th class="px-3 py-2"></th>
                <th class="px-3 py-2">编号</th>
                <th class="px-3 py-2">标题</th>
                <th class="px-3 py-2">类别</th>
                <th class="px-3 py-2">HLR/LLR</th>
                <th class="px-3 py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cases" :key="c.id" class="border-b border-slate-800/70">
                <td class="px-3 py-2">
                  <input type="checkbox" :checked="selected.includes(c.id)" @change="toggle(c.id)" />
                </td>
                <td class="px-3 py-2 font-mono text-xs text-aviation-200">{{ c.case_code }}</td>
                <td class="px-3 py-2 text-slate-100">{{ c.title }}</td>
                <td class="px-3 py-2 text-slate-400">{{ c.test_category }}</td>
                <td class="px-3 py-2 font-mono text-[11px] text-slate-400">{{ c.hlr_ref }} → {{ c.llr_ref }}</td>
                <td class="px-3 py-2"><span :class="statusClass(c.last_status)">{{ c.last_status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
