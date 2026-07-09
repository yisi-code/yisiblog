<template>
  <section class="glass-panel relative flex col-span-7 h-auto shrink-0 flex-col overflow-hidden rounded-4xl shadow-2xl">
    <div
      class="segmented-control z-20 mx-auto mt-stack-lg w-64 shrink-0"
      :class="{ 'segmented-control--right': activeTab === 'playlist' }"
    >
      <button
        type="button"
        class="segmented-control__button"
        :class="{ 'segmented-control__button--active': activeTab === 'lyrics' }"
        @click="activeTab = 'lyrics'"
      >
        歌词
      </button>
      <button
        type="button"
        class="segmented-control__button"
        :class="{ 'segmented-control__button--active': activeTab === 'playlist' }"
        @click="activeTab = 'playlist'"
      >
        歌单
      </button>
    </div>

    <div class="relative mt-stack-xs flex flex-1 flex-col overflow-hidden">
      <ClientOnly v-if="activeTab === 'lyrics'">
        <MusicLyricsPanel />
        <template #fallback>
          <div class="absolute inset-0 flex items-center justify-center px-panel-inline text-center">
            <p class="text-secondary text-size-content-body font-black">歌词将在播放器连接后显示。</p>
          </div>
        </template>
      </ClientOnly>
      <MusicPlaylistPanel v-else :songs="songs" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Song } from '~/data'
import { clientLocalSettings } from '~~/shared/clientLocalSettings'

defineProps<{
  songs: Song[]
}>()

const activeTab = useClientLocalSetting(clientLocalSettings.musicActivePanel)
</script>
