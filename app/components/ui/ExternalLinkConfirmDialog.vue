<template>
  <Teleport to="body">
    <Transition name="external-link-dialog-fade">
      <div
        v-if="isVisible"
        class="external-link-dialog"
        role="presentation"
        @click.self="handleCancel"
      >
        <section
          class="external-link-dialog__container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="external-link-dialog-title"
          aria-describedby="external-link-dialog-content"
        >
          <button
            type="button"
            class="external-link-dialog__close"
            aria-label="关闭站外链接跳转提示"
            title="关闭"
            @click="handleCancel"
          >
            <X :size="18" :stroke-width="2.5" aria-hidden="true" />
          </button>

          <div class="external-link-dialog__inner">
            <h2 id="external-link-dialog-title" class="external-link-dialog__title">
              站外链接跳转提示
            </h2>
            <p id="external-link-dialog-content" class="external-link-dialog__content">
              确定要跳转至第三方网站{{ targetHost }}吗？
            </p>
            <div class="external-link-dialog__actions">
              <button
                type="button"
                class="external-link-dialog__button external-link-dialog__button--cancel"
                @click="handleCancel"
              >
                取消
              </button>
              <button
                type="button"
                class="external-link-dialog__button external-link-dialog__button--confirm"
                @click="handleConfirm"
              >
                确定
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

type PendingExternalLink = {
  url: string
  host: string
}

const isVisible = ref(false)
const pendingLink = ref<PendingExternalLink | null>(null)
const runtimeConfig = useRuntimeConfig()

const targetHost = computed(() => pendingLink.value?.host || '')

const siteOrigins = computed(() => {
  const origins = new Set<string>()

  if (import.meta.client) origins.add(window.location.origin)

  const siteUrl = runtimeConfig.public.siteUrl
  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin)
    } catch {
      // 忽略无效配置，继续使用当前页面 origin 判断。
    }
  }

  return origins
})

function findAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  return target.closest<HTMLAnchorElement>('a[href]')
}

function isWebUrl(url: URL) {
  return url.protocol === 'http:' || url.protocol === 'https:'
}

function isExternalUrl(url: URL) {
  return isWebUrl(url) && !siteOrigins.value.has(url.origin)
}

function handleDocumentClick(event: MouseEvent) {
  if (event.defaultPrevented || ![0, 1].includes(event.button)) return

  const anchor = findAnchor(event.target)
  if (!anchor || anchor.hasAttribute('download')) return

  let targetUrl: URL
  try {
    targetUrl = new URL(anchor.href, window.location.href)
  } catch {
    return
  }

  if (!isExternalUrl(targetUrl)) return

  event.preventDefault()
  event.stopPropagation()

  pendingLink.value = {
    url: targetUrl.href,
    host: targetUrl.host
  }
  isVisible.value = true
}

function clearPendingLink() {
  isVisible.value = false
  pendingLink.value = null
}

function handleCancel() {
  clearPendingLink()
}

function handleConfirm() {
  const link = pendingLink.value
  if (!link) return

  clearPendingLink()
  window.open(link.url, '_blank', 'noopener,noreferrer')
}

function handleKeydown(event: KeyboardEvent) {
  if (!isVisible.value || event.key !== 'Escape') return
  handleCancel()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true)
  document.addEventListener('auxclick', handleDocumentClick, true)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('auxclick', handleDocumentClick, true)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.external-link-dialog {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: var(--pm-size-normal);
  background: var(--color-black-transparent-37_5);
  backdrop-filter: blur(6px);
}

.external-link-dialog__container {
  position: relative;
  width: min(100%, 24rem);
  border: var(--border-width-normal) solid var(--color-border-panel);
  border-radius: var(--border-radius-normal-200);
  background: var(--color-bg-panel-strong);
  box-shadow: 0 24px 60px var(--color-shadow-panel);
}

.external-link-dialog__inner {
  display: flex;
  flex-direction: column;
  gap: var(--pm-size-normal);
  padding: var(--pm-size-normal-200) var(--pm-size-normal-150) var(--pm-size-normal-150);
}

.external-link-dialog__title {
  color: var(--color-text-normal);
  text-align: center;
  font-size: var(--font-size-normal-125);
  font-weight: 950;
  line-height: 1.25;
}

.external-link-dialog__content {
  color: var(--color-text-second);
  text-align: center;
  font-size: var(--font-size-normal);
  font-weight: 750;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.external-link-dialog__actions {
  display: flex;
  justify-content: center;
  gap: var(--pm-size-normal);
  padding-top: var(--pm-size-normal-25);
}

.external-link-dialog__button {
  min-width: 6rem;
  border: var(--border-width-normal) solid var(--color-border-control-pill);
  border-radius: var(--border-radius-normal-200);
  padding: var(--pm-size-normal-50) var(--pm-size-normal);
  cursor: pointer;
  font-size: var(--font-size-normal);
  font-weight: 900;
  line-height: 1.2;
}

.external-link-dialog__button--cancel {
  background: transparent;
  color: var(--color-text-control);
}

.external-link-dialog__button--confirm {
  border-color: var(--color-control-hover-bg);
  background: var(--color-control-hover-bg);
  color: var(--color-text-inverse);
}

.external-link-dialog__button:hover,
.external-link-dialog__close:hover {
  transform: translateY(-1px);
}

.external-link-dialog__close {
  position: absolute;
  right: var(--pm-size-normal);
  top: var(--pm-size-normal);
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 0;
  border-radius: var(--border-radius-normal-200);
  background: transparent;
  color: var(--color-text-control);
  cursor: pointer;
}

.external-link-dialog-fade-enter-active,
.external-link-dialog-fade-leave-active {
  transition: opacity 0.15s ease;
}

.external-link-dialog-fade-enter-from,
.external-link-dialog-fade-leave-to {
  opacity: 0;
}
</style>
