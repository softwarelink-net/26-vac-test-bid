<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'
import { Shield, RefreshCw } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const challenge = ref('')
const serial = ref('AVIC-SEPC-115VAC')
const email = ref('admin@avic-sepc.com')
const password = ref('Admin@2026!Sec')
const message = ref('')
const error = ref('')

async function loadChallenge() {
  try {
    const res = await api('/auth/ca-challenge', { method: 'POST', body: '{}' })
    challenge.value = res.data.challenge
  } catch {
    challenge.value = 'AVIC-CA-CHALLENGE-DEMO01'
  }
}

async function verify() {
  error.value = ''
  message.value = ''
  try {
    await auth.login({
      email: email.value,
      password: password.value,
      use_ca: true,
      ca_cert_serial: serial.value,
    })
    message.value = 'CA 证书校验通过，会话已建立'
    setTimeout(() => router.replace('/'), 600)
  } catch (e) {
    error.value = e.message || 'CA 校验失败'
  }
}

onMounted(loadChallenge)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2 text-aviation-200">
      <Shield class="h-5 w-5" />
      <h2 class="font-semibold">CA 电子证书模拟校验</h2>
    </div>
    <p class="text-xs leading-relaxed text-slate-400">
      演示环境模拟航空企业 PKI：挑战码由服务端签发，证书序列号需以 <code class="text-aviation-300">AVIC-</code> 开头。
    </p>

    <div class="rounded-md border border-slate-700 bg-slate-950/60 p-3">
      <div class="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>Challenge Nonce</span>
        <button type="button" class="inline-flex items-center gap-1 text-aviation-300" @click="loadChallenge">
          <RefreshCw class="h-3 w-3" /> 刷新
        </button>
      </div>
      <code class="font-mono text-sm text-emerald-300">{{ challenge || '加载中…' }}</code>
    </div>

    <div>
      <label class="mb-1 block text-xs text-slate-400">绑定账号邮箱</label>
      <input v-model="email" class="input-field" />
    </div>
    <div>
      <label class="mb-1 block text-xs text-slate-400">账号密码</label>
      <input v-model="password" type="password" class="input-field" />
    </div>
    <div>
      <label class="mb-1 block text-xs text-slate-400">证书序列号</label>
      <input v-model="serial" class="input-field font-mono" />
    </div>

    <p v-if="error" class="text-sm text-rose-300">{{ error }}</p>
    <p v-if="message" class="text-sm text-emerald-300">{{ message }}</p>

    <button class="btn-primary w-full" @click="verify">校验并登录</button>
    <RouterLink to="/auth/login" class="block text-center text-xs text-aviation-300 hover:underline">返回密码登录</RouterLink>
  </div>
</template>
