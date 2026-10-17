<script setup lang="ts">
import { ExternalLink, ImageOff, RefreshCw } from 'lucide'
import { adminDate, type AdminTrophySetDetail, type AdminTrophySetRefresh, type AdminTrophySetRowChanges } from '~/utils/admin'

/**
 * Drawer body for one trophy set: its stored artwork with dead Sony CDN images
 * marked, and a button that re-fetches the definition from PSN (new image
 * URLs, texts, DLC trophies). Slots into AdminCollection's `#detail-actions`;
 * `detail` is the list row until the full item loads.
 */
const props = defineProps<{
  detail: AdminTrophySetDetail
  /** Reload the list and this item. */
  refresh: () => Promise<unknown>
}>()

const api = useAdminApi()
const busy = ref(false)
const error = ref<any>(null)
const localize = ref(false)
const result = ref<AdminTrophySetRefresh | null>(null)
const isSquare = computed(() => props.detail.platform.includes('PS5'))

// Images that failed to load, keyed by kind + id + URL so a refreshed URL starts clean.
const broken = reactive(new Set<string>())
const images = computed(() => [
  `set:${props.detail.id}:${props.detail.icon_url}`,
  ...(props.detail.groups ?? []).map((g) => `group:${g.id}:${g.icon_url}`),
  ...(props.detail.trophies ?? []).map((t) => `trophy:${t.id}:${t.icon_url}`),
])
const brokenCount = computed(() => images.value.filter((key) => broken.has(key)).length)
watch(() => props.detail.id, () => {
  broken.clear()
  result.value = null
  error.value = null
  localize.value = false
})

async function refreshFromPsn() {
  if (busy.value) return
  busy.value = true
  error.value = null
  try {
    result.value = await api.write<AdminTrophySetRefresh>(`/trophy-sets/${props.detail.id}/refresh`, { localize: localize.value })
    await props.refresh()
  }
  catch (e) {
    error.value = e
  }
  finally {
    busy.value = false
  }
}

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
  const changes = result.value?.changes
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
    <AdminError :error="error" />

    <section class="admin-panel">
      <div class="flex gap-4 p-4">
        <AdminCdnImage
          :src="detail.icon_url"
          :class="isSquare ? 'size-24' : 'h-[88px] w-40'"
          @broken="broken.add(`set:${detail.id}:${detail.icon_url}`)"
        />
        <div class="min-w-0 flex-1">
          <p class="font-medium text-slate-900">{{ detail.name }}</p>
          <p class="mt-0.5 font-mono text-xs text-slate-500">{{ detail.np_communication_id }}</p>
          <p class="mt-1 text-xs text-slate-500">
            {{ detail.platform.join(' / ') || '—' }} · 版本 {{ detail.version }}
            <template v-if="detail.defined_trophies">
              · 白金 {{ detail.defined_trophies.platinum }} / 金 {{ detail.defined_trophies.gold }} / 银 {{ detail.defined_trophies.silver }} / 铜 {{ detail.defined_trophies.bronze }}
            </template>
          </p>
          <NuxtLink :to="`/trophies/${detail.id}`" target="_blank" class="admin-link mt-2">
            <LucideIcon :icon="ExternalLink" class="size-3.5" />奖杯组页
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">从 PSN 刷新</h3>
        <span class="text-xs text-slate-400">最近更新 {{ detail.updated_at ? adminDate(detail.updated_at) : '—' }}</span>
      </header>
      <div class="space-y-3 p-4">
        <p class="text-xs leading-relaxed text-slate-500">
          立即重新拉取 PSN 当前的定义，覆盖标题、描述、图标、分组和奖杯。索尼 CDN 的旧图片地址会失效，
          版本号没变时用户同步不会重新拉，用这里换成新地址；DLC 新增的奖杯也会一并补上。
        </p>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <label class="flex items-center gap-1.5 text-xs text-slate-600">
            <input v-model="localize" type="checkbox" class="size-4 accent-slate-900" :disabled="busy" />
            同时重新抓取多语言翻译（排队执行，约 30 次 PSN 请求）
          </label>
          <button class="admin-button admin-primary" :disabled="busy" @click="refreshFromPsn">
            <LucideIcon :icon="RefreshCw" class="size-3.5" :class="busy ? 'animate-spin' : ''" />{{ busy ? '正在刷新…' : '从 PSN 刷新' }}
          </button>
        </div>
        <div v-if="result" class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
          <p v-if="nothingChanged" class="font-medium text-slate-900">已刷新，PSN 返回的内容与库里一致，没有改动。</p>
          <template v-else>
            <p class="font-medium text-slate-900">已刷新</p>
            <p>奖杯组：{{ result.changes.trophy_set.length ? result.changes.trophy_set.map((f) => FIELD_LABELS[f] ?? f).join('、') + ' 有变化' : '无变化' }}</p>
            <p>分组：{{ describe(result.changes.groups) }}</p>
            <p>奖杯：{{ describe(result.changes.trophies) }}</p>
          </template>
          <p v-if="result.localization_queued" class="text-slate-500">已排队重新抓取多语言翻译。</p>
        </div>
      </div>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">图片</h3>
        <span v-if="brokenCount" class="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-px text-[11px] font-semibold text-red-700">
          <LucideIcon :icon="ImageOff" class="size-3" />{{ brokenCount }} 张无法加载
        </span>
        <span v-else-if="detail.trophies" class="text-xs text-slate-400">全部正常</span>
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
