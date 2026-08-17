import { json } from '../_utils.js'

const MOCK_WAVES = [
  {
    id: 'wf-001',
    test_case_id: 'tc-002',
    trigger_event: 'Step Load Add',
    voltage_rms: 114.8,
    frequency_val: 400.2,
    recovery_time_ms: 28.5,
    thd_percentage: 2.1,
    waveform_data_url: 'r2://26-vac-test-bid-assets/waveforms/wf-001.json',
    is_compliant: true,
    captured_at: '2026-08-14T09:12:00Z',
  },
  {
    id: 'wf-002',
    test_case_id: 'tc-003',
    trigger_event: 'Step Load Drop',
    voltage_rms: 116.2,
    frequency_val: 399.8,
    recovery_time_ms: 32.1,
    thd_percentage: 2.4,
    waveform_data_url: 'r2://26-vac-test-bid-assets/waveforms/wf-002.json',
    is_compliant: true,
    captured_at: '2026-08-14T09:18:00Z',
  },
  {
    id: 'wf-003',
    test_case_id: 'tc-004',
    trigger_event: 'Short Circuit',
    voltage_rms: 42.5,
    frequency_val: 398.5,
    recovery_time_ms: null,
    thd_percentage: 18.6,
    waveform_data_url: 'r2://26-vac-test-bid-assets/waveforms/wf-003.json',
    is_compliant: false,
    captured_at: '2026-08-14T10:02:00Z',
  },
  {
    id: 'wf-004',
    test_case_id: 'tc-001',
    trigger_event: 'Steady State',
    voltage_rms: 115.1,
    frequency_val: 400.0,
    recovery_time_ms: null,
    thd_percentage: 1.8,
    waveform_data_url: 'r2://26-vac-test-bid-assets/waveforms/wf-004.json',
    is_compliant: true,
    captured_at: '2026-08-13T16:40:00Z',
  },
  {
    id: 'wf-005',
    test_case_id: 'tc-007',
    trigger_event: 'Over-Voltage',
    voltage_rms: 138.2,
    frequency_val: 401.5,
    recovery_time_ms: 45.0,
    thd_percentage: 3.2,
    waveform_data_url: 'r2://26-vac-test-bid-assets/waveforms/wf-005.json',
    is_compliant: true,
    captured_at: '2026-08-15T11:22:00Z',
  },
]

/** Generate synthetic transient waveform samples (ms resolution) */
function synthesizeWaveform(trigger = 'Step Load Add') {
  const n = 500
  const t = []
  const v = []
  const upper = []
  const lower = []
  for (let i = 0; i < n; i++) {
    const ms = i * 0.2
    t.push(Number(ms.toFixed(1)))
    let voltage = 115
    if (trigger === 'Step Load Add') {
      if (ms >= 20 && ms < 48.5) {
        voltage = 115 - 18 * Math.exp(-(ms - 20) / 8) * Math.sin(((ms - 20) / 6) * Math.PI)
      } else if (ms >= 48.5) {
        voltage = 115 + 1.2 * Math.exp(-(ms - 48.5) / 30) * Math.sin(ms / 4)
      }
    } else if (trigger === 'Step Load Drop') {
      if (ms >= 20 && ms < 52) {
        voltage = 115 + 22 * Math.exp(-(ms - 20) / 9)
      }
    } else if (trigger === 'Short Circuit') {
      if (ms >= 20) voltage = 40 + 8 * Math.random()
    } else if (trigger === 'Over-Voltage') {
      if (ms >= 20 && ms < 65) voltage = 140 - (ms - 20) * 0.4
    }
    voltage += (Math.random() - 0.5) * 0.4
    v.push(Number(voltage.toFixed(3)))
    // MIL-STD-704F AC normal envelope (simplified)
    upper.push(ms < 100 ? 180 : 122)
    lower.push(ms < 100 ? 80 : 108)
  }
  const recovery =
    trigger.includes('Load') || trigger === 'Over-Voltage'
      ? Number((20 + Math.random() * 25).toFixed(1))
      : null
  const thd = Number((1.5 + Math.random() * 2.5).toFixed(2))
  return {
    samples: { t, v, upper, lower },
    metrics: {
      voltage_rms: Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)),
      recovery_time_ms: recovery,
      thd_percentage: thd,
      is_compliant: recovery == null || recovery < 40,
      standard: 'MIL-STD-704F',
    },
  }
}

export async function handleWaveform(request, env, segments, user) {
  const sub = segments[0]

  if ((!sub || sub === 'list') && request.method === 'GET') {
    if (env.DB) {
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM waveform_records ORDER BY captured_at DESC',
        ).all()
        if (results?.length) {
          return json({
            data: results.map((r) => ({ ...r, is_compliant: !!r.is_compliant })),
          })
        }
      } catch (_) {
        /* mock */
      }
    }
    return json({ data: MOCK_WAVES })
  }

  if (sub === 'capture' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const trigger = body.trigger_event || 'Step Load Add'
    const synth = synthesizeWaveform(trigger)
    const record = {
      id: `wf-${crypto.randomUUID().slice(0, 8)}`,
      test_case_id: body.test_case_id || null,
      trigger_event: trigger,
      voltage_rms: synth.metrics.voltage_rms,
      frequency_val: body.frequency_val || 400,
      recovery_time_ms: synth.metrics.recovery_time_ms,
      thd_percentage: synth.metrics.thd_percentage,
      waveform_data_url: `r2://26-vac-test-bid-assets/waveforms/live.json`,
      is_compliant: synth.metrics.is_compliant,
      captured_at: new Date().toISOString(),
      samples: synth.samples,
      standard: 'MIL-STD-704F / GJB 181B',
    }

    // Optional R2 persist of sample JSON
    if (env.ASSETS_BUCKET) {
      try {
        await env.ASSETS_BUCKET.put(
          `waveforms/${record.id}.json`,
          JSON.stringify(synth.samples),
          { httpMetadata: { contentType: 'application/json' } },
        )
        record.waveform_data_url = `r2://26-vac-test-bid-assets/waveforms/${record.id}.json`
      } catch (_) {
        /* ignore */
      }
    }

    return json({ data: record })
  }

  if (sub === 'analyze' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const synth = synthesizeWaveform(body.trigger_event || 'Step Load Add')
    return json({
      data: {
        ...synth.metrics,
        tolerance_box: {
          normal_steady: { min: 108, max: 118 },
          transient_peak: { min: 80, max: 180 },
          recovery_limit_ms: 40,
          thd_limit_pct: 5,
        },
        samples: synth.samples,
      },
    })
  }

  if (sub && request.method === 'GET') {
    const found = MOCK_WAVES.find((w) => w.id === sub)
    if (!found) return json({ error: '波形记录不存在' }, 404)
    const synth = synthesizeWaveform(found.trigger_event)
    return json({ data: { ...found, samples: synth.samples } })
  }

  return json({ error: 'Unknown waveform endpoint' }, 404)
}
