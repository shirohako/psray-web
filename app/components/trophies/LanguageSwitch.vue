<template>
  <div class="p-4">
    <div class="flex items-center mb-4">
      <img
        src="https://i.psray.net/i/2023/09/10/64fda1d94ba7e.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('trophies.translations') }}</span>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <label
        :class="{ 'ring-2 ring-indigo-500': language == trophySet.default_language }"
        class="flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none cursor-pointer text-gray-900 shadow-sm"
        @click="$emit('default-language')"
      >
        <span>{{ trophySet.language.native_name }}</span>
      </label>
      <label
        v-for="translate in trophySet.languages"
        :key="translate.language_code"
        :class="{ 'ring-2 ring-indigo-500': language == translate.language_code }"
        class="text-center flex items-center justify-center rounded-md border py-2 px-3 text-sm font-medium hover:bg-gray-50 focus:outline-none cursor-pointer text-gray-900 shadow-sm"
        @click="$emit('change-language', translate)"
      >
        <span>{{ translate.language_tag.native_name }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps(['trophySet', 'language'])
defineEmits(['change-language', 'default-language'])
</script>
