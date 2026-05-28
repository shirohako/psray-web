<template>
  <div class="px-4 py-3">
    <div class="flex items-center gap-2 mb-2">
      <img src="https://i.psray.net/i/2023/09/10/64fda1d94ba7e.png" style="width: 20px" />
      <span class="text-sm font-medium">{{ $t('trophies.translations') }}</span>
      <span class="text-xs text-gray-400">({{ totalCount }})</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <button
        :class="[
          'rounded border px-2 py-0.5 text-xs cursor-pointer transition-colors',
          language == trophySet.default_language
            ? 'ring-1 ring-indigo-500 border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50',
        ]"
        @click="$emit('default-language')"
      >
        {{ trophySet.language.native_name }}
      </button>
      <button
        v-for="translate in visibleLanguages"
        :key="translate.language_code"
        :class="[
          'rounded border px-2 py-0.5 text-xs cursor-pointer transition-colors',
          language == translate.language_code
            ? 'ring-1 ring-indigo-500 border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50',
        ]"
        @click="$emit('change-language', translate)"
      >
        {{ translate.language_tag.native_name }}
      </button>
      <button
        v-if="!expanded && hiddenCount > 0"
        class="rounded border px-2 py-0.5 text-xs cursor-pointer border-dashed border-gray-300 text-gray-400 hover:bg-gray-50"
        @click="expanded = true"
      >
        +{{ hiddenCount }}
      </button>
      <button
        v-if="expanded && hiddenCount > 0"
        class="rounded border px-2 py-0.5 text-xs cursor-pointer border-dashed border-gray-300 text-gray-400 hover:bg-gray-50"
        @click="expanded = false"
      >
        {{ $t('trophies.collapse') }}
      </button>
    </div>
  </div>
</template>

<script setup>
const VISIBLE_LIMIT = 8

const props = defineProps(['trophySet', 'language'])
defineEmits(['change-language', 'default-language'])

const expanded = ref(false)

const allLanguages = computed(() => props.trophySet?.languages ?? [])
const totalCount = computed(() => 1 + allLanguages.value.length)
const hiddenCount = computed(() => Math.max(0, allLanguages.value.length - VISIBLE_LIMIT))
const visibleLanguages = computed(() =>
  expanded.value ? allLanguages.value : allLanguages.value.slice(0, VISIBLE_LIMIT),
)
</script>
