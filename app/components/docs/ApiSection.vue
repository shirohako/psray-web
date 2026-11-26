<script setup lang="ts">
/**
 * One row of /docs/api: prose on the left, code on a dark column to the right.
 * Rows sit flush against each other, so the dark cells read as one continuous
 * column. The split follows the width of the surrounding `@container` rather
 * than the viewport, because the site sidebar can be expanded or collapsed;
 * below the breakpoint the code stacks under the prose.
 */
defineProps<{ id: string }>()
</script>

<template>
  <section :id="id" class="api-section grid scroll-mt-20 @4xl:grid-cols-[minmax(0,1fr)_24rem] @6xl:grid-cols-[minmax(0,1fr)_28rem]">
    <div class="api-section__text min-w-0 border-t border-slate-200 px-5 py-8 sm:px-8 sm:py-10">
      <slot />
    </div>
    <div
      class="api-section__code min-w-0 bg-slate-950 px-4 py-5 sm:px-5 @4xl:border-t @4xl:border-slate-800 @4xl:py-10"
      :class="$slots.code ? '' : 'hidden @4xl:block'"
    >
      <div class="flex flex-col gap-4 @4xl:sticky @4xl:top-24 @4xl:max-h-[calc(100vh-7rem)]">
        <slot name="code" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.api-section:first-child > .api-section__text,
.api-section:first-child > .api-section__code {
  border-top-width: 0;
}
</style>
