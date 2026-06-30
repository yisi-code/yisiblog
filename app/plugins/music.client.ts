export default defineNuxtPlugin(async () => {
  const music = useMusicStore()
  await music.load()
})
