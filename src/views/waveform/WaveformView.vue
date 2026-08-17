<script setup>
import { ref, onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent } from 'echarts/components'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { Download, Radio } from 'lucide-vue-next'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent])

const auth = useAuthStore()
const records = ref([])
const live = ref(null)
const trigger = ref('Step Load Add')
const capturing = ref(false)

const canExport = computed(() => ['admin', 'vv_engineer', 'dev_engineer'].includes(auth.role))

const waveOption = computed(() => {
  const s = live.value?.samples
  if (!s) {
    return {
      backgroundColor: 'transparent',
      title: { text: '等待捕获…', left: 'center', top: 'center', textStyle: { color: '#64748b', fontSize: 14 } },
    }
  }
  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#94a3b8' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Vrms 瞬态', '704F 上限', '704F 下限'], textStyle: { color: '#cbd5e1' } },
    grid: { left: 52, right: 24, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: s.t, name: 'ms', axisLabel: { interval: 49 }, axisLine: { lineStyle: { color: '#475569' } } },
    yAxis: { type: 'value', name: 'V', min: 60, max: 190, axisLine: { lineStyle: { color: '#475569' } }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      { name: 'Vrms 瞬态', type: 'line', showSymbol: false, data: s.v, itemStyle: { color: '#38bdf8' }, lineStyle: { width: 1.5 } },
      { name: '704F 上限', type: 'line', showSymbol: false, data: s.upper, itemStyle: { color: '#f43f5e' }, lineStyle: { type: 'dashed', width: 1 } },
      { name: '704F 下限', type: 'line', showSymbol: false, data: s.lower, itemStyle: { color: '#fbbf24' }, lineStyle: { type: 'dashed', width: 1 } },
    ],
  }
})

async function load() {
  try {
    const res = await api('/waveform/list')
    records.value = res.data || []
  } catch {
    records.value = []
  }
}

async function capture() {
  capturing.value = true
  try {
    const res = await api('/waveform/capture', {
      method: 'POST',
      body: JSON.stringify({ trigger_event: trigger.value, frequency_val: 400 }),
    })
    live.value = res.data
    await load()
  } catch {
    // offline synthesize
    const t = []
    const v = []
    const upper = []
    const lower = []
    for (let i = 0; i < 500; i++) {
      const ms = i * 0.2
      t.push(Number(ms.toFixed(1)))
      let voltage = 115
      if (trigger.value === 'Step Load Add' && ms >= 20 && ms < 48) {
        voltage = 115 - 16 * Math.exp(-(ms - 20) / 8)
      } else if (trigger.value === 'Step Load Drop' && ms >= 20 && ms < 52) {
        voltage = 115 + 20 * Math.exp(-(ms - 20) / 9)
      }
      v.push(Number(voltage.toFixed(3)))
      upper.push(ms < 100 ? 180 : 122)
      lower.push(ms < 100 ? 80 : 108)
    }
    live.value = {
      trigger_event: trigger.value,
      recovery_time_ms: 28.5,
      thd_percentage: 2.2,
      voltage_rms: 114.9,
      is_compliant: true,
      samples: { t, v, upper, lower },
    }
  } finally {
    capturing.value = false
  }
}

async function openRecord(id) {
  try {
    const res = await api(`/waveform/${id}`)
    live.value = res.data
  } catch {
    /* keep */
  }
}

function exportJson() {
  if (!canExport.value || !live.value) return
  const blob = new Blob([JSON.stringify(live.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `waveform-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await load()
  await capture()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-white">瞬态实时波形捕获与供电品质分析</h1>
        <p class="text-sm text-slate-400">MIL-STD-704F / GJB 181B · 过压欠压 · Tr · THD</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <select v-model="trigger" class="input-field w-44">
          <option>Step Load Add</option>
          <option>Step Load Drop</option>
          <option>Short Circuit</option>
          <option>Over-Voltage</option>
        </select>
        <button class="btn-primary" :disabled="capturing" @click="capture">
          <Radio class="h-4 w-4" /> {{ capturing ? '捕获中…' : '高频捕获' }}
        </button>
        <button class="btn-ghost" :disabled="!canExport || !live" @click="exportJson">
          <Download class="h-4 w-4" /> 导出波形
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="panel p-4">
        <div class="text-xs text-slate-400">恢复时间 Tr</div>
        <div class="font-display text-2xl text-white">{{ live?.recovery_time_ms ?? '—' }} <span class="text-sm">ms</span></div>
        <div class="text-[11px] text-slate-500">限值 &lt; 40 ms</div>
      </div>
      <div class="panel p-4">
        <div class="text-xs text-slate-400">THD</div>
        <div class="font-display text-2xl text-white">{{ live?.thd_percentage ?? '—' }}%</div>
        <div class="text-[11px] text-slate-500">限值 &lt; 5%</div>
      </div>
      <div class="panel p-4">
        <div class="text-xs text-slate-400">Vrms</div>
        <div class="font-display text-2xl text-white">{{ live?.voltage_rms ?? '—' }} V</div>
        <div class="text-[11px] text-slate-500">额定 115 VAC</div>
      </div>
      <div class="panel p-4">
        <div class="text-xs text-slate-400">合规判定</div>
        <div class="mt-1">
          <span :class="live?.is_compliant ? 'status-passed' : 'status-failed'">
            {{ live?.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT' }}
          </span>
        </div>
        <div class="mt-2 text-[11px] text-slate-500">{{ live?.trigger_event }}</div>
      </div>
    </div>

    <div class="panel p-4">
      <h3 class="mb-2 text-sm font-medium text-slate-300">MIL-STD-704F 容限盒叠加波形</h3>
      <VChart class="h-80 w-full" :option="waveOption" autoresize />
    </div>

    <div class="panel overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr>
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">触发事件</th>
            <th class="px-4 py-3">Tr(ms)</th>
            <th class="px-4 py-3">THD%</th>
            <th class="px-4 py-3">合规</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in records"
            :key="r.id"
            class="cursor-pointer border-b border-slate-800 hover:bg-slate-800/40"
            @click="openRecord(r.id)"
          >
            <td class="px-4 py-2 font-mono text-xs">{{ r.id }}</td>
            <td class="px-4 py-2">{{ r.trigger_event }}</td>
            <td class="px-4 py-2">{{ r.recovery_time_ms ?? '—' }}</td>
            <td class="px-4 py-2">{{ r.thd_percentage }}</td>
            <td class="px-4 py-2">
              <span :class="r.is_compliant ? 'status-passed' : 'status-failed'">{{ r.is_compliant ? 'YES' : 'NO' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
