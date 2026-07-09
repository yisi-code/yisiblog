import type { Ref } from 'vue'
import type { ClientLocalSettingDefinition } from '~~/shared/clientLocalSettings'

export function useClientLocalSetting<T extends string>(definition: ClientLocalSettingDefinition<T>) {
  const { storageKey, defaultValue, isValidValue } = definition
  const setting = ref(defaultValue) as Ref<T>

  function normalize(value: unknown) {
    if (typeof value === 'string' && (!isValidValue || isValidValue(value))) {
      return value as T
    }

    return defaultValue
  }

  function readSetting() {
    if (!import.meta.client) return defaultValue

    try {
      return normalize(window.localStorage.getItem(storageKey))
    } catch (error) {
      console.warn(`[local-setting:read] ${storageKey}`, error)
      return defaultValue
    }
  }

  function writeSetting(value: T) {
    if (!import.meta.client) return

    try {
      window.localStorage.setItem(storageKey, value)
    } catch (error) {
      console.warn(`[local-setting:write] ${storageKey}`, error)
    }
  }

  onMounted(() => {
    setting.value = readSetting()
  })

  watch(setting, writeSetting)

  return setting
}
