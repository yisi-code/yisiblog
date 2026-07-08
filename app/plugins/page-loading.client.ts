export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const isPageLoading = useState('page-loading', () => false)
  let showTimer: number | undefined
  let fallbackTimer: number | undefined

  function clearTimers() {
    window.clearTimeout(showTimer)
    window.clearTimeout(fallbackTimer)
    showTimer = undefined
    fallbackTimer = undefined
  }

  function startPageLoading() {
    clearTimers()
    showTimer = window.setTimeout(() => {
      isPageLoading.value = true
    }, 120)
    fallbackTimer = window.setTimeout(() => {
      isPageLoading.value = false
    }, 15000)
  }

  function finishPageLoading() {
    clearTimers()
    isPageLoading.value = false
  }

  router.beforeEach((to, from) => {
    if (to.path !== from.path) startPageLoading()
  })

  nuxtApp.hook('page:finish', finishPageLoading)
  nuxtApp.hook('app:error', finishPageLoading)
  router.onError(finishPageLoading)
})
