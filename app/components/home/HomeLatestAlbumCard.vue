<template>
  <NuxtLink
      :to="album.path"
      :title="album.title"
      class="glass-panel interactive-card group relative origin-center overflow-hidden rounded-3xl shadow-xl transition duration-300 will-change-transform hover:scale-[1.02]"
  >
    <img
        :src="album.cover || siteConfig.defaultImage"
        referrerpolicy="no-referrer"
        alt=""
        class="absolute inset-0 size-full object-cover"
    >
    <div class="content-media-overlay absolute inset-0"/>
    <div class="absolute bottom-6 left-6 right-6">
      <h2
          class="home-card-title mt-stack-md line-clamp-2 text-size-card-title-lg overflow-visible underline underline-offset-8"
          style="text-decoration-color: var(--color-red-luoxiahong)"
      >
        {{ album.title || '' }}
      </h2>
      <p class="home-card-description mt-stack-xs line-clamp-2">{{ album.description || '' }}</p>
      <div class="size-fit flex mt-stack-md gap-3">
        <p class="home-card-eyebrow">最新相册</p>
        <p class="home-card-date">{{ album.date || ''}}</p>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type {HomeCardItem} from '~/data/home'
import {siteConfig} from "#shared/siteConfig";

withDefaults(defineProps<{
  album?: HomeCardItem
}>(), {
  album: () => ({
    path: '/albums',
    title: '',
    description: '',
    date: '',
    cover: ''
  })
})
</script>
