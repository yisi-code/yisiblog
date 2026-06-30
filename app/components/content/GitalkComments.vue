<template>
  <ClientOnly>
    <section
      v-if="isConfigured"
      class="gitalk-panel custom-gitalk-glass"
      :class="[
        `gitalk-panel--${variant}`,
        {
          'gitalk-panel--loading': isLoading,
          'gitalk-panel--ready': isReady,
          'gitalk-panel--guest': !isLoggedIn,
          'gitalk-panel--empty': !hasComments
        }
      ]"
      @click.capture="guardGuestAction"
      @focusin.capture="guardGuestAction"
      @input.capture="guardGuestAction"
      @keydown.capture="guardGuestAction"
      @submit.capture="guardGuestAction"
    >
      <div class="gitalk-panel__head">
        <div>
          <h2 class="gitalk-panel__title">{{ variant === 'moment' ? '片刻回声' : '评论区' }}</h2>
          <p class="gitalk-panel__eyebrow">GitHub Issues</p>
        </div>
        <span class="gitalk-panel__status">
          {{ isLoading ? '正在加载 Gitalk' : (isLoggedIn ? '已登录' : '未登录') }}
        </span>
      </div>

      <div class="gitalk-panel__body">
        <div v-if="isLoading" class="gitalk-panel__state-card gitalk-panel__loader" aria-live="polite">
          <span class="gitalk-panel__loader-ring" aria-hidden="true">
            <i />
            <i />
          </span>
          <strong>正在接入评论星轨</strong>
          <small>GitHub Issues 评论区加载中...</small>
        </div>

        <div v-else-if="!isLoggedIn" class="gitalk-panel__state-card gitalk-panel__guest-card">
          <span class="gitalk-panel__guest-mark" aria-hidden="true">GH</span>
          <div class="gitalk-panel__guest-copy">
            <strong>登录 GitHub 后留言</strong>
            <span>{{ hasComments ? '当前仅展示已有讨论。登录后即可发布、回复或点赞。' : '这里还没有评论。登录后可以留下第一句话。' }}</span>
          </div>
          <button class="gitalk-panel__login-button" type="button" @click="requestLogin">
            使用 GitHub 登录
          </button>
        </div>

        <div ref="containerRef" class="gitalk-panel__mount" />

        <div v-if="!isLoading && !hasComments" class="gitalk-panel__state-card gitalk-panel__empty-card">
          <strong>当前还没有评论</strong>
          <span>写下第一条评论，让这个角落有一点回声。</span>
        </div>
      </div>
    </section>

    <div v-else :class="fallbackClass">
      <slot name="fallback">
        <h2 class="article-comments__title">评论</h2>
        <p class="article-comments__desc">
          Gitalk 已安装。请在环境变量中补充 Gitalk OAuth 配置以启用评论。
        </p>
      </slot>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import 'gitalk/dist/gitalk.css'
import { siteConfig } from '~/data'

type GitalkRuntimeConfig = {
  clientID?: string
  clientSecretConfigured?: boolean
  repo?: string
  owner?: string
  admin?: string[]
}

const props = withDefaults(defineProps<{
  commentPath: string
  fallbackClass?: string
  variant?: 'article' | 'moment'
}>(), {
  fallbackClass: 'article-comments__fallback',
  variant: 'article'
})

const runtimeConfig = useRuntimeConfig()
const containerRef = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const isReady = ref(false)
const isLoggedIn = ref(false)
const hasComments = ref(false)
let observer: MutationObserver | undefined
let readyTimer: number | undefined
let fallbackTimer: number | undefined

const normalizedCommentPath = computed(() => props.commentPath.replace(/^\/+|\/+$/g, '') || 'home')
const variant = computed(() => props.variant)

const gitalkConfig = computed(() => {
  const runtimeGitalk = runtimeConfig.public.gitalk as GitalkRuntimeConfig | undefined
  return {
    clientID: runtimeGitalk?.clientID || siteConfig.gitalkConfig.clientID,
    clientSecret: runtimeGitalk?.clientSecretConfigured ? 'server-proxy-secret' : siteConfig.gitalkConfig.clientSecret,
    repo: runtimeGitalk?.repo || siteConfig.gitalkConfig.repo,
    owner: runtimeGitalk?.owner || siteConfig.gitalkConfig.owner,
    admin: runtimeGitalk?.admin?.length ? runtimeGitalk.admin : siteConfig.gitalkConfig.admin.filter(Boolean)
  }
})

const isConfigured = computed(() => {
  const config = gitalkConfig.value
  return Boolean(config.clientID && config.clientSecret && config.repo && config.owner && config.admin.length)
})

function cleanOAuthCode() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('code')) return
  url.searchParams.delete('code')
  window.history.replaceState({}, document.title, url.toString())
}

function clearTimers() {
  if (readyTimer) window.clearTimeout(readyTimer)
  if (fallbackTimer) window.clearTimeout(fallbackTimer)
  readyTimer = undefined
  fallbackTimer = undefined
}

function stopObserver() {
  observer?.disconnect()
  observer = undefined
  clearTimers()
}

function markReady() {
  isLoading.value = false
  isReady.value = true
  if (fallbackTimer) window.clearTimeout(fallbackTimer)
  fallbackTimer = undefined
}

function updateGitalkState() {
  const container = containerRef.value
  if (!container) return

  isLoggedIn.value = Boolean(container.querySelector('.gt-btn-public, .gt-action-logout'))
  hasComments.value = Boolean(container.querySelector('.gt-comment'))

  const hasSettledContent = Boolean(
    container.querySelector('.gt-header, .gt-comments, .gt-no-init, .gt-error')
  )
  const isGitalkStillIniting = Boolean(container.querySelector('.gt-initing'))

  if (hasSettledContent && !isGitalkStillIniting) {
    if (readyTimer) window.clearTimeout(readyTimer)
    readyTimer = window.setTimeout(markReady, 80)
  }
}

function watchGitalkDom() {
  const container = containerRef.value
  if (!container) return

  stopObserver()
  observer = new MutationObserver(updateGitalkState)
  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true
  })
  updateGitalkState()
}

function isLoginTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.gt-btn-login, .gt-action-login, .gt-avatar-github'))
}

function isGuestOnlyTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest([
    '.gt-header-textarea',
    '.gt-btn-preview',
    '.gt-btn-public',
    '.gt-comment-like',
    '.gt-comment-reply',
    '.gt-comment-edit',
    '.gt-comments-controls'
  ].join(',')))
}

function guardGuestAction(event: Event) {
  if (isLoggedIn.value || isLoginTarget(event.target)) return
  if (!isGuestOnlyTarget(event.target)) return

  event.preventDefault()
  event.stopPropagation()

  if ('stopImmediatePropagation' in event) {
    event.stopImmediatePropagation()
  }
}

function requestLogin() {
  const loginButton = containerRef.value?.querySelector<HTMLElement>(
    '.gt-btn-login, .gt-action-login, .gt-avatar-github'
  )
  loginButton?.click()
}

async function renderGitalk() {
  if (!containerRef.value || !isConfigured.value) return

  stopObserver()
  isLoading.value = true
  isReady.value = false
  isLoggedIn.value = false
  hasComments.value = false
  containerRef.value.innerHTML = ''

  try {
    const { default: Gitalk } = await import('gitalk')
    const commentPath = normalizedCommentPath.value
    const pageUrl = window.location.href
    const gitalk = new Gitalk({
      ...gitalkConfig.value,
      proxy: '/api/github',
      id: commentPath.substring(0, 49),
      title: commentPath.substring(0, 80),
      body: pageUrl,
      distractionFreeMode: false
    })

    gitalk.render(containerRef.value)
    cleanOAuthCode()
    watchGitalkDom()
    fallbackTimer = window.setTimeout(() => {
      updateGitalkState()
      markReady()
    }, 8000)
  } catch {
    markReady()
  }
}

onMounted(() => {
  nextTick(renderGitalk)
})

watch(normalizedCommentPath, () => {
  nextTick(renderGitalk)
})

onBeforeUnmount(() => {
  stopObserver()
})
</script>
