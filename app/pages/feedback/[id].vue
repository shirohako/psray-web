<script setup lang="ts">
import { ArrowLeft, EyeOff, Hourglass, Loader2, MessagesSquare } from 'lucide'
import type { FeedbackDetail } from '~/types/feedback'

const route = useRoute()
const { t } = useI18n()

const id = computed(() => Number(route.params.id))

// A guest author's credential lives only in this browser, so it joins once
// mounted; the server render shows what anyone may see. Until then a missing
// item might still be the guest's own pending one, so don't call it missing yet.
const guestToken = ref<string | null>(null)
const storageRead = ref(false)

const { data: feedback, error, status, refresh } = await useApiFetch<FeedbackDetail>(() => `/feedback/${id.value}`, {
  headers: computed((): Record<string, string> => guestToken.value ? { [FEEDBACK_TOKEN_HEADER]: guestToken.value } : {}),
  watch: [guestToken],
})

onMounted(() => {
  guestToken.value = guestFeedbackToken(feedbackStorage(), id.value)
  storageRead.value = true
})

const resolving = computed(() => !feedback.value && (!storageRead.value || status.value === 'pending'))
// useFetch may hand back a wrapped error; the HTTP status survives as `statusCode`.
const notFound = computed(() => (error.value as { statusCode?: number } | null)?.statusCode === 404)

useSeo({
  title: () => t('seo.feedback.detailTitle', { id: id.value }),
  description: () => feedback.value ? feedbackExcerpt(feedback.value.content, 150) : t('seo.feedback.description'),
  noindex: true,
})

function onReplied(updated: FeedbackDetail) {
  feedback.value = updated
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <NuxtLink
      :to="{ path: '/feedback', query: route.query.lang ? { lang: route.query.lang } : {} }"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
    >
      <LucideIcon :icon="ArrowLeft" class="size-3.5" />
      {{ $t('feedback.detail.back') }}
    </NuxtLink>

    <div v-if="resolving" class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-20 text-sm text-slate-400">
      <LucideIcon :icon="Loader2" class="size-5 animate-spin" />
      {{ $t('feedback.detail.loading') }}
    </div>

    <div v-else-if="!feedback" class="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="MessagesSquare" class="size-5" /></span>
      <h1 class="mt-4 text-sm font-semibold text-slate-900">{{ $t(notFound ? 'feedback.detail.notFound' : 'feedback.detail.loadError') }}</h1>
      <p class="mt-2 text-xs text-slate-500">{{ $t(notFound ? 'feedback.detail.notFoundHint' : 'errors.generic.description') }}</p>
      <button v-if="!notFound" class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">
        {{ $t('common.retry') }}
      </button>
    </div>

    <template v-else>
      <div
        v-if="feedback.visibility !== 'public'"
        class="flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs leading-5"
        :class="feedback.visibility === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-300 bg-slate-100 text-slate-700'"
      >
        <LucideIcon :icon="feedback.visibility === 'pending' ? Hourglass : EyeOff" class="mt-0.5 size-4 shrink-0" />
        {{ $t(feedback.visibility === 'pending' ? 'feedback.detail.pendingNotice' : 'feedback.detail.hiddenNotice') }}
      </div>

      <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 class="sr-only">{{ $t('seo.feedback.detailTitle', { id: feedback.id }) }}</h1>
        <div class="flex items-start justify-between gap-3">
          <FeedbackAuthor :author="feedback.author" />
          <time :datetime="feedback.created_at" class="shrink-0 whitespace-nowrap pt-1.5 text-xs tabular-nums text-slate-400">{{ fmtDateTime(feedback.created_at) }}</time>
        </div>
        <FeedbackTags class="mt-3" :type="feedback.type" :status="feedback.status" :visibility="feedback.visibility" />
        <FeedbackText class="mt-3" :text="feedback.content" />
        <FeedbackImages v-if="feedback.image_urls.length" class="mt-3" :urls="feedback.image_urls" />

        <div v-if="feedback.viewer.can_delete" class="mt-4 border-t border-slate-100 pt-3">
          <FeedbackDeleteButton :feedback-id="feedback.id" :guest-token="guestToken" />
        </div>
      </article>

      <section class="space-y-3" aria-labelledby="feedback-replies">
        <h2 id="feedback-replies" class="text-sm font-semibold text-slate-900">
          {{ $t('feedback.replies') }}
          <span class="ml-1 font-normal tabular-nums text-slate-400">{{ feedback.replies.length }}</span>
        </h2>
        <p v-if="!feedback.replies.length" class="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">
          {{ $t('feedback.detail.noReplies') }}
        </p>
        <ol v-else class="space-y-3">
          <li
            v-for="reply in feedback.replies"
            :key="reply.id"
            class="rounded-lg border p-4 sm:p-5"
            :class="reply.is_staff ? 'border-sky-200 bg-sky-50/60' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <FeedbackAuthor :author="reply.author" />
                <span v-if="!reply.is_staff" class="rounded bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500">{{ $t('feedback.detail.followUpTag') }}</span>
              </div>
              <time :datetime="reply.created_at" class="shrink-0 whitespace-nowrap pt-1.5 text-xs tabular-nums text-slate-400">{{ fmtDateTime(reply.created_at) }}</time>
            </div>
            <FeedbackText class="mt-2.5" :text="reply.content" />
            <FeedbackImages v-if="reply.image_urls.length" class="mt-3" :urls="reply.image_urls" />
          </li>
        </ol>
      </section>

      <FeedbackReplyComposer v-if="feedback.viewer.can_reply" :feedback-id="feedback.id" :guest-token="guestToken" @replied="onReplied" />
    </template>
  </div>
</template>
