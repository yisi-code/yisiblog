<template>
  <div v-if="items.length" class="search-result-list">
    <NuxtLink
      v-for="item in visibleItems"
      :key="item.key || item.path"
      :to="item.path"
      class="search-result-list__item group"
    >
      <span class="search-result-list__head">
        <span class="search-result-list__title-group">
          <span v-if="item.source" class="search-result-list__source">{{ item.source }}</span>
          <span class="search-result-list__title" :class="titleClass">
            <template v-for="(part, index) in highlightParts(item.title || fallbackTitle)" :key="`${item.key || item.path}-title-${index}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <span v-else>{{ part.text }}</span>
            </template>
          </span>
        </span>
        <span v-if="item.date" class="search-result-list__date">{{ item.date }}</span>
      </span>

      <span v-if="item.description" class="search-result-list__description" :class="descriptionClass">
        <template v-for="(part, index) in highlightParts(item.description)" :key="`${item.key || item.path}-desc-${index}`">
          <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
          <span v-else>{{ part.text }}</span>
        </template>
      </span>

      <span v-if="item.tags?.length" class="search-result-list__tags">
        <span v-for="tag in item.tags" :key="tag" class="search-result-list__tag">
          #
          <template v-for="(part, index) in highlightParts(tag)" :key="`${item.key || item.path}-${tag}-${index}`">
            <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
            <span v-else>{{ part.text }}</span>
          </template>
        </span>
      </span>
    </NuxtLink>
  </div>

  <div v-else class="search-result-list__empty" :class="emptyClass">
    <slot name="empty">
      {{ emptyText }}
    </slot>
  </div>
</template>

<script setup lang="ts">
import { highlightSearchParts } from '~/utils/searchHighlight'

export type SearchResultItem = {
  path: string
  key?: string
  title?: string
  description?: string
  date?: string
  source?: string
  tags?: string[]
}

const props = withDefaults(defineProps<{
  items: SearchResultItem[]
  query: string
  limit?: number
  emptyText?: string
  fallbackTitle?: string
  titleClass?: string
  descriptionClass?: string
  emptyClass?: string
}>(), {
  limit: 8,
  emptyText: '没有匹配的记录。',
  fallbackTitle: '未命名',
  titleClass: '',
  descriptionClass: '',
  emptyClass: ''
})

const visibleItems = computed(() => props.items.slice(0, props.limit))

function highlightParts(value: string) {
  return highlightSearchParts(value, props.query)
}
</script>
