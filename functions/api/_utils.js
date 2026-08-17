/** Shared Worker helpers */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
  'Access-Control-Expose-Headers': 'X-Session-Token',
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders,
    },
  })
}

export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

/** Demo credential map — passwords match README demo accounts */
export const DEMO_CREDENTIALS = {
  'admin@avic-sepc.com': {
    password: 'Admin@2026!Sec',
    hash: 'scrypt_mock_admin_hash',
    id: 'usr-admin-01',
    username: 'admin',
    real_name: '李德强',
    role: 'admin',
    department: '试验测试部',
  },
  'tester@avic-sepc.com': {
    password: 'Tester@2026!Sec',
    hash: 'scrypt_mock_tester_hash',
    id: 'usr-tester-01',
    username: 'tester',
    real_name: '管子婧',
    role: 'vv_engineer',
    department: '适航验证中心',
  },
  'auditor@avic-sepc.com': {
    password: 'Auditor@2026!Sec',
    hash: 'scrypt_mock_auditor_hash',
    id: 'usr-auditor-01',
    username: 'auditor',
    real_name: '李桐',
    role: 'auditor',
    department: '纪检审计处',
  },
  'dev@avic-sepc.com': {
    password: 'Dev@2026!Sec',
    hash: 'scrypt_mock_dev_hash',
    id: 'usr-dev-01',
    username: 'developer',
    real_name: '王启明',
    role: 'dev_engineer',
    department: '算法研发室',
  },
}

const sessions = new Map()

export function createToken(user) {
  const token = `vac.${btoa(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 8 * 3600_000 }))}`
  sessions.set(token, { ...user, token })
  return token
}

export function parseToken(token) {
  if (!token) return null
  if (sessions.has(token)) return sessions.get(token)
  try {
    const raw = token.startsWith('vac.') ? token.slice(4) : token
    const payload = JSON.parse(atob(raw))
    if (payload.exp && payload.exp < Date.now()) return null
    const demo = Object.values(DEMO_CREDENTIALS).find((u) => u.id === payload.sub)
    if (!demo) return null
    return {
      id: demo.id,
      username: demo.username,
      email: Object.keys(DEMO_CREDENTIALS).find((k) => DEMO_CREDENTIALS[k].id === demo.id),
      real_name: demo.real_name,
      role: demo.role,
      department: demo.department,
      token,
    }
  } catch {
    return null
  }
}

export async function getSessionUser(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const headerToken = request.headers.get('X-Session-Token')
  const cookie = request.headers.get('Cookie') || ''
  const cookieMatch = cookie.match(/(?:^|;\s*)vac_session=([^;]+)/)
  const token = headerToken || (auth.startsWith('Bearer ') ? auth.slice(7) : null) || cookieMatch?.[1]
  return parseToken(token)
}

export async function writeAudit(env, { userId, action, module, ip, details, level = 'CONFIDENTIAL' }) {
  if (!env.DB) return
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, target_module, ip_address, details, security_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(uid('aud'), userId || null, action, module, ip || null, details || null, level)
      .run()
  } catch (e) {
    console.warn('audit write failed', e)
  }
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '127.0.0.1'
}
