export const TROPHY_ICON_SIZES = [
  { name: '默认', value: 'default', size: 'trophy-icon-default' },
  { name: '小', value: 'small', size: 'trophy-icon-small' },
  { name: '非常小', value: 'mini', size: 'trophy-icon-mini' },
] as const;

export const TROPHY_ROW_SPACINGS = [
  { name: '默认', value: 'default', spacing: 'trophy-gap-default' },
  { name: '紧凑', value: 'compact', spacing: 'trophy-gap-compact' },
  { name: '非常紧凑', value: 'dense', spacing: 'trophy-gap-dense' },
] as const;

export const TROPHY_LANG_ORDER = {
  'zh-Hans': ['zh-Hans', 'zh-Hant', 'default'],
  'zh-Hant': ['zh-Hant', 'zh-Hans', 'default'],
  en: ['en', 'en-GB', 'default'],
  ja: ['ja', 'default'],
  ko: ['ko', 'default'],
} as const;
