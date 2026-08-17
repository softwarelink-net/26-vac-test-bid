<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { api } from '@/utils/api'
import { Clock, CheckCircle2, Circle } from 'lucide-vue-next'

const tender = ref(null)
const quals = ref([])
const remainMs = ref(0)
let timer

const countdown = computed(() => {
  const ms = remainMs.value
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { d, h, m, s }
})

const elements = computed(() => {
  const t = tender.value || {}
  return [
    { label: '项目名称', value: t.project_name },
    { label: '项目编号', value: t.project_code },
    { label: '发包方', value: t.purchaser },
    { label: '发布时间', value: t.publish_time },
    { label: '投标截止', value: t.bid_deadline },
    { label: '预算金额', value: t.budget_amount != null ? `¥${Number(t.budget_amount).toLocaleString()}` : '—' },
    { label: '标书售价', value: t.doc_price != null ? `¥${t.doc_price}` : '—' },
    { label: '当前状态', value: t.status },
  ]
})

onMounted(async () => {
  try {
    const [t, q, c] = await Promise.all([
      api('/tenders/current'),
      api('/tenders/qualifications'),
      api('/tenders/countdown'),
    ])
    tender.value = t.data
    quals.value = q.data || []
    remainMs.value = c.data?.remain_ms ?? 0
  } catch {
    tender.value = {
      project_name: '115VAC变频交流发电软件测试平台',
      project_code: '0730-2611010438/01',
      purchaser: '陕西航空电气有限责任公司',
      publish_time: '2026/08/13 18:03:43',
      bid_deadline: '2026/09/03 09:30:00',
      budget_amount: 3500000,
      doc_price: 500,
      status: 'OPEN_FOR_BID',
      content_summary: '满足 DO-178C 适航标准对需求覆盖的测试要求。',
      specifications: '参数辨识设备、程控集成测试台、瞬态实时测试工具。',
      tech_points: [
        '三级式发电机数字调压软件参数辨识设备、模块化变频发电软件程控集成测试台、发电调压软件瞬态实时测试工具。',
        '115VAC/360Hz-800Hz 变频供电品质闭环验证。',
        '突加/突卸、短路、过压欠压等高频采样与故障注入。',
      ],
      innovations: [
        '虚拟闭环架构突破台架资源冲突。',
        '微秒级多级耦合参数辨识。',
        'DO-178C 证据链自动化贯通。',
      ],
      keywords: ['陕西航空电气有限责任公司', '115VAC变频交流发电', 'DO-178C'],
    }
    remainMs.value = Math.max(0, new Date('2026-09-03T09:30:00+08:00') - Date.now())
    quals.value = [
      { id: 'q1', item: '独立法人资格与营业执照', required: true, status: 'verified' },
      { id: 'q3', item: 'DO-178C 适航软件验证能力说明', required: true, status: 'pending' },
    ]
  }
  timer = setInterval(() => {
    remainMs.value = Math.max(0, remainMs.value - 1000)
  }, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="font-display text-2xl font-semibold text-white">招标与投标合规管理中心</h1>
      <p class="text-sm text-slate-400">标讯全要素检索 · 资质审查核验 · 文档合规看板</p>
    </div>

    <div class="panel flex flex-wrap items-center gap-6 p-5">
      <div class="flex items-center gap-2 text-aviation-200">
        <Clock class="h-5 w-5" />
        <span class="text-sm">投标倒计时</span>
      </div>
      <div class="flex gap-3 font-display text-3xl font-semibold tracking-wider text-white">
        <span>{{ countdown.d }}<span class="text-sm text-slate-400">天</span></span>
        <span>{{ String(countdown.h).padStart(2, '0') }}<span class="text-sm text-slate-400">时</span></span>
        <span>{{ String(countdown.m).padStart(2, '0') }}<span class="text-sm text-slate-400">分</span></span>
        <span>{{ String(countdown.s).padStart(2, '0') }}<span class="text-sm text-slate-400">秒</span></span>
      </div>
      <div class="text-xs text-slate-400">截止 {{ tender?.bid_deadline }}</div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="panel p-5">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">招标公告八大要素</h2>
        <dl class="space-y-2">
          <div v-for="el in elements" :key="el.label" class="grid grid-cols-3 gap-2 border-b border-slate-800/80 py-2 text-sm">
            <dt class="text-slate-500">{{ el.label }}</dt>
            <dd class="col-span-2 text-slate-100">{{ el.value || '—' }}</dd>
          </div>
        </dl>
      </div>

      <div class="panel space-y-4 p-5">
        <div>
          <h2 class="mb-2 text-sm font-semibold text-slate-200">摘要</h2>
          <p class="text-sm leading-relaxed text-slate-300">{{ tender?.content_summary }}</p>
        </div>
        <div>
          <h2 class="mb-2 text-sm font-semibold text-slate-200">技术规格</h2>
          <p class="text-sm leading-relaxed text-slate-300">{{ tender?.specifications }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="k in tender?.keywords || []" :key="k" class="badge bg-aviation-600/20 text-aviation-200">{{ k }}</span>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="panel p-5">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">技术要点</h2>
        <ol class="list-decimal space-y-2 pl-4 text-sm text-slate-300">
          <li v-for="(p, i) in tender?.tech_points || []" :key="i">{{ p }}</li>
        </ol>
      </div>
      <div class="panel p-5">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">技术创新性</h2>
        <ol class="list-decimal space-y-2 pl-4 text-sm text-slate-300">
          <li v-for="(p, i) in tender?.innovations || []" :key="i">{{ p }}</li>
        </ol>
      </div>
    </div>

    <div class="panel p-5">
      <h2 class="mb-3 text-sm font-semibold text-slate-200">资质审查核验清单</h2>
      <ul class="space-y-2">
        <li v-for="q in quals" :key="q.id" class="flex items-center gap-3 rounded-md bg-slate-950/50 px-3 py-2 text-sm">
          <CheckCircle2 v-if="q.status === 'verified'" class="h-4 w-4 text-emerald-400" />
          <Circle v-else class="h-4 w-4 text-amber-300" />
          <span class="flex-1 text-slate-200">{{ q.item }}</span>
          <span v-if="q.required" class="text-[10px] text-rose-300">必填</span>
          <span :class="q.status === 'verified' ? 'status-passed' : 'status-pending'">{{ q.status }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
