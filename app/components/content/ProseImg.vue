<template>
  <component
    :is="ImageComponent"
    :src="refinedSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :style="style"
    referrerpolicy="no-referrer"
    loading="lazy"
    decoding="async"
  />
</template>

<script setup lang="ts">
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'
import ImageComponent from '#build/mdc-image-component.mjs'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
  style?: string
}>(), {
  src: '',
  alt: '',
  width: undefined,
  height: undefined,
  style: undefined
})

const { src, alt, width, height, style } = toRefs(props)
const runtimeConfig = useRuntimeConfig()

const refinedSrc = computed(() => {
  if (src.value?.startsWith('/') && !src.value.startsWith('//')) {
    const baseUrl = withLeadingSlash(withTrailingSlash(runtimeConfig.app.baseURL))
    if (baseUrl !== '/' && !src.value.startsWith(baseUrl)) {
      return joinURL(baseUrl, src.value)
    }
  }

  return src.value
})
</script>
