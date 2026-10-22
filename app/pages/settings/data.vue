<script setup lang="ts">
import { AlertTriangle, Database, RotateCcw, Trash2, UserX } from 'lucide'
import type { SyncResetStatus } from '~/services/account'

const { hasRole } = useAuth()
const { t } = useI18n()

// The API refuses deletion for staff (FORBIDDEN) so they don't lose admin access
// by accident; say so up front instead of letting them run into the error.
const isStaff = computed(() => hasRole('admin') || hasRole('moderator'))

// --- Reset synced data -------------------------------------------------------
// Cooldown + "a sync is running" come from the server, so the row can say why
// the button is off before anyone clicks it.
const { data: resetStatus, error: resetStatusError, refresh: refreshResetStatus }
  = await useApiFetch<SyncResetStatus>('/user/account/sync-reset')

const resetBlocked = computed(() => !resetStatus.value || resetStatus.value.syncing || !!resetStatus.value.available_at)
// Past two days, round up to whole days: "7 days" reads better than "159 hours",
// and erring long never promises a reset before the server allows one.
const resetCooldown = computed(() => {
  const hours = resetStatus.value?.cooldown_hours ?? 0
  return formatHourInterval(hours >= 48 ? Math.ceil(hours / 24) * 24 : hours) ?? ''
})
const resetHint = computed(() => {
  const status = resetStatus.value
  if (resetStatusError.value || !status) return t('settings.data.resync.statusFailed')
  if (status.syncing) return t('settings.data.resync.syncing')
  if (status.available_at) return t('settings.data.resync.cooldownActive', { time: fmtDateTime(status.available_at) })
  return t('settings.data.resync.cooldownNext', { duration: resetCooldown.value })
})

const resetOpen = ref(false)
const deleteOpen = ref(false)
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div class="space-y-6">
      <SettingsHero :icon="Database" eyebrow="Data center" :title="$t('settings.data.heading')" :description="$t('settings.data.subheading')" />

      <!-- Danger zone -->
      <section class="overflow-hidden rounded-lg border border-rose-200 bg-white shadow-sm shadow-slate-900/3">
        <header class="flex items-center gap-2 border-b border-rose-100 bg-rose-50/60 px-4 py-3">
          <LucideIcon :icon="AlertTriangle" class="size-4 text-rose-600" />
          <h4 class="text-sm font-semibold text-rose-700">{{ $t('settings.data.danger.heading') }}</h4>
        </header>

        <SettingsDangerRow
          class="border-b border-slate-100"
          :icon="RotateCcw"
          tone="amber"
          :label="$t('settings.data.resync.label')"
          :hint="$t('settings.data.resync.hint')"
          :action-icon="RotateCcw"
          :action-label="$t('settings.data.resync.open')"
          :disabled="resetBlocked"
          @action="resetOpen = true"
        >
          <span
            class="mt-1.5 block text-xs font-medium"
            :class="resetBlocked ? 'text-amber-600' : 'text-slate-400'"
          >
            {{ resetHint }}
          </span>
        </SettingsDangerRow>

        <SettingsDangerRow
          :icon="UserX"
          tone="rose"
          :label="$t('settings.data.delete.label')"
          :hint="isStaff ? $t('settings.data.delete.staffHint') : $t('settings.data.delete.hint')"
          :action-icon="Trash2"
          :action-label="$t('settings.data.delete.open')"
          :disabled="isStaff"
          @action="deleteOpen = true"
        />
      </section>
    </div>

    <SettingsResetSyncDialog v-model:open="resetOpen" :cooldown="resetCooldown" @failed="refreshResetStatus()" />
    <SettingsDeleteAccountDialog v-model:open="deleteOpen" />
  </section>
</template>
