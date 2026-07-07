<template>
  <section
      class="glass-panel interactive-card group relative flex h-full origin-center flex-col
       overflow-hidden rounded-3xl p-profile-card-inset duration-300 hover:scale-[1.02] transition-transform"
  >
    <div class="relative z-10 flex items-center justify-between">
      <div class="flex w-fit items-center gap-6">
        <button
            type="button"
            class="avatar-ring shrink-0 cursor-pointer rounded-2xl p-control-inset-compact shadow-lg transition hover:rotate-3"
            @click="navigateTo('/about')">
          <img
              :src="siteConfig.avatarUrl" referrerpolicy="no-referrer" alt="头像"
              class="avatar-surface h-24 w-24 rounded-xl object-cover">
        </button>
        <div class="flex flex-col">
          <MusicTextButton
              class="text-title text-size-card-title font-black leading-snug tracking-wide"
              :text="siteConfig.authorName"
              @click="navigateTo('/about')"
          />
          <MusicTextButton
              class="text-secondary text-size-content-body font-bold mt-stack-xs max-w-md leading-relaxed"
              :text="siteConfig.bio"
              multiline
              @click="navigateTo('/about')"
          />
          <div class="relative flex w-fit gap-2 mt-stack-xs">
            <div v-for="(stat, index) in stats" :key="stat.label" class="contents">
              <NuxtLink
                  :to="stat.path"
                  class="group/stat block w-fit rounded-2xl px-chip-inline text-center transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-ring-accent-soft)]"
                  :aria-label="`查看${stat.label}`"
              >
                <div
                    class="text-size-card-title-lg font-black group-hover/stat:scale-110"
                    :style="`color: ${stat.color}`">
                  {{ stat.value }}
                </div>
                <div
                    class="text-secondary mt-stack-xs text-size-helper-note font-black group-hover/stat:scale-110">
                  {{ stat.label }}
                </div>
              </NuxtLink>
              <div v-if="index < stats.length - 1" class="divider-line block h-10 w-px"/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-stack-md flex flex-row justify-between items-center">
      <ClientOnly>
        <div class="relative overflow-hidden text-size-card-title-lg font-black">
          {{ timeText || '00:00:00' }}
        </div>
      </ClientOnly>

      <div class="flex w-auto gap-3" @click.stop>
        <a
            v-for="link in externalLinks"
            :key="link.type"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="surface-border icon-button-surface grid h-10 w-10 place-items-center rounded-xl shadow-sm"
            :title="link.type"
        >
          <SocialIcon :type="link.type"/>
        </a>
        <button
            v-for="item in copyLinks"
            :key="item.type"
            type="button"
            class="surface-border icon-button-surface grid h-10 w-10 cursor-pointer place-items-center rounded-xl shadow-sm"
            :title="copied === item.type ? '已复制' : socialLabel(item.type)"
            @click="copyToClipboard(item.value, item.type)"
        >
          <SocialIcon :type="item.type"/>
        </button>
      </div>
    </div>


  </section>
</template>

<script setup lang="ts">
import {siteConfig} from '~/data'
import type {HomeStatItem} from '~/data/home'

withDefaults(defineProps<{
  stats?: HomeStatItem[]
}>(), {
  stats: () => []
})

const copied = ref('')
const {showToast} = useToast()
const timeText = ref('')

const externalLinks = computed(() => [
  {type: 'github', url: siteConfig.social?.github},
  {type: 'gitee', url: siteConfig.social?.gitee},
].filter((item): item is { type: string; url: string } => Boolean(item.url)))

const copyLinks = computed(() => [
  {type: 'email', value: siteConfig.social?.email},
  {type: 'wechat', value: siteConfig.social?.wechat}
].filter((item): item is { type: string; value: string } => Boolean(item.value)))

async function copyToClipboard(value: string, type: string) {
  await navigator.clipboard?.writeText(value).catch(() => undefined)
  copied.value = type
  showToast(`${socialLabel(type)} 已复制`, 'success')
  window.setTimeout(() => {
    if (copied.value === type) copied.value = ''
  }, 1500)
}

function socialLabel(type: string) {
  const labels: Record<string, string> = {
    github: 'GitHub',
    gitee: 'Gitee',
    email: '邮箱',
    wechat: '微信'
  }
  return labels[type] || type
}

function updateTime() {
  const now = new Date()
  timeText.value = now.toLocaleTimeString('en-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateTime()
  const timer = window.setInterval(updateTime, 1000)
  onBeforeUnmount(() => window.clearInterval(timer))
})

</script>
