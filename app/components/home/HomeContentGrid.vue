<template>
  <div class="flex flex-row gap-6 w-full h-fit">
    <div class="flex-[8_1_0%] flex flex-col gap-6">
      <div class="flex-1 flex flex-row gap-6">
        <HomeLatestAlbumCard class="flex-1" :album="latestAlbum" />

        <div class="flex flex-col flex-1">
          <ContentCarousel
            eyebrow="最新杂谈"
            :items="latestChatters"
            :interval="6000"
          />
        </div>
      </div>

      <div class="block">
        <ThemeToggleBlock
          eyebrow="最新动态"
          :description="latestMomentCard.description"
          :date="latestMomentCard.date"
          :to="latestMomentCard.path"
        />
      </div>
    </div>

    <div class="flex-[4_1_0%] min-h-max transform-gpu">
      <ContentCarousel
        eyebrow="最新博文"
        :items="latestPosts"
        :tall="true"
        :interval="5000"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HomeCardItem, HomeMomentCard } from '~/data/home'

withDefaults(defineProps<{
  latestAlbum?: HomeCardItem
  latestChatters?: HomeCardItem[]
  latestPosts?: HomeCardItem[]
  latestMomentCard?: HomeMomentCard
}>(), {
  latestAlbum: () => ({
    path: '/albums',
    title: '',
    description: '',
    date: '',
    cover: ''
  }),
  latestChatters: () => [],
  latestPosts: () => [],
  latestMomentCard: () => ({
    description: '',
    date: '',
    path: '/moments'
  })
})
</script>
