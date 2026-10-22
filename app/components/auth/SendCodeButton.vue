<script setup lang="ts">
import { Loader2, Send, type IconNode } from 'lucide'

/**
 * Sends a verification code, then counts down until another may go out: the
 * icon spins while the request is in flight, and the label shows the seconds
 * left. Off while sending or cooling down; each form gives it its own look
 * with `class`.
 */
const props = withDefaults(defineProps<{
  /** Seconds until another code may be sent; 0 once it may. */
  cooldown: number
  sending: boolean
  /** Off for another reason too, e.g. no address entered yet. */
  disabled?: boolean
  icon?: IconNode
  /** Defaults to "Send code". */
  label?: string
  /** Defaults to "Sending…". */
  sendingLabel?: string
}>(), { icon: () => Send })

defineEmits<{ send: [] }>()

const { t } = useI18n()
const text = computed(() => {
  if (props.cooldown > 0) return t('auth.register.cta.resendIn', { seconds: props.cooldown })
  if (props.sending) return props.sendingLabel ?? t('auth.register.cta.sending')
  return props.label ?? t('auth.register.cta.sendCode')
})
</script>

<template>
  <button
    type="button"
    :disabled="disabled || cooldown > 0 || sending"
    class="inline-flex items-center gap-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
    @click="$emit('send')"
  >
    <LucideIcon :icon="sending ? Loader2 : icon" class="size-4" :class="sending && 'animate-spin'" />
    {{ text }}
  </button>
</template>
