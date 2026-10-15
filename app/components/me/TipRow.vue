<script setup lang="ts">
import { ChevronDown, Ellipsis, Eye, EyeOff, Pencil, ThumbsDown, ThumbsUp, Trash2, Trophy } from 'lucide'
import type { ProfileTip } from '~/types/tip'

/**
 * One of the signed-in user's own Tips: its trophy and game, flags, votes and
 * dates, a summary that expands to the full text, and view / edit / delete.
 * A Tip whose trophy is gone can still be deleted, but no longer viewed or edited.
 */
const props = defineProps<{ tip: ProfileTip }>()
const emit = defineEmits<{ edit: []; delete: [] }>()

const expanded = ref(false)
const menuOpen = ref(false)
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
        <div class="flex items-start justify-between gap-3">
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

          <!-- sm and up: the three actions as buttons -->
          <div class="hidden shrink-0 items-center gap-1 sm:flex">
            <NuxtLink
              v-if="target"
              :to="target"
              class="inline-flex h-7 items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
            >
              <LucideIcon :icon="Eye" class="size-3 text-sky-500" />
              {{ $t('common.view') }}
            </NuxtLink>
            <button
              v-if="tip.trophy"
              type="button"
              class="inline-flex h-7 items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800"
              @click="emit('edit')"
            >
              <LucideIcon :icon="Pencil" class="size-3 text-indigo-500" />
              {{ $t('common.edit') }}
            </button>
            <button
              type="button"
              class="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700"
              @click="emit('delete')"
            >
              <LucideIcon :icon="Trash2" class="size-3" />
              {{ $t('trophy.tips.form.delete') }}
            </button>
          </div>

          <!-- Phones: the same actions behind one menu button, so the title keeps the row -->
          <DropdownMenu
            align="right"
            panel-class="!min-w-0 w-max !rounded-lg !p-1"
            role="button"
            :aria-label="$t('me.tips.actions')"
            :aria-expanded="menuOpen"
            class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border shadow-sm transition sm:hidden"
            :class="menuOpen
              ? 'border-slate-300 bg-slate-100 text-slate-900'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'"
            @open="menuOpen = true"
            @close="menuOpen = false"
          >
            <LucideIcon :icon="Ellipsis" class="size-4" />
            <template #menu="{ close }">
              <NuxtLink
                v-if="target"
                :to="target"
                class="flex items-center gap-2 whitespace-nowrap rounded-md py-1.5 pl-2 pr-4 text-xs font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                @click="close"
              >
                <LucideIcon :icon="Eye" class="size-3.5 text-sky-500" />
                {{ $t('common.view') }}
              </NuxtLink>
              <button
                v-if="tip.trophy"
                type="button"
                class="flex w-full items-center gap-2 whitespace-nowrap rounded-md py-1.5 pl-2 pr-4 text-left text-xs font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                @click="close(); emit('edit')"
              >
                <LucideIcon :icon="Pencil" class="size-3.5 text-indigo-500" />
                {{ $t('common.edit') }}
              </button>
              <div v-if="target || tip.trophy" class="mx-1 my-1 border-t border-slate-100" />
              <button
                type="button"
                class="flex w-full items-center gap-2 whitespace-nowrap rounded-md py-1.5 pl-2 pr-4 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                @click="close(); emit('delete')"
              >
                <LucideIcon :icon="Trash2" class="size-3.5" />
                {{ $t('trophy.tips.form.delete') }}
              </button>
            </template>
          </DropdownMenu>
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

        <div
          v-if="expanded"
          :id="`tip-${tip.id}-body`"
          class="mt-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3"
        >
          <RichContent :content="tip.content" :format="tip.content_type" />
        </div>
        <p v-else :id="`tip-${tip.id}-body`" class="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-600">{{ excerpt }}</p>
        <button
          v-if="expandable"
          type="button"
          class="group/expand mt-2 inline-flex h-6 items-center gap-1 rounded-full border border-slate-200 bg-white pl-2 pr-2.5 text-[11px] font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          :aria-expanded="expanded"
          :aria-controls="`tip-${tip.id}-body`"
          @click="expanded = !expanded"
        >
          <LucideIcon
            :icon="ChevronDown"
            class="size-3 text-slate-400 transition-transform duration-200 group-hover/expand:text-slate-600"
            :class="{ 'rotate-180': expanded }"
          />
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
          <i18n-t keypath="me.tips.publishedAt" scope="global" tag="span" class="tabular-nums">
            <template #time><LocalTime :value="tip.created_at" /></template>
          </i18n-t>
          <i18n-t v-if="edited" keypath="me.tips.editedAt" scope="global" tag="span" class="tabular-nums">
            <template #time><LocalTime :value="tip.updated_at" /></template>
          </i18n-t>
        </div>
      </div>
    </div>
  </article>
</template>
