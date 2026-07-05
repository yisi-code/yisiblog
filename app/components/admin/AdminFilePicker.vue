<template>
  <label class="admin-data-button">
    <Upload :size="17" aria-hidden="true"/>
    {{ label }}
    <input
        class="admin-data-file"
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="handleChange">
  </label>
</template>

<script setup lang="ts">
import { Upload } from '@lucide/vue'

withDefaults(defineProps<{
  label: string
  accept?: string
  multiple?: boolean
}>(), {
  accept: undefined,
  multiple: false
})

const emit = defineEmits<{
  change: [files: File[]]
}>()

function handleChange(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  emit('change', Array.from(event.target.files || []))
  event.target.value = ''
}
</script>
