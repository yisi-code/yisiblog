<template>
  <PageShell title="博文" description="技术札记与日常记录" width="narrow" class="pt-page-top pb-page-bottom">
    <template #toolbar>
      <div class="page-search">
        <SearchBox
          v-model="searchQuery"
          placeholder="搜索博文关键词..."
          :show-dropdown="Boolean(searchQuery)"
          @search="openFirstPost"
        >
          <SearchResultList
            :items="searchResults"
            :query="searchQuery"
            empty-text="没有匹配的博文。"
          />
        </SearchBox>
      </div>
    </template>

    <PostToolbar
      v-model:selected-tag="selectedTag"
      v-model:view-mode="viewMode"
      :tags="tags"
      :all-tag="allTag"
      :all-count="posts.length"
    />

    <section v-if="displayPosts.length === 0" class="glass-panel empty-state empty-state-panel">
      <strong>{{ searchQuery ? '没有匹配的博文' : '暂无博文' }}</strong>
      <span>{{ searchQuery ? '可以换个关键词试试。' : '之后会在这里展示一些笔记感悟。' }}</span>
    </section>

    <PostCardGrid
      v-else-if="viewMode === 'card'"
      :posts="displayPosts"
    />

    <PostTimeline v-else :posts="displayPosts" />
  </PageShell>
</template>

<script setup lang="ts">
import { usePostsData, type SiteContentItem } from '~/data'
import { formatDisplayDate } from '~/utils/dateFormat'

const data = await usePostsData('posts-page')

const allTag = '全部'
const searchQuery = ref('')
const selectedTag = ref(allTag)
const viewModeCookie = useCookie<'timeline' | 'card'>('xhblogs-posts-view-mode', {
  default: () => 'timeline'
})
const viewMode = computed<'timeline' | 'card'>({
  get: () => viewModeCookie.value === 'card' ? 'card' : 'timeline',
  set: (value) => {
    viewModeCookie.value = value
  }
})

const posts = computed(() => data.value.map((item: SiteContentItem) => ({
  ...item,
  displayDate: formatPostDate(item.date),
  tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ['未分类']
})))

const tags = computed(() => {
  const counts = new Map<string, number>()
  posts.value.forEach((post) => {
    post.tags.forEach((tag: string) => counts.set(tag, (counts.get(tag) || 0) + 1))
  })

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const displayPosts = computed(() => {
  return posts.value.filter((post) => selectedTag.value === allTag || post.tags.includes(selectedTag.value))
})

const searchMatchedPosts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  return posts.value.filter((post) => {
    const tagText = post.tags.join(' ')
    return (
      (post.title || '').toLowerCase().includes(query) ||
      (post.description || '').toLowerCase().includes(query) ||
      tagText.toLowerCase().includes(query)
    )
  })
})

const searchResults = computed(() => searchMatchedPosts.value.map((post) => ({
  key: post.path,
  path: post.path,
  title: post.title || '未命名博文',
  description: post.description || '',
  date: formatPostDate(post.date),
  tags: post.tags
})))

function formatPostDate(date?: string) {
  return formatDisplayDate(date, '70-01-01')
}

function openFirstPost() {
  const first = searchResults.value[0]
  if (first?.path) navigateTo(first.path)
}

useHead(() => ({title: `博文：倚肆的小屋`}))
</script>
