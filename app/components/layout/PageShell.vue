<template>
  <div class="page-shell" :class="`page-shell--${width}`">
    <div class="page-shell-toolbar">
      <ContentHeader :title="title" :description="description" />
      <slot name="toolbar"/>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  width?: 'default' | 'narrow' | 'wide'
}>(), {
  title: '',
  description: '',
  width: 'default'
})
</script>
