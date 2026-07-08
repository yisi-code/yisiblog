import { readStaticRecordsForEvent } from '#server/services/staticContentStorage'

export default defineEventHandler(async (event) => {
  return {
    records: await readStaticRecordsForEvent(event)
  }
})
