<template>
  <GitalkComments
      :comment-path="commentPath"
      fallback-class="moment-comments__fallback"
      variant="moment">
    <template #fallback>
      <strong>评论</strong>
      <span>Gitalk 已安装。请在环境变量中补充 Gitalk OAuth 配置以启用评论。</span>
    </template>
  </GitalkComments>
</template>

<script setup lang="ts">
const props = defineProps<{
  momentId: string
}>()

const commentPath = computed(() => `moments/${props.momentId.replace(/^\/+|\/+$/g, '')}`)
</script>
