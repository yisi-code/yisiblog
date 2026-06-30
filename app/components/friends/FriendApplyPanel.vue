<template>
  <div class="friend-apply__code relative flex max-w-[32rem] flex-col overflow-hidden rounded-3xl py-content-block pl-code-panel-inline pr-code-panel-action text-left">
    <p class="friend-apply__description max-w-[34rem]">
      欢迎交换友链。请复制下方格式，并在底部树洞留言。
    </p>
    <pre>{{ applyFormat }}</pre>
    <button
      type="button"
      class="friend-apply__copy absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center rounded-[0.7rem] hover:-translate-y-0.5"
      :title="copied ? '已复制' : '一键复制'"
      @click="$emit('copy')"
    >
      <Check v-if="copied" :size="16" />
      <Copy v-else :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'

defineProps<{
  applyFormat: string
  copied: boolean
}>()

defineEmits<{
  copy: []
}>()
</script>
