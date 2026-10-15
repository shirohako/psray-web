<script setup lang="ts">
import { ArrowRight, Bug, CircleCheck, Globe, Info, Lightbulb, Loader2, MessageCircle, MessagesSquare, Send } from 'lucide'
import { useFeedbackApi } from '~/services/feedback'
import type { FeedbackContext, FeedbackDetail, FeedbackType } from '~/types/feedback'
import { ApiError } from '~/utils/ApiError'

/**
 * The feedback form, opened from the floating button or the feedback page.
 *
 * When it opens it records the page the reader was on (sent along for staff
 * only). The draft is kept per account in this browser until it's sent. A
 * guest's one-time credential is remembered here so they can come back to
 * their item while it waits for review. Ends on a confirmation with a link.
 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [feedback: FeedbackDetail]
}>()

const { t, te, locale } = useI18n()
const toast = useToast()
const route = useRoute()
const { user, loggedIn } = useAuth()
const api = useFeedbackApi()
const formId = useId()

const TYPES: { value: FeedbackType, icon: typeof Bug }[] = [
  { value: 'bug', icon: Bug },
  { value: 'suggestion', icon: Lightbulb },
  { value: 'other', icon: MessageCircle },
]

const type = ref<FeedbackType | null>(null)
const content = ref('')
const imageUrls = ref<string[]>([])
const guestName = ref('')
const submitting = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const sent = ref<FeedbackDetail | null>(null)
let context: FeedbackContext | undefined

// Server errors come back as `image_urls.<index>`; the rows are sent as shown.
const imageErrors = computed(() => Object.fromEntries(
  Object.entries(fieldErrors.value)
    .filter(([key]) => key.startsWith('image_urls.'))
    .map(([key, message]) => [Number(key.slice('image_urls.'.length)), message]),
))
const loginLink = computed(() => ({ path: '/auth/login', query: { redirect: route.fullPath } }))

// ── Draft ────────────────────────────────────────────────────────────────────

const draftKey = computed(() => `feedback-draft:${user.value?.id ?? 'guest'}`)

function saveDraft() {
  if (!import.meta.client || submitting.value || sent.value) return
  try {
    const draft = { type: type.value, content: content.value, image_urls: imageUrls.value, guest_name: guestName.value }
    if (!draft.type && !draft.content && !draft.image_urls.some(Boolean) && !draft.guest_name) localStorage.removeItem(draftKey.value)
    else localStorage.setItem(draftKey.value, JSON.stringify(draft))
  }
  catch {
    // Storage blocked or full: the draft just isn't kept.
  }
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey.value) || 'null')
    if (!draft || typeof draft !== 'object') return
    type.value = FEEDBACK_TYPES.includes(draft.type) ? draft.type : null
    content.value = typeof draft.content === 'string' ? draft.content : ''
    imageUrls.value = Array.isArray(draft.image_urls)
      ? draft.image_urls.filter((url: unknown): url is string => typeof url === 'string').slice(0, FEEDBACK_MAX_IMAGES)
      : []
    guestName.value = typeof draft.guest_name === 'string' ? draft.guest_name : guestName.value
  }
  catch {
    // A corrupt draft is simply ignored.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(draftKey.value)
  }
  catch {
    // Nothing to clear.
  }
}

watch([type, content, imageUrls, guestName], saveDraft, { deep: true })

watch(() => props.open, (open) => {
  if (!open || !import.meta.client) return
  context = collectFeedbackContext(window, locale.value)
  fieldErrors.value = {}
  if (!sent.value) restoreDraft()
}, { immediate: true })

// ── Submit ───────────────────────────────────────────────────────────────────

function validate() {
  const errors: Record<string, string> = {}
  const text = content.value.trim()
  if (!type.value) errors.type = t('feedback.form.errors.type')
  if (!text) errors.content = t('feedback.form.errors.contentRequired')
  else if (text.length < FEEDBACK_CONTENT_MIN) errors.content = t('feedback.form.errors.contentShort', { min: FEEDBACK_CONTENT_MIN })
  else if (text.length > FEEDBACK_CONTENT_MAX) errors.content = t('feedback.form.errors.contentLong', { max: FEEDBACK_CONTENT_MAX })
  imageUrls.value.forEach((url, index) => {
    if (!isHttpsUrl(url)) errors[`image_urls.${index}`] = t('feedback.form.errors.imageUrl')
  })
  if (!loggedIn.value && guestName.value.trim().length > FEEDBACK_GUEST_NAME_MAX) {
    errors.guest_name = t('feedback.form.errors.guestName', { max: FEEDBACK_GUEST_NAME_MAX })
  }
  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

function describe(error: unknown) {
  if (!(error instanceof ApiError)) return undefined
  const key = `errors.api.${error.code}`
  return te(key) ? t(key) : error.message
}

async function submit() {
  if (submitting.value) return
  // Drop blank rows and repeats first, so error indexes match what's on screen.
  imageUrls.value = [...new Set(imageUrls.value.map(url => url.trim()).filter(Boolean))]
  if (!validate() || !type.value) return
  submitting.value = true
  try {
    const feedback = await api.create({
      type: type.value,
      content: content.value.trim(),
      image_urls: imageUrls.value,
      guest_name: loggedIn.value ? undefined : guestName.value.trim() || undefined,
      context,
    })
    if (feedback.guest_token) {
      rememberGuestFeedback(feedbackStorage(), {
        id: feedback.id,
        token: feedback.guest_token,
        excerpt: feedbackExcerpt(feedback.content),
        created_at: feedback.created_at,
      })
    }
    clearDraft()
    sent.value = feedback
    emit('created', feedback)
  }
  catch (error) {
    if (error instanceof ApiError && error.isValidation) fieldErrors.value = { ...fieldErrors.value, ...error.fieldErrors() }
    toast.error({ title: t('feedback.form.submitFailed'), description: describe(error) })
  }
  finally {
    submitting.value = false
  }
}

function startOver() {
  sent.value = null
  type.value = null
  content.value = ''
  imageUrls.value = []
  fieldErrors.value = {}
}

function close() {
  emit('update:open', false)
}

function onOpenChange(value: boolean) {
  if (!value && submitting.value) return
  emit('update:open', value)
}

// Reopening after a successful send starts from a blank form.
function onClosed() {
  if (sent.value) startOver()
}
</script>

<template>
  <Dialog :open="open" :title="$t('feedback.form.title')" size="lg" @update:open="onOpenChange" @closed="onClosed">
    <div v-if="sent" class="px-5 py-8 text-center">
      <span class="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <LucideIcon :icon="CircleCheck" class="size-6" />
      </span>
      <h3 class="mt-4 text-base font-semibold text-slate-900">{{ $t('feedback.form.sentTitle') }}</h3>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {{ $t(sent.visibility === 'public' ? 'feedback.form.sentPublic' : 'feedback.form.sentPending') }}
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
        <NuxtLink
          :to="`/feedback/${sent.id}`"
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          @click="close"
        >
          {{ $t('feedback.form.view') }}
        </NuxtLink>
        <button type="button" class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" @click="startOver">
          {{ $t('feedback.form.another') }}
        </button>
      </div>
    </div>

    <form v-else :id="formId" class="space-y-5 p-4 sm:p-5" novalidate @submit.prevent="submit">
      <fieldset :disabled="submitting">
        <legend class="mb-1.5 text-xs font-semibold text-slate-600">{{ $t('feedback.form.type') }}</legend>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="option in TYPES" :key="option.value" class="cursor-pointer rounded-lg focus-within:ring-2 focus-within:ring-slate-400/40">
            <input v-model="type" type="radio" :name="`${formId}-type`" :value="option.value" class="sr-only" />
            <span
              class="flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition"
              :class="type === option.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
            >
              <LucideIcon :icon="option.icon" class="size-4" />
              {{ $t(`feedback.types.${option.value}`) }}
            </span>
          </label>
        </div>
        <span v-if="fieldErrors.type" class="mt-1 block text-xs font-medium text-rose-600">{{ fieldErrors.type }}</span>
      </fieldset>

      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600">{{ $t('feedback.form.content') }}</span>
        <textarea
          v-model="content"
          rows="6"
          :disabled="submitting"
          :placeholder="$t('feedback.form.contentPlaceholder')"
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

      <FeedbackImageLinksInput v-model="imageUrls" :disabled="submitting" :errors="imageErrors" />

      <div v-if="!loggedIn" class="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <p class="text-xs leading-5 text-amber-800">
          {{ $t('feedback.form.guestNotice') }}
          <NuxtLink :to="loginLink" class="font-semibold underline underline-offset-2 hover:text-amber-950" @click="close">
            {{ $t('feedback.form.login') }}
          </NuxtLink>
        </p>
        <label class="block">
          <span class="mb-1.5 block text-xs font-semibold text-slate-600">{{ $t('feedback.form.guestName') }}</span>
          <input
            v-model="guestName"
            type="text"
            autocomplete="nickname"
            :maxlength="FEEDBACK_GUEST_NAME_MAX"
            :disabled="submitting"
            :placeholder="$t('feedback.form.guestNamePlaceholder')"
            class="block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4"
            :class="fieldErrors.guest_name ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'"
          />
          <span v-if="fieldErrors.guest_name" class="mt-1 block text-xs font-medium text-rose-600">{{ fieldErrors.guest_name }}</span>
        </label>
      </div>

      <ul class="space-y-1 text-[11px] leading-5 text-slate-400">
        <li class="flex gap-1.5">
          <LucideIcon :icon="Globe" class="mt-0.5 size-3.5 shrink-0" />
          {{ $t('feedback.form.publicNotice') }}
        </li>
        <li class="flex gap-1.5">
          <LucideIcon :icon="Info" class="mt-0.5 size-3.5 shrink-0" />
          {{ $t('feedback.form.contextNotice') }}
        </li>
      </ul>
    </form>

    <template v-if="!sent" #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink
          to="/feedback"
          class="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200 transition hover:bg-sky-100 hover:text-sky-900"
          @click="close"
        >
          <LucideIcon :icon="MessagesSquare" class="size-3.5" />
          {{ $t('feedback.form.viewAll') }}
          <LucideIcon :icon="ArrowRight" class="size-3" />
        </NuxtLink>
        <button
          type="submit"
          :form="formId"
          :disabled="submitting"
          class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LucideIcon :icon="submitting ? Loader2 : Send" class="size-4" :class="{ 'animate-spin': submitting }" />
          {{ $t(submitting ? 'feedback.form.submitting' : 'feedback.form.submit') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
