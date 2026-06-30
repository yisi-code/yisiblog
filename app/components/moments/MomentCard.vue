<template>
  <article class="moment-card p-card-inset content-card-surface hover:-translate-y-1">
    <header class="moment-card__header flex items-center gap-[0.9rem]">
      <img class="moment-card__avatar" :src="avatarUrl" :alt="authorName">
      <div class="flex min-w-0 flex-col gap-[0.2rem]">
        <strong class="text-title text-size-card-title">{{ authorName }}</strong>
        <span class="text-secondary text-size-content-body font-bold">{{ displayTime }}</span>
      </div>
    </header>

    <p class="moment-card__content">
      <template v-for="(part, partIndex) in highlightParts(contentText)" :key="`${item.path}-content-${partIndex}`">
        <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
        <span v-else>{{ part.text }}</span>
      </template>
    </p>

    <div v-if="images.length === 1" class="mt-stack-lg flex justify-center">
      <button type="button" class="moment-images__single relative max-w-[min(100%,18rem)] cursor-zoom-in overflow-hidden" @click="$emit('preview', images, 0)">
        <img :src="images[0]" alt="moment image" class="block max-h-[25rem] w-full object-contain">
      </button>
    </div>

    <div
      v-else-if="images.length > 1"
      class="mt-stack-lg grid w-[min(100%,20rem)] grid-cols-3 gap-2"
      :class="{ 'w-[min(100%,13rem)] grid-cols-2': images.length === 4 }"
    >
      <div
        v-for="(image, index) in visibleImages"
        :key="`${item.path}-${image}-${index}`"
        class="moment-images__cell relative aspect-square cursor-zoom-in overflow-hidden"
        @click="$emit('preview', images, index)"
      >
        <img
            :src="image"
            :alt="`动态图片${index}`"
            class="absolute inset-0 media-fill-cover">
        <div
            v-if="index === 8 && images.length > 9"
            class="moment-images__more absolute inset-0 h-full w-full flex items-center justify-center">
          +{{ images.length - 9 }}
        </div>
      </div>
    </div>

    <footer class="mt-stack-lg flex items-center justify-between gap-4">
      <span v-if="location" class="moment-location text-size-meta-label font-bold inline-flex min-w-0 items-center gap-[0.38rem]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 10c0 4.5-8 11-8 11s-8-6.5-8-11a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span class="overflow-hidden text-ellipsis whitespace-nowrap">
          <template v-for="(part, partIndex) in highlightParts(location)" :key="`${item.path}-location-${partIndex}`">
            <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
            <span v-else>{{ part.text }}</span>
          </template>
        </span>
      </span>

      <button
        type="button"
        class="moment-comment-button grid h-10 w-10 shrink-0 cursor-pointer place-items-center"
        :class="{ 'moment-comment-button--active': commentsOpen }"
        :aria-expanded="commentsOpen"
        @click="$emit('toggle-comments')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </svg>
      </button>
    </footer>

    <Transition name="moment-comments">
      <div v-if="commentsOpen" class="moment-comments">
        <MomentComments :moment-id="commentId" />
      </div>
    </Transition>
  </article>
</template>

<script setup lang="ts">
import type { SiteContentItem } from '~/data'
import { highlightSearchParts } from '~/utils/searchHighlight'

const props = withDefaults(defineProps<{
  item: SiteContentItem
  authorName: string
  avatarUrl: string
  contentText: string
  location: string
  images: string[]
  displayTime: string
  commentId: string
  commentsOpen?: boolean
  query?: string
}>(), {
  commentsOpen: false,
  query: ''
})

defineEmits<{
  preview: [images: string[], index: number]
  'toggle-comments': []
}>()

const visibleImages = computed(() => props.images.slice(0, 9))

function highlightParts(value: string | undefined) {
  return highlightSearchParts(value, props.query)
}
</script>
