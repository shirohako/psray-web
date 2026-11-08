<script setup lang="ts">
import type { NuxtLinkProps } from '#app'

/**
 * `<NuxtLink>` that keeps the reader's interface language (`?lang=`) in its
 * `href`, so a crawler following links on an English page stays on English
 * pages. Use it for every internal link outside admin;
 * `tests/internalLinks.test.ts` enforces that. Attributes and listeners fall
 * through to the `<NuxtLink>`.
 */
const props = defineProps<{ to: NuxtLinkProps['to'] }>()
const { localize } = useLangLink()
</script>

<template>
  <NuxtLink :to="localize(props.to as string)">
    <slot />
  </NuxtLink>
</template>
