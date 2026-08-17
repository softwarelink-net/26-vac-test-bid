<script setup>
import { RouterView } from 'vue-router'
import GlobalBanner from '@/components/GlobalBanner.vue'
</script>

<template>
  <GlobalBanner />
  <div class="layout-offset min-h-screen">
    <RouterView />
  </div>
</template>
