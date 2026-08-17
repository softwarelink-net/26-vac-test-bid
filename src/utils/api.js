const TOKEN_KEY = 'vac_session_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
    headers['X-Session-Token'] = token
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const err = new Error(data?.error || `请求失败 (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

/** Local mock fallbacks when Worker/API unavailable during pure Vite preview */
export const localMocks = {
  async login(email, password) {
    const map = {
      'admin@avic-sepc.com': {
        password: 'Admin@2026!Sec',
        user: {
          id: 'usr-admin-01',
          email,
          username: 'admin',
          real_name: '李德强',
          role: 'admin',
          department: '试验测试部',
        },
      },
      'tester@avic-sepc.com': {
        password: 'Tester@2026!Sec',
        user: {
          id: 'usr-tester-01',
          email,
          username: 'tester',
          real_name: '管子婧',
          role: 'vv_engineer',
          department: '适航验证中心',
        },
      },
      'auditor@avic-sepc.com': {
        password: 'Auditor@2026!Sec',
        user: {
          id: 'usr-auditor-01',
          email,
          username: 'auditor',
          real_name: '李桐',
          role: 'auditor',
          department: '纪检审计处',
        },
      },
    }
    const row = map[email]
    if (!row || row.password !== password) throw new Error('邮箱或密码错误')
    const token = `vac.${btoa(JSON.stringify({ sub: row.user.id, role: row.user.role, exp: Date.now() + 8 * 3600_000 }))}`
    return { data: { user: row.user, token } }
  },
}
