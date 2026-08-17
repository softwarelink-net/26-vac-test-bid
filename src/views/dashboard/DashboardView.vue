<script setup>
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/utils/api'
import { Activity, Cpu, FlaskConical, GitBranch, Timer, FileText } from 'lucide-vue-next'

const tender = ref(null)
const countdown = ref(null)
const cases = ref([])
const matrix = ref(null)

const stats = computed(() => {
  const list = cases.value
  return {
    total: list.length,
    passed: list.filter((c) => c.last_status === 'passed').length,
    failed: list.filter((c) => c.last_status === 'failed').length,
    running: list.filter((c) => c.last_status === 'running').length,
  }
})

onMounted(async () => {
  try {
    const [t, c, m, casesRes] = await Promise.all([
      api('/tenders/current'),
      api('/tenders/countdown'),
      api('/compliance/matrix'),
      api('/test-bench/cases'),
    ])
    tender.value = t.data
    countdown.value = c.data
    matrix.value = m.data
    cases.value = casesRes.data || []
  } catch {
    tender.value = {
      project_name: '115VAC变频交流发电软件测试平台',
      project_code: '0730-2611010438/01',
      purchaser: '陕西航空电气有限责任公司',
      bid_deadline: '2026/09/03 09:30:00',
      budget_amount: 3500000,
      status: 'OPEN_FOR_BID',
    }
    countdown.value = { remain_days: 17, status: 'OPEN' }
    matrix.value = { metrics: { coverage_pct: 62.5, structural: { mcdc: 88.4 } } }
    cases.value = [
      { last_status: 'passed' },
      { last_status: 'passed' },
      { last_status: 'failed' },
      { last_status: 'running' },
      { last_status: 'pending' },
    ]
  }
})
</script>

<template>
  <div class="space-y-6">
    <section class="panel relative overflow-hidden p-6">
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-aviation-500/10 blur-2xl" />
      <h1 class="font-display text-3xl font-semibold tracking-wide text-white md:text-4xl">
        115VAC 变频交流发电软件测试平台
      </h1>
      <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
        集成三级式发电机参数辨识、模块化变频程控测试台与微秒级瞬态实时分析，贯通 DO-178C 需求—用例—覆盖率—审计证据链。
      </p>
      <div class="mt-4 flex flex-wrap gap-2 text-xs">
        <span class="status-running">{{ tender?.status || 'OPEN_FOR_BID' }}</span>
        <span class="badge bg-slate-700/60 text-slate-200">{{ tender?.project_code }}</span>
        <span class="badge bg-slate-700/60 text-slate-200">投标剩余 {{ countdown?.remain_days ?? '—' }} 天</span>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="panel p-4">
        <div class="flex items-center gap-2 text-slate-400"><FlaskConical class="h-4 w-4" /> 用例执行</div>
        <div class="mt-2 font-display text-3xl text-white">{{ stats.passed }}/{{ stats.total }}</div>
        <div class="text-xs text-emerald-300">通过 · {{ stats.failed }} 失败 · {{ stats.running }} 运行中</div>
      </div>
      <div class="panel p-4">
        <div class="flex items-center gap-2 text-slate-400"><GitBranch class="h-4 w-4" /> MC/DC 覆盖</div>
        <div class="mt-2 font-display text-3xl text-white">{{ matrix?.metrics?.structural?.mcdc ?? '—' }}%</div>
        <div class="text-xs text-slate-400">需求追溯覆盖 {{ matrix?.metrics?.coverage_pct ?? '—' }}%</div>
      </div>
      <div class="panel p-4">
        <div class="flex items-center gap-2 text-slate-400"><Timer class="h-4 w-4" /> 变频工况</div>
        <div class="mt-2 font-display text-3xl text-white">360–800</div>
        <div class="text-xs text-slate-400">Hz · 115VAC 额定母线</div>
      </div>
      <div class="panel p-4">
        <div class="flex items-center gap-2 text-slate-400"><FileText class="h-4 w-4" /> 预算金额</div>
        <div class="mt-2 font-display text-3xl text-white">¥{{ ((tender?.budget_amount || 0) / 10000).toFixed(0) }}万</div>
        <div class="text-xs text-slate-400">{{ tender?.purchaser }}</div>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <RouterLink to="/identification" class="panel group p-5 transition hover:border-aviation-500/50">
        <Cpu class="mb-3 h-6 w-6 text-aviation-300" />
        <h3 class="font-semibold text-white group-hover:text-aviation-200">参数辨识工作台</h3>
        <p class="mt-1 text-sm text-slate-400">PMG/励磁机/主发磁链饱和曲线与 Ld/Lq 在线拟合</p>
      </RouterLink>
      <RouterLink to="/test-bench" class="panel group p-5 transition hover:border-aviation-500/50">
        <FlaskConical class="mb-3 h-6 w-6 text-aviation-300" />
        <h3 class="font-semibold text-white group-hover:text-aviation-200">程控集成测试台</h3>
        <p class="mt-1 text-sm text-slate-400">自动化回归序列编排与变频工况协同控制</p>
      </RouterLink>
      <RouterLink to="/waveform" class="panel group p-5 transition hover:border-aviation-500/50">
        <Activity class="mb-3 h-6 w-6 text-aviation-300" />
        <h3 class="font-semibold text-white group-hover:text-aviation-200">瞬态品质分析</h3>
        <p class="mt-1 text-sm text-slate-400">MIL-STD-704F 容限盒 · Tr / THD 合规判定</p>
      </RouterLink>
    </section>
  </div>
</template>
