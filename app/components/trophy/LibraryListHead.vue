<script setup lang="ts">
/**
 * Column header over {@link TrophyLibraryEntry} rows in list view (md and up;
 * phones stack each row instead). Used by the trophy library and the game page.
 * Keep the grid columns in sync with `LibraryEntry.vue` and
 * `LibraryEntrySkeleton.vue`.
 */
defineProps<{
  showReferenceTimes: boolean
  /** First column's label; the trophy library calls the rows games. */
  nameLabel?: string
}>()
</script>

<template>
  <div
    class="list-head border-b border-slate-100 bg-slate-50/70 text-[10px] text-slate-400"
    :class="{ 'no-reference-times': !showReferenceTimes }"
    aria-hidden="true"
  >
    <span class="col-span-2">{{ nameLabel ?? $t('library.game') }}</span>
    <span>{{ $t('library.trophies') }}</span>
    <span class="text-right">{{ $t('library.players') }}</span>
    <span class="text-center">{{ $t('library.progress') }}</span>
    <span v-if="showReferenceTimes">{{ $t('library.completionTime') }}</span>
    <span />
  </div>
</template>

<style scoped>
.list-head { display: none; }
@media (min-width: 768px) {
  .list-head {
    display: grid;
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 166px 12px;
    column-gap: 12px;
    padding: 7px 16px;
  }
  .list-head.no-reference-times {
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 12px;
  }
}
</style>
