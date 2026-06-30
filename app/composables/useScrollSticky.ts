import type { Ref } from 'vue'

type StickyLength = number | string

type ScrollStickyOptions = {
  top?: StickyLength
  triggerAdvance?: StickyLength
}

type StyleSnapshot = {
  position: string
  top: string
  left: string
  right: string
  bottom: string
  width: string
}

export function useScrollSticky(targetRef: Ref<HTMLElement | null>, options: ScrollStickyOptions = {}) {
  let resizeObserver: ResizeObserver | undefined
  let ticking = false
  let isSticky = false
  let savedTarget: HTMLElement | null = null

  const originalStyle: StyleSnapshot = {
    position: '',
    top: '',
    left: '',
    right: '',
    bottom: '',
    width: ''
  }

  const stickyMetrics = {
    left: 0,
    width: 0,
    top: 0,
    threshold: 0
  }

  function getScrollTop() {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  }

  function resolveLength(value: StickyLength | undefined, fallback = 0) {
    if (typeof value === 'number') return value
    if (!value) return fallback

    const amount = Number.parseFloat(value)
    if (Number.isNaN(amount)) return fallback

    if (value.endsWith('rem')) {
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      return amount * rootFontSize
    }

    return amount
  }

  function saveOriginalStyle(target: HTMLElement) {
    originalStyle.position = target.style.position
    originalStyle.top = target.style.top
    originalStyle.left = target.style.left
    originalStyle.right = target.style.right
    originalStyle.bottom = target.style.bottom
    originalStyle.width = target.style.width
  }

  function restoreOriginalStyle(target: HTMLElement) {
    target.style.position = originalStyle.position
    target.style.top = originalStyle.top
    target.style.left = originalStyle.left
    target.style.right = originalStyle.right
    target.style.bottom = originalStyle.bottom
    target.style.width = originalStyle.width
  }

  function applySticky(target: HTMLElement) {
    target.style.position = 'fixed'
    target.style.top = `${stickyMetrics.top}px`
    target.style.left = `${stickyMetrics.left}px`
    target.style.right = 'auto'
    target.style.bottom = 'auto'
    target.style.width = `${stickyMetrics.width}px`
    isSticky = true
  }

  function cancelSticky(target: HTMLElement) {
    restoreOriginalStyle(target)
    isSticky = false
  }

  function updateMetrics() {
    const target = targetRef.value
    if (!target || !import.meta.client) return

    const shouldReapply = isSticky
    if (shouldReapply) restoreOriginalStyle(target)

    const top = resolveLength(options.top, 0)
    const triggerAdvance = resolveLength(options.triggerAdvance, 0)
    const rect = target.getBoundingClientRect()
    const absoluteTop = getScrollTop() + rect.top

    stickyMetrics.left = rect.left
    stickyMetrics.width = rect.width
    stickyMetrics.top = top
    stickyMetrics.threshold = Math.max(0, absoluteTop - top - triggerAdvance)

    if (shouldReapply) applySticky(target)
  }

  function updateStickyState() {
    const target = targetRef.value
    if (!target || !import.meta.client) return

    const shouldStick = getScrollTop() > stickyMetrics.threshold
    if (shouldStick && !isSticky) applySticky(target)
    else if (!shouldStick && isSticky) cancelSticky(target)
  }

  function requestUpdate() {
    if (ticking || !import.meta.client) return
    ticking = true
    window.requestAnimationFrame(() => {
      ticking = false
      updateStickyState()
    })
  }

  function requestMetricsUpdate() {
    if (!import.meta.client) return
    window.requestAnimationFrame(() => {
      updateMetrics()
      updateStickyState()
    })
  }

  onMounted(() => {
    const target = targetRef.value
    if (!target) return

    savedTarget = target
    saveOriginalStyle(target)
    updateMetrics()
    updateStickyState()

    resizeObserver = new ResizeObserver(requestMetricsUpdate)
    resizeObserver.observe(target)
    window.addEventListener('resize', requestMetricsUpdate)
    window.addEventListener('scroll', requestUpdate, { passive: true })
  })

  onBeforeUnmount(() => {
    if (savedTarget && isSticky) restoreOriginalStyle(savedTarget)
    resizeObserver?.disconnect()
    window.removeEventListener('resize', requestMetricsUpdate)
    window.removeEventListener('scroll', requestUpdate)
  })

  watch(targetRef, (target, previousTarget) => {
    if (previousTarget && isSticky) restoreOriginalStyle(previousTarget)
    resizeObserver?.disconnect()
    resizeObserver = undefined
    isSticky = false

    if (!target || !import.meta.client) return

    savedTarget = target
    saveOriginalStyle(target)
    updateMetrics()
    updateStickyState()
    resizeObserver = new ResizeObserver(requestMetricsUpdate)
    resizeObserver.observe(target)
  })
}
