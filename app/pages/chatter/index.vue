<template>
  <PageShell title="杂谈" description="日常·灵光一现" width="wide" class="pt-page-top pb-page-bottom">
    <template #toolbar>
      <div class="page-search">
        <SearchBox
            v-model="searchQuery"
            placeholder="搜索杂谈关键词..."
            :show-dropdown="Boolean(searchQuery)"
            @search="openFirstChatter"
        >
          <SearchResultList
              :items="searchResults"
              :query="searchQuery"
              empty-text="没有匹配的杂谈记录。"
          />
        </SearchBox>
      </div>
    </template>

    <PageSection spacing="md"  class="page-filter-bar">
      <div class="page-filter-bar__items">
        <button
            v-for="tag in tags"
            :key="tag.name"
            type="button"
            class="filter-pill"
            :class="activeTag === tag.name ? 'filter-pill-active shadow-md' : 'filter-pill-inactive'"
            @click="activeTag = tag.name"
        >
          {{ tag.name }}
          <span class="ml-inline-gap-2xs opacity-60">{{ tag.count }}</span>
        </button>
      </div>
    </PageSection>

    <section v-if="displayChatters.length" class="content-masonry content-masonry--3">
      <div
          v-for="(column, columnIndex) in chatterColumns"
          :key="columnIndex"
          class="content-masonry__column">
        <article
            v-for="chatter in column"
            :key="chatter.path"
            class="min-w-0 transition hover:-translate-y-2">
          <NuxtLink
              :to="chatter.path"
              :title="chatter.title"
              class="chatter-card content-card-surface group block overflow-hidden rounded-3xl">
            <div v-if="chatter.cover" class="relative aspect-video overflow-hidden">
              <img class="media-fill-cover" :src="chatter.cover" :alt="chatter.title || ''" loading="lazy">
              <span class="media-cover-chip">
                {{ chatter.date }}
              </span>
            </div>

            <div class="p-card-inset">
              <h2 class="text-title line-clamp-2 text-size-content-lead font-black group-hover:text-accent-hover">
                {{ chatter.title || '未命名记录' }}
              </h2>
              <p class="text-secondary mt-stack-xs line-clamp-2 text-size-content-body leading-6">
                {{ chatter.description || chatterText(chatter) }}
              </p>

              <div v-if="chatter.tags?.length" class="mt-stack-md flex items-center flex-wrap gap-1.5">
                <span
                    v-if="chatterMood(chatter)"
                    class="content-tag">
                  <Sparkles :size="14" aria-hidden="true"/>
                  {{ chatterMood(chatter) }}
                </span>

                <span
                    v-for="tag in chatter.tags"
                    :key="tag"
                    class="content-tag"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
    </section>

    <section v-else class="glass-panel empty-state empty-state-panel">
      <strong>{{ searchQuery ? '没有匹配的杂谈' : '暂无杂谈' }}</strong>
      <span>{{ searchQuery ? '可以换个关键词试试。' : '之后会在这里展示一些随笔。' }}</span>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import {extractContentText, useChattersData, type SiteContentItem} from '~/data'
import {Sparkles} from "@lucide/vue";

const items = useChattersData('chatters-list')
const allTag = '全部'
const searchQuery = ref('')
const activeTag = ref(allTag)

const tags = computed(() => {
  const counts = new Map<string, number>()
  items.value.forEach((item) => {
    item.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  })

  return [
    {name: allTag, count: items.value.length},
    ...Array.from(counts.entries())
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => b.count - a.count)
  ]
})

const displayChatters = computed(() => {
  return items.value.filter((item) => activeTag.value === allTag || item.tags?.includes(activeTag.value))
})

const {masonryColumns: chatterColumns} = useMasonryColumns({
  items: displayChatters,
  columnCount: 3,
  estimateHeight: estimateChatterHeight
})

const searchMatchedChatters = computed(() => {
  if (searchQuery.value.length > 0 && searchQuery.value.trim() === '') return []

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  return items.value.filter((item) => {
    const text = chatterText(item)
    const tagText = (item.tags || []).join(' ')
    return (
        (item.title || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        text.toLowerCase().includes(query) ||
        tagText.toLowerCase().includes(query)
    )
  })
})

const searchResults = computed(() => searchMatchedChatters.value.map((chatter) => ({
  key: chatter.path,
  path: chatter.path,
  title: chatter.title || '未命名记录',
  description: chatter.description || chatterText(chatter) || '',
  date: chatter.date,
  tags: chatter.tags
})))

function chatterMood(item: SiteContentItem) {
  return item.mood || ''
}

function chatterText(item: SiteContentItem) {
  return extractContentText(item)
}

function estimateChatterHeight(item: SiteContentItem) {
  const coverHeight = item.cover ? 10 : 0
  const baseContentHeight = 5
  const text = `${item.title || ''}${chatterText(item) || item.description || ''}`
  const textRows = Math.ceil(text.length / 28)
  const tagRows = Math.ceil((item.tags?.length || 0) / 3)

  return coverHeight + baseContentHeight + textRows * 0.8 + tagRows * 1.1
}

function openFirstChatter() {
  const first = searchResults.value[0]
  if (first?.path) navigateTo(first.path)
}

useHead(() => ({title: `杂谈：倚肆的小屋`}))
</script>
