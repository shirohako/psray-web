<script setup lang="ts">
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
    class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
  >
    <p>{{ error.message || '加载失败，请稍后重试。' }}</p>
    <p v-for="(item, i) in error.details" :key="i" class="mt-1">
      {{ item.field }}：{{ item.message }}
    </p>
    <button v-if="requestId" class="mt-2 underline" @click="copy">
      {{ copied ? '已复制' : '复制请求 ID' }}：{{ requestId }}
    </button>
  </div>
</template>
