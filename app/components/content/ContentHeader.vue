<template>
  <section class="flow-root">
    <div>
      <p class="text-accent-eyebrow text-size-meta-label font-black uppercase tracking-[0.28em]">{{ title }}</p>
      <h2 class="text-title mt-stack-xs text-size-section-heading font-black md:text-size-section-heading-xl">{{ description }}</h2>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>
