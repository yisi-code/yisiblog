<template>
  <div class="content-masonry content-masonry--4">
    <div
        v-for="(column, columnIndex) in columns"
        :key="columnIndex"
        class="content-masonry__column">
      <figure
        v-for="photo in column"
        :key="photoKey(photo)"
        class="album-photo-card content-card-surface relative cursor-zoom-in overflow-hidden"
        @click="$emit('preview', photo.originalIndex)"
      >
        <img :src="photo.url" referrerpolicy="no-referrer" :alt="photo.caption || photo.albumName || fallbackAlt" loading="lazy" class="block h-auto w-full object-cover">
        <figcaption v-if="photo.caption || (showAlbumName && photo.albumName)" class="album-photo-card__caption absolute inset-0 flex flex-col justify-end gap-[0.3rem] p-content-inset">
          <h3 v-if="showAlbumName && photo.albumName" class="album-photo-card__album-name line-clamp-1">
            <template v-for="(part, partIndex) in highlightParts(photo.albumName)" :key="`${photoKey(photo)}-album-${partIndex}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
          </h3>
          <strong v-if="photo.caption">
            <template v-for="(part, partIndex) in highlightParts(photo.caption)" :key="`${photoKey(photo)}-caption-${partIndex}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
          </strong>
        </figcaption>
      </figure>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Photo } from '~/data'
import { highlightSearchParts } from '~/utils/searchHighlight'

type AlbumPhotoMasonryItem = Photo & {
  albumId?: string
  albumName?: string
  originalIndex: number
}

const props = withDefaults(defineProps<{
  columns: AlbumPhotoMasonryItem[][]
  query?: string
  showAlbumName?: boolean
  fallbackAlt?: string
}>(), {
  query: '',
  showAlbumName: false,
  fallbackAlt: ''
})

defineEmits<{
  preview: [index: number]
}>()

function photoKey(photo: AlbumPhotoMasonryItem) {
  return `${photo.albumId || 'album'}-${photo.url}-${photo.originalIndex}`
}

function highlightParts(value: string | undefined) {
  return highlightSearchParts(value, props.query)
}
</script>
