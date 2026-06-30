<template>
  <div
    ref="draggableRef"
    class="cyber-cat"
    :class="{ 'cyber-cat--dragging': isDragging, 'cyber-cat--chat-open': showInput }"
    :style="draggableStyle"
  >
    <div v-if="speech" class="cyber-cat__bubble">
      {{ speech }}
      <span class="cyber-cat__bubble-arrow" />
    </div>

    <div class="cyber-cat__body">
      <div class="cyber-cat__actions" @pointerdown.stop>
        <button
          type="button"
          class="cyber-cat__action"
          title="聊天"
          aria-label="聊天"
          @click.stop="openChatInput"
        >
          <MessageCircle :size="20" />
        </button>
      </div>

      <div
        class="cyber-cat__sprite-button"
        aria-label="摸摸猫"
        title="摸摸猫"
        @pointerdown.stop="startLongPressDrag"
        @click.stop
      >
        <div class="cyber-cat__sprite transform-gpu" :class="spriteClass" />
      </div>
    </div>

      <form v-if="showInput" class="cyber-cat__form" @submit.prevent="submitChat" @pointerdown.stop>
        <input
          v-model="inputValue"
          class="cyber-cat__input"
          type="text"
          placeholder="跟小狐说点啥喵..."
          :disabled="isThinking"
        >
        <button
          type="submit"
          class="cyber-cat__submit"
          :disabled="isThinking || !inputValue.trim()"
          aria-label="发送"
        >
          <Send :size="16" />
        </button>
      </form>
  </div>
</template>

<script setup lang="ts">
import { MessageCircle, Send } from '@lucide/vue'

const isPetted = ref(false)
const speech = ref('')
const showInput = ref(false)
const inputValue = ref('')
const isThinking = ref(false)
const {
  draggableRef,
  draggableStyle,
  isDragging,
  startDrag,
  stopDrag,
  cancelDrag
} = useDraggableEdgeSnap({ dragMoveThreshold: 10, overflowResetRatio: 1 / 3 })
let speechTimer: number | undefined
let petTimer: number | undefined
let longPressTimer: number | undefined
let idleTimer: number | undefined
let isLongPressReady = false

const spriteClass = computed(() => {
  if (isDragging.value) return 'cyber-cat__sprite--curious'
  if (isPetted.value) return 'cyber-cat__sprite--petted'
  if (isThinking.value) return 'cyber-cat__sprite--thinking'
  if (showInput.value) return 'cyber-cat__sprite--chatting'
  return 'cyber-cat__sprite--idle'
})

function speak(text: string, duration = 6000) {
  speech.value = text
  window.clearTimeout(speechTimer)
  speechTimer = window.setTimeout(() => {
    closeSpeech();
  }, duration)
}

function petCat() {
  if (isPetted.value) return

  isPetted.value = true
  speak('呼噜噜... 摸得本喵很舒服喵~', 2000)
  window.clearTimeout(petTimer)
  petTimer = window.setTimeout(() => {
    closePetted();
  }, 2000)
}

function openChatInput() {
  if (isThinking.value) return
  showInput.value = !showInput.value
  closeSpeech();
}


function closeSpeech(){
  speech.value = ''
}

function closePetted(){
  isPetted.value = false

}

function closeChatInput() {
  showInput.value = false
}

function handleOutsidePointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (!showInput.value || target.closest('.cyber-cat')) return
  closeChatInput()
}

async function submitChat() {
  const message = inputValue.value.trim()

  if (!message || isThinking.value) return

  inputValue.value = ''
  closeChatInput()
  isThinking.value = true
  speak('让本喵想想喵...', 10000)

  await askCat(message)
}

async function askCat(message: string) {
  try {
    const data = await $fetch<{ reply?: string }>('/api/chat', {
      method: 'POST',
      body: { message }
    })

    speak(data.reply || '本喵现在不想理你喵...', 8000)
  } catch {
    speak('本喵的脑回路暂时连不上了喵...', 4000)
  } finally {
    isThinking.value = false
  }
}

function startLongPressDrag(event: PointerEvent) {
  if (event.button !== 0) return

  isLongPressReady = true
  window.clearTimeout(longPressTimer)
  window.addEventListener('pointerup', finishCatPress, { once: true })
  window.addEventListener('pointercancel', cancelCatPress, { once: true })
  longPressTimer = window.setTimeout(() => {
    if (!isLongPressReady) return

    closeChatInput()
    startDrag(event)
  }, 150)
}

function finishCatPress() {
  const wasDragging = isDragging.value
  closeChatInput()
  cancelCatPress()
  if (!wasDragging) petCat()
}

function cancelCatPress() {
  isLongPressReady = false
  window.clearTimeout(longPressTimer)
  stopDrag()
}

function startIdleTalk() {
  const messages = [
    '喵呜~ 今天天气真不错喵~',
    '好困哦，想睡觉喵...',
    '铲屎官，快去敲代码！',
    '我的小鱼干藏哪里去了？',
    '怎么没人理本喵...'
  ]

  idleTimer = window.setInterval(() => {
    if (speech.value || showInput.value || isThinking.value || Math.random() <= 0.8) return

    speak(messages[Math.floor(Math.random() * messages.length)]! || messages[0]!, 4000)
  }, 20000)
}

onMounted(() => {
  startIdleTalk()
  window.addEventListener('pointerdown', handleOutsidePointerDown)
})

onBeforeUnmount(() => {
  window.clearTimeout(speechTimer)
  window.clearTimeout(petTimer)
  window.clearTimeout(longPressTimer)
  window.clearInterval(idleTimer)
  cancelDrag()
  window.removeEventListener('pointerup', finishCatPress)
  window.removeEventListener('pointercancel', cancelCatPress)
  window.removeEventListener('pointerdown', handleOutsidePointerDown)
})
</script>
