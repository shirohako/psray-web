<script setup lang="ts">
import { Activity, CircleAlert, Globe, RefreshCw } from 'lucide'
import { adminDate, adminDuration, adminPsnTotals } from '~/utils/admin'
import type { AdminPsnBridge } from '~/types/admin'
/**
 * The bridge's own state beside the accounts (`/admin/psn`): running or not, the
 * configuration it loaded, PSN reachability, what it has handled since it
 * started, waiting calls and the per-host circuit breakers.
 */
const props = defineProps<{ bridge: AdminPsnBridge; reloading: boolean }>()
defineEmits<{ reload: [] }>()

const totals = computed(() => adminPsnTotals(props.bridge.counters))
const waiting = computed(() => Object.values(props.bridge.waiting ?? {}).reduce((a, b) => a + b, 0))
const openBreakers = computed(() =>
  Object.entries(props.bridge.breakers ?? {}).filter(([, b]) => b.state !== 'closed'),
)
const TAG = 'inline-flex items-center gap-1 rounded px-1.5 py-px text-[11px] font-medium ring-1 ring-inset'
const GOOD = 'bg-emerald-50 text-emerald-700 ring-emerald-200'
const BAD = 'bg-red-50 text-red-700 ring-red-200'
const WARN = 'bg-amber-50 text-amber-700 ring-amber-200'
const MUTED = 'bg-slate-100 text-slate-600 ring-slate-200'
</script>
<template>
  <section class="admin-panel">
    <header class="admin-panel-head"><h2 class="admin-panel-title">bridge 状态</h2></header>
    <div v-if="!bridge.reachable" class="space-y-3 p-4">
      <span :class="[TAG, BAD]"><LucideIcon :icon="CircleAlert" class="size-3" />连不上 bridge</span>
      <p class="text-xs leading-relaxed text-slate-500">{{ bridge.error }}</p>
      <p class="text-xs leading-relaxed text-slate-500">
        账号显示的是上一次的快照。在服务器上看 <code class="font-mono">systemctl status playstation-bridge</code>。
      </p>
    </div>
    <div v-else class="space-y-4 p-4">
      <div class="flex flex-wrap gap-1.5">
        <span :class="[TAG, GOOD]"><LucideIcon :icon="Activity" class="size-3" />在运行</span>
        <span v-if="bridge.version" :class="[TAG, MUTED]">v{{ bridge.version }}</span>
        <span :class="[TAG, bridge.ready ? GOOD : BAD]">{{ bridge.ready ? '有可用账号' : '没有可用账号' }}</span>
        <span :class="[TAG, bridge.upstream_healthy ? MUTED : BAD]"><LucideIcon :icon="Globe" class="size-3" />{{ bridge.upstream_healthy ? 'PSN 正常' : 'PSN 已熔断' }}</span>
        <span :class="[TAG, bridge.config?.in_sync ? MUTED : WARN]" :title="bridge.config?.in_sync ? undefined : '有一次重新加载没送到，点下面的按钮补上'">
          {{ bridge.config?.in_sync ? '配置已同步' : '配置不是最新' }}
        </span>
      </div>
      <p v-if="bridge.config?.last_error" class="text-xs text-red-700">读取配置失败：{{ bridge.config.last_error }}</p>
      <dl class="grid grid-cols-3 gap-3">
        <div>
          <dt class="text-[11px] text-slate-400">请求</dt>
          <dd class="text-base font-semibold tabular-nums text-slate-900">{{ totals.requests.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="text-[11px] text-slate-400">失败（429 / 5xx）</dt>
          <dd class="text-base font-semibold tabular-nums" :class="totals.failed ? 'text-amber-700' : 'text-slate-900'">{{ totals.failed.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="text-[11px] text-slate-400">限流拒绝</dt>
          <dd class="text-base font-semibold tabular-nums text-slate-900">{{ totals.rateLimited.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="text-[11px] text-slate-400">排队中</dt>
          <dd class="text-base font-semibold tabular-nums text-slate-900">{{ waiting }}</dd>
        </div>
        <div class="col-span-2">
          <dt class="text-[11px] text-slate-400">熔断</dt>
          <dd class="text-sm font-semibold" :class="openBreakers.length ? 'text-red-700' : 'text-emerald-700'">
            {{ openBreakers.length ? openBreakers.map(([host]) => host).join('、') : '无' }}
          </dd>
        </div>
      </dl>
      <p class="text-[11px] leading-relaxed text-slate-400">
        计数从 {{ adminDate(bridge.started_at) }} 启动时算起（已运行 {{ adminDuration((bridge.uptime_seconds ?? 0) * 1000) }}）。
      </p>
      <button type="button" class="admin-button w-full" :disabled="reloading" @click="$emit('reload')">
        <LucideIcon :icon="RefreshCw" class="size-3.5" :class="reloading ? 'animate-spin' : ''" />通知 bridge 重新加载
      </button>
    </div>
  </section>
</template>
