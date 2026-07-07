<template>
  <div class="absolute inset-0 flex flex-col px-panel-inline-loose pb-panel-bottom pt-panel-top">
    <div class="relative mx-auto mb-stack-lg w-full max-w-md shrink-0">
      <SearchBox
        v-model="searchQuery"
        placeholder="搜索歌曲关键字..."
        :show-dropdown="false"
        @search="playFirstFilteredSong"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2 overflow-y-auto pr-scrollbar-gutter">
      <div v-if="!filteredSongs.length" class="text-secondary px-panel-inline py-empty-state text-center text-size-content-body font-bold">
        没有匹配的歌曲。
      </div>
      <button
        v-for="song in filteredSongs"
        :key="song.id || song.url"
        type="button"
        class="group flex items-center justify-between rounded-2xl text-left cursor-pointer p-content-inset hover:bg-(--color-bg-album-paper-muted)"
        :class="{ 'bg-(--color-bg-album-paper-muted)': isClientReady && song.id === currentSong?.id }"
        @click="playSong(song.index)"
      >
        <span class="w-full flex min-w-0 items-center gap-4">
          <span class="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-sm">
            <img
                v-if="song.cover"
                :src="song.cover"
                alt=""
                class="media-fill-cover"
                referrerpolicy="no-referrer">
            <span v-else class="music-disc-placeholder grid h-full w-full place-items-center text-size-meta-label font-black">M</span>
          </span>
          <span class="min-w-0">
            <span
              class="text-title block truncate text-size-content-body font-black"
              :style="isClientReady && song.id === currentSong?.id ? 'color: var(--color-text-hover)' : ''"
            >
              <template
                v-for="(part, index) in highlightParts(song.title || '')"
                :key="`${song.id || song.url}-list-title-${index}`"
              >
                <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </span>
            <span class="text-secondary mt-stack-xs block truncate text-size-meta-label font-bold">
              <template
                v-for="(part, index) in highlightParts(song.description || song.artist || '')"
                :key="`${song.id || song.url}-list-desc-${index}`"
              >
                <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </span>
            <span v-if="song.tags?.length" class="mt-stack-xs flex flex-wrap gap-1.5">
              <span
                v-for="tag in song.tags"
                :key="tag"
                class="text-secondary meta-pill rounded-md px-chip-inline py-control-block-compact text-size-meta-label font-bold"
              >
                #
                <template
                  v-for="(part, index) in highlightParts(tag)"
                  :key="`${song.id || song.url}-list-${tag}-${index}`"
                >
                  <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                  <span v-else>{{ part.text }}</span>
                </template>
              </span>
            </span>
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from '~/data'
import { highlightSearchParts } from '~/utils/searchHighlight'

const props = defineProps<{
  songs: Song[]
}>()

const music = useMusicStore()
const searchQuery = ref('')
const isClientReady = ref(false)
const currentSong = computed(() => music.currentSong)
const playableSongs = computed(() => {
  return props.songs.filter((song) => song.url)
})
const filteredSongs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return playableSongs.value
    .map((song, index) => ({ ...song, index }))
    .filter((song) => {
      if (!query) return true
      return `${song.title || ''} ${song.description || ''} ${song.artist || ''} ${(song.tags || []).join(' ')}`
        .toLowerCase()
        .includes(query)
    })
})

function highlightParts(value: string) {
  return highlightSearchParts(value, searchQuery.value)
}

async function playSong(index: number) {
  await music.load()
  await music.play(index)
}

function playFirstFilteredSong() {
  const first = filteredSongs.value[0]
  if (first) void playSong(first.index)
}

onMounted(() => {
  isClientReady.value = true
})
</script>
