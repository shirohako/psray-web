<script setup lang="ts">
import { Loader2, UserCheck, UserMinus, UserPlus } from 'lucide'

/**
 * The follow button on a /me/following card: unfollow someone the signed-in
 * user follows, follow back someone who follows them, follow anyone else.
 * Icon-only so cards stay one row; the tooltip and accessible name say what a
 * click does.
 */
const props = defineProps<{
  psnid: string
  /** The signed-in user follows them right now. */
  following: boolean
  /** They follow the signed-in user. */
  followsMe: boolean
  busy?: boolean
}>()

defineEmits<{ toggle: [] }>()

const { t } = useI18n()

/** What clicking the button does. */
const actionLabel = computed(() => {
  if (props.following) return t('profile.actions.unfollow')
  return props.followsMe ? t('me.following.followBack') : t('profile.actions.follow')
})
</script>

<template>
  <Tooltip :content="actionLabel" placement="top">
    <button
      type="button"
      :disabled="busy"
      class="group/follow grid size-8 place-items-center rounded-lg ring-1 ring-inset transition active:scale-95 disabled:cursor-wait disabled:opacity-70"
      :class="following
        ? 'bg-emerald-50 text-emerald-600 ring-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200'
        : followsMe
          ? 'bg-sky-600 text-white ring-sky-600 hover:bg-sky-700 hover:ring-sky-700'
          : 'bg-slate-900 text-white ring-slate-900 hover:bg-slate-700 hover:ring-slate-700'"
      :aria-label="`${actionLabel} ${psnid}`"
      :aria-pressed="following"
      @click="$emit('toggle')"
    >
      <LucideIcon v-if="busy" :icon="Loader2" class="size-4 animate-spin" />
      <template v-else-if="following">
        <LucideIcon :icon="UserCheck" class="size-4 group-hover/follow:hidden" />
        <LucideIcon :icon="UserMinus" class="hidden size-4 group-hover/follow:block" />
      </template>
      <LucideIcon v-else :icon="UserPlus" class="size-4" />
    </button>
  </Tooltip>
</template>
