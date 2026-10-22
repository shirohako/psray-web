<script setup lang="ts">
import { Loader2, type IconNode } from 'lucide'

/**
 * Asks before a destructive action: what will happen goes in the default
 * slot, then Cancel and a red action button. While `busy`, the action button
 * spins and can't be pressed again. Drive it with `v-model:open`.
 *
 * ```vue
 * <ConfirmDialog v-model:open="open" :title="…" :icon="Trash2" :confirm-label="…" :busy="deleting" @confirm="remove">
 *   <p class="p-4 text-sm leading-6 text-slate-600 sm:p-5">…</p>
 * </ConfirmDialog>
 * ```
 */
withDefaults(defineProps<{
  title: string
  size?: 'sm' | 'md' | 'lg'
  /** The action button's icon. */
  icon: IconNode
  confirmLabel: string
  /** The action button's label while busy; it keeps `confirmLabel` without one. */
  busyLabel?: string
  busy?: boolean
  /** Keep Cancel from being pressed, e.g. while the action is under way. */
  cancelDisabled?: boolean
}>(), { size: 'md' })

const open = defineModel<boolean>('open', { required: true })
defineEmits<{ confirm: [] }>()
</script>

<template>
  <Dialog v-model:open="open" :size="size" :title="title">
    <slot />
    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          :disabled="cancelDisabled"
          @click="open = false"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="busy"
          class="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          @click="$emit('confirm')"
        >
          <LucideIcon :icon="busy ? Loader2 : icon" class="size-4" :class="{ 'animate-spin': busy }" />
          {{ busy && busyLabel ? busyLabel : confirmLabel }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
