<script setup lang="ts">
/**
 * The Markdown syntax guide. Its whole body is `<MarkdownGuide>` from
 * `@psray/markdown-editor` — the same package the editor comes from, so the guide can
 * never document a block the editor no longer produces.
 *
 * The page exists here rather than being mounted by the module's `guidePage`
 * option because SEO is ours: canonical URLs and per-locale titles come from
 * `useSeo()`, which the package has no business knowing about.
 */
const { t } = useI18n()

useSeo({
  title: () => t('markdown.help.seoTitle'),
  description: () => t('markdown.help.seoDescription'),
})
</script>

<template>
  <MarkdownGuide brand="PSRay Markdown" image-src="/logo.svg" image-alt="PSRay Logo" />
</template>
