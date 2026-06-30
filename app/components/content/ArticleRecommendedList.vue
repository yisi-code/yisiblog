<template>
  <section v-if="items.length" class="article-sidebar-card content-card-surface">
    <h3 class="article-sidebar-title">{{ title }}</h3>
    <div class="article-recommended">
      <NuxtLink
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        class="article-recommended__item group"
      >
        <h4>{{ item.title || fallbackTitle }}</h4>
        <p>{{ item.date }}</p>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
type RecommendedItem = {
  path: string
  title?: string
  date?: string
}

withDefaults(defineProps<{
  title: string
  items: RecommendedItem[]
  fallbackTitle?: string
}>(), {
  fallbackTitle: '未命名'
})
</script>
