type DragPosition = {
  x: number
  y: number
}

type DragStartPosition = DragPosition & {
  left: number
  top: number
}

type EdgeSnapOptions = {
  dragMoveThreshold?: number
  overflowResetRatio?: number
}

const defaultDragMoveThreshold = 0
const defaultOverflowResetRatio = 1 / 3

export function useDraggableEdgeSnap(options: EdgeSnapOptions = {}) {
  const draggableRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const hasDragged = ref(false)
  const position = ref<DragPosition>({ x: 0, y: 0 })
  const dragStart = ref<DragStartPosition>({ x: 0, y: 0, left: 0, top: 0 })

  const dragMoveThreshold = computed(() => options.dragMoveThreshold ?? defaultDragMoveThreshold)
  const overflowResetRatio = computed(() => options.overflowResetRatio ?? defaultOverflowResetRatio)

  const draggableStyle = computed(() => ({
    transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`
  }))

  function startDrag(event: PointerEvent) {
    if (event.button !== 0) return false

    dragStart.value = {
      x: event.clientX,
      y: event.clientY,
      left: position.value.x,
      top: position.value.y
    }

    isDragging.value = true
    hasDragged.value = false
    window.addEventListener('pointermove', drag)
    return true
  }

  function drag(event: PointerEvent) {
    if (!isDragging.value) return
    const diffX = event.clientX - dragStart.value.x
    const diffY = event.clientY - dragStart.value.y

    if (!hasDragged.value && Math.abs(diffX) <= dragMoveThreshold.value && Math.abs(diffY) <= dragMoveThreshold.value) return

    hasDragged.value = true

    position.value = {
      x: dragStart.value.left + diffX,
      y: dragStart.value.top + diffY
    }
  }

  function stopDrag() {
    if (!isDragging.value) return false

    isDragging.value = false
    window.removeEventListener('pointermove', drag)
    snapOverflowedEdge()
    return hasDragged.value
  }

  function cancelDrag() {
    isDragging.value = false
    hasDragged.value = false
    window.removeEventListener('pointermove', drag)
  }

  function snapOverflowedEdge() {
    const element = draggableRef.value
    if (!element) return

    const rect = element.getBoundingClientRect()
    const ratio = Math.max(0, overflowResetRatio.value)
    let nextX = position.value.x
    let nextY = position.value.y

    if (rect.left < -rect.width * ratio) {
      nextX += -rect.left
    } else if (rect.right > window.innerWidth + rect.width * ratio) {
      nextX += window.innerWidth - rect.right
    }

    if (rect.top < -rect.height * ratio) {
      nextY += -rect.top
    } else if (rect.bottom > window.innerHeight + rect.height * ratio) {
      nextY += window.innerHeight - rect.bottom
    }

    if (nextX !== position.value.x || nextY !== position.value.y) {
      position.value = { x: nextX, y: nextY }
    }
  }

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', drag)
  })

  return {
    draggableRef,
    draggableStyle,
    drag,
    hasDragged,
    isDragging,
    position,
    startDrag,
    stopDrag,
    cancelDrag,
    snapOverflowedEdge
  }
}
