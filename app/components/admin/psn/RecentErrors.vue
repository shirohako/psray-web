<script setup lang="ts">
import { adminDate } from '~/utils/admin'
import type { AdminPsnRecentError } from '~/types/admin'
/**
 * The bridge's most recent PSN errors (`/admin/psn`): when, which PSN endpoint,
 * the HTTP status and Sony's own error code, and the request id to look up in
 * the logs (`psn-bridge` source, and `bridge_request_id` in laravel.log).
 */
defineProps<{ errors: AdminPsnRecentError[] }>()
</script>
<template>
  <section class="admin-panel overflow-hidden">
    <header class="admin-panel-head"><h2 class="admin-panel-title">最近的 PSN 错误</h2></header>
    <div v-if="!errors.length" class="px-4 py-6 text-center text-sm text-slate-400">bridge 启动以来没有 PSN 错误。</div>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[40rem] text-left text-xs">
        <thead class="bg-slate-50 text-[11px] text-slate-400">
          <tr>
            <th class="px-4 py-2 font-medium">时间</th>
            <th class="px-2 py-2 font-medium">接口</th>
            <th class="px-2 py-2 font-medium">状态</th>
            <th class="px-2 py-2 font-medium">Sony 错误码</th>
            <th class="px-2 py-2 font-medium">类型</th>
            <th class="px-4 py-2 font-medium">请求号</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e, i) in errors" :key="`${e.at}-${i}`" class="border-t border-slate-100" :title="e.message">
            <td class="whitespace-nowrap px-4 py-2 tabular-nums text-slate-400">{{ adminDate(e.at) }}</td>
            <td class="px-2 py-2 font-medium text-slate-900">{{ e.endpoint }}</td>
            <td class="px-2 py-2 tabular-nums text-slate-700">{{ e.status ?? '—' }}</td>
            <td class="px-2 py-2 tabular-nums text-slate-700">{{ e.sonyCode ?? '—' }}</td>
            <td class="px-2 py-2 text-slate-500">{{ e.code }}</td>
            <td class="px-4 py-2 font-mono text-[11px] text-slate-400">{{ e.requestId ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
