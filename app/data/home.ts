import { extractContentText, type Album, type ContentItem, type Friend, type Project, type Song } from '~/data'
import { formatDisplayDate } from '~/utils/dateFormat'

export type HomeContentItem = ContentItem

export type HomeCardItem = {
  path: string
  title?: string
  description?: string
  date?: string
  cover?: string
}

export type HomeSearchItem = {
  path: string
  title: string
  description?: string
  tags: string[]
  date?: string
}

export type HomeStatItem = {
  label: string
  value: number
  color: string
}

export type HomeMomentCard = {
  description: string
  date: string
  path: string
}

export function extractBodyText(item: HomeContentItem) {
  return extractContentText(item)
}

export function formatMomentDate(date?: string) {
  return formatDisplayDate(date)
}

export function buildLatestPosts(posts: HomeContentItem[]) {
  return posts.map((item) => ({
    ...item,
    path: item.path || '',
    cover: item.cover || ''
  })).slice(0, 5)
}

export function buildLatestChatters(chatters: HomeContentItem[], defaultChatterCover: string) {
  return chatters.map((item) => ({
    ...item,
    path: item.path || '',
    cover: item.cover || defaultChatterCover
  })).slice(0, 1)
}

export function buildHomeSearchItems(params: {
  posts: HomeContentItem[]
  chatters: HomeContentItem[]
  moments: HomeContentItem[]
  friends: Friend[]
  albums: Album[]
  projects: Project[]
  songs: Song[]
}) {
  const { posts, chatters, moments, friends, albums, projects, songs } = params

  return [
    ...posts.map((item) => ({
      title: item.title || '未命名博文',
      description: item.description || extractBodyText(item),
      date: formatDisplayDate(item.date),
      tags: ['博文', ...(item.tags || [])],
      path: item.path || ''
    })),
    ...chatters.map((item) => ({
      title: item.title || '未命名杂谈',
      description: item.description || extractBodyText(item),
      date: formatDisplayDate(item.date),
      tags: ['杂谈', ...(item.tags || [])],
      path: item.path || ''
    })),
    ...moments.map((item) => ({
      title: extractBodyText(item) || formatMomentDate(item.date) || '动态',
      description: extractBodyText(item),
      date: formatMomentDate(item.date),
      tags: ['动态'],
      path: '/moments'
    })),
    ...friends.map((friend) => ({
      title: friend.title || '未命名友链',
      description: friend.description,
      tags: ['友链'],
      path: '/friends'
    })),
    ...albums.map((album) => ({
      title: album.title || '未命名相册',
      description: [album.description, ...album.photos.map((photo) => photo.caption).filter(Boolean)].filter(Boolean).join(' '),
      date: formatDisplayDate(album.date),
      tags: ['相册', ...(album.tags || [])],
      path: '/albums'
    })),
    ...projects.map((project) => ({
      title: project.title || '未命名项目',
      description: project.description,
      tags: ['项目', ...(project.tags || [])],
      path: '/projects'
    })),
    ...songs.map((song) => ({
      title: song.title || '未命名音乐',
      description: song.description || '',
      tags: ['音乐'],
      path: '/music'
    }))
  ] satisfies HomeSearchItem[]
}

export function buildLatestAlbum(albums: Album[]) {
  return albums[0] || {
    title: '相册',
    description: '打开相册',
    date: '',
    cover: '',
    path: '/albums'
  }
}

export function buildLatestMomentCard(moments: HomeContentItem[]) {
  const moment = moments[0]
  if (!moment) {
    return {
      description: '这里会显示最近发布的动态内容。',
      date: '',
      path: '/moments'
    }
  }

  const dateText = formatMomentDate(moment.date)
  return {
    description: extractBodyText(moment) || '打开最新动态。',
    date: dateText,
    path: '/moments'
  }
}

export function buildHomeStats(params: {
  postsCount: number
  chattersCount: number
  albums: Album[]
  momentCount: number
  projects: Project[]
}) {
  return [
    { label: '博文', value: params.postsCount, color: 'var(--color-text-stat-primary)' },
    {label: '相册', value: params.albums.length, color: 'var(--color-text-stat-tertiary)'},
    { label: '杂谈', value: params.chattersCount, color: 'var(--color-text-stat-secondary)' },
    { label: '动态', value: params.momentCount, color: 'var(--color-red-luoxiahong)' },
    { label: '项目', value: params.projects.length, color: 'var(--color-red-luoxiahong)' },
  ] satisfies HomeStatItem[]
}
