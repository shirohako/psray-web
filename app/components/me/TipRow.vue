<script setup lang="ts">
import { ChevronDown, ChevronUp, EyeOff, Pencil, ThumbsDown, ThumbsUp, Trash2, Trophy } from 'lucide'
import type { ProfileTip } from '~/types/tip'

/**
 * One of the signed-in user's own Tips: its trophy and game, flags, votes and
 * dates, a summary that expands to the full text, and view / edit / delete.
 * A Tip whose trophy is gone can still be deleted, but no longer viewed or edited.
 */
const props = defineProps<{ tip: ProfileTip }>()
const emit = defineEmits<{ edit: []; delete: [] }>()

const expanded = ref(false)
const target = computed(() => tipTrophyLink(props.tip))
const trophyName = computed(() => props.tip.trophy?.name || `#${props.tip.trophy_id}`)
const edited = computed(() => isTipEdited(props.tip))
const excerpt = computed(() => tipExcerpt(props.tip.content, 240))
// Only offer the full text when the summary leaves something out: cut short, or formatting dropped.
const expandable = computed(() => excerpt.value !== props.tip.content.trim())
</script>

<template>
  <article class="px-4 py-4 sm:px-5">
    <div class="flex items-start gap-3">
      <div class="relative shrink-0">
        <img
          v-if="tip.trophy?.icon_url"
          :src="tip.trophy.icon_url"
          :alt="trophyName"
          loading="lazy"
          class="size-12 rounded-lg bg-slate-100 object-cover"
        >
        <span v-else class="grid size-12 place-items-center rounded-lg bg-slate-100 text-slate-400">
          <LucideIcon :icon="Trophy" class="size-5" />
        </span>
        <span
          v-if="tip.trophy"
          class="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-white"
          :class="trophyTierColor(tip.trophy.type)"
        >
          <LucideIcon :icon="Trophy" class="size-3" />
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-semibold text-slate-900">
              <NuxtLink v-if="target && tip.trophy" :to="target" class="transition hover:text-sky-600">{{ trophyName }}</NuxtLink>
              <span v-else class="text-slate-400">{{ $t('me.tips.trophyGone') }}</span>
            </h3>
            <p v-if="tip.trophy_set" class="mt-0.5 truncate text-xs text-slate-500">
              {{ tip.trophy_set.name }}
              <span v-if="tip.trophy_set.platform.length" class="text-slate-400">· {{ tip.trophy_set.platform.join(' / ') }}</span>
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <NuxtLink
              v-if="target"
              :to="target"
              class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {{ $t('common.view') }}
            </NuxtLink>
            <button
              v-if="tip.trophy"
              type="button"
              class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              @click="emit('edit')"
            >
              <LucideIcon :icon="Pencil" class="size-3.5" />
              {{ $t('common.edit') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              @click="emit('delete')"
            >
              <LucideIcon :icon="Trash2" class="size-3.5" />
              {{ $t('trophy.tips.form.delete') }}
            </button>
          </div>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{{ langLabel(tip.language) }}</span>
          <span v-if="tip.has_spoiler" class="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">
            <LucideIcon :icon="EyeOff" class="size-3" />
            {{ $t('me.tips.spoiler') }}
          </span>
          <span v-if="tip.missable === true" class="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">{{ $t('trophy.tips.missable') }}</span>
          <span v-else-if="tip.missable === false" class="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">{{ $t('trophy.tips.form.missableNo') }}</span>
        </div>

        <RichContent v-if="expanded" class="mt-2" :content="tip.content" :format="tip.content_type" />
        <p v-else class="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-600">{{ excerpt }}</p>
        <button
          v-if="expandable"
          type="button"
          class="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          <LucideIcon :icon="expanded ? ChevronUp : ChevronDown" class="size-3.5" />
          {{ $t(expanded ? 'me.tips.collapse' : 'me.tips.expand') }}
        </button>

        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <span class="inline-flex items-center gap-1" :title="$t('trophy.tips.helpful')">
            <LucideIcon :icon="ThumbsUp" class="size-3" />
            <span class="tabular-nums">{{ fmt(tip.vote_up_count) }}</span>
          </span>
          <span class="inline-flex items-center gap-1" :title="$t('trophy.tips.notHelpful')">
            <LucideIcon :icon="ThumbsDown" class="size-3" />
            <span class="tabular-nums">{{ fmt(tip.vote_down_count) }}</span>
          </span>
          <span class="tabular-nums">{{ $t('me.tips.publishedAt', { time: fmtDateTime(tip.created_at) }) }}</span>
          <span v-if="edited" class="tabular-nums">{{ $t('me.tips.editedAt', { time: fmtDateTime(tip.updated_at) }) }}</span>
        </div>
      </div>
    </div>
  </article>
</template>
