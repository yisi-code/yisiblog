<template>
  <section class="content-masonry content-masonry--3">
    <div v-for="(column, columnIndex) in cardColumns" :key="columnIndex" class="content-masonry__column">
      <NuxtLink
        v-for="post in column"
        :key="post.path"
        :to="post.path"
        :title="post.title"
        class="glass-panel interactive-card group block min-w-0 overflow-hidden rounded-2xl no-underline transition hover:-translate-y-2"
      >
        <div v-if="post.cover" class="relative aspect-video overflow-hidden">
          <img
            :src="post.cover"
            referrerpolicy="no-referrer"
            :alt="post.title || ''"
            class="media-fill-cover"
            loading="lazy"
          >
          <span class="media-cover-chip">
            {{ post.displayDate }}
          </span>
        </div>
        <div class="min-w-0 p-card-inset">
          <div v-if="!post.cover" class="mb-stack-md">
            <span class="meta-pill">
              {{ post.displayDate }}
            </span>
          </div>
          <h2 class="line-clamp-2 text-title text-size-content-lead font-black leading-snug group-hover:text-accent-hover">
            {{ post.title || '未命名博文' }}
          </h2>
          <p class="text-secondary mt-stack-xs text-size-content-body leading-6 line-clamp-5">
            {{ post.description || '暂无简介。' }}
          </p>
          <div v-if="post.tags?.length" class="mt-stack-md flex flex-wrap gap-1.5">
            <span v-for="tag in post.tags || []" :key="tag" class="content-tag">#{{ tag }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
type PostListItem = {
  path: string
  title?: string
  description?: string
  cover?: string
  displayDate: string
  tags?: string[]
}

const props = defineProps<{
  posts: PostListItem[]
}>()

const { masonryColumns: cardColumns } = useMasonryColumns({
  items: () => props.posts,
  columnCount: 3,
  estimateHeight: estimatePostHeight
})

function estimatePostHeight(post: PostListItem) {
  const coverHeight = post.cover ? 10 : 0
  const baseContentHeight = 5.5
  const estimatedContentWidthPx = 320
  const averageTextCharWidthPx = 12
  const textCharsPerRow = Math.max(1, Math.floor(estimatedContentWidthPx / averageTextCharWidthPx))
  const titleRows = Math.ceil((post.title || '').length / textCharsPerRow)
  const descriptionRows = Math.ceil((post.description || '').length / textCharsPerRow)
  const tagRows = Math.ceil((post.tags?.length || 0) / 3)

  return coverHeight + baseContentHeight + titleRows * 1.1 + descriptionRows * 0.9 + tagRows * 1.2
}
</script>
