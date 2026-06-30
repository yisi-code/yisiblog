<template>
  <div
    ref="containerRef"
    class="search-box user-select-none"
    :class="{ 'search-box--open': isOpen && showDropdown }"
  >
    <div class="search-box__inner">
      <label :for="searchInputId" class="search-box__bar">
        <input
            :id="searchInputId"
            :value="modelValue"
            class="search-box__input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :aria-label="ariaLabel"
            :placeholder="placeholder"
            @focus="handleFocus"
            @input="emitValue"
            @keydown.enter.prevent="submitSearch"
        >
        <BaseIconButton
            v-if="modelValue"
            aria-label="清空搜索"
            size="md"
            shape="square"
            variant="soft"
            @click.stop="clearSearch"
        >
          <template #icon>
            <X class="search-box__clear-icon" :size="19" :stroke-width="2.4" />
          </template>
        </BaseIconButton>
        <BaseIconButton
            aria-label="搜索"
            size="md"
            shape="square"
            variant="soft"
            @click.stop="submitSearch"
        >
          <template #icon>
            <Search class="search-box__icon" :size="19" :stroke-width="2.4" />
          </template>
        </BaseIconButton>
      </label>
      <div v-if="isOpen && showDropdown" class="border-b pb-(--spacing-inline-gap-2xs)"/>
      <div v-if="isOpen && showDropdown" class="search-box__dropdown">
        <slot/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, X } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
  showDropdown?: boolean
}>(), {
  placeholder: '输入搜索关键词',
  ariaLabel: '站内搜索',
  showDropdown: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const searchInputId = useId()

watch(() => props.showDropdown, (value) => {
  if (value) isOpen.value = true
})

function emitValue(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  emit('update:modelValue', event.target.value)
}

function handleFocus() {
  if (props.showDropdown) isOpen.value = true
}

function submitSearch() {
  emit('search', props.modelValue)
  if (props.showDropdown) isOpen.value = true
}

function clearSearch() {
  emit('update:modelValue', '')
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>
