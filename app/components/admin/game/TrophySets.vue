<script setup lang="ts">
import { ExternalLink, Link2, Plus, Unlink } from 'lucide'
import type { AdminGameTrophySet, AdminTrophySet } from '~/types/admin'

/**
 * Trophy sets linked to a game. Linking and unlinking take effect at once
 * (not with the editor's save) and are marked as manual, so automatic IGDB
 * matching leaves them alone (docs/api/admin/trophy-sets/game.md).
 */
const props = defineProps<{ gameId: number, sets: AdminGameTrophySet[] }>()
const emit = defineEmits<{ changed: [] }>()

const api = useAdminApi()
const busy = ref<number | null>(null)
const error = ref<any>(null)
const pickerOpen = ref(false)

async function link(set: AdminTrophySet) {
  busy.value = set.id
  error.value = null
  try {
    await api.write(`/trophy-sets/${set.id}/game`, { game_id: props.gameId }, 'put')
    pickerOpen.value = false
    emit('changed')
  } catch (e) {
    error.value = e
  } finally {
    busy.value = null
  }
}

async function unlink(set: AdminGameTrophySet) {
  if (!window.confirm(`取消「${set.name}」与这个游戏的关联？之后自动匹配也不会再关联它，可以在奖杯组编辑页交还自动匹配。`)) return
  busy.value = set.id
  error.value = null
  try {
    await api.write(`/trophy-sets/${set.id}/game`, { game_id: null }, 'put')
    emit('changed')
  } catch (e) {
    error.value = e
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <section class="admin-panel">
    <header class="admin-panel-head">
      <h2 class="admin-panel-title">关联奖杯组<span class="admin-count">{{ sets.length }}</span></h2>
      <div class="flex items-center gap-3">
        <span class="hidden text-xs text-slate-400 sm:inline">关联和取消立即生效</span>
        <button type="button" class="admin-button" @click="pickerOpen = true"><LucideIcon :icon="Plus" class="size-3.5" />添加奖杯组</button>
      </div>
    </header>
    <AdminError :error="error" class="m-4" />
    <p v-if="!sets.length" class="px-4 py-6 text-center text-xs text-slate-400">还没有关联的奖杯组</p>
    <TransitionGroup
      v-else
      tag="ul"
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <li v-for="set in sets" :key="set.id" class="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5 first:border-t-0">
        <AdminCdnImage :src="set.icon_url" :class="set.platform.includes('PS5') ? 'size-10' : 'h-10 w-[72px]'" class="shrink-0" />
        <span class="min-w-0 flex-1">
          <NuxtLink :to="`/admin/trophy-sets/${set.id}`" class="block truncate text-[13px] font-medium text-slate-900 hover:underline">{{ set.name }}</NuxtLink>
          <span class="mt-1 flex flex-wrap items-center gap-1.5">
            <span class="admin-count font-mono">{{ set.np_communication_id }}</span>
            <span v-for="platform in set.platform" :key="platform" class="admin-count">{{ platform }}</span>
            <span v-if="set.game_link_manual" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700"><LucideIcon :icon="Link2" class="size-3" />人工关联</span>
          </span>
        </span>
        <span class="hidden whitespace-nowrap text-xs tabular-nums text-slate-500 sm:inline">{{ set.owners.toLocaleString() }} 名玩家</span>
        <a :href="`/trophies/${set.id}`" target="_blank" rel="noopener" class="grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="奖杯组页"><LucideIcon :icon="ExternalLink" class="size-3.5" /></a>
        <button type="button" class="grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" :disabled="busy === set.id" aria-label="取消关联" title="取消关联" @click="unlink(set)">
          <LucideIcon :icon="Unlink" class="size-3.5" />
        </button>
      </li>
    </TransitionGroup>
    <AdminTrophySetPicker v-model:open="pickerOpen" :game-id="gameId" :busy="busy !== null" @pick="link" />
  </section>
</template>
