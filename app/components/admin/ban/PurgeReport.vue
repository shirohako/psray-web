<script setup lang="ts">
import { Database } from 'lucide'
import { PURGE_CATEGORIES } from '~/utils/admin'
import type { PurgeReport } from '~/types/admin'
/**
 * What a termination will delete, one box per category, account data
 * first. `report` is null when the site holds nothing for the account.
 */
const props = defineProps<{ report: PurgeReport | null }>()
const groups = computed(() =>
  PURGE_CATEGORIES.map((c) => ({
    ...c,
    items: props.report?.items.filter((i) => i.category === c.key) ?? [],
    total: props.report?.totals[c.key] ?? 0,
  })).filter((g) => g.items.length),
)
</script>
<template>
  <section>
    <h3
      class="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-900"
    >
      <LucideIcon
        :icon="Database"
        class="size-4 text-slate-400"
      />将删除的数据
    </h3>
    <p v-if="!report" class="text-[13px] text-slate-500">
      本站没有该账号的数据，无需清理。
    </p>
    <div v-else class="space-y-3">
      <div
        v-for="group in groups"
        :key="group.key"
        class="overflow-hidden rounded-lg border"
        :class="
          group.key === 'account' ? 'border-red-200' : 'border-slate-200'
        "
      >
        <div
          class="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs"
          :class="
            group.key === 'account'
              ? 'border-red-200 bg-red-50/60 text-red-900'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          "
        >
          <span
            ><b class="font-semibold">{{ group.label }}</b> ·
            {{ group.note }}</span
          >
          <span class="font-semibold tabular-nums"
            >{{ group.total.toLocaleString() }} 条</span
          >
        </div>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="item in group.items"
            :key="item.key"
            class="flex items-start justify-between gap-4 px-3 py-2 text-[13px]"
            :class="item.count ? '' : 'text-slate-400'"
          >
            <div class="min-w-0">
              <p :class="item.count ? 'text-slate-800' : ''">
                {{ item.label }}
                <span class="font-mono text-[11px] text-slate-400">{{
                  item.key
                }}</span>
              </p>
              <p
                v-if="item.impact && item.count"
                class="mt-0.5 text-xs text-slate-500"
              >
                {{ item.impact }}
              </p>
            </div>
            <span class="shrink-0 font-mono text-xs tabular-nums">{{
              item.count.toLocaleString()
            }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
