<template>
  <section class="relative z-0 p-panel-inset-loose">
    <div class="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rounded-full timeline-line"/>
    <div class="post-timeline__columns content-masonry content-masonry--2 relative z-10">
      <div v-for="(column, columnIndex) in timelineColumns" :key="columnIndex" class="post-timeline__column content-masonry__column">
        <article
            v-for="post in column"
            :key="post.path"
            class="post-timeline__item relative flex min-w-0"
            :class="columnIndex === 0 ? 'justify-end' : 'justify-start'"
        >
          <NuxtLink
              :to="post.path"
              class="post-timeline__content glass-panel group inline-grid w-fit max-w-[min(100%,28rem)] grid-cols-[minmax(0,max-content)] rounded-2xl overflow-hidden"
              :class="columnIndex === 0 ? 'text-right' : ''"
          >
            <div class="relative aspect-video w-full min-w-0">
              <img
                  :src="post.cover || ''"
                  referrerpolicy="no-referrer"
                  :alt="post.title || ''"
                  class="absolute inset-0 media-fill-cover"
              >
              <span class="media-cover-chip">
                {{ post.displayDate }}
              </span>
            </div>
            <div class="min-w-0 max-w-full p-card-inset">
              <h2 class="text-title text-size-card-title font-black group-hover:text-accent-hover">{{
                  post.title || '未命名博文'
                }}</h2>
              <p class="text-secondary mt-stack-xs line-clamp-2 text-size-content-body leading-7">{{ post.description || '暂无简介。' }}</p>
              <div class="mt-stack-md flex flex-wrap gap-2" :class="columnIndex === 0 ? 'justify-end' : ''">
                <span
                  v-for="tag in post.tags || []"
                  :key="tag"
                  class="content-tag"
                ># {{ tag }}</span>
              </div>
            </div>
            <div
                class="post-timeline__dot absolute top-1/2"
                :class="columnIndex === 0 ? 'right-[-3rem]' : 'left-[-3rem]'"
            />
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type PostListItem = {
  path: string
  title?: string
  cover?: string
  description?: string
  displayDate: string
  tags?: string[]
}

const props = defineProps<{
  posts: PostListItem[]
}>()

const { masonryColumns: timelineColumns } = useMasonryColumns({
  items: () => props.posts,
  columnCount: 2,
  estimateHeight: estimatePostHeight
})

function estimatePostHeight(post: PostListItem) {
  // 单位：rem，封面按 16:9 固定比例换算后的高度权重。
  const coverHeight = post.cover ? 10.5 : 0
  // 单位：rem，用于估算标题、正文、标签、内边距等固定内容。
  const baseContentHeight = 7
  // 单位：px，时间线卡片正文区域的估算宽度。
  const estimatedContentWidthPx = 360
  // 单位：px，博文标题/简介平均字符占位宽度。
  const averageTextCharWidthPx = 12
  // 单位：字符/行，由估算内容宽度和平均字符宽度换算得到。
  const textCharsPerRow = Math.max(1, Math.floor(estimatedContentWidthPx / averageTextCharWidthPx))
  // 单位：rem，每行标题/简介对卡片高度的影响权重。
  const textRowHeight = 0.75
  // 单位：个，每行标签的估算容纳数量。
  const tagsPerRow = 4
  // 单位：rem，每行标签对卡片高度的影响权重。
  const tagRowHeight = 1.2

  const textLength = `${post.title || ''}${post.description || ''}`.length
  const textRows = Math.ceil(textLength / textCharsPerRow)
  const tagRows = Math.ceil((post.tags?.length || 0) / tagsPerRow)

  return coverHeight + baseContentHeight + textRows * textRowHeight + tagRows * tagRowHeight
}

</script>
