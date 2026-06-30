import type { Ref } from 'vue'

export function useAdaptiveSticky(targetRef: Ref<HTMLElement | null>, topGap = 112, bottomGap = 24) {
  let resizeObserver: ResizeObserver | undefined
  let ticking = false

  function update() {
    const target = targetRef.value
    if (!target || !import.meta.client) return

    const viewportHeight = window.innerHeight
    const targetHeight = target.offsetHeight
    const top = targetHeight + topGap <= viewportHeight
      ? topGap
      : Math.min(topGap, viewportHeight - targetHeight - bottomGap)

    target.style.setProperty('--article-sidebar-sticky-top', `${top}px`)
  }

  function requestUpdate() {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(() => {
      ticking = false
      update()
    })
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', requestUpdate)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    if (targetRef.value) {
      resizeObserver = new ResizeObserver(requestUpdate)
      resizeObserver.observe(targetRef.value)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', requestUpdate)
    window.removeEventListener('scroll', requestUpdate)
    resizeObserver?.disconnect()
  })

  watch(targetRef, (target, previousTarget) => {
    if (!resizeObserver) return
    if (previousTarget) resizeObserver.unobserve(previousTarget)
    if (target) resizeObserver.observe(target)
    requestUpdate()
  })
}
