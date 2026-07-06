import { defineStore } from 'pinia'
import { fetchSongsData, type Song } from '~/data'

export type LyricLine = {
  time: number
  text: string
  translation?: string
}

type PlayMode = 'loop' | 'single' | 'random'
type PlayerSong = Song & {
  lyrics?: LyricLine[]
}
type PersistedMusicState = {
  currentIndex: number
  currentTime: number
  duration: number
  progress: number
  volume: number
  isMuted: boolean
  playMode: PlayMode
  isPlaying: boolean
  songId?: string
  songUrl?: string
  songTitle?: string
  savedAt: number
}

const musicStorageKey = 'yisiblog-music-state'

function parseLrc(lrcText?: string | LyricLine[]) {
  if (Array.isArray(lrcText)) return lrcText
  if (!lrcText || lrcText.length > 30000) return []

  const result: LyricLine[] = []
  const lines = lrcText.split(/\r?\n/)

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g)]
    if (!matches.length) continue

    const text = line
      .replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()

    if (!text) continue

    for (const match of matches) {
      const minutes = Number.parseInt(match[1] || '0', 10)
      const seconds = Number.parseInt(match[2] || '0', 10)
      const rawMs = match[3]
      const ms = rawMs ? Number.parseInt(rawMs, 10) / (rawMs.length === 3 ? 1000 : 100) : 0
      const time = minutes * 60 + seconds + ms
      const existingLine = result.find((item) => item.time === time)

      if (existingLine) {
        existingLine.translation = existingLine.translation || text
      } else {
        result.push({ time, text })
      }
    }
  }

  return result.sort((a, b) => a.time - b.time)
}

function songPlaybackKey(song: PlayerSong | null) {
  if (!song) return ''
  return song.id || song.url || song.title || ''
}

export const useMusicStore = defineStore('music', () => {
  // ---------- State ----------
  const songsList = ref<PlayerSong[]>([])
  const currentIndex = ref(0)
  const isPlaying = ref(false)
  const loaded = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const progress = ref(0)
  const seekTargetTime = ref(0)
  const seekRequestId = ref(0)
  const lyrics = ref<LyricLine[]>([])
  const currentLyric = ref('本地音乐准备中...')
  const volume = ref(1)
  const isMuted = ref(false)
  const playMode = ref<PlayMode>('loop')
  const lastError = ref('')
  const isEnded = ref(false)
  const lyricCache = ref<Record<string, LyricLine[]>>({})
  const hasRestoredPlayback = ref(false)
  const restoredSongKey = ref('')
  let loadPromise: Promise<void> | null = null

  // ---------- Getters (computed) ----------
  const currentSong = computed(() => {
    return songsList.value[currentIndex.value] || null
  })

  const currentTitle = computed(() => {
    const song = songsList.value[currentIndex.value]
    return song?.title || '未知音轨'
  })

  const currentArtist = computed(() => {
    const song = songsList.value[currentIndex.value]
    return song?.artist || '未知歌手'
  })

  const hasPrevious = computed(() => {
    return songsList.value.length > 1
  })

  const hasNext = computed(() => {
    return songsList.value.length > 1
  })

  const isWaveActive = computed(() => {
    return isPlaying.value && progress.value > 0 && !isEnded.value
  })

  // ---------- 辅助函数（内部使用） ----------
  function resetPlaybackPosition() {
    currentTime.value = 0
    duration.value = 0
    progress.value = 0
    seekTargetTime.value = 0
    seekRequestId.value += 1
    isEnded.value = false
  }

  function persistPlaybackState() {
    if (!import.meta.client || !loaded.value || !currentSong.value) return

    const song = currentSong.value
    const state: PersistedMusicState = {
      currentIndex: currentIndex.value,
      currentTime: Number(currentTime.value.toFixed(3)),
      duration: Number(duration.value.toFixed(3)),
      progress: Number(progress.value.toFixed(3)),
      volume: volume.value,
      isMuted: isMuted.value,
      playMode: playMode.value,
      isPlaying: isPlaying.value,
      songId: song.id,
      songUrl: song.url,
      songTitle: song.title,
      savedAt: Date.now()
    }

    window.localStorage.setItem(musicStorageKey, JSON.stringify(state))
  }

  function restorePlaybackState() {
    if (!import.meta.client || hasRestoredPlayback.value) return
    hasRestoredPlayback.value = true

    const rawState = window.localStorage.getItem(musicStorageKey)
    if (!rawState) return

    try {
      const state = JSON.parse(rawState) as Partial<PersistedMusicState>
      const fallbackIndex = Number.isInteger(state.currentIndex) ? state.currentIndex as number : 0
      const matchedIndex = songsList.value.findIndex((song) => {
        return Boolean(
          (state.songId && song.id === state.songId) ||
          (state.songUrl && song.url === state.songUrl) ||
          (state.songTitle && song.title === state.songTitle)
        )
      })
      const nextIndex = matchedIndex >= 0 ? matchedIndex : fallbackIndex
      if (!songsList.value[nextIndex]) return

      currentIndex.value = nextIndex
      restoredSongKey.value = songPlaybackKey(songsList.value[nextIndex] || null)
      currentTime.value = Math.max(0, Number(state.currentTime) || 0)
      duration.value = Math.max(0, Number(state.duration) || 0)
      progress.value = duration.value > 0
        ? Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
        : Math.min(100, Math.max(0, Number(state.progress) || 0))
      seekTargetTime.value = Number(currentTime.value.toFixed(3))
      seekRequestId.value += 1
      volume.value = Math.min(1, Math.max(0, Number(state.volume) || 0))
      isMuted.value = Boolean(state.isMuted)
      if (state.playMode === 'loop' || state.playMode === 'single' || state.playMode === 'random') {
        playMode.value = state.playMode
      }
      isEnded.value = false
      isPlaying.value = Boolean(state.isPlaying)
    } catch {
      window.localStorage.removeItem(musicStorageKey)
    }
  }

  async function loadSongLyrics(song: PlayerSong | null) {
    if (!song?.lrcUrl) return []
    const cachedLyrics = lyricCache.value[song.lrcUrl]
    if (cachedLyrics) return cachedLyrics

    const lrcText = await $fetch<string>(song.lrcUrl, { responseType: 'text' }).catch(() => '')
    const parsedLyrics = parseLrc(lrcText)
    lyricCache.value = {
      ...lyricCache.value,
      [song.lrcUrl]: parsedLyrics
    }
    return parsedLyrics
  }

  async function syncLyrics() {
    const song = currentSong.value
    lyrics.value = await loadSongLyrics(song)
    currentLyric.value = lyrics.value[0]?.text || 'Instrumental music'
  }

  function updateCurrentLyric() {
    if (!lyrics.value.length) return
    // 倒序查找当前时间对应的歌词
    const activeLyric = [...lyrics.value]
        .reverse()
        .find((line) => currentTime.value >= line.time)
    if (activeLyric) currentLyric.value = activeLyric.text
  }

  // ---------- Actions ----------
  async function load() {
    if (loaded.value) {
      restorePlaybackState()
      await syncLyrics()
      return
    }

    loadPromise ||= (async () => {
      const songItems = await fetchSongsData()
      songsList.value = songItems
          .filter((song) => !song.error && song.url)
          .map((song, index) => ({
            ...song,
            id: song.id || `${song.title || 'local'}-${index}`
          }))
      loaded.value = true
      restorePlaybackState()
      await syncLyrics()
    })().finally(() => {
      loadPromise = null
    })

    await loadPromise
  }

  async function play(index?: number) {
    if (typeof index === 'number' && songsList.value[index]) {
      currentIndex.value = index
      restoredSongKey.value = ''
      resetPlaybackPosition()
    }
    await syncLyrics()
    isEnded.value = false
    isPlaying.value = true
  }

  function pause() {
    isPlaying.value = false
  }

  function toggle() {
    if (!isPlaying.value && isEnded.value) {
      currentTime.value = 0
      progress.value = 0
      isEnded.value = false
    } else if (!isPlaying.value) {
      isEnded.value = false
    }
    isPlaying.value = !isPlaying.value
  }

  async function next() {
    if (!hasNext.value) return
    if (playMode.value === 'random' && songsList.value.length > 1) {
      let nextIndex = currentIndex.value
      while (nextIndex === currentIndex.value) {
        nextIndex = Math.floor(Math.random() * songsList.value.length)
      }
      currentIndex.value = nextIndex
    } else {
      currentIndex.value = (currentIndex.value + 1) % songsList.value.length
    }
    restoredSongKey.value = ''
    resetPlaybackPosition()
    await syncLyrics()
  }

  async function prev() {
    if (!hasPrevious.value) return
    if (playMode.value === 'random' && songsList.value.length > 1) {
      void next()
      return
    }
    currentIndex.value = (currentIndex.value - 1 + songsList.value.length) % songsList.value.length
    restoredSongKey.value = ''
    resetPlaybackPosition()
    await syncLyrics()
  }

  function seekByProgress(progressVal: number) {
    progress.value = Math.min(100, Math.max(0, progressVal))
    currentTime.value = duration.value > 0 ? (progress.value / 100) * duration.value : 0
    seekTargetTime.value = Number(currentTime.value.toFixed(3))
    seekRequestId.value += 1
    if (progress.value < 100) isEnded.value = false
    updateCurrentLyric()
  }

  function seekToTime(time: number) {
    const maxTime = duration.value > 0 ? duration.value : Number.POSITIVE_INFINITY
    const targetTime = Math.min(maxTime, Math.max(0, Number(time.toFixed(3))))
    currentTime.value = targetTime
    seekTargetTime.value = targetTime
    seekRequestId.value += 1
    progress.value = duration.value > 0 ? (targetTime / duration.value) * 100 : 0
    if (progress.value < 100) isEnded.value = false
    updateCurrentLyric()
  }

  function setPlaybackTime(curTime: number, dur: number) {
    currentTime.value = Number.isFinite(curTime) ? curTime : 0
    duration.value = Number.isFinite(dur) ? dur : 0
    progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    if (progress.value > 0 && progress.value < 99.9) isEnded.value = false
    updateCurrentLyric()
  }

  function setVolume(value: number) {
    volume.value = Math.min(1, Math.max(0, value))
    if (volume.value > 0 && isMuted.value) isMuted.value = false
  }

  function toggleMute() {
    if (volume.value === 0) {
      volume.value = 1
      isMuted.value = false
      return
    }
    isMuted.value = !isMuted.value
  }

  function togglePlayMode() {
    if (playMode.value === 'loop') playMode.value = 'single'
    else if (playMode.value === 'single') playMode.value = 'random'
    else playMode.value = 'loop'
  }

  function handleEnded() {
    restoredSongKey.value = ''
    if (playMode.value === 'single') {
      resetPlaybackPosition()
      isPlaying.value = true
      return
    }
    if (!hasNext.value && (playMode.value === 'loop' || playMode.value === 'random')) {
      resetPlaybackPosition()
      isPlaying.value = true
      return
    }
    if (!hasNext.value) {
      currentTime.value = duration.value
      progress.value = 100
      isEnded.value = true
      isPlaying.value = false
      return
    }
    void next()
    nextTick(() => {
      isPlaying.value = true
    })
  }

  if (import.meta.client) {
    let persistTimer: number | undefined
    let playingPersistInterval: number | undefined

    function stopPlayingPersistInterval() {
      if (!playingPersistInterval) return
      window.clearInterval(playingPersistInterval)
      playingPersistInterval = undefined
    }

    function syncPlayingPersistInterval() {
      stopPlayingPersistInterval()
      if (!isPlaying.value) return
      playingPersistInterval = window.setInterval(persistPlaybackState, 500)
    }

    watch([
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      progress,
      volume,
      isMuted,
      playMode
    ], () => {
      window.clearTimeout(persistTimer)
      persistTimer = window.setTimeout(persistPlaybackState, 300)
    })

    watch(isPlaying, syncPlayingPersistInterval, { immediate: true })
    window.addEventListener('beforeunload', persistPlaybackState)
  }

  // ---------- 返回所有 state、getters 和 actions ----------
  return {
    // state (refs)
    songs: songsList,
    currentIndex,
    isPlaying,
    loaded,
    currentTime,
    duration,
    progress,
    seekTargetTime,
    seekRequestId,
    lyrics,
    currentLyric,
    volume,
    isMuted,
    playMode,
    lastError,
    isEnded,
    // getters (computed)
    currentSong,
    currentTitle,
    currentArtist,
    hasPrevious,
    hasNext,
    isWaveActive,
    // actions
    load,
    play,
    pause,
    toggle,
    next,
    prev,
    seekByProgress,
    seekToTime,
    setPlaybackTime,
    setVolume,
    toggleMute,
    togglePlayMode,
    handleEnded,
    syncLyrics,
    resetPlaybackPosition,
    restoredSongKey,
    songPlaybackKey,
    // 辅助函数（如果外部需要可导出，目前保持私有）
  }
})
