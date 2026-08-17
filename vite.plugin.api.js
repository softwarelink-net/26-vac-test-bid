/**
 * Vite plugin: serve /api/* locally by invoking the Worker fetch handler
 * with in-memory D1/R2 mocks so `npm run dev` is a true full-stack loop.
 */
import worker from './functions/worker.js'

function memoryDb() {
  const tables = {
    users: [
      {
        id: 'usr-admin-01',
        username: 'admin',
        email: 'admin@avic-sepc.com',
        password_hash: 'scrypt_mock_admin_hash',
        real_name: '李德强',
        role: 'admin',
        department: '试验测试部',
        status: 'active',
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 'usr-tester-01',
        username: 'tester',
        email: 'tester@avic-sepc.com',
        password_hash: 'scrypt_mock_tester_hash',
        real_name: '管子婧',
        role: 'vv_engineer',
        department: '适航验证中心',
        status: 'active',
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        id: 'usr-auditor-01',
        username: 'auditor',
        email: 'auditor@avic-sepc.com',
        password_hash: 'scrypt_mock_auditor_hash',
        real_name: '李桐',
        role: 'auditor',
        department: '纪检审计处',
        status: 'active',
        created_at: '2026-08-01T00:00:00Z',
      },
    ],
    system_configs: [
      { key: 'FEATURE_AUTO_CALC_IDENTIFICATION', value: 'true', description: '是否启用发电机参数自动辨识算法内核', is_public: 1 },
      { key: 'FEATURE_MIL_STD_704F_CHECK', value: 'true', description: '是否开启供电品质标准实时校验', is_public: 1 },
    ],
    tender_notices: [],
    generator_identifications: [],
    test_cases: [],
    waveform_records: [],
    audit_logs: [],
  }

  return {
    prepare(sql) {
      const statement = {
        _sql: sql,
        _binds: [],
        bind(...args) {
          this._binds = args
          return this
        },
        async first() {
          const { results } = await this.all()
          return results[0] || null
        },
        async all() {
          const s = this._sql
          if (/FROM users/i.test(s) && /SELECT id, username/i.test(s)) {
            return {
              results: tables.users.map(({ password_hash, ...u }) => u),
            }
          }
          if (/FROM users/i.test(s)) return { results: tables.users }
          if (/system_configs/i.test(s)) return { results: tables.system_configs }
          if (/tender_notices/i.test(s)) return { results: tables.tender_notices }
          if (/generator_identifications/i.test(s)) return { results: tables.generator_identifications }
          if (/test_cases/i.test(s)) return { results: tables.test_cases }
          if (/waveform_records/i.test(s)) return { results: tables.waveform_records }
          if (/audit_logs/i.test(s)) {
            return {
              results: tables.audit_logs.map((a) => ({
                ...a,
                user_name: tables.users.find((u) => u.id === a.user_id)?.real_name,
              })),
            }
          }
          return { results: [] }
        },
        async run() {
          const s = this._sql
          const b = this._binds
          if (/INSERT INTO audit_logs/i.test(s)) {
            tables.audit_logs.unshift({
              id: b[0],
              user_id: b[1],
              action: b[2],
              target_module: b[3],
              ip_address: b[4],
              details: b[5],
              security_level: b[6],
              created_at: new Date().toISOString(),
            })
          }
          if (/INSERT INTO generator_identifications/i.test(s)) {
            tables.generator_identifications.unshift({
              id: b[0],
              test_unit_name: b[1],
              generator_type: b[2],
              rated_voltage: b[3],
              frequency_range: b[4],
              saturated_curve_data: b[5],
              calculated_parameters: b[6],
              error_margin: b[7],
              identified_by: b[8],
              created_at: new Date().toISOString(),
            })
          }
          if (/UPDATE test_cases/i.test(s)) {
            /* no-op for memory */
          }
          return { success: true }
        },
      }
      return statement
    },
  }
}

const r2 = {
  async put() {
    return undefined
  },
}

export function vacLocalApiPlugin() {
  const env = {
    DB: memoryDb(),
    ASSETS_BUCKET: r2,
    ENVIRONMENT: 'development',
    APP_NAME: '115VAC变频交流发电软件测试平台',
    HOST_DOMAIN: 'https://26-vac-test-bid.softwarelink.net',
  }

  return {
    name: 'vac-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()
        try {
          const host = req.headers.host || 'localhost:5173'
          const url = `http://${host}${req.url}`
          const chunks = []
          await new Promise((resolve) => {
            req.on('data', (c) => chunks.push(c))
            req.on('end', resolve)
          })
          const bodyBuf = Buffer.concat(chunks)
          const init = {
            method: req.method,
            headers: req.headers,
          }
          if (bodyBuf.length && req.method !== 'GET' && req.method !== 'HEAD') {
            init.body = bodyBuf
          }
          const request = new Request(url, init)
          const response = await worker.fetch(request, env, {})
          res.statusCode = response.status
          response.headers.forEach((v, k) => {
            if (k.toLowerCase() === 'transfer-encoding') return
            res.setHeader(k, v)
          })
          const ab = await response.arrayBuffer()
          res.end(Buffer.from(ab))
        } catch (err) {
          console.error('[vac-local-api]', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err.message || err) }))
        }
      })
    },
  }
}
