<script setup lang="ts">
import { ExternalLink, FileSearch, RotateCw } from 'lucide'
import { adminDate, adminDuration, BAN_EVIDENCE_MAX } from '~/utils/admin'
import type { BanPreview } from '~/types/admin'
/**
 * Evidence to keep with a penalty: trophy sets typed as IDs or trophy page
 * links (the v-model text), which only count once a dry run has previewed
 * them (`load`). The owner parses the text and tracks `stale` (it no longer
 * matches the preview), since both also block submitting.
 */
const text = defineModel<string>({ required: true })
const props = defineProps<{
  preview: BanPreview
  parsed: { ids: number[]; invalid: string[] }
  stale: boolean
  error: any
  loading: boolean
  busy: boolean
}>()
defineEmits<{ load: [ids: number[]] }>()
const tooMany = computed(() => props.parsed.ids.length > BAN_EVIDENCE_MAX)
const terminating = computed(() => props.preview.level === 'termination')
</script>
<template>
  <section>
    <h3
      class="mb-1 flex items-center gap-2 text-[13px] font-semibold text-slate-900"
    >
      <LucideIcon
        :icon="FileSearch"
        class="size-4 text-slate-400"
      />保留作弊证据
      <span class="font-normal text-slate-400">可选</span>
    </h3>
    <p class="mb-2 text-xs text-slate-500">
      {{ terminating ? '删除前' : '' }}保存该用户在这些奖杯组的游玩记录（进度汇总与每个奖杯的获得时间）。填写奖杯组
      ID 或奖杯页链接，最多 {{ BAN_EVIDENCE_MAX }} 个。
    </p>
    <div class="flex gap-2">
      <input
        v-model="text"
        class="admin-input font-mono"
        placeholder="例如 7, 8 或 https://…/trophies/7"
        :disabled="busy"
        @keydown.enter.prevent="
          !tooMany && !parsed.invalid.length && $emit('load', parsed.ids)
        "
      />
      <button
        type="button"
        class="admin-button shrink-0"
        :class="stale ? 'admin-primary' : ''"
        :disabled="
          loading || busy || tooMany || !!parsed.invalid.length
        "
        @click="$emit('load', parsed.ids)"
      >
        <LucideIcon
          :icon="RotateCw"
          class="size-3.5"
          :class="loading ? 'animate-spin' : ''"
        />预览证据
      </button>
    </div>
    <p v-if="parsed.invalid.length" class="mt-1.5 text-xs text-red-600">
      无法识别：<span class="font-mono">{{
        parsed.invalid.join('、')
      }}</span>
    </p>
    <p v-else-if="tooMany" class="mt-1.5 text-xs text-red-600">
      最多 {{ BAN_EVIDENCE_MAX }} 个奖杯组，当前
      {{ parsed.ids.length }} 个。
    </p>
    <p v-else-if="stale" class="mt-1.5 text-xs text-amber-700">
      证据奖杯组已修改，预览后才会生效。
    </p>
    <AdminError
      v-if="error"
      :error="error"
      class="mt-2"
    />
    <ul
      v-if="preview.evidence.items.length"
      class="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200"
    >
      <li
        v-for="item in preview.evidence.items"
        :key="item.type + item.trophy_set_id"
        class="px-3 py-2.5 text-[13px]"
      >
        <div class="flex items-center justify-between gap-3">
          <a
            :href="`/trophies/${item.trophy_set_id}`"
            target="_blank"
            rel="noopener"
            class="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-900 hover:underline"
            ><span class="truncate">{{ item.trophy_set_name }}</span
            ><LucideIcon
              :icon="ExternalLink"
              class="size-3 shrink-0 text-slate-400"
          /></a>
          <span class="shrink-0 font-mono text-[11px] text-slate-400"
            >#{{ item.trophy_set_id }}
            <template v-if="item.platform"
              >· {{ item.platform }}</template
            ></span
          >
        </div>
        <p class="mt-1 text-xs text-slate-500">
          <template v-if="item.summary?.earned"
            >进度 {{ item.summary.progress }}% · 白金
            {{ item.summary.earned.platinum }} / 金
            {{ item.summary.earned.gold }} / 银
            {{ item.summary.earned.silver }} / 铜
            {{ item.summary.earned.bronze }} · 用时
            {{ adminDuration(item.summary.duration_seconds * 1000) }} ·
            {{ adminDate(item.summary.first_earned_at) }} →
            {{ adminDate(item.summary.last_earned_at) }} · </template
          >{{ item.trophies.length }} 个奖杯的获得时间
        </p>
      </li>
    </ul>
    <p
      v-if="preview.evidence.skipped.length"
      class="mt-2 text-xs text-slate-500"
    >
      以下奖杯组不存在或该用户没有获得记录，将被忽略：<span
        class="font-mono"
        >{{ preview.evidence.skipped.join('、') }}</span
      >
    </p>
  </section>
</template>
