import { json } from '../_utils.js'

const MOCK_LOGS = [
  {
    id: 'aud-001',
    user_id: 'usr-admin-01',
    user_name: '李德强',
    action: 'LOGIN_SUCCESS',
    target_module: 'auth',
    ip_address: '10.12.8.21',
    details: '管理员登录系统控制台',
    security_level: 'CONFIDENTIAL',
    created_at: '2026-08-16T08:01:12Z',
  },
  {
    id: 'aud-002',
    user_id: 'usr-tester-01',
    user_name: '管子婧',
    action: 'EXPORT_EVIDENCE_PACK',
    target_module: 'compliance',
    ip_address: '10.12.8.45',
    details: '导出 DO-178C 适航审核证据包 v1.2',
    security_level: 'SECRET',
    created_at: '2026-08-16T09:22:40Z',
  },
  {
    id: 'aud-003',
    user_id: 'usr-dev-01',
    user_name: '王启明',
    action: 'RUN_IDENTIFICATION',
    target_module: 'identification',
    ip_address: '10.12.9.12',
    details: '执行 VF-AC-GCU-A01 参数辨识拟合',
    security_level: 'CONFIDENTIAL',
    created_at: '2026-08-16T10:05:18Z',
  },
  {
    id: 'aud-004',
    user_id: 'usr-auditor-01',
    user_name: '李桐',
    action: 'VIEW_AUDIT_STREAM',
    target_module: 'audit',
    ip_address: '10.12.1.8',
    details: '审计员查阅不可篡改日志流',
    security_level: 'SECRET',
    created_at: '2026-08-16T11:30:00Z',
  },
  {
    id: 'aud-005',
    user_id: 'usr-tester-01',
    user_name: '管子婧',
    action: 'EXECUTE_TEST_SEQ',
    target_module: 'test-bench',
    ip_address: '10.12.8.45',
    details: '执行回归序列 REG-360-800-BATCH',
    security_level: 'CONFIDENTIAL',
    created_at: '2026-08-16T13:44:22Z',
  },
]

export async function handleAudit(request, env, segments, user) {
  if (request.method !== 'GET') {
    return json({ error: '审计日志流只读，禁止篡改' }, 405)
  }

  // Auditor has CRUD on audit module per RBAC — CRUD here means manage/view/export; writes are system-only
  if (user && !['admin', 'auditor', 'vv_engineer', 'dev_engineer'].includes(user.role)) {
    return json({ error: '无权访问审计日志' }, 403)
  }

  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        `SELECT a.*, u.real_name as user_name
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC
         LIMIT 200`,
      ).all()
      if (results?.length) return json({ data: results, immutable: true })
    } catch (_) {
      /* mock */
    }
  }

  return json({ data: MOCK_LOGS, immutable: true })
}
