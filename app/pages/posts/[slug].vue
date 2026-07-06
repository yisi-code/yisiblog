<template>
  <div v-if="data" class="article-detail-layout pt-page-top pb-page-bottom">

    <div ref="backButtonStickyRef" class="z-2 absolute top-36 left-20">
      <ArticleBackButton/>
    </div>

    <article class="article-shell content-card-surface">
      <div class="detail-hero">
        <img
            v-if="data.cover"
            :src="data.cover || ''"
            referrerpolicy="no-referrer"
            :alt="data.title || ''"
        >
        <div class="detail-hero__overlay" aria-hidden="true"/>
        <div class="detail-hero__content">
          <h1 class="detail-heading__title" :title="data.title">{{ data.title }}</h1>
          <p v-if="data.description" class="detail-heading__description" :title="data.description">{{ data.description }}</p>
          <div class="detail-heading__meta">
            <span v-for="tag in data.tags || []" :key="tag" class="content-tag detail-heading__tag">#{{ tag }}</span>
          </div>
          <div class="detail-hero__badge">
            <Clock :size="16" aria-hidden="true"/>
            <span>{{ data.date }}</span>
          </div>
        </div>
      </div>

      <div id="article-content" class="article-body user-select-text">
        <ContentRenderer
            class="content-prose"
            :value="data"
            :prose="false"
        />

        <ArticleComments/>
      </div>
    </article>

    <aside ref="sidebarRef" class="article-sidebar">
      <ArticleAuthorCard
          :avatar-url="siteConfig.avatarUrl"
          :author-name="siteConfig.authorName"
          :bio="siteConfig.bio"
      />

      <ArticleRecommendedList title="推荐阅读" :items="recentPosts"/>

      <ArticleToc :links="data.body?.toc?.links"/>
    </aside>
  </div>
</template>

<script setup lang="ts">
import {Clock} from '@lucide/vue'
import {siteConfig, usePostData, useRecentPosts} from '~/data'

const route = useRoute()
const slug = route.params.slug
const sidebarRef = ref<HTMLElement | null>(null)
const backButtonStickyRef = ref<HTMLElement | null>(null)

if (!slug) {
  throw createError({statusCode: 404, statusMessage: '未找到博文'})
}

const {data, status} = usePostData(slug)
const recentPosts = useRecentPosts(slug)

useAdaptiveSticky(sidebarRef)
useScrollSticky(backButtonStickyRef, {
  top: '7rem',
})

if (status.value === 'success' && !data.value) {
  throw createError({statusCode: 404, statusMessage: '未找到博文'})
}

useHead(() => ({
  title: `${data?.value?.title || ''}：倚肆的小屋`
}))

</script>
