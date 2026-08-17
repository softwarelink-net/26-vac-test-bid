import { json, writeAudit, clientIp } from '../_utils.js'

const TRACE_MATRIX = [
  {
    hlr: 'HLR-GCU-001',
    hlr_title: '稳态输出电压精度 ≤±1.5%',
    llr: 'LLR-VR-011',
    llr_title: 'PI 调压环稳态误差计算',
    case_code: 'TC-VR-001',
    coverage: 'MC/DC',
    status: 'passed',
    evidence: 'exec-log/tc-001.json',
  },
  {
    hlr: 'HLR-GCU-014',
    hlr_title: '突加负载恢复时间 Tr < 40ms',
    llr: 'LLR-TR-021',
    llr_title: '瞬态观测窗与 Tr 判定',
    case_code: 'TC-TR-002',
    coverage: 'MC/DC',
    status: 'passed',
    evidence: 'exec-log/tc-002.json',
  },
  {
    hlr: 'HLR-GCU-015',
    hlr_title: '突卸负载峰值电压抑制',
    llr: 'LLR-TR-022',
    llr_title: '过压峰值钳位逻辑',
    case_code: 'TC-TR-003',
    coverage: 'MC/DC',
    status: 'passed',
    evidence: 'exec-log/tc-003.json',
  },
  {
    hlr: 'HLR-GCU-028',
    hlr_title: '单相短路保护动作',
    llr: 'LLR-PF-041',
    llr_title: '故障电流检测与跳闸',
    case_code: 'TC-PF-004',
    coverage: 'MC/DC',
    status: 'failed',
    evidence: 'exec-log/tc-004.json',
  },
  {
    hlr: 'HLR-GCU-008',
    hlr_title: '360~800Hz 变频工况稳定',
    llr: 'LLR-FQ-018',
    llr_title: '变频扫频调度器',
    case_code: 'TC-FQ-006',
    coverage: 'Statement',
    status: 'running',
    evidence: null,
  },
  {
    hlr: 'HLR-GCU-019',
    hlr_title: 'THD < 5%',
    llr: 'LLR-TH-033',
    llr_title: '谐波 FFT 分析模块',
    case_code: 'TC-TH-007',
    coverage: 'MC/DC',
    status: 'passed',
    evidence: 'exec-log/tc-007.json',
  },
  {
    hlr: 'HLR-ID-001',
    hlr_title: '参数辨识误差 < 3%',
    llr: 'LLR-ID-003',
    llr_title: '饱和曲线非线性拟合',
    case_code: 'TC-ID-008',
    coverage: 'Decision',
    status: 'passed',
    evidence: 'exec-log/tc-008.json',
  },
  {
    hlr: 'HLR-GCU-032',
    hlr_title: '过压/欠压保护故障注入',
    llr: 'LLR-FI-051',
    llr_title: '故障注入通道编排',
    case_code: 'TC-FI-005',
    coverage: 'MC/DC',
    status: 'pending',
    evidence: null,
  },
]

export async function handleCompliance(request, env, segments, user) {
  const sub = segments[0]

  if ((sub === 'matrix' || !sub) && request.method === 'GET') {
    const total = TRACE_MATRIX.length
    const covered = TRACE_MATRIX.filter((r) => r.status === 'passed').length
    const failed = TRACE_MATRIX.filter((r) => r.status === 'failed').length
    const pending = TRACE_MATRIX.filter((r) => r.status === 'pending' || r.status === 'running').length
    return json({
      data: {
        standard: 'DO-178C',
        target_coverage: 'MC/DC',
        metrics: {
          total_requirements: total,
          passed: covered,
          failed,
          pending,
          coverage_pct: Number(((covered / total) * 100).toFixed(1)),
          structural: { statement: 96.2, decision: 91.5, mcdc: 88.4 },
        },
        matrix: TRACE_MATRIX,
      },
    })
  }

  if (sub === 'export' && request.method === 'POST') {
    const pack = {
      pack_id: `EVD-${Date.now()}`,
      generated_at: new Date().toISOString(),
      standard: 'DO-178C',
      project: '115VAC变频交流发电软件测试平台',
      project_code: '0730-2611010438/01',
      exported_by: user?.real_name || 'unknown',
      matrix: TRACE_MATRIX,
      checksum: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
    }

    await writeAudit(env, {
      userId: user?.id,
      action: 'EXPORT_EVIDENCE_PACK',
      module: 'compliance',
      ip: clientIp(request),
      details: `导出适航证据包 ${pack.pack_id}`,
      level: 'SECRET',
    })

    return json({
      data: pack,
      download: {
        filename: `${pack.pack_id}-do178c-evidence.json`,
        content_type: 'application/json',
      },
    })
  }

  return json({ error: 'Unknown compliance endpoint' }, 404)
}
