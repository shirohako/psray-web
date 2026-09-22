<script setup lang="ts">
import { adminValue, fieldLabels } from '~/utils/admin'
defineProps<{ value: any; depth?: number }>()
</script>
<template>
  <div
    v-if="value === null || value === undefined"
    class="text-sm text-slate-400"
  >
    暂无记录
  </div>
  <div v-else-if="Array.isArray(value)" class="space-y-3">
    <p v-if="!value.length" class="text-sm text-slate-400">暂无记录</p>
    <details
      v-for="(item, index) in value"
      :key="index"
      class="rounded-lg border border-slate-200 p-3"
    >
      <summary class="cursor-pointer text-sm font-medium">
        {{
          item?.name ||
          item?.psnid ||
          item?.language_code ||
          item?.task ||
          `记录 ${index + 1}`
        }}
        <span v-if="item?.id" class="text-slate-400">#{{ item.id }}</span>
      </summary>
      <AdminDataView :value="item" :depth="(depth || 0) + 1" class="mt-3" />
    </details>
  </div>
  <dl v-else-if="typeof value === 'object'" class="divide-y divide-slate-100">
    <div
      v-for="(item, key) in value"
      :key="key"
      class="grid gap-2 py-3 text-sm sm:grid-cols-[150px_minmax(0,1fr)]"
    >
      <dt class="break-words font-medium text-slate-500">
        {{ fieldLabels[String(key)] || key }}
      </dt>
      <dd class="min-w-0 whitespace-pre-wrap break-words text-slate-800">
        <AdminDataView
          v-if="item !== null && typeof item === 'object'"
          :value="item"
          :depth="(depth || 0) + 1"
        /><AdminStatus
          v-else-if="['status', 'penalty_level', 'role'].includes(String(key))"
          :value="item"
        /><span v-else>{{ adminValue(item) }}</span>
      </dd>
    </div>
  </dl>
  <span v-else class="whitespace-pre-wrap break-words text-sm">{{
    adminValue(value)
  }}</span>
</template>
