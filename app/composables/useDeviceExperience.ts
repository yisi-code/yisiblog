import { ref, readonly, onMounted, onBeforeUnmount } from 'vue'

export type ViewportClass = 'narrow' | 'medium' | 'wide' | 'ultra'
export type DeviceClass = 'phone' | 'tablet' | 'desktop' | 'hybrid'

export interface DeviceInputState {
  coarsePointer: boolean
  finePointer: boolean
  hover: boolean
  touchPoints: number
}

export interface DevicePreferenceState {
  reduceMotion: boolean
  saveData: boolean
}

export interface DeviceExperienceState {
  viewportClass: ViewportClass
  deviceClass: DeviceClass
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  input: DeviceInputState
  preferences: DevicePreferenceState
}

const breakpoints = {
  narrow: 640,
  medium: 1024,
  wide: 1440
}

const defaultState: DeviceExperienceState = {
  viewportClass: 'wide',
  deviceClass: 'desktop',
  width: 0,
  height: 0,
  orientation: 'landscape',
  input: {
    coarsePointer: false,
    finePointer: true,
    hover: true,
    touchPoints: 0
  },
  preferences: {
    reduceMotion: false,
    saveData: false
  }
}

const state = ref<DeviceExperienceState>({ ...defaultState })

let initialized = false
let mountedCount = 0
let ticking = false
let mediaQueries: MediaQueryList[] = []

function getConnectionSaveData() {
  const navigatorWithConnection = navigator as Navigator & {
    connection?: { saveData?: boolean }
  }
  return navigatorWithConnection.connection?.saveData === true
}

function getOrientation(width: number, height: number): DeviceExperienceState['orientation'] {
  return height > width ? 'portrait' : 'landscape'
}

function resolveViewportClass(width: number): ViewportClass {
  if (width < breakpoints.narrow) return 'narrow'
  if (width < breakpoints.medium) return 'medium'
  if (width < breakpoints.wide) return 'wide'
  return 'ultra'
}

function resolveDeviceClass(width: number, input: DeviceInputState): DeviceClass {
  const isTouchOnly = input.coarsePointer && !input.hover && input.touchPoints > 0
  const isDesktopLike = input.finePointer && input.hover

  if (isDesktopLike && input.touchPoints > 0) return 'hybrid'
  if (isDesktopLike) return 'desktop'
  if (isTouchOnly && width < breakpoints.narrow) return 'phone'
  if (isTouchOnly) return 'tablet'
  if (input.touchPoints > 0 && width < breakpoints.medium) return 'tablet'
  if (width < breakpoints.narrow) return 'phone'
  return 'desktop'
}

function detectDeviceExperience(): DeviceExperienceState {
  const width = window.innerWidth
  const height = window.innerHeight
  const input: DeviceInputState = {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    finePointer: window.matchMedia('(pointer: fine)').matches,
    hover: window.matchMedia('(hover: hover)').matches,
    touchPoints: navigator.maxTouchPoints || 0
  }
  const preferences: DevicePreferenceState = {
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: getConnectionSaveData()
  }
  const viewportClass = resolveViewportClass(width)
  const deviceClass = resolveDeviceClass(width, input)

  return {
    viewportClass,
    deviceClass,
    width,
    height,
    orientation: getOrientation(width, height),
    input,
    preferences
  }
}

function updateDeviceExperience() {
  if (!import.meta.client) return
  state.value = detectDeviceExperience()
}

function requestUpdate() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(() => {
    ticking = false
    updateDeviceExperience()
  })
}

function addMediaQueryListener(query: string) {
  const mediaQuery = window.matchMedia(query)
  mediaQuery.addEventListener('change', requestUpdate)
  mediaQueries.push(mediaQuery)
}

export function useDeviceExperience() {
  onMounted(() => {
    mountedCount += 1
    updateDeviceExperience()

    if (initialized) return
    initialized = true

    window.addEventListener('resize', requestUpdate, { passive: true })
    window.addEventListener('orientationchange', requestUpdate, { passive: true })

    addMediaQueryListener('(pointer: coarse)')
    addMediaQueryListener('(pointer: fine)')
    addMediaQueryListener('(hover: hover)')
    addMediaQueryListener('(prefers-reduced-motion: reduce)')
  })

  onBeforeUnmount(() => {
    if (!initialized || !import.meta.client) return
    mountedCount = Math.max(0, mountedCount - 1)
    if (mountedCount > 0) return

    window.removeEventListener('resize', requestUpdate)
    window.removeEventListener('orientationchange', requestUpdate)
    mediaQueries.forEach((mediaQuery) => mediaQuery.removeEventListener('change', requestUpdate))
    mediaQueries = []
    initialized = false
  })

  return {
    deviceExperience: readonly(state),
    breakpoints
  }
}