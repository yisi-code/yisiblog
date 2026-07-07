<template>
  <div class="flex flex-col gap-6 pt-page-top pb-page-bottom items-center">
    <HomeSearch :items="homeSearchItems" class="hover:scale-[1.02] z-10"/>
    <HomeMusicOverview :stats="stats"/>
    <HomeContentGrid
        v-if="hasHomeContent"
        :latest-album="latestAlbum"
        :latest-chatters="latestChatters"
        :latest-posts="latestPosts"
        :latest-moment-card="latestMomentCard"
    />
    <section v-else class="glass-panel empty-state empty-state-panel w-full">
      <strong>{{ isLoadingHomeData ? '正在加载内容...' : '暂无内容' }}</strong>
      <span>{{ isLoadingHomeData ? '正在读取静态内容数据。' : '请稍后再试。' }}</span>
    </section>
    <SiteDashboard/>
  </div>
</template>

<script setup lang="ts">
import {
  siteConfig,
  useHomePageData
} from '~/data'
import {
  buildHomeSearchItems,
  buildHomeStats,
  buildLatestAlbum,
  buildLatestChatters,
  buildLatestMomentCard,
  buildLatestPosts
} from '~/data/home'

const { data: homeData, pending: isLoadingHomeData } = await useHomePageData()

const defaultChatterCover = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop'

const safePostItems = computed(() => homeData.value?.posts || [])
const safeChatterItems = computed(() => homeData.value?.chatters || [])
const safeMomentItems = computed(() => homeData.value?.moments || [])
const safeAlbumItems = computed(() => homeData.value?.albums || [])
const safeFriendItems = computed(() => homeData.value?.friends || [])
const safeProjectItems = computed(() => homeData.value?.projects || [])
const safeSongItems = computed(() => homeData.value?.songs || [])

const hasHomeContent = computed(() => {
  return safePostItems.value.length > 0
      || safeChatterItems.value.length > 0
      || safeMomentItems.value.length > 0
      || safeAlbumItems.value.length > 0
})

const latestPosts = computed(() => buildLatestPosts(safePostItems.value))
const latestChatters = computed(() => buildLatestChatters(safeChatterItems.value, defaultChatterCover))

const homeSearchItems = computed(() => buildHomeSearchItems({
  posts: safePostItems.value,
  chatters: safeChatterItems.value,
  moments: safeMomentItems.value,
  friends: safeFriendItems.value,
  albums: safeAlbumItems.value,
  projects: safeProjectItems.value,
  songs: safeSongItems.value
}))

const latestAlbum = computed(() => buildLatestAlbum(safeAlbumItems.value))
const latestMomentCard = computed(() => buildLatestMomentCard(safeMomentItems.value))

const stats = computed(() => buildHomeStats({
  postsCount: safePostItems.value.length,
  chattersCount: safeChatterItems.value.length,
  albums: safeAlbumItems.value,
  momentCount: safeMomentItems.value.length,
  projects: safeProjectItems.value,
}))

useHead(() => ({
  title: `${siteConfig.navTitle}${siteConfig.navSuffix}${siteConfig.navAfter}`,
  meta: [
    {name: 'description', content: '欢迎光顾！'}
  ]
}))
</script>
