<script setup lang="ts">
import type { NuxtLinkProps } from '#app'

/**
 * `<NuxtLink>` that keeps the reader's interface language (`?lang=`) in its
 * `href`, so a crawler following links on an English page stays on English
 * pages. Use it for every internal link outside admin;
 * `tests/internalLinks.test.ts` enforces that. Attributes and listeners fall
 * through to the `<NuxtLink>`.
 *
 * `state` rides along in the new history entry (`history.state`) without
 * touching the URL: for what the next page needs but a shared link shouldn't
 * carry. A link opened in a new tab goes without it.
 */
const props = defineProps<{ to: NuxtLinkProps['to'], state?: Record<string, string> }>()
const { localize } = useLangLink()
const router = useRouter()

const target = computed(() => {
  const href = localize(props.to as string)
  if (!props.state) return href
  const { path, query, hash } = router.resolve(href)
  return { path, query, hash, state: props.state }
})
</script>

<template>
  <NuxtLink :to="target">
    <slot />
  </NuxtLink>
</template>
