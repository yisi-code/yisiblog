<template>
  <section
      class="glass-panel w-fit group flex h-20 origin-center flex-row items-stretch overflow-hidden rounded-3xl shadow-xl">
    <div
        class="text-title flex flex-1 flex-wrap items-center justify-between gap-6 px-panel-inline py-0 text-size-content-body font-black">
      <ClientOnly>
        <div class="flex items-center gap-2">
          <span class="h-3 w-3 animate-pulse rounded-full" style="background-color: var(--color-red-luoxiahong)"/>
          <span class="text-center">已稳定运行</span>
          <span class="text-accent text-center">{{ uptimeText }}</span>
        </div>
      </ClientOnly>

      <div class="flex flex-wrap gap-3">
        <span
            v-for="badge in badges"
            :key="badge.name"
            class="surface-border flex items-center gap-1 surface-soft rounded-md px-chip-inline py-control-block-compact shadow-xl"
        >
          <span class="h-2.5 w-2.5 rounded-full" :class="badge.dotClass"/>
          {{ badge.name }}
        </span>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import {siteConfig} from '~/data'


const uptimeText = ref('0 天 0 小时')
const startDate = new Date((siteConfig as { buildDate?: string }).buildDate || '2026-06-22T00:00:00').getTime()

const badges = [
  {name: 'Nuxt 4', dotClass: 'status-dot-emerald'},
  {name: 'Vue 3', dotClass: 'status-dot-success'},
  {name: 'Tailwind 4', dotClass: 'status-dot-cyan'}
]

function updateTime() {
  const now = new Date()

  const diff = Math.max(0, now.getTime() - startDate)

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  uptimeText.value = `${days} 天 ${hours} 时 ${minutes} 分 ${seconds} 秒`
}

onMounted(() => {
  updateTime()
  const timer = window.setInterval(updateTime, 1000)
  onBeforeUnmount(() => window.clearInterval(timer))
})
</script>
