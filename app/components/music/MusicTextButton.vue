<template>
  <button type="button" class="music-text-button" :title="title || text">
    <span class="music-text-button__text" :class="{ 'music-text-button__text--multiline': multiline }">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
  title?: string
  multiline?: boolean
}>()
</script>
