<template>
  <PageShell
      title="数据管理"
      description="内容草稿、待同步变更与数据胶囊发布工作台"
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
        spacing="md"
        class="admin-data-workspace"
        :class="{ 'admin-data-workspace--locked': !isAuthenticated }">
      <div v-if="hasEditorDraft" ref="adminDataActionsRef" class="admin-data-actions" aria-label="编辑操作">
        <button class="admin-data-button" type="button" @click="resetDraft">
          <RotateCcw :size="17" aria-hidden="true"/>
          重置
        </button>
        <button
            v-if="canDeleteDraft"
            class="admin-data-button admin-data-button--danger"
            type="button"
            @click="deleteRecord(false)"
        >
          <Trash2 :size="17" aria-hidden="true"/>
          删除
        </button>
        <button
            class="admin-data-button admin-data-button--primary"
            type="button"
            :disabled="!canSave"
            @click="saveDraftChange()">
          <Save :size="17" aria-hidden="true"/>
          保存草稿
        </button>
      </div>

      <aside class="admin-data-sidebar glass-panel">
        <div class="admin-data-status" :class="statusClass">
          {{ statusMessage || '准备就绪' }}
        </div>

        <div
            class="segmented-control admin-data-sidebar-tabs"
            :class="{ 'segmented-control--right':
             sidebarView === 'sync' }">
          <button
              class="segmented-control__button admin-data-sidebar-tab"
              :class="{ 'segmented-control__button--active': sidebarView === 'records' }"
              type="button"
              @click="selectSidebarView('records')"
          >
            数据列表
          </button>
          <button
              class="segmented-control__button admin-data-sidebar-tab"
              :class="{ 'segmented-control__button--active': sidebarView === 'sync' }"
              type="button"
              @click="selectSidebarView('sync')"
          >
            同步区
            <small>{{ pendingChanges.length }}</small>
          </button>
        </div>

        <template v-if="sidebarView === 'records'">
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
              正在同步最新数据记录到本地...
            </div>
            <div v-else-if="!listedRecords.length" class="admin-data-list-state">
              暂无匹配记录
            </div>
            <button
                v-for="record in listedRecords"
                :key="recordKey(record)"
                class="admin-data-list-item"
                :class="{
                  'admin-data-list-item--active': selectedRecordKey === recordKey(record),
                  'admin-data-list-item--pending': Boolean(pendingChangeByKey[recordKey(record)])
                }"
                type="button"
                @click="selectRecord(record)"
            >
              <span class="admin-data-list-cover">
                <img v-if="record.cover" :src="previewAssetUrl(record.cover)" :alt="record.title || record.id">
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
            <Plus :size="17" aria-hidden="true"/>
            新增{{ adminRecordTypeLabels[selectedType] }}
          </button>
        </template>

        <template v-else>
          <div class="admin-data-sync-head">
            <strong>{{ pendingChanges.length }} 项待同步</strong>
            <div class="admin-data-sync-actions">
              <button
                  class="admin-data-button"
                  type="button"
                  :disabled="!canSaveCloudDraft"
                  @click="saveCloudDraft">
                <CloudUpload :size="17" aria-hidden="true"/>
                保存云端草稿
              </button>
              <button
                  class="admin-data-button admin-data-button--primary"
                  type="button"
                  :disabled="!canSyncDataCapsule"
                  @click="syncDataCapsule"
              >
                <CloudUpload :size="17" aria-hidden="true"/>
                同步 GitHub
              </button>
            </div>
          </div>

          <div class="admin-data-change-list">
            <div v-if="!pendingChanges.length" class="admin-data-list-state">
              暂无待同步变更
            </div>
            <article
                v-for="change in pendingChanges"
                :key="change.key"
                class="admin-data-change-item"
                :class="[
                  `admin-data-change-item--${change.action}`,
                  { 'admin-data-change-item--active': activePendingChangeKey === change.key }
                ]"
            >
              <button
                  class="admin-data-change-open"
                  type="button"
                  :aria-pressed="activePendingChangeKey === change.key"
                  @click="openPendingChange(change)">
                <strong>{{ changeTitle(change) }}</strong>
                <em>{{ changeSubtitle(change) }}</em>
                <span class="admin-data-change-meta">
                  <span class="admin-data-change-label">{{ changeLabel(change) }}</span>
                  <small>{{ changeTime(change.updatedAt) }}</small>
                </span>
              </button>
              <div class="admin-data-change-undo" @click="undoChange(change.key)">
                <Undo2 :size="15" aria-hidden="true"/>
                <span class="h-fit">撤销</span>
              </div>
            </article>
          </div>
        </template>
      </aside>

      <section class="admin-data-editor glass-panel">
        <div v-if="!hasEditorDraft" class="admin-data-empty">
          <strong>{{ listedRecords.length ? '暂无选中数据' : '当前类别暂无数据' }}</strong>
          <span>{{
              listedRecords.length ? '请选择左侧数据后编辑，未保存的编辑内容会临时保留。' : '可以切换类别查看已有数据，或点击新增创建当前类别数据。'
            }}</span>
        </div>

        <template v-else>
          <div class="admin-data-editor-head">
            {{ draft.title || draft.id || adminRecordTypeLabels[draft.type] }}
          </div>

          <form class="admin-data-form" @submit.prevent="saveDraftChange()">
            <div class="admin-data-field admin-data-field--wide">
              <span>上传目录</span>
              <div class="admin-data-upload-folders">
                <div
                    v-for="target in visibleUploadTargets"
                    :key="target.key"
                    class="admin-data-folder-field">
                  <span class="admin-data-folder-field__label">{{ target.label }}</span>
                  <AdminDataSelect
                      select-class="admin-data-folder-select"
                      dropdown-class="admin-data-folder-select__dropdown"
                      :open="activeFolderTarget === target.key"
                      @update:open="setFolderDropdownOpen(target.key, $event)">
                    <template #control>
                      <input
                          v-model="uploadFolders[target.key]"
                          class="admin-data-select__button admin-data-folder-select__input"
                          :placeholder="target.placeholder"
                          @focus="openFolderDropdown(target.key)"
                          @input="handleUploadFolderInput(target.key)"
                          @keydown.escape="closeFolderDropdown">
                    </template>
                    <button
                        v-for="folder in filteredUploadFolders(target.key)"
                        :key="folder"
                        class="admin-data-select__option admin-data-folder-select__option"
                        type="button"
                        @mousedown.prevent="selectUploadFolder(target.key, folder)">
                      <span class="admin-data-select__option-title">
                        <template v-for="(part, index) in highlightFolderParts(folder, uploadFolders[target.key])" :key="`${folder}-${index}`">
                          <mark v-if="part.match" class="search-highlight">{{ part.text }}</mark>
                          <span v-else>{{ part.text }}</span>
                        </template>
                      </span>
                    </button>
                    <div v-if="!filteredUploadFolders(target.key).length" class="admin-data-folder-select__empty">
                      {{ folderEmptyMessage(target.key) }}
                    </div>
                  </AdminDataSelect>
                </div>
              </div>
            </div>

            <label v-if="isCreating" class="admin-data-field">
              <span>ID</span>
              <input v-model.trim="draft.id" class="admin-data-input" placeholder="new-post">
            </label>

            <div v-if="isCreating" class="admin-data-field">
              <span>类型</span>
              <AdminDataSelect v-model:open="isTypeSelectOpen">
                <template #control="{ toggle }">
                  <button
                      class="admin-data-select__button"
                      type="button"
                      :aria-expanded="isTypeSelectOpen"
                      @click="toggle"
                  >
                    <span>{{ adminRecordTypeLabels[draft.type] }}</span>
                    <ChevronDown class="admin-data-select__icon" :size="18" :stroke-width="2.4" aria-hidden="true"/>
                  </button>
                </template>
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
              </AdminDataSelect>
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
              <input v-model="draft.cover" class="admin-data-input" placeholder="输入图片链接">
              <img v-if="draft.cover" class="admin-data-preview-image" :src="previewAssetUrl(draft.cover)" alt="封面预览">
            </label>

            <label v-if="showUrlField" class="admin-data-field admin-data-field--wide">
              <span>{{ draft.type === 'music' ? '音频' : '链接' }}</span>
              <div class="admin-data-media-row">
                <input
                    v-model="draft.url"
                    class="admin-data-input"
                    :placeholder="draft.type === 'music' ? '选择音乐后自动填入远程地址' : 'https://...'">
                <AdminFilePicker v-if="draft.type === 'music'" label="选择音乐" accept="audio/*" @change="handleMusicSelected"/>
              </div>
              <div v-if="musicFile" class="admin-data-file-pill">
                <Music :size="16" aria-hidden="true"/>
                <span>{{ musicFile.fileName }}</span>
                <small v-if="musicFile.size">{{ formatBytes(musicFile.size) }}</small>
                <button type="button" @click="clearMusicFile">移除</button>
              </div>
              <audio v-if="draft.type === 'music' && draft.url" class="admin-data-audio" :src="previewAssetUrl(draft.url)" controls/>
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
                <textarea v-model="imagesText" class="admin-data-textarea" placeholder="一行一个图片链接"/>
                <div v-if="momentImages.length" class="admin-data-image-grid">
                  <img v-for="image in momentPreviewImages" :key="image" :src="image" alt="动态图片">
                </div>
              </label>
            </template>

            <template v-if="showArtistField">
              <label class="admin-data-field">
                <span>歌手</span>
                <input v-model="typeFields.artist" class="admin-data-input" placeholder="歌手">
              </label>
            </template>

            <div v-if="showPhotosField" class="admin-data-field admin-data-field--wide">
              <span>相册图片</span>
              <textarea v-model="albumPhotoUrlsText" class="admin-data-textarea" placeholder="一行一个图片链接"/>
              <div v-if="albumPhotoDrafts.length" class="admin-data-photo-rows">
                <div
                    v-for="(photo, index) in albumPhotoDrafts"
                    :key="`${photo.url}-${index}`"
                    class="admin-data-photo-row">
                  <img :src="previewAssetUrl(photo.url)" :alt="photo.caption || `相册图片 ${index + 1}`">
                  <label>
                    <span>图片描述</span>
                    <input v-model="photo.caption" class="admin-data-input" placeholder="留空表示无描述">
                  </label>
                </div>
              </div>
            </div>

            <label v-if="showIconField" class="admin-data-field">
              <span>图标</span>
              <input v-model="typeFields.icon" class="admin-data-input" placeholder="Rocket">
            </label>

            <label v-if="needsMarkdown" class="admin-data-field admin-data-field--wide">
              <span>Markdown 正文</span>
              <textarea
                  v-model="contentText"
                  class="admin-data-textarea admin-data-textarea--code"
                  placeholder="正文内容，不需要 frontmatter"/>
            </label>

            <label v-if="showLrcField" class="admin-data-field admin-data-field--wide">
              <span>LRC 歌词</span>
              <input v-model="draft.lrcUrl" class="admin-data-input" placeholder="选择歌词后自动填入远程地址">
              <div class="admin-data-media-row">
                <textarea
                    v-model="lrcText"
                    class="admin-data-textarea admin-data-textarea--code"
                    placeholder="[00:00.00]歌词"/>
                <AdminFilePicker label="选择歌词" accept=".lrc,.txt" @change="handleLyricSelected"/>
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
        <span>验证通过后 30 分钟内保持有效，到期后需要重新验证。</span>
        <input
            v-model="adminToken"
            class="admin-data-input"
            type="password"
            placeholder="输入管理令牌"
            autocomplete="current-password"
        >
        <button class="admin-data-button admin-data-button--primary" type="submit" :disabled="isVerifying">
          验证
        </button>
        <em v-if="statusMessage" :style="`color: var(--color-status-${statusType});`">{{ statusMessage }}</em>
      </form>
    </div>

    <div v-if="taskOverlay.active" class="admin-data-task-mask">
      <div class="admin-data-task-card glass-panel">
        <span class="admin-data-spinner" aria-hidden="true"/>
        <strong>{{ taskOverlay.title }}</strong>
        <p>{{ taskOverlay.description }}</p>
      </div>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import {
  ChevronDown,
  CloudUpload,
  Music,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2
} from '@lucide/vue'
import { highlightSearchParts } from '~/utils/searchHighlight'
import {
  adminRecordHasField,
  adminRecordNeedsMarkdown,
  adminRecordTypeLabels,
  adminRecordTypes,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminMusicFilePayload,
  type AdminPendingChange,
  type AdminPhoto,
  type AdminRecordType,
  type AdminRecordsResponse,
  type AdminSyncRecordsResponse
} from '~~/shared/adminData'

type EditorMode = 'idle' | 'create' | 'edit'
type DraftSaveMode = 'manual' | 'auto' | 'sync'
type DraftSaveResult = 'saved' | 'unchanged' | 'invalid' | 'error'
type AdminCloudDraftState = {
  drafts: Record<string, EditorDraftCache>
  pendingChanges: AdminPendingChange[]
  updatedAt?: string
}
type AdminSession = {
  session: string
  expiresAt: number
}
type EditorDraftCache = {
  mode: EditorMode
  selectedKey: string
  originalId: string
  record: AdminDataRecord
  content: string
  lrc: string
  musicFile?: AdminMusicFilePayload
  tagsText: string
  imagesText: string
  albumPhotoUrlsText: string
  albumPhotoDrafts: AdminPhoto[]
  typeFields: {
    mood: string
    location: string
    artist: string
    icon: string
  }
}
type AdminUploadedFilePayload = {
  fileName: string
  path: string
  publicUrl: string
  storage: 'data-capsule'
  size?: number
  mimeType?: string
}
type UploadFolderTarget = 'music' | 'lyric'
type UploadFolderConfig = {
  key: UploadFolderTarget
  label: string
  placeholder: string
}

const adminSessionStorageKey = 'yisiblog-admin-session'
const pendingChangesStorageKey = 'yisiblog-admin-pending-changes'
const editorDraftsStorageKey = 'yisiblog-admin-editor-drafts'
const adminRecordsCacheStorageKey = 'yisiblog-admin-records-cache'
const maxSyncPayloadBytes = 4 * 1024 * 1024
const creatableTypes = adminRecordTypes.filter((type) => type !== 'about')
const dataFolderByType: Record<AdminRecordType, string> = {
  post: '博文',
  chatter: '杂谈',
  moment: '动态',
  about: '关于',
  music: '音乐',
  friend: '友链',
  album: '相册',
  project: '项目'
}

const adminToken = ref('')
const adminSession = ref<AdminSession | null>(null)
const sourceRecords = ref<AdminManagedRecord[]>([])
const records = ref<AdminManagedRecord[]>([])
const pendingChanges = ref<AdminPendingChange[]>([])
const editorDrafts = ref<Record<string, EditorDraftCache>>({})
const sidebarView = ref<'records' | 'sync'>('records')
const selectedType = ref<AdminRecordType>('post')
const selectedRecordKey = ref('')
const editorDraftKey = ref('')
const searchQuery = ref('')
const dataCapsuleFolders = ref<string[]>([])
const activeFolderTarget = ref<UploadFolderTarget | ''>('')
const isVerifying = ref(false)
const isLoading = ref(false)
const isSyncing = ref(false)
const isSavingCloudDraft = ref(false)
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
const albumPhotoUrlsText = ref('')
const albumPhotoDrafts = ref<AdminPhoto[]>([])
const musicFile = ref<AdminMusicFilePayload | undefined>()
const adminDataActionsRef = ref<HTMLElement | null>(null)
const taskOverlay = reactive({
  active: false,
  title: '',
  description: ''
})
const typeFields = reactive({
  mood: '',
  location: '',
  artist: '',
  icon: ''
})
const uploadFolders = reactive({
  music: '',
  lyric: ''
})
const uploadFolderTouched = reactive<Record<UploadFolderTarget, boolean>>({
  music: false,
  lyric: false
})
const uploadFolderConfigs: UploadFolderConfig[] = [
  { key: 'music', label: '音乐', placeholder: '音乐文件夹' },
  { key: 'lyric', label: '歌词', placeholder: '音乐歌词文件夹' }
]
let hasTriedLoadingFolders = false
const isLoadingFolders = ref(false)
const folderLoadError = ref('')

const isBusy = computed(() => isVerifying.value || isLoading.value || isSyncing.value || isSavingCloudDraft.value)
const isAuthenticated = computed(() => Boolean(adminSession.value && adminSession.value.expiresAt > Date.now()))
const isCreating = computed(() => editorMode.value === 'create')
const hasEditorDraft = computed(() => editorMode.value !== 'idle')
const needsMarkdown = computed(() => adminRecordNeedsMarkdown(draft.type))
const canSave = computed(() => Boolean(hasEditorDraft.value && isAuthenticated.value && draft.id.trim() && draft.type))
const canSaveCloudDraft = computed(() => !isBusy.value && isAuthenticated.value && Boolean(pendingChanges.value.length || Object.keys(editorDrafts.value).length || hasEditorDraft.value))
const canDeleteDraft = computed(() => !isCreating.value && draft.type !== 'about')
const canCreateSelectedType = computed(() => selectedType.value !== 'about')
const canSyncDataCapsule = computed(() => !isBusy.value && Boolean(pendingChanges.value.length || canSave.value))
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
const showPhotosField = computed(() => hasDraftField('photos'))
const showIconField = computed(() => hasDraftField('icon'))
const showLrcField = computed(() => draft.type === 'music')
const visibleUploadTargets = computed(() => uploadFolderConfigs.filter((target) => {
  if (target.key === 'music' || target.key === 'lyric') return draft.type === 'music'
  return false
}))
const defaultUploadFolder = computed(() => recordUploadFolder())
const momentImages = computed(() => splitLines(imagesText.value))
const momentPreviewImages = computed(() => momentImages.value.map((image) => previewAssetUrl(image)))
const parsedLyrics = computed(() => parseLrc(lrcText.value))
const pendingChangeByKey = computed(() => Object.fromEntries(pendingChanges.value.map((change) => [change.key, change])))
const activePendingChangeKey = computed(() => hasEditorDraft.value ? editorDraftKey.value || selectedRecordKey.value : '')

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

useScrollSticky(adminDataActionsRef, {
  top: '7rem'
})

watch(() => draft.type, (type) => {
  if (hasEditorDraft.value) selectedType.value = type
  updateAutoUploadFolders()
})

watch(() => [draft.id, draft.title], () => {
  updateAutoUploadFolders()
})

watch(albumPhotoUrlsText, () => {
  syncAlbumPhotoRowsFromUrls()
})

watch(pendingChanges, () => {
  persistPendingChanges()
}, {deep: true})

watch(editorDrafts, () => {
  persistEditorDrafts()
}, {deep: true})

onMounted(() => {
  restoreSession()
  if (!isAuthenticated.value) {
    restorePendingChanges()
    restoreEditorDrafts()
  }
  if (isAuthenticated.value) void loadRecords()
})

onBeforeUnmount(() => {
  stashOpenDraft()
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
    lrcUrl: '',
    tags: []
  }
}

function recordKey(record: Pick<AdminDataRecord, 'type' | 'id'>) {
  return `${record.type}:${record.id}`
}

function createDraftKey(type: AdminRecordType) {
  return `create:${type}:${Date.now()}`
}

function setStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMessage.value = message
  statusType.value = type
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const source = error as {
      data?: { message?: unknown; statusMessage?: unknown }
      message?: unknown
      statusMessage?: unknown
      statusText?: unknown
    }
    return String(
      source.data?.message
      || source.data?.statusMessage
      || source.statusMessage
      || source.message
      || source.statusText
      || error
    )
  }

  return String(error)
}

function showTask(title: string, description: string) {
  taskOverlay.active = true
  taskOverlay.title = title
  taskOverlay.description = description
}

function hideTask() {
  taskOverlay.active = false
  taskOverlay.title = ''
  taskOverlay.description = ''
}

function hasDraftField(field: Parameters<typeof adminRecordHasField>[1]) {
  return adminRecordHasField(draft.type, field)
}

function normalizeFolderInput(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, '')
}

function resetUploadFolderTouched() {
  uploadFolderTouched.music = false
  uploadFolderTouched.lyric = false
}

function safePathPart(value: string | undefined, fallback: string) {
  const clean = Array.from(String(value || ''))
      .filter((char) => {
        const code = char.charCodeAt(0)
        return code > 31 && code !== 127
      })
      .join('')
      .replace(/[<>:"/\\|?*#%&{}^~[\]`]/g, '_')
      .trim()

  return clean || fallback
}

function recordUploadFolder() {
  return `${dataFolderByType[draft.type]}/${safePathPart(draft.id.trim() || draft.title?.trim(), '未命名')}`
}

function folderFromAssetUrl(value?: string) {
  if (!value) return ''

  try {
    const url = new URL(value)
    const parts = url.pathname
        .split('/')
        .filter(Boolean)
        .map((part) => decodeURIComponent(part))

    parts.pop()
    if (/^s3\.cstcloud\.cn$/i.test(url.hostname) && parts.length > 1) parts.shift()
    return normalizeFolderInput(parts.join('/'))
  } catch {
    const parts = value.split(/[?#]/)[0]?.split('/').filter(Boolean) || []
    parts.pop()
    return normalizeFolderInput(parts.join('/'))
  }
}

function uploadFolderDefaultForTarget(target: UploadFolderTarget, record: AdminDataRecord = draft) {
  if (target === 'music') return folderFromAssetUrl(record.url) || recordUploadFolder()
  return folderFromAssetUrl(record.lrcUrl) || folderFromAssetUrl(record.url) || recordUploadFolder()
}

function setAutoUploadFolders(record: AdminDataRecord = draft) {
  uploadFolders.music = uploadFolderDefaultForTarget('music', record)
  uploadFolders.lyric = uploadFolderDefaultForTarget('lyric', record)
}

function updateAutoUploadFolders() {
  if (!hasEditorDraft.value) return
  if (!uploadFolderTouched.music) uploadFolders.music = uploadFolderDefaultForTarget('music')
  if (!uploadFolderTouched.lyric) uploadFolders.lyric = uploadFolderDefaultForTarget('lyric')
}

function uploadFolder(target: UploadFolderTarget) {
  return normalizeFolderInput(uploadFolders[target]) || defaultUploadFolder.value
}

function filteredUploadFolders(target: UploadFolderTarget) {
  const query = normalizeFolderInput(uploadFolders[target]).toLowerCase()
  if (!query) return dataCapsuleFolders.value

  return dataCapsuleFolders.value
      .filter((folder) => folder.toLowerCase().includes(query))
      .slice(0, 12)
}

function highlightFolderParts(folder: string, query: string) {
  return highlightSearchParts(folder, query)
}

function folderEmptyMessage(target: UploadFolderTarget) {
  const query = normalizeFolderInput(uploadFolders[target])
  if (isLoadingFolders.value) return '正在加载目录...'
  if (folderLoadError.value) return `目录加载失败：${folderLoadError.value}`
  if (!dataCapsuleFolders.value.length) return '无已存在目录，可输入新建'
  if (!query) return '无已存在目录，可输入新建'
  return `将新建文件夹：${query}`
}

function openFolderDropdown(target: UploadFolderTarget) {
  activeFolderTarget.value = target
  if (!hasTriedLoadingFolders && !isLoadingFolders.value && isAuthenticated.value) void loadDataCapsuleFolders()
}

function closeFolderDropdown() {
  activeFolderTarget.value = ''
}

function setFolderDropdownOpen(target: UploadFolderTarget, isOpen: boolean) {
  activeFolderTarget.value = isOpen ? target : ''
  if (isOpen && !hasTriedLoadingFolders && !isLoadingFolders.value && isAuthenticated.value) void loadDataCapsuleFolders()
}

function selectUploadFolder(target: UploadFolderTarget, folder: string) {
  uploadFolderTouched[target] = true
  uploadFolders[target] = folder
  closeFolderDropdown()
}

function handleUploadFolderInput(target: UploadFolderTarget) {
  uploadFolderTouched[target] = true
  openFolderDropdown(target)
}

async function loadDataCapsuleFolders() {
  if (!isAuthenticated.value || isLoadingFolders.value) return
  hasTriedLoadingFolders = true
  folderLoadError.value = ''
  isLoadingFolders.value = true
  try {
    const response = await $fetch<{ folders: string[], error?: string }>('/api/admin/folders', {
      headers: requestHeaders()
    })
    dataCapsuleFolders.value = Array.isArray(response.folders) ? response.folders : []
    folderLoadError.value = response.error || ''
  } catch (error) {
    console.warn('[admin-data:load-folders]', error)
    folderLoadError.value = errorMessage(error)
  } finally {
    isLoadingFolders.value = false
  }
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

function previewAssetUrl(value?: string) {
  return value || ''
}

function restorePendingChanges() {
  if (!import.meta.client) return
  const raw = window.localStorage.getItem(pendingChangesStorageKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as AdminPendingChange[]
    if (Array.isArray(parsed)) pendingChanges.value = parsed
  } catch {
    window.localStorage.removeItem(pendingChangesStorageKey)
  }
}

function persistPendingChanges() {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(pendingChangesStorageKey, JSON.stringify(pendingChanges.value))
  } catch (error) {
    console.warn('[admin-data:persist-pending]', error)
  }
}

function restoreEditorDrafts() {
  if (!import.meta.client) return
  const raw = window.localStorage.getItem(editorDraftsStorageKey)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    editorDrafts.value = normalizeEditorDrafts(parsed)
  } catch {
    window.localStorage.removeItem(editorDraftsStorageKey)
  }
}

async function restoreCloudDraftState() {
  if (!isAuthenticated.value) return false

  try {
    const cloudState = await $fetch<AdminCloudDraftState>('/api/admin/drafts', {
      headers: requestHeaders()
    })
    const cloudPendingChanges = Array.isArray(cloudState.pendingChanges) ? cloudState.pendingChanges : []
    const cloudDrafts = normalizeEditorDrafts(cloudState.drafts)
    const hasCloudState = cloudPendingChanges.length || Object.keys(cloudDrafts).length
    if (!hasCloudState) return false

    pendingChanges.value = cloudPendingChanges
    editorDrafts.value = cloudDrafts
    pruneEditorDrafts()
    setStatus('已恢复云端草稿和待同步数据', 'success')
    return true
  } catch (error) {
    console.warn('[admin-data:cloud-drafts]', error)
    return false
  }
}

function restoreRecordsCache() {
  if (!import.meta.client || records.value.length) return false
  const raw = window.localStorage.getItem(adminRecordsCacheStorageKey)
  if (!raw) return false

  try {
    const parsed = JSON.parse(raw) as AdminRecordsResponse & { cachedAt?: number }
    if (!Array.isArray(parsed.records)) return false
    sourceRecords.value = parsed.records
    applyPendingChanges(parsed.records)
    setStatus(`已先显示缓存的 ${records.value.length} 条记录，正在刷新远端数据`, 'info')
    return true
  } catch {
    window.localStorage.removeItem(adminRecordsCacheStorageKey)
    return false
  }
}

function persistRecordsCache(nextRecords: AdminManagedRecord[]) {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(adminRecordsCacheStorageKey, JSON.stringify({
      records: nextRecords,
      cachedAt: Date.now()
    }))
  } catch (error) {
    console.warn('[admin-data:persist-records-cache]', error)
  }
}

function persistEditorDrafts() {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(editorDraftsStorageKey, JSON.stringify(editorDrafts.value))
  } catch (error) {
    console.warn('[admin-data:persist-drafts]', error)
  }
}

function removeEditorDraft(key: string) {
  const {[key]: _removed, ...nextDrafts} = editorDrafts.value
  editorDrafts.value = nextDrafts
}

function isEditorDraftCache(value: unknown): value is EditorDraftCache {
  if (!value || typeof value !== 'object') return false
  const draftCache = value as Partial<EditorDraftCache>
  return (draftCache.mode === 'create' || draftCache.mode === 'edit') && Boolean(draftCache.record?.type)
}

function normalizeEditorDrafts(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const drafts: Record<string, EditorDraftCache> = {}

  Object.entries(value).forEach(([key, cache]) => {
    if (isEditorDraftCache(cache)) drafts[key] = cache
  })

  return drafts
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

function normalizePhotoDrafts(photos: AdminPhoto[]) {
  return photos.map((photo) => ({
    url: String(photo.url || '').trim(),
    caption: photo.caption || ''
  })).filter((photo) => photo.url)
}

function syncAlbumPhotoRowsFromUrls() {
  const urls = splitLines(albumPhotoUrlsText.value)
  const previous = new Map(albumPhotoDrafts.value.map((photo) => [photo.url, photo.caption || '']))
  albumPhotoDrafts.value = urls.map((url) => ({
    url,
    caption: previous.get(url) || ''
  }))
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
    lrcUrl: record.lrcUrl || '',
    contentUrl: record.contentUrl || '',
    path: record.path || '',
    tags: [...(record.tags || [])]
  })

  tagsText.value = (record.tags || []).join(', ')
  contentText.value = record.content || ''
  lrcText.value = record.lrc || ''
  imagesText.value = Array.isArray(record.images) ? record.images.join('\n') : ''
  albumPhotoDrafts.value = normalizePhotoDrafts(record.photos || [])
  albumPhotoUrlsText.value = albumPhotoDrafts.value.map((photo) => photo.url).join('\n')
  musicFile.value = undefined
  typeFields.mood = String(record.mood || '')
  typeFields.location = String(record.location || '')
  typeFields.artist = String(record.artist || '')
  typeFields.icon = String(record.icon || '')
  originalId.value = record.id
  resetUploadFolderTouched()
  setAutoUploadFolders(record)
}

function clearEditorDraft(type: AdminRecordType = selectedType.value) {
  selectedRecordKey.value = ''
  editorDraftKey.value = ''
  originalId.value = ''
  editorMode.value = 'idle'
  Object.assign(draft, createEmptyRecord(type))
  tagsText.value = ''
  contentText.value = ''
  lrcText.value = ''
  imagesText.value = ''
  albumPhotoUrlsText.value = ''
  albumPhotoDrafts.value = []
  musicFile.value = undefined
  typeFields.mood = ''
  typeFields.location = ''
  typeFields.artist = ''
  typeFields.icon = ''
  resetUploadFolderTouched()
  setAutoUploadFolders()
}

function currentEditorCache(): EditorDraftCache {
  return {
    mode: editorMode.value,
    selectedKey: selectedRecordKey.value,
    originalId: originalId.value,
    record: buildRecordPayload(),
    content: contentText.value,
    lrc: lrcText.value,
    musicFile: musicFile.value,
    tagsText: tagsText.value,
    imagesText: imagesText.value,
    albumPhotoUrlsText: albumPhotoUrlsText.value,
    albumPhotoDrafts: albumPhotoDrafts.value,
    typeFields: {...typeFields}
  }
}

function shouldKeepEditorDraft() {
  if (!hasEditorDraft.value || !editorDraftKey.value || !draft.type) return false
  if (pendingChanges.value.some((change) => change.key === editorDraftKey.value || change.key === selectedRecordKey.value)) return false

  try {
    const {
      record,
      sourceKey,
      snapshot,
      content,
      lrc,
      nextMusicFile
    } = buildDraftChangePayload()

    if (!record.id.trim()) {
      return normalizedChangeValue({
        record,
        content,
        lrc,
        musicPath: nextMusicFile?.path
      }) !== normalizedChangeValue({
        record: createEmptyRecord(record.type),
        content: '',
        lrc: '',
        musicPath: undefined
      })
    }

    if (pendingChanges.value.some((change) => change.key === sourceKey)) return false

    return hasDraftChanged({
      base: snapshot,
      record,
      content,
      lrc,
      musicPath: nextMusicFile?.path
    })
  } catch {
    return false
  }
}

function stashEditorDraft() {
  if (!hasEditorDraft.value || !editorDraftKey.value) return
  if (!shouldKeepEditorDraft()) {
    removeEditorDraft(editorDraftKey.value)
    if (selectedRecordKey.value && selectedRecordKey.value !== editorDraftKey.value) removeEditorDraft(selectedRecordKey.value)
    return
  }

  try {
    editorDrafts.value[editorDraftKey.value] = currentEditorCache()
  } catch {
    removeEditorDraft(editorDraftKey.value)
  }
}

function stashOpenDraft() {
  const result = saveDraftChange('auto')
  if (result === 'invalid' || result === 'error') stashEditorDraft()
  return result
}

function restoreEditorCache(key: string) {
  const cache = editorDrafts.value[key]
  if (!cache) return false
  editorMode.value = cache.mode
  selectedRecordKey.value = cache.selectedKey
  originalId.value = cache.originalId
  Object.assign(draft, cache.record)
  contentText.value = cache.content
  lrcText.value = cache.lrc
  musicFile.value = cache.musicFile
  tagsText.value = cache.tagsText
  imagesText.value = cache.imagesText
  albumPhotoDrafts.value = cache.albumPhotoDrafts || []
  albumPhotoUrlsText.value = cache.albumPhotoUrlsText || albumPhotoDrafts.value.map((photo) => photo.url).join('\n')
  Object.assign(typeFields, cache.typeFields || {})
  resetUploadFolderTouched()
  setAutoUploadFolders(cache.record)
  return true
}

function buildRecordPayload() {
  const photos = hasDraftField('photos')
      ? albumPhotoDrafts.value.map((photo) => ({
        url: String(photo.url || '').trim(),
        caption: photo.caption?.trim() || undefined
      })).filter((photo) => photo.url)
      : undefined

  return {
    id: draft.type === 'about' ? 'about' : draft.id.trim(),
    type: draft.type,
    title: hasDraftField('title') ? draft.title?.trim() : undefined,
    description: hasDraftField('description') ? draft.description?.trim() : undefined,
    date: hasDraftField('date') ? draft.date?.trim() : undefined,
    cover: hasDraftField('cover') ? draft.cover?.trim() : undefined,
    url: hasDraftField('url') ? draft.url?.trim() : undefined,
    lrcUrl: draft.type === 'music' ? draft.lrcUrl?.trim() : undefined,
    contentUrl: adminRecordNeedsMarkdown(draft.type) ? draft.contentUrl?.trim() : undefined,
    tags: hasDraftField('tags') ? tagsText.value.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    mood: hasDraftField('mood') ? typeFields.mood.trim() || undefined : undefined,
    location: hasDraftField('location') ? typeFields.location.trim() || undefined : undefined,
    images: hasDraftField('images') ? splitLines(imagesText.value) : undefined,
    artist: hasDraftField('artist') ? typeFields.artist.trim() || undefined : undefined,
    photos,
    icon: hasDraftField('icon') ? typeFields.icon.trim() || undefined : undefined
  } satisfies AdminDataRecord
}

function emptyToUndefined(value?: string) {
  const text = String(value || '').trim()
  return text || undefined
}

function sortedTextList(values?: string[]) {
  return (values || []).map((value) => String(value || '').trim()).filter(Boolean)
}

function markdownFirstParagraph(content = '') {
  const withoutFrontmatter = content
      .replace(/^---\s*[\s\S]*?\r?\n---\s*/, '')
      .replace(/```[\s\S]*?```/g, ' ')
  const paragraph = withoutFrontmatter
      .split(/\r?\n\s*\r?\n/)
      .map((block) => block
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .join(' '))
      .find(Boolean) || ''

  return paragraph
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^[\s-]*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/!\[[^\]]*]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
}

function comparableDescription(record: AdminDataRecord, content?: string) {
  if (record.type === 'moment') {
    return emptyToUndefined(record.description) || emptyToUndefined(markdownFirstParagraph(content))
  }

  return emptyToUndefined(record.description)
}

function comparableContentUrl(record: AdminDataRecord) {
  if (!adminRecordNeedsMarkdown(record.type)) return undefined
  return emptyToUndefined(record.contentUrl) || `/content-data/${record.type === 'post' ? 'posts' : record.type === 'chatter' ? 'chatter' : record.type === 'moment' ? 'moments' : 'about'}/${record.type === 'about' ? 'about' : record.id}.md`
}

function syncComparableRecord(record?: AdminDataRecord, content?: string) {
  if (!record) return null

  return {
    id: emptyToUndefined(record.id) || '',
    type: record.type,
    title: emptyToUndefined(record.title),
    description: comparableDescription(record, content),
    date: emptyToUndefined(record.date),
    cover: emptyToUndefined(record.cover),
    url: emptyToUndefined(record.url),
    lrcUrl: record.type === 'music' ? emptyToUndefined(record.lrcUrl) : undefined,
    contentUrl: comparableContentUrl(record),
    path: emptyToUndefined(record.path),
    tags: sortedTextList(record.tags),
    mood: emptyToUndefined(record.mood),
    location: emptyToUndefined(record.location),
    images: sortedTextList(record.images),
    artist: emptyToUndefined(record.artist),
    photos: (record.photos || []).map((photo) => ({
      url: emptyToUndefined(photo.url) || '',
      caption: emptyToUndefined(photo.caption)
    })).filter((photo) => photo.url),
    icon: emptyToUndefined(record.icon)
  }
}

function normalizedChangeValue(params: {
  record?: AdminDataRecord
  content?: string
  lrc?: string
  musicPath?: string
}) {
  return JSON.stringify({
    record: syncComparableRecord(params.record, params.content),
    content: emptyToUndefined(params.content),
    lrc: emptyToUndefined(params.lrc),
    musicPath: emptyToUndefined(params.musicPath)
  })
}

function hasDraftChanged(params: {
  base?: AdminManagedRecord
  record: AdminDataRecord
  content?: string
  lrc?: string
  musicPath?: string
}) {
  if (!params.base) return true

  return normalizedChangeValue({
    record: params.record,
    content: params.content,
    lrc: params.lrc,
    musicPath: params.musicPath
  }) !== normalizedChangeValue({
    record: params.base,
    content: params.base.content,
    lrc: params.base.lrc,
    musicPath: undefined
  })
}

function isPendingEditorDraft(key: string, cache?: EditorDraftCache) {
  const selectedKey = cache?.selectedKey || ''
  const recordDraftKey = cache?.record?.id ? recordKey(cache.record) : ''
  return pendingChanges.value.some((change) => change.key === key || change.key === selectedKey || change.key === recordDraftKey)
}

function editorDraftHasChanges(cache: EditorDraftCache) {
  const record = cache.record
  const content = adminRecordNeedsMarkdown(record.type) ? cache.content : undefined
  const lrc = record.type === 'music' ? cache.lrc : undefined
  const musicPath = record.type === 'music' ? cache.musicFile?.path : undefined

  if (!record.id.trim()) {
    return normalizedChangeValue({
      record,
      content,
      lrc,
      musicPath
    }) !== normalizedChangeValue({
      record: createEmptyRecord(record.type),
      content: '',
      lrc: '',
      musicPath: undefined
    })
  }

  const sourceKey = cache.selectedKey || recordKey(record)
  const snapshot = sourceRecords.value.find((item) => recordKey(item) === sourceKey)
  return hasDraftChanged({
    base: snapshot,
    record,
    content,
    lrc,
    musicPath
  })
}

function pruneEditorDrafts() {
  const nextDrafts: Record<string, EditorDraftCache> = {}

  Object.entries(editorDrafts.value).forEach(([key, cache]) => {
    if (!isEditorDraftCache(cache)) return
    if (isPendingEditorDraft(key, cache)) return
    if (!editorDraftHasChanges(cache)) return
    nextDrafts[key] = cache
  })

  editorDrafts.value = nextDrafts
}

function selectType(type: AdminRecordType) {
  stashOpenDraft()
  closeFolderDropdown()
  selectedType.value = type
  clearEditorDraft(type)
}

function selectSidebarView(view: 'records' | 'sync') {
  sidebarView.value = view
}

function selectDraftType(type: AdminRecordType) {
  draft.type = type
  closeFolderDropdown()
  isTypeSelectOpen.value = false
}

function createRecord() {
  if (selectedType.value === 'about') return
  stashOpenDraft()
  startCreateRecord(selectedType.value)
}

function startCreateRecord(type: AdminRecordType) {
  const key = createDraftKey(type)
  selectedRecordKey.value = ''
  editorDraftKey.value = key
  originalId.value = ''
  isTypeSelectOpen.value = false
  editorMode.value = 'create'
  syncDraftFromRecord({
    ...createEmptyRecord(type),
    content: '',
    lrc: ''
  })
  editorDraftKey.value = key
}

function selectRecord(record: AdminManagedRecord) {
  stashOpenDraft()
  const key = recordKey(record)
  if (selectedRecordKey.value === key) {
    clearEditorDraft(record.type)
    return
  }

  editorDraftKey.value = key
  if (!restoreEditorCache(key)) {
    editRecord(record)
  }
}

function editRecord(record: AdminManagedRecord) {
  selectedRecordKey.value = recordKey(record)
  editorDraftKey.value = recordKey(record)
  editorMode.value = 'edit'
  syncDraftFromRecord(record)
  void loadRemoteLyricPreview(record)
}

async function loadRemoteLyricPreview(record: AdminManagedRecord) {
  if (record.type !== 'music' || record.lrc || !record.lrcUrl) return

  try {
    lrcText.value = await $fetch<string>(previewAssetUrl(record.lrcUrl), { responseType: 'text' })
  } catch {
    lrcText.value = ''
  }
}

function resetDraft() {
  if (!hasEditorDraft.value) return

  if (isCreating.value) {
    if (editorDraftKey.value) removeEditorDraft(editorDraftKey.value)
    startCreateRecord(selectedType.value)
    return
  }

  restoreOriginalRecord(selectedRecordKey.value || editorDraftKey.value, '内容已重置，并已退出待同步区')
}

function applyPendingChanges(baseRecords: AdminManagedRecord[], changes = pendingChanges.value) {
  const nextRecords = baseRecords.map((record) => ({...record}))

  changes.forEach((change) => {
    if (change.action === 'save' && change.record) {
      const nextRecord: AdminManagedRecord = {
        ...change.record,
        content: change.content,
        lrc: change.lrc,
        lrcFile: change.snapshot?.lrcFile
      }
      const index = nextRecords.findIndex((record) => record.type === nextRecord.type && record.id === (change.originalId || nextRecord.id))
      if (index >= 0) nextRecords[index] = nextRecord
      else nextRecords.unshift(nextRecord)
      return
    }

    if (change.action === 'delete' && change.id && change.type) {
      const index = nextRecords.findIndex((record) => record.type === change.type && record.id === change.id)
      if (index >= 0) nextRecords.splice(index, 1)
    }
  })

  records.value = nextRecords
}

function upsertPendingChange(change: AdminPendingChange) {
  const index = pendingChanges.value.findIndex((item) => item.key === change.key)
  if (index >= 0) pendingChanges.value[index] = change
  else pendingChanges.value.push(change)
}

function resolveDraftSourceKey(record: AdminDataRecord) {
  return selectedRecordKey.value || recordKey(record)
}

function removePendingChange(key: string) {
  pendingChanges.value = pendingChanges.value.filter((item) => item.key !== key)
}

function sourceRecordByKey(key: string) {
  return sourceRecords.value.find((record) => recordKey(record) === key)
}

function restoreOriginalRecord(key: string, message = '已撤销变更') {
  if (!key) return
  const change = pendingChanges.value.find((item) => item.key === key)
  const snapshot = change?.snapshot || sourceRecordByKey(key)
  const targetType = change?.record?.type || change?.type || snapshot?.type || selectedType.value

  removePendingChange(key)
  removeEditorDraft(key)
  applyPendingChanges(sourceRecords.value)

  if (snapshot) {
    selectedType.value = snapshot.type
    editRecord(snapshot)
  } else {
    clearEditorDraft(targetType)
  }

  setStatus(message, 'success')
}

function buildDraftChangePayload() {
  const record = buildRecordPayload()
  const key = recordKey(record)
  const sourceKey = resolveDraftSourceKey(record)
  const existingSource = sourceRecords.value.find((item) => recordKey(item) === sourceKey)
  const existingPending = pendingChanges.value.find((item) => item.key === sourceKey)
  const snapshot = existingPending?.snapshot || existingSource
  const syncOriginalId = existingPending?.originalId || originalId.value || undefined
  const content = adminRecordNeedsMarkdown(record.type) ? contentText.value : undefined
  const lrc = record.type === 'music' ? lrcText.value : undefined
  const nextMusicFile = record.type === 'music' ? musicFile.value : undefined

  return {
    record,
    key,
    sourceKey,
    existingPending,
    snapshot,
    syncOriginalId,
    content,
    lrc,
    nextMusicFile
  }
}

function saveDraftChange(mode: DraftSaveMode = 'manual'): DraftSaveResult {
  if (!hasEditorDraft.value || !isAuthenticated.value || !draft.type) return 'invalid'
  if (!draft.id.trim()) {
    if (mode === 'manual') setStatus('请先填写 ID 后再保存草稿', 'error')
    return 'invalid'
  }

  try {
    const {
      record,
      key,
      sourceKey,
      existingPending,
      snapshot,
      syncOriginalId,
      content,
      lrc,
      nextMusicFile
    } = buildDraftChangePayload()

    if (!hasDraftChanged({
      base: snapshot,
      record,
      content,
      lrc,
      musicPath: nextMusicFile?.path
    })) {
      if (existingPending) {
        removePendingChange(existingPending.key)
        removeEditorDraft(existingPending.key)
        applyPendingChanges(sourceRecords.value)
      }
      removeEditorDraft(sourceKey)
      if (mode === 'manual') setStatus('内容没有变化，无需保存草稿', 'info')
      return 'unchanged'
    }

    const change: AdminPendingChange = {
      action: 'save',
      key,
      originalId: syncOriginalId,
      record,
      content,
      lrc,
      musicFile: nextMusicFile,
      snapshot,
      updatedAt: new Date().toISOString()
    }

    if (sourceKey && sourceKey !== key) {
      removePendingChange(sourceKey)
      removeEditorDraft(sourceKey)
    }

    upsertPendingChange(change)
    editorDraftKey.value = key
    selectedRecordKey.value = key
    originalId.value = record.id
    editorMode.value = 'edit'
    removeEditorDraft(key)
    applyPendingChanges(sourceRecords.value)
    if (mode === 'manual') setStatus('已保存到待同步区，尚未同步数据胶囊', 'success')
    else if (mode === 'sync') setStatus('已将当前编辑加入本次同步', 'success')
    else setStatus('已自动保存草稿并加入待同步区', 'success')
    return 'saved'
  } catch (error) {
    if (mode === 'manual' || mode === 'sync') setStatus(errorMessage(error), 'error')
    return 'error'
  }
}

async function saveCloudDraft() {
  stashEditorDraft()
  pruneEditorDrafts()

  if (!pendingChanges.value.length && !Object.keys(editorDrafts.value).length) {
    setStatus('暂无需要保存的云端草稿', 'info')
    return
  }

  isSavingCloudDraft.value = true
  showTask('正在保存云端草稿', '正在将草稿和待同步数据写入数据胶囊暂存区。')
  try {
    await $fetch('/api/admin/drafts', {
      method: 'POST',
      headers: requestHeaders(),
      body: {
        drafts: {...editorDrafts.value},
        pendingChanges: [...pendingChanges.value]
      }
    })
    setStatus(`云端草稿已保存：${Object.keys(editorDrafts.value).length} 份草稿，${pendingChanges.value.length} 项待同步`, 'success')
  } catch (error) {
    setStatus(errorMessage(error), 'error')
  } finally {
    isSavingCloudDraft.value = false
    hideTask()
  }
}

function deleteRecord(deleteAssociatedFiles: boolean) {
  if (!selectedRecordKey.value || draft.type === 'about') return
  const target = records.value.find((record) => recordKey(record) === selectedRecordKey.value)
  if (!target) return

  const existingPending = pendingChanges.value.find((item) => item.key === selectedRecordKey.value)
  if (existingPending?.action === 'save' && !existingPending.snapshot) {
    pendingChanges.value = pendingChanges.value.filter((item) => item.key !== selectedRecordKey.value)
    sourceRecords.value = sourceRecords.value.filter((record) => recordKey(record) !== selectedRecordKey.value)
    applyPendingChanges(sourceRecords.value)
    clearEditorDraft(selectedType.value)
    setStatus('已撤销尚未同步的新建记录', 'success')
    return
  }

  upsertPendingChange({
    action: 'delete',
    key: selectedRecordKey.value,
    id: existingPending?.originalId || target.id,
    type: target.type,
    deleteAssociatedFiles,
    snapshot: existingPending?.snapshot || target,
    updatedAt: new Date().toISOString()
  })
  removeEditorDraft(selectedRecordKey.value)
  applyPendingChanges(sourceRecords.value)
  clearEditorDraft(target.type)
  setStatus('删除操作已加入待同步区', 'success')
}

function undoChange(key: string) {
  restoreOriginalRecord(key, '已撤销变更')
}

function openPendingChange(change: AdminPendingChange) {
  stashOpenDraft()

  if (activePendingChangeKey.value === change.key) {
    const targetType = change.record?.type || change.type || change.snapshot?.type || selectedType.value
    clearEditorDraft(targetType)
    return
  }

  if (change.action === 'delete') {
    if (change.snapshot) {
      selectedType.value = change.snapshot.type
      editRecord(change.snapshot)
    }
    return
  }

  const record = records.value.find((item) => recordKey(item) === change.key)
  if (record) {
    selectedType.value = record.type
    editorDraftKey.value = recordKey(record)
    editRecord(record)
  }
}

function changeLabel(change: AdminPendingChange) {
  if (change.action === 'delete') return '删除'
  return change.snapshot ? '修改' : '新增'
}

function changeTitle(change: AdminPendingChange) {
  const record = change.record || change.snapshot
  return record?.title || record?.id || change.id || '未命名记录'
}

function changeSubtitle(change: AdminPendingChange) {
  const record = change.record || change.snapshot
  const typeText = record?.type ? adminRecordTypeLabels[record.type] : change.type ? adminRecordTypeLabels[change.type] : '记录'
  const idText = record?.id || change.id || change.key
  return `${typeText} · ${idText}`
}

function changeTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function verifyToken() {
  if (!adminToken.value.trim()) {
    setStatus('请先输入管理令牌', 'error')
    return
  }

  isVerifying.value = true
  showTask('正在验证管理令牌', '验证通过后会加载管理数据。')
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
    setStatus(errorMessage(error), 'error')
  } finally {
    isVerifying.value = false
    hideTask()
  }
}

async function loadRecords() {
  if (!isAuthenticated.value) {
    clearSession()
    setStatus('请先完成令牌验证', 'error')
    return
  }

  const hasCachedRecords = restoreRecordsCache()
  isLoading.value = true
  if (!hasCachedRecords) showTask('正在加载数据', '正在读取数据胶囊内容源。')
  try {
    const response = await $fetch<AdminRecordsResponse>('/api/admin/records', {
      headers: requestHeaders()
    })
    const hasCloudDraft = await restoreCloudDraftState()
    if (!hasCloudDraft) {
      restorePendingChanges()
      restoreEditorDrafts()
    }
    void loadDataCapsuleFolders()
    sourceRecords.value = response.records
    pruneEditorDrafts()
    persistRecordsCache(response.records)
    applyPendingChanges(response.records)
    setStatus(`已加载 ${records.value.length} 条记录`, 'success')
    const currentRecord = records.value.find((record) => recordKey(record) === selectedRecordKey.value)
    if (currentRecord) editRecord(currentRecord)
    else clearEditorDraft(selectedType.value)
  } catch (error) {
    clearSession()
    setStatus(errorMessage(error), 'error')
  } finally {
    isLoading.value = false
    if (!hasCachedRecords) hideTask()
  }
}

async function syncDataCapsule() {
  if (hasEditorDraft.value) saveDraftChange('sync')
  if (!pendingChanges.value.length) {
    setStatus('暂无需要同步的变更', 'info')
    return
  }

  const payload = {changes: pendingChanges.value}
  const payloadBytes = new Blob([JSON.stringify(payload)]).size
  if (payloadBytes > maxSyncPayloadBytes) {
    setStatus(`待同步内容约 ${formatBytes(payloadBytes)}，超过 ${formatBytes(maxSyncPayloadBytes)} 的安全限制，请减少音乐文件大小或分批同步。`, 'error')
    return
  }

  isSyncing.value = true
  showTask('正在同步 GitHub', `正在提交 ${pendingChanges.value.length} 项变更，请不要关闭页面。`)
  try {
    const response = await $fetch<AdminSyncRecordsResponse>('/api/admin/records/sync-github', {
      method: 'POST',
      headers: requestHeaders(),
      body: payload
    })
    sourceRecords.value = response.records
    persistRecordsCache(response.records)
    pendingChanges.value = []
    editorDrafts.value = {}
    records.value = response.records
    const currentRecord = records.value.find((record) => recordKey(record) === selectedRecordKey.value)
    if (currentRecord) editRecord(currentRecord)
    else clearEditorDraft(selectedType.value)
    setStatus(`已同步 ${response.syncedCount} 项变更到 GitHub`, 'success')
  } catch (error) {
    setStatus(errorMessage(error), 'error')
  } finally {
    isSyncing.value = false
    hideTask()
  }
}

async function handleMusicSelected(files: File[]) {
  const file = files[0]
  if (!file) return

  showTask('正在上传音乐文件', `音乐文件会上传到 ${uploadFolder('music')} 目录，记录中只保存远程地址。`)
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', uploadFolder('music'))
    formData.append('fileName', draft.id.trim() || draft.title?.trim() || '音乐')
    const uploaded = await $fetch<AdminMusicFilePayload>('/api/admin/music', {
      method: 'POST',
      headers: requestHeaders(),
      body: formData
    })
    musicFile.value = uploaded
    draft.url = uploaded.publicUrl
    setStatus('音乐文件已上传，保存草稿后进入待同步区', 'success')
  } catch (error) {
    setStatus(errorMessage(error), 'error')
  } finally {
    hideTask()
  }
}

async function handleLyricSelected(files: File[]) {
  const file = files[0]
  if (!file) return

  showTask('正在上传歌词文件', `歌词文件会上传到 ${uploadFolder('lyric')} 目录，记录中只保存远程地址。`)
  try {
    lrcText.value = await file.text()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', uploadFolder('lyric'))
    formData.append('fileName', draft.id.trim() || draft.title?.trim() || 'lyric')
    const uploaded = await $fetch<AdminUploadedFilePayload>('/api/admin/lyric', {
      method: 'POST',
      headers: requestHeaders(),
      body: formData
    })
    draft.lrcUrl = uploaded.publicUrl
    setStatus('歌词已上传，保存草稿后进入待同步区', 'success')
  } catch (error) {
    setStatus(errorMessage(error), 'error')
  } finally {
    hideTask()
  }
}

function clearMusicFile() {
  musicFile.value = undefined
  draft.url = ''
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

useHead(() => ({
  title: '管理数据：倚肆的小屋'
}))
</script>
