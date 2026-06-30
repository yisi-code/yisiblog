<template>
  <section v-if="albums.length" class="album-card-grid content-grid content-grid--3">
    <NuxtLink
      v-for="album in albums"
      :key="album.id"
      :title="album.title"
      class="album-card group flex cursor-pointer flex-col items-center no-underline"
      :to="album.path"
    >
      <div class="relative mb-section-offset aspect-3/4 w-[85%] transform-gpu">
        <div class="album-card__sheet album-card__sheet--back absolute inset-0 overflow-hidden">
          <img
            v-if="album.cover ? album.photos[1] : album.photos[2]"
            :src="album.cover ? album.photos[1]?.url : album.photos[2]?.url"
            referrerpolicy="no-referrer"
            alt=""
            loading="lazy"
            class="media-fill-cover"
          >
        </div>
        <div class="album-card__sheet album-card__sheet--middle absolute inset-0 overflow-hidden">
          <img
            v-if="album.cover ? album.photos[0] : album.photos[1]"
            :src="album.cover ? album.photos[1]?.url : album.photos[2]?.url"
            referrerpolicy="no-referrer"
            alt=""
            loading="lazy"
            class="media-fill-cover"
          >
        </div>
        <div class="album-card__sheet album-card__sheet--front absolute inset-0 overflow-hidden">
          <img :src="albumCover(album)" referrerpolicy="no-referrer" :alt="album.title" loading="lazy" class="media-fill-cover">
          <div class="album-card__overlay absolute inset-0 flex flex-col justify-end p-card-inset">
            <strong>{{ album.photos.length }} 张照片</strong>
          </div>
        </div>
      </div>

      <div class="w-full px-content-inline text-center">
        <div class="album-card__head flex min-w-0 items-center justify-center gap-2">
          <h3 class="text-title min-w-0 line-clamp-1">
            <template v-for="(part, partIndex) in highlightParts(album.title)" :key="`${album.id}-title-${partIndex}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <span v-else>{{ part.text }}</span>
            </template>
          </h3>
          <span v-if="formatAlbumDate(album.date)" class="album-date shrink-0 text-size-meta-label font-bold">{{ formatAlbumDate(album.date) }}</span>
        </div>
        <p class="text-secondary line-clamp-1">
          <template v-for="(part, partIndex) in highlightParts(album.description)" :key="`${album.id}-description-${partIndex}`">
            <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
            <span v-else>{{ part.text }}</span>
          </template>
        </p>
        <div v-if="album.tags?.length" class="mt-stack-md flex flex-wrap justify-center gap-2">
          <span v-for="tag in album.tags" :key="tag" class="content-tag">
            #
            <template v-for="(part, partIndex) in highlightParts(tag)" :key="`${album.id}-${tag}-${partIndex}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <span v-else>{{ part.text }}</span>
            </template>
          </span>
        </div>
      </div>
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import type { Album } from '~/data'
import { formatDisplayDate } from '~/utils/dateFormat'
import { highlightSearchParts } from '~/utils/searchHighlight'

const props = withDefaults(defineProps<{
  albums: Album[]
  query?: string
}>(), {
  query: ''
})

function albumCover(album: Album) {
  return album.cover || album.photos[0]?.url || ''
}

function formatAlbumDate(date?: string) {
  return formatDisplayDate(date)
}

function highlightParts(value: string | undefined) {
  return highlightSearchParts(value, props.query)
}
</script>
