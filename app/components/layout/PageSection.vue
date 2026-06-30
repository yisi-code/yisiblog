<template>
  <section class="page-section" :class="[`page-section--${spacing}`, gridClass]">
    <slot />
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  columns?: 1 | 2 | 3
}>(), {
  spacing: 'none',
  columns: 1
})

const gridClass = computed(() => props.columns > 1 ? `page-section--grid-${props.columns}` : '')
</script>
