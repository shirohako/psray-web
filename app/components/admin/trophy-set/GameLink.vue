<script setup lang="ts">
import { ExternalLink, Gamepad2, Link2, Search, Unlink, WandSparkles } from 'lucide'
import type { AdminGameSummary, AdminTrophySetDetail } from '~/types/admin'

/**
 * The game a trophy set belongs to. Picking or clearing it takes effect at once
 * and marks the link as manual, so automatic IGDB matching leaves it alone;
 * "hand back" clears the mark and queues a match (docs/api/admin/trophy-sets/game.md).
 */
const props = defineProps<{ detail: AdminTrophySetDetail }>()
const emit = defineEmits<{ changed: [detail: AdminTrophySetDetail] }>()

const api = useAdminApi()
const busy = ref(false)
const error = ref<any>(null)
const pickerOpen = ref(false)
const notice = ref('')

async function send(body: Record<string, unknown>, message: string) {
  busy.value = true
  error.value = null
  notice.value = ''
  try {
    const detail = await api.write<AdminTrophySetDetail>(`/trophy-sets/${props.detail.id}/game`, body, 'put')
    pickerOpen.value = false
    notice.value = message
    emit('changed', detail)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
const pick = (game: AdminGameSummary) => send({ game_id: game.id }, `已关联到 ${game.name}`)
function unlink() {
  if (!window.confirm('取消关联？之后自动匹配也不会再关联它，直到交还自动匹配。')) return
  send({ game_id: null }, '已取消关联')
}
function handBack() {
  if (!window.confirm('交还自动匹配？会先取消当前关联，再立即排队按标题匹配 IGDB。')) return
  send({ auto: true }, '已交还自动匹配，匹配任务已排队')
}
</script>

<template>
  <section class="admin-panel">
    <header class="admin-panel-head">
      <h2 class="admin-panel-title">关联游戏</h2>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="admin-button" :disabled="busy" @click="pickerOpen = true"><LucideIcon :icon="Search" class="size-3.5" />{{ detail.game ? '更换' : '选择游戏' }}</button>
        <button v-if="detail.game_id" type="button" class="admin-button" :disabled="busy" @click="unlink"><LucideIcon :icon="Unlink" class="size-3.5" />取消关联</button>
        <button v-if="detail.game_link_manual" type="button" class="admin-button" :disabled="busy" @click="handBack"><LucideIcon :icon="WandSparkles" class="size-3.5" />交还自动匹配</button>
      </div>
    </header>
    <div class="flex flex-wrap items-center gap-3 px-4 py-3">
      <template v-if="detail.game">
        <img v-if="detail.game.cover" :src="detail.game.cover.url" alt="" class="h-12 w-9 shrink-0 rounded object-cover ring-1 ring-slate-200" />
        <span v-else class="grid h-12 w-9 shrink-0 place-items-center rounded bg-slate-100 text-slate-400"><LucideIcon :icon="Gamepad2" class="size-4" /></span>
        <span class="min-w-0 flex-1">
          <NuxtLink :to="`/admin/games/${detail.game.id}`" class="block truncate text-[13px] font-semibold text-slate-900 hover:underline">{{ detail.game.name }}</NuxtLink>
          <span class="mt-1 flex flex-wrap items-center gap-1.5">
            <span class="admin-count">#{{ detail.game.id }}</span>
            <span v-if="detail.game_link_manual" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700"><LucideIcon :icon="Link2" class="size-3" />人工指定</span>
            <span v-else class="rounded-full bg-slate-100 px-1.5 py-px text-[11px] font-semibold text-slate-600">自动匹配</span>
            <span v-if="detail.game_link_manual" class="text-xs text-slate-500">自动匹配不会再改它</span>
          </span>
        </span>
        <a :href="`/games/${detail.game.id}`" target="_blank" rel="noopener" class="admin-link"><LucideIcon :icon="ExternalLink" class="size-3.5" />游戏页</a>
      </template>
      <template v-else>
        <span class="grid h-12 w-9 shrink-0 place-items-center rounded bg-slate-100 text-slate-400"><LucideIcon :icon="Gamepad2" class="size-4" /></span>
        <span class="text-[13px] text-slate-500">
          没有关联游戏
          <span v-if="detail.game_link_manual" class="ml-1.5 rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700">人工取消，自动匹配不会再关联</span>
          <span v-else class="ml-1.5 text-xs text-slate-400">每日自动匹配会继续尝试</span>
        </span>
      </template>
    </div>
    <p v-if="notice" class="border-t border-slate-100 px-4 py-2 text-xs text-emerald-700">{{ notice }}</p>
    <AdminError :error="error" class="mx-4 mb-3" />
    <AdminGamePicker v-model:open="pickerOpen" :title="detail.game ? '更换关联的游戏' : '选择游戏'" :exclude-id="detail.game_id" :busy="busy" confirm-label="关联" @pick="pick" />
  </section>
</template>
