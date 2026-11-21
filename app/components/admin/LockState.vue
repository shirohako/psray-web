<script setup lang="ts">
import { Lock, RotateCcw, Undo2 } from 'lucide'

/**
 * Where a field stands against its upstream source (IGDB / PSN):
 * `locked` — a manual value the sync no longer overwrites, with a restore button;
 * `lock` — edited, kept after saving; `unlock` — handed back on save, with undo;
 * `free` — follows upstream (rendered only with `showFree`).
 */
withDefaults(defineProps<{
  state: 'locked' | 'lock' | 'unlock' | 'free'
  source: string
  showFree?: boolean
  /** Hide the restore button, e.g. when there is no upstream to restore from. */
  noRestore?: boolean
}>(), { showFree: false, noRestore: false })
defineEmits<{ restore: [], cancel: [] }>()
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 -translate-y-0.5"
    leave-active-class="transition duration-100 ease-in"
    leave-to-class="opacity-0"
  >
    <span v-if="state === 'locked'" key="locked" class="inline-flex items-center gap-2">
      <span class="inline-flex h-5 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 text-[11px] font-semibold text-amber-700">
        <LucideIcon :icon="Lock" class="size-3" />已人工修改
      </span>
      <button v-if="!noRestore" type="button" class="admin-link" :title="`改回 ${source} 的值，之后跟随 ${source} 更新`" @click="$emit('restore')">
        <LucideIcon :icon="RotateCcw" class="size-3" />恢复 {{ source }}
      </button>
    </span>
    <span v-else-if="state === 'lock'" key="lock" class="inline-flex h-5 items-center gap-1 rounded-full border border-dashed border-amber-300 px-2 text-[11px] font-semibold text-amber-700" :title="`保存后 ${source} 同步不再覆盖`">
      <LucideIcon :icon="Lock" class="size-3" />保存后锁定
    </span>
    <span v-else-if="state === 'unlock'" key="unlock" class="inline-flex items-center gap-2">
      <span class="inline-flex h-5 items-center gap-1 rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-600">
        <LucideIcon :icon="RotateCcw" class="size-3" />保存后跟随 {{ source }}
      </span>
      <button type="button" class="admin-link" @click="$emit('cancel')"><LucideIcon :icon="Undo2" class="size-3" />撤销</button>
    </span>
    <span v-else-if="showFree" key="free" class="text-[11px] text-slate-400">跟随 {{ source }}</span>
  </Transition>
</template>
