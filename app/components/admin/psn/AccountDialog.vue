<script setup lang="ts">
import type { AdminPsnAccount, AdminPsnSaved } from '~/types/admin'
/**
 * Add a PSN account, or replace an account's npsso (`account` given). After
 * saving, the bridge signs in with it straight away; the answer says whether
 * Sony accepted it, and the dialog stays open on a rejection so the admin can
 * paste another one. The npsso never comes back from the API.
 */
const props = defineProps<{ account: AdminPsnAccount | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [result: AdminPsnSaved] }>()
const api = useAdminApi()

const label = ref(''),
  npsso = ref(''),
  busy = ref(false),
  error = ref<any>(null),
  rejected = ref(false)
let key = crypto.randomUUID()
watch(open, (isOpen) => {
  if (!isOpen) return
  label.value = ''
  npsso.value = ''
  error.value = null
  rejected.value = false
  key = crypto.randomUUID()
})
watch([label, npsso], () => {
  if (!busy.value) key = crypto.randomUUID()
})

async function submit() {
  if (busy.value || !npsso.value.trim() || (!props.account && !label.value.trim())) return
  busy.value = true
  error.value = null
  rejected.value = false
  try {
    const result = props.account
      ? await api.write<AdminPsnSaved>(`/psn/accounts/${props.account.id}`, { npsso: npsso.value.trim() }, 'patch', key)
      : await api.write<AdminPsnSaved>('/psn/accounts', { label: label.value.trim(), npsso: npsso.value.trim() }, 'post', key)
    emit('saved', result)
    // Saved either way; keep the dialog open only when Sony said no, to try another.
    if (result.account.npsso_valid === false) {
      rejected.value = true
      npsso.value = ''
    } else {
      open.value = false
    }
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <Dialog v-model:open="open" size="lg">
    <template #title>{{ account ? `更换 npsso：${account.label}` : '添加 PSN 账号' }}</template>
    <form class="space-y-4" @submit.prevent="submit">
      <p class="text-xs leading-relaxed text-slate-500">
        用这个 PSN 账号登录 playstation.com，再打开
        <span class="font-mono">https://ca.account.sony.com/api/v1/ssocookie</span>，把页面内容整段粘贴进来即可。
      </p>
      <label v-if="!account" class="block space-y-1.5">
        <span class="text-[13px] font-medium text-slate-900">名称</span>
        <input v-model="label" class="admin-input" maxlength="64" placeholder="如 backup" autocomplete="off" />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[13px] font-medium text-slate-900">npsso</span>
        <input
          v-model="npsso"
          type="password"
          class="admin-input font-mono"
          placeholder='{"npsso":"…"} 或 64 位 npsso'
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <p class="text-[11px] leading-relaxed text-slate-400">
        保存后 bridge 立刻用它登录，这里会显示 Sony 是否接受。npsso 只保存在服务器上（加密），之后只显示指纹。
        <template v-if="account">该账号仍然有效的旧会话在失效前照常使用。</template>
      </p>
      <p v-if="rejected" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        已保存，但 Sony 拒绝了这个 npsso。请确认复制的是这个 PSN 账号刚登录后的值，再粘贴一次。
      </p>
      <AdminError :error="error" />
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="open = false">{{ rejected ? '关闭' : '取消' }}</button>
        <button class="admin-button admin-primary" :disabled="busy || !npsso.trim() || (!account && !label.trim())">
          {{ busy ? '正在登录…' : '保存并登录' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
