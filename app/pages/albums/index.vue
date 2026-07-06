<template>
  <PageShell title="相册" description="刹那间绽放的芳华" width="wide" class="pt-page-top pb-page-bottom-loose">
    <template #toolbar>
      <div class="page-search">
        <SearchBox
            v-model="searchQuery"
            placeholder="搜索相册、照片关键字..."
            :show-dropdown="false"
            @search="commitSearch"
        />
      </div>
    </template>

    <PageSection spacing="lg" class="page-stack">
      <section v-if="activeQuery && matchedPhotos.length">
        <h3 class="album-block__title mb-stack-lg flex items-center gap-[0.65rem]">
          <span class="album-block__mark"/>
          匹配到照片 {{ matchedPhotos.length }}张 </h3>

        <AlbumPhotoMasonry
            :columns="matchedPhotoColumns"
            :query="activeQuery"
            show-album-name
            @preview="openPreview(matchedPhotos, $event)"
        />
      </section>

      <section v-if="activeQuery && matchedAlbums.length">
        <h3 class="album-block__title flex items-center gap-[0.65rem]">
          <span class="album-block__mark album-block__mark--secondary"/>
          匹配到相册 {{ matchedAlbums.length }} 个</h3>
      </section>

      <AlbumCardGrid v-if="matchedAlbums.length" :albums="matchedAlbums" :query="activeQuery"/>

      <section v-else-if="!isLoadingAlbums" class="glass-panel empty-state empty-state-panel">
        <strong>{{ searchQuery ? '没有匹配的相册' : '暂无相册' }}</strong>
        <span>{{ searchQuery ? '可以换个关键词试试。' : '之后会在这里展示定个瞬间。' }}</span>
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
import {useAlbumsData, type Photo} from '~/data'
import {estimatePhotoMasonryHeight} from '~/utils/masonryEstimate'

type MatchedPhoto = Photo & {
  albumId: string
  albumName: string
  originalIndex: number
}

const preview = ref<{ images: PreviewImage[]; index: number } | null>(null)
const searchQuery = ref('')
const activeQuery = ref('')
const { albums, pending: isLoadingAlbums } = await useAlbumsData()
let searchTimer: ReturnType<typeof setTimeout> | undefined

const matchedAlbums = computed(() => {
  if (!activeQuery.value) return albums.value

  return albums.value.filter((album) => {
    const tagText = (album.tags || []).join(' ')
    return (
        includesQuery(album.title) ||
        includesQuery(album.description || '') ||
        includesQuery(tagText)
    )
  })
})

const matchedPhotos = computed<MatchedPhoto[]>(() => {
  if (!activeQuery.value) return []

  return albums.value
      .flatMap((album) => album.photos.map((photo) => ({
        ...photo,
        albumId: album.id,
        albumName: album.title
      })))
      .filter((photo) => includesQuery(photo.caption || '') || includesQuery(photo.albumName))
      .map((photo, index) => ({...photo, originalIndex: index}))
})

const {masonryColumns: matchedPhotoColumns} = useMasonryColumns({
  items: matchedPhotos,
  columnCount: 4,
  estimateHeight: estimatePhotoMasonryHeight
})

watch(searchQuery, (value) => {
  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(() => {
    activeQuery.value = value.trim().toLowerCase()
  }, 250)
}, {immediate: true})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function includesQuery(value: string) {
  return value.toLowerCase().includes(activeQuery.value)
}

function commitSearch(value: string) {
  activeQuery.value = value.trim().toLowerCase()
}

function openPreview(photos: MatchedPhoto[], index: number) {
  preview.value = {
    images: photos.map((photo) => ({
      url: photo.url,
      description: [photo.albumName, photo.caption].filter(Boolean).join(' / ')
    })),
    index
  }
}

function closePreview() {
  preview.value = null
}

useHead(() => ({title: `相册：倚肆的小屋`}))

</script>
