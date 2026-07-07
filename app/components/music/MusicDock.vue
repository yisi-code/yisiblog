<template>
  <aside
    ref="draggableRef"
    class="music-dock-shell fixed bottom-4 right-4 z-40 w-[min(18rem,calc(100vw-2rem))]"
    :class="{ 'music-dock-shell--dragging': isDragging }"
    :style="draggableStyle"
  >
    <audio
      v-if="currentSong"
      ref="audioRef"
      :src="currentSong.url"
      class="hidden"
      preload="metadata"
      @timeupdate="syncTime"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
      @error="handleAudioError"
    />

    <Transition name="music-dock">
      <div
        v-if="currentSong && !isMusicPage"
        class="glass-panel surface-soft flex items-center gap-2 rounded-full p-control-inset-compact pr-action-inline shadow-2xl backdrop-blur-xl"
        @pointerdown="startDockDrag"
        @click.capture="suppressClickAfterDrag"
      >
        <div
          class="music-cover-border relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full border shadow-sm animate-spin-slow transform-gpu"
          :style="{ animationPlayState: music.isPlaying ? 'running' : 'paused' }"
          :aria-label="`打开音乐页：${music.currentTitle || '未知音乐'}`"
          :title="`打开音乐页：${music.currentTitle || '未知音乐'}`"
          @click="navigateTo('/music')"
        >
          <img v-if="cover" :src="cover" alt="" class="media-fill-cover" referrerpolicy="no-referrer">
          <span v-else class="music-disc-placeholder grid h-full w-full place-items-center text-size-meta-label font-black">M</span>
          <span class="music-cover-overlay absolute inset-0" />
          <span class="music-disc-center absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner" />
        </div>

        <div class="min-w-0 flex-1">
          <MusicTextButton
            class="text-title text-size-content-body font-black"
            :text="music.currentTitle"
            @click="navigateTo('/music')"
          />
          <MusicTextButton
            class="text-secondary text-size-helper-note font-bold"
            :text="music.currentArtist"
            @click="navigateTo('/music')"
          />
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <BaseIconButton
            v-if="music.hasPrevious"
            aria-label="上一首"
            class="music-action"
            size="sm"
            @click="music.prev"
          >
            <template #icon>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
            </template>
          </BaseIconButton>
          <BaseIconButton
            class="shadow-md"
            :aria-label="music.isPlaying ? '暂停' : '播放'"
            variant="primary"
            size="sm"
            @click="togglePlayback"
          >
            <template #icon>
            <svg v-if="music.isPlaying" class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <svg v-else class="ml-inline-gap-2xs h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            </template>
          </BaseIconButton>
          <BaseIconButton
            v-if="music.hasNext"
            aria-label="下一首"
            class="music-action"
            size="sm"
            @click="music.next"
          >
            <template #icon>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
            </template>
          </BaseIconButton>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const music = useMusicStore()
const audioRef = ref<HTMLAudioElement | null>(null)
const currentSong = computed(() => music.currentSong)
const cover = computed(() => currentSong.value?.cover || '')
const isMusicPage = computed(() => route.path.startsWith('/music') || route.path === '/')
const isSeekingByRequest = ref(false)
let suppressClickTimer: number | undefined
const {
  draggableRef,
  draggableStyle,
  hasDragged,
  isDragging,
  startDrag,
  stopDrag,
  cancelDrag
} = useDraggableEdgeSnap({ dragMoveThreshold: 6, overflowResetRatio: 1 / 3 })

onMounted(() => {
  void music.load().then(syncAudioPlayback)
})

function startDockDrag(event: PointerEvent) {
  if (!startDrag(event)) return

  window.addEventListener('pointerup', finishDockDrag, { once: true })
  window.addEventListener('pointercancel', cancelDockDrag, { once: true })
}

function finishDockDrag() {
  const wasDragged = stopDrag()
  window.removeEventListener('pointercancel', cancelDockDrag)
  if (wasDragged) {
    window.clearTimeout(suppressClickTimer)
    suppressClickTimer = window.setTimeout(() => {
      hasDragged.value = false
    }, 180)
  }
}

function cancelDockDrag() {
  cancelDrag()
  window.removeEventListener('pointerup', finishDockDrag)
}

function suppressClickAfterDrag(event: MouseEvent) {
  if (!hasDragged.value) return

  event.preventDefault()
  event.stopPropagation()
  window.clearTimeout(suppressClickTimer)
  suppressClickTimer = undefined
  hasDragged.value = false
}

function syncTime() {
  const audio = audioRef.value
  if (!audio) return
  if (isSeekingByRequest.value && Math.abs(audio.currentTime - music.seekTargetTime) > 0.1) return
  isSeekingByRequest.value = false
  music.setPlaybackTime(audio.currentTime, audio.duration)
}

function syncAudioVolume() {
  const audio = audioRef.value
  if (!audio) return
  audio.volume = music.isMuted ? 0 : music.volume
  audio.muted = music.isMuted
}

function handleLoadedMetadata() {
  const audio = audioRef.value
  if (!audio) return

  syncAudioVolume()

  const restoredTime = Math.min(music.currentTime, Number.isFinite(audio.duration) ? audio.duration : music.currentTime)
  if (restoredTime > 0 && Math.abs(audio.currentTime - restoredTime) > 0.2) {
    isSeekingByRequest.value = true
    audio.currentTime = restoredTime
    window.setTimeout(() => {
      isSeekingByRequest.value = false
      music.setPlaybackTime(audio.currentTime, audio.duration)
    }, 80)
  } else {
    syncTime()
  }

  if (music.isPlaying) void playAudio(audio)
}

function handleEnded() {
  const audio = audioRef.value
  music.handleEnded()
  if (music.isPlaying && audio && music.progress === 0) {
    audio.currentTime = 0
    void playAudio(audio)
  }
}

function handleAudioError() {
  music.lastError = formatAudioError(audioRef.value)
  music.pause()
}

watch(() => music.isPlaying, async (playing) => {
  const audio = audioRef.value
  if (!audio) return
  if (playing) await playAudio(audio)
  else audio.pause()
}, { immediate: true })

async function togglePlayback() {
  if (music.isPlaying) {
    music.pause()
    return
  }

  await music.play()
}

watch(currentSong, async () => {
  const restoredSongKey = music.restoredSongKey
  const isRestoredSong = Boolean(restoredSongKey && restoredSongKey === music.songPlaybackKey(currentSong.value))
  await nextTick()
  const audio = audioRef.value
  if (!audio) return
  syncAudioVolume()
  if (isRestoredSong) music.restoredSongKey = ''
  else music.resetPlaybackPosition()
  audio.load()
  await music.syncLyrics()
  await syncAudioPlayback()
}, { immediate: true })

async function syncAudioPlayback() {
  await nextTick()
  const audio = audioRef.value
  if (!audio) return

  syncAudioVolume()
  if (music.isPlaying) {
    await playAudio(audio)
  } else {
    audio.pause()
  }
}

async function playAudio(audio: HTMLAudioElement) {
  try {
    music.lastError = ''
    await audio.play()
    await new Promise((resolve) => window.setTimeout(resolve, 100))
    if (audio.paused) {
      music.lastError = '浏览器未能开始播放音频，已切换为暂停状态。'
      music.pause()
    }
  } catch (error) {
    music.lastError = formatAudioError(audio, error)
    music.pause()
  }
}

function formatAudioError(audio?: HTMLAudioElement | null, error?: unknown) {
  const message = error instanceof Error ? error.message : ''
  const mediaError = audio?.error
  const isUnsupportedSource = mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
      || /supported source|not supported/i.test(message)

  if (isUnsupportedSource) {
    return '音频文件无法播放：浏览器不支持当前文件或编码，请使用 MP3 或 AAC 编码的 M4A。'
  }

  if (mediaError?.code === MediaError.MEDIA_ERR_NETWORK) {
    return '音频加载失败：网络或静态资源访问异常。'
  }

  if (mediaError?.code === MediaError.MEDIA_ERR_DECODE) {
    return '音频解码失败：文件可能损坏或编码异常。'
  }

  return message || `音频加载失败：${currentSong.value?.url || '未知音频'}`
}

watch(() => music.seekRequestId, () => {
  const audio = audioRef.value
  if (!audio) return
  const targetTime = music.seekTargetTime
  if (!Number.isFinite(targetTime)) return
  isSeekingByRequest.value = true
  audio.currentTime = targetTime
  window.setTimeout(() => {
    if (Math.abs(audio.currentTime - targetTime) <= 0.1) {
      isSeekingByRequest.value = false
      music.setPlaybackTime(audio.currentTime, audio.duration)
    }
  }, 80)
})

watch(() => music.progress, (progress) => {
  const audio = audioRef.value
  if (isSeekingByRequest.value) return
  if (!audio || !audio.duration) return
  const targetTime = (progress / 100) * audio.duration
  if (Math.abs(audio.currentTime - targetTime) > 0.2 || (progress === 0 && audio.currentTime !== 0)) audio.currentTime = targetTime
})

watch([() => music.volume, () => music.isMuted], () => {
  syncAudioVolume()
}, { immediate: true })

onBeforeUnmount(() => {
  window.clearTimeout(suppressClickTimer)
  cancelDockDrag()
})
</script>
