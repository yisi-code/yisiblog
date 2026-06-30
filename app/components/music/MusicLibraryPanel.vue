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
      <MusicLyricsPanel v-if="activeTab === 'lyrics'" />
      <MusicPlaylistPanel v-else />
    </div>
  </section>
</template>

<script setup lang="ts">
type MusicPanel = 'lyrics' | 'playlist'

const activeTabCookie = useCookie<MusicPanel>('xhblogs-music-active-panel', {
  default: () => 'lyrics'
})
const activeTab = computed<MusicPanel>({
  get: () => activeTabCookie.value === 'playlist' ? 'playlist' : 'lyrics',
  set: (value) => {
    activeTabCookie.value = value
  }
})
</script>
