<template>
  <section class="article-comments">
    <div class="article-comments__glow" aria-hidden="true" />
    <div class="article-comments__container">
      <GitalkComments :comment-path="commentPath" variant="article" />
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()

const commentPath = computed(() => route.path.replace(/^\/+|\/+$/g, '') || 'home')
</script>
