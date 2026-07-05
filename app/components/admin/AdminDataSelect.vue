<template>
  <div
      ref="selectRef"
      class="admin-data-select user-select-none"
      :class="[
        selectClass,
        { 'admin-data-select--open': open }
      ]">
    <div class="admin-data-select__inner">
      <slot name="control" :open="open" :toggle="toggle" :close="close"/>
      <div v-if="open" class="admin-data-select__dropdown" :class="dropdownClass">
        <div class="admin-data-select__dropdown-container">
          <slot :close="close"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  selectClass?: string
  dropdownClass?: string
}>()

const selectRef = ref<HTMLElement | null>(null)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    close()
  }
}
</script>
