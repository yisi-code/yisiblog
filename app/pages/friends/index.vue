<template>
  <PageShell title="友链" description="散落在赛博宇宙各处的有趣灵魂与神经节点" class="pt-page-top pb-page-bottom-loose" width="wide">
    <template #toolbar>
      <FriendApplyPanel
        :apply-format="applyFormat"
        :copied="copied"
        @copy="copyApplyFormat"
      />
    </template>

    <PageSection :columns="3" spacing="md" class="friends-grid">
      <FriendCard v-for="friend in friends" :key="friend.id" :friend="friend" />
    </PageSection>

    <section id="gitalk-container" class="friends-comments">
      <div class="friends-comments__heading">
        <span />
        <h3>友链树洞</h3>
        <span />
      </div>
      <ArticleComments />
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import { siteConfig, useFriendsData } from '~/data'

const friends = await useFriendsData()
const copied = ref(false)
const applyFormat = computed(() => siteConfig.friendLinkApplyFormat)
let copyTimer: number | undefined

async function copyApplyFormat() {
  if (!import.meta.client) return

  try {
    await navigator.clipboard.writeText(applyFormat.value)
    copied.value = true
    useToast().showToast('友链申请格式已复制')
    if (copyTimer) window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    useToast().showToast('复制失败，请手动复制', 'warning')
  }
}

useHead(() => ({title: `友链：倚肆的小屋`}))
</script>
