<template>
  <PageShell title="项目" description="开源项目、研究代码与实验记录" width="wide" class="pt-page-top pb-page-bottom">
    <template #toolbar>
      <div class="page-search">
        <SearchBox v-model="searchQuery" placeholder="搜索项目..."/>
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
          <img
              v-if="project.cover"
              :src="project.cover"
              :alt="project.title"
              class="z-0 absolute inset-0 media-fill-cover scale-105 blur-xs">
          <div
              v-if="project.cover"
              class="z-1 left-0 top-0 absolute size-full"
              style="background-color: var(--color-bg-panel);"/>

          <div
              class="z-2 project-card__glow pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full"
              aria-hidden="true"/>

          <div class="relative z-3 flex items-start justify-between gap-4">
            <div class="project-card__identity flex min-w-0 items-center gap-4">
              <span class="project-card__icon grid h-12 min-w-12 place-items-center" title="Code2">
                <Code2
                    class="project-card__icon-svg"
                    :size="28"
                    :stroke-width="2.4"
                    aria-hidden="true"
                />
              </span>
              <h2>
                <template
                    v-for="(part, partIndex) in highlightParts(project.title)"
                    :key="`${project.id}-title-${partIndex}`">
                  <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                  <span v-else>{{ part.text }}</span>
                </template>
              </h2>
            </div>
            <span class="project-card__link-icon" :title="projectSourceLabel(project.url)" aria-hidden="true">
              <SocialIcon :type="projectSourceType(project.url)"/>
            </span>
          </div>

          <p class="project-card__description relative z-1 mt-stack-lg overflow-hidden">
            <template
                v-for="(part, partIndex) in highlightParts(project.description)"
                :key="`${project.id}-description-${partIndex}`">
              <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
              <span v-else>{{ part.text }}</span>
            </template>
          </p>

          <div class="relative z-1 flex flex-wrap gap-[0.55rem] pt-card-footer">
            <span v-for="tag in project.tags" :key="tag" class="content-tag">
              <template v-for="(part, partIndex) in highlightParts(tag)" :key="`${project.id}-${tag}-${partIndex}`">
                <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </span>
          </div>
        </a>
      </div>

      <div v-else-if="!isLoadingProjects" class="glass-panel empty-state empty-state-panel">
        <strong>{{ searchQuery ? '没有匹配的项目' : '暂无分享项目' }}</strong>
        <span>{{ searchQuery ? '可以换个关键词试试。' : '之后会在这里展示一些我喜欢的项目。' }}</span>
      </div>
    </PageSection>
  </PageShell>
</template>

<script setup lang="ts">
import {Code2} from '@lucide/vue'
import {useProjectsData} from '~/data'
import {highlightSearchParts} from '~/utils/searchHighlight'

type ProjectSourceType = 'github' | 'gitee' | 'website'

const searchQuery = ref('')
const {projects, pending: isLoadingProjects} = await useProjectsData()

const filteredProjects = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return projects.value

  return projects.value.filter((project) => [
    project.title,
    project.description,
    project.url,
    ...(project.tags || [])
  ].filter(Boolean).join(' ').toLowerCase().includes(query))
})

function highlightParts(value: string | undefined) {
  return highlightSearchParts(value, searchQuery.value)
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
