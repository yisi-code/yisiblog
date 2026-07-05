<template>
  <PageShell title="项目" description="开源项目、研究代码与实验记录" width="wide" class="pt-page-top pb-page-bottom">
    <template #toolbar>
      <div class="page-search">
        <SearchBox v-model="searchQuery" placeholder="搜索项目..." />
      </div>
    </template>

    <PageSection spacing="md" class="page-stack">
      <div v-if="filteredProjects.length" class="content-grid content-grid--2">
        <a
          v-for="project in filteredProjects"
          :key="project.id"
          :href="project.url"
          target="_blank"
          rel="noreferrer"
          class="project-card content-card-surface relative flex flex-col overflow-hidden no-underline hover:-translate-y-2"
        >
          <div v-if="project.cover" class="project-card__cover -mx-[clamp(1.25rem,3vw,2rem)] -mt-[clamp(1.25rem,3vw,2rem)] mb-stack-lg aspect-[16/7] overflow-hidden">
            <img :src="project.cover" :alt="project.title" class="media-fill-cover">
          </div>
          <div class="project-card__glow pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full" aria-hidden="true" />

          <div class="relative z-[1] flex items-start justify-between gap-4">
            <div class="project-card__identity flex min-w-0 items-center gap-4">
              <span class="project-card__icon grid h-12 min-w-12 place-items-center" :title="project.icon || 'Code2'">
                <component
                  :is="resolveProjectIcon(project.icon)"
                  class="project-card__icon-svg"
                  :size="28"
                  :stroke-width="2.4"
                  aria-hidden="true"
                />
              </span>
              <h2>
                <template v-for="(part, partIndex) in highlightParts(project.title)" :key="`${project.id}-title-${partIndex}`">
                  <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                  <span v-else>{{ part.text }}</span>
                </template>
              </h2>
            </div>
            <span class="project-card__link-icon" :title="projectSourceLabel(project.url)" aria-hidden="true">
              <SocialIcon :type="projectSourceType(project.url)" />
            </span>
          </div>

          <p class="project-card__description relative z-[1] mt-stack-lg overflow-hidden">
            <template v-for="(part, partIndex) in highlightParts(project.description)" :key="`${project.id}-description-${partIndex}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <span v-else>{{ part.text }}</span>
            </template>
          </p>

          <div class="relative z-[1] mt-auto flex flex-wrap gap-[0.55rem] pt-card-footer">
            <span v-for="tag in project.tags" :key="tag" class="content-tag">
              <template v-for="(part, partIndex) in highlightParts(tag)" :key="`${project.id}-${tag}-${partIndex}`">
                <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </span>
          </div>
        </a>
      </div>

      <div v-else class="glass-panel empty-state empty-state-panel">
        <strong>{{ searchQuery ? '没有匹配的项目' : '暂无分享项目' }}</strong>
        <span>{{ searchQuery ? '可以换个关键词试试。' : '之后会在这里展示一些我喜欢的项目。' }}</span>
      </div>
    </PageSection>
  </PageShell>
</template>

<script setup lang="ts">
import * as LucideIcons from '@lucide/vue'
import type { Component } from 'vue'
import {useProjectsData} from '~/data'
import { highlightSearchParts } from '~/utils/searchHighlight'

type ProjectSourceType = 'github' | 'gitee' | 'website'

const searchQuery = ref('')
const projects = await useProjectsData()
const lucideIconMap = LucideIcons as unknown as Record<string, Component | undefined>
const fallbackProjectIcon = LucideIcons.Code2
const projectIconAliases: Record<string, Component> = {
  ai: LucideIcons.Bot,
  api: LucideIcons.Route,
  app: LucideIcons.AppWindow,
  blog: LucideIcons.BookOpen,
  code: LucideIcons.Code2,
  database: LucideIcons.Database,
  robot: LucideIcons.Bot,
  server: LucideIcons.Server,
  tool: LucideIcons.Wrench,
  web: LucideIcons.Globe2,
  website: LucideIcons.Globe2
}

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return projects.value

  return projects.value.filter((project) => [
    project.title,
    project.description,
    project.url,
    project.icon,
    ...(project.tags || [])
  ].filter(Boolean).join(' ').toLowerCase().includes(query))
})

function highlightParts(value: string | undefined) {
  return highlightSearchParts(value, searchQuery.value)
}

function resolveProjectIcon(iconName: string | undefined): Component {
  const normalizedIconName = iconName?.trim()
  if (!normalizedIconName) return fallbackProjectIcon

  const directIcon = lucideIconMap[normalizedIconName]
  if (directIcon) return directIcon

  const pascalIconName = toPascalCase(normalizedIconName)
  return lucideIconMap[pascalIconName] || projectIconAliases[normalizedIconName.toLowerCase()] || fallbackProjectIcon
}

function toPascalCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}

function projectSourceType(url: string): ProjectSourceType {
  const hostname = projectUrlHostname(url)
  if (hostname === 'github.com' || hostname.endsWith('.github.com')) return 'github'
  if (hostname === 'gitee.com' || hostname.endsWith('.gitee.com')) return 'gitee'
  return 'website'
}

function projectSourceLabel(url: string) {
  const sourceType = projectSourceType(url)
  const labels: Record<ProjectSourceType, string> = {
    github: 'GitHub',
    gitee: 'Gitee',
    website: 'Website'
  }
  return labels[sourceType]
}

function projectUrlHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

useHead(() => ({title: `项目：倚肆的小屋`}))
</script>
