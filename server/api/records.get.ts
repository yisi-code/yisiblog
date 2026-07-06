import { readStaticRecords } from '#server/services/staticContentStorage'

export default defineEventHandler(async () => {
  return {
    records: await readStaticRecords()
  }
})
