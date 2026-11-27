<script setup lang="ts">
import { ArrowUpRight, Check, Copy, Gamepad2 } from 'lucide'
import type { AccountPlatform, ProfileAccount } from '~/services/profile'

/**
 * Showcase: the owner's accounts on other platforms. Game accounts get a row
 * each, since people read a friend code or gamertag off them: the friend code
 * and gamertag copy on click, Steam opens the profile. Social accounts are a
 * strip of brand icons linking out, the handle in a tooltip.
 */
const props = defineProps<{ accounts: ProfileAccount[] }>()
const { t } = useI18n()
const toast = useToast()

const games = computed(() => props.accounts.filter(account => ACCOUNT_META[account.platform].game))
const social = computed(() => props.accounts.filter(account => !ACCOUNT_META[account.platform].game && account.url))

// A copied row confirms in place for a moment instead of raising a toast.
const copied = ref<AccountPlatform | null>(null)
let resetCopied: ReturnType<typeof setTimeout> | undefined
async function copy(account: ProfileAccount) {
  try {
    await navigator.clipboard.writeText(accountLabel(account))
    copied.value = account.platform
    clearTimeout(resetCopied)
    resetCopied = setTimeout(() => { copied.value = null }, 2000)
  }
  catch {
    toast.error({ title: t('toast.copyFailed.title'), description: t('toast.copyFailed.description') })
  }
}
onBeforeUnmount(() => clearTimeout(resetCopied))

const rowClass = 'group flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 py-2.5 pl-3 pr-2 text-left transition hover:border-slate-200 hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600'
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="Gamepad2" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.accounts.title') }}
      </h2>
    </header>

    <div class="space-y-4 p-4 sm:px-5">
      <ul v-if="games.length" class="space-y-2">
        <li v-for="account in games" :key="account.platform">
          <a
            v-if="account.url"
            :href="account.url"
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            :class="rowClass"
          >
            <ProfileAccountIcon :platform="account.platform" class="size-[18px] shrink-0" />
            <span class="min-w-0 flex-1">
              <span class="block text-[11px] leading-4 text-slate-400">{{ ACCOUNT_META[account.platform].name }}</span>
              <span class="block truncate text-sm font-semibold text-slate-900">{{ accountLabel(account) }}</span>
            </span>
            <span class="grid size-7 shrink-0 place-items-center text-slate-400 transition group-hover:text-slate-700">
              <LucideIcon :icon="ArrowUpRight" class="size-4 transition group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transform-none" />
            </span>
          </a>
          <button
            v-else
            type="button"
            :class="rowClass"
            :aria-label="$t('profile.showcase.accounts.copy', { name: ACCOUNT_META[account.platform].name, value: accountLabel(account) })"
            @click="copy(account)"
          >
            <ProfileAccountIcon :platform="account.platform" class="size-[18px] shrink-0" />
            <span class="min-w-0 flex-1">
              <span class="block text-[11px] leading-4 text-slate-400">{{ ACCOUNT_META[account.platform].name }}</span>
              <span class="block truncate text-sm font-semibold tabular-nums text-slate-900">{{ accountLabel(account) }}</span>
            </span>
            <Transition
              mode="out-in"
              enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
              enter-from-class="scale-90 opacity-0"
              leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
              leave-to-class="opacity-0"
            >
              <span
                v-if="copied === account.platform"
                class="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                role="status"
              >
                <LucideIcon :icon="Check" class="size-3" />{{ $t('profile.showcase.accounts.copied') }}
              </span>
              <span v-else class="grid size-7 shrink-0 place-items-center text-slate-400 transition group-hover:text-slate-700">
                <LucideIcon :icon="Copy" class="size-4" />
              </span>
            </Transition>
          </button>
        </li>
      </ul>

      <div v-if="social.length">
        <h3 v-if="games.length" class="mb-2 text-[11px] font-semibold text-slate-400">
          {{ $t('profile.showcase.accounts.social') }}
        </h3>
        <ul class="flex flex-wrap gap-2">
          <li v-for="account in social" :key="account.platform">
            <Tooltip placement="top" :content="`${ACCOUNT_META[account.platform].name} ${accountLabel(account)}`">
              <a
                :href="account.url!"
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                :aria-label="`${ACCOUNT_META[account.platform].name} ${accountLabel(account)}`"
                class="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 motion-reduce:transform-none"
              >
                <ProfileAccountIcon :platform="account.platform" class="size-[18px]" />
              </a>
            </Tooltip>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
