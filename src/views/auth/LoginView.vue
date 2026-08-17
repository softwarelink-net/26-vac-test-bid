<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { KeyRound, Loader2 } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('admin@avic-sepc.com')
const password = ref('Admin@2026!Sec')
const error = ref('')
const useCa = ref(false)
const caSerial = ref('AVIC-DEMO-2026')

async function submit() {
  error.value = ''
  try {
    await auth.login({
      email: email.value,
      password: password.value,
      use_ca: useCa.value,
      ca_cert_serial: caSerial.value,
    })
    router.replace(route.query.redirect || '/')
  } catch (e) {
    error.value = e.message || '登录失败'
  }
}

function fill(role) {
  const presets = {
    admin: ['admin@avic-sepc.com', 'Admin@2026!Sec'],
    tester: ['tester@avic-sepc.com', 'Tester@2026!Sec'],
    auditor: ['auditor@avic-sepc.com', 'Auditor@2026!Sec'],
  }
  ;[email.value, password.value] = presets[role]
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="mb-1 block text-xs text-slate-400">工作邮箱</label>
      <input v-model="email" type="email" class="input-field" required autocomplete="username" />
    </div>
    <div>
      <label class="mb-1 block text-xs text-slate-400">密码</label>
      <input v-model="password" type="password" class="input-field" required autocomplete="current-password" />
    </div>

    <label class="flex items-center gap-2 text-sm text-slate-300">
      <input v-model="useCa" type="checkbox" class="rounded border-slate-600 bg-slate-900" />
      启用 CA 电子证书双因子
    </label>

    <div v-if="useCa">
      <label class="mb-1 block text-xs text-slate-400">证书序列号</label>
      <input v-model="caSerial" class="input-field font-mono" placeholder="AVIC-XXXX" />
    </div>

    <p v-if="error" class="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{{ error }}</p>

    <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
      <Loader2 v-if="auth.loading" class="h-4 w-4 animate-spin" />
      <KeyRound v-else class="h-4 w-4" />
      登录控制台
    </button>

    <div class="flex flex-wrap gap-2 pt-1">
      <button type="button" class="btn-ghost !py-1 text-xs" @click="fill('admin')">管理员</button>
      <button type="button" class="btn-ghost !py-1 text-xs" @click="fill('tester')">适航验证</button>
      <button type="button" class="btn-ghost !py-1 text-xs" @click="fill('auditor')">审计员</button>
    </div>

    <p class="text-center text-xs text-slate-500">
      或前往
      <RouterLink to="/auth/ca" class="text-aviation-300 hover:underline">数字证书 CA 认证面板</RouterLink>
    </p>
  </form>
</template>
