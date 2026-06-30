<template>
  <div class="w-full h-max flex flex-row gap-6">
    <div class="w-fit h-fit">
      <ProfileCard :stats="stats" />
    </div>
    <div class="flex-1">
      <ClientOnly>
        <CloudPlayer />
        <template #fallback>
          <section class="glass-panel interactive-card group relative flex h-full origin-center items-center justify-center overflow-hidden rounded-3xl p-card-inset transition duration-300 will-change-transform hover:scale-[1.02]">
            <NuxtLink
              to="/music"
              class="music-page-entry"
              aria-label="进入音乐页"
              title="进入音乐页"
            >
              <span class="music-page-entry__disc" aria-hidden="true">
                <span class="music-page-entry__core" />
              </span>
            </NuxtLink>
            <span class="text-secondary animate-pulse text-size-content-body font-black tracking-widest">连接中...</span>
          </section>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HomeStatItem } from '~/data/home'

defineProps<{
  stats: HomeStatItem[]
}>()
</script>
