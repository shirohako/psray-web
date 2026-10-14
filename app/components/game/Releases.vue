<script setup lang="ts">
import { ChevronDown } from 'lucide'
import type { GamePlatform, GameRelease } from '~/services/games'

/**
 * Every release of a game, grouped by platform in the order the API sends
 * (platform, then date, then region). Long lists — a multi-platform game can
 * have dozens of regional dates — fold after {@link COLLAPSED_ROWS} rows.
 */
const props = defineProps<{ releases: GameRelease[], platforms: GamePlatform[] }>()

const COLLAPSED_ROWS = 12
const expanded = ref(false)

const platformByCode = computed(() => new Map(props.platforms.map(platform => [platform.code, platform])))

/** Rows with the platform badge only on the first row of each platform. */
const rows = computed(() => props.releases.map((release, index) => ({
  ...release,
  key: `${index}-${release.platform}-${release.region}-${release.release_date}`,
  platformInfo: platformByCode.value.get(release.platform)
    ?? { code: release.platform, name: release.platform, abbreviation: null },
  firstOfPlatform: index === 0 || props.releases[index - 1]!.platform !== release.platform,
})))

const visibleRows = computed(() => expanded.value ? rows.value : rows.value.slice(0, COLLAPSED_ROWS))

function statusClass(status: string) {
  return status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
}
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="game-releases-heading">
    <h2 id="game-releases-heading" class="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
      {{ $t('games.detail.releases') }}
    </h2>

    <p v-if="!releases.length" class="px-4 py-8 text-center text-sm text-slate-400">
      {{ $t('games.detail.releasesEmpty') }}
    </p>

    <table v-else class="w-full text-left text-xs">
      <thead class="bg-slate-50/70 text-[10px] text-slate-400">
        <tr>
          <th scope="col" class="w-28 px-4 py-1.5 font-normal">{{ $t('games.detail.platform') }}</th>
          <th scope="col" class="px-2 py-1.5 font-normal">{{ $t('games.detail.region') }}</th>
          <th scope="col" class="px-4 py-1.5 text-right font-normal">{{ $t('games.detail.date') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in visibleRows"
          :key="row.key"
          :class="row.firstOfPlatform ? 'border-t border-slate-100' : ''"
        >
          <td class="px-4 py-2 align-top">
            <GamePlatformBadges v-if="row.firstOfPlatform" :platforms="[row.platformInfo]" />
            <span v-else class="sr-only">{{ row.platformInfo.name }}</span>
          </td>
          <td class="px-2 py-2 text-slate-600">{{ regionLabel(row.region) }}</td>
          <td class="px-4 py-2 text-right">
            <span class="inline-flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
              <span
                v-if="row.status"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium leading-none"
                :class="statusClass(row.status)"
              >
                {{ releaseStatusLabel(row.status) }}
              </span>
              <time
                :datetime="row.release_date ?? undefined"
                class="tabular-nums"
                :class="[
                  row.release_date ? 'text-slate-800' : 'text-slate-400',
                  { 'line-through decoration-slate-300': row.status === 'cancelled' },
                ]"
              >
                {{ formatReleaseDate(row.release_date, row.date_precision) }}
              </time>
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="rows.length > COLLAPSED_ROWS" class="border-t border-slate-100 p-1.5">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? $t('games.detail.showFewerReleases') : $t('games.detail.showAllReleases', rows.length) }}
        <LucideIcon :icon="ChevronDown" class="size-3.5 transition-transform" :class="{ 'rotate-180': expanded }" />
      </button>
    </div>
  </section>
</template>
