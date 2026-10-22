<script setup lang="ts">
import { BadgeCheck, Fingerprint } from 'lucide'
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div class="space-y-6">
      <SettingsHero :icon="Fingerprint" eyebrow="Security center" :title="$t('settings.security.heading')" :description="$t('settings.security.subheading')">
        <div class="grid grid-cols-2 gap-2 sm:min-w-48">
          <div class="rounded-lg bg-white/8 p-3 ring-1 ring-white/10">
            <p class="truncate text-[11px] font-medium text-stone-400">{{ $t('settings.security.status.email') }}</p>
            <p class="mt-1 flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-emerald-300">
              <LucideIcon :icon="BadgeCheck" class="size-4 shrink-0" />
              {{ $t('settings.security.status.bound') }}
            </p>
          </div>
          <div class="rounded-lg bg-white/8 p-3 ring-1 ring-white/10">
            <p class="truncate text-[11px] font-medium text-stone-400">{{ $t('settings.security.status.password') }}</p>
            <p class="mt-1 flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-emerald-300">
              <LucideIcon :icon="BadgeCheck" class="size-4 shrink-0" />
              {{ $t('settings.security.status.set') }}
            </p>
          </div>
        </div>
      </SettingsHero>

      <SettingsChangeEmail />
      <SettingsChangePassword />
    </div>
  </section>
</template>
