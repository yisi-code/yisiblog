export type MusicPanelSetting = 'lyrics' | 'playlist'
export type PostsViewModeSetting = 'timeline' | 'card'

export type ClientLocalSettingDefinition<T extends string> = {
  storageKey: string
  defaultValue: T
  isValidValue?: (value: string) => value is T
}

const musicActivePanelSetting: ClientLocalSettingDefinition<MusicPanelSetting> = {
  storageKey: 'yisiblog-music-active-panel',
  defaultValue: 'playlist',
  isValidValue: (value): value is MusicPanelSetting => value === 'lyrics' || value === 'playlist'
}

const postsViewModeSetting: ClientLocalSettingDefinition<PostsViewModeSetting> = {
  storageKey: 'yisiblog-posts-view-mode',
  defaultValue: 'timeline',
  isValidValue: (value): value is PostsViewModeSetting => value === 'timeline' || value === 'card'
}

export const clientLocalSettings = {
  colorMode: {
    storageKey: 'yisiblog-color-mode'
  },
  musicActivePanel: musicActivePanelSetting,
  postsViewMode: postsViewModeSetting
}
