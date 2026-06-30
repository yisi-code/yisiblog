<template>
  <Teleport to="body">
    <div v-if="currentImage" class="album-preview" @click="closePreview">
      <BaseIconButton
        class="album-preview__close"
        aria-label="Close preview"
        title="Close preview"
        variant="soft"
        size="lg"
        shape="round"
        @click.stop="closePreview"
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </template>
      </BaseIconButton>

      <p v-if="currentImage.description" class="album-preview__caption absolute top-2">
        {{ currentImage.description }}
      </p>

      <button v-if="images.length > 1" type="button" class="moment-preview-nav moment-preview-nav--prev" @click.stop="prevImage">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <img
        :src="currentImage.url"
        referrerpolicy="no-referrer"
        :alt="currentImage.description || 'image preview'"
        @click.stop
      >

      <button v-if="images.length > 1" type="button" class="moment-preview-nav moment-preview-nav--next" @click.stop="nextImage">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div class="album-preview__caption bottom-2">{{ currentIndex + 1 }} / {{ images.length }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
export type PreviewImage = {
  url: string
  description?: string
}

const props = withDefaults(defineProps<{
  images: PreviewImage[]
  index?: number
}>(), {
  index: 0
})

const emit = defineEmits<{
  close: []
  'update:index': [value: number]
}>()

const currentIndex = computed(() => {
  if (!props.images.length) return 0
  return Math.min(Math.max(props.index, 0), props.images.length - 1)
})

const currentImage = computed(() => props.images[currentIndex.value])

function closePreview() {
  emit('close')
}

function nextImage() {
  if (!props.images.length) return
  emit('update:index', (currentIndex.value + 1) % props.images.length)
}

function prevImage() {
  if (!props.images.length) return
  emit('update:index', (currentIndex.value - 1 + props.images.length) % props.images.length)
}
</script>
