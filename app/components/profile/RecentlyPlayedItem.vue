<script setup lang="ts">
import { ChevronRight, Clock, Globe, Hourglass } from 'lucide'
import type { PlayedTrophySet } from '~/services/profile'

/**
 * One game in a profile's recently played list: artwork, platforms and region,
 * trophies earned per tier, progress, and when it was last played (plus how
 * long it took, once complete). The row opens the trophy set with this
 * player's progress.
 */
const props = defineProps<{
  game: PlayedTrophySet
  /** The profile's PSN ID, for the trophy page's progress view. */
  psnid: string
}>()

const { profileGameDensity } = usePreferences()
const density = computed(() => recentlyPlayedDensity[profileGameDensity.value])

const name = computed(() => props.game.trophy_set.localized_name || props.game.trophy_set.name)
const platforms = computed(() => platformList(props.game.trophy_set.platform))
const tiers = computed(() => earnedTiers(props.game))
</script>

<template>
  <a
    :href="`/trophies/${game.trophy_set_id}`"
    class="group relative isolate flex items-start overflow-hidden transition hover:bg-slate-50"
    :class="density.row"
    @click="openTrophyWithProgress($event, game.trophy_set_id, psnid)"
  >
    <!-- Completed: a faint hanamaru stamped behind the right end of the row
         (desktop only). -z-10 inside the row's isolated stacking context:
         above its (hover) background, below its content. -->
    <Hanamaru
      v-if="game.progress === 100"
      class="pointer-events-none absolute top-1/2 right-8 -z-10 hidden aspect-square h-[78%] -translate-y-1/2 -rotate-12 text-rose-500/15 sm:block"
    />
    <!-- Fixed-width slot keeps rows aligned; the image renders at its natural
         aspect (PS4 320×176 landscape, PS5 square) with a soft ring instead of
         a gray letterbox box around it, plus a loading skeleton. -->
    <div class="flex shrink-0 flex-col items-center" :class="density.artColumn">
      <div class="relative flex items-center justify-center" :class="density.art">
        <TrophySetImage
          :src="game.trophy_set.icon_url"
          :alt="name"
          :platform="platforms"
        />
      </div>
      <div class="flex flex-wrap justify-center sm:hidden" :class="density.mobileBadges">
        <span
          v-for="platform in platforms"
          :key="platform"
          class="inline-flex h-4 shrink-0 items-center rounded px-1.5 text-[10px] font-bold leading-none"
          :class="platformBadgeClass(platform)"
        >
          {{ platformLabel(platform) }}
        </span>
        <span
          v-if="game.trophy_set.region"
          class="inline-flex shrink-0 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-slate-500"
        >
          <LucideIcon :icon="Globe" class="size-3 text-slate-400" />
          {{ game.trophy_set.region }}
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col" :class="density.content">
      <!-- Title -->
      <h3 class="truncate font-semibold text-slate-900" :class="density.title">{{ name }}</h3>

      <!-- Platform + region + per-tier earned counts -->
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          v-for="platform in platforms"
          :key="platform"
          class="hidden h-4 shrink-0 items-center rounded px-1.5 text-[10px] font-bold leading-none sm:inline-flex"
          :class="platformBadgeClass(platform)"
        >
          {{ platformLabel(platform) }}
        </span>
        <span
          v-if="game.trophy_set.region"
          class="hidden shrink-0 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-slate-500 sm:inline-flex"
        >
          <LucideIcon :icon="Globe" class="size-3 text-slate-400" />
          {{ game.trophy_set.region }}
        </span>
        <span
          v-for="(t, i) in tiers"
          :key="i"
          class="inline-flex items-center gap-1 text-xs tabular-nums text-slate-500"
        >
          <span class="size-2 rounded-full" :class="t.dot" />{{ t.count }}
        </span>
      </div>

      <!-- Progress -->
      <div class="flex items-center" :class="density.progress">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full"
            :class="game.progress === 100 ? 'progress-complete' : 'bg-slate-900'"
            :style="{ width: `${game.progress}%` }"
          />
        </div>
        <span class="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600">{{ game.progress }}%</span>
      </div>
      <div class="flex flex-wrap items-center text-slate-400" :class="density.tiers">
        <TimestampMissing
          v-if="game.timestamps_incomplete && game.last_earned_at == null"
          :hint="$t('common.timestampsIncompleteHint')"
        />
        <span v-else class="inline-flex items-center gap-1 leading-none tabular-nums">
          <LucideIcon :icon="Clock" class="size-3 shrink-0" />
          <LocalTime :value="game.last_earned_at" />
        </span>
        <!-- Some earned trophies lack a time: `duration` is always 0 then, so it's never
             shown (the notice above already covers a set with no times at all). -->
        <TimestampMissing
          v-if="game.progress === 100 && game.timestamps_incomplete && game.last_earned_at != null"
          :hint="$t('common.timestampsIncompleteHint')"
        />
        <span
          v-else-if="game.progress === 100 && !game.timestamps_incomplete && game.duration != null"
          class="inline-flex shrink-0 items-center gap-1 leading-none text-slate-400"
        >
          <LucideIcon :icon="Hourglass" class="size-3 shrink-0 text-slate-400" />
          <span class="hidden tabular-nums text-slate-500 sm:inline">
            {{ $t('profile.recent.completedIn', { duration: formatDuration(game.duration) }) }}
          </span>
          <span class="tabular-nums text-slate-500 sm:hidden">{{ formatDuration(game.duration) }}</span>
        </span>
      </div>
    </div>

    <LucideIcon
      :icon="ChevronRight"
      class="shrink-0 text-slate-300 transition group-hover:text-slate-400"
      :class="density.chevron"
    />
  </a>
</template>
