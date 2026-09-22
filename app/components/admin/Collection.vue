<script setup lang="ts">
import {
  adminQuery,
  adminValue,
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
    const response = await api.list(props.endpoint, adminQuery(route.query))
    if (current !== generation) return
    rows.value = response.data
    meta.value = response.meta || {}
    updated.value = new Date().toLocaleTimeString('zh-CN', { timeZone: 'UTC' })
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
if (props.poll) useAdminPoll(refresh)
defineExpose({ refresh, changed })
</script>
<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="mt-2 text-sm text-slate-500">
          {{ description }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="toolbar" /><button
          class="admin-button"
          :disabled="loading"
          @click="refresh"
        >
          刷新
        </button>
      </div>
    </div>
    <form
      v-if="filters?.length"
      class="admin-card flex flex-wrap items-end gap-3"
      @submit.prevent="apply"
    >
      <label
        v-for="filter in filters"
        :key="filter.key"
        class="min-w-36 flex-1 text-xs font-medium text-slate-500"
        >{{ filter.label
        }}<select
          v-if="filter.options"
          v-model="form[filter.key]"
          class="admin-input mt-2"
        >
          <option value="">全部</option>
          <option
            v-for="option in filter.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option></select
        ><input
          v-else
          v-model="form[filter.key]"
          :type="filter.type || 'text'"
          class="admin-input mt-2"
          :placeholder="filter.label" /></label
      ><button class="admin-button admin-primary">查询</button
      ><button
        type="button"
        class="admin-button"
        @click="
          router.replace({
            query: route.query.tab ? { tab: route.query.tab } : {},
          })
        "
      >
        重置
      </button>
    </form>
    <AdminError :error="error" />
    <div
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
      :aria-busy="loading"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"
          >
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                class="whitespace-nowrap px-4 py-3 font-medium"
              >
                {{ column.label }}
              </th>
              <th class="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(row, index) in rows"
              :key="row[idKey] || index"
              class="hover:bg-slate-50/70"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="max-w-xs px-4 py-3"
              >
                <AdminStatus
                  v-if="
                    ['status', 'role', 'penalty_level'].includes(column.key)
                  "
                  :value="row[column.key]"
                /><span
                  v-else
                  class="line-clamp-2 break-words"
                  :title="adminValue(row[column.key])"
                  >{{ adminValue(row[column.key]) }}</span
                >
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <button
                  class="text-indigo-600 hover:underline"
                  @click="show(row)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td
                :colspan="columns.length + 1"
                class="px-4 py-14 text-center text-slate-400"
              >
                {{
                  loading
                    ? '正在加载…'
                    : error
                      ? '暂时无法获取数据'
                      : '暂无符合条件的记录'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"
      >
        <span
          >最后更新 {{ updated || '—' }} UTC
          <span v-if="meta.total !== undefined"
            >· 共 {{ meta.total }} 条</span
          ></span
        >
        <div v-if="cursorMode" class="flex gap-2">
          <button
            class="admin-button"
            :disabled="!route.query.cursor"
            @click="
              router.replace({ query: { ...route.query, cursor: undefined } })
            "
          >
            返回最新</button
          ><button
            class="admin-button"
            :disabled="meta.next_cursor == null || loading"
            @click="
              router.replace({
                query: { ...route.query, cursor: meta.next_cursor },
              })
            "
          >
            下一批
          </button>
        </div>
        <div v-else class="flex items-center gap-3">
          <button
            class="admin-button"
            :disabled="!meta.page || meta.page <= 1 || loading"
            @click="page(meta.page - 1)"
          >
            上一页</button
          ><span>{{ meta.page || 1 }} / {{ meta.last_page || 1 }}</span
          ><button
            class="admin-button"
            :disabled="!meta.page || meta.page >= meta.last_page || loading"
            @click="page(meta.page + 1)"
          >
            下一页
          </button>
        </div>
      </footer>
    </div>
    <Dialog v-model:open="detailOpen" title="记录详情" size="4xl"
      ><div class="space-y-4 p-5">
        <AdminError :error="detailError" />
        <p v-if="detailLoading" class="text-sm text-slate-500">正在加载详情…</p>
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
    ></Dialog>
  </section>
</template>
