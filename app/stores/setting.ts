import { defineStore } from 'pinia';

export const useSettingStore = defineStore(
  'setting',
  () => {
    const trophiesIconSize = ref('default');
    const trophiesSpacings = ref('default');
    const customLocalization = ref(false);
    const customLocalizationValue = ref([]);

    return { trophiesIconSize, trophiesSpacings, customLocalization, customLocalizationValue };
  },
  {
    persist: true,
  },
);
