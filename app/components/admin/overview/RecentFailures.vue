<script setup lang="ts">
import { ArrowUpRight, CircleCheck, TriangleAlert } from 'lucide'
import { adminDate } from '~/utils/admin'
import type { SyncFailureRecord } from '~/types/admin'
/** The latest sync failures as a timeline, newest first. */
defineProps<{ failures: SyncFailureRecord[] }>()
</script>
<template>
  <section class="admin-panel">
    <header class="admin-panel-head">
      <h2 class="admin-panel-title">
        <LucideIcon
          :icon="TriangleAlert"
          class="size-4 text-slate-400"
        />最近同步异常
        <span v-if="failures.length" class="admin-count">{{
          failures.length
        }}</span>
      </h2>
      <NuxtLink to="/admin/sync-failures" class="admin-link"
        >全部异常<LucideIcon :icon="ArrowUpRight" class="size-3.5"
      /></NuxtLink>
    </header>
    <div
      v-if="!failures.length"
      class="flex items-center justify-center gap-2 py-14 text-[13px] text-slate-500"
    >
      <LucideIcon :icon="CircleCheck" class="size-4 text-emerald-500" />
      没有新的同步异常
    </div>
    <ol v-else class="p-4 sm:p-5">
      <li
        v-for="failure in failures"
        :key="failure.id"
        class="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-5 sm:grid-cols-[6rem_minmax(0,1fr)]"
      >
        <span
          class="pt-0.5 text-right font-mono text-[11px] leading-5 text-slate-400"
          >{{ adminDate(failure.created_at).slice(5, 16) }}</span
        >
        <div
          class="relative min-w-0 border-l border-slate-200 pb-5 pl-5 group-last:border-transparent group-last:pb-0"
        >
          <span
            class="absolute -left-1.25 top-1.5 size-2.25 rounded-full border-2 border-white bg-red-500 ring-1 ring-red-200"
          />
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[13px] font-semibold text-slate-900">{{
              failure.psnid || failure.np_communication_id
            }}</span>
            <span class="admin-kbd">{{ failure.stage }}</span>
          </div>
          <p
            class="mt-1 line-clamp-2 break-words font-mono text-xs leading-5 text-slate-500"
          >
            {{ failure.error_message }}
          </p>
        </div>
      </li>
    </ol>
  </section>
</template>
