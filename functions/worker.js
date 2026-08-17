/**
 * Cloudflare Worker entry — global route dispatch & context binding
 * Serves SPA assets + /api/* JSON endpoints with D1 / R2 bindings.
 */

import { handleAuth } from './api/auth/index.js'
import { handleTenders } from './api/tenders/index.js'
import { handleIdentification } from './api/identification/index.js'
import { handleTestBench } from './api/test-bench/index.js'
import { handleWaveform } from './api/waveform/index.js'
import { handleCompliance } from './api/compliance/index.js'
import { handleAudit } from './api/audit/index.js'
import { json, corsHeaders, getSessionUser } from './api/_utils.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const { pathname } = url

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
      if (pathname.startsWith('/api/')) {
        return await routeApi(request, env, ctx, pathname)
      }

      // SPA / static asset fallback (Workers Assets or Sites)
      if (env.ASSETS?.fetch) {
        const assetResp = await env.ASSETS.fetch(request)
        if (assetResp.status !== 404) return assetResp
        // History-mode SPA fallback
        const indexReq = new Request(new URL('/index.html', request.url), request)
        return env.ASSETS.fetch(indexReq)
      }

      return json({
        ok: true,
        app: env.APP_NAME || '26-vac-test-bid',
        path: pathname,
        hint: 'Static assets not bound; use npm run build && wrangler deploy with [site]/dist',
      })
    } catch (err) {
      console.error('[worker]', err)
      return json({ error: err.message || 'Internal Server Error' }, 500)
    }
  },
}

async function routeApi(request, env, ctx, pathname) {
  const segments = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  const resource = segments[0] || ''

  // Public endpoints
  if (resource === 'health') {
    return json({
      status: 'ok',
      app: env.APP_NAME,
      environment: env.ENVIRONMENT,
      time: new Date().toISOString(),
    })
  }

  if (resource === 'auth') {
    return handleAuth(request, env, segments.slice(1))
  }

  // Remaining routes require session (demo: soft-auth via header / cookie)
  const user = await getSessionUser(request, env)
  const needsAuth = !['tenders'].includes(resource) || request.method !== 'GET'

  if (!user && needsAuth && resource !== 'tenders') {
    // Allow GET tenders without auth for public bid notice
  }

  if (!user && !['tenders', 'health'].includes(resource)) {
    // Soft gate: still allow demo with mock when no DB
    if (!env.DB) {
      // fall through with null user for mock handlers
    } else if (resource !== 'tenders') {
      return json({ error: '未认证，请先登录' }, 401)
    }
  }

  switch (resource) {
    case 'tenders':
      return handleTenders(request, env, segments.slice(1), user)
    case 'identification':
      return handleIdentification(request, env, segments.slice(1), user)
    case 'test-bench':
      return handleTestBench(request, env, segments.slice(1), user)
    case 'waveform':
      return handleWaveform(request, env, segments.slice(1), user)
    case 'compliance':
      return handleCompliance(request, env, segments.slice(1), user)
    case 'audit':
      return handleAudit(request, env, segments.slice(1), user)
    case 'users':
      return handleUsers(request, env, user)
    case 'configs':
      return handleConfigs(request, env)
    default:
      return json({ error: `Unknown API resource: ${resource}` }, 404)
  }
}

async function handleUsers(request, env, user) {
  if (!user || user.role !== 'admin') {
    return json({ error: '权限不足：仅系统管理员可管理用户' }, 403)
  }
  if (!env.DB) {
    return json({ data: MOCK_USERS })
  }
  const { results } = await env.DB.prepare(
    'SELECT id, username, email, real_name, role, department, status, created_at FROM users ORDER BY created_at',
  ).all()
  return json({ data: results })
}

async function handleConfigs(request, env) {
  if (!env.DB) {
    return json({
      data: [
        { key: 'FEATURE_AUTO_CALC_IDENTIFICATION', value: 'true' },
        { key: 'FEATURE_MIL_STD_704F_CHECK', value: 'true' },
      ],
    })
  }
  const { results } = await env.DB.prepare(
    'SELECT key, value, description FROM system_configs WHERE is_public = 1',
  ).all()
  return json({ data: results })
}

const MOCK_USERS = [
  { id: 'usr-admin-01', username: 'admin', email: 'admin@avic-sepc.com', real_name: '李德强', role: 'admin', department: '试验测试部', status: 'active' },
  { id: 'usr-tester-01', username: 'tester', email: 'tester@avic-sepc.com', real_name: '管子婧', role: 'vv_engineer', department: '适航验证中心', status: 'active' },
  { id: 'usr-auditor-01', username: 'auditor', email: 'auditor@avic-sepc.com', real_name: '李桐', role: 'auditor', department: '纪检审计处', status: 'active' },
]
