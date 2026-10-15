<script setup lang="ts">
import type { ProfileFollowEntry } from '~/services/profile'

/**
 * One person in a follow list: avatar, flag, PSN ID, when the follow was made
 * and their level. The whole row opens their profile (a stretched link), while
 * anything in the `action` slot stays clickable on its own.
 */
defineProps<{ person: ProfileFollowEntry }>()
const emit = defineEmits<{ navigate: [] }>()

/** `followed_at` is UTC without a zone marker; read it as such. */
function followedDate(value: string) {
  return fmtDate(`${value.replace(' ', 'T')}Z`)
}
</script>

<template>
  <div class="group relative flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5">
    <img
      :src="person.avatar_url"
      :alt="person.psnid"
      loading="lazy"
      class="size-10 shrink-0 rounded-full bg-slate-100 object-cover ring-1 ring-slate-900/5"
    >
    <div class="min-w-0 flex-1">
      <div class="flex min-w-0 items-center gap-1.5">
        <RegionFlag :country="person.country" class="shrink-0 text-sm" />
        <NuxtLink
          :to="`/p/${encodeURIComponent(person.psnid)}`"
          class="truncate text-sm font-semibold text-slate-900 after:absolute after:inset-0 group-hover:text-sky-600"
          @click="emit('navigate')"
        >{{ person.psnid }}</NuxtLink>
        <slot name="badge" />
      </div>
      <p class="mt-0.5 text-xs text-slate-400">{{ $t('profile.social.followedAt', { date: followedDate(person.followed_at) }) }}</p>
    </div>
    <span class="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
      Lv {{ person.trophy_level }}
    </span>
    <div v-if="$slots.action" class="relative z-10 shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>
