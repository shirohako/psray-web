<script setup lang="ts">
import { MailCheck, RotateCcw } from 'lucide'

/** Step 5 — instructions to place the emailed code into the PSN profile + resend. */
defineProps<{ email: string, cooldown: number, sending: boolean }>()
defineEmits<{ resend: [] }>()

/** Three numbered instructions; the catalog holds one key per step. */
const guideKeys = [1, 2, 3].map(n => `auth.register.verify.step${n}`)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <LucideIcon :icon="MailCheck" class="mt-0.5 size-4.5 shrink-0" />
      <i18n-t keypath="auth.register.verify.sentTo" scope="global" tag="span">
        <template #email>
          <span class="font-semibold">{{ email.trim() }}</span>
        </template>
      </i18n-t>
    </div>

    <ol class="space-y-3">
      <li v-for="(key, i) in guideKeys" :key="key" class="flex items-start gap-3">
        <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
          {{ i + 1 }}
        </span>
        <span class="pt-0.5 text-sm leading-relaxed text-slate-600">{{ $t(key) }}</span>
      </li>
    </ol>

    <!-- The label stays "Resend" while sending; the spinning icon says it's on its way -->
    <AuthSendCodeButton
      :cooldown="cooldown"
      :sending="sending"
      :icon="RotateCcw"
      :label="$t('auth.register.verify.resend')"
      :sending-label="$t('auth.register.verify.resend')"
      class="font-medium text-slate-500 hover:text-slate-900"
      @send="$emit('resend')"
    />
  </div>
</template>
