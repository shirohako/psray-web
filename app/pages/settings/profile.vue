<script setup lang="ts">
import { AlertTriangle, Camera, CircleDot, IdCard, ImageUp, Loader2, RefreshCw, Trash2, User } from 'lucide'
import type { UpdateSettingPayload, UserSetting } from '~/services/account'
import { useAccountApi } from '~/services/account'
import type { UploadedMedia } from '~/services/media'
import type { MediaImage } from '~/types/media'
import type { UserMediaPurpose } from '~/utils/media'
import { ApiError } from '~/utils/ApiError'

const { user, fetchMe } = useAuth()
const { t } = useI18n()
const toast = useToast()
const errorText = useApiErrorText()
const accountApi = useAccountApi()
const appConfig = useAppConfig()

// Awaited (like `p/[psnid].vue`) so the page seeds from real data on first
// paint. `useAuth()`'s user has the avatar on show, not the uploaded one or
// the PSN one this page switches between.
const { data: setting, pending: settingPending, error: settingError, refresh: refreshSetting }
  = await useApiFetch<UserSetting>('/user/setting')

interface ImageFields {
  banner: MediaImage | null
  /** The uploaded avatar; kept while the PSN one is in use. */
  avatar: MediaImage | null
  useCustomAvatar: boolean
}

// The header below shows `form`. A new picture is uploaded straight away (the
// crop dialog does that) but only attached on save, so `saved` is what the
// account has now and the diff is what save sends.
const form = reactive<ImageFields>({ banner: null, avatar: null, useCustomAvatar: false })
const saved = reactive<ImageFields>({ banner: null, avatar: null, useCustomAvatar: false })

watch(setting, (s) => {
  if (!s) return
  // "Custom" without a picture shows the PSN avatar anyway (API UserAvatar).
  const fields = { banner: s.banner, avatar: s.avatar, useCustomAvatar: s.use_custom_avatar && s.avatar != null }
  Object.assign(form, fields)
  Object.assign(saved, fields)
}, { immediate: true })

const changes = computed(() => {
  const payload: UpdateSettingPayload = {}
  if (form.banner?.id !== saved.banner?.id) payload.banner = form.banner?.id ?? null
  const avatarChanged = form.avatar?.id !== saved.avatar?.id
  if (avatarChanged) payload.avatar = form.avatar?.id ?? null
  // Sent with a new picture too: it may have been uploaded and then switched off.
  if (avatarChanged || form.useCustomAvatar !== saved.useCustomAvatar) payload.use_custom_avatar = form.useCustomAvatar
  return payload
})
const dirty = computed(() => Object.keys(changes.value).length > 0)

/** One tag per kind of change, for the unsaved-changes bar. */
const changeTags = computed(() => {
  const tags: string[] = []
  if ('banner' in changes.value) tags.push(t(form.banner ? 'settings.profile.unsaved.banner' : 'settings.profile.unsaved.bannerRemoved'))
  if ('avatar' in changes.value) tags.push(t('settings.profile.unsaved.avatar'))
  else if ('use_custom_avatar' in changes.value) tags.push(t('settings.profile.unsaved.avatarSource'))
  return tags
})

const bannerUrl = computed(() => form.banner?.url ?? appConfig.profile.defaultBanner)
// Empty until the first sync brings the PSN avatar in: a placeholder shows then.
const psnAvatar = computed(() => setting.value?.psn_avatar_url || null)
const shownAvatar = computed(() => (form.useCustomAvatar && form.avatar ? form.avatar.url : psnAvatar.value))

// ── Pictures ────────────────────────────────────────────────────────────────
const cropDialog = ref<{ choose: (purpose: UserMediaPurpose) => void } | null>(null)

function pick(purpose: UserMediaPurpose) {
  cropDialog.value?.choose(purpose)
}

function onUploaded(media: UploadedMedia, purpose: UserMediaPurpose) {
  if (purpose === 'banner') {
    form.banner = media
  }
  else {
    form.avatar = media
    form.useCustomAvatar = true
  }
}

function selectAvatarSource(custom: boolean) {
  // Nothing uploaded yet: "custom" means "pick one".
  if (custom && !form.avatar) {
    pick('avatar')
    return
  }
  form.useCustomAvatar = custom
}

function discard() {
  Object.assign(form, saved)
}

// ── Save ────────────────────────────────────────────────────────────────────
const saving = ref(false)

async function save() {
  if (saving.value || !dirty.value) return
  saving.value = true
  try {
    await accountApi.updateSetting(changes.value)
    await Promise.all([fetchMe(), refreshSetting()])
    toast.success({ title: t('settings.profile.saved') })
  }
  catch (error) {
    const field = error instanceof ApiError && error.isValidation ? Object.values(error.fieldErrors())[0] : undefined
    toast.error({ title: t('settings.profile.saveFailed'), description: field ?? errorText(error) })
  }
  finally {
    saving.value = false
  }
}

// Uploaded but unsaved pictures would be lost (and pruned by the API later).
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm(t('settings.profile.leaveConfirm'))) return false
})
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="space-y-6 p-5">
      <SettingsHero :icon="User" eyebrow="Profile center" :title="$t('settings.profile.heading')" :description="$t('settings.profile.subheading')" />

      <!-- Loading -->
      <div v-if="settingPending" class="space-y-6">
        <div class="h-72 animate-pulse rounded-lg bg-slate-200 sm:h-88" />
        <div class="h-20 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <!-- Error -->
      <div
        v-else-if="settingError"
        class="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
      >
        <p class="flex items-center gap-2 text-sm font-medium text-rose-700">
          <LucideIcon :icon="AlertTriangle" class="size-4.5 shrink-0" />
          {{ $t('settings.profile.loadFailed') }}
        </p>
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
          @click="refreshSetting()"
        >
          <LucideIcon :icon="RefreshCw" class="size-4" />
          {{ $t('common.retry') }}
        </button>
      </div>

      <template v-else>
        <!-- The profile header (components/profile/Header.vue), changed in place -->
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div
            class="relative h-48 overflow-hidden bg-slate-300 sm:h-64"
            :style="{ backgroundColor: form.banner?.color ?? undefined }"
          >
            <Transition
              enter-active-class="transition-opacity duration-300 motion-reduce:transition-none"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity duration-300 motion-reduce:transition-none"
              leave-to-class="opacity-0"
            >
              <div
                :key="bannerUrl"
                class="absolute inset-0 bg-cover bg-center"
                :style="{ backgroundImage: `url(${bannerUrl})` }"
              />
            </Transition>
            <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/5" />

            <span
              v-if="!form.banner"
              class="absolute left-4 top-4 inline-flex h-8 items-center rounded-lg bg-white/15 px-3 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/25 backdrop-blur-md"
            >
              {{ $t('settings.profile.banner.default') }}
            </span>

            <div class="absolute right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/90 px-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:bg-white hover:text-slate-900 disabled:opacity-60"
                :disabled="saving"
                @click="pick('banner')"
              >
                <LucideIcon :icon="Camera" class="size-4" />
                {{ $t('settings.profile.banner.change') }}
              </button>
              <Tooltip v-if="form.banner" :content="$t('settings.profile.banner.remove')" placement="bottom">
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-lg bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition hover:bg-white hover:text-rose-600 disabled:opacity-60"
                  :aria-label="$t('settings.profile.banner.remove')"
                  :disabled="saving"
                  @click="form.banner = null"
                >
                  <LucideIcon :icon="Trash2" class="size-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          <div class="px-4 pb-5 sm:px-6">
            <button
              type="button"
              class="group relative z-10 -mt-18 block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2 sm:-mt-22"
              :aria-label="$t('settings.profile.avatar.change')"
              :disabled="saving"
              @click="pick('avatar')"
            >
              <img
                v-if="shownAvatar"
                :src="shownAvatar"
                alt=""
                class="size-24 rounded-xl border-4 border-white bg-white object-cover shadow-md sm:size-28"
              />
              <AvatarPlaceholder
                v-else
                class="size-24 rounded-xl border-4 border-white shadow-md sm:size-28"
              />
              <span class="pointer-events-none absolute inset-1 rounded-lg bg-slate-900/0 transition group-hover:bg-slate-900/20" />
              <span class="pointer-events-none absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full bg-slate-900 text-white shadow-md ring-[3px] ring-white transition group-hover:scale-105 motion-reduce:transition-none">
                <LucideIcon :icon="Camera" class="size-4" />
              </span>
            </button>

            <div class="mt-3">
              <h3 class="text-xl font-bold leading-none tracking-tight text-slate-900">{{ user?.psnid }}</h3>
              <p v-if="user?.country" class="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                <RegionFlag :country="user.country" /> {{ regionName(user.country) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Avatar source -->
        <section class="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-start gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100">
              <LucideIcon :icon="IdCard" class="size-4.5" />
            </span>
            <div class="min-w-0">
              <h4 class="text-sm font-semibold text-slate-900">{{ $t('settings.profile.avatar.sourceTitle') }}</h4>
              <p class="mt-0.5 text-xs text-slate-500">{{ $t('settings.profile.avatar.sourceHint') }}</p>
            </div>
          </div>

          <div
            role="radiogroup"
            :aria-label="$t('settings.profile.avatar.sourceTitle')"
            class="inline-flex shrink-0 self-start rounded-lg bg-slate-100 p-1 sm:self-auto"
          >
            <button
              type="button"
              role="radio"
              :aria-checked="!form.useCustomAvatar"
              :disabled="saving"
              class="inline-flex items-center gap-2 rounded-md py-1 pl-1 pr-3 text-sm font-medium transition"
              :class="!form.useCustomAvatar ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
              @click="selectAvatarSource(false)"
            >
              <img v-if="psnAvatar" :src="psnAvatar" alt="" class="size-7 rounded-full bg-slate-200 object-cover" />
              <AvatarPlaceholder v-else class="size-7 rounded-full ring-1 ring-slate-200" />
              {{ $t('settings.profile.avatar.psn') }}
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="form.useCustomAvatar"
              :disabled="saving"
              class="inline-flex items-center gap-2 rounded-md py-1 pl-1 pr-3 text-sm font-medium transition"
              :class="form.useCustomAvatar ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
              @click="selectAvatarSource(true)"
            >
              <img v-if="form.avatar" :src="form.avatar.url" alt="" class="size-7 rounded-full bg-slate-200 object-cover" />
              <span v-else class="grid size-7 place-items-center rounded-full bg-slate-200 text-slate-500">
                <LucideIcon :icon="ImageUp" class="size-4" />
              </span>
              {{ form.avatar ? $t('settings.profile.avatar.custom') : $t('settings.profile.avatar.upload') }}
            </button>
          </div>
        </section>

        <!-- Unsaved changes -->
        <Transition
          enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="translate-y-2 opacity-0"
          leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
          leave-to-class="translate-y-2 opacity-0"
        >
          <div
            v-if="dirty"
            class="sticky bottom-4 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-slate-900 px-4 py-3 text-white shadow-lg shadow-slate-900/20"
            role="status"
          >
            <LucideIcon :icon="CircleDot" class="size-4.5 shrink-0 text-amber-400" />
            <span class="text-sm font-medium">{{ $t('settings.profile.unsaved.title') }}</span>
            <ul class="flex flex-wrap gap-1.5">
              <li
                v-for="tag in changeTags"
                :key="tag"
                class="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200 ring-1 ring-inset ring-white/15"
              >
                {{ tag }}
              </li>
            </ul>
            <div class="ml-auto flex items-center gap-2">
              <button
                type="button"
                :disabled="saving"
                class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                @click="discard"
              >
                {{ $t('settings.profile.unsaved.discard') }}
              </button>
              <button
                type="button"
                :disabled="saving"
                class="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60"
                @click="save"
              >
                <LucideIcon v-if="saving" :icon="Loader2" class="size-4 animate-spin" />
                {{ saving ? $t('common.saving') : $t('common.save') }}
              </button>
            </div>
          </div>
        </Transition>
      </template>
    </div>

    <SettingsImageCropDialog
      ref="cropDialog"
      :psnid="user?.psnid ?? ''"
      :country="user?.country"
      :banner-url="bannerUrl"
      :avatar-url="shownAvatar"
      @uploaded="onUploaded"
    />
  </section>
</template>
