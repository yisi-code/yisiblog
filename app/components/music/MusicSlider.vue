<template>
  <div
      ref="trackRef"
      class="music-slider"
      :class="[
      orientation === 'vertical' ? 'music-slider--vertical' : '',
      { 'music-slider--active': isActive || isDragging }
    ]"
      role="slider"
      tabindex="0"
      :aria-orientation="orientation"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="Math.round(modelValue)"
      @mouseenter="isActive = true"
      @mouseleave="isActive = false"
      @pointerdown="startDrag"
      @keydown.left.prevent="nudge(-1)"
      @keydown.right.prevent="nudge(1)"
      @keydown.down.prevent="nudge(-1)"
      @keydown.up.prevent="nudge(1)"
  >
    <div class="music-slider__track">
      <div class="music-slider__fill" :style="fillStyle"/>
      <div class="music-slider__thumb" :style="thumbStyle"/>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  live?: boolean
}>(), {
  disabled: false,
  orientation: 'horizontal',
  live: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const trackRef = ref<HTMLElement | null>(null)
const isActive = ref(false)
const isDragging = ref(false)
const internalValue = ref(0)

const safeValue = computed(() => Math.min(100, Math.max(0, props.modelValue || 0)))
const displayValue = computed(() => isDragging.value ? internalValue.value : safeValue.value)
const fillStyle = computed(() => {
  if (props.orientation === 'vertical') return {height: `${displayValue.value}%`}
  return {width: `${displayValue.value}%`}
})
const thumbStyle = computed(() => {
  if (props.orientation === 'vertical') return {bottom: `${displayValue.value}%`}
  return {left: `${displayValue.value}%`}
})

watch(safeValue, (value) => {
  if (!isDragging.value) internalValue.value = value
}, {immediate: true})

function valueFromPointer(event: PointerEvent) {
  const rect = trackRef.value?.getBoundingClientRect()
  if (!rect || rect.width <= 0 || rect.height <= 0) return displayValue.value
  if (props.orientation === 'vertical') {
    return Math.min(100, Math.max(0, ((rect.bottom - event.clientY) / rect.height) * 100))
  }
  return Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
}

function updateFromPointer(event: PointerEvent, commit = false) {
  const value = valueFromPointer(event)
  internalValue.value = value
  if (!isDragging.value || commit || props.live) emit('update:modelValue', value)
  if (commit || props.live) emit('change', value)
}

function startDrag(event: PointerEvent) {
  if (props.disabled) return
  event.preventDefault()
  isDragging.value = true
  internalValue.value = safeValue.value
  trackRef.value?.setPointerCapture(event.pointerId)
  updateFromPointer(event)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, {once: true})
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value) return
  updateFromPointer(event)
}

function onPointerUp(event: PointerEvent) {
  if (!isDragging.value) return
  updateFromPointer(event, true)
  isDragging.value = false
  window.removeEventListener('pointermove', onPointerMove)
}

function nudge(step: number) {
  if (props.disabled) return
  const value = Math.min(100, Math.max(0, safeValue.value + step))
  emit('update:modelValue', value)
  emit('change', value)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
})
</script>
