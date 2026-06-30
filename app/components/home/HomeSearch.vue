<template>
  <div class="mx-auto w-full max-w-2xl">
    <SearchBox
      v-model="query"
      placeholder="搜索标题、描述或标签..."
      :show-dropdown="Boolean(query)"
      @search="openFirstResult"
    >
      <SearchResultList
        :items="searchResults"
        :query="query"
        fallback-title="未命名"
        title-class="text-size-content-lead"
        description-class="line-clamp-2 text-size-content-body leading-relaxed"
        empty-class="flex flex-col items-center gap-3 px-panel-inline py-search-empty text-center"
      >
        <template #empty>
        <div class="empty-state-icon grid h-12 w-12 place-items-center rounded-full">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p class="text-secondary text-size-content-body font-bold">
          没有找到与 <span class="text-accent">{{ query }}</span> 相关的记录。
        </p>
        </template>
      </SearchResultList>
    </SearchBox>
  </div>
</template>

<script setup lang="ts">
import { formatDisplayDate } from '~/utils/dateFormat'

type SearchItem = {
  path: string
  title?: string
  description?: string
  tags?: string[]
  date?: string
  cover?: string
}

const props = defineProps<{
  items: SearchItem[]
}>()

const query = ref('')

const results = computed(() => {
  const value = query.value.toLowerCase()
  if (!value) return []

  return props.items.filter((post) => {
    const titleMatch = (post.title || '').toLowerCase().includes(value)
    const descMatch = (post.description || '').toLowerCase().includes(value)
    const tagMatch = (post.tags || []).some((tag) => tag.toLowerCase().includes(value))
    return titleMatch || descMatch || tagMatch
  })
})

const searchResults = computed(() => results.value.map((item) => ({
  key: item.path,
  path: item.path,
  title: item.title,
  description: item.description,
  date: shortDate(item.date),
  source: item.tags?.[0] || '',
  tags: item.tags?.slice(1) || []
})))

function shortDate(date?: string) {
  return formatDisplayDate(date)
}

function openFirstResult() {
  const first = results.value[0]
  if (first?.path) navigateTo(first.path)
}
</script>
