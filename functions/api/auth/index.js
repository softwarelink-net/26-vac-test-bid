import {
  json,
  DEMO_CREDENTIALS,
  createToken,
  parseToken,
  writeAudit,
  clientIp,
} from '../_utils.js'

export async function handleAuth(request, env, segments) {
  const action = segments[0] || ''

  if (action === 'login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const caSerial = body.ca_cert_serial || null

    const demo = DEMO_CREDENTIALS[email]
    if (!demo || demo.password !== password) {
      await writeAudit(env, {
        userId: null,
        action: 'LOGIN_FAILED',
        module: 'auth',
        ip: clientIp(request),
        details: `失败登录尝试: ${email}`,
      })
      return json({ error: '邮箱或密码错误' }, 401)
    }

    if (body.use_ca && caSerial) {
      // Mock CA validation — accept serials starting with AVIC-
      if (!String(caSerial).startsWith('AVIC-')) {
        return json({ error: 'CA 证书序列号无效，期望格式 AVIC-XXXX' }, 401)
      }
    }

    const user = {
      id: demo.id,
      username: demo.username,
      email,
      real_name: demo.real_name,
      role: demo.role,
      department: demo.department,
    }
    const token = createToken(user)

    await writeAudit(env, {
      userId: user.id,
      action: body.use_ca ? 'LOGIN_CA_SUCCESS' : 'LOGIN_SUCCESS',
      module: 'auth',
      ip: clientIp(request),
      details: `${user.real_name}(${user.role}) 登录成功`,
    })

    return json(
      { data: { user, token, expires_in: 28800 } },
      200,
      {
        'Set-Cookie': `vac_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`,
        'X-Session-Token': token,
      },
    )
  }

  if (action === 'me' && request.method === 'GET') {
    const auth = request.headers.get('Authorization') || ''
    const headerToken = request.headers.get('X-Session-Token')
    const token = headerToken || (auth.startsWith('Bearer ') ? auth.slice(7) : null)
    const user = parseToken(token)
    if (!user) return json({ error: '会话无效或已过期' }, 401)
    return json({ data: user })
  }

  if (action === 'logout' && request.method === 'POST') {
    return json(
      { ok: true },
      200,
      { 'Set-Cookie': 'vac_session=; Path=/; Max-Age=0' },
    )
  }

  if (action === 'ca-challenge' && request.method === 'POST') {
    const nonce = crypto.randomUUID()
    return json({
      data: {
        challenge: `AVIC-CA-CHALLENGE-${nonce.slice(0, 8).toUpperCase()}`,
        expires_in: 120,
        hint: '演示环境：任意以 AVIC- 开头的证书序列号可通过校验',
      },
    })
  }

  return json({ error: 'Unsupported auth action' }, 404)
}
