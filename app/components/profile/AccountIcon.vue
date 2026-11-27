<script setup lang="ts">
import type { AccountPlatform } from '~/services/profile'

/** A platform's brand glyph in its brand colour; size it with a class. */
defineProps<{ platform: AccountPlatform }>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    :fill="ACCOUNT_META[platform].color"
    aria-hidden="true"
  >
    <path :d="ACCOUNT_META[platform].path" />
  </svg>
</template>
