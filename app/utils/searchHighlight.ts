export type HighlightPart = {
  text: string
  match: boolean
}

export function escapeSearchRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightSearchParts(value: string | undefined, query: string): HighlightPart[] {
  const source = String(value || '')
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return [{ text: source, match: false }]

  const regex = new RegExp(`(${escapeSearchRegExp(trimmedQuery)})`, 'gi')
  return source
    .split(regex)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === trimmedQuery.toLowerCase()
    }))
}
