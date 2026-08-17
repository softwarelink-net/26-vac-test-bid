import { json, uid, writeAudit, clientIp } from '../_utils.js'

const MOCK_RECORDS = [
  {
    id: 'gid-001',
    test_unit_name: 'VF-AC-GCU-A01',
    generator_type: 'Three-Stage Brushless VF-AC',
    rated_voltage: 115.0,
    frequency_range: '360Hz-800Hz',
    saturated_curve_data: [
      { if: 0.2, psi: 0.18 },
      { if: 0.4, psi: 0.35 },
      { if: 0.6, psi: 0.48 },
      { if: 0.8, psi: 0.58 },
      { if: 1.0, psi: 0.65 },
      { if: 1.2, psi: 0.7 },
      { if: 1.4, psi: 0.73 },
    ],
    calculated_parameters: {
      Ld: 0.00215,
      Lq: 0.00342,
      Td0: 1.85,
      Td_prime: 0.042,
      Tdo_dprime: 0.008,
      Ra: 0.012,
      Xs: 0.85,
      Xsd: 0.18,
    },
    error_margin: 1.8,
    identified_by: 'usr-dev-01',
    created_at: '2026-08-10T08:22:00Z',
  },
  {
    id: 'gid-002',
    test_unit_name: 'VF-AC-GCU-B07',
    generator_type: 'Three-Stage Brushless VF-AC',
    rated_voltage: 115.0,
    frequency_range: '360Hz-800Hz',
    saturated_curve_data: [
      { if: 0.2, psi: 0.17 },
      { if: 0.4, psi: 0.33 },
      { if: 0.6, psi: 0.46 },
      { if: 0.8, psi: 0.56 },
      { if: 1.0, psi: 0.63 },
      { if: 1.2, psi: 0.68 },
      { if: 1.4, psi: 0.71 },
    ],
    calculated_parameters: {
      Ld: 0.00208,
      Lq: 0.00335,
      Td0: 1.92,
      Td_prime: 0.045,
      Tdo_dprime: 0.009,
      Ra: 0.013,
      Xs: 0.82,
      Xsd: 0.17,
    },
    error_margin: 2.1,
    identified_by: 'usr-tester-01',
    created_at: '2026-08-12T14:05:00Z',
  },
]

function parseRow(row) {
  if (!row) return row
  return {
    ...row,
    saturated_curve_data:
      typeof row.saturated_curve_data === 'string'
        ? JSON.parse(row.saturated_curve_data)
        : row.saturated_curve_data,
    calculated_parameters:
      typeof row.calculated_parameters === 'string'
        ? JSON.parse(row.calculated_parameters)
        : row.calculated_parameters,
  }
}

/** Simple saturation curve fit & parameter estimation (demo algorithm) */
function runIdentification(body = {}) {
  const ifValues = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4]
  const noise = () => (Math.random() - 0.5) * 0.02
  const curve = ifValues.map((ifv) => {
    const psi = 0.78 * (1 - Math.exp(-1.6 * ifv)) + noise()
    return { if: ifv, psi: Number(psi.toFixed(4)) }
  })
  const freq = Number(body.frequency || 400)
  const scale = 400 / Math.max(360, Math.min(800, freq))
  const params = {
    Ld: Number((0.0021 * scale + Math.random() * 0.00005).toFixed(5)),
    Lq: Number((0.0034 * scale + Math.random() * 0.00005).toFixed(5)),
    Td0: Number((1.8 + Math.random() * 0.2).toFixed(3)),
    Td_prime: Number((0.04 + Math.random() * 0.01).toFixed(4)),
    Tdo_dprime: Number((0.007 + Math.random() * 0.003).toFixed(4)),
    Ra: Number((0.012 + Math.random() * 0.002).toFixed(4)),
    Xs: Number((0.84 + Math.random() * 0.04).toFixed(3)),
    Xsd: Number((0.17 + Math.random() * 0.02).toFixed(3)),
  }
  const measured = body.reference_params || {
    Ld: 0.00212,
    Lq: 0.00338,
    Td0: 1.88,
    Td_prime: 0.043,
  }
  const errs = ['Ld', 'Lq', 'Td0', 'Td_prime'].map((k) => {
    const m = measured[k] || params[k]
    return Math.abs(params[k] - m) / m * 100
  })
  const error_margin = Number((errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(2))
  return { curve, params, measured, error_margin }
}

export async function handleIdentification(request, env, segments, user) {
  const sub = segments[0]

  if ((!sub || sub === 'list') && request.method === 'GET') {
    if (env.DB) {
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM generator_identifications ORDER BY created_at DESC',
        ).all()
        if (results?.length) return json({ data: results.map(parseRow) })
      } catch (_) {
        /* mock */
      }
    }
    return json({ data: MOCK_RECORDS })
  }

  if (sub === 'run' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const result = runIdentification(body)
    const record = {
      id: uid('gid'),
      test_unit_name: body.test_unit_name || 'VF-AC-GCU-ONLINE',
      generator_type: body.generator_type || 'Three-Stage Brushless VF-AC',
      rated_voltage: 115.0,
      frequency_range: '360Hz-800Hz',
      saturated_curve_data: result.curve,
      calculated_parameters: result.params,
      error_margin: result.error_margin,
      identified_by: user?.id || null,
      created_at: new Date().toISOString(),
      comparison: result.measured,
    }

    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO generator_identifications
           (id, test_unit_name, generator_type, rated_voltage, frequency_range, saturated_curve_data, calculated_parameters, error_margin, identified_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            record.id,
            record.test_unit_name,
            record.generator_type,
            record.rated_voltage,
            record.frequency_range,
            JSON.stringify(record.saturated_curve_data),
            JSON.stringify(record.calculated_parameters),
            record.error_margin,
            record.identified_by,
          )
          .run()
      } catch (_) {
        /* ignore persist errors in demo */
      }
    }

    await writeAudit(env, {
      userId: user?.id,
      action: 'RUN_IDENTIFICATION',
      module: 'identification',
      ip: clientIp(request),
      details: `辨识 ${record.test_unit_name} 误差 ${record.error_margin}%`,
    })

    return json({ data: record })
  }

  if (sub && request.method === 'GET') {
    const found = MOCK_RECORDS.find((r) => r.id === sub)
    if (found) return json({ data: found })
    if (env.DB) {
      const row = await env.DB.prepare('SELECT * FROM generator_identifications WHERE id = ?').bind(sub).first()
      if (row) return json({ data: parseRow(row) })
    }
    return json({ error: '记录不存在' }, 404)
  }

  return json({ error: 'Unknown identification endpoint' }, 404)
}
