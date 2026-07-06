<template>
  <Transition name="page-loading">
    <div
      v-if="isPageLoading"
      class="page-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="页面加载中"
    >
      <div class="page-loading-overlay__panel">
        <span class="page-loading-overlay__spinner" aria-hidden="true" />
        <span class="page-loading-overlay__text">加载中...</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const isPageLoading = useState('page-loading', () => false)
</script>
