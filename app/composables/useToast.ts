type ToastType = 'success' | 'warning' | 'error' | 'info'

type ToastState = {
  text: string
  type: ToastType
  id: number
} | null

const toastState = ref<ToastState>(null)
let toastTimer: number | undefined

export function useToast() {
  function showToast(text: string, type: ToastType = 'success') {
    if (toastTimer) window.clearTimeout(toastTimer)

    toastState.value = {
      text,
      type,
      id: Date.now()
    }

    toastTimer = window.setTimeout(() => {
      toastState.value = null
    }, 3000)
  }

  return {
    toast: toastState,
    showToast
  }
}
