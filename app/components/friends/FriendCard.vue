<template>
  <a
    :href="friend.url"
    target="_blank"
    rel="noopener noreferrer"
    class="friend-card content-card-surface group relative flex min-h-44 flex-col overflow-hidden no-underline"
  >
    <span class="friend-card__glow absolute -bottom-10 -right-10 h-32 w-32 rounded-full" />

    <span class="relative z-[1] flex min-w-0 items-center gap-4">
      <span class="friend-card__avatar grid h-16 w-16 shrink-0 place-items-center rounded-full p-control-inset-compact">
        <img :src="friend.cover" :alt="friend.title" referrerpolicy="no-referrer" class="h-full w-full rounded-[inherit] object-cover">
      </span>

      <span class="flex min-w-0 flex-col gap-1">
        <span class="friend-card__name block overflow-hidden text-ellipsis whitespace-nowrap">{{ friend.title }}</span>
        <span class="friend-card__status inline-flex items-center gap-[0.35rem]">
          <span class="friend-card__status-dot h-2 w-2 rounded-full" />
          Online
        </span>
      </span>
    </span>

    <span class="friend-card__description relative z-[1] mt-stack-lg overflow-hidden">
      {{ friend.description }}
    </span>
  </a>
</template>

<script setup lang="ts">
import type { Friend } from '~/data'

defineProps<{
  friend: Friend
}>()
</script>
