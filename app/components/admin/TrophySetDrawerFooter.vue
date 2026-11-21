<script setup lang="ts">
import { ArrowRight, ExternalLink, RefreshCw, SquarePen } from 'lucide'
import type { AdminTrophySetDetail } from '~/types/admin'

/**
 * Bottom bar of the trophy-set drawer, always in reach: refresh from PSN (with
 * the option to re-fetch every translation) on the left, the editor on the right.
 */
defineProps<{
  detail: AdminTrophySetDetail
  busy: boolean
}>()
const localize = defineModel<boolean>('localize', { required: true })
defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="-mx-5 -my-3 flex flex-wrap items-center gap-x-3 gap-y-2 bg-slate-50 px-5 py-3">
    <button type="button" class="admin-button" :disabled="busy" title="重新拉取 PSN 当前的定义，换掉失效的图片地址；人工修改过的字段保留" @click="$emit('refresh')">
      <LucideIcon :icon="RefreshCw" class="size-3.5" :class="busy ? 'animate-spin' : ''" />{{ busy ? '正在刷新…' : '从 PSN 刷新' }}
    </button>
    <label class="flex items-center gap-1.5 text-xs text-slate-500" title="排队执行，约 30 次 PSN 请求">
      <input v-model="localize" type="checkbox" class="size-3.5 accent-slate-900" :disabled="busy" />
      同时抓取翻译
    </label>
    <a :href="`/trophies/${detail.id}`" target="_blank" rel="noopener" class="admin-link"><LucideIcon :icon="ExternalLink" class="size-3.5" />前台</a>
    <NuxtLink
      :to="`/admin/trophy-sets/${detail.id}`"
      class="group ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
    >
      <LucideIcon :icon="SquarePen" class="size-4" />编辑奖杯组
      <LucideIcon :icon="ArrowRight" class="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </NuxtLink>
  </div>
</template>
