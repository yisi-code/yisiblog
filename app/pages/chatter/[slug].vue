<template>
  <div v-if="data" class="article-detail-layout pt-page-top pb-page-bottom">

    <div ref="backButtonStickyRef" class="z-2 absolute top-36 left-20">
      <ArticleBackButton />
    </div>

    <article class="article-shell chatter-detail-shell content-card-surface">
      <div class="detail-hero">
        <img v-if="data.cover" :src="data.cover" :alt="data.title || ''">
        <div class="detail-hero__overlay" aria-hidden="true" />
        <div class="detail-hero__content">
          <h1 class="detail-heading__title">{{ data.title || '杂谈记录' }}</h1>
          <p v-if="data.description" class="detail-heading__description">{{ data.description }}</p>
          <div class="detail-heading__meta">
            <span v-if="mood" class="detail-heading__meta-item detail-heading__meta-item--mood text-size-content-body font-bold">
              <Sparkles :size="16" aria-hidden="true" />
              {{ mood }}
            </span>
            <span v-for="tag in data.tags || []" :key="tag" class="content-tag detail-heading__tag">#{{ tag }}</span>
          </div>
          <div class="detail-hero__badge">
            <Clock :size="16" aria-hidden="true" />
            <span>{{ data.date }}</span>
          </div>
        </div>
      </div>

      <div class="article-body user-select-text">
        <ArticleMarkdown :body="data.body" :source="data.bodyRaw" />

        <ArticleComments />
      </div>
    </article>

    <aside ref="sidebarRef" class="article-sidebar">
      <ArticleAuthorCard
        :avatar-url="siteConfig.avatarUrl"
        :author-name="siteConfig.authorName"
        :bio="siteConfig.bio"
      />

      <section class="article-sidebar-card content-card-surface">
        <div class="chatter-calendar__head">
          <h3>{{ calendarTitle }}</h3>
        </div>
        <div class="chatter-calendar__week">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>
        <div class="chatter-calendar__grid">
          <span
            v-for="(day, index) in calendarDays"
            :key="`${day || 'blank'}-${index}`"
            class="chatter-calendar__day"
            :class="{ 'chatter-calendar__day--active': day === calendarDate.day }"
          >
            {{ day || '' }}
          </span>
        </div>
      </section>

      <ArticleRecommendedList
        title="最近记录"
        :items="recentChatters"
        fallback-title="杂谈记录"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Clock, Sparkles } from '@lucide/vue'
import { siteConfig, useChatterData, useRecentChatters } from '~/data'

const route = useRoute()
const slug = route.params.slug
const sidebarRef = ref<HTMLElement | null>(null)
const backButtonStickyRef = ref<HTMLElement | null>(null)

if (!slug) {
  throw createError({ statusCode: 404, statusMessage: '未找到杂谈' })
}

const { data, status } = await useChatterData(slug)
const { items: recentChatters } = await useRecentChatters(slug)

if (status.value === 'success' && !data.value) {
  throw createError({ statusCode: 404, statusMessage: '未找到杂谈' })
}

useAdaptiveSticky(sidebarRef)
useScrollSticky(backButtonStickyRef, {
  top: '7rem',
})

const mood = computed(() => {
  return data.value?.mood || ''
})

const calendarDate = computed(() => {
  const rawDate = data.value?.date || ''
  const parsed = new Date(rawDate)
  const fallback = new Date()
  const date = Number.isNaN(parsed.getTime()) ? fallback : parsed
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  }
})

const calendarTitle = computed(() => `${calendarDate.value.year}-${String(calendarDate.value.month).padStart(2, '0')}`)
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const calendarDays = computed(() => {
  const { year, month } = calendarDate.value
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDay = firstDay === 0 ? 6 : firstDay - 1
  return [
    ...Array.from({ length: startDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ]
})

useHead(() => ({
  title: `${data?.value?.title || ''}：倚肆的小屋`
}))
</script>
