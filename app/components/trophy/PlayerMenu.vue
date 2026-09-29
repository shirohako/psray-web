<script setup lang="ts">
import { Trophy, UserRound } from 'lucide'

/**
 * Click menu for a player row on a trophy page: open this set with the player's
 * progress (`?psnid=`), or go to their profile. Wraps `Popover`, so classes on
 * this component style the row itself.
 */
const props = defineProps<{ id: number | string; psnid: string }>()
/** Fired when a menu item is chosen, e.g. so a dialog can close itself. */
const emit = defineEmits<{ select: [] }>()

const route = useRoute()
// Keep the page's other params (e.g. `?tlang=`) so only the viewer changes.
const progressLink = computed(() => ({
  path: `/trophies/${props.id}`,
  query: { ...route.query, psnid: props.psnid },
}))

function choose(close: () => void) {
  close()
  emit('select')
}
</script>

<template>
  <Popover>
    <slot />

    <template #menu="{ close }">
      <NuxtLink
        :to="progressLink"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 transition hover:bg-slate-50"
        @click="choose(close)"
      >
        <LucideIcon :icon="Trophy" class="size-4 text-slate-400" />
        {{ $t('trophy.players.viewProgress') }}
      </NuxtLink>
      <NuxtLink
        :to="`/p/${psnid}`"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-slate-700 transition hover:bg-slate-50"
        @click="choose(close)"
      >
        <LucideIcon :icon="UserRound" class="size-4 text-slate-400" />
        {{ $t('trophy.players.viewProfile') }}
      </NuxtLink>
    </template>
  </Popover>
</template>
