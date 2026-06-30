const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/

export function formatDisplayDate(date?: string, fallback = '') {
  if (!date) return fallback

  const value = date.trim()
  const match = value.match(DATE_TIME_PATTERN)
  if (!match) return value

  const [, year, month, day, hour, minute, second] = match
  const dateText = `${year}-${month}-${day}`
  if (!hour || !minute || !second) return dateText

  return `${dateText} ${hour}:${minute}:${second}`
}
