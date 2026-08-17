<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { Shield } from 'lucide-vue-next'
</script>

<template>
  <div class="relative min-h-[calc(100vh-40px)] overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      style="
        background-image: linear-gradient(rgba(54, 170, 245, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(54, 170, 245, 0.06) 1px, transparent 1px);
        background-size: 48px 48px;
      "
    />
    <div class="relative mx-auto flex min-h-[calc(100vh-40px)] max-w-lg flex-col justify-center px-4 py-10">
      <div class="mb-8 text-center">
        <div class="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-aviation-600/20 text-aviation-300 ring-1 ring-aviation-500/40">
          <Shield class="h-7 w-7" />
        </div>
        <h1 class="font-display text-3xl font-semibold tracking-wide text-white">
          115VAC 变频发电测试平台
        </h1>
        <p class="mt-2 text-sm text-slate-400">适航级 DO-178C 数字化验证 · 三员分立认证入口</p>
      </div>
      <div class="panel p-6">
        <RouterView />
      </div>
      <p class="mt-4 text-center text-xs text-slate-500">
        <RouterLink class="text-aviation-300 hover:underline" to="/auth/ca">CA 数字证书认证</RouterLink>
        · 项目编号 0730-2611010438/01
      </p>
    </div>
  </div>
</template>
