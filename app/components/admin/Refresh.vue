<script setup lang="ts">
import { RefreshCw } from 'lucide'
/** Manual refresh; `live` also advertises the 15 s background poll. */
defineProps<{ busy?: boolean; live?: boolean }>()
defineEmits<{ click: [] }>()
</script>
<template>
  <div class="inline-flex items-center gap-2">
    <span
      v-if="live"
      class="inline-flex items-center gap-1.5 text-xs text-slate-500"
      title="页面可见时每 15 秒自动刷新"
    >
      <span class="relative flex size-2">
        <span
          class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden"
        />
        <span class="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      实时
    </span>
    <button
      class="admin-button w-8 px-0"
      :disabled="busy"
      aria-label="刷新"
      title="刷新"
      @click="$emit('click')"
    >
      <LucideIcon
        :icon="RefreshCw"
        class="size-3.5"
        :class="busy ? 'animate-spin' : ''"
      />
    </button>
  </div>
</template>
