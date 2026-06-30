<template>
  <section v-if="currentSong" class="glass-panel surface-soft shadow-primary-hover group flex h-20 w-full items-center justify-between rounded-3xl p-card-inset shadow-2xl transition duration-300">
    <div class="flex h-8 w-16 items-end justify-center gap-[4px]">
      <div
        v-for="wave in waves"
        :key="wave.delay"
        class="w-1.5 rounded-t-sm transition-all duration-300 ease-out"
        :class="music.isPlaying ? `${wave.color} safe-wave-active` : 'audio-wave-idle h-1'"
        :style="{ animationDelay: wave.delay, height: music.isPlaying ? undefined : '4px' }"
      />
    </div>

    <div class="flex flex-1 items-center justify-center overflow-hidden px-panel-inline-loose">
      <p class="text-inverse truncate text-size-content-lead font-black tracking-widest">
        {{ displayedLyric }}
        <span class="ml-inline-gap-2xs inline-block h-5 w-[3px] animate-cursor align-middle bg-current" />
      </p>
    </div>

    <div class="flex w-16 justify-end">
      <svg class="music-note-icon h-6 w-6 transition duration-300" :class="music.isPlaying ? 'animate-bounce' : 'opacity-30'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
const music = useMusicStore()
const currentSong = computed(() => music.currentSong)
const displayedLyric = ref('')

const waves = [
  { color: 'audio-wave-1', delay: '0ms' },
  { color: 'audio-wave-2', delay: '200ms' },
  { color: 'audio-wave-3', delay: '400ms' },
  { color: 'audio-wave-4', delay: '100ms' },
  { color: 'audio-wave-5', delay: '300ms' }
]

watch(() => music.currentLyric || currentSong.value?.title || '', (targetText, _oldValue, onCleanup) => {
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
</script>
