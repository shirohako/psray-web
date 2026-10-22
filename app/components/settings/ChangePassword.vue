<script setup lang="ts">
import { KeyRound, Loader2, Lock } from 'lucide'
import { useAccountApi } from '~/services/account'

/** Change the password: the current one, then the new one twice, with a strength meter. */
const { t } = useI18n()
const toast = useToast()
const api = useAccountApi()
// Toasts a failed request and returns its messages for the form fields.
const mapError = useFormErrorToast()

const editing = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const mismatch = computed(() => confirmPassword.value !== '' && newPassword.value !== confirmPassword.value)
const canSave = computed(() =>
  currentPassword.value !== '' && newPassword.value.length >= 8 && confirmPassword.value !== '' && !mismatch.value,
)

/** Fold the form back up, forgetting what was typed. */
function close() {
  editing.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  errors.value = {}
}

async function save() {
  if (saving.value) return
  if (mismatch.value) {
    errors.value = { confirm: t('auth.field.passwordMismatch') }
    return
  }
  saving.value = true
  errors.value = {}
  try {
    await api.changePassword({ current_password: currentPassword.value, new_password: newPassword.value })
    toast.success({
      title: t('settings.security.password.updated'),
      description: t('settings.security.password.updatedDetail'),
    })
    close()
  }
  catch (error) {
    errors.value = mapError(error, { INVALID_CREDENTIALS: 'current_password' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <SettingsEditableRow
    v-model:editing="editing"
    :icon="KeyRound"
    tone="violet"
    :label="$t('settings.security.password.label')"
    :value="$t('settings.security.password.hint')"
    :edit-title="$t('settings.security.password.editTitle')"
    :edit-hint="$t('settings.security.password.editHint')"
  >
    <form class="space-y-4" @submit.prevent="save">
      <div class="grid gap-4 sm:grid-cols-2">
        <AuthField
          v-model="currentPassword"
          compact
          :label="$t('auth.field.currentPassword')"
          type="password"
          :icon="Lock"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="errors.current_password"
        />
        <AuthField
          v-model="newPassword"
          compact
          :label="$t('auth.field.newPassword')"
          type="password"
          :icon="Lock"
          placeholder="••••••••"
          autocomplete="new-password"
          :error="errors.new_password"
        />
        <div class="sm:col-span-2">
          <AuthField
            v-model="confirmPassword"
            compact
            :label="$t('auth.field.confirmNewPassword')"
            type="password"
            :icon="Lock"
            placeholder="••••••••"
            autocomplete="new-password"
            :error="errors.confirm || (mismatch ? $t('auth.field.passwordMismatch') : undefined)"
          />
        </div>
      </div>

      <SettingsPasswordStrength :password="newPassword" />

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
          {{ saving ? $t('settings.security.password.saving') : $t('settings.security.password.save') }}
        </button>
      </div>
    </form>
  </SettingsEditableRow>
</template>
