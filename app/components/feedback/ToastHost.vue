<template>
  <Teleport to="body">
    <Transition name="toast-pop">
      <div
        v-if="toast"
        :key="toast.id"
        class="toast-message fixed left-1/2 top-20 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-panel-inline py-content-block text-size-content-body font-black shadow-2xl backdrop-blur-xl"
        :class="typeClass"
      >
        {{ toast.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { toast } = useToast()

const typeClass = computed(() => {
  switch (toast.value?.type) {
    case 'warning':
      return 'toast-message--warning'
    case 'error':
      return 'toast-message--error'
    case 'info':
      return 'toast-message--info'
    case 'success':
    default:
      return 'toast-message--success'
  }
})
</script>
