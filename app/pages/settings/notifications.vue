<script setup lang="ts">
import { Bell, Languages, Loader2, Megaphone, ShieldCheck, Sparkles, TriangleAlert } from 'lucide'
import { UI_LOCALES } from '#shared/locales'
import type { UpdateSettingPayload, UserSetting } from '~/services/account'
import { useAccountApi } from '~/services/account'
import { ApiError } from '~/utils/ApiError'

const { t } = useI18n()
const toast = useToast()
const accountApi = useAccountApi()

// Same endpoint as the profile page; this page edits the mail fields only.
const { data: setting, pending, error: loadError, refresh } = await useApiFetch<UserSetting>('/user/setting')

type Category = 'mail_important' | 'mail_features' | 'mail_other'
const categories: { key: Category, icon: typeof Bell, i18n: string }[] = [
  { key: 'mail_important', icon: TriangleAlert, i18n: 'important' },
  { key: 'mail_features', icon: Sparkles, i18n: 'features' },
  { key: 'mail_other', icon: Megaphone, i18n: 'other' },
]

// Native names, so everyone can find their own language whatever the UI is in.
const LOCALE_NAMES: Record<string, string> = {
  'ja': '日本語',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  'en': 'English',
  'ko': '한국어',
}

const form = reactive({ locale: 'en', mail_important: true, mail_features: true, mail_other: true })
const saved = reactive({ ...form })
watch(setting, (s) => {
  if (!s) return
  Object.assign(form, { locale: s.locale, mail_important: s.mail_important, mail_features: s.mail_features, mail_other: s.mail_other })
  Object.assign(saved, form)
}, { immediate: true })

const changes = computed(() => {
  const payload: UpdateSettingPayload = {}
  if (form.locale !== saved.locale) payload.locale = form.locale
  for (const { key } of categories) {
    if (form[key] !== saved[key]) payload[key] = form[key]
  }
  return payload
})
const dirty = computed(() => Object.keys(changes.value).length > 0)

const saving = ref(false)
async function save() {
  if (saving.value || !dirty.value) return
  saving.value = true
  try {
    await accountApi.updateSetting(changes.value)
    await refresh()
    toast.success({ title: t('settings.notifications.saved') })
  }
  catch (error) {
    toast.error({
      title: t('settings.notifications.saveFailed'),
      description: error instanceof ApiError ? error.message : undefined,
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="space-y-6 p-5">
      <div class="overflow-hidden rounded-lg border border-stone-800 bg-stone-900 text-white shadow-sm">
        <div class="p-5">
          <div class="flex min-w-0 items-start gap-3">
            <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-sky-200 ring-1 ring-white/15">
              <LucideIcon :icon="Bell" class="size-5.5" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-sky-200">Notifications</p>
              <h3 class="mt-1 text-xl font-bold tracking-tight text-white">{{ $t('settings.notifications.heading') }}</h3>
              <p class="mt-1 max-w-xl text-sm leading-relaxed text-stone-300">
                {{ $t('settings.notifications.subheading') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-lg bg-slate-100" />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <p class="text-sm font-medium text-rose-700">{{ $t('settings.notifications.loadFailed') }}</p>
        <button
          type="button"
          class="inline-flex shrink-0 items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
          @click="refresh()"
        >
          {{ $t('common.retry') }}
        </button>
      </div>

      <template v-else>
        <!-- Mail language -->
        <section class="rounded-lg border border-slate-200 p-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span class="flex min-w-0 items-start gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <LucideIcon :icon="Languages" class="size-5" />
              </span>
              <span class="min-w-0">
                <label for="mail-locale" class="block text-sm font-semibold text-slate-900">{{ $t('settings.notifications.language.label') }}</label>
                <span class="mt-1 block text-sm text-slate-500">{{ $t('settings.notifications.language.hint') }}</span>
              </span>
            </span>
            <SelectMenu
              id="mail-locale"
              v-model="form.locale"
              :options="UI_LOCALES.map(code => ({ value: code, label: LOCALE_NAMES[code] ?? code }))"
              :disabled="saving"
              size="lg"
              class="shrink-0 sm:w-44"
            />
          </div>
        </section>

        <!-- Subscriptions -->
        <section class="overflow-hidden rounded-lg border border-slate-200">
          <h4 class="border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-900">
            {{ $t('settings.notifications.mail.heading') }}
          </h4>
          <ul class="divide-y divide-slate-100">
            <li v-for="c in categories" :key="c.key" class="flex items-center justify-between gap-4 px-4 py-4">
              <span class="flex min-w-0 items-start gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <LucideIcon :icon="c.icon" class="size-4.5" />
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-slate-900">{{ $t(`settings.notifications.mail.${c.i18n}.label`) }}</span>
                  <span class="mt-0.5 block text-sm text-slate-500">{{ $t(`settings.notifications.mail.${c.i18n}.hint`) }}</span>
                </span>
              </span>
              <SettingsSwitch v-model="form[c.key]" :label="$t(`settings.notifications.mail.${c.i18n}.label`)" :disabled="saving" />
            </li>
            <li class="flex items-center justify-between gap-4 bg-slate-50/50 px-4 py-4">
              <span class="flex min-w-0 items-start gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <LucideIcon :icon="ShieldCheck" class="size-4.5" />
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-slate-900">{{ $t('settings.notifications.mail.transactional.label') }}</span>
                  <span class="mt-0.5 block text-sm text-slate-500">{{ $t('settings.notifications.mail.transactional.hint') }}</span>
                </span>
              </span>
              <span class="shrink-0 text-xs font-medium text-slate-400">{{ $t('settings.notifications.mail.transactional.always') }}</span>
            </li>
          </ul>
        </section>
      </template>
    </div>

    <div v-if="!pending && !loadError" class="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
      <button
        type="button"
        :disabled="saving || !dirty"
        class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        @click="save"
      >
        <LucideIcon v-if="saving" :icon="Loader2" class="size-4 animate-spin" />
        {{ saving ? $t('common.saving') : $t('common.save') }}
      </button>
    </div>
  </section>
</template>
