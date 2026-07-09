<template>
  <section
      class="glass-panel interactive-card group relative h-full origin-center flex-col overflow-hidden rounded-3xl shadow-xl transition duration-150 hover:scale-[1.02]"
      :style="tall ? 'aspect-ratio: 3 / 4' : 'aspect-ratio: 4 / 3'"
      @mouseenter="pauseTimer"
      @mouseleave="startTimer"
  >
    <div class="relative size-full overflow-hidden">
      <div
          class="flex h-full"
          :style="{
          width: `${extendedItems.length * 100}%`,
          transform: `translateX(-${extendedIndex * (100 / extendedItems.length)}%)`,
          transition: isSliding ? 'transform 0.15s ease' : 'none'
        }"
          @transitionend="handleTransitionEnd"
      >
        <NuxtLink
            v-for="(item, index) in extendedItems"
            :key="`${item.path}-${index}`"
            :to="item.path"
            :title="item.title"
            class="relative h-full w-full overflow-hidden"
            :aria-label="`打开 ${item.title || '内容'}`"
        >
          <img
            :src="item.cover || ''"
            referrerpolicy="no-referrer"
            :alt="item.title || ''"
            class="media-fill-cover"
          >
          <div class="absolute inset-0 content-media-overlay"/>
        </NuxtLink>
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-10 flex h-full w-full flex-col justify-end p-card-inset"
    >
      <h2 class="home-card-title mt-stack-md size-fit line-clamp-1 text-size-card-title-lg">
        {{ currentItem ? currentItem.title : '博文' }}
      </h2>
      <p class="home-card-description mt-stack-xs size-fit line-clamp-2">
        {{ currentItem ? currentItem.description : '浏览博文' }}
      </p>
      <div class="size-fit flex gap-3 mt-stack-md" :class="{'mb-section-offset': tall}">
        <p class="home-card-eyebrow">{{ eyebrow }}</p>
        <p v-if="currentItem?.date" class="home-card-date">{{ currentItem.date }}</p>
      </div>
    </div>

    <div v-if="items.length > 1" class="absolute bottom-4 left-6 right-6 z-30 flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button
            v-for="(_, index) in items"
            :key="index"
            type="button"
            class="cursor-pointer rounded-full transition duration-150"
            :class="index === currentIndex ? 'carousel-dot-active h-3 w-3' : 'carousel-dot h-2.5 w-2.5'"
            :aria-label="`切换到第 ${index + 1} 项`"
            @click.stop="goTo(index)"
        />
      </div>

      <div class="flex items-center gap-2">
        <BaseIconButton class="carousel-arrow" aria-label="上一项" size="sm" @click.stop="previousSlide">
          <template #icon>
            <span class="carousel-arrow__icon carousel-arrow__icon--left" />
          </template>
        </BaseIconButton>
        <BaseIconButton class="carousel-arrow" aria-label="下一项" size="sm" @click.stop="nextSlide">
          <template #icon>
            <span class="carousel-arrow__icon" />
          </template>
        </BaseIconButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type CarouselItem = {
  path: string
  title?: string
  description?: string
  cover?: string
  date?: string
}

const props = withDefaults(defineProps<{
  items: CarouselItem[]
  eyebrow: string
  interval?: number
  tall?: boolean
}>(), {
  interval: 5000,
  tall: false
})

const currentIndex = ref(0)
const extendedIndex = ref(1)
const isSliding = ref(false)
const currentItem = computed(() => props.items[currentIndex.value] || null)
const extendedItems = computed(() => {
  if (!props.items.length) return []
  if (props.items.length === 1) return props.items
  return [props.items[props.items.length - 1], ...props.items, props.items[0]].filter(Boolean) as CarouselItem[]
})

let timer: ReturnType<typeof window.setTimeout> | undefined

function pauseTimer() {
  if (!timer) return
  clearTimeout(timer)
  timer = undefined
}

function startTimer() {
  if (!import.meta.client) return
  pauseTimer()
  if (props.items.length <= 1) return
  timer = setTimeout(nextSlide, props.interval)
}

function nextSlide() {
  if (isSliding.value || props.items.length <= 1) return
  isSliding.value = true
  extendedIndex.value += 1
  currentIndex.value = currentIndex.value < props.items.length - 1 ? currentIndex.value + 1 : 0
}

function previousSlide() {
  if (isSliding.value || props.items.length <= 1) return
  isSliding.value = true
  extendedIndex.value -= 1
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : props.items.length - 1
}

function goTo(index: number) {
  if (isSliding.value || index === currentIndex.value) return
  isSliding.value = true
  currentIndex.value = index
  extendedIndex.value = index + 1
}

function handleTransitionEnd() {
  if (props.items.length <= 1) return
  if (extendedIndex.value === extendedItems.value.length - 1) extendedIndex.value = 1
  else if (extendedIndex.value === 0) extendedIndex.value = extendedItems.value.length - 2
  isSliding.value = false
  startTimer()
}

watch(() => props.items.length, () => {
  currentIndex.value = 0
  extendedIndex.value = props.items.length > 1 ? 1 : 0
  isSliding.value = false
}, {immediate: true})

onMounted(startTimer)
onBeforeUnmount(pauseTimer)
</script>
