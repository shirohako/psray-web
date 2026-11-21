<script setup lang="ts">
import { CircleCheck, ImageOff, Link2, Lock } from 'lucide'
import { adminDate } from '~/utils/admin'
import { adminLanguageName, overrideSummary, TROPHY_TYPE_DOT, TROPHY_TYPE_LABEL } from '~/utils/adminTrophySet'
import type { AdminTrophySetDetail, AdminTrophySetRefresh, AdminTrophySetRowChanges } from '~/types/admin'

/**
 * Drawer body for one trophy set: what it is, where it stands (game link,
 * manual edits, translations), the result of a PSN refresh, and its artwork
 * with dead Sony CDN images marked. The actions (edit, refresh) live in
 * AdminTrophySetDrawerFooter. `detail` is the list row until the full item loads.
 */
const props = defineProps<{
  detail: AdminTrophySetDetail
  /** Result of the last "refresh from PSN" for this set, if any. */
  refreshResult?: AdminTrophySetRefresh | null
  refreshError?: any
}>()

const isSquare = computed(() => props.detail.platform.includes('PS5'))
const loaded = computed(() => props.detail.languages !== undefined)
const edits = computed(() => overrideSummary(props.detail.overrides ?? []))
const counts = computed(() => (['platinum', 'gold', 'silver', 'bronze'] as const)
  .map(type => ({ type, count: props.detail.defined_trophies?.[type] ?? 0 }))
  .filter(item => item.count))

// Images that failed to load, keyed by kind + id + URL so a refreshed URL starts clean.
const broken = reactive(new Set<string>())
const images = computed(() => [
  `set:${props.detail.id}:${props.detail.icon_url}`,
  ...(props.detail.groups ?? []).map((g) => `group:${g.id}:${g.icon_url}`),
  ...(props.detail.trophies ?? []).map((t) => `trophy:${t.id}:${t.icon_url}`),
])
const brokenCount = computed(() => images.value.filter((key) => broken.has(key)).length)
watch(() => props.detail.id, () => broken.clear())

const FIELD_LABELS: Record<string, string> = {
  name: '标题',
  detail: '描述',
  icon_url: '图标',
  version: '版本号',
  platform: '平台',
  np_service_name: '服务名',
  has_trophy_groups: '是否有分组',
  defined_trophies: '奖杯数',
}
const nothingChanged = computed(() => {
  const changes = props.refreshResult?.changes
  if (!changes) return false
  const quiet = (c: AdminTrophySetRowChanges) => !c.added && !c.updated
  return !changes.trophy_set.length && quiet(changes.groups) && quiet(changes.trophies)
})
function describe(c: AdminTrophySetRowChanges) {
  const parts = []
  if (c.added) parts.push(`新增 ${c.added}`)
  if (c.updated) parts.push(`更新 ${c.updated}`)
  if (c.icon_updated) parts.push(`其中换图 ${c.icon_updated}`)
  return parts.length ? parts.join('，') : '无变化'
}

const TYPE_RING: Record<string, string> = {
  platinum: 'ring-cyan-300',
  gold: 'ring-amber-300',
  silver: 'ring-slate-300',
  bronze: 'ring-orange-300',
}
</script>

<template>
  <div class="space-y-5">
    <!-- What it is -->
    <div class="flex gap-4">
      <AdminCdnImage
        :src="detail.icon_url"
        :class="isSquare ? 'size-24' : 'h-[88px] w-40'"
        class="shrink-0"
        @broken="broken.add(`set:${detail.id}:${detail.icon_url}`)"
      />
      <div class="min-w-0 flex-1">
        <p class="text-base font-semibold leading-snug text-slate-900">{{ detail.name }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <span class="rounded-full border border-slate-200 px-2 py-px font-mono text-[11px] font-semibold text-slate-600">{{ detail.np_communication_id }}</span>
          <span v-for="platform in detail.platform" :key="platform" class="admin-count">{{ platform }}</span>
          <span class="admin-count">版本 {{ detail.version }}</span>
          <span class="admin-count">{{ detail.owners.toLocaleString() }} 名玩家</span>
        </div>
        <div v-if="counts.length" class="mt-2 flex flex-wrap items-center gap-1.5">
          <span v-for="item in counts" :key="item.type" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">
            <span class="size-1.5 rounded-full" :class="TROPHY_TYPE_DOT[item.type]" />{{ TROPHY_TYPE_LABEL[item.type] }} {{ item.count }}
          </span>
        </div>
      </div>
    </div>

    <!-- Refresh result -->
    <AdminError :error="refreshError" />
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1">
      <div v-if="refreshResult" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
        <p class="flex items-center gap-1.5 font-medium text-slate-900">
          <LucideIcon :icon="CircleCheck" class="size-3.5 text-emerald-600" />{{ nothingChanged ? '已刷新，PSN 返回的内容与库里一致' : '已从 PSN 刷新' }}
        </p>
        <template v-if="!nothingChanged">
          <p>奖杯组：{{ refreshResult.changes.trophy_set.length ? refreshResult.changes.trophy_set.map((f) => FIELD_LABELS[f] ?? f).join('、') + ' 有变化' : '无变化' }}</p>
          <p>分组：{{ describe(refreshResult.changes.groups) }}</p>
          <p>奖杯：{{ describe(refreshResult.changes.trophies) }}</p>
        </template>
        <p v-if="refreshResult.overridden?.length" class="text-amber-700">PSN 有 {{ refreshResult.overridden.length }} 项新值，因为人工修改过没有生效，可以在编辑页对照。</p>
        <p v-if="refreshResult.localization_queued" class="text-slate-500">已排队重新抓取多语言翻译。</p>
      </div>
    </Transition>

    <!-- Where it stands -->
    <dl class="text-[13px]">
      <div class="flex gap-3 border-t border-slate-100 py-2.5">
        <dt class="w-20 shrink-0 text-slate-500">关联游戏</dt>
        <dd class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <template v-if="detail.game">
            <NuxtLink :to="`/admin/games/${detail.game.id}`" class="truncate font-medium text-slate-900 hover:underline">{{ detail.game.name }}</NuxtLink>
            <span class="admin-count">#{{ detail.game.id }}</span>
          </template>
          <span v-else-if="detail.game_id" class="admin-count">#{{ detail.game_id }}</span>
          <span v-else class="text-slate-400">未关联</span>
          <span v-if="detail.game_link_manual" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-px text-[11px] font-semibold text-amber-700">
            <LucideIcon :icon="Link2" class="size-3" />{{ detail.game_id ? '人工指定' : '人工取消，不再自动匹配' }}
          </span>
          <span v-else-if="detail.game_id" class="rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">自动匹配</span>
        </dd>
      </div>
      <div class="flex gap-3 border-t border-slate-100 py-2.5">
        <dt class="w-20 shrink-0 text-slate-500">人工修改</dt>
        <dd class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span v-if="!loaded" class="text-slate-400">加载中…</span>
          <template v-else-if="edits.length">
            <span v-for="label in edits" :key="label" class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-px text-[11px] font-semibold text-amber-700">
              <LucideIcon :icon="Lock" class="size-3" />{{ label }}
            </span>
          </template>
          <span v-else class="text-slate-400">没有，全部跟随 PSN</span>
        </dd>
      </div>
      <div class="flex gap-3 border-t border-slate-100 py-2.5">
        <dt class="w-20 shrink-0 text-slate-500">官方翻译</dt>
        <dd class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span v-if="!loaded" class="text-slate-400">加载中…</span>
          <template v-else>
            <span class="text-slate-900">{{ detail.languages!.length }} 种语言</span>
            <span class="admin-count">默认 {{ adminLanguageName(detail.default_language) }}</span>
          </template>
        </dd>
      </div>
      <div class="flex gap-3 border-t border-slate-100 py-2.5">
        <dt class="w-20 shrink-0 text-slate-500">最近更新</dt>
        <dd class="tabular-nums text-slate-900">{{ adminDate(detail.updated_at) }}</dd>
      </div>
      <div class="flex gap-3 border-y border-slate-100 py-2.5">
        <dt class="w-20 shrink-0 text-slate-500">入库时间</dt>
        <dd class="tabular-nums text-slate-900">{{ adminDate(detail.created_at) }}</dd>
      </div>
    </dl>

    <!-- Artwork -->
    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">图片</h3>
        <span v-if="brokenCount" class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-px text-[11px] font-semibold text-red-700">
          <LucideIcon :icon="ImageOff" class="size-3" />{{ brokenCount }} 张无法加载，可以从 PSN 刷新
        </span>
        <span v-else-if="detail.trophies" class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-px text-[11px] font-semibold text-emerald-700">
          <LucideIcon :icon="CircleCheck" class="size-3" />全部正常
        </span>
      </header>
      <div v-if="!detail.trophies" class="p-4 text-xs text-slate-400">加载中…</div>
      <div v-else class="space-y-4 p-4">
        <div v-if="detail.groups?.length">
          <p class="mb-2 text-xs text-slate-400">分组</p>
          <ul class="grid gap-2 sm:grid-cols-2">
            <li v-for="group in detail.groups" :key="group.id" class="flex min-w-0 items-center gap-2.5">
              <AdminCdnImage
                :src="group.icon_url"
                :class="isSquare ? 'size-10' : 'h-[33px] w-15'"
                @broken="broken.add(`group:${group.id}:${group.icon_url}`)"
              />
              <span class="min-w-0">
                <span class="block truncate text-[13px] text-slate-900">{{ group.name }}</span>
                <span class="block font-mono text-[11px] text-slate-400">{{ group.psn_group_id }}</span>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <p class="mb-2 text-xs text-slate-400">奖杯（{{ detail.trophies.length }}）</p>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
            <li v-for="trophy in detail.trophies" :key="trophy.id" :title="`#${trophy.psn_trophy_id} ${trophy.name}`">
              <AdminCdnImage
                :src="trophy.icon_url"
                class="aspect-square w-full ring-2"
                :class="TYPE_RING[trophy.type]"
                @broken="broken.add(`trophy:${trophy.id}:${trophy.icon_url}`)"
              />
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
