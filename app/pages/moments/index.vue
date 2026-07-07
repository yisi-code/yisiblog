<template>
  <PageShell title="动态" description="生活碎片与即时笔记" width="wide" class="pt-page-top pb-page-bottom">
    <template #toolbar>
      <div class="page-search">
        <SearchBox v-model="searchQuery" placeholder="搜索动态关键字..."/>
      </div>
    </template>

    <PageSection spacing="md" class="page-stack">
      <div class="page-actions">
        <div class="segmented-control w-[min(100%,18rem)]" :class="{ 'segmented-control--right': sortOrder === 'asc' }">
          <button
              type="button"
              class="segmented-control__button"
              :class="{ 'segmented-control__button--active': sortOrder === 'desc' }"
              @click="sortOrder = 'desc'"
          >
            现在
          </button>
          <button
              type="button"
              class="segmented-control__button"
              :class="{ 'segmented-control__button--active': sortOrder === 'asc' }"
              @click="sortOrder = 'asc'"
          >
            过去
          </button>
        </div>
      </div>

      <div
          v-if="filteredColumns[0]?.length || filteredColumns[1]?.length"
          class="content-masonry content-masonry--2 content-masonry--spacious">
        <div
            v-for="(column, columnIndex) in filteredColumns"
            :key="columnIndex"
            class="content-masonry__column">
          <MomentCard
              v-for="item in column"
              :key="item.path"
              :item="item"
              :author-name="siteConfig.authorName"
              :avatar-url="siteConfig.avatarUrl"
              :content-text="momentText(item)"
              :location="momentLocation(item)"
              :images="momentImages(item)"
              :display-time="timeAgo(item.rawDate)"
              :comment-id="momentCommentId(item)"
              :comments-open="openCommentId === momentCommentId(item)"
              :query="searchQuery"
              @preview="openLightbox"
              @toggle-comments="toggleComment(momentCommentId(item))"
          />
        </div>
      </div>

      <div v-else-if="!isLoadingMoments" class="glass-panel empty-state empty-state-panel">
        <strong>{{ searchQuery ? '没有匹配的动态' : '暂无动态' }}</strong>
        <span>{{ searchQuery ? '可以换个关键词试试。' : '之后会在这里展示生活碎片。' }}</span>
      </div>
    </PageSection>

    <ImagePreview
        v-if="lightbox"
        :images="lightbox.images"
        :index="lightbox.index"
        @update:index="lightbox.index = $event"
        @close="closeLightbox"
    />
  </PageShell>
</template>

<script setup lang="ts">
import type { PreviewImage } from '~/components/ui/ImagePreview.vue'
import { siteConfig, useMomentsData, type SiteContentItem } from '~/data'

type MomentViewItem = SiteContentItem & {
  rawDate?: string
}

const { items: moments, pending: isLoadingMoments } = await useMomentsData('moments-list')
const searchQuery = ref('')
const sortOrder = ref<'desc' | 'asc'>('desc')
const openCommentId = ref<string | null>(null)
const lightbox = ref<{ images: PreviewImage[]; index: number } | null>(null)

const normalizedMoments = computed<MomentViewItem[]>(() => moments.value.map((item) => ({
  ...item,
  rawDate: rawDateFromItem(item)
})))

const filteredMoments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const result = normalizedMoments.value.filter((item) => {
    if (!query) return true
    return [
      momentText(item),
      momentLocation(item)
    ].filter(Boolean).join(' ').toLowerCase().includes(query)
  })

  return result.sort((a, b) => {
    const timeA = new Date(a.rawDate || a.date || '').getTime()
    const timeB = new Date(b.rawDate || b.date || '').getTime()
    const safeA = Number.isFinite(timeA) ? timeA : 0
    const safeB = Number.isFinite(timeB) ? timeB : 0
    return sortOrder.value === 'desc' ? safeB - safeA : safeA - safeB
  })
})

const { masonryColumns: filteredColumns } = useMasonryColumns({
  items: filteredMoments,
  columnCount: 2,
  estimateHeight: estimateMomentHeight
})

function rawDateFromItem(item: SiteContentItem) {
  const idTime = String(item.id || '').match(/moment-(\d+)/)?.[1]
  if (idTime) return new Date(Number(idTime)).toISOString()
  return item.date
}

function momentText(item: SiteContentItem) {
  return item.description || ''
}

function momentLocation(item: SiteContentItem) {
  return item.location || ''
}

function momentImages(item: SiteContentItem) {
  return Array.isArray(item.images) ? item.images.filter((image): image is string => typeof image === 'string' && Boolean(image)) : []
}

function estimateMomentHeight(item: SiteContentItem) {
  // 单位：rem，用于估算头像、作者、间距、内边距、评论按钮等固定区域。
  const baseCardHeight = 4.5
  // 单位：px，按双列卡片的正文可用宽度粗略估算。
  const estimatedContentWidthPx = 420
  // 单位：px，中文正文 0.96rem 字号下单个字符的平均占位宽度。
  const averageTextCharWidthPx = 12
  // 单位：字符/行，由估算内容宽度和平均字符宽度换算得到。
  const textCharsPerRow = Math.max(1, Math.floor(estimatedContentWidthPx / averageTextCharWidthPx))
  // 单位：rem，正文每行高度权重。
  const textRowHeight = 0.85
  // 单位：rem，单图预览高度权重。
  const singleImageHeight = 4
  // 单位：rem，多图网格每行高度权重。
  const imageGridRowHeight = 2.6
  // 单位：rem，地点胶囊高度权重。
  const locationRowHeight = 0.7
  // 单位：张，动态页最多展示 9 张预览图。
  const maxPreviewImageCount = 9
  // 单位：列，多图网格固定为 3 列。
  const imageGridColumnCount = 3

  const textLength = momentText(item).length
  const imageCount = momentImages(item).length
  const textRows = Math.ceil(textLength / textCharsPerRow)
  const visibleImageCount = Math.min(imageCount, maxPreviewImageCount)
  const imageRows = imageCount === 0 ? 0 : imageCount === 1 ? singleImageHeight : Math.ceil(visibleImageCount / imageGridColumnCount) * imageGridRowHeight
  const locationHeight = momentLocation(item) ? locationRowHeight : 0

  return baseCardHeight + textRows * textRowHeight + imageRows + locationHeight
}

function momentCommentId(item: SiteContentItem) {
  return item.id || item.path.replace(/^\/?moments\/?/, '')
}

function timeAgo(dateText?: string) {
  if (!dateText) return ''
  const date = new Date(dateText)
  const timestamp = date.getTime()
  if (!Number.isFinite(timestamp)) return dateText

  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSeconds >= 0 && diffSeconds < 60) return 'Just now'
  if (diffSeconds >= 0 && diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`
  if (diffSeconds >= 0 && diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function toggleComment(id: string) {
  openCommentId.value = openCommentId.value === id ? null : id
}

function openLightbox(images: string[], index: number) {
  lightbox.value = {
    images: images.map((url) => ({url})),
    index
  }
}

function closeLightbox() {
  lightbox.value = null
}

useHead(() => ({title: `动态：倚肆的小屋`}))

</script>
