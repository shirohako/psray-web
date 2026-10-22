<script setup lang="ts">
import { AtSign, KeyRound, Loader2, Lock, Mail } from 'lucide'
import { useAccountApi } from '~/services/account'

/**
 * Change the login email in two steps: send a code to the new address, then
 * confirm with that code and the current password.
 */
const { user, fetchMe } = useAuth()
const { t } = useI18n()
const toast = useToast()
const api = useAccountApi()
// Toasts a failed request and returns its messages for the form fields.
const mapError = useFormErrorToast()

const editing = ref(false)
const newEmail = ref('')
const code = ref('')
const password = ref('')
const saving = ref(false)
const codeSending = ref(false)
const { remaining: codeCooldown, start: startCooldown, stop: stopCooldown } = useCooldown()
const errors = ref<Record<string, string>>({})

const currentEmail = computed(() => user.value?.email || t('settings.security.email.unbound'))
const canSendCode = computed(() => newEmail.value.trim() !== '' && codeCooldown.value === 0 && !codeSending.value)
const canSave = computed(() =>
  newEmail.value.trim() !== '' && code.value.trim() !== '' && password.value !== '',
)

/** Fold the form back up, forgetting what was typed. */
function close() {
  editing.value = false
  newEmail.value = ''
  code.value = ''
  password.value = ''
  errors.value = {}
  stopCooldown()
}

async function sendCode() {
  if (!canSendCode.value) return
  codeSending.value = true
  errors.value = {}
  try {
    await api.sendEmailCode({ email: newEmail.value.trim() })
    toast.success({ title: t('auth.register.codeSent') })
    startCooldown(60)
  }
  catch (error) {
    errors.value = mapError(error, { EMAIL_ALREADY_USED: 'email' })
  }
  finally {
    codeSending.value = false
  }
}

async function save() {
  if (saving.value || !canSave.value) return
  saving.value = true
  errors.value = {}
  try {
    await api.changeEmail({
      current_password: password.value,
      email: newEmail.value.trim(),
      code: code.value.trim(),
    })
    toast.success({ title: t('settings.security.email.updated') })
    await fetchMe()
    close()
  }
  catch (error) {
    errors.value = mapError(error, {
      INVALID_CREDENTIALS: 'current_password',
      EMAIL_ALREADY_USED: 'email',
      VERIFICATION_CODE_INVALID: 'code',
      VERIFICATION_CODE_EXPIRED: 'code',
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <SettingsEditableRow
    v-model:editing="editing"
    :icon="AtSign"
    tone="sky"
    :label="$t('settings.security.email.label')"
    :value="currentEmail"
    :edit-title="$t('settings.security.email.editTitle')"
    :edit-hint="$t('settings.security.email.current', { email: currentEmail })"
    truncate
  >
    <form class="space-y-4" @submit.prevent="save">
      <!-- Step 1: new email + send verification code -->
      <div class="flex items-end gap-2">
        <AuthField
          v-model="newEmail"
          class="flex-1"
          compact
          :label="$t('settings.security.email.new')"
          type="email"
          :icon="Mail"
          placeholder="you@example.com"
          autocomplete="email"
          :error="errors.email"
        />
        <AuthSendCodeButton
          :cooldown="codeCooldown"
          :sending="codeSending"
          :disabled="!newEmail.trim()"
          class="shrink-0 rounded-lg border border-sky-200 bg-white px-3 py-2 font-semibold text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-50"
          @send="sendCode"
        />
      </div>

      <!-- Step 2: code + current password -->
      <div class="grid gap-4 sm:grid-cols-2">
        <AuthField
          v-model="code"
          compact
          :label="$t('auth.field.code')"
          type="text"
          :icon="KeyRound"
          :placeholder="$t('auth.field.codePlaceholder')"
          autocomplete="one-time-code"
          :error="errors.code"
        />
        <AuthField
          v-model="password"
          compact
          :label="$t('auth.field.currentPassword')"
          type="password"
          :icon="Lock"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="errors.current_password"
        />
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          @click="close"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="submit"
          :disabled="saving || !canSave"
          class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LucideIcon v-if="saving" :icon="Loader2" class="size-4 animate-spin" />
          {{ saving ? $t('settings.security.email.saving') : $t('settings.security.email.save') }}
        </button>
      </div>
    </form>
  </SettingsEditableRow>
</template>
