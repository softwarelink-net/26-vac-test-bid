<script setup>
const REPO = 'https://github.com/softwarelink-net/26-vac-test-bid'
</script>

<template>
  <div class="global-source-banner" role="banner" aria-label="源码获取通栏">
    <span>
      获取网站源码，请访问：
      <a :href="REPO" target="_blank" rel="noopener noreferrer">{{ REPO }}</a>
      。
    </span>
  </div>
</template>
