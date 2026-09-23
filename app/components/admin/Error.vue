<script setup lang="ts">
import { CircleAlert } from 'lucide'
const props = defineProps<{ error: any }>()
const copied = ref(false)
const requestId = computed(
  () => props.error?.requestId ?? props.error?.request_id,
)
async function copy() {
  try {
    await navigator.clipboard.writeText(requestId.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>
<template>
  <div
    v-if="error"
    role="alert"
    class="flex items-start gap-3 rounded-lg border border-red-200 bg-white p-3 text-[13px] shadow-[inset_3px_0_0_var(--color-red-500)]"
  >
    <LucideIcon :icon="CircleAlert" class="mt-px size-4 shrink-0 text-red-500" />
    <div class="min-w-0 flex-1">
      <p class="font-medium text-slate-900">
        {{ error.message || '加载失败，请稍后重试。' }}
      </p>
      <p v-for="(item, i) in error.details" :key="i" class="mt-0.5 text-slate-600">
        <span class="font-mono text-xs">{{ item.field }}</span> · {{ item.message }}
      </p>
    </div>
    <button
      v-if="requestId"
      class="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      :title="copied ? '已复制' : '复制请求 ID'"
      @click="copy"
    >
      {{ copied ? '已复制' : requestId }}
    </button>
  </div>
</template>
