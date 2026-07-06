<template>
  <PageShell v-if="data" class="pt-page-top pb-page-bottom-loose" width="narrow">
    <article class="about-card">
      <div class="about-card__cover">
        <img :src="data.cover || fallbackCover" alt="关于页封面">
        <div class="absolute -bottom-5 translate-y-50% w-full h-10 backdrop-blur-[2px]"/>
      </div>

      <div class="about-card__header">

        <div class="about-card__avatar">`
          <img :src="siteConfig.avatarUrl" :alt="siteConfig.authorName">
        </div>

        <div class="about-card__identity ml-media-gap">
          <p>你好呀，这里是 {{ siteConfig.authorName }}</p>
          <span> {{ `最后更新：${data.date}` }} </span>
        </div>

        <div class="flex-1 flex justify-end">
          <div class="segmented-control min-w-68" :class="{ 'segmented-control--right': activeTab === 'activity' }">
            <button
                type="button"
                class="segmented-control__button"
                :class="{ 'segmented-control__button--active': activeTab === 'intro' }"
                @click="setTab('intro')"
            >
              自我介绍
            </button>
            <button
                type="button"
                class="segmented-control__button"
                :class="{ 'segmented-control__button--active': activeTab === 'activity' }"
                @click="setTab('activity')"
            >
              数据动态
            </button>
          </div>
        </div>
      </div>

      <div class="about-card__body">

        <div class="about-card__divider" />

        <Transition name="about-panel" mode="out-in">
          <section v-if="activeTab === 'intro'" key="intro" class="about-panel user-select-text">
            <ArticleMarkdown :body="data.body" :source="data.bodyRaw" />
            <ArticleComments />
          </section>

          <section v-else key="activity" class="about-panel">
            <div class="about-heatmap">
              <h2 class="about-heatmap__title">
                <Activity :size="20" />
                过去一年 {{ activities.length }} 次更新
              </h2>

              <div class="about-heatmap__board">
                <div class="about-heatmap__days">
                  <span />
                  <span>周一</span>
                  <span />
                  <span>周三</span>
                  <span />
                  <span>周五</span>
                  <span />
                </div>

                <div ref="heatmapScrollRef" class="about-heatmap__scroll custom-scrollbar">
                  <div class="about-heatmap__inner">
                    <div class="about-heatmap__months">
                      <span v-for="week in weeks" :key="week[0]?.toISOString()">
                        {{ monthLabel(week) }}
                      </span>
                    </div>

                    <div class="about-heatmap__weeks">
                      <div v-for="week in weeks" :key="`days-${week[0]?.toISOString()}`" class="about-heatmap__week">
                        <span
                          v-for="day in week"
                          :key="day.toISOString()"
                          class="about-heatmap__cell"
                          :class="heatmapClass(activityMap[dateKey(day)] || 0)"
                          :title="`${dateKey(day)}: ${activityMap[dateKey(day)] || 0} 次更新`"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="about-heatmap__legend">
                <span>少</span>
                <i class="about-heatmap__cell about-heatmap__cell--0" />
                <i class="about-heatmap__cell about-heatmap__cell--1" />
                <i class="about-heatmap__cell about-heatmap__cell--2" />
                <i class="about-heatmap__cell about-heatmap__cell--3" />
                <i class="about-heatmap__cell about-heatmap__cell--4" />
                <span>多</span>
              </div>
            </div>

            <div v-if="activities.length" class="about-timeline">
              <NuxtLink
                v-for="activity in activities"
                :key="activity.id"
                :to="activity.targetUrl"
                class="about-timeline__item group"
              >
                <span class="about-timeline__dot" />
                <span class="about-timeline__content">
                  <span class="about-timeline__author">
                    <img :src="siteConfig.avatarUrl" :alt="siteConfig.authorName">
                    <span>
                      <strong>{{ siteConfig.authorName }}</strong>
                      <em :class="activity.typeClass">{{ activity.actionText }}</em>
                      <small>{{ activity.displayDate }}</small>
                    </span>
                  </span>

                  <span v-if="activity.type !== '说说'" class="about-timeline__title">
                    《{{ activity.title }}》
                  </span>

                  <time>{{ activity.displayDate }}</time>
                </span>
              </NuxtLink>
            </div>

            <div v-else class="about-timeline__empty">
              数据库中暂无活动记录...
            </div>
          </section>
        </Transition>
      </div>
    </article>
  </PageShell>
</template>

<script setup lang="ts">
import { Activity } from '@lucide/vue'
import { siteConfig, useAboutPage, useChattersData, useMomentsData, usePostsData, type SiteContentItem } from '~/data'

type AboutTab = 'intro' | 'activity'
type ActivityType = '博文' | '杂谈' | '说说'

type ActivityRecord = {
  id: string
  type: ActivityType
  title: string
  date: Date
  displayDate: string
  targetUrl: string
  actionText: string
  typeClass: string
}

const route = useRoute()
const router = useRouter()
const { data} = await useAboutPage()
const { items: posts } = await usePostsData('about-posts')
const { items: chatters } = await useChattersData('about-chatters')
const { items: moments } = await useMomentsData('about-moments')

const fallbackCover = 'https://bu.dusays.com/2026/03/24/69c23dc278c78.jpg'
const heatmapScrollRef = ref<HTMLElement | null>(null)

const activeTab = computed<AboutTab>(() => route.query.tab === 'activity' ? 'activity' : 'intro')

const activities = computed<ActivityRecord[]>(() => [
  ...posts.value.map((item) => toActivity(item, '博文')),
  ...chatters.value.map((item) => toActivity(item, '杂谈')),
  ...moments.value.map((item) => toActivity(item, '说说'))
].sort((a, b) => b.date.getTime() - a.date.getTime()))

const weeks = computed(() => {
  const today = new Date()
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 364)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const result: Date[][] = []
  let currentWeek: Date[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    currentWeek.push(new Date(current))
    if (currentWeek.length === 7) {
      result.push(currentWeek)
      currentWeek = []
    }
    current.setDate(current.getDate() + 1)
  }

  if (currentWeek.length) result.push(currentWeek)
  return result
})

const activityMap = computed(() => {
  const map: Record<string, number> = {}
  activities.value.forEach((activity) => {
    const key = dateKey(activity.date)
    map[key] = (map[key] || 0) + 1
  })
  return map
})

function setTab(tab: AboutTab) {
  router.push({ path: route.path, query: tab === 'activity' ? { tab } : {} })
}

function toActivity(item: SiteContentItem, type: ActivityType): ActivityRecord {
  const date = parseDate(item.date)
  const isMoment = type === '说说'
  return {
    id: `${type}-${item.path}-${item.date || ''}`,
    type,
    title: item.title || '未命名记录',
    date,
    displayDate: formatDateTime(date),
    targetUrl: isMoment ? '/moments' : item.path,
    actionText: isMoment ? '发布了 说说' : `更新了 ${type}`,
    typeClass: type === '博文' ? 'about-timeline__type--post' : type === '杂谈' ? 'about-timeline__type--chatter' : 'about-timeline__type--moment'
  }
}

function parseDate(value?: string) {
  if (!value) return new Date(0)
  const normalized = value.replace(/^(\d{2})-/, '20$1-')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateTime(date: Date) {
  if (date.getTime() === 0) return '1970-01-01 00:00'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function heatmapClass(count: number) {
  if (count <= 0) return 'about-heatmap__cell--0'
  if (count === 1) return 'about-heatmap__cell--1'
  if (count === 2) return 'about-heatmap__cell--2'
  if (count === 3) return 'about-heatmap__cell--3'
  return 'about-heatmap__cell--4'
}

function monthLabel(week: Date[]) {
  const firstDay = week[0]
  if (!firstDay || firstDay.getDate() > 7) return ''
  return firstDay.toLocaleString('en-US', { month: 'short' })
}

function scrollHeatmapToEnd() {
  if (!import.meta.client) return
  nextTick(() => {
    if (!heatmapScrollRef.value) return
    heatmapScrollRef.value.scrollLeft = heatmapScrollRef.value.scrollWidth
  })
}

watch(activeTab, (tab) => {
  if (tab === 'activity') scrollHeatmapToEnd()
}, { immediate: true })

useHead(() => ({
  title: `关于：倚肆的小屋`
}))
</script>
