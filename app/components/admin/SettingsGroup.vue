<script setup lang="ts">
import { Check, KeyRound, RotateCcw, Save } from 'lucide'
import { adminDate } from '~/utils/admin'
import type { SystemSettingGroup, SystemSettingItem, SystemSettingsUpdate } from '~/types/admin'
/**
 * One settings group as a form panel (`/admin/settings`). Only fields the
 * admin touched are sent: a blank secret stays as it is, and "改用环境变量"
 * sends `null` to drop the database value. Emits the fresh list on save.
 * The `#actions` slot (panel header) gets `dirty`: whether there are unsaved
 * edits, e.g. so a test action can say it uses the saved values.
 */
const props = defineProps<{ group: SystemSettingGroup }>()
const emit = defineEmits<{ saved: [result: SystemSettingsUpdate] }>()
const api = useAdminApi()
const drafts = reactive<Record<string, string>>({}),
  // Keys to send as null (drop the database value).
  clearing = ref<string[]>([]),
  busy = ref(false),
  error = ref<any>(null),
  savedCount = ref<number | null>(null)
// Inputs start from the database value only, so an env value never gets
// copied into the database by saving the form unchanged.
function initial(item: SystemSettingItem) {
  return !item.secret && item.source === 'database' ? String(item.value ?? '') : ''
}
function reset() {
  for (const item of props.group.items) drafts[item.key] = initial(item)
  clearing.value = []
}
watch(() => props.group, reset, { immediate: true })
const changes = computed(() => {
  const values: Record<string, string | number | null> = {}
  for (const item of props.group.items) {
    if (clearing.value.includes(item.key)) {
      values[item.key] = null
      continue
    }
    const draft = (drafts[item.key] ?? '').trim()
    if (item.secret) {
      if (draft) values[item.key] = draft
    } else if (draft !== initial(item)) {
      values[item.key] = draft === '' ? null : item.type === 'integer' ? Number(draft) : draft
    }
  }
  return values
})
const dirty = computed(() => Object.keys(changes.value).length > 0)
function optionLabel(item: SystemSettingItem, value: unknown) {
  return item.options.find((o) => o.value === value)?.label ?? String(value)
}
function placeholder(item: SystemSettingItem) {
  if (item.secret) {
    if (item.source === 'database') return '已保存，留空保持不变'
    if (item.source === 'env') return `正在使用环境变量 ${item.env}，填写后改用这里的值`
    return '未设置'
  }
  // Selects show this as their empty option, so it names what "empty" means.
  const shown = item.options.length ? optionLabel(item, item.value) : item.value
  if (item.source === 'env') return `正在使用环境变量 ${item.env}：${shown}`
  if (item.source === 'default') return `使用默认值：${shown}`
  if (item.source === 'database') {
    if (item.env_is_set) return `使用环境变量 ${item.env}`
    return '未设置'
  }
  return '未设置'
}
const SOURCES = {
  database: { label: '后台设置', class: 'bg-sky-50 text-sky-700 ring-sky-200' },
  env: { label: '环境变量', class: 'bg-slate-100 text-slate-600 ring-slate-200' },
  default: { label: '默认值', class: 'bg-slate-100 text-slate-600 ring-slate-200' },
  none: { label: '未设置', class: 'bg-amber-50 text-amber-700 ring-amber-200' },
}
// What dropping the database value falls back to: env, the default, or nothing.
function clearLabel(item: SystemSettingItem) {
  if (item.env_is_set) return '改用环境变量'
  return item.default !== null ? '恢复默认' : '清除'
}
function clearTitle(item: SystemSettingItem) {
  if (item.env_is_set) return `清除后台的值，改用环境变量 ${item.env}`
  if (item.default !== null) return `清除后台的值，恢复默认值 ${optionLabel(item, item.default)}`
  return '清除后台的值（环境变量里也没有，清除后为未设置）'
}
function toggleClear(key: string) {
  clearing.value = clearing.value.includes(key)
    ? clearing.value.filter((k) => k !== key)
    : [...clearing.value, key]
  drafts[key] = clearing.value.includes(key) ? '' : initial(props.group.items.find((i) => i.key === key)!)
}
async function save() {
  if (!dirty.value || busy.value) return
  busy.value = true
  error.value = null
  savedCount.value = null
  try {
    const result = await api.write<SystemSettingsUpdate>(
      '/settings',
      { values: changes.value },
      'patch',
    )
    savedCount.value = result.changed.length
    emit('saved', result)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <form class="admin-panel overflow-hidden" @submit.prevent="save">
    <header class="admin-panel-head py-3">
      <div class="min-w-0 flex-1">
        <h2 class="admin-panel-title">{{ group.label }}</h2>
        <p class="mt-0.5 text-xs text-slate-500">{{ group.description }}</p>
      </div>
      <div v-if="$slots.actions" class="shrink-0"><slot name="actions" :dirty="dirty" /></div>
    </header>
    <div class="divide-y divide-slate-100">
      <div
        v-for="item in group.items"
        :key="item.key"
        class="grid gap-3 px-4 py-4 md:grid-cols-[16rem_1fr]"
      >
        <div class="min-w-0">
          <label
            :for="`setting-${item.key}`"
            class="flex items-center gap-1.5 text-[13px] font-medium text-slate-900"
          >
            <LucideIcon
              v-if="item.secret"
              :icon="KeyRound"
              class="size-3.5 text-slate-400"
            />{{ item.label }}
          </label>
          <p class="mt-0.5 font-mono text-[11px] text-slate-400">
            {{ item.key }}<template v-if="item.env"> · {{ item.env }}</template>
          </p>
          <p v-if="item.description" class="mt-1 text-xs text-slate-500">
            {{ item.description }}
          </p>
        </div>
        <div class="min-w-0 space-y-1.5">
          <div class="flex items-center gap-2">
            <SelectMenu
              v-if="item.options.length"
              :id="`setting-${item.key}`"
              v-model="drafts[item.key]"
              :options="[{ value: '', label: placeholder(item) }, ...item.options]"
              :disabled="busy || clearing.includes(item.key)"
              size="sm"
              class="w-full"
            />
            <input
              v-else
              :id="`setting-${item.key}`"
              v-model="drafts[item.key]"
              :type="item.secret ? 'password' : item.type === 'integer' ? 'number' : 'text'"
              :inputmode="item.type === 'integer' ? 'numeric' : undefined"
              :disabled="busy || clearing.includes(item.key)"
              :placeholder="placeholder(item)"
              :autocomplete="item.secret ? 'new-password' : 'off'"
              spellcheck="false"
              maxlength="255"
              class="admin-input font-mono"
            />
            <button
              v-if="item.source === 'database'"
              type="button"
              class="admin-button shrink-0"
              :class="clearing.includes(item.key) ? 'admin-primary' : ''"
              :disabled="busy"
              :title="clearTitle(item)"
              @click="toggleClear(item.key)"
            >
              <LucideIcon :icon="RotateCcw" class="size-3.5" />{{ clearLabel(item) }}
            </button>
          </div>
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span
              class="inline-flex items-center rounded px-1.5 py-px text-[11px] font-medium ring-1 ring-inset"
              :class="SOURCES[item.source ?? 'none'].class"
              >{{ SOURCES[item.source ?? 'none'].label }}</span
            >
            <span v-if="clearing.includes(item.key)" class="text-amber-700"
              >保存后清除后台的值{{
                item.env_is_set
                  ? `，改用环境变量 ${item.env}`
                  : item.default !== null
                    ? `，恢复默认值 ${optionLabel(item, item.default)}`
                    : '，变为未设置'
              }}</span
            >
            <span v-else-if="item.source === 'database' && item.updated_at"
              >修改于 {{ adminDate(item.updated_at) }}</span
            >
            <span v-if="item.source === 'database' && item.env_is_set && !clearing.includes(item.key)"
              >· 优先于环境变量 {{ item.env }}</span
            >
          </p>
        </div>
      </div>
    </div>
    <div v-if="error" class="px-4 pb-3"><AdminError :error="error" /></div>
    <footer
      class="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3"
    >
      <span
        v-if="savedCount !== null && !dirty"
        class="mr-auto inline-flex items-center gap-1 text-xs text-emerald-700"
        ><LucideIcon :icon="Check" class="size-3.5" />{{
          savedCount ? `已保存 ${savedCount} 项` : '没有变化'
        }}</span
      >
      <button
        type="button"
        class="admin-button"
        :disabled="!dirty || busy"
        @click="reset"
      >
        撤销修改
      </button>
      <button class="admin-button admin-primary" :disabled="!dirty || busy">
        <LucideIcon :icon="Save" class="size-3.5" />{{
          busy ? '正在保存…' : '保存'
        }}
      </button>
    </footer>
  </form>
</template>
