<script setup lang="ts">
import { AlertTriangle, KeyRound, Loader2, Lock, Trash2 } from 'lucide'
import { useAccountApi } from '~/services/account'

/**
 * Delete the account in two steps: email a code to the bound address, then
 * confirm with it and the password. Signs out and goes home once it's gone.
 */
const open = defineModel<boolean>('open', { required: true })

const { user, logout } = useAuth()
const { t } = useI18n()
const toast = useToast()
const api = useAccountApi()
// Toasts a failed request and returns its messages for the form fields.
const mapError = useFormErrorToast()

const code = ref('')
const password = ref('')
const codeSending = ref(false)
const deleting = ref(false)
const errors = ref<Record<string, string>>({})
const { remaining: codeCooldown, start: startCooldown, stop: stopCooldown } = useCooldown()

const canSendCode = computed(() => codeCooldown.value === 0 && !codeSending.value)
const canDelete = computed(() => code.value.trim() !== '' && password.value !== '' && !deleting.value)

// Each opening starts with an empty form; a resend cooldown keeps running.
watch(open, (value) => {
  if (!value) return
  code.value = ''
  password.value = ''
  errors.value = {}
})

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
  open.value = false
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
  <Dialog v-model:open="open" :title="$t('settings.data.delete.dialogTitle')" size="md">
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
        <AuthSendCodeButton
          :cooldown="codeCooldown"
          :sending="codeSending"
          class="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
          @send="sendCode"
        />
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
          @click="open = false"
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
</template>
