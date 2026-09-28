<script setup lang="ts">
import { CircleAlert } from 'lucide'

// Early PSN trophies only report "earned", never when. Shown wherever an earned
// time (or a duration derived from one) would otherwise read as —, 0s or 1970.
withDefaults(defineProps<{
  /** Tooltip text; defaults to the per-trophy explanation. */
  hint?: string
}>(), {
  hint: undefined,
})
</script>

<template>
  <span
    class="inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50/60 px-1.5 py-px text-[11px] font-medium leading-4 text-amber-600/80 ring-1 ring-inset ring-amber-200/60"
    :title="hint ?? $t('common.timestampMissingHint')"
  >
    <LucideIcon :icon="CircleAlert" class="size-3 shrink-0 text-amber-400" />
    {{ $t('common.timestampMissing') }}
  </span>
</template>
