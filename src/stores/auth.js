import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, setToken, getToken, localMocks } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(getToken())
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const role = computed(() => user.value?.role || null)

  function hasRole(roles) {
    if (!roles || !roles.length) return true
    return roles.includes(role.value)
  }

  async function login({ email, password, use_ca = false, ca_cert_serial = '' }) {
    loading.value = true
    try {
      let payload
      try {
        payload = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, use_ca, ca_cert_serial }),
        })
      } catch (e) {
        if (e.status === 401) throw e
        payload = await localMocks.login(email, password)
      }
      user.value = payload.data.user
      token.value = payload.data.token
      setToken(payload.data.token)
      return payload.data.user
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return null
    try {
      const res = await api('/auth/me')
      user.value = res.data
      return res.data
    } catch {
      // decode local demo token
      try {
        const raw = token.value.startsWith('vac.') ? token.value.slice(4) : token.value
        const payload = JSON.parse(atob(raw))
        const demoUsers = {
          'usr-admin-01': {
            id: 'usr-admin-01',
            email: 'admin@avic-sepc.com',
            username: 'admin',
            real_name: '李德强',
            role: 'admin',
            department: '试验测试部',
          },
          'usr-tester-01': {
            id: 'usr-tester-01',
            email: 'tester@avic-sepc.com',
            username: 'tester',
            real_name: '管子婧',
            role: 'vv_engineer',
            department: '适航验证中心',
          },
          'usr-auditor-01': {
            id: 'usr-auditor-01',
            email: 'auditor@avic-sepc.com',
            username: 'auditor',
            real_name: '李桐',
            role: 'auditor',
            department: '纪检审计处',
          },
        }
        user.value = demoUsers[payload.sub] || null
        return user.value
      } catch {
        logout()
        return null
      }
    }
  }

  function logout() {
    user.value = null
    token.value = null
    setToken(null)
    api('/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return { user, token, loading, isAuthenticated, role, hasRole, login, fetchMe, logout }
})
