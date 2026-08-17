import { json, uid, writeAudit, clientIp } from '../_utils.js'

const MOCK_CASES = [
  {
    id: 'tc-001',
    case_code: 'TC-VR-001',
    title: '稳态调压精度验证 115VAC@400Hz',
    standard_ref: 'DO-178C / MIL-STD-704F',
    test_category: 'Functional',
    hlr_ref: 'HLR-GCU-001',
    llr_ref: 'LLR-VR-011',
    target_coverage: 'MC/DC',
    execution_script: 'SEQ:SET_FREQ(400);SET_LOAD(0.5pu);ASSERT_Vrms(115,1.5%)',
    last_status: 'passed',
    last_duration_ms: 12450,
  },
  {
    id: 'tc-002',
    case_code: 'TC-TR-002',
    title: '突加负载瞬态恢复时间 Tr',
    standard_ref: 'DO-178C / MIL-STD-704F',
    test_category: 'Transient',
    hlr_ref: 'HLR-GCU-014',
    llr_ref: 'LLR-TR-021',
    target_coverage: 'MC/DC',
    execution_script: 'SEQ:STEP_LOAD(+0.5pu);CAPTURE_WAVE(2s);ASSERT_Tr(<40ms)',
    last_status: 'passed',
    last_duration_ms: 8320,
  },
  {
    id: 'tc-003',
    case_code: 'TC-TR-003',
    title: '突卸负载过压抑制与恢复',
    standard_ref: 'DO-178C / MIL-STD-704F',
    test_category: 'Transient',
    hlr_ref: 'HLR-GCU-015',
    llr_ref: 'LLR-TR-022',
    target_coverage: 'MC/DC',
    execution_script: 'SEQ:STEP_LOAD(-0.5pu);CAPTURE_WAVE(2s);ASSERT_Vpeak(<180)',
    last_status: 'passed',
    last_duration_ms: 9100,
  },
  {
    id: 'tc-004',
    case_code: 'TC-PF-004',
    title: '单相短路保护动作时序',
    standard_ref: 'DO-178C / GJB 181B',
    test_category: 'Protection',
    hlr_ref: 'HLR-GCU-028',
    llr_ref: 'LLR-PF-041',
    target_coverage: 'MC/DC',
    execution_script: 'SEQ:INJECT_FAULT(phaseA_short);ASSERT_TRIP(<20ms)',
    last_status: 'failed',
    last_duration_ms: 15600,
  },
  {
    id: 'tc-005',
    case_code: 'TC-FI-005',
    title: '过压欠压保护故障注入',
    standard_ref: 'DO-178C / MIL-STD-704F',
    test_category: 'Fault Injection',
    hlr_ref: 'HLR-GCU-032',
    llr_ref: 'LLR-FI-051',
    target_coverage: 'MC/DC',
    execution_script: 'SEQ:INJECT_OV(140V);ASSERT_PROTECT;INJECT_UV(90V);ASSERT_PROTECT',
    last_status: 'pending',
    last_duration_ms: null,
  },
  {
    id: 'tc-006',
    case_code: 'TC-FQ-006',
    title: '变频工况 360Hz-800Hz 扫频稳定性',
    standard_ref: 'DO-178C / MIL-STD-704F',
    test_category: 'Functional',
    hlr_ref: 'HLR-GCU-008',
    llr_ref: 'LLR-FQ-018',
    target_coverage: 'Statement',
    execution_script: 'SEQ:SWEEP_FREQ(360,800,20);ASSERT_Vrms(115,2%)',
    last_status: 'running',
    last_duration_ms: null,
  },
  {
    id: 'tc-007',
    case_code: 'TC-TH-007',
    title: '谐波畸变率 THD 合规性校验',
    standard_ref: 'DO-178C / GJB 181B',
    test_category: 'Functional',
    hlr_ref: 'HLR-GCU-019',
    llr_ref: 'LLR-TH-033',
    target_coverage: 'MC/DC',
    execution_script: 'SEQ:FFT_ANALYZE;ASSERT_THD(<5%)',
    last_status: 'passed',
    last_duration_ms: 22100,
  },
  {
    id: 'tc-008',
    case_code: 'TC-ID-008',
    title: '三级式发电机参数辨识闭环比对',
    standard_ref: 'DO-178C',
    test_category: 'Functional',
    hlr_ref: 'HLR-ID-001',
    llr_ref: 'LLR-ID-003',
    target_coverage: 'Decision',
    execution_script: 'SEQ:RUN_IDENT;COMPARE_PARAMS(Ld,Lq,Td0);ASSERT_ERR(<3%)',
    last_status: 'passed',
    last_duration_ms: 45800,
  },
]

let runtimeCases = [...MOCK_CASES]
let benchState = {
  frequency_hz: 400,
  voltage_setpoint: 115,
  load_pu: 0.5,
  mode: 'idle',
  sequence_id: null,
  progress: 0,
}

export async function handleTestBench(request, env, segments, user) {
  const sub = segments[0]

  if ((sub === 'cases' || !sub) && request.method === 'GET') {
    if (env.DB) {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM test_cases ORDER BY case_code').all()
        if (results?.length) return json({ data: results })
      } catch (_) {
        /* mock */
      }
    }
    return json({ data: runtimeCases })
  }

  if (sub === 'status' && request.method === 'GET') {
    return json({ data: { ...benchState, frequency_range: '360Hz-800Hz', bus_voltage: 115.0 } })
  }

  if (sub === 'control' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    if (body.frequency_hz != null) {
      const f = Number(body.frequency_hz)
      if (f < 360 || f > 800) {
        return json({ error: '频率越界：允许范围 360Hz~800Hz' }, 400)
      }
      benchState.frequency_hz = f
    }
    if (body.voltage_setpoint != null) benchState.voltage_setpoint = Number(body.voltage_setpoint)
    if (body.load_pu != null) benchState.load_pu = Number(body.load_pu)
    if (body.mode) benchState.mode = body.mode

    await writeAudit(env, {
      userId: user?.id,
      action: 'BENCH_CONTROL',
      module: 'test-bench',
      ip: clientIp(request),
      details: JSON.stringify(body),
    })

    return json({ data: benchState })
  }

  if (sub === 'execute' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const ids = body.case_ids || runtimeCases.map((c) => c.id)
    const sequence_id = uid('seq')
    benchState = { ...benchState, mode: 'running', sequence_id, progress: 0 }

    const results = []
    for (let i = 0; i < ids.length; i++) {
      const idx = runtimeCases.findIndex((c) => c.id === ids[i] || c.case_code === ids[i])
      if (idx < 0) continue
      const duration = 800 + Math.floor(Math.random() * 12000)
      const pass = Math.random() > 0.12
      runtimeCases[idx] = {
        ...runtimeCases[idx],
        last_status: pass ? 'passed' : 'failed',
        last_duration_ms: duration,
      }
      if (env.DB) {
        try {
          await env.DB.prepare(
            'UPDATE test_cases SET last_status = ?, last_duration_ms = ? WHERE id = ?',
          )
            .bind(runtimeCases[idx].last_status, duration, runtimeCases[idx].id)
            .run()
        } catch (_) {
          /* ignore */
        }
      }
      results.push({
        id: runtimeCases[idx].id,
        case_code: runtimeCases[idx].case_code,
        status: runtimeCases[idx].last_status,
        duration_ms: duration,
      })
      benchState.progress = Math.round(((i + 1) / ids.length) * 100)
    }

    benchState.mode = 'idle'
    await writeAudit(env, {
      userId: user?.id,
      action: 'EXECUTE_TEST_SEQ',
      module: 'test-bench',
      ip: clientIp(request),
      details: `序列 ${sequence_id} 执行 ${results.length} 条用例`,
    })

    return json({
      data: {
        sequence_id,
        results,
        summary: {
          total: results.length,
          passed: results.filter((r) => r.status === 'passed').length,
          failed: results.filter((r) => r.status === 'failed').length,
        },
      },
    })
  }

  if (sub === 'sequences' && request.method === 'GET') {
    return json({
      data: [
        {
          id: 'seq-reg-360-800',
          name: 'REG-360-800-BATCH',
          description: '360~800Hz 变频回归批次',
          case_ids: ['tc-001', 'tc-006', 'tc-007', 'tc-002', 'tc-003'],
        },
        {
          id: 'seq-fault-inject',
          name: 'FAULT-INJECT-PACK',
          description: '保护与故障注入包',
          case_ids: ['tc-004', 'tc-005'],
        },
      ],
    })
  }

  return json({ error: 'Unknown test-bench endpoint' }, 404)
}
