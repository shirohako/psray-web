<script setup lang="ts">
import { Lightbulb, ThumbsDown, ThumbsUp } from 'lucide'
import {
  adminDate,
  TIP_LANGUAGE_LABELS,
  TIP_LANGUAGE_OPTIONS,
  TIP_SORT_OPTIONS,
  TIP_SPOILER_OPTIONS,
  type AdminFilter,
} from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'author', label: '作者' },
  { key: 'trophy', label: '奖杯' },
  { key: 'content', label: '内容' },
  { key: 'language', label: '语言' },
  { key: 'votes', label: '评价' },
  { key: 'created_at', label: '发布时间' },
]
const filters: AdminFilter[] = [
  { key: 'q', label: '搜索正文' },
  { key: 'psnid', label: '作者 PSN ID' },
  { key: 'trophy_set_id', label: '奖杯组 ID' },
  { key: 'trophy_id', label: '奖杯 ID' },
  { key: 'language', label: '语言', options: TIP_LANGUAGE_OPTIONS },
  { key: 'has_spoiler', label: '剧透', options: TIP_SPOILER_OPTIONS },
  { key: 'sort', label: '排序', options: TIP_SORT_OPTIONS },
  { key: 'from', label: '开始时间', type: 'datetime-local' },
  { key: 'to', label: '结束时间', type: 'datetime-local' },
]
// Rendered by the panel itself; the generic field list below it keeps the rest.
const detailOmit = ['content', 'content_type', 'user', 'trophy', 'trophy_set', 'psnid', 'avatar_url', 'language', 'has_spoiler', 'missable']
</script>
<template>
  <AdminCollection
    :icon="Lightbulb"
    title="奖杯 Tip"
    description="玩家在奖杯下发布的攻略（前台叫「留言」），每人每个奖杯一条。可以修改正文、语言和标记，或者删除；都不会通知作者。删除会同步扣减作者和奖杯的计数。"
    endpoint="/tips"
    detail-base="/tips"
    :columns="columns"
    :filters="filters"
    :detail-omit="detailOmit"
    ><template #cell-author="{ row }"
      ><span v-if="row.psnid" class="flex max-w-40 items-center gap-2"
        ><img v-if="row.avatar_url" :src="row.avatar_url" alt="" class="size-5 shrink-0 rounded-full bg-slate-100 object-cover" loading="lazy" /><span
          class="truncate font-medium text-slate-900"
          >{{ row.psnid }}</span
        ></span
      ><span v-else class="whitespace-nowrap text-slate-400">#{{ row.user_id }}（已不存在）</span></template
    ><template #cell-trophy="{ row }"
      ><span v-if="row.trophy" class="flex min-w-44 max-w-64 items-center gap-2"
        ><img :src="row.trophy.icon_url" alt="" class="size-7 shrink-0 rounded bg-slate-100 object-cover" loading="lazy" /><span class="min-w-0"
          ><span class="block truncate font-medium text-slate-900">{{ row.trophy.name }}</span
          ><span class="block truncate text-[11px] text-slate-400">{{ row.trophy_set?.name ?? '—' }}</span></span
        ></span
      ><span v-else class="whitespace-nowrap text-slate-400">#{{ row.trophy_id }}（奖杯已不存在）</span></template
    ><template #cell-content="{ row }"
      ><span class="line-clamp-2 min-w-48 max-w-md break-words text-slate-700" :title="row.content"
        ><span v-if="row.has_spoiler" class="mr-1 rounded bg-violet-50 px-1 text-[10px] font-semibold text-violet-700">剧透</span
        >{{ tipExcerpt(row.content, 120) }}</span
      ></template
    ><template #cell-language="{ row }"
      ><span class="whitespace-nowrap text-slate-600">{{ TIP_LANGUAGE_LABELS[row.language] ?? row.language }}</span></template
    ><template #cell-votes="{ row }"
      ><span class="flex items-center gap-2.5 whitespace-nowrap tabular-nums text-slate-600"
        ><span class="inline-flex items-center gap-1"><LucideIcon :icon="ThumbsUp" class="size-3 text-slate-400" />{{ row.vote_up_count }}</span
        ><span class="inline-flex items-center gap-1" :class="row.vote_down_count ? 'text-rose-600' : ''"
          ><LucideIcon :icon="ThumbsDown" class="size-3 text-slate-400" />{{ row.vote_down_count }}</span
        ></span
      ></template
    ><template #cell-created_at="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600" :title="row.updated_at !== row.created_at ? `修改于 ${adminDate(row.updated_at)}` : undefined"
        >{{ adminDate(row.created_at) }}<span v-if="row.updated_at !== row.created_at" class="ml-1 text-[10px] text-slate-400">已修改</span></span
      ></template
    ><template #detail-actions="{ detail, refresh, reload, close }"
      ><AdminTipPanel :detail="detail" :refresh="refresh" :reload="reload" :close="close" /></template
  ></AdminCollection>
</template>
