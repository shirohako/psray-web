<script setup lang="ts">
import { BellOff, CircleCheck, Loader2, MailX, Undo2 } from 'lucide'
import { ApiError } from '~/utils/ApiError'

/**
 * Unsubscribe from one kind of notification mail without signing in, via the
 * signed `?token=` from the mail's footer. Opening the page changes nothing —
 * mail providers' link scanners open every link in a mail — so it takes a
 * click. The undo button resubscribes with the same token.
 */
interface UnsubscribeState {
  category: 'important' | 'features' | 'other'
  subscribed: boolean
  email: string
}

const { t } = useI18n()
const toast = useToast()
const { post } = useApi()
const route = useRoute()

useSeo({
  title: () => t('seo.unsubscribe.title'),
  noindex: true,
})

const token = computed(() => {
  const q = route.query.token
  return (Array.isArray(q) ? q[0] : q) ?? ''
})

const { data: state, pending, error } = await useApiFetch<UnsubscribeState>('/mail/unsubscribe', {
  query: { token },
  immediate: !!token.value,
})
const invalid = computed(() => !token.value || !!error.value)
const categoryName = computed(() => state.value ? t(`settings.notifications.mail.${state.value.category}.label`) : '')

const busy = ref(false)
async function setSubscribed(subscribed: boolean) {
  if (busy.value) return
  busy.value = true
  try {
    state.value = await post<UnsubscribeState>('/mail/unsubscribe', { token: token.value, subscribed })
    if (subscribed) toast.success({ title: t('unsubscribe.resubscribed') })
  }
  catch (e) {
    toast.error({ title: t('unsubscribe.failed'), description: e instanceof ApiError ? e.message : undefined })
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg py-6 sm:py-10">
    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <!-- Loading -->
      <div v-if="pending" class="space-y-3" aria-busy="true">
        <div class="h-7 w-1/2 animate-pulse rounded bg-slate-100" />
        <div class="h-4 animate-pulse rounded bg-slate-100" />
        <div class="h-10 w-32 animate-pulse rounded-lg bg-slate-100" />
      </div>

      <!-- Bad or stale link -->
      <div v-else-if="invalid" class="space-y-4 text-center">
        <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600">
          <LucideIcon :icon="MailX" class="size-6" />
        </span>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ $t('unsubscribe.invalid.title') }}</h1>
        <p class="text-sm leading-relaxed text-slate-500">{{ $t('unsubscribe.invalid.body') }}</p>
        <NuxtLink to="/settings/notifications" class="inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
          {{ $t('unsubscribe.manage') }}
        </NuxtLink>
      </div>

      <!-- Still subscribed: confirm -->
      <div v-else-if="state?.subscribed" class="space-y-5">
        <span class="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-600">
          <LucideIcon :icon="BellOff" class="size-6" />
        </span>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ $t('unsubscribe.confirm.title', { category: categoryName }) }}</h1>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">{{ $t('unsubscribe.confirm.body', { email: state.email }) }}</p>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">{{ $t('unsubscribe.transactional') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            :disabled="busy"
            class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            @click="setSubscribed(false)"
          >
            <LucideIcon :icon="busy ? Loader2 : BellOff" class="size-4" :class="busy && 'animate-spin'" />
            {{ $t('unsubscribe.confirm.action') }}
          </button>
          <NuxtLink to="/settings/notifications" class="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline">
            {{ $t('unsubscribe.manage') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Unsubscribed -->
      <div v-else-if="state" class="space-y-5">
        <span class="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <LucideIcon :icon="CircleCheck" class="size-6" />
        </span>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ $t('unsubscribe.done.title', { category: categoryName }) }}</h1>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">{{ $t('unsubscribe.done.body', { email: state.email }) }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            :disabled="busy"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="setSubscribed(true)"
          >
            <LucideIcon :icon="busy ? Loader2 : Undo2" class="size-4" :class="busy && 'animate-spin'" />
            {{ $t('unsubscribe.done.undo') }}
          </button>
          <NuxtLink to="/settings/notifications" class="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline">
            {{ $t('unsubscribe.manage') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
