<script setup lang="ts">
import { Check, Globe, PencilLine, SquarePen, Undo2 } from 'lucide'
import { formatRegion, sortRegion, TROPHY_SET_REGIONS } from '~/utils/adminTrophySet'

/**
 * A trophy set's region & edition tags (docs/api/admin/trophy-sets/region.md):
 * the chosen tags, and a dialog of cards to pick them from the fixed list — no
 * free text. The dialog works on a copy; 「完成」 hands it to the page, which
 * saves it with everything else. Not PSN data and not per language.
 */
const model = defineModel<string[]>({ required: true })
const props = defineProps<{
  /** What is saved now, to mark and undo a pending change. */
  saved: string[]
}>()

const changed = computed(() => formatRegion(model.value) !== formatRegion(props.saved))
const groups = [
  { kind: 'region', label: '地区', note: 'PSN 商店区域' },
  { kind: 'edition', label: '版本', note: '实体 / 数字等' },
].map(group => ({ ...group, tags: TROPHY_SET_REGIONS.filter(tag => tag.kind === group.kind) }))

const open = ref(false)
const picked = ref<string[]>([])
const preview = computed(() => formatRegion(picked.value))
function edit() {
  picked.value = sortRegion(model.value)
  open.value = true
}
function toggle(code: string) {
  picked.value = picked.value.includes(code) ? picked.value.filter(c => c !== code) : sortRegion([...picked.value, code])
}
function done() {
  model.value = sortRegion(picked.value)
  open.value = false
}
</script>

<template>
  <div>
    <div class="mb-1.5 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
      <span class="text-xs font-medium text-slate-700">地区与版本</span>
      <span class="text-[11px] text-slate-400">不分语言，前台用来区分同一游戏的多个奖杯组</span>
      <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-0.5" leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0">
        <span v-if="changed" class="ml-auto inline-flex items-center gap-2">
          <span class="inline-flex h-5 items-center gap-1 rounded-full border border-dashed border-amber-300 px-2 text-[11px] font-semibold text-amber-700">
            <LucideIcon :icon="PencilLine" class="size-3" />已修改，未保存
          </span>
          <button type="button" class="admin-link" @click="model = [...saved]"><LucideIcon :icon="Undo2" class="size-3" />撤销</button>
        </span>
      </Transition>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <AdminTrophySetRegionTags :region="model" />
      <button type="button" class="admin-button" @click="edit"><LucideIcon :icon="SquarePen" class="size-3.5" />{{ model.length ? '修改' : '设置' }}</button>
    </div>

    <Dialog v-model:open="open" title="地区与版本" size="3xl">
      <div class="space-y-5 p-5">
        <section v-for="group in groups" :key="group.kind">
          <h3 class="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-slate-900">
            {{ group.label }}<span class="text-xs font-normal text-slate-400">{{ group.note }}，可多选</span>
          </h3>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              v-for="tag in group.tags"
              :key="tag.code"
              type="button"
              role="checkbox"
              :aria-checked="picked.includes(tag.code)"
              class="relative flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 motion-reduce:transition-none"
              :class="picked.includes(tag.code)
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'"
              @click="toggle(tag.code)"
            >
              <span class="mb-1 flex items-center gap-2">
                <AdminTrophySetRegionIcon :code="tag.code" class="h-[18px]" />
                <span class="text-[15px] font-bold tracking-wide transition-colors" :class="picked.includes(tag.code) ? 'text-slate-900' : 'text-slate-600'">{{ tag.code }}</span>
              </span>
              <span class="text-[13px] text-slate-700">{{ tag.label }}</span>
              <span class="h-4 text-[11px] text-slate-400">{{ tag.hint }}</span>
              <Transition enter-active-class="transition duration-150 ease-out motion-reduce:transition-none" enter-from-class="opacity-0 scale-50" leave-active-class="transition duration-100 ease-in motion-reduce:transition-none" leave-to-class="opacity-0 scale-50">
                <span v-if="picked.includes(tag.code)" class="absolute right-2 top-2 grid size-[18px] place-items-center rounded-full bg-slate-900 text-white">
                  <LucideIcon :icon="Check" class="size-3 stroke-3" />
                </span>
              </Transition>
            </button>
          </div>
        </section>
      </div>
      <template #footer>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-slate-400">前台显示</span>
          <span v-if="preview" class="inline-flex h-[18px] items-center gap-1 rounded bg-slate-800 px-1.5 text-[10px] font-bold uppercase leading-none text-white">
            <LucideIcon :icon="Globe" class="size-2.5" />{{ preview }}
          </span>
          <span v-else class="text-xs text-slate-500">不显示</span>
          <span class="ml-auto flex gap-2">
            <button type="button" class="admin-button" :disabled="!picked.length" @click="picked = []">清空</button>
            <button type="button" class="admin-button admin-primary" @click="done">完成</button>
          </span>
        </div>
      </template>
    </Dialog>
  </div>
</template>
