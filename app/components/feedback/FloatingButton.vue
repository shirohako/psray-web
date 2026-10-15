<script setup lang="ts">
import { MessageSquarePlus } from 'lucide'

/**
 * The site-wide way in to feedback, pinned to the bottom-right corner of the
 * public layout. Hidden on the feedback pages, which have their own button.
 * Sits below the mobile menu backdrop and dialogs (z-30 / z-50).
 */
const route = useRoute()
const open = ref(false)
const hidden = computed(() => route.path === '/feedback' || route.path.startsWith('/feedback/'))
</script>

<template>
  <div v-if="!hidden" class="pointer-events-none fixed bottom-4 right-4 z-20 sm:bottom-5 sm:right-5">
    <button
      type="button"
      class="pointer-events-auto inline-flex items-center gap-1.5 rounded-md bg-slate-900 p-2 text-xs font-semibold text-white shadow-md shadow-slate-900/20 ring-1 ring-white/10 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/25 sm:px-2.5 sm:py-1.5"
      :aria-label="$t('feedback.button')"
      @click="open = true"
    >
      <LucideIcon :icon="MessageSquarePlus" class="size-4 sm:size-3.5" />
      <span class="hidden sm:inline">{{ $t('feedback.button') }}</span>
    </button>
  </div>
  <FeedbackComposerDialog v-model:open="open" />
</template>
