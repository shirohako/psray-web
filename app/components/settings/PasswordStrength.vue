<script setup lang="ts">
import type { PasswordStrengthLevel } from '~/utils/password'

/** Four-bar strength meter for a new password, with a tip on what makes one strong. */
const props = defineProps<{ password: string }>()

// Filled bars, and the level's name, take the level's colour.
const COLORS: Record<PasswordStrengthLevel, { bar: string, text: string }> = {
  empty: { bar: 'bg-slate-200', text: 'text-slate-400' },
  weak: { bar: 'bg-rose-400', text: 'text-rose-500' },
  fair: { bar: 'bg-amber-400', text: 'text-amber-500' },
  good: { bar: 'bg-sky-500', text: 'text-sky-600' },
  strong: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
}

const strength = computed(() => passwordStrength(props.password))
const colors = computed(() => COLORS[strength.value.level])
</script>

<template>
  <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="text-xs font-medium text-slate-500">{{ $t('settings.security.strength.label') }}</span>
      <span class="text-xs font-semibold sm:hidden" :class="colors.text">{{ $t(`settings.security.strength.${strength.level}`) }}</span>
    </div>
    <div class="grid grid-cols-4 gap-1.5">
      <span
        v-for="step in 4"
        :key="step"
        class="h-1.5 rounded-full transition"
        :class="step <= strength.score ? colors.bar : 'bg-slate-200'"
      />
    </div>
    <p class="mt-2 text-xs leading-relaxed text-slate-400">{{ $t('settings.security.strength.tip') }}</p>
  </div>
</template>
