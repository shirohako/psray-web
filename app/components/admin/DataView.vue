<script setup lang="ts">
import { adminField, adminValue, fieldLabels } from '~/utils/admin'
defineProps<{ value: any; depth?: number }>()
const STATUS_KEYS = ['status', 'penalty_level', 'role']
</script>
<template>
  <p
    v-if="value === null || value === undefined"
    class="text-[13px] text-slate-400"
  >
    暂无记录
  </p>
  <ol v-else-if="Array.isArray(value)" class="space-y-2">
    <li v-if="!value.length" class="text-[13px] text-slate-400">暂无记录</li>
    <li v-for="(item, index) in value" :key="index">
      <details class="group" :open="value.length === 1">
        <summary
          class="flex cursor-pointer list-none items-center gap-2 rounded-md py-1 text-[13px] font-medium text-slate-800 hover:text-slate-950 [&::-webkit-details-marker]:hidden"
        >
          <span
            class="grid size-5 place-items-center rounded bg-slate-100 font-mono text-[10px] text-slate-500 transition group-open:bg-slate-900 group-open:text-white"
            >{{ index + 1 }}</span
          >
          {{
            item?.name ||
            item?.psnid ||
            item?.language_code ||
            item?.task ||
            `记录 ${index + 1}`
          }}
          <span v-if="item?.id" class="font-mono text-[11px] text-slate-400"
            >#{{ item.id }}</span
          >
        </summary>
        <AdminDataView
          :value="item"
          :depth="(depth || 0) + 1"
          class="ml-2.5 mt-1 border-l border-slate-200 pl-4"
        />
      </details>
    </li>
  </ol>
  <dl v-else-if="typeof value === 'object'">
    <div
      v-for="(item, key) in value"
      :key="key"
      class="grid gap-x-4 gap-y-1 border-b border-dashed border-slate-200 py-2 last:border-0 sm:grid-cols-[132px_minmax(0,1fr)]"
    >
      <dt class="pt-px text-xs text-slate-500">
        {{ fieldLabels[String(key)] || key }}
        <span
          v-if="fieldLabels[String(key)]"
          class="block font-mono text-[10px] text-slate-300"
          >{{ key }}</span
        >
      </dt>
      <dd class="min-w-0 whitespace-pre-wrap break-words text-[13px] text-slate-900">
        <AdminDataView
          v-if="item !== null && typeof item === 'object'"
          :value="item"
          :depth="(depth || 0) + 1"
          class="border-l border-slate-200 pl-4"
        /><AdminStatus
          v-else-if="STATUS_KEYS.includes(String(key))"
          :value="item"
        /><span
          v-else
          :class="item === null || item === '' ? 'text-slate-300' : ''"
          >{{ adminField(String(key), item) }}</span
        >
      </dd>
    </div>
  </dl>
  <span v-else class="whitespace-pre-wrap break-words text-[13px]">{{
    adminValue(value)
  }}</span>
</template>
