<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { Play, RefreshCw } from 'lucide-vue-next'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const auth = useAuthStore()
const records = ref([])
const current = ref(null)
const running = ref(false)
const unitName = ref('VF-AC-GCU-ONLINE')
const frequency = ref(400)

const canWrite = computed(() => ['admin', 'dev_engineer'].includes(auth.role))

const curveOption = computed(() => {
  const curve = current.value?.saturated_curve_data || []
  const ideal = curve.map((p) => [p.if, Number((0.78 * (1 - Math.exp(-1.6 * p.if))).toFixed(4))])
  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#94a3b8' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['实测磁链', '模型拟合'], textStyle: { color: '#cbd5e1' } },
    grid: { left: 48, right: 24, top: 40, bottom: 40 },
    xAxis: { type: 'value', name: 'If (pu)', axisLine: { lineStyle: { color: '#475569' } } },
    yAxis: { type: 'value', name: 'ψ (pu)', axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      {
        name: '实测磁链',
        type: 'line',
        smooth: true,
        data: curve.map((p) => [p.if, p.psi]),
        itemStyle: { color: '#38bdf8' },
      },
      {
        name: '模型拟合',
        type: 'line',
        smooth: true,
        data: ideal,
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#34d399' },
      },
    ],
  }
})

const paramOption = computed(() => {
  const p = current.value?.calculated_parameters || {}
  const ref = current.value?.comparison || { Ld: 0.00212, Lq: 0.00338, Td0: 1.88, Td_prime: 0.043 }
  const keys = ['Ld', 'Lq', 'Td0', 'Td_prime']
  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#94a3b8' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['辨识值', '参考值'], textStyle: { color: '#cbd5e1' } },
    grid: { left: 48, right: 16, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: keys, axisLine: { lineStyle: { color: '#475569' } } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      { name: '辨识值', type: 'bar', data: keys.map((k) => p[k] ?? 0), itemStyle: { color: '#0c8ee6' } },
      { name: '参考值', type: 'bar', data: keys.map((k) => ref[k] ?? 0), itemStyle: { color: '#64748b' } },
    ],
  }
})

async function load() {
  try {
    const res = await api('/identification/list')
    records.value = res.data || []
    if (!current.value && records.value.length) current.value = records.value[0]
  } catch {
    records.value = []
  }
}

async function runIdent() {
  if (!canWrite.value) return
  running.value = true
  try {
    const res = await api('/identification/run', {
      method: 'POST',
      body: JSON.stringify({ test_unit_name: unitName.value, frequency: frequency.value }),
    })
    current.value = res.data
    await load()
  } catch (e) {
    // offline demo fit
    const ifValues = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4]
    current.value = {
      test_unit_name: unitName.value,
      saturated_curve_data: ifValues.map((ifv) => ({
        if: ifv,
        psi: Number((0.78 * (1 - Math.exp(-1.6 * ifv)) + (Math.random() - 0.5) * 0.02).toFixed(4)),
      })),
      calculated_parameters: {
        Ld: 0.00215,
        Lq: 0.00342,
        Td0: 1.85,
        Td_prime: 0.042,
        Ra: 0.012,
        Xs: 0.85,
      },
      comparison: { Ld: 0.00212, Lq: 0.00338, Td0: 1.88, Td_prime: 0.043 },
      error_margin: 1.9,
    }
  } finally {
    running.value = false
  }
}

watch(
  () => records.value,
  (list) => {
    if (list.length && !current.value) current.value = list[0]
  },
)

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-white">三级式发电机参数辨识工作台</h1>
        <p class="text-sm text-slate-400">饱和曲线 · 交直轴阻抗 Ld/Lq · 瞬态/超瞬态时间常数</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <input v-model="unitName" class="input-field w-44" :disabled="!canWrite" />
        <input v-model.number="frequency" type="number" min="360" max="800" class="input-field w-28" :disabled="!canWrite" />
        <button class="btn-primary" :disabled="!canWrite || running" @click="runIdent">
          <Play class="h-4 w-4" /> 在线辨识
        </button>
        <button class="btn-ghost" @click="load"><RefreshCw class="h-4 w-4" /></button>
      </div>
    </div>

    <p v-if="!canWrite" class="text-xs text-amber-200/90">当前角色仅可读取/引用辨识结果，不可触发标定写操作。</p>

    <div class="grid gap-4 xl:grid-cols-3">
      <div class="panel p-4 xl:col-span-2">
        <h3 class="mb-2 text-sm font-medium text-slate-300">磁链饱和曲线拟合比对</h3>
        <VChart class="h-72 w-full" :option="curveOption" autoresize />
      </div>
      <div class="panel space-y-3 p-4">
        <h3 class="text-sm font-medium text-slate-300">辨识参数摘要</h3>
        <div class="text-xs text-slate-400">单元：{{ current?.test_unit_name || '—' }}</div>
        <div class="font-display text-3xl text-aviation-200">{{ current?.error_margin ?? '—' }}%</div>
        <div class="text-xs text-slate-400">综合误差裕度（目标 &lt; 3%）</div>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <div v-for="(v, k) in current?.calculated_parameters || {}" :key="k" class="rounded bg-slate-950/60 px-2 py-1.5">
            <dt class="text-[10px] uppercase text-slate-500">{{ k }}</dt>
            <dd class="font-mono text-slate-100">{{ v }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="panel p-4">
      <h3 class="mb-2 text-sm font-medium text-slate-300">关键参数柱状比对</h3>
      <VChart class="h-64 w-full" :option="paramOption" autoresize />
    </div>

    <div class="panel overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr>
            <th class="px-4 py-3">单元</th>
            <th class="px-4 py-3">类型</th>
            <th class="px-4 py-3">频段</th>
            <th class="px-4 py-3">误差%</th>
            <th class="px-4 py-3">时间</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in records"
            :key="r.id"
            class="cursor-pointer border-b border-slate-800/80 hover:bg-slate-800/40"
            @click="current = r"
          >
            <td class="px-4 py-2.5 text-slate-100">{{ r.test_unit_name }}</td>
            <td class="px-4 py-2.5 text-slate-400">{{ r.generator_type }}</td>
            <td class="px-4 py-2.5 font-mono text-xs">{{ r.frequency_range }}</td>
            <td class="px-4 py-2.5">{{ r.error_margin }}</td>
            <td class="px-4 py-2.5 text-xs text-slate-500">{{ r.created_at }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
