<template>
  <PageShell
      title="数据管理"
      description="本地内容记录、正文、媒体和歌词维护"
      width="wide"
      class="admin-data pt-page-top pb-panel-bottom">
    <template #toolbar>
      <div class="admin-data-toolbar">
        <input
            v-model="searchQuery"
            class="admin-data-input admin-data-input--search"
            type="search"
            placeholder="搜索当前类别内容..."
        >
      </div>
    </template>

    <PageSection
        spacing="md" class="admin-data-workspace"
        :class="{ 'admin-data-workspace--locked': !isAuthenticated }">
      <div v-if="hasEditorDraft" ref="adminDataActionsRef" class="admin-data-actions">
        <button class="admin-data-button" type="button" @click="resetDraft">重置</button>
        <button
            v-if="canDeleteDraft"
            class="admin-data-button"
            type="button"
            :disabled="isSaving"
            @click="deleteRecord(false)"
        >
          删除记录
        </button>
        <button class="admin-data-button" type="button" :disabled="!canSave || isSaving" @click="saveRecord">
          保存
        </button>
      </div>

      <aside class="admin-data-sidebar glass-panel">
        <div class="admin-data-status" :class="statusClass">
          {{ statusMessage || '准备就绪' }}
        </div>
        <div class="admin-data-filter">
          <button
              v-for="type in adminRecordTypes"
              :key="type"
              class="admin-data-type-button"
              :class="{ 'admin-data-type-button--active': selectedType === type }"
              type="button"
              @click="selectType(type)"
          >
            <span>{{ adminRecordTypeLabels[type] }}</span>
            <small>{{ countByType[type] || 0 }}</small>
          </button>
        </div>

        <div class="admin-data-list">
          <div v-if="isLoading" class="admin-data-list-state">
            加载中...
          </div>
          <div v-else-if="!listedRecords.length" class="admin-data-list-state">
            暂无匹配记录
          </div>
          <button
              v-for="record in listedRecords"
              :key="`${record.type}-${record.id}`"
              class="admin-data-list-item"
              :class="{ 'admin-data-list-item--active': selectedRecordKey === recordKey(record) }"
              type="button"
              @click="selectRecord(record)"
          >
            <span class="admin-data-list-cover">
              <img v-if="record.cover" :src="record.cover" :alt="record.title || record.id">
              <span v-else>{{ adminRecordTypeLabels[record.type].slice(0, 1) }}</span>
            </span>
            <span class="admin-data-list-main">
              <strong>{{ record.title || record.id }}</strong>
              <em>{{ record.description || record.id }}</em>
              <time v-if="record.date">{{ record.date }}</time>
            </span>
          </button>
        </div>

        <button
            v-if="canCreateSelectedType"
            class="admin-data-button admin-data-button--primary w-full"
            type="button"
            @click="createRecord"
        >
          新增{{ adminRecordTypeLabels[selectedType] }}
        </button>
      </aside>

      <section class="admin-data-editor glass-panel">
        <div v-if="!hasEditorDraft" class="admin-data-empty">
          <strong>{{ listedRecords.length ? '暂无选中数据' : '当前类别暂无数据' }}</strong>
          <span>{{
              listedRecords.length ? '请选择左侧数据后再编辑；再次点击当前数据可取消选择。' : '可以切换类别查看已有数据，或点击新增创建当前类别数据。'
            }}</span>
        </div>

        <template v-else>
          <div class="admin-data-editor-head">
            <div>
              <p>{{ isCreating ? '新增记录' : '编辑记录' }}</p>
              <h2>{{ draft.title || draft.id || adminRecordTypeLabels[draft.type] }}</h2>
            </div>
          </div>

          <form class="admin-data-form" @submit.prevent="saveRecord">
            <label v-if="isCreating" class="admin-data-field">
              <span>ID</span>
              <input v-model.trim="draft.id" class="admin-data-input" placeholder="new-post">
            </label>

            <div v-if="isCreating" class="admin-data-field">
              <span>类型</span>
              <div
                  ref="typeSelectRef"
                  class="admin-data-select user-select-none"
                  :class="{ 'admin-data-select--open': isTypeSelectOpen }"
              >
                <div class="admin-data-select__inner">
                  <button
                      class="admin-data-select__button"
                      type="button"
                      :aria-expanded="isTypeSelectOpen"
                      @click="toggleTypeSelect"
                  >
                    <span>{{ adminRecordTypeLabels[draft.type] }}</span>
                    <ChevronDown class="admin-data-select__icon" :size="18" :stroke-width="2.4" aria-hidden="true"/>
                  </button>

                  <div v-if="isTypeSelectOpen" class="admin-data-select__dropdown">
                    <div class="admin-data-select__dropdown-container">
                      <button
                          v-for="type in creatableTypes"
                          :key="type"
                          class="admin-data-select__option"
                          :class="{ 'admin-data-select__option--active': draft.type === type }"
                          type="button"
                          @click="selectDraftType(type)"
                      >
                        <span class="admin-data-select__option-title">{{ adminRecordTypeLabels[type] }}</span>
                        <span class="admin-data-select__option-count">{{ countByType[type] || 0 }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <label v-if="showTitleField" class="admin-data-field">
              <span>标题</span>
              <input v-model="draft.title" class="admin-data-input" placeholder="标题">
            </label>

            <label v-if="showDateField" class="admin-data-field">
              <span>时间</span>
              <input v-model="draft.date" class="admin-data-input" placeholder="2026-06-29 10:30:00">
            </label>

            <label v-if="showDescriptionField" class="admin-data-field admin-data-field--wide">
              <span>描述</span>
              <textarea v-model="draft.description" class="admin-data-textarea" placeholder="描述或摘要"/>
            </label>

            <label v-if="showCoverField" class="admin-data-field admin-data-field--wide">
              <span>封面</span>
              <div class="admin-data-media-row">
                <input v-model="draft.cover" class="admin-data-input" placeholder="https://... 或 /images/cover.jpg">
                <label class="admin-data-button">
                  选择图片
                  <input class="admin-data-file" type="file" accept="image/*"
                         @change="handleMediaSelected($event, 'image', 'cover')">
                </label>
              </div>
              <img v-if="draft.cover" class="admin-data-preview-image" :src="draft.cover" alt="封面预览">
            </label>

            <label v-if="showUrlField" class="admin-data-field admin-data-field--wide">
              <span>{{ draft.type === 'music' ? '音频' : '链接' }}</span>
              <div class="admin-data-media-row">
                <input v-model="draft.url" class="admin-data-input"
                       :placeholder="draft.type === 'music' ? '/music/song.m4a' : 'https://...'">
                <label v-if="draft.type === 'music'" class="admin-data-button">
                  选择音乐
                  <input class="admin-data-file" type="file" accept="audio/*"
                         @change="handleMediaSelected($event, 'music', 'url')">
                </label>
              </div>
              <audio v-if="draft.type === 'music' && draft.url" class="admin-data-audio" :src="draft.url" controls/>
            </label>

            <label v-if="showTagsField" class="admin-data-field admin-data-field--wide">
              <span>标签</span>
              <input v-model="tagsText" class="admin-data-input" placeholder="多个标签用逗号分隔">
            </label>

            <label v-if="showMoodField" class="admin-data-field">
              <span>心情</span>
              <input v-model="typeFields.mood" class="admin-data-input" placeholder="随想">
            </label>

            <template v-if="showLocationField || showImagesField">
              <label v-if="showLocationField" class="admin-data-field">
                <span>位置</span>
                <input v-model="typeFields.location" class="admin-data-input" placeholder="城市或地点">
              </label>
              <label v-if="showImagesField" class="admin-data-field admin-data-field--wide">
                <span>图片</span>
                <div class="admin-data-media-row">
                  <textarea v-model="imagesText" class="admin-data-textarea" placeholder="每行一个图片地址"/>
                  <label class="admin-data-button">
                    选择图片
                    <input class="admin-data-file" type="file" accept="image/*" multiple
                           @change="handleMomentImagesSelected">
                  </label>
                </div>
                <div v-if="momentImages.length" class="admin-data-image-grid">
                  <img v-for="image in momentImages" :key="image" :src="image" alt="动态图片">
                </div>
              </label>
            </template>

            <template v-if="showArtistField || showErrorField">
              <label class="admin-data-field">
                <span>歌手</span>
                <input v-model="typeFields.artist" class="admin-data-input" placeholder="歌手">
              </label>
              <label v-if="showErrorField" class="admin-data-field">
                <span>错误提示</span>
                <input v-model="typeFields.error" class="admin-data-input" placeholder="不可播放原因，可留空">
              </label>
            </template>

            <template v-if="showPhotosField">
              <label class="admin-data-field admin-data-field--wide">
                <span>照片</span>
                <div class="admin-data-media-row">
                  <textarea v-model="photosText" class="admin-data-textarea admin-data-textarea--code"
                            placeholder='[{"url":"https://...","caption":"说明"}]'/>
                  <label class="admin-data-button">
                    选择图片
                    <input class="admin-data-file" type="file" accept="image/*" multiple
                           @change="handleAlbumImagesSelected">
                  </label>
                </div>
                <div v-if="albumPhotos.length" class="admin-data-image-grid">
                  <figure v-for="photo in albumPhotos" :key="photo.url">
                    <img :src="photo.url" :alt="photo.caption || '相册图片'">
                    <figcaption v-if="photo.caption">{{ photo.caption }}</figcaption>
                  </figure>
                </div>
              </label>
            </template>

            <label v-if="showIconField" class="admin-data-field">
              <span>图标</span>
              <input v-model="typeFields.icon" class="admin-data-input" placeholder="Rocket">
            </label>

            <label v-if="needsMarkdown" class="admin-data-field admin-data-field--wide">
              <span>Markdown 正文</span>
              <textarea v-model="contentText" class="admin-data-textarea admin-data-textarea--code"
                        placeholder="正文内容，不需要 frontmatter"/>
            </label>

            <label v-if="showLrcField" class="admin-data-field admin-data-field--wide">
              <span>LRC 歌词</span>
              <div class="admin-data-media-row">
                <textarea v-model="lrcText" class="admin-data-textarea admin-data-textarea--code"
                          placeholder="[00:00.000]歌词"/>
                <label class="admin-data-button">
                  选择歌词
                  <input class="admin-data-file" type="file" accept=".lrc,.txt"
                         @change="handleMediaSelected($event, 'lyric', 'lrc')">
                </label>
              </div>
              <div v-if="parsedLyrics.length" class="admin-data-lyrics">
                <div v-for="line in parsedLyrics" :key="`${line.time}-${line.text}`">
                  <time>{{ line.time }}</time>
                  <span>{{ line.text }}</span>
                </div>
              </div>
            </label>
          </form>
        </template>
      </section>
    </PageSection>

    <div v-if="!isAuthenticated" class="admin-data-auth-mask">
      <form class="admin-data-auth-card glass-panel" @submit.prevent="verifyToken">
        <strong>管理令牌验证</strong>
        <span>通过后 30 分钟内保持有效，到期后需要重新验证。</span>
        <input
            v-model="adminToken"
            class="admin-data-input"
            type="password"
            placeholder="输入管理令牌"
            autocomplete="current-password"
        >
        <button class="admin-data-button" type="submit" :disabled="isVerifying">
          验证
        </button>
        <em v-if="statusMessage" :style="`color: var(--color-status-${statusType});`">{{ statusMessage }}</em>
      </form>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import {ChevronDown} from '@lucide/vue'
import {
  adminRecordHasField,
  adminRecordNeedsMarkdown,
  adminRecordTypeLabels,
  adminRecordTypes,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminPhoto,
  type AdminRecordType,
  type AdminRecordsResponse
} from '~~/shared/adminData'

type MediaKind = 'image' | 'music' | 'lyric'
type MediaTarget = 'cover' | 'url' | 'lrc'
type EditorMode = 'idle' | 'create' | 'edit'
type AdminSession = {
  session: string
  expiresAt: number
}

const adminSessionStorageKey = 'yisiblog-admin-session'
const creatableTypes = adminRecordTypes.filter((type) => type !== 'about')

const adminToken = ref('')
const adminSession = ref<AdminSession | null>(null)
const records = ref<AdminManagedRecord[]>([])
const selectedType = ref<AdminRecordType>('post')
const selectedRecordKey = ref('')
const searchQuery = ref('')
const isVerifying = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const isTypeSelectOpen = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const originalId = ref('')
const editorMode = ref<EditorMode>('idle')
const draft = reactive<AdminDataRecord>(createEmptyRecord('post'))
const contentText = ref('')
const lrcText = ref('')
const tagsText = ref('')
const imagesText = ref('')
const photosText = ref('[]')
const adminDataActionsRef = ref<HTMLElement | null>(null)
const typeSelectRef = ref<HTMLElement | null>(null)
const typeFields = reactive({
  mood: '',
  location: '',
  artist: '',
  error: '',
  icon: ''
})

const isAuthenticated = computed(() => Boolean(adminSession.value && adminSession.value.expiresAt > Date.now()))
const isCreating = computed(() => editorMode.value === 'create')
const hasEditorDraft = computed(() => editorMode.value !== 'idle')
const needsMarkdown = computed(() => adminRecordNeedsMarkdown(draft.type))
const canSave = computed(() => Boolean(hasEditorDraft.value && isAuthenticated.value && draft.id.trim() && draft.type))
const canDeleteDraft = computed(() => !isCreating.value && draft.type !== 'about')
const canCreateSelectedType = computed(() => selectedType.value !== 'about')
const statusClass = computed(() => `admin-data-status--${statusType.value}`)
const showTitleField = computed(() => hasDraftField('title'))
const showDateField = computed(() => hasDraftField('date'))
const showDescriptionField = computed(() => hasDraftField('description'))
const showCoverField = computed(() => hasDraftField('cover'))
const showUrlField = computed(() => hasDraftField('url'))
const showTagsField = computed(() => hasDraftField('tags'))
const showMoodField = computed(() => hasDraftField('mood'))
const showLocationField = computed(() => hasDraftField('location'))
const showImagesField = computed(() => hasDraftField('images'))
const showArtistField = computed(() => hasDraftField('artist'))
const showErrorField = computed(() => hasDraftField('error'))
const showPhotosField = computed(() => hasDraftField('photos'))
const showIconField = computed(() => hasDraftField('icon'))
const showLrcField = computed(() => draft.type === 'music')
const momentImages = computed(() => splitLines(imagesText.value))
const parsedLyrics = computed(() => parseLrc(lrcText.value))

const albumPhotos = computed<AdminPhoto[]>(() => {
  try {
    const value = photosText.value.trim() ? JSON.parse(photosText.value) : []
    return Array.isArray(value) ? value.filter((photo) => photo?.url) : []
  } catch {
    return []
  }
})

const countByType = computed(() => records.value.reduce((result, record) => {
  result[record.type] = (result[record.type] || 0) + 1
  return result
}, {} as Record<AdminRecordType, number>))

const searchedRecords = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return records.value

  return records.value.filter((record) => [
    adminRecordTypeLabels[record.type],
    record.id,
    record.title,
    record.description,
    record.date,
    record.url,
    record.artist,
    record.location,
    record.mood,
    ...(record.tags || [])
  ].filter(Boolean).join(' ').toLowerCase().includes(query))
})

const listedRecords = computed(() => searchedRecords.value.filter((record) => record.type === selectedType.value))

watch(() => draft.type, (type) => {
  if (hasEditorDraft.value) selectedType.value = type
})

useScrollSticky(adminDataActionsRef, {
  top: '7rem',
})

onMounted(() => {
  restoreSession()
  document.addEventListener('mousedown', handleTypeSelectClickOutside)
  if (isAuthenticated.value) void loadRecords()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleTypeSelectClickOutside)
})

function createEmptyRecord(type: AdminRecordType): AdminDataRecord {
  return {
    id: type === 'about' ? 'about' : '',
    type,
    title: '',
    description: '',
    date: '',
    cover: '',
    url: '',
    tags: []
  }
}

function recordKey(record: Pick<AdminDataRecord, 'type' | 'id'>) {
  return `${record.type}:${record.id}`
}

function setStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMessage.value = message
  statusType.value = type
}

function hasDraftField(field: Parameters<typeof adminRecordHasField>[1]) {
  return adminRecordHasField(draft.type, field)
}

function restoreSession() {
  if (!import.meta.client) return
  const rawSession = window.sessionStorage.getItem(adminSessionStorageKey)
  if (!rawSession) return

  try {
    const session = JSON.parse(rawSession) as AdminSession
    if (session.expiresAt > Date.now()) {
      adminSession.value = session
      return
    }
  } catch {
    // ignore malformed session
  }

  window.sessionStorage.removeItem(adminSessionStorageKey)
}

function saveSession(session: AdminSession) {
  adminSession.value = session
  if (import.meta.client) {
    window.sessionStorage.setItem(adminSessionStorageKey, JSON.stringify(session))
  }
}

function clearSession() {
  adminSession.value = null
  if (import.meta.client) window.sessionStorage.removeItem(adminSessionStorageKey)
}

function requestHeaders() {
  return {
    'x-admin-session': adminSession.value?.session || ''
  }
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
}

function parseLrc(value: string) {
  return value.split(/\r?\n/)
      .map((line) => {
        const match = line.match(/^\[(\d{2,}:\d{2}(?:[.:]\d{2,3})?)\](.*)$/)
        return match?.[1] && match?.[2] ? {time: match[1], text: match[2].trim()} : null
      })
      .filter((line): line is { time: string; text: string } => Boolean(line?.text))
}

function syncDraftFromRecord(record: AdminManagedRecord) {
  Object.assign(draft, {
    id: record.id,
    type: record.type,
    title: record.title || '',
    description: record.description || '',
    date: record.date || '',
    cover: record.cover || '',
    url: record.url || '',
    path: record.path || '',
    tags: [...(record.tags || [])]
  })

  tagsText.value = (record.tags || []).join(', ')
  contentText.value = record.content || ''
  lrcText.value = record.lrc || ''
  imagesText.value = Array.isArray(record.images) ? record.images.join('\n') : ''
  photosText.value = JSON.stringify(record.photos || [], null, 2)
  typeFields.mood = String(record.mood || '')
  typeFields.location = String(record.location || '')
  typeFields.artist = String(record.artist || '')
  typeFields.error = String(record.error || '')
  typeFields.icon = String(record.icon || '')
  originalId.value = record.id
}

function clearEditorDraft(type: AdminRecordType = selectedType.value) {
  selectedRecordKey.value = ''
  originalId.value = ''
  editorMode.value = 'idle'
  Object.assign(draft, createEmptyRecord(type))
  tagsText.value = ''
  contentText.value = ''
  lrcText.value = ''
  imagesText.value = ''
  photosText.value = '[]'
  typeFields.mood = ''
  typeFields.location = ''
  typeFields.artist = ''
  typeFields.error = ''
  typeFields.icon = ''
}

function buildRecordPayload() {
  let photos: unknown = undefined
  if (hasDraftField('photos')) {
    try {
      photos = photosText.value.trim() ? JSON.parse(photosText.value) : []
    } catch {
      throw new Error('相册照片 JSON 格式不正确')
    }
    if (!Array.isArray(photos)) throw new Error('相册照片必须是数组')
  }

  return {
    id: draft.type === 'about' ? 'about' : draft.id.trim(),
    type: draft.type,
    title: hasDraftField('title') ? draft.title?.trim() : undefined,
    description: hasDraftField('description') ? draft.description?.trim() : undefined,
    date: hasDraftField('date') ? draft.date?.trim() : undefined,
    cover: hasDraftField('cover') ? draft.cover?.trim() : undefined,
    url: hasDraftField('url') ? draft.url?.trim() : undefined,
    tags: hasDraftField('tags') ? tagsText.value.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    mood: hasDraftField('mood') ? typeFields.mood.trim() || undefined : undefined,
    location: hasDraftField('location') ? typeFields.location.trim() || undefined : undefined,
    images: hasDraftField('images') ? splitLines(imagesText.value) : undefined,
    artist: hasDraftField('artist') ? typeFields.artist.trim() || undefined : undefined,
    error: hasDraftField('error') ? typeFields.error.trim() || undefined : undefined,
    photos: hasDraftField('photos') ? photos as AdminDataRecord['photos'] : undefined,
    icon: hasDraftField('icon') ? typeFields.icon.trim() || undefined : undefined
  } satisfies AdminDataRecord
}

function selectType(type: AdminRecordType) {
  selectedType.value = type
  clearEditorDraft(type)
}

function toggleTypeSelect() {
  isTypeSelectOpen.value = !isTypeSelectOpen.value
}

function selectDraftType(type: AdminRecordType) {
  draft.type = type
  isTypeSelectOpen.value = false
}

function handleTypeSelectClickOutside(event: MouseEvent) {
  if (typeSelectRef.value && !typeSelectRef.value.contains(event.target as Node)) {
    isTypeSelectOpen.value = false
  }
}

function createRecord() {
  if (selectedType.value === 'about') return
  selectedRecordKey.value = ''
  originalId.value = ''
  isTypeSelectOpen.value = false
  editorMode.value = 'create'
  syncDraftFromRecord({
    ...createEmptyRecord(selectedType.value),
    content: '',
    lrc: ''
  })
}

function selectRecord(record: AdminManagedRecord) {
  if (selectedRecordKey.value === recordKey(record)) {
    clearEditorDraft(record.type)
    return
  }

  editRecord(record)
}

function editRecord(record: AdminManagedRecord) {
  selectedRecordKey.value = recordKey(record)
  editorMode.value = 'edit'
  syncDraftFromRecord(record)
}

function resetDraft() {
  if (!hasEditorDraft.value) {
    return
  }

  if (isCreating.value) {
    createRecord()
    return
  }

  const record = records.value.find((item) => recordKey(item) === selectedRecordKey.value)
  if (record) editRecord(record)
}

async function verifyToken() {
  if (!adminToken.value.trim()) {
    setStatus('请先输入管理令牌', 'error')
    return
  }

  isVerifying.value = true
  try {
    const session = await $fetch<AdminSession>('/api/admin/session', {
      method: 'POST',
      body: {token: adminToken.value.trim()}
    })
    saveSession(session)
    adminToken.value = ''
    setStatus('验证通过', 'success')
    await loadRecords()
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '验证失败', 'error')
  } finally {
    isVerifying.value = false
  }
}

async function loadRecords() {
  if (!isAuthenticated.value) {
    clearSession()
    setStatus('请先完成令牌验证', 'error')
    return
  }

  isLoading.value = true
  try {
    const response = await $fetch<AdminRecordsResponse>('/api/admin/records', {
      headers: requestHeaders()
    })
    records.value = response.records
    setStatus(`已加载 ${records.value.length} 条记录`, 'success')
    const currentRecord = records.value.find((record) => recordKey(record) === selectedRecordKey.value)
    if (currentRecord) editRecord(currentRecord)
    else clearEditorDraft(selectedType.value)
  } catch (error) {
    clearSession()
    setStatus(error instanceof Error ? error.message : '加载失败', 'error')
  } finally {
    isLoading.value = false
  }
}

async function saveRecord() {
  if (!canSave.value) return
  isSaving.value = true
  try {
    const record = buildRecordPayload()
    await $fetch('/api/admin/records/save', {
      method: 'POST',
      headers: requestHeaders(),
      body: {
        originalId: originalId.value || undefined,
        record,
        content: needsMarkdown.value ? contentText.value : undefined,
        lrc: record.type === 'music' ? lrcText.value : undefined
      }
    })
    setStatus('保存成功，已写入记录和关联文件', 'success')
    await loadRecords()
    const savedRecord = records.value.find((item) => item.type === record.type && item.id === record.id)
    if (savedRecord) editRecord(savedRecord)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '保存失败', 'error')
  } finally {
    isSaving.value = false
  }
}

async function deleteRecord(deleteAssociatedFiles: boolean) {
  if (!selectedRecordKey.value || draft.type === 'about') return
  isSaving.value = true
  try {
    await $fetch('/api/admin/records/delete', {
      method: 'POST',
      headers: requestHeaders(),
      body: {
        id: originalId.value,
        type: draft.type,
        deleteAssociatedFiles
      }
    })
    records.value = records.value.filter((record) => !(record.type === draft.type && record.id === originalId.value))
    setStatus('记录已删除，关联文件默认保留', 'success')
    clearEditorDraft(selectedType.value)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '删除失败', 'error')
  } finally {
    isSaving.value = false
  }
}

async function uploadMedia(file: File, kind: MediaKind) {
  const form = new FormData()
  form.append('kind', kind)
  form.append('file', file)
  return $fetch<{ path: string; text?: string }>('/api/admin/media', {
    method: 'POST',
    headers: requestHeaders(),
    body: form
  })
}

async function handleMediaSelected(event: Event, kind: MediaKind, target: MediaTarget) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const result = await uploadMedia(file, kind)
    if (target === 'cover') draft.cover = result.path
    if (target === 'url') draft.url = result.path
    if (target === 'lrc') lrcText.value = result.text || ''
    setStatus('文件已选择并写入本地目录', 'success')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '文件写入失败', 'error')
  } finally {
    input.value = ''
  }
}

async function handleMomentImagesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  try {
    const uploaded = await Promise.all(files.map((file) => uploadMedia(file, 'image')))
    imagesText.value = [...splitLines(imagesText.value), ...uploaded.map((item) => item.path)].join('\n')
    setStatus('图片已写入本地目录', 'success')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '图片写入失败', 'error')
  } finally {
    input.value = ''
  }
}

async function handleAlbumImagesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  try {
    const uploaded = await Promise.all(files.map((file) => uploadMedia(file, 'image')))
    const nextPhotos = [
      ...albumPhotos.value,
      ...uploaded.map((item) => ({url: item.path, caption: ''}))
    ]
    photosText.value = JSON.stringify(nextPhotos, null, 2)
    setStatus('相册图片已写入本地目录', 'success')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '相册图片写入失败', 'error')
  } finally {
    input.value = ''
  }
}

useHead(() => ({
  title: `管理数据：倚肆的小屋`
}))
</script>
