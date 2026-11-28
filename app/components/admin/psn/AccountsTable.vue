<script setup lang="ts">
import { CircleAlert, KeyRound, RefreshCw, Trash2 } from 'lucide'
import { adminDate, adminDaysLeft, adminPsnState } from '~/utils/admin'
import type { AdminPsnAccount } from '~/types/admin'
/**
 * The PSN service accounts as a table (`/admin/psn`): who they sign in as, their
 * state, the npsso fingerprint and when it is expected to run out, and the
 * actions. A row with something to fix is tinted and says what.
 */
defineProps<{ accounts: AdminPsnAccount[]; busyId: number | null }>()
defineEmits<{
  replace: [account: AdminPsnAccount]
  verify: [account: AdminPsnAccount]
  toggle: [account: AdminPsnAccount]
  remove: [account: AdminPsnAccount]
}>()

const TONES = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  bad: 'bg-red-50 text-red-700 ring-red-200',
  muted: 'bg-slate-100 text-slate-600 ring-slate-200',
}
/** npsso expected to run out within a week: time to replace it. */
const SOON_DAYS = 7
</script>
<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[46rem] text-left text-[13px]">
      <thead class="bg-slate-50 text-[11px] font-medium text-slate-400">
        <tr>
          <th class="px-4 py-2 font-medium">账号</th>
          <th class="px-2 py-2 font-medium">状态</th>
          <th class="px-2 py-2 font-medium">npsso 指纹</th>
          <th class="px-2 py-2 font-medium">npsso 预计失效</th>
          <th class="px-2 py-2 font-medium">会话到期</th>
          <th class="px-4 py-2" />
        </tr>
      </thead>
      <tbody>
        <template v-for="account in accounts" :key="account.id">
          <tr
            class="border-t border-slate-100 align-middle"
            :class="account.problem ? 'bg-red-50/60' : ''"
          >
            <td class="px-4 py-3">
              <div class="font-semibold text-slate-900">{{ account.label }}</div>
              <div class="text-[11px] text-slate-400">
                {{ account.psn_online_id ?? '尚未登录' }}
                <span v-if="account.duplicate_of" class="text-amber-600">（与 #{{ account.duplicate_of }} 是同一个 PSN 账号）</span>
              </div>
            </td>
            <td class="px-2 py-3">
              <span
                class="inline-flex items-center rounded px-1.5 py-px text-[11px] font-medium ring-1 ring-inset"
                :class="TONES[adminPsnState(account.state, account.is_enabled).tone]"
                :title="account.state_reason ?? undefined"
              >{{ adminPsnState(account.state, account.is_enabled).label }}</span>
            </td>
            <td class="px-2 py-3 font-mono text-xs text-slate-600">{{ account.npsso_fingerprint ?? '—' }}</td>
            <td class="px-2 py-3 tabular-nums">
              <template v-if="account.npsso_expected_to_expire_at">
                <span
                  :class="(adminDaysLeft(account.npsso_expected_to_expire_at) ?? 99) <= SOON_DAYS ? 'font-medium text-amber-700' : 'text-slate-700'"
                >{{ adminDate(account.npsso_expected_to_expire_at).slice(0, 10) }}</span>
                <span class="ml-1 text-[11px] text-slate-400">{{ adminDaysLeft(account.npsso_expected_to_expire_at) }} 天</span>
              </template>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="px-2 py-3 tabular-nums text-slate-700">{{ adminDate(account.session_expires_at) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  class="admin-button admin-primary"
                  :disabled="busyId === account.id"
                  @click="$emit('replace', account)"
                >
                  <LucideIcon :icon="KeyRound" class="size-3.5" />更换 npsso
                </button>
                <button
                  type="button"
                  class="admin-button"
                  :disabled="busyId === account.id || !account.is_enabled"
                  title="立刻用当前的 npsso 重新登录一次，看 Sony 是否接受"
                  @click="$emit('verify', account)"
                >
                  <LucideIcon :icon="RefreshCw" class="size-3.5" :class="busyId === account.id ? 'animate-spin' : ''" />检查
                </button>
                <button
                  type="button"
                  class="admin-button"
                  :disabled="busyId === account.id"
                  @click="$emit('toggle', account)"
                >
                  {{ account.is_enabled ? '停用' : '启用' }}
                </button>
                <button
                  type="button"
                  class="admin-button"
                  :disabled="busyId === account.id"
                  title="删除账号"
                  @click="$emit('remove', account)"
                >
                  <LucideIcon :icon="Trash2" class="size-3.5" />
                  <span class="sr-only">删除</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="account.problem || (account.last_error && account.state !== 'ready')" class="bg-red-50/60">
            <td colspan="6" class="px-4 pb-3 pt-0">
              <p class="flex items-start gap-1.5 text-xs text-red-700">
                <LucideIcon :icon="CircleAlert" class="mt-px size-3.5 shrink-0" />
                <span>{{ account.problem ?? account.last_error }}</span>
              </p>
            </td>
          </tr>
        </template>
        <tr v-if="!accounts.length">
          <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">还没有 PSN 账号。添加一个后 bridge 才能访问 PSN。</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
