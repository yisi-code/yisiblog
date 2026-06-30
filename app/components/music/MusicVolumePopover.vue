<template>
  <div
    class="music-volume-popover"
    :class="[
      `music-volume-popover--${placement}`,
      `music-volume-popover--${orientation}`
    ]"
  >
    <div class="music-volume-popover__panel">
      <MusicSlider
        :model-value="modelValue"
        :orientation="orientation"
        live
        @update:model-value="emit('update:modelValue', $event)"
        @change="emit('change', $event)"
      />
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: number
  orientation?: 'horizontal' | 'vertical'
  placement?: 'top' | 'right'
}>(), {
  orientation: 'horizontal',
  placement: 'right'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()
</script>
