<template>
  <NuxtLink
      :to="to"
      class="glass-panel interactive-card group relative flex h-fit origin-center flex-col
       justify-center overflow-hidden rounded-3xl p-card-inset shadow-xl transition duration-150
        hover:scale-[1.02]"
      :title="description"
  >
    <div class="size-fit flex items-end gap-3">
      <p class="home-card-eyebrow">{{ eyebrow }}</p>
      <p v-if="date" class="home-card-date home-card--plain">{{ date }}</p>
    </div>

    <p class="home-card-description home-card--plain mt-stack-xs line-clamp-2">
      {{ description }}
    </p>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  description: string
  date?: string
  to: string
}>()
</script>
