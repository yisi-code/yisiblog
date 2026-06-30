import type { ComputedRef, Ref } from 'vue'

type MaybeReactive<T> = T | Ref<T> | ComputedRef<T> | (() => T)

export interface UseMasonryColumnsOptions<T> {
  items: MaybeReactive<readonly T[]>
  columnCount: MaybeReactive<number>
  estimateHeight?: (item: T, index: number) => number
}

function resolveValue<T>(value: MaybeReactive<T>): T {
  return typeof value === 'function' ? (value as () => T)() : unref(value)
}

export function useMasonryColumns<T>(options: UseMasonryColumnsOptions<T>) {
  const columns = computed(() => {
    const items = [...resolveValue(options.items)]
    const columnCount = Math.max(1, Math.floor(resolveValue(options.columnCount)))
    const columns = Array.from({ length: columnCount }, () => [] as T[])
    const heights = Array.from({ length: columnCount }, () => 0)

    items.forEach((item, index) => {
      const targetIndex = heights.indexOf(Math.min(...heights))
      columns[targetIndex]!.push(item)
      heights[targetIndex]! += Math.max(0, options.estimateHeight?.(item, index) ?? 1)
    })

    return columns
  })

  return {
    masonryColumns: columns
  }
}
