<template>
  <section
    class="glass-panel interactive-card group relative flex h-full origin-center flex-col justify-between overflow-hidden rounded-3xl p-card-inset transition duration-300 will-change-transform hover:scale-[1.02]"
  >
    <div
      class="music-player-glow absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[50px] transition-opacity duration-300"
      :class="music.isPlaying ? 'opacity-100' : 'opacity-30'"
    />
    <NuxtLink
      to="/music"
      class="music-page-entry"
      aria-label="进入音乐页"
      title="进入音乐页"
      @click.stop
    >
      <span class="music-page-entry__disc" aria-hidden="true">
        <span class="music-page-entry__core" />
      </span>
    </NuxtLink>

    <div v-if="!music.loaded" class="relative z-10 flex flex-1 flex-col items-center justify-center">
      <div class="loading-spinner mb-stack-md h-10 w-10 animate-spin rounded-full border-4" />
      <span class="text-title animate-pulse text-size-content-body font-black tracking-widest">连接中...</span>
    </div>

    <div v-else-if="!currentSong" class="relative z-10 flex flex-1 flex-col items-center justify-center">
      <div class="surface-muted mb-stack-md grid h-16 w-16 place-items-center rounded-full opacity-60 shadow-inner">
        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55A3.96 3.96 0 0 0 10 13c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <span class="text-title text-size-meta-label font-black uppercase tracking-widest">暂无音乐</span>
      <span class="text-secondary mt-stack-xs text-size-helper-note">请检查歌单或连接状态</span>
    </div>

    <template v-else>
      <div class="relative mt-stack-xs flex items-center gap-4">
        <div
          class="music-cover-border relative h-15 w-15 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 shadow-lg animate-spin-slow transform-gpu"
          :style="{ animationPlayState: music.isPlaying ? 'running' : 'paused' }"
          :title="`打开音乐页：${currentSong.title || '未知音乐'}`"
          :aria-label="`打开音乐页：${currentSong.title || '未知音乐'}`"
          @click="navigateTo('/music')"
        >
          <img :src="cover" alt="" class="media-fill-cover" referrerpolicy="no-referrer">
          <div class="music-cover-overlay absolute inset-0" />
          <div class="music-disc-center absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-inner backdrop-blur-sm" />
        </div>

        <div class="min-w-fit flex-1">
          <MusicTextButton
            class="text-title text-size-card-title font-black"
            :text="`${currentSong.title|| '未知歌曲'}`"
            :title="`歌曲：${currentSong.title|| '未知歌曲'}`"
            @click="navigateTo('/music')"
          />
          <MusicTextButton
            class="text-secondary mt-stack-xs text-size-content-body font-bold"
            :text="`歌手：${currentSong.artist|| '未知歌手'}`"
            :title="`歌手：${currentSong.artist|| '未知歌手'}`"
            @click="navigateTo('/music')"
          />
        </div>
      </div>

      <div class="w-full relative z-10 mt-stack-xs flex h-fit items-center justify-between text-left">
        <div class="flex w-fit flex-1 items-center justify-center overflow-hidden pr-action-inline transform-gpu">
          <MusicTextButton
            class="music-lyric text-center text-size-content-lead font-black leading-snug tracking-wide"
            :title="displayedLyric"
            multiline
            @click="navigateTo('/music')"
          >
            {{ displayedLyric }}
            <span
              class="animate-cursor ml-inline-gap-2xs inline-block h-5 w-[3px] align-middle bg-current"
              :style="{ animationPlayState: music.isPlaying ? 'running' : 'paused' }"
            />
          </MusicTextButton>
        </div>

        <div class="flex w-12 shrink-0 justify-end">
          <svg
            class="music-note-icon music-note h-6 w-6 transition duration-300"
            :style="{ animationPlayState: music.isPlaying ? 'running' : 'paused' }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>

      <div class="w-full flex items-center justify-center mt-stack-xs gap-4 relative" @click.stop>

        <div class="flex items-center justify-center gap-3">
          <BaseIconButton
              v-if="music.hasPrevious"
              aria-label="上一首"
              class="music-action"
              size="lg"
              @click.stop="music.prev"
          >
            <template #icon>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </template>
          </BaseIconButton>
          <BaseIconButton
              class="music-action-border border-2 shadow-lg"
              :aria-label="music.isPlaying ? '暂停' : '播放'"
              variant="primary"
              size="lg"
              @click.stop="music.toggle"
          >
            <template #icon>
              <svg v-if="music.isPlaying" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else class="ml-inline-gap-2xs h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </template>
          </BaseIconButton>
          <BaseIconButton
              v-if="music.hasNext"
              aria-label="下一首"
              class="music-action"
              size="lg"
              @click.stop="music.next"
          >
            <template #icon>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </template>
          </BaseIconButton>
        </div>

        <div class="flex-1 text-secondary flex items-center gap-3 text-size-meta-label font-bold">
          <span class="w-10 text-right">{{ formatPlaybackTime(music.currentTime) }}</span>
          <MusicSlider v-model="localProgress" :disabled="!music.duration" @change="seek" />
          <span class="w-10">{{ formatPlaybackTime(music.duration) }}</span>
        </div>

      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { formatPlaybackTime } from '~/utils/mediaFormat'

const music = useMusicStore()
const currentSong = computed(() => music.currentSong)
const cover = computed(() => currentSong.value?.cover || '')
const displayedLyric = ref('')
const localProgress = ref(0)

watch(() => music.currentLyric, (targetText, _oldValue, onCleanup) => {
  displayedLyric.value = ''
  if (!targetText) return

  let index = 0
  const timer = window.setInterval(() => {
    displayedLyric.value = targetText.slice(0, index)
    index += 1
    if (index > targetText.length + 1) window.clearInterval(timer)
  }, 50)
  onCleanup(() => window.clearInterval(timer))
}, { immediate: true })

watch(() => music.progress, (value) => {
  localProgress.value = value
}, { immediate: true })

function seek(value: number) {
  music.seekByProgress(value)
}

</script>
