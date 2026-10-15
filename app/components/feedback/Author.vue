<script setup lang="ts">
import { UserRound } from 'lucide'
import type { FeedbackAuthor } from '~/types/feedback'

/**
 * Who wrote a feedback item or reply. Signed-in members look like everywhere
 * else on the site (avatar, flag, linked PSN ID, level); guests get a dashed
 * placeholder and a "Guest" tag with no link; staff replies carry an "Official"
 * tag next to the staff member's own account.
 */
const props = defineProps<{ author: FeedbackAuthor }>()

const user = computed(() => props.author.type === 'guest' ? null : props.author.user)
const guestName = computed(() => props.author.type === 'guest' ? props.author.name : null)
</script>

<template>
  <div class="flex min-w-0 items-center gap-2.5">
    <template v-if="author.type === 'guest'">
      <span class="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <LucideIcon :icon="UserRound" class="size-4" />
      </span>
      <div class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span class="truncate text-sm font-semibold text-slate-600">{{ guestName || $t('feedback.guest') }}</span>
        <span class="shrink-0 rounded border border-dashed border-slate-300 px-1.5 text-[10px] font-semibold text-slate-500">{{ $t('feedback.guestTag') }}</span>
      </div>
    </template>

    <template v-else-if="user">
      <NuxtLink :to="`/p/${encodeURIComponent(user.psnid)}`" class="shrink-0">
        <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.psnid" class="size-8 rounded-full bg-slate-100 object-cover" />
        <span v-else class="grid size-8 place-items-center rounded-full bg-slate-100 text-sm font-bold uppercase text-slate-500">
          {{ user.psnid.slice(0, 1) }}
        </span>
      </NuxtLink>
      <div class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <RegionFlag v-if="user.country" :country="user.country" class="text-xs" />
        <NuxtLink :to="`/p/${encodeURIComponent(user.psnid)}`" class="truncate text-sm font-semibold text-slate-900 transition hover:text-slate-600">
          {{ user.psnid }}
        </NuxtLink>
        <span v-if="author.type === 'staff'" class="shrink-0 rounded bg-sky-100 px-1.5 py-px text-[10px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-300/70">
          {{ $t('feedback.staffTag') }}
        </span>
        <span v-else-if="user.trophy_level != null" class="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-semibold tabular-nums text-slate-500">
          Lv {{ user.trophy_level }}
        </span>
      </div>
    </template>

    <!-- The account behind a reply or item no longer exists. -->
    <template v-else>
      <span class="size-8 shrink-0 rounded-full bg-slate-100" />
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="truncate text-sm font-semibold text-slate-500">{{ $t(author.type === 'staff' ? 'feedback.staffFallback' : 'feedback.deletedUser') }}</span>
        <span v-if="author.type === 'staff'" class="shrink-0 rounded bg-sky-100 px-1.5 py-px text-[10px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-300/70">
          {{ $t('feedback.staffTag') }}
        </span>
      </div>
    </template>
  </div>
</template>
