const lyricModules = import.meta.glob('../../content/lyrics/*.lrc', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

export type LyricsData = Record<string, string>

function fileNameFromPath(path: string) {
  return path.split('/').pop() || path
}

const lyrics: LyricsData = Object.fromEntries(
  Object.entries(lyricModules).map(([path, lyricText]) => [fileNameFromPath(path), lyricText])
)

export function lyricFileNameFromSongUrl(url: string, fallbackTitle: string) {
  const sourceName = decodeURIComponent(url.split('/').pop() || `${fallbackTitle}.lrc`)
  return sourceName.includes('.') ? sourceName.replace(/\.[^.]+$/, '.lrc') : `${sourceName}.lrc`
}

export function useLyricsData() {
  return useState<LyricsData>('lyrics-data', () => lyrics)
}
