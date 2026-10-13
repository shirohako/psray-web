<script setup lang="ts">
import { LockKeyhole, RefreshCw } from 'lucide'

/**
 * Takes the trophy area's place on a private profile (`is_profile_public`
 * false): a frosted glimpse of the list that is hidden, why it is hidden, and
 * how the owner can bring it back. The page around it still shows the basic
 * profile and the player's comments.
 */
defineProps<{ psnid: string }>()

const STEPS = ['settings', 'trophies', 'sync'] as const

// The frosted preview: a few game rows, blurred past reading.
const PREVIEW = [
  { title: 'w-2/5', progress: 'w-[72%]', done: false },
  { title: 'w-1/3', progress: 'w-full', done: true },
  { title: 'w-1/2', progress: 'w-[38%]', done: false },
]
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="relative h-48 overflow-hidden border-b border-slate-100 bg-slate-50/60" aria-hidden="true">
      <div class="space-y-5 px-5 py-6 blur-[3px] select-none sm:px-6">
        <div v-for="(row, i) in PREVIEW" :key="i" class="flex items-center gap-4">
          <div class="h-12 w-20 shrink-0 rounded-lg bg-linear-to-br from-slate-300 to-slate-200" />
          <div class="min-w-0 flex-1 space-y-2.5">
            <div class="h-3 rounded bg-slate-300" :class="row.title" />
            <div class="flex items-center gap-2">
              <span v-for="kind in trophyKinds" :key="kind.key" class="size-2 rounded-full" :class="kind.dot" />
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full" :class="[row.progress, row.done ? 'bg-cyan-400' : 'bg-slate-700']" />
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-0 bg-linear-to-b from-white/20 via-white/50 to-white" />
      <div class="absolute inset-0 grid place-items-center">
        <span class="animate-rise grid size-14 place-items-center rounded-2xl bg-white text-slate-700 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
          <LucideIcon :icon="LockKeyhole" class="size-6" stroke-width="1.75" />
        </span>
      </div>
    </div>

    <div class="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
      <div class="text-center">
        <h2 class="text-base font-semibold text-slate-900">{{ $t('profile.private.panelTitle') }}</h2>
        <p class="mx-auto mt-1.5 max-w-md text-sm leading-6 text-pretty text-slate-500">
          {{ $t('profile.private.panelDescription') }}
        </p>
      </div>

      <div class="mx-auto mt-6 max-w-md rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <h3 class="text-xs font-semibold text-slate-500">{{ $t('profile.private.howTo') }}</h3>
        <ol class="mt-3 space-y-3">
          <li v-for="(step, i) in STEPS" :key="step" class="flex items-start gap-3">
            <span class="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">{{ i + 1 }}</span>
            <span class="pt-0.5 text-sm leading-5 text-slate-600">{{ $t(`profile.private.steps.${step}`) }}</span>
          </li>
        </ol>
      </div>

      <div class="mt-5 flex justify-center">
        <NuxtLink
          :to="{ path: '/sync', query: { psnid } }"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-700 active:scale-[0.98]"
        >
          <LucideIcon :icon="RefreshCw" class="size-4" />
          {{ $t('profile.private.resync') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
