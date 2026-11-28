<script setup lang="ts">
import { Globe, Languages, Trophy, Clock, Calendar, RefreshCw, History, Info } from 'lucide'
import type { Profile } from '~/services/profile'
import { AUTO_SYNC_TIERS, type HourInterval } from '~/utils/profile'

const props = defineProps<{ profile: Profile }>()
const { t } = useI18n()

function intervalText(interval: HourInterval) {
  const form = interval.amount === 1 ? 'one' : 'other'
  return t(`profile.account.interval.${interval.unit}.${form}`, { count: interval.amount })
}

const syncIntervalText = computed(() => {
  const interval = resolveHourInterval(props.profile.sync_interval)
  return interval ? intervalText(interval) : t('profile.account.never')
})

/**
 * The auto-sync tiers for the hint next to the interval: time since the last
 * trophy → how long until the next sync, this player's tier marked.
 */
const syncTiers = computed(() => {
  const rows = AUTO_SYNC_TIERS.map((tier, index) => {
    const from = AUTO_SYNC_TIERS[index - 1]?.upTo
    const since = !from
      ? t('profile.account.syncHint.within', { time: intervalText(tier.upTo) })
      : from.unit === tier.upTo.unit
        ? `${from.amount}–${intervalText(tier.upTo)}`
        : `${intervalText(from)}–${intervalText(tier.upTo)}`
    return { since, every: intervalText(resolveHourInterval(tier.everyHours)!), current: tier.everyHours === props.profile.sync_interval }
  })
  const last = AUTO_SYNC_TIERS[AUTO_SYNC_TIERS.length - 1]!.upTo
  rows.push({ since: t('profile.account.syncHint.over', { time: intervalText(last) }), every: t('profile.account.never'), current: false })
  return rows
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="mb-4 text-sm font-semibold text-slate-900">{{ $t('profile.account.title') }}</h2>
    <div class="divide-y divide-slate-100 text-sm">
      <dl class="space-y-3 pb-2.5">
        <div v-if="profile.country" class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="Globe" class="size-4 text-slate-400" />{{ $t('profile.account.region') }}
          </dt>
          <dd class="inline-flex items-center gap-1.5 font-medium text-slate-900">
            <RegionFlag :country="profile.country" />{{ regionName(profile.country) }}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="Languages" class="size-4 text-slate-400" />{{ $t('profile.account.language') }}
          </dt>
          <dd class="text-right font-medium text-slate-900">
            {{ formatList(profile.language.map(langLabel)) || '—' }}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="Calendar" class="size-4 text-slate-400" />{{ $t('profile.account.joined') }}
          </dt>
          <dd class="text-right font-mono font-medium text-slate-900"><LocalTime :value="profile.registered_at" /></dd>
        </div>
      </dl>

      <dl class="space-y-3 py-2.5">
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="Trophy" class="size-4 text-slate-400" />{{ $t('profile.account.firstTrophy') }}
          </dt>
          <dd class="text-right font-mono font-medium text-slate-900"><LocalTime :value="profile.first_trophy_at" /></dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="Clock" class="size-4 text-slate-400" />{{ $t('profile.account.lastTrophy') }}
          </dt>
          <dd class="text-right font-mono font-medium text-slate-900"><LocalTime :value="profile.last_trophy_at" /></dd>
        </div>
      </dl>

      <dl class="space-y-3 pt-2.5">
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="RefreshCw" class="size-4 text-slate-400" />{{ $t('profile.account.syncInterval') }}
            <Tooltip placement="top" class="-ml-1">
              <button
                type="button"
                class="inline-flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                :aria-label="$t('profile.account.syncHint.label')"
                @click="($event.currentTarget as HTMLButtonElement).focus()"
              >
                <LucideIcon :icon="Info" class="size-3.5" />
              </button>
              <template #content>
                <div class="w-64 space-y-2 py-1 font-normal">
                  <p class="leading-4 text-slate-200">{{ $t('profile.account.syncHint.intro') }}</p>
                  <div>
                    <div class="flex justify-between gap-4 px-1.5 pb-1 text-[11px] text-slate-400">
                      <span>{{ $t('profile.account.syncHint.since') }}</span>
                      <span>{{ $t('profile.account.syncHint.every') }}</span>
                    </div>
                    <div
                      v-for="tier in syncTiers"
                      :key="tier.since"
                      class="flex justify-between gap-4 rounded px-1.5 py-px"
                      :class="{ 'bg-white/15': tier.current }"
                    >
                      <span class="tabular-nums text-slate-300">{{ tier.since }}</span>
                      <span class="font-semibold tabular-nums">{{ tier.every }}</span>
                    </div>
                  </div>
                  <p class="text-[11px] leading-4 text-slate-400">{{ $t('profile.account.syncHint.note') }}</p>
                </div>
              </template>
            </Tooltip>
          </dt>
          <dd class="text-right font-medium text-slate-900">{{ syncIntervalText }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="History" class="size-4 text-slate-400" />{{ $t('profile.account.lastSync') }}
          </dt>
          <dd class="text-right font-mono font-medium text-slate-900"><LocalTime :value="profile.last_synced_at" /></dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="inline-flex items-center gap-2 text-slate-500">
            <LucideIcon :icon="Clock" class="size-4 text-slate-400" />{{ $t('profile.account.nextSync') }}
          </dt>
          <dd class="text-right font-mono font-medium text-slate-900">
            <template v-if="profile.sync_next_at == null">{{ $t('profile.account.never') }}</template>
            <LocalTime v-else :value="profile.sync_next_at" />
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
