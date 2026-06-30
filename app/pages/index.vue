<template>
  <div class="flex flex-col gap-6 pt-page-top pb-page-bottom items-center">
    <HomeSearch :items="homeSearchItems" class="hover:scale-[1.02] z-10"/>
    <HomeMusicOverview :stats="stats"/>
    <HomeContentGrid
        :latest-album="latestAlbum"
        :latest-chatters="latestChatters"
        :latest-posts="latestPosts"
        :latest-moment-card="latestMomentCard"
    />
    <SiteDashboard/>
  </div>
</template>

<script setup lang="ts">
import {
  siteConfig,
  useAlbumsData,
  useChattersData,
  useFriendsData,
  useMomentsData,
  usePostsData,
  useProjectsData,
  useSongsData
} from '~/data'
import {
  buildHomeSearchItems,
  buildHomeStats,
  buildLatestAlbum,
  buildLatestChatters,
  buildLatestMomentCard,
  buildLatestPosts
} from '~/data/home'

const postItems = await usePostsData('home-posts')
const chatterItems = await useChattersData('home-chatters')
const momentItems = await useMomentsData('home-moments')
const albumItems = useAlbumsData()
const friendItems = useFriendsData()
const projectItems = useProjectsData()
const songItems = useSongsData()

const defaultChatterCover = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop'

const latestPosts = computed(() => buildLatestPosts(postItems.value))
const latestChatters = computed(() => buildLatestChatters(chatterItems.value, defaultChatterCover))

const homeSearchItems = computed(() => buildHomeSearchItems({
  posts: postItems.value,
  chatters: chatterItems.value,
  moments: momentItems.value,
  friends: friendItems.value,
  albums: albumItems.value,
  projects: projectItems.value,
  songs: songItems.value
}))

const latestAlbum = computed(() => buildLatestAlbum(albumItems.value))
const latestMomentCard = computed(() => buildLatestMomentCard(momentItems.value))

const stats = computed(() => buildHomeStats({
  postsCount: postItems.value.length,
  chattersCount: chatterItems.value.length,
  albums: albumItems.value,
  momentCount: momentItems.value.length,
  projects: projectItems.value,
}))

useHead(() => ({
  title: `${siteConfig.navTitle}${siteConfig.navSuffix}${siteConfig.navAfter}`,
  meta: [
    { name: 'description', content: '欢迎光顾！' }
  ]
}))
</script>
