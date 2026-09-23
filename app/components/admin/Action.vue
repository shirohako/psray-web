<script setup lang="ts">
const props = defineProps<{
  path: string
  label: string
  description: string
  danger?: boolean
}>()
const emit = defineEmits<{ done: [value: any] }>()
const api = useAdminApi()
const open = ref(false),
  reason = ref(''),
  busy = ref(false),
  error = ref<any>(null)
let key = ''
watch(reason, () => {
  if (!busy.value) key = crypto.randomUUID()
})
function start() {
  reason.value = ''
  error.value = null
  key = crypto.randomUUID()
  open.value = true
}
async function submit() {
  busy.value = true
  error.value = null
  try {
    const result = await api.write(
      props.path,
      { reason: reason.value },
      'post',
      key,
    )
    open.value = false
    emit('done', result)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <button
    class="admin-button"
    :class="danger ? 'admin-danger' : 'admin-primary'"
    @click="start"
  >
    {{ label }}</button
  ><Dialog v-model:open="open" :title="label" size="md"
    ><form class="space-y-4 p-5" @submit.prevent="submit">
      <p class="text-[13px] leading-relaxed text-slate-600">
        {{ description }}
      </p>
      <AdminError :error="error" />
      <div>
        <div class="mb-1.5 flex items-baseline justify-between">
          <label for="admin-action-reason" class="text-xs font-medium text-slate-700"
            >操作理由</label
          >
          <span class="text-[11px] text-slate-400">写入审计记录 · 最多 255 字节</span>
        </div>
        <textarea
          id="admin-action-reason"
          v-model="reason"
          :disabled="busy"
          required
          maxlength="255"
          placeholder="说明执行此操作的原因"
          class="admin-input"
        />
      </div>
      <div class="-mx-5 -mb-5 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
        <button type="button" class="admin-button" @click="open = false">
          取消
        </button>
        <button
          :disabled="busy || !reason.trim()"
          class="admin-button"
          :class="danger ? 'admin-danger' : 'admin-primary'"
        >
          {{ busy ? '正在提交…' : '确认执行' }}
        </button>
      </div>
    </form></Dialog
  >
</template>
