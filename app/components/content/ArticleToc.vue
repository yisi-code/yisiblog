<template>
  <aside v-if="items.length" class="article-toc content-card-surface custom-scrollbar">
    <h3 class="article-sidebar-title">目录</h3>
    <nav class="article-toc__nav" aria-label="目录">
      <span class="article-toc__line" aria-hidden="true"/>
      <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="article-toc__item"
          :class="[
          `article-toc__item--level-${item.depth}`,
          { 'article-toc__item--active': activeId === item.id }
        ]"
          @click="scrollToHeading(item.id)"
      >
        <span v-if="activeId === item.id" class="article-toc__dot" aria-hidden="true"/>
        {{ cleanHeading(item.text) }}
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
type TocLink = {
  id?: string
  text?: string
  depth?: number
  children?: TocLink[]
}

type TocItem = {
  id: string
  text: string
  depth: number
}

const props = defineProps<{
  links?: TocLink[]
}>()

const activeId = ref('')
const clickedActiveId = ref('')
let scrollEndTimer: number | null = null;
let isProgrammaticScroll = false;

const items = computed(() => flattenToc(props.links || []))

function flattenToc(links: TocLink[], fallbackDepth = 2): TocItem[] {
  return links.flatMap((link) => {
    const text = link.text || ''
    const id = link.id || safeHeadingId(text)
    const depth = link.depth || fallbackDepth
    return [
      {id, text, depth},
      ...flattenToc(link.children || [], depth + 1)
    ]
  }).filter((item) => item.text && item.id)
}

function cleanHeading(value: string) {
  return value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/[*_~`#]/g, '')
      .trim()
}

function safeHeadingId(value: string) {
  return cleanHeading(value)
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
}

function collectHeadings() {
  return items.value
      .map((item) => document.getElementById(item.id))
      .filter((item): item is HTMLElement => Boolean(item))
}

function handleScroll() {
  if (clickedActiveId.value) return

  const headings = collectHeadings()
  let current = ''
  const viewportHeight = window.innerHeight
  const centerLine = viewportHeight / 2

  for (const heading of headings) {
    const rect = heading.getBoundingClientRect()
    if (rect.top <= viewportHeight && rect.bottom >= 0) current = heading.id
    else if (!current && rect.top > viewportHeight) break
    else if (rect.top <= centerLine) current = heading.id
  }

  if (current) activeId.value = current
}

function scrollToHeading(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const targetTop = target.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2);
  const currentTop = window.scrollY;
  const diff = Math.abs(targetTop - currentTop);

  // 如果目标位置与当前位置几乎相同，无需滚动，直接重置状态
  if (diff < 1) {
    clickedActiveId.value = '';
    activeId.value = id;
    return;
  }

  // 清除之前的监听器和定时器
  window.removeEventListener('scroll', onScroll);
  if (scrollEndTimer) window.clearTimeout(scrollEndTimer);

  clickedActiveId.value = id;
  activeId.value = id;
  isProgrammaticScroll = true;

  window.scrollTo({top: targetTop, behavior: 'smooth'});

  // 监听滚动，利用防抖判断是否停止
  window.addEventListener('scroll', onScroll);
}

function onScroll() {
  if (scrollEndTimer) window.clearTimeout(scrollEndTimer);
  scrollEndTimer = window.setTimeout(() => {
    // 滚动停止后执行
    if (isProgrammaticScroll) {
      clickedActiveId.value = '';
      isProgrammaticScroll = false;
    }
    window.removeEventListener('scroll', onScroll);
  }, 150); // 150ms 无滚动视为结束（可调）
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, {passive: true})
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollEndTimer) window.clearTimeout(scrollEndTimer);
  window.removeEventListener('scroll', onScroll);
})

watch(items, () => nextTick(handleScroll))
</script>
