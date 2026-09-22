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
    :class="danger ? 'admin-danger' : ''"
    @click="start"
  >
    {{ label }}</button
  ><Dialog v-model:open="open" :title="label" size="md"
    ><form class="space-y-4 p-5" @submit.prevent="submit">
      <p class="text-sm text-slate-600">{{ description }}</p>
      <AdminError :error="error" /><label class="block text-sm"
        >操作理由<textarea
          v-model="reason"
          :disabled="busy"
          required
          maxlength="255"
          class="admin-input mt-2"
        />
      </label>
      <p class="text-xs text-slate-500">理由按 UTF-8 最多 255 字节。</p>
      <button
        :disabled="busy || !reason.trim()"
        class="admin-button admin-primary"
      >
        {{ busy ? '正在提交…' : '确认执行' }}
      </button>
    </form></Dialog
  >
</template>
