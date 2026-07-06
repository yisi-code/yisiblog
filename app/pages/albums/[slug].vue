<template>
  <PageShell v-if="album" width="wide" class="pt-page-top pb-page-bottom-loose">

    <div ref="backButtonStickyRef" class="z-2 absolute top-36 left-20">
      <ArticleBackButton />
    </div>

    <PageSection class="page-stack">
      <section class="w-full">
        <div class="detail-hero rounded-3xl" style="aspect-ratio: 16 / 9">
          <img
              v-if="albumCover"
              :src="albumCover"
              referrerpolicy="no-referrer"
              :alt="album.title"
          >
          <div class="detail-hero__overlay" aria-hidden="true"/>
          <div class="detail-hero__content">
            <h1 class="detail-heading__title">{{ album.title }}</h1>
            <p class="detail-heading__description">{{ album.description }}</p>
            <div class="detail-heading__meta">
              <span v-if="formatAlbumDate(album.date)" class="detail-heading__meta-item">{{
                  formatAlbumDate(album.date)
                }}</span>
              <span v-for="tag in album.tags || []" :key="tag" class="content-tag detail-heading__tag">#{{ tag }}</span>
            </div>
            <div class="detail-hero__badge">
              <span>共</span>
              <strong>{{ album.photos.length }}</strong>
              <span>张照片</span>
            </div>
          </div>
        </div>

        <AlbumPhotoMasonry
            :columns="photoColumns"
            :fallback-alt="album.title"
            @preview="openPreview"
        />
      </section>
    </PageSection>

    <ImagePreview
        v-if="preview"
        :images="preview.images"
        :index="preview.index"
        @update:index="preview.index = $event"
        @close="closePreview"
    />
  </PageShell>
</template>

<script setup lang="ts">
import type {PreviewImage} from '~/components/ui/ImagePreview.vue'
import {siteConfig, useAlbumData, type Photo} from '~/data'
import {formatDisplayDate} from '~/utils/dateFormat'
import {estimatePhotoMasonryHeight} from '~/utils/masonryEstimate'

type IndexedPhoto = Photo & {
  originalIndex: number
}

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const preview = ref<{ images: PreviewImage[]; index: number } | null>(null)
const backButtonStickyRef = ref<HTMLElement | null>(null)

const { data: album, status } = await useAlbumData(slug)
const albumCover = computed(() => album.value?.cover || album.value?.photos[0]?.url || '')
const indexedPhotos = computed<IndexedPhoto[]>(() => album.value?.photos.map((photo, index) => ({
  ...photo,
  originalIndex: index
})) || [])
const {masonryColumns: photoColumns} = useMasonryColumns({
  items: indexedPhotos,
  columnCount: 4,
  estimateHeight: estimatePhotoMasonryHeight
})

if (status.value === 'success' && !album.value) {
  throw createError({statusCode: 404, statusMessage: '未找到相册'})
}

useScrollSticky(backButtonStickyRef, {
  top: '7rem',
})

useHead(() => ({
  title: album.value?.title ? `${album.value.title} | ${siteConfig.authorName}` : siteConfig.authorName
}))

function openPreview(index: number) {
  if (!album.value) return

  preview.value = {
    images: album.value.photos.map((photo) => ({
      url: photo.url,
      description: photo.caption || album.value?.title || ''
    })),
    index
  }
}

function closePreview() {
  preview.value = null
}

function formatAlbumDate(date?: string) {
  return formatDisplayDate(date)
}

useHead(() => ({
  title: `${album?.value?.title || ''}：倚肆的小屋`
}))
</script>
