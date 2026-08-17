import { json } from '../_utils.js'

const MOCK_TENDER = {
  id: 'tnd-0730-2611010438',
  project_code: '0730-2611010438/01',
  project_name: '115VAC变频交流发电软件测试平台',
  purchaser: '陕西航空电气有限责任公司',
  publish_time: '2026/08/13 18:03:43',
  bid_deadline: '2026/09/03 09:30:00',
  budget_amount: 3500000.0,
  status: 'OPEN_FOR_BID',
  doc_price: 500.0,
  content_summary:
    '主要针对主发电系统软件开发、测试、优化的需求，用于实现发电软件功能测试、不同工况下调压性能测试，保障测试需求覆盖度，满足 DO-178C 适航标准。',
  specifications:
    '由三级式发电机数字调压软件参数辨识设备、模块化变频发电软件程控集成测试台、发电调压软件瞬态实时测试工具三部分组成。',
  compliance_rules: 'DO-178C Level B; MIL-STD-704F; GJB 181B',
  keywords: [
    '陕西航空电气有限责任公司',
    '115VAC变频交流发电',
    '软件测试平台',
    'DO-178C',
    '发电调压软件',
    '0730-2611010438/01',
    '航空电气招标',
    '西安招标',
  ],
  tech_points: [
    '平台由三级式发电机数字调压软件参数辨识设备、模块化变频发电软件程控集成测试台、发电调压软件瞬态实时测试工具三部分组成。',
    '实现主发电系统调压软件独立闭环验证，保障调压控制精度、动态响应与 115VAC/360Hz-800Hz 变频供电品质。',
    '全面覆盖突加/突卸负载、单相短路、过压欠压保护等瞬态工况高频采样与故障注入。',
  ],
  innovations: [
    '构建数字仿真与实时物理量交互的虚拟闭环架构，突破物理试验台架排队与资源冲突瓶颈。',
    '针对三级式发电机多级耦合非线性特性的微秒级参数高精度实时辨识算法。',
    '深度嵌入 DO-178C 适航追踪链，实现需求-用例-覆盖率-审计证据链的自动化贯通。',
  ],
}

const QUALIFICATION_CHECKLIST = [
  { id: 'q1', item: '独立法人资格与营业执照', required: true, status: 'verified' },
  { id: 'q2', item: '航空电源/电气系统相关业绩证明', required: true, status: 'verified' },
  { id: 'q3', item: 'DO-178C / 适航软件验证能力说明', required: true, status: 'pending' },
  { id: 'q4', item: '保密资格或保密承诺函', required: true, status: 'verified' },
  { id: 'q5', item: '财务审计报告（近三年）', required: true, status: 'pending' },
  { id: 'q6', item: '项目团队人员资质与简历', required: false, status: 'verified' },
  { id: 'q7', item: '知识产权与原创性声明', required: true, status: 'verified' },
  { id: 'q8', item: '投标保证金缴纳凭证', required: true, status: 'pending' },
]

export async function handleTenders(request, env, segments, user) {
  const sub = segments[0]

  if ((!sub || sub === 'list') && request.method === 'GET') {
    if (env.DB) {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM tender_notices ORDER BY publish_time DESC').all()
        if (results?.length) return json({ data: results })
      } catch (_) {
        /* fallback mock */
      }
    }
    return json({ data: [MOCK_TENDER] })
  }

  if ((sub === 'current' || sub === '0730-2611010438' || sub === 'tnd-0730-2611010438') && request.method === 'GET') {
    if (env.DB) {
      try {
        const row = await env.DB.prepare(
          "SELECT * FROM tender_notices WHERE project_code = '0730-2611010438/01' LIMIT 1",
        ).first()
        if (row) {
          return json({ data: { ...MOCK_TENDER, ...row } })
        }
      } catch (_) {
        /* fallback */
      }
    }
    return json({ data: MOCK_TENDER })
  }

  if (sub === 'qualifications' && request.method === 'GET') {
    return json({ data: QUALIFICATION_CHECKLIST })
  }

  if (sub === 'countdown' && request.method === 'GET') {
    const deadline = new Date('2026-09-03T09:30:00+08:00').getTime()
    const now = Date.now()
    const remain = Math.max(0, deadline - now)
    return json({
      data: {
        deadline: '2026/09/03 09:30:00',
        remain_ms: remain,
        remain_days: Math.floor(remain / 86400000),
        status: remain > 0 ? 'OPEN' : 'CLOSED',
      },
    })
  }

  return json({ error: 'Unknown tender endpoint' }, 404)
}
