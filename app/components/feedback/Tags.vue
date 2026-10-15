<script setup lang="ts">
import type { FeedbackStatus, FeedbackType, FeedbackVisibility } from '~/types/feedback'

/** Type and status badges, plus a visibility badge when the item isn't public. */
defineProps<{
  type: FeedbackType
  status: FeedbackStatus
  visibility?: FeedbackVisibility
}>()
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1.5">
    <span class="rounded px-1.5 py-px text-[11px] font-semibold ring-1 ring-inset" :class="FEEDBACK_TYPE_TONE[type]">
      {{ $t(`feedback.types.${type}`) }}
    </span>
    <span class="rounded px-1.5 py-px text-[11px] font-semibold ring-1 ring-inset" :class="FEEDBACK_STATUS_TONE[status]">
      {{ $t(`feedback.statuses.${status}`) }}
    </span>
    <span v-if="visibility && visibility !== 'public'" class="rounded px-1.5 py-px text-[11px] font-semibold ring-1 ring-inset" :class="FEEDBACK_VISIBILITY_TONE[visibility]">
      {{ $t(`feedback.visibility.${visibility}`) }}
    </span>
  </span>
</template>
