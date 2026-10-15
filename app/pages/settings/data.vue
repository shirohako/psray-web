<script setup lang="ts">
import { AlertTriangle, Database, KeyRound, Loader2, Lock, Send, Trash2, UserX } from 'lucide'
import { useAccountApi } from '~/services/account'
import { ApiError } from '~/utils/ApiError'

const { user, hasRole, logout } = useAuth()
const { t } = useI18n()
const toast = useToast()
const api = useAccountApi()

// The API refuses deletion for staff (FORBIDDEN) so they don't lose admin access
// by accident; say so up front instead of letting them run into the error.
const isStaff = computed(() => hasRole('admin') || hasRole('moderator'))


// --- Delete account (two-step: email a code, then confirm with password) ---
const deleteOpen = ref(false)
const code = ref('')
const password = ref('')
const codeSending = ref(false)
const deleting = ref(false)
const errors = ref<Record<string, string>>({})
const { remaining: codeCooldown, start: startCooldown, stop: stopCooldown } = useCooldown()

const canSendCode = computed(() => codeCooldown.value === 0 && !codeSending.value)
const canDelete = computed(() => code.value.trim() !== '' && password.value !== '' && !deleting.value)

/** Map an API error onto field errors by its stable `code`, and toast the message. */
function mapError(error: unknown, byCode: Record<string, string> = {}): Record<string, string> {
  if (!(error instanceof ApiError)) {
    toast.error({ title: t('settings.security.errors.generic') })
    return {}
  }
  const fields = error.isValidation ? error.fieldErrors() : {}
  const mapped = byCode[error.code]
  toast.error({ title: error.message })
  return mapped ? { ...fields, [mapped]: error.message } : fields
}

function openDelete() {
  code.value = ''
  password.value = ''
  errors.value = {}
  deleteOpen.value = true
}

async function sendCode() {
  if (!canSendCode.value) return
  codeSending.value = true
  errors.value = {}
  try {
    await api.sendDeletionCode()
    toast.success({ title: t('auth.register.codeSent') })
    startCooldown(60)
  }
  catch (error) {
    errors.value = mapError(error)
  }
  finally {
    codeSending.value = false
  }
}

async function deleteAccount() {
  if (!canDelete.value) return
  deleting.value = true
  errors.value = {}
  try {
    await api.deleteAccount({ password: password.value, code: code.value.trim() })
  }
  catch (error) {
    errors.value = mapError(error, {
      INVALID_CREDENTIALS: 'password',
      VERIFICATION_CODE_INVALID: 'code',
      VERIFICATION_CODE_EXPIRED: 'code',
    })
    deleting.value = false
    return
  }

  // The account and every token are gone now; `logout()` sees UNAUTHENTICATED
  // and just clears the local session.
  stopCooldown()
  deleteOpen.value = false
  toast.success({ title: t('settings.data.delete.done'), description: t('settings.data.delete.doneDetail') })
  try {
    await logout()
  }
  catch {
    // Nothing left to sign out of on the server.
  }
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div class="space-y-6">
      <div class="overflow-hidden rounded-lg border border-stone-800 bg-stone-900 text-white shadow-sm">
        <div class="p-5">
          <div class="flex min-w-0 items-start gap-3">
            <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-sky-200 ring-1 ring-white/15">
              <LucideIcon :icon="Database" class="size-5.5" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-sky-200">Data center</p>
              <h3 class="mt-1 text-xl font-bold tracking-tight text-white">{{ $t('settings.data.heading') }}</h3>
              <p class="mt-1 max-w-xl text-sm leading-relaxed text-stone-300">
                {{ $t('settings.data.subheading') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <section class="overflow-hidden rounded-lg border border-rose-200 bg-white shadow-sm shadow-slate-900/3">
        <header class="flex items-center gap-2 border-b border-rose-100 bg-rose-50/60 px-4 py-3">
          <LucideIcon :icon="AlertTriangle" class="size-4 text-rose-600" />
          <h4 class="text-sm font-semibold text-rose-700">{{ $t('settings.data.danger.heading') }}</h4>
        </header>

        <div class="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span class="flex min-w-0 items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <LucideIcon :icon="UserX" class="size-5" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-slate-900">{{ $t('settings.data.delete.label') }}</span>
              <span class="mt-1 block text-sm text-slate-500">
                {{ isStaff ? $t('settings.data.delete.staffHint') : $t('settings.data.delete.hint') }}
              </span>
            </span>
          </span>
          <button
            type="button"
            :disabled="isStaff"
            class="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            @click="openDelete"
          >
            <LucideIcon :icon="Trash2" class="size-4" />
            {{ $t('settings.data.delete.open') }}
          </button>
        </div>
      </section>
    </div>

    <Dialog v-model:open="deleteOpen" :title="$t('settings.data.delete.dialogTitle')" size="md">
      <form id="delete-account-form" class="space-y-4 p-5" @submit.prevent="deleteAccount">
        <div class="rounded-lg border border-rose-200 bg-rose-50 p-3.5">
          <p class="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />
            {{ $t('settings.data.delete.irreversible') }}
          </p>
          <ul class="mt-2 list-disc space-y-1 pl-6 text-sm leading-relaxed text-rose-700/90">
            <li>{{ $t('settings.data.delete.effects.sync') }}</li>
            <li>{{ $t('settings.data.delete.effects.account') }}</li>
            <li>{{ $t('settings.data.delete.effects.content') }}</li>
            <li>{{ $t('settings.data.delete.effects.sessions') }}</li>
          </ul>
          <p class="mt-2 text-xs leading-relaxed text-rose-700/75">{{ $t('settings.data.delete.rejoin') }}</p>
        </div>

        <!-- Step 1: code to the bound email -->
        <div class="flex items-end gap-2">
          <AuthField
            v-model="code"
            class="flex-1"
            compact
            :label="$t('auth.field.code')"
            type="text"
            :icon="KeyRound"
            :placeholder="$t('auth.field.codePlaceholder')"
            autocomplete="one-time-code"
            :error="errors.code"
          />
          <button
            type="button"
            :disabled="!canSendCode"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="sendCode"
          >
            <LucideIcon :icon="codeSending ? Loader2 : Send" class="size-4" :class="codeSending && 'animate-spin'" />
            {{ codeCooldown > 0
              ? $t('auth.register.cta.resendIn', { seconds: codeCooldown })
              : (codeSending ? $t('auth.register.cta.sending') : $t('auth.register.cta.sendCode')) }}
          </button>
        </div>
        <p class="-mt-2 truncate text-xs text-slate-500">
          {{ $t('settings.data.delete.codeTo', { email: user?.email ?? '' }) }}
        </p>

        <!-- Step 2: current password -->
        <AuthField
          v-model="password"
          compact
          :label="$t('auth.field.currentPassword')"
          type="password"
          :icon="Lock"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="errors.password"
        />
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            @click="deleteOpen = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            form="delete-account-form"
            :disabled="!canDelete"
            class="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-600/20 transition hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LucideIcon :icon="deleting ? Loader2 : Trash2" class="size-4" :class="deleting && 'animate-spin'" />
            {{ deleting ? $t('settings.data.delete.deleting') : $t('settings.data.delete.confirm') }}
          </button>
        </div>
      </template>
    </Dialog>
  </section>
</template>
