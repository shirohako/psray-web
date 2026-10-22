<script setup lang="ts">
import { ChevronsUp, Copy, Check, WrapText } from 'lucide'
import type { LogLine, LogWindow } from '~/types/admin'
/**
 * The log window as a terminal-style pane: one tinted row per line (from
 * `adminLogLines`), with wrap and copy toggles. `older` asks for the window
 * before this one.
 */
const props = defineProps<{
  /** The log source and keyword, shown as the pane's title. */
  source: string
  q: string
  data: LogWindow | null
  lines: LogLine[]
  busy: boolean
}>()
defineEmits<{ older: [] }>()

const wrap = ref(false)
const copied = ref(false)
async function copyText() {
  try {
    await navigator.clipboard.writeText(props.data?.text || '')
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {}
}
</script>
<template>
  <section
    class="relative flex min-h-[28rem] flex-col overflow-hidden rounded-xl bg-[#0b0f17] ring-1 ring-slate-900/10 lg:h-[calc(100vh-13rem)]"
  >
    <div
      v-if="busy"
      class="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden"
    >
      <div class="animate-admin-progress h-full w-1/3 bg-emerald-400/80" />
    </div>
    <header
      class="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2"
    >
      <span class="flex min-w-0 items-center gap-2 font-mono text-xs text-slate-400">
        <span
          class="size-1.5 rounded-full"
          :class="busy ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'"
        />
        <span class="truncate"
          >{{ source }}<span v-if="q" class="text-slate-500">
            | grep “{{ q }}”</span
          ></span
        >
      </span>
      <div class="flex items-center gap-0.5 text-xs">
        <button
          class="inline-flex h-7 items-center gap-1.5 rounded px-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
          :disabled="busy || !data?.next_cursor"
          @click="$emit('older')"
        >
          <LucideIcon :icon="ChevronsUp" class="size-3.5" />更早
        </button>
        <button
          class="grid size-7 place-items-center rounded transition hover:bg-white/10 hover:text-white"
          :class="wrap ? 'text-white' : 'text-slate-400'"
          :aria-pressed="wrap"
          aria-label="自动换行"
          title="自动换行"
          @click="wrap = !wrap"
        >
          <LucideIcon :icon="WrapText" class="size-3.5" />
        </button>
        <button
          class="grid size-7 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white"
          :aria-label="copied ? '已复制' : '复制日志'"
          :title="copied ? '已复制' : '复制日志'"
          @click="copyText"
        >
          <LucideIcon :icon="copied ? Check : Copy" class="size-3.5" />
        </button>
      </div>
    </header>
    <p
      v-if="data?.rotated"
      class="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-200"
    >
      日志已轮转或截断，已返回新文件的最近内容。
    </p>
    <div
      class="min-h-0 flex-1 overflow-auto py-2 font-mono text-xs leading-5 transition-opacity"
      :class="busy && data ? 'opacity-40' : ''"
      :aria-busy="busy"
    >
      <div v-if="busy && !data" class="space-y-2.5 py-1.5">
        <div v-for="i in 14" :key="i" class="flex items-center gap-4 pr-4">
          <span class="w-12 shrink-0 pl-3 text-right text-slate-700">{{
            i
          }}</span>
          <span
            class="h-2 animate-pulse rounded-full bg-white/[0.06]"
            :style="{
              width: 25 + ((i * 37) % 60) + '%',
              animationDelay: i * 60 + 'ms',
            }"
          />
        </div>
      </div>
      <p
        v-else-if="!data && !busy"
        class="px-4 py-10 text-center text-slate-500"
      >
        选择日志源开始读取。
      </p>
      <p
        v-else-if="data && !data.available"
        class="px-4 py-10 text-center text-slate-500"
      >
        此日志文件不存在或当前不可读取。
      </p>
      <p
        v-else-if="data && !data.text"
        class="px-4 py-10 text-center text-slate-500"
      >
        此读取窗口没有匹配内容。
      </p>
      <template v-else>
        <div
          v-for="(line, index) in data?.available ? lines : []"
          :key="index"
          class="flex gap-4 pr-4 hover:bg-white/[0.03]"
          :class="{
            'bg-red-500/[0.07] shadow-[inset_2px_0_0_var(--color-red-500)]':
              line.level === 'error',
            'shadow-[inset_2px_0_0_var(--color-amber-400)]':
              line.level === 'warning',
          }"
        >
          <span
            class="w-12 shrink-0 select-none pl-3 text-right text-slate-600 tabular-nums"
            >{{ index + 1 }}</span
          >
          <span
            :class="[
              wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
              line.level === 'error'
                ? 'text-red-300'
                : line.level === 'warning'
                  ? 'text-amber-200'
                  : line.level === 'trace'
                    ? 'text-slate-500'
                    : 'text-slate-300',
            ]"
            ><span class="text-sky-300/70">{{ line.stamp }}</span
            >{{ line.text }}</span
          >
        </div>
      </template>
    </div>
  </section>
</template>
