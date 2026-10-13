import type { DisplayDensity } from '~/composables/usePreferences'

/**
 * Row classes for each display density, shared by a list's rows and the
 * loading placeholders standing in for them, so both size identically.
 */

/** Trophy rows on the trophy set page (`trophy/Item.vue`). */
export const trophyItemDensity: Record<DisplayDensity, {
  row: string
  number: string
  icon: string
  tierBadge: string
  tierIcon: string
  earnedBadge: string
  earnedIcon: string
  title: string
  detail: string
  earnedMeta: string
  actions: string
  rate: string
  commentButton: string
  commentIcon: string
}> = {
  dense: {
    row: 'gap-2 px-2 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2',
    number: 'w-5 text-xs',
    icon: 'size-10 sm:size-12',
    tierBadge: '-bottom-1 -right-1 size-4 border',
    tierIcon: 'size-2.5',
    earnedBadge: '-right-1 -top-1 size-4 border',
    earnedIcon: 'size-2.5',
    title: 'text-sm',
    detail: 'mt-0 line-clamp-1 text-xs',
    earnedMeta: 'mt-0.5 gap-x-2 gap-y-0.5 text-[10px]',
    actions: 'gap-1',
    rate: 'text-[11px]',
    commentButton: 'size-5.5',
    commentIcon: 'size-2.5',
  },
  compact: {
    row: 'gap-2.5 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5',
    number: 'w-5 text-xs',
    icon: 'size-11 sm:size-13',
    tierBadge: '-bottom-1 -right-1 size-4.5 border',
    tierIcon: 'size-2.5',
    earnedBadge: '-right-1 -top-1 size-4 border',
    earnedIcon: 'size-2.5',
    title: 'text-sm',
    detail: 'mt-0.5 line-clamp-1 text-xs',
    earnedMeta: 'mt-1 gap-x-2 gap-y-0.5 text-[10px]',
    actions: 'gap-1 sm:gap-2',
    rate: 'text-xs',
    commentButton: 'size-6',
    commentIcon: 'size-3',
  },
  standard: {
    row: 'gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5',
    number: 'w-6 text-sm',
    icon: 'size-14 sm:size-16',
    tierBadge: '-bottom-1.5 -right-1.5 size-6 border-2',
    tierIcon: 'size-3.5',
    earnedBadge: '-right-1.5 -top-1.5 size-5 border-2',
    earnedIcon: 'size-3',
    title: '',
    detail: 'mt-0.5 line-clamp-2 text-[13px] font-medium',
    earnedMeta: 'mt-1.5 gap-x-2.5 gap-y-1 text-[11px]',
    actions: 'gap-1.5 sm:gap-3',
    rate: 'text-xs sm:text-sm',
    commentButton: 'size-6 sm:size-7',
    commentIcon: 'size-3 sm:size-3.5',
  },
}

/** Game rows in a profile's recently played tab (`profile/RecentlyPlayed.vue`). */
export const recentlyPlayedDensity: Record<DisplayDensity, {
  row: string
  artColumn: string
  art: string
  mobileBadges: string
  title: string
  content: string
  progress: string
  tiers: string
  chevron: string
}> = {
  dense: {
    row: 'gap-2.5 px-3 py-2 sm:items-center sm:px-4',
    artColumn: 'w-16 gap-1',
    art: 'h-12 w-16',
    mobileBadges: 'max-w-16 gap-0.5',
    title: 'text-sm',
    content: 'gap-1',
    progress: 'gap-2',
    tiers: 'gap-2 text-[10px]',
    chevron: 'size-4',
  },
  compact: {
    row: 'gap-3 px-3 py-3 sm:items-center sm:px-4',
    artColumn: 'w-20 gap-1',
    art: 'h-15 w-20',
    mobileBadges: 'max-w-20 gap-0.5',
    title: 'text-sm',
    content: 'gap-1.5',
    progress: 'gap-2.5',
    tiers: 'gap-2.5 text-[11px]',
    chevron: 'size-4.5',
  },
  standard: {
    row: 'gap-4 px-4 py-4 sm:items-center sm:px-5',
    artColumn: 'w-24 gap-1.5',
    art: 'h-18 w-24',
    mobileBadges: 'max-w-24 gap-1',
    title: '',
    content: 'gap-2',
    progress: 'gap-3',
    tiers: 'gap-3 text-xs',
    chevron: 'size-5',
  },
}
