<script setup lang="ts">
import { RefreshCw, Search, Loader, SendHorizontal } from 'lucide'

const { t } = useI18n()

useSeo({
  title: () => t('seo.sync.title'),
  description: () => t('seo.sync.description'),
  // Queue-submission tooling, not content: nothing here belongs in an index.
  noindex: true,
})

const psnid = ref('')
const { submitting, errorMessage, profilePrivate, info, polling, countdown, refreshing, submit, resume } = useSyncTracker()

const canSubmit = computed(() => psnid.value.trim() !== '' && !submitting.value)

function onSubmit() {
  if (!canSubmit.value) return
  submit(psnid.value.trim())
}

// Prefill from links like `/sync?psnid=foo`, but never auto-submit. Syncing is
// intentionally user-triggered so opening a link cannot enqueue work by itself.
// A job that is already running for that ID (e.g. just requested from its
// profile page) is picked up and followed, though: reading status starts nothing.
onMounted(() => {
  const q = useRoute().query.psnid
  const id = (Array.isArray(q) ? q[0] : q)?.trim()
  if (!id) return
  psnid.value = id
  resume(id)
})
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <!-- Submit form -->
    <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-start gap-3.5">
        <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
          <LucideIcon :icon="RefreshCw" class="size-5" />
        </span>
        <div>
          <h2 class="text-base font-semibold text-slate-900">{{ $t('sync.heading') }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ $t('sync.subheading') }}</p>
        </div>
      </div>

      <form class="mt-4 flex gap-2" @submit.prevent="onSubmit">
        <div class="relative flex-1">
          <LucideIcon
            :icon="Search"
            class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="psnid"
            type="text"
            placeholder="PSN ID"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          :disabled="!canSubmit"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-slate-900/30 transition hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:hover:bg-slate-900"
        >
          <LucideIcon
            :icon="submitting ? Loader : SendHorizontal"
            class="size-3.5"
            :class="{ 'animate-spin': submitting }"
          />
          {{ submitting ? $t('sync.cta.submitting') : $t('sync.cta.submit') }}
        </button>
      </form>

      <p
        v-if="errorMessage"
        class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700"
      >
        {{ errorMessage }}
      </p>

      <PrivateProfileNotice v-if="profilePrivate" class="mt-4" :title="$t('sync.private.title')">
        {{ $t('sync.private.line1') }}<br>
        {{ $t('sync.private.line2') }}
      </PrivateProfileNotice>
    </section>

    <!-- Live progress -->
    <SyncProgressCard
      v-if="info"
      :info="info"
      :polling="polling"
      :refreshing="refreshing"
      :countdown="countdown"
    />
  </div>
</template>
