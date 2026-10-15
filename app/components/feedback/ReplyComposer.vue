<script setup lang="ts">
import { Loader2, Send } from 'lucide'
import { useFeedbackApi } from '~/services/feedback'
import type { FeedbackDetail } from '~/types/feedback'
import { ApiError } from '~/utils/ApiError'

/** The author's follow-up box under their own feedback. Emits the updated thread. */
const props = defineProps<{
  feedbackId: number
  /** A guest author's credential; signed-in authors go by their session. */
  guestToken?: string | null
}>()
const emit = defineEmits<{ replied: [feedback: FeedbackDetail] }>()

const { t, te } = useI18n()
const toast = useToast()
const api = useFeedbackApi()

const content = ref('')
const imageUrls = ref<string[]>([])
const sending = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const imageErrors = computed(() => Object.fromEntries(
  Object.entries(fieldErrors.value)
    .filter(([key]) => key.startsWith('image_urls.'))
    .map(([key, message]) => [Number(key.slice('image_urls.'.length)), message]),
))

async function send() {
  if (sending.value) return
  imageUrls.value = [...new Set(imageUrls.value.map(url => url.trim()).filter(Boolean))]
  const errors: Record<string, string> = {}
  const text = content.value.trim()
  if (!text) errors.content = t('feedback.form.errors.contentRequired')
  else if (text.length > FEEDBACK_CONTENT_MAX) errors.content = t('feedback.form.errors.contentLong', { max: FEEDBACK_CONTENT_MAX })
  imageUrls.value.forEach((url, index) => {
    if (!isHttpsUrl(url)) errors[`image_urls.${index}`] = t('feedback.form.errors.imageUrl')
  })
  fieldErrors.value = errors
  if (Object.keys(errors).length) return

  sending.value = true
  try {
    const feedback = await api.reply(props.feedbackId, { content: text, image_urls: imageUrls.value }, props.guestToken)
    content.value = ''
    imageUrls.value = []
    emit('replied', feedback)
    toast.success({ title: t('feedback.detail.followUp.sent') })
  }
  catch (error) {
    if (error instanceof ApiError && error.isValidation) fieldErrors.value = error.fieldErrors()
    const key = error instanceof ApiError ? `errors.api.${error.code}` : ''
    toast.error({
      title: t('feedback.detail.followUp.failed'),
      description: error instanceof ApiError ? (te(key) ? t(key) : error.message) : undefined,
    })
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" novalidate @submit.prevent="send">
    <div>
      <h2 class="text-sm font-semibold text-slate-900">{{ $t('feedback.detail.followUp.title') }}</h2>
      <p class="mt-1 text-xs text-slate-500">{{ $t('feedback.detail.followUp.hint') }}</p>
    </div>

    <label class="block">
      <span class="sr-only">{{ $t('feedback.detail.followUp.title') }}</span>
      <textarea
        v-model="content"
        rows="4"
        :disabled="sending"
        :placeholder="$t('feedback.detail.followUp.placeholder')"
        class="block w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4"
        :class="fieldErrors.content ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'"
      />
      <span class="mt-1 flex items-start justify-between gap-3">
        <span class="text-xs font-medium text-rose-600">{{ fieldErrors.content }}</span>
        <span class="shrink-0 text-xs tabular-nums" :class="content.length > FEEDBACK_CONTENT_MAX ? 'font-semibold text-rose-600' : 'text-slate-400'">
          {{ content.length.toLocaleString() }} / {{ FEEDBACK_CONTENT_MAX.toLocaleString() }}
        </span>
      </span>
    </label>

    <FeedbackImageLinksInput v-model="imageUrls" :disabled="sending" :errors="imageErrors" />

    <div class="flex justify-end">
      <button
        type="submit"
        :disabled="sending"
        class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LucideIcon :icon="sending ? Loader2 : Send" class="size-4" :class="{ 'animate-spin': sending }" />
        {{ $t(sending ? 'feedback.detail.followUp.sending' : 'feedback.detail.followUp.send') }}
      </button>
    </div>
  </form>
</template>
