<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  Inbox,
  Info,
  X,
  type IconNode,
} from 'lucide'
import {
  adminDate,
  adminField,
  adminLocalToUtc,
  adminQuery,
  type AdminColumn,
  type AdminFilter,
} from '~/utils/admin'
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    endpoint: string
    columns: AdminColumn[]
    filters?: AdminFilter[]
    detailBase?: string
    idKey?: string
    poll?: boolean
    cursorMode?: boolean
    /** Page icon shown in the header. */
    icon?: IconNode
    /** Nested under a page's own header and tab strip: no page header, and
        the panel joins the strip above it. */
    embedded?: boolean
  }>(),
  { idKey: 'id' },
)
const api = useAdminApi(),
  route = useRoute(),
  router = useRouter()
const rows = ref<any[]>([]),
  meta = ref<any>({}),
  loading = ref(false),
  error = ref<any>(null),
  updated = ref('')
const form = reactive<Record<string, string>>({})
const selected = ref<any>(null),
  detail = ref<any>(null),
  detailOpen = ref(false),
  detailLoading = ref(false),
  detailError = ref<any>(null)
let generation = 0
async function refresh() {
  const current = ++generation
  loading.value = true
  error.value = null
  try {
    const query = adminQuery(route.query)
    // Date filters are entered in local time; the API filters in UTC.
    for (const filter of props.filters || [])
      if (filter.type === 'datetime-local' && typeof query[filter.key] === 'string')
        query[filter.key] = adminLocalToUtc(query[filter.key] as string)
    const response = await api.list(props.endpoint, query)
    if (current !== generation) return
    rows.value = response.data
    meta.value = response.meta || {}
    updated.value = adminDate(new Date()).slice(11)
  } catch (e) {
    if (current === generation) error.value = e
  } finally {
    if (current === generation) loading.value = false
  }
}
function apply() {
  router.replace({
    query: {
      ...Object.fromEntries(Object.entries(form).filter(([, v]) => v)),
      tab: route.query.tab,
    },
  })
}
function page(value: number) {
  router.replace({ query: { ...route.query, page: String(value) } })
}
async function show(row: any) {
  selected.value = row
  detail.value = row
  detailOpen.value = true
  detailError.value = null
  if (!props.detailBase) return
  detailLoading.value = true
  try {
    detail.value = await api.get(
      props.detailBase + '/' + encodeURIComponent(row[props.idKey]),
    )
  } catch (e) {
    detailError.value = e
  } finally {
    detailLoading.value = false
  }
}
async function changed() {
  await refresh()
  if (selected.value && props.detailBase) await show(selected.value)
}
watch(
  () => [route.query, props.endpoint],
  () => {
    for (const key of Object.keys(form)) delete form[key]
    for (const filter of props.filters || []) form[filter.key] = ''
    for (const [key, value] of Object.entries(route.query))
      if (typeof value === 'string' && !['page', 'cursor', 'tab'].includes(key))
        form[key] = value
    refresh()
  },
  { immediate: true },
)
const activeFilters = computed(
  () =>
    Object.entries(route.query).filter(
      ([key, value]) => !['page', 'cursor', 'tab'].includes(key) && value,
    ).length,
)
function clear() {
  router.replace({ query: route.query.tab ? { tab: route.query.tab } : {} })
}
const textFilters = computed(() =>
  (props.filters || []).filter((f) => !f.options && !f.type),
)
const otherFilters = computed(() =>
  (props.filters || []).filter((f) => f.options || f.type),
)
if (props.poll) useAdminPoll(refresh)
defineExpose({ refresh, changed })
</script>
<template>
  <section class="space-y-5">
    <AdminPageHeader
      v-if="!embedded"
      :icon="icon"
      :title="title"
      :description="description"
    >
      <slot name="toolbar" /><AdminRefresh
        :busy="loading"
        :live="poll"
        @click="refresh"
      />
    </AdminPageHeader>
    <h2 v-else class="sr-only">{{ title }}</h2>
    <div
      class="admin-panel relative overflow-hidden"
      :class="embedded ? '!mt-0 rounded-t-none border-t-0' : ''"
      :aria-busy="loading"
    >
      <div
        v-if="loading"
        class="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden"
      >
        <div class="animate-admin-progress h-full w-1/3 bg-slate-900" />
      </div>
      <form
        v-if="filters?.length || embedded"
        class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2.5"
        @submit.prevent="apply"
      >
        <label
          v-for="filter in textFilters"
          :key="filter.key"
          class="relative w-full sm:w-44"
        >
          <span class="sr-only">{{ filter.label }}</span>
          <LucideIcon
            v-if="filter.key === 'q'"
            :icon="Search"
            class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="form[filter.key]"
            class="admin-input"
            :class="filter.key === 'q' ? 'pl-8' : ''"
            :placeholder="filter.label"
          />
        </label>
        <template v-for="filter in otherFilters" :key="filter.key">
          <label v-if="filter.options" class="w-full sm:w-auto">
            <span class="sr-only">{{ filter.label }}</span>
            <select
              v-model="form[filter.key]"
              class="admin-input sm:w-auto sm:min-w-36"
              :class="form[filter.key] ? 'border-slate-900' : 'text-slate-500'"
            >
              <option value="">{{ filter.label }}：全部</option>
              <option
                v-for="option in filter.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <label
            v-else
            class="flex h-8 w-full items-center gap-2 rounded-md border border-slate-200 bg-white pl-2.5 text-[13px] focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 sm:w-auto"
          >
            <span class="whitespace-nowrap text-xs text-slate-400">{{
              filter.label
            }}</span>
            <input
              v-model="form[filter.key]"
              :type="filter.type"
              class="h-full min-w-0 flex-1 bg-transparent pr-2 text-slate-900 outline-none"
            />
          </label>
        </template>
        <template v-if="filters?.length">
          <button class="admin-button admin-primary">筛选</button>
          <button
            v-if="activeFilters"
            type="button"
            class="admin-button border-transparent bg-transparent text-slate-500"
            @click="clear"
          >
            <LucideIcon :icon="X" class="size-3.5" />清除
            <span class="admin-count">{{ activeFilters }}</span>
          </button>
        </template>
        <div v-if="embedded" class="ml-auto flex items-center gap-2">
          <slot name="toolbar" /><AdminRefresh
            :busy="loading"
            :live="poll"
            @click="refresh"
          />
        </div>
      </form>
      <p
        v-if="embedded && description"
        class="flex items-start gap-2 border-b border-slate-200 px-4 py-2 text-xs text-slate-500"
      >
        <LucideIcon :icon="Info" class="mt-px size-3.5 shrink-0 text-slate-400" />
        {{ description }}
      </p>
      <div v-if="error" class="border-b border-slate-200 p-3">
        <AdminError :error="error" />
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[13px]">
          <thead>
            <tr class="border-b border-slate-200">
              <th
                v-for="column in columns"
                :key="column.key"
                class="whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-500"
              >
                {{ column.label }}
              </th>
              <th class="w-10 px-2"><span class="sr-only">操作</span></th>
            </tr>
          </thead>
          <tbody
            class="divide-y divide-slate-100 transition-opacity"
            :class="loading && rows.length ? 'opacity-50' : ''"
          >
            <tr
              v-for="(row, index) in rows"
              :key="row[idKey] || index"
              class="group cursor-pointer transition-colors hover:bg-slate-50"
              :class="
                detailOpen && selected === row
                  ? 'bg-slate-50 shadow-[inset_2px_0_0_var(--color-slate-900)]'
                  : ''
              "
              @click="show(row)"
            >
              <td
                v-for="(column, ci) in columns"
                :key="column.key"
                class="max-w-xs px-4 py-2.5 align-middle"
              >
                <AdminStatus
                  v-if="
                    ['status', 'role', 'penalty_level'].includes(column.key)
                  "
                  :value="row[column.key]"
                /><span
                  v-else
                  class="line-clamp-2 break-words"
                  :class="[
                    column.mono
                      ? 'font-mono text-xs text-slate-600'
                      : 'text-slate-700',
                    ci === 0 && !column.mono ? 'font-medium text-slate-900' : '',
                  ]"
                  :title="adminField(column.key, row[column.key])"
                  >{{ adminField(column.key, row[column.key]) }}</span
                >
              </td>
              <td class="px-2 py-2.5 text-right">
                <button
                  class="grid size-6 place-items-center rounded text-slate-300 transition group-hover:text-slate-900"
                  aria-label="查看详情"
                  @click.stop="show(row)"
                >
                  <LucideIcon :icon="ChevronRight" class="size-4" />
                </button>
              </td>
            </tr>
            <template v-if="!rows.length && loading">
              <tr v-for="i in 6" :key="'s' + i">
                <td
                  v-for="column in columns"
                  :key="column.key"
                  class="px-4 py-3.5"
                >
                  <div
                    class="h-2.5 animate-pulse rounded-full bg-slate-100"
                    :style="{ width: 40 + ((i * 7 + column.key.length * 13) % 50) + '%' }"
                  />
                </td>
                <td />
              </tr>
            </template>
            <tr v-else-if="!rows.length">
              <td :colspan="columns.length + 1" class="px-4 py-20">
                <div class="flex flex-col items-center text-center">
                  <span
                    class="grid size-11 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400"
                  >
                    <LucideIcon :icon="Inbox" class="size-5" />
                  </span>
                  <p class="mt-3 text-[13px] font-medium text-slate-900">
                    {{ error ? '暂时无法获取数据' : '没有符合条件的记录' }}
                  </p>
                  <button
                    v-if="activeFilters && !error"
                    class="mt-1 text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                    @click="clear"
                  >
                    清除筛选条件
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500"
      >
        <span class="tabular-nums"
          ><template v-if="meta.total !== undefined"
            ><b class="font-semibold text-slate-900">{{
              Number(meta.total).toLocaleString()
            }}</b>
            条记录 · </template
          >更新于 {{ updated || '—' }}</span
        >
        <div v-if="cursorMode" class="flex gap-1.5">
          <button
            class="admin-button h-7"
            :disabled="!route.query.cursor"
            @click="
              router.replace({ query: { ...route.query, cursor: undefined } })
            "
          >
            返回最新</button
          ><button
            class="admin-button h-7"
            :disabled="meta.next_cursor == null || loading"
            @click="
              router.replace({
                query: { ...route.query, cursor: meta.next_cursor },
              })
            "
          >
            下一批<LucideIcon :icon="ChevronsRight" class="size-3.5" />
          </button>
        </div>
        <div v-else class="flex items-center gap-1">
          <span class="mr-2 tabular-nums"
            >第 {{ meta.page || 1 }} / {{ meta.last_page || 1 }} 页</span
          >
          <button
            class="admin-button size-7 px-0"
            aria-label="上一页"
            :disabled="!meta.page || meta.page <= 1 || loading"
            @click="page(meta.page - 1)"
          >
            <LucideIcon :icon="ChevronLeft" class="size-4" /></button
          ><button
            class="admin-button size-7 px-0"
            aria-label="下一页"
            :disabled="!meta.page || meta.page >= meta.last_page || loading"
            @click="page(meta.page + 1)"
          >
            <LucideIcon :icon="ChevronRight" class="size-4" />
          </button>
        </div>
      </footer>
    </div>
    <Drawer v-model:open="detailOpen" side="right" size="wide"
      ><template #title
        >{{ title }}
        <span
          v-if="selected?.[idKey] !== undefined"
          class="ml-1 font-mono text-xs font-normal text-slate-400"
          >#{{ selected[idKey] }}</span
        ></template
      ><!-- Drawer keeps its body mounted while closed; slots assume a row. -->
      <div v-if="selected" class="space-y-5 p-5">
        <AdminError :error="detailError" />
        <div
          v-if="detailLoading"
          class="h-0.5 overflow-hidden rounded-full bg-slate-100"
        >
          <div class="animate-admin-progress h-full w-1/3 bg-slate-900" />
        </div>
        <slot
          name="detail-actions"
          :row="selected"
          :detail="detail"
          :refresh="changed"
          :reload="refresh"
          :close="
            () => {
              detailOpen = false
            }
          "
        /><AdminDataView :value="detail" /></div
    ></Drawer>
  </section>
</template>
