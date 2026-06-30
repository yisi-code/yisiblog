<template>
  <PageSection spacing="md" class="relative z-1 mb-toolbar-offset space-y-5">
    <div class="w-full flex flex-row justify-between gap-4">
      <div class="flex-1 glass-panel flex flex-row justify-start flex-wrap gap-2 rounded-2xl p-content-inset">
          <button
              type="button"
              class="filter-pill"
              :class="selectedTag === allTag ? activePillClass : inactivePillClass"
              @click="emit('update:selectedTag', allTag)"
          >
            {{ allTag }}
            <span class="ml-inline-gap-2xs opacity-60">{{ allCount }}</span>
          </button>
          <button
              v-for="tag in tags"
              :key="tag.name"
              type="button"
              class="filter-pill"
              :class="selectedTag === tag.name ? activePillClass : inactivePillClass"
              @click="emit('update:selectedTag', tag.name)"
          >
            {{ tag.name }}
            <span class="ml-inline-gap-2xs opacity-60">{{ tag.count }}</span>
          </button>
      </div>

      <div class="segmented-control h-fit w-52" :class="{ 'segmented-control--right': viewMode === 'card' }">
        <button
            type="button"
            class="segmented-control__button"
            :class="{ 'segmented-control__button--active': viewMode === 'timeline' }"
            @click="emit('update:viewMode', 'timeline')"
        >
          时间线
        </button>
        <button
            type="button"
            class="segmented-control__button"
            :class="{ 'segmented-control__button--active': viewMode === 'card' }"
            @click="emit('update:viewMode', 'card')"
        >
          卡片
        </button>
      </div>
    </div>

  </PageSection>
</template>

<script setup lang="ts">
type PostViewMode = 'timeline' | 'card'

type PostTag = {
  name: string
  count: number
}

defineProps<{
  tags: PostTag[]
  selectedTag: string
  allTag: string
  allCount: number
  viewMode: PostViewMode
}>()

const emit = defineEmits<{
  'update:selectedTag': [value: string]
  'update:viewMode': [value: PostViewMode]
}>()

const activePillClass = 'filter-pill-active shadow-md'
const inactivePillClass = 'filter-pill-inactive'
</script>
