<template>
  <MDCRenderer
    v-if="body"
    class="content-prose"
    :body="body"
    :prose="false"
    tag="div"
  />
  <MDC
    v-else-if="source"
    class="content-prose"
    :value="source"
    tag="div"
  />
</template>

<script setup lang="ts">
import type { MDCRoot } from '@nuxtjs/mdc'

defineProps<{
  body?: MDCRoot
  source?: string
}>()
</script>
