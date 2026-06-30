<template>
  <header class="fixed left-0 right-0 top-4 z-30 px-content-inline">
    <nav class="glass-panel mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-content-inline py-content-block">
      <NuxtLink
          to="/"
          class="text-title flex items-center gap-2 font-black transition-transform duration-150 hover:-translate-y-1">
        <img
            :src="siteConfig.avatarUrl"
            referrerpolicy="no-referrer"
            alt=""
            class="h-8 w-8 rounded-full object-cover">
        <span>{{ siteConfig.navTitle }}</span>
        <span class="inline self-end" style="font-size: var(--font-size-normal); color: var(--color-text-hover)">{{ siteConfig.navSuffix }}</span>
        <span class="inline">{{ siteConfig.navAfter }}</span>
      </NuxtLink>

      <div
          class="flex items-center gap-1">
        <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link text-title relative rounded-xl px-content-inline py-control-block-compact text-size-content-body font-bold transition-transform duration-150 hover:-translate-y-1"
            :class="{ 'nav-link--active opacity-100': route.path === item.to }"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <button
          class="theme-switch shrink-0 duration-150 hover:scale-[1.1] transition-transform"
          type="button"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleTheme"
      >
        <span class="theme-switch__sky"/>
        <span class="theme-switch__night"/>
        <span class="theme-switch__icon theme-switch__icon--sun">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
                d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1.2a1 1 0 1 1 2 0V21a1 1 0 0 1-1 1Zm0-17.8a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1.2a1 1 0 0 1-1 1ZM4.93 20.07a1 1 0 0 1 0-1.42l.85-.85a1 1 0 1 1 1.42 1.42l-.85.85a1 1 0 0 1-1.42 0ZM16.8 8.2a1 1 0 0 1 0-1.42l.85-.85a1 1 0 1 1 1.42 1.42l-.85.85a1 1 0 0 1-1.42 0ZM2 13a1 1 0 1 1 0-2h1.2a1 1 0 1 1 0 2H2Zm18.8 0a1 1 0 1 1 0-2H22a1 1 0 1 1 0 2h-1.2ZM5.78 8.2l-.85-.85a1 1 0 1 1 1.42-1.42l.85.85A1 1 0 1 1 5.78 8.2Zm11.87 11.87-.85-.85a1 1 0 0 1 1.42-1.42l.85.85a1 1 0 0 1-1.42 1.42Z"/>
          </svg>
        </span>
        <span class="theme-switch__icon theme-switch__icon--moon">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 14.65A8.5 8.5 0 0 1 9.35 3a.75.75 0 0 0-.91-.91 10 10 0 1 0 13.47 13.47.75.75 0 0 0-.91-.91Z"/>
          </svg>
        </span>
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import {siteConfig} from '~/data'

const colorMode = useColorMode()
const route = useRoute()
const resolvedTheme = ref(colorMode.value === 'dark' ? 'dark' : 'light')
const isDark = computed(() => resolvedTheme.value === 'dark')
const navItems = [
  {label: '博文', to: '/posts'},
  {label: '相册', to: '/albums'},
  {label: '杂谈', to: '/chatter'},
  {label: '动态', to: '/moments'},
  {label: '项目', to: '/projects'},
  {label: '友链', to: '/friends'},
  {label: '关于', to: '/about'}
]

let htmlClassObserver: MutationObserver | undefined

function syncResolvedTheme() {
  if (!import.meta.client) {
    resolvedTheme.value = colorMode.value === 'dark' ? 'dark' : 'light'
    return
  }

  const htmlClassList = document.documentElement.classList
  if (htmlClassList.contains('dark')) {
    resolvedTheme.value = 'dark'
    return
  }
  if (htmlClassList.contains('light')) {
    resolvedTheme.value = 'light'
    return
  }

  resolvedTheme.value = colorMode.value === 'dark' ? 'dark' : 'light'
}

function toggleTheme() {
  const nextTheme = isDark.value ? 'light' : 'dark'
  colorMode.preference = nextTheme
  resolvedTheme.value = nextTheme
}

watch(() => colorMode.value, syncResolvedTheme)
watch(() => colorMode.preference, syncResolvedTheme)

onMounted(() => {
  syncResolvedTheme()
  htmlClassObserver = new MutationObserver(syncResolvedTheme)
  htmlClassObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onBeforeUnmount(() => {
  htmlClassObserver?.disconnect()
})
</script>
