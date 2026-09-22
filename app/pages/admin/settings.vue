<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const form = reactive({
  auto_sync_enabled: false,
  sync_min_level: 0,
  reason: '',
})
const changes = ref<any[]>([]),
  loading = ref(true),
  saving = ref(false),
  error = ref<any>(null),
  saved = ref(false),
  confirm = ref(false)
let key = ''
async function load() {
  try {
    const data = await api.get('/settings')
    Object.assign(form, data.values)
    changes.value = data.changes.map((row: any) => ({
      ...row,
      before:
        typeof row.before === 'string' ? JSON.parse(row.before) : row.before,
      after: typeof row.after === 'string' ? JSON.parse(row.after) : row.after,
    }))
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}
function review() {
  key = crypto.randomUUID()
  confirm.value = true
  saved.value = false
}
async function save() {
  saving.value = true
  error.value = null
  try {
    await api.write('/settings', { ...form }, 'patch', key)
    confirm.value = false
    await load()
    form.reason = ''
    saved.value = true
  } catch (e) {
    error.value = e
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>
<template>
  <div>
    <h1 class="text-2xl font-bold">系统设置</h1>
    <p class="mt-2 text-sm text-slate-500">
      只展示已接入业务逻辑的设置。修改将在后续业务请求或调度时生效。
    </p>
  </div>
  <AdminError :error="error" />
  <p
    v-if="saved"
    role="status"
    class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700"
  >
    设置已保存，变更已记入审计。
  </p>
  <form class="admin-card max-w-3xl space-y-6" @submit.prevent="review">
    <label class="flex items-start gap-3"
      ><input
        v-model="form.auto_sync_enabled"
        type="checkbox"
        class="mt-1 size-4 accent-indigo-600"
        :disabled="loading"
      /><span
        ><span class="text-sm font-semibold">开启自动同步</span
        ><span class="mt-1 block text-sm text-slate-500"
          >控制到期用户的后续派发，关闭后不会取消已经入队的任务。</span
        ></span
      ></label
    ><label class="block text-sm font-semibold"
      >同步最低奖杯等级<input
        v-model.number="form.sync_min_level"
        type="number"
        min="0"
        max="9999"
        required
        class="admin-input mt-2 max-w-xs"
        :disabled="loading"
      /><span class="mt-2 block text-sm font-normal text-slate-500"
        >用于现有同步请求的等级门槛。</span
      ></label
    ><label class="block text-sm font-semibold"
      >变更理由<textarea
        v-model="form.reason"
        required
        class="admin-input mt-2"
      /></label
    ><button
      class="admin-button admin-primary"
      :disabled="loading || saving || !form.reason.trim()"
    >
      检查并保存
    </button>
  </form>
  <section class="admin-card">
    <h2 class="mb-4 font-semibold">最近设置变更</h2>
    <AdminDataView :value="changes" />
  </section>
  <Dialog v-model:open="confirm" title="确认设置变更" size="md"
    ><div class="space-y-4 p-5">
      <AdminError :error="error" /><AdminDataView :value="form" /><button
        class="admin-button admin-primary"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? '保存中…' : '确认保存' }}
      </button>
    </div></Dialog
  >
</template>
