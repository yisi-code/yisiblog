<template>
  <button
      type="button"
      class="article-back-button group cursor-pointer"
      @click="goBack"
  >
    <span class="article-back-button__icon-wrap">
      <ChevronLeft class="article-back-button__icon" :size="26" aria-hidden="true"/>
      <span class="article-back-button__label">{{ label }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import {ChevronLeft} from '@lucide/vue'

const props = withDefaults(defineProps<{
  fallback?: string
  label?: string
}>(), {
  fallback: '/',
  label: '返回',
})

const router = useRouter()

function goBack() {
  if (import.meta.client) {
    // 浏览器历史记录长度 > 1 说明有上一页，可以后退
    if (window.history.length > 1) {
      router.back()
    } else {
      // 否则直接跳转到 fallback（首页）
      router.push(props.fallback)
    }
  } else {
    // 服务端渲染时直接跳转 fallback
    router.push(props.fallback)
  }
}
</script>
