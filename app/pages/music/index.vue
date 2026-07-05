<template>
  <div class="relative pb-page-bottom-loose">
    <ClientOnly>
      <div v-if="currentSong" class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          class="absolute inset-[-10%] bg-cover bg-center opacity-40 blur-[50px] saturate-150 transition-all duration-300 dark:opacity-20"
          :style="{ backgroundImage: `url(${cover})` }"
        />
        <div class="music-page-backdrop absolute inset-0 backdrop-blur-sm" />
      </div>
    </ClientOnly>

    <ArticleBackButton
        class="sticky mt-player-sticky-offset mb-stack-lg"
        :custom-background-color="'var(--color-bg-panel)'"
        :custom-text-color="'var(--color-text-second)'"
    />

    <div class="relative">
      <div class="grid w-full grid-cols-12 items-stretch gap-8">
        <ClientOnly>
          <template v-if="!music.loaded">
            <section class="glass-panel col-span-5 flex min-h-105 flex-col items-center justify-center gap-4 rounded-[32px] p-panel-inset-loose">
              <div class="loading-spinner h-12 w-12 animate-spin rounded-full border-4" />
              <span class="text-secondary text-size-content-body font-black tracking-widest">正在加载音乐...</span>
            </section>
          </template>
          <template v-else-if="!currentSong">
            <section class="glass-panel col-span-5 rounded-[32px] p-panel-inset-loose text-center">
              <p class="text-secondary text-size-content-body font-black">暂无可播放的本地音乐。</p>
            </section>
          </template>
          <MusicPlayerPanel v-else :cover="cover" />
          <template #fallback>
            <section class="glass-panel col-span-5 flex min-h-105 flex-col items-center justify-center gap-4 rounded-[32px] p-panel-inset-loose">
              <div class="loading-spinner h-12 w-12 animate-spin rounded-full border-4" />
              <span class="text-secondary text-size-content-body font-black tracking-widest">正在连接播放器...</span>
            </section>
          </template>
        </ClientOnly>
        <MusicLibraryPanel :songs="songItems" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { siteConfig, useSongsData } from '~/data'

const music = useMusicStore()
const songItems = await useSongsData()

const currentSong = computed(() => music.currentSong)
const cover = computed(() => currentSong.value?.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop')

useHead(() => ({title: `音乐${siteConfig.navSuffix}${siteConfig.navAfter}`}))
</script>
