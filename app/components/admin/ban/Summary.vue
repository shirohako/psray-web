<script setup lang="ts">
import { ListX, TriangleAlert, UserX } from 'lucide'
import { adminDate, PENALTY_LEVEL_LABELS } from '~/utils/admin'
import type { BanPreview } from '~/types/admin'
/**
 * What the dry run says will happen and to whom: the penalty's effect (for
 * an account never synced here, that only the penalty gets written), the
 * account, and a warning when it already has this penalty.
 */
const props = defineProps<{ preview: BanPreview }>()
const terminating = computed(() => props.preview.level === 'termination')
</script>
<template>
  <div
    class="flex items-start gap-3 rounded-lg border p-3 text-[13px]"
    :class="
      terminating
        ? 'border-red-200 bg-red-50/60 text-red-900'
        : 'border-amber-200 bg-amber-50/70 text-amber-900'
    "
  >
    <LucideIcon
      :icon="terminating ? UserX : ListX"
      class="mt-px size-4 shrink-0"
      :class="terminating ? 'text-red-600' : 'text-amber-600'"
    />
    <div class="space-y-1">
      <p>
        <b class="font-semibold">{{ PENALTY_LEVEL_LABELS[preview.level] }}</b> ·
        {{ preview.effect }}
      </p>
      <p v-if="!preview.user.synced">
        该账号尚未同步到本站，将按 PSN 账号 ID
        预先写入处罚，不创建用户、不抓取奖杯。{{
          terminating
            ? '之后任何人发起的同步都会被拦截。'
            : '之后照常同步，但不会上榜。'
        }}
      </p>
    </div>
  </div>
  <dl
    class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 p-4 text-[13px] sm:grid-cols-4"
  >
    <div>
      <dt class="text-xs text-slate-500">PSN ID</dt>
      <dd class="mt-0.5 truncate font-medium text-slate-950">
        {{ preview.user.psnid }}
      </dd>
    </div>
    <div>
      <dt class="text-xs text-slate-500">Account ID</dt>
      <dd
        class="mt-0.5 truncate font-mono text-xs text-slate-700"
        :title="preview.user.account_id"
      >
        {{ preview.user.account_id }}
      </dd>
    </div>
    <div>
      <dt class="text-xs text-slate-500">用户 ID</dt>
      <dd class="mt-0.5 font-mono text-xs text-slate-700">
        {{ preview.user.id ?? '未同步' }}
      </dd>
    </div>
    <div>
      <dt class="text-xs text-slate-500">注册时间</dt>
      <dd class="mt-0.5 text-slate-700">
        {{
          preview.user.registered_at
            ? adminDate(preview.user.registered_at)
            : '未注册'
        }}
      </dd>
    </div>
  </dl>
  <p
    v-if="preview.already_applied"
    class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
  >
    <LucideIcon
      :icon="TriangleAlert"
      class="mt-px size-4 shrink-0 text-amber-600"
    />
    该账号已有生效中的{{ PENALTY_LEVEL_LABELS[preview.level] }}。再次提交会沿用原处罚{{
      terminating ? '，并重新执行数据清理' : ''
    }}。
  </p>
</template>
