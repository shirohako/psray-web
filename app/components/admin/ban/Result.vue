<script setup lang="ts">
import { CircleCheck } from 'lucide'
import { PENALTY_LEVEL_LABELS, PURGE_CATEGORIES } from '~/utils/admin'
import type { BanResult } from '~/types/admin'
/** The end of the ban flow: what was done, what got deleted and the evidence kept. */
const props = defineProps<{ result: BanResult }>()
const outcome = computed(() => {
  const r = props.result
  if (r.level === 'ranking_ban')
    return r.user.synced
      ? '已清空该用户的排名，之后不会再上榜；同步、登录与数据不受影响。'
      : '该账号尚未同步到本站，已按 PSN 账号 ID 写入处罚，之后同步进来也不会上榜。'
  return r.purged
    ? '该用户的资料与数据已删除，后续同步与登录都会被拦截。'
    : '该账号尚未同步到本站，已按 PSN 账号 ID 写入处罚，之后的同步与登录都会被拦截。'
})
</script>
<template>
  <div class="space-y-5 p-5">
    <div class="flex items-start gap-3">
      <span
        class="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <LucideIcon :icon="CircleCheck" class="size-5" />
      </span>
      <div class="min-w-0 text-[13px]">
        <p class="text-base font-semibold text-slate-950">
          已{{ PENALTY_LEVEL_LABELS[result.level] }} {{ result.user.psnid }}
        </p>
        <p class="mt-0.5 text-slate-500">
          处罚记录
          <span class="font-mono text-slate-700"
            >#{{ result.penalty_id }}</span
          >
          ·
          {{ outcome }}
        </p>
      </div>
    </div>
    <div
      v-if="result.purged"
      class="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200"
    >
      <div v-for="c in PURGE_CATEGORIES" :key="c.key" class="px-4 py-3">
        <p class="text-xs text-slate-500">已删除{{ c.label }}</p>
        <p class="mt-1 text-xl font-semibold tabular-nums text-slate-950">
          {{ (result.purged.totals[c.key] ?? 0).toLocaleString() }}
          <span class="text-xs font-normal text-slate-400">条</span>
        </p>
      </div>
    </div>
    <p v-if="result.user.synced" class="text-[13px] text-slate-600">
      <template v-if="result.evidence.items.length"
        >已保存
        {{
          result.evidence.items.length
        }}
        个奖杯组的游玩记录作为证据。</template
      ><template v-else>本次未保存作弊证据。</template>
      <template v-if="result.evidence.skipped.length">
        忽略了没有记录的奖杯组：<span class="font-mono text-xs">{{
          result.evidence.skipped.join('、')
        }}</span></template
      >
    </p>
  </div>
</template>
