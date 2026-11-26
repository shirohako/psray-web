<script setup lang="ts">
import { CopyPlus, Plus, Trash2 } from 'lucide'
import { itemCount, placedCount, TIER_LIMITS, type TierList } from '~/utils/tierList'

/** Every list saved on this device: open, duplicate, delete, or start a new one. */
const open = defineModel<boolean>('open', { required: true })

const editor = useTierEditor()
const deleting = ref<TierList | null>(null)
const deleteOpen = computed({
  get: () => Boolean(deleting.value),
  set: (value) => { if (!value) deleting.value = null },
})

function openList(list: TierList) {
  editor.openList(list.id)
  open.value = false
}

function create() {
  if (editor.createList()) open.value = false
}

function confirmDelete() {
  if (deleting.value) editor.deleteList(deleting.value.id)
  deleting.value = null
}

const iso = (ms: number) => new Date(ms).toISOString()
const tag = 'inline-flex h-5 items-center rounded border px-1.5 text-[11px] font-medium tabular-nums'
</script>

<template>
  <Dialog v-model:open="open" :title="$t('tierlist.lists.title')" size="lg">
    <ul class="divide-y divide-slate-100">
      <li v-for="list in editor.lists" :key="list.id" class="group flex items-center gap-3 px-4 py-3 sm:px-5">
        <button type="button" class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus:outline-none" @click="openList(list)">
          <!-- The list's tier colours, top to bottom -->
          <span class="flex h-11 w-8 shrink-0 flex-col overflow-hidden rounded ring-1 ring-black/10 transition group-hover:ring-slate-400" aria-hidden="true">
            <span v-for="row in list.rows.slice(0, 8)" :key="row.id" class="flex-1" :style="{ backgroundColor: row.color }" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-slate-900 group-hover:text-sky-700">{{ list.title.trim() || $t('tierlist.untitled') }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-1.5">
              <span v-if="list.id === editor.list?.id" :class="tag" class="border-emerald-200 bg-emerald-50 text-emerald-700">{{ $t('tierlist.lists.current') }}</span>
              <span :class="tag" class="border-slate-200 bg-slate-50 text-slate-600">{{ $t('tierlist.lists.items', itemCount(list)) }}</span>
              <span :class="tag" class="border-slate-200 bg-slate-50 text-slate-600">{{ $t('tierlist.placedCount', placedCount(list)) }}</span>
              <span class="text-[11px] text-slate-400"><LocalTime :value="iso(list.updatedAt)" format="datetime" /></span>
            </span>
          </span>
        </button>
        <div class="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            class="grid size-8 cursor-pointer place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            :title="$t('tierlist.lists.duplicate')"
            :aria-label="$t('tierlist.lists.duplicateNamed', { title: list.title.trim() || $t('tierlist.untitled') })"
            :disabled="editor.lists.length >= TIER_LIMITS.lists"
            @click="editor.duplicateList(list.id)"
          >
            <LucideIcon :icon="CopyPlus" class="size-4" />
          </button>
          <button
            type="button"
            class="grid size-8 cursor-pointer place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            :title="$t('tierlist.lists.delete')"
            :aria-label="$t('tierlist.lists.deleteNamed', { title: list.title.trim() || $t('tierlist.untitled') })"
            @click="deleting = list"
          >
            <LucideIcon :icon="Trash2" class="size-4" />
          </button>
        </div>
      </li>
    </ul>
    <p class="border-t border-slate-100 px-4 py-3 text-[11px] leading-4 text-slate-400 sm:px-5">{{ $t('tierlist.lists.hint') }}</p>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <span class="text-[11px] text-slate-400 tabular-nums">{{ editor.lists.length }} / {{ TIER_LIMITS.lists }}</span>
        <button
          type="button"
          class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="editor.lists.length >= TIER_LIMITS.lists"
          @click="create"
        >
          <LucideIcon :icon="Plus" class="size-3.5" />{{ $t('tierlist.lists.create') }}
        </button>
      </div>
    </template>
  </Dialog>

  <ConfirmDialog
    v-model:open="deleteOpen"
    :title="$t('tierlist.lists.deleteTitle')"
    :icon="Trash2"
    :confirm-label="$t('tierlist.lists.delete')"
    @confirm="confirmDelete"
  >
    <p class="p-4 text-sm leading-6 text-slate-600 sm:p-5">{{ $t('tierlist.lists.deleteBody', { title: deleting?.title.trim() || $t('tierlist.untitled') }) }}</p>
  </ConfirmDialog>
</template>
