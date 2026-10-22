<script setup lang="ts">
import { Loader2, Trash2 } from 'lucide'
import { useFeedbackApi } from '~/services/feedback'

/**
 * The author's delete button under their own feedback. It asks in place
 * first; once deleted, the reader goes back to the feedback list.
 */
const props = defineProps<{
  feedbackId: number
  /** A guest author's credential; signed-in authors go by their session. */
  guestToken?: string | null
}>()

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const api = useFeedbackApi()
const errorText = useApiErrorText()

const confirming = ref(false)
const deleting = ref(false)

async function deleteFeedback() {
  if (deleting.value) return
  deleting.value = true
  try {
    await api.remove(props.feedbackId, props.guestToken)
    forgetGuestFeedback(feedbackStorage(), props.feedbackId)
    toast.success({ title: t('feedback.detail.deleted') })
    await navigateTo({ path: '/feedback', query: route.query.lang ? { lang: route.query.lang } : {} })
  }
  catch (error) {
    toast.error({ title: t('feedback.detail.deleteFailed'), description: errorText(error) })
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="confirming" class="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-xs font-medium text-rose-700">{{ $t('feedback.detail.deleteConfirm') }}</p>
    <div class="flex shrink-0 items-center gap-2">
      <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/70" @click="confirming = false">
        {{ $t('common.cancel') }}
      </button>
      <button
        type="button"
        :disabled="deleting"
        class="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        @click="deleteFeedback"
      >
        <LucideIcon :icon="deleting ? Loader2 : Trash2" class="size-3.5" :class="{ 'animate-spin': deleting }" />
        {{ $t(deleting ? 'feedback.detail.deleting' : 'feedback.detail.deleteConfirmAction') }}
      </button>
    </div>
  </div>
  <button
    v-else
    type="button"
    class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
    @click="confirming = true"
  >
    <LucideIcon :icon="Trash2" class="size-3.5" />
    {{ $t('feedback.detail.delete') }}
  </button>
</template>
