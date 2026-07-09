<template>
  <section
      class="glass-panel relative flex col-span-5 min-h-0 shrink-0 flex-col overflow-hidden rounded-4xl p-panel-inset-loose shadow-2xl">
    <div class="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden py-0 p-card-inset">
      <div class="relative mb-section-offset grid h-64 w-64 shrink-0 place-items-center">
        <div
            class="music-player-orb absolute inset-[7%] rounded-full blur-[35px] transition duration-150"
            :class="music.isPlaying ? 'scale-105 opacity-90' : 'opacity-20'"
        />
        <div
            class="music-cover-border relative h-full w-full overflow-hidden rounded-full border-[5px] shadow-2xl transition-transform animate-spin-slow transform-gpu"
            :style="{ animationPlayState: music.isPlaying ? 'running' : 'paused' }"
        >
          <img v-if="cover" :src="cover" alt="" class="media-fill-cover" referrerpolicy="no-referrer">
          <div v-else class="music-disc-placeholder grid h-full w-full place-items-center text-size-card-title font-black">
            音乐
          </div>
          <div class="music-disc-sheen absolute inset-0 rounded-full opacity-20"/>
          <div
              class="music-disc-center absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-inner backdrop-blur-md"/>
        </div>
      </div>

      <div class="w-full text-center">
        <h2 class="text-title truncate text-size-card-title-lg font-black">{{ music.currentTitle }}</h2>
        <p class="text-secondary mt-stack-xs truncate text-size-content-body font-black tracking-widest">{{ music.currentArtist }}</p>
        <p v-if="music.lastError" class="text-size-meta-label mt-stack-xs font-bold" style="color: var(--color-status-error);">
          {{ music.lastError }}
        </p>
      </div>
    </div>

    <div class="relative mt-stack-md z-20 w-full">
      <div class="flex flex-col gap-2 mt-stack-md">
        <MusicSlider v-model="localProgress" :disabled="!music.duration" @change="seek"/>
        <div class="text-secondary flex justify-between text-size-meta-label font-bold tabular-nums">
          <span>{{ formatPlaybackTime(music.currentTime) }}</span>
          <span>{{ formatPlaybackTime(music.duration) }}</span>
        </div>
      </div>

      <div class="mp-3 flex w-full items-center justify-center gap-3">
        <BaseIconButton :title="playModeLabel" class="music-action" size="lg" @click="music.togglePlayMode">
          <template #icon>
            <svg
                v-if="music.playMode === 'random'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2">
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
            <svg
                v-else-if="music.playMode === 'single'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2">
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>
              <path stroke-linecap="round" d="M12 9v6"/>
            </svg>
            <svg
                v-else class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2">
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </template>
        </BaseIconButton>

        <BaseIconButton v-if="music.hasPrevious" class="music-action" aria-label="上一首" size="lg" @click="music.prev">
          <template #icon>
            <svg class="h-7.5 w-7.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </template>
        </BaseIconButton>
        <BaseIconButton
            class="shadow-primary shadow-xl"
            :aria-label="music.isPlaying ? '暂停' : '播放'"
            variant="primary" size="xl"
            @click="togglePlayback">
          <template #icon>
            <svg v-if="music.isPlaying" class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            <svg v-else class="ml-inline-gap-2xs h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </template>
        </BaseIconButton>
        <BaseIconButton v-if="music.hasNext" class="music-action" aria-label="下一首" size="lg" @click="music.next">
          <template #icon>
            <svg class="h-7.5 w-7.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </template>
        </BaseIconButton>

        <MusicVolumePopover v-model="volumeProgress" orientation="vertical" placement="top" @change="setVolume">
          <BaseIconButton
              class="music-action"
              :aria-label="music.isMuted ? '取消静音' : '静音'"
              size="lg"
              @click="music.toggleMute">
            <template #icon>
              <svg
                  v-if="music.isMuted || music.volume === 0"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
              </svg>
              <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </template>
          </BaseIconButton>
        </MusicVolumePopover>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {formatPlaybackTime} from '~/utils/mediaFormat'

defineProps<{
  cover: string
}>()

const music = useMusicStore()
const localProgress = ref(0)
const volumeProgress = ref(100)
const playModeLabel = computed(() => {
  if (music.playMode === 'single') return '单曲循环'
  if (music.playMode === 'random') return '随机播放'
  return '列表循环'
})

watch(() => music.progress, (value) => {
  localProgress.value = value
}, {immediate: true})

watch(() => music.volume, (value) => {
  volumeProgress.value = value * 100
}, {immediate: true})

function seek(value: number) {
  music.seekByProgress(value)
}

function setVolume(value: number) {
  music.setVolume(value / 100)
}

async function togglePlayback() {
  if (music.isPlaying) {
    music.pause()
    return
  }

  await music.play()
}
</script>
