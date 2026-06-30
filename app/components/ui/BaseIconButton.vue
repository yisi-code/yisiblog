<template>
  <button
    type="button"
    class="base-icon-button"
    :class="[
      `base-icon-button--${variant}`,
      `base-icon-button--${size}`,
      `base-icon-button--${shape}`,
      {
        'base-icon-button--active': active,
        'base-icon-button--icon-only': !$slots.default
      }
    ]"
    :aria-label="ariaLabel || title"
    :title="title || ariaLabel"
    :disabled="disabled"
  >
    <span class="base-icon-button__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span v-if="$slots.default" class="base-icon-button__label">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  ariaLabel?: string
  title?: string
  variant?: 'plain' | 'soft' | 'primary'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'square' | 'round' | 'pill'
  active?: boolean
  disabled?: boolean
}>(), {
  ariaLabel: '',
  title: '',
  variant: 'plain',
  size: 'md',
  shape: 'round',
  active: false,
  disabled: false
})
</script>
