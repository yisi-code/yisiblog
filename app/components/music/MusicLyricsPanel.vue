<template>
  <div class="absolute inset-0 flex h-full flex-col">
    <div class="lyric-fade-top pointer-events-none absolute left-0 right-0 top-0 z-10 h-40" />
    <div class="lyric-fade-bottom pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40" />
    <div ref="lyricContainerRef" class="lyric-mask h-full overflow-y-auto px-panel-inline">
      <div class="flex flex-col gap-6 px-layout-gutter py-[35vh] text-center transform-gpu">
        <button
          v-for="(line, index) in music.lyrics"
          :key="`${line.time}-${index}`"
          :ref="(element) => setLyricLineRef(element, index)"
          type="button"
          class="lyric-line mx-auto block w-fit max-w-full rounded-2xl px-content-inline text-center transition-all duration-150 cursor-pointer"
          :class="index === activeLyricIndex ? 'scale-105 py-content-block opacity-100' : 'opacity-25'"
          @click="music.seekToTime(line.time)"
        >
          <span
            class="lyric-text music-lyric block max-w-full font-black leading-relaxed tracking-tight transition-[opacity,transform,font-size] duration-150"
            :class="index === activeLyricIndex ? 'lyric-text--active text-size-card-title-lg' : 'text-size-content-lead'"
          >
            {{ line.text }}
          </span>
          <span
            v-if="line.translation"
            class="lyric-translation mt-stack-xs block max-w-full font-bold leading-relaxed transition-[opacity,transform,font-size] duration-150"
            :class="index === activeLyricIndex ? 'lyric-translation--active text-size-content-body' : 'text-size-content-body'"
          >
            {{ line.translation }}
          </span>
        </button>
        <div v-if="!music.lyrics.length" class="flex h-full items-center justify-center">
          <p class="text-accent text-size-content-body font-black">{{ music.currentLyric }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

const music = useMusicStore()
const lyricContainerRef = ref<HTMLElement | null>(null)
const lyricLineRefs = ref<HTMLElement[]>([])
const currentSong = computed(() => music.currentSong)
const activeLyricIndex = computed(() => {
  if (!music.lyrics.length) return -1
  const nextIndex = music.lyrics.findIndex((line) => line.time > music.currentTime)
  return Math.max(0, nextIndex === -1 ? music.lyrics.length - 1 : nextIndex - 1)
})

watch(activeLyricIndex, () => {
  void centerActiveLyric('smooth')
})

watch(() => [currentSong.value?.id, music.lyrics.length] as const, () => {
  void centerActiveLyric('auto')
})

onMounted(() => {
  void centerActiveLyric('auto')
})

onBeforeUpdate(() => {
  lyricLineRefs.value = []
})

async function centerActiveLyric(behavior: ScrollBehavior = 'smooth') {
  if (!import.meta.client) return
  const index = activeLyricIndex.value
  if (index < 0) return
  await nextTick()

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

  const container = lyricContainerRef.value
  const activeItem = lyricLineRefs.value[index]
  if (!container || !activeItem) return
  container.scrollTo({
    top: activeItem.offsetTop - container.clientHeight / 2 + activeItem.offsetHeight / 2,
    behavior
  })
}

function setLyricLineRef(element: Element | ComponentPublicInstance | null, index: number) {
  if (element instanceof HTMLElement) {
    lyricLineRefs.value[index] = element
  }
}
</script>
