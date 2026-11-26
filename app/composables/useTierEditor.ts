import type { InjectionKey } from 'vue'
import type { GameBrowseItem } from '~/services/games'
import {
  addItem,
  clearRow,
  createTierList,
  duplicateTierList,
  insertRow,
  itemCount,
  itemFromGame,
  itemFromUpload,
  moveItem,
  moveRow,
  newTierId,
  parseTierStore,
  removeItem,
  removeRow,
  resetPlacements,
  TIER_LIMITS,
  TIER_POOL,
  TIER_STORE_KEY,
  TIER_STORE_VERSION,
  type TierItem,
  type TierList,
  type TierStore,
} from '~/utils/tierList'
import { deleteTierImage, listTierImages, prepareTierImage, saveTierImage, TIER_IMAGE_MAX_BYTES } from '~/utils/tierListImages'
import { useTierDrag, type TierDragPayload, type TierZoneTarget } from '~/composables/useTierDrag'

/**
 * State and actions of the tier list maker, shared with its components
 * through provide/inject: `provideTierEditor()` in the editor root,
 * `useTierEditor()` below it. Client only (localStorage, IndexedDB).
 */

/** An image from the local library, with an object URL to show it. */
export interface TierLibraryImage {
  id: string
  name: string
  url: string
  createdAt: number
}

const KEY: InjectionKey<TierEditor> = Symbol('tier-editor')

function createTierEditor() {
  const { t } = useI18n()
  const toast = useToast()

  const store = reactive<TierStore>({ version: TIER_STORE_VERSION, activeId: null, lists: [] })
  const ready = ref(false)
  const list = computed<TierList | null>(() => store.lists.find(candidate => candidate.id === store.activeId) ?? null)
  /** Most recently edited first. */
  const lists = computed(() => [...store.lists].sort((a, b) => b.updatedAt - a.updatedAt))

  const images = ref<TierLibraryImage[]>([])
  const imagesReady = ref(false)
  const imageUrls = computed(() => new Map(images.value.map(image => [image.id, image.url])))

  // ---------- persistence ----------

  let applyingRemote = false
  let saveTimer = 0
  let warnedFull = false

  function save() {
    window.clearTimeout(saveTimer)
    saveTimer = 0
    try {
      localStorage.setItem(TIER_STORE_KEY, JSON.stringify(store))
      warnedFull = false
    }
    catch {
      if (!warnedFull) toast.error({ id: 'tierlist-storage-full', title: t('tierlist.storageFull') })
      warnedFull = true
    }
  }

  watch(store, () => {
    if (applyingRemote || !ready.value) return
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(save, 250)
  }, { deep: true })

  /** Another tab saved: take its lists, keep the one open here. */
  function onStorage(event: StorageEvent) {
    if (event.key !== TIER_STORE_KEY || !event.newValue) return
    const next = parseTierStore(event.newValue)
    applyingRemote = true
    const activeId = store.activeId
    store.lists = next.lists
    store.activeId = next.lists.some(candidate => candidate.id === activeId) ? activeId : next.activeId
    if (!store.lists.length) ensureList()
    nextTick(() => { applyingRemote = false })
  }

  function ensureList() {
    if (store.lists.length) return
    const created = createTierList(t('tierlist.defaultTitle'))
    store.lists.push(created)
    store.activeId = created.id
  }

  async function loadImages() {
    try {
      const stored = await listTierImages()
      images.value = stored.map(image => ({ id: image.id, name: image.name, url: URL.createObjectURL(image.blob), createdAt: image.createdAt }))
    }
    catch {
      images.value = []
    }
    imagesReady.value = true
  }

  onMounted(() => {
    const loaded = parseTierStore(localStorage.getItem(TIER_STORE_KEY))
    store.lists = loaded.lists
    store.activeId = loaded.activeId
    ensureList()
    ready.value = true
    window.addEventListener('storage', onStorage)
    window.addEventListener('pagehide', flush)
    loadImages()
  })

  /** Writes a pending save at once (leaving the page, closing the tab). */
  function flush() {
    if (saveTimer) save()
  }

  onBeforeUnmount(() => {
    flush()
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('pagehide', flush)
    for (const image of images.value) URL.revokeObjectURL(image.url)
  })

  // ---------- editing the open list ----------

  /** Runs an edit on the open list and stamps it when something changed. */
  function edit(change: (target: TierList) => boolean | unknown): boolean {
    const target = list.value
    if (!target) return false
    const changed = Boolean(change(target))
    if (changed) target.updatedAt = Date.now()
    return changed
  }

  function warnItemLimit() {
    toast.warning({ id: 'tierlist-item-limit', title: t('tierlist.limits.items', { count: TIER_LIMITS.items }) })
  }

  function addToList(item: TierItem, zone = TIER_POOL, index?: number) {
    const target = list.value
    if (!target || target.items[item.id]) return false
    if (itemCount(target) >= TIER_LIMITS.items) {
      warnItemLimit()
      return false
    }
    return edit(current => addItem(current, item, zone, index))
  }

  const addGame = (game: GameBrowseItem) => addToList(itemFromGame(game))
  const addImage = (image: TierLibraryImage) => addToList(itemFromUpload(image))
  const has = (itemId: string) => Boolean(list.value?.items[itemId])

  const actions = {
    setTitle: (title: string) => edit((current) => {
      current.title = title.slice(0, TIER_LIMITS.title)
      return true
    }),
    move: (itemId: string, zone: string, index?: number) => edit(current => moveItem(current, itemId, zone, index)),
    remove: (itemId: string) => edit(current => removeItem(current, itemId)),
    insertRow: (index: number) => {
      if ((list.value?.rows.length ?? 0) >= TIER_LIMITS.rows) {
        toast.warning({ id: 'tierlist-row-limit', title: t('tierlist.limits.rows', { count: TIER_LIMITS.rows }) })
        return false
      }
      return edit(current => insertRow(current, index, t('tierlist.newRow')))
    },
    removeRow: (rowId: string) => edit(current => removeRow(current, rowId)),
    clearRow: (rowId: string) => edit(current => clearRow(current, rowId)),
    moveRow: (rowId: string, index: number) => edit(current => moveRow(current, rowId, index)),
    updateRow: (rowId: string, patch: { label?: string, color?: string }) => edit((current) => {
      const row = current.rows.find(candidate => candidate.id === rowId)
      if (!row) return false
      if (patch.label !== undefined) row.label = patch.label.slice(0, TIER_LIMITS.label)
      if (patch.color !== undefined && /^#[0-9a-f]{6}$/i.test(patch.color)) row.color = patch.color.toLowerCase()
      return true
    }),
    reset: () => edit(current => resetPlacements(current)),
  }

  // ---------- lists ----------

  function createList() {
    if (store.lists.length >= TIER_LIMITS.lists) {
      toast.warning({ id: 'tierlist-list-limit', title: t('tierlist.limits.lists', { count: TIER_LIMITS.lists }) })
      return null
    }
    const created = createTierList(t('tierlist.newTitle'))
    store.lists.push(created)
    store.activeId = created.id
    return created
  }

  function duplicateList(id: string) {
    const source = store.lists.find(candidate => candidate.id === id)
    if (!source) return null
    if (store.lists.length >= TIER_LIMITS.lists) {
      toast.warning({ id: 'tierlist-list-limit', title: t('tierlist.limits.lists', { count: TIER_LIMITS.lists }) })
      return null
    }
    const copy = duplicateTierList(source, t('tierlist.copyTitle', { title: source.title || t('tierlist.untitled') }).slice(0, TIER_LIMITS.title))
    store.lists.push(copy)
    return copy
  }

  function deleteList(id: string) {
    const index = store.lists.findIndex(candidate => candidate.id === id)
    if (index < 0) return
    store.lists.splice(index, 1)
    if (store.activeId === id) store.activeId = lists.value[0]?.id ?? null
    ensureList()
  }

  function openList(id: string) {
    if (store.lists.some(candidate => candidate.id === id)) store.activeId = id
  }

  // ---------- images ----------

  const uploading = ref(false)

  async function upload(files: Iterable<File>) {
    const target = list.value
    if (!target || uploading.value) return
    uploading.value = true
    let added = 0
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.warning({ title: t('tierlist.upload.notImage', { name: file.name }) })
          continue
        }
        if (file.size > TIER_IMAGE_MAX_BYTES) {
          toast.warning({ title: t('tierlist.upload.tooLarge', { name: file.name }) })
          continue
        }
        if (itemCount(target) >= TIER_LIMITS.items) {
          warnItemLimit()
          break
        }
        try {
          const image = await prepareTierImage(file, newTierId('i'))
          await saveTierImage(image)
          const entry = { id: image.id, name: image.name, url: URL.createObjectURL(image.blob), createdAt: image.createdAt }
          images.value.unshift(entry)
          // The list may have been switched while this file was being read.
          if (list.value === target && edit(current => addItem(current, itemFromUpload(entry)))) added++
        }
        catch {
          toast.error({ title: t('tierlist.upload.failed', { name: file.name }) })
        }
      }
    }
    finally {
      uploading.value = false
    }
    if (added) toast.success({ id: 'tierlist-upload', title: t('tierlist.upload.done', added) })
  }

  /** Deletes an image from this device and from every list that uses it. */
  async function deleteImage(id: string) {
    try {
      await deleteTierImage(id)
    }
    catch {
      toast.error({ title: t('tierlist.images.deleteFailed') })
      return
    }
    const itemId = `u${id}`
    for (const candidate of store.lists) {
      if (removeItem(candidate, itemId)) candidate.updatedAt = Date.now()
    }
    const index = images.value.findIndex(image => image.id === id)
    if (index >= 0) {
      URL.revokeObjectURL(images.value[index]!.url)
      images.value.splice(index, 1)
    }
  }

  /** Where a tile's picture comes from: the cover URL, or the uploaded image. */
  function itemSrc(item: TierItem): string | null {
    if (item.cover) return item.cover
    return item.imageId ? imageUrls.value.get(item.imageId) ?? null : null
  }

  // ---------- drag and drop ----------

  function onDrop(payload: TierDragPayload, target: { zone: TierZoneTarget | null, row: number | null }) {
    if (payload.kind === 'row') {
      if (target.row !== null) actions.moveRow(payload.rowId, target.row)
      return
    }
    if (!target.zone) return
    const { zone, index } = target.zone
    if (payload.kind === 'item' || has(payload.item.id)) {
      actions.move(payload.kind === 'item' ? payload.itemId : payload.item.id, zone, index)
      return
    }
    addToList(payload.item, zone, index)
  }

  const drag = useTierDrag(onDrop)

  // reactive(): templates read `editor.list`, `editor.drag.state` without `.value`.
  return reactive({
    ready,
    list,
    lists,
    images,
    imagesReady,
    uploading,
    drag,
    has,
    itemSrc,
    addGame,
    addImage,
    upload,
    deleteImage,
    createList,
    duplicateList,
    deleteList,
    openList,
    ...actions,
  })
}

export type TierEditor = ReturnType<typeof createTierEditor>

export function provideTierEditor(): TierEditor {
  const editor = createTierEditor()
  provide(KEY, editor)
  return editor
}

export function useTierEditor(): TierEditor {
  const editor = inject(KEY)
  if (!editor) throw new Error('useTierEditor() needs provideTierEditor() in a parent component')
  return editor
}
