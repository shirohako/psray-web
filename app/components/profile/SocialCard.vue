<script setup lang="ts">
import { ChevronRight, Users, Heart, UserPlus, UserCheck } from 'lucide'
import type { FollowDirection, Profile } from '~/services/profile'

const props = defineProps<{ profile: Profile }>()

// Each count opens the follow dialog on its own list.
const dialogOpen = ref(false)
const direction = ref<FollowDirection>('followers')

function openList(value: FollowDirection) {
  direction.value = value
  dialogOpen.value = true
}

const counts = computed(() => [
  { key: 'followers' as const, icon: Users, iconClass: 'text-slate-900', count: props.profile.follower_count, labelKey: 'profile.social.followers' },
  { key: 'following' as const, icon: Heart, iconClass: 'text-rose-500', count: props.profile.following_count, labelKey: 'profile.social.following' },
])

/** Follow relationship between the viewer and this profile, for a status chip. */
const relationship = computed(() => {
  const p = props.profile
  if (p.is_following && p.is_follower)
    return { labelKey: 'profile.social.mutual', icon: UserCheck, class: 'bg-emerald-50 text-emerald-600' }
  if (p.is_follower)
    return { labelKey: 'profile.social.followsYou', icon: UserPlus, class: 'bg-sky-50 text-sky-600' }
  if (p.is_following)
    return { labelKey: 'profile.actions.following', icon: UserCheck, class: 'bg-slate-100 text-slate-700' }
  return null
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-slate-900">{{ $t('profile.social.title') }}</h2>
      <span
        v-if="relationship"
        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="relationship.class"
      >
        <LucideIcon :icon="relationship.icon" class="size-3.5" />{{ $t(relationship.labelKey) }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="item in counts"
        :key="item.key"
        type="button"
        aria-haspopup="dialog"
        class="group flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        @click="openList(item.key)"
      >
        <LucideIcon :icon="item.icon" class="size-4 shrink-0" :class="item.iconClass" />
        <span class="text-lg font-bold text-slate-900">{{ fmt(item.count) }}</span>
        <span class="min-w-0 truncate text-xs text-slate-400">{{ $t(item.labelKey) }}</span>
        <LucideIcon :icon="ChevronRight" class="ml-auto size-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </button>
    </div>

    <ProfileFollowDialog
      v-model:open="dialogOpen"
      v-model:direction="direction"
      :psnid="profile.psnid"
      :follower-count="profile.follower_count"
      :following-count="profile.following_count"
    />
  </div>
</template>
