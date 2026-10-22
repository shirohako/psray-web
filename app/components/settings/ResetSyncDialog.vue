<script setup lang="ts">
import { AlertTriangle, AtSign, Loader2, RotateCcw } from 'lucide'
import { useAccountApi } from '~/services/account'
import { ApiError } from '~/utils/ApiError'

/**
 * Reset the synced data, confirmed by retyping the PSN ID, then follow the
 * full re-sync on /sync. Emits `failed` when the server refuses, so the page
 * can fetch why (a cooldown, a sync already running).
 */
defineProps<{
  /** How long the cooldown after this reset lasts, ready to show. */
  cooldown: string
}>()

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ failed: [] }>()

const { user } = useAuth()
const { t, te } = useI18n()
const toast = useToast()
const api = useAccountApi()
// Toasts a failed request and returns its messages for the form fields.
const mapError = useFormErrorToast()

const confirmation = ref('')
const resetting = ref(false)
// Exact match, like the API: a typo must not go through.
const canReset = computed(() => confirmation.value.trim() === user.value?.psnid && !resetting.value)

// Each opening starts with an empty confirmation.
watch(open, (value) => {
  if (value) confirmation.value = ''
})

async function reset() {
  if (!canReset.value || !user.value) return
  resetting.value = true
  try {
    await api.resetSync(confirmation.value.trim())
  }
  catch (error) {
    // Localized copy for the expected refusals; anything else shows the server's message.
    const key = error instanceof ApiError ? `settings.data.resync.errors.${error.code}` : ''
    if (key && te(key)) toast.error({ title: t(key) })
    else mapError(error)
    resetting.value = false
    emit('failed')
    return
  }

  open.value = false
  toast.success({ title: t('settings.data.resync.done'), description: t('settings.data.resync.doneDetail') })
  await navigateTo({ path: '/sync', query: { psnid: user.value.psnid } })
}
</script>

<template>
  <Dialog v-model:open="open" :title="$t('settings.data.resync.dialogTitle')" size="md">
    <form id="reset-sync-form" class="space-y-4 p-5" @submit.prevent="reset">
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-3.5">
        <p class="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />
          {{ $t('settings.data.resync.intro') }}
        </p>
        <ul class="mt-2 list-disc space-y-1 pl-6 text-sm leading-relaxed text-amber-800/90">
          <li>{{ $t('settings.data.resync.effects.data') }}</li>
          <li>{{ $t('settings.data.resync.effects.stats') }}</li>
          <li>{{ $t('settings.data.resync.effects.time') }}</li>
          <li>{{ $t('settings.data.resync.effects.cooldown', { duration: cooldown }) }}</li>
        </ul>
        <p class="mt-2 text-xs leading-relaxed text-amber-800/75">{{ $t('settings.data.resync.kept') }}</p>
      </div>

      <AuthField
        v-model="confirmation"
        compact
        :label="$t('settings.data.resync.confirmLabel', { psnid: user?.psnid ?? '' })"
        type="text"
        :icon="AtSign"
        :placeholder="user?.psnid ?? ''"
        autocomplete="off"
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
          form="reset-sync-form"
          :disabled="!canReset"
          class="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-600/20 transition hover:bg-amber-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LucideIcon :icon="resetting ? Loader2 : RotateCcw" class="size-4" :class="resetting && 'animate-spin'" />
          {{ resetting ? $t('settings.data.resync.resetting') : $t('settings.data.resync.confirm') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
