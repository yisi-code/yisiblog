<template>
  <section class="article-sidebar-card content-card-surface article-author-card">
    <div class="article-author-card__avatar">
      <img :src="avatarUrl" referrerpolicy="no-referrer" :alt="authorName">
    </div>
    <h2 class="article-author-card__name">{{ authorName }}</h2>
    <p class="article-author-card__bio">{{ bio }}</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  avatarUrl: string
  authorName: string
  bio: string
}>()
</script>
