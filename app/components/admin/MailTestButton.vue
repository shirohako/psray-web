<script setup lang="ts">
import { CircleCheck, CircleX, Send } from 'lucide'
/**
 * "发送测试邮件" on the mail settings panel: sends one mail right away (no
 * queue) with the saved settings and shows the mailer's own error, if any.
 * `unsaved` warns that edits still in the form are not what gets tested.
 */
defineProps<{ unsaved?: boolean }>()
const open = ref(false)
</script>
<template>
  <button type="button" class="admin-button" @click="open = true">
    <LucideIcon :icon="Send" class="size-3.5" />发送测试邮件
  </button>
  <AdminMailTestDialog
    v-model:open="open"
    title="发送测试邮件"
    endpoint="/mail/test"
    form-id="admin-mail-test"
    locale-label="邮件语言"
    placeholder="you@example.com"
  >
    <p class="text-[13px] leading-relaxed text-slate-600">
      用<b class="font-medium text-slate-800">已保存</b>的发信设置当场发一封测试邮件（不经队列），发信服务器的报错会原样显示在这里，也会记进邮件记录。
    </p>
    <p
      v-if="unsaved"
      class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
    >
      设置里还有未保存的修改，测试用的是修改前的值。
    </p>
    <template #result="{ result, email }">
      <LucideIcon
        :icon="result.ok ? CircleCheck : CircleX"
        class="mt-px size-4 shrink-0"
        :class="result.ok ? 'text-emerald-600' : 'text-red-600'"
      />
      <div class="min-w-0 space-y-1">
        <p v-if="result.ok">发信服务器已接收，请到 {{ email }} 查收（也看看垃圾邮件箱）。</p>
        <p v-else>发送失败，没有发出去。</p>
        <p class="text-xs opacity-80">发信方式：{{ result.mailer }} · 邮件记录 #{{ result.mail_log_id }}</p>
        <pre
          v-if="result.error"
          class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-white/70 p-2 font-mono text-[11px] text-red-800"
        >{{ result.error }}</pre>
      </div>
    </template>
  </AdminMailTestDialog>
</template>
