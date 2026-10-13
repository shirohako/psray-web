<script setup lang="ts">
/**
 * Loading placeholder for one {@link TrophyLibraryEntry}. It keeps that
 * component's grid (list columns, phone stack and grid card), so swapping in
 * the loaded entries moves nothing. Keep the layout below in sync with
 * `LibraryEntry.vue` and the list head in `pages/trophies/index.vue`.
 */
const props = defineProps<{ view: 'list' | 'grid'; showReferenceTimes: boolean; index: number }>()

// Vary the bars per row so the column reads like real titles, not a stamp.
const TITLE_WIDTHS = ['72%', '54%', '86%', '63%', '78%', '48%', '68%', '58%']
const PLAYER_WIDTHS = ['82%', '68%', '74%']

const titleWidth = computed(() => TITLE_WIDTHS[props.index % TITLE_WIDTHS.length])
// Roughly one in three sets is PS5, whose artwork is square.
const squareArt = computed(() => props.index % 3 === 1)
const delay = computed(() => ({ animationDelay: `${120 + props.index * 40}ms` }))
</script>

<template>
  <div
    class="skeleton-entry animate-skeleton-in"
    :class="{ 'is-card': view === 'grid', 'no-reference-times': !showReferenceTimes }"
    :style="delay"
    aria-hidden="true"
  >
    <div class="entry-art flex items-center justify-center">
      <div class="skeleton max-h-full rounded-lg" :class="squareArt ? 'aspect-square h-full' : 'aspect-320/176 w-[92%]'" />
    </div>

    <div class="entry-name min-w-0">
      <div class="skeleton h-3.5 rounded" :style="{ width: titleWidth }" />
      <div class="mt-2 flex items-center gap-2">
        <div class="skeleton h-3 w-8 rounded" />
        <div class="skeleton skeleton-soft h-2.5 w-9 rounded" />
        <div class="skeleton skeleton-soft h-2.5 w-20 rounded" />
      </div>
      <div class="mt-2 flex items-center gap-2">
        <div class="skeleton skeleton-soft h-2 w-16 rounded" />
        <div class="skeleton skeleton-soft h-2 w-6 rounded" />
      </div>
    </div>

    <div class="entry-measures">
      <div class="entry-trophies">
        <!-- Tier dots keep a hint of colour so the row reads as trophies -->
        <div class="flex items-center gap-x-2.5">
          <div v-for="kind in trophyKinds" :key="kind.key" class="flex items-center gap-1">
            <span class="size-2 rounded-full opacity-40" :class="kind.dot" />
            <div class="skeleton skeleton-soft h-2.5 w-4 rounded" />
          </div>
        </div>
        <div class="trophy-count skeleton skeleton-soft h-2.5 w-24 rounded" />
      </div>

      <div class="entry-players">
        <div v-for="width in PLAYER_WIDTHS" :key="width" class="skeleton skeleton-soft h-2.5 rounded" :style="{ width }" />
      </div>

      <div class="entry-rates">
        <div class="skeleton skeleton-soft h-2.5 w-20 rounded" />
        <div class="skeleton skeleton-soft h-2.5 w-16 rounded" />
      </div>

      <div v-if="showReferenceTimes" class="entry-times">
        <div class="skeleton h-3 w-24 rounded" />
        <div v-for="i in 3" :key="i" class="skeleton skeleton-soft mt-1.5 h-2 w-full rounded" />
      </div>
    </div>

    <span class="entry-arrow" />
  </div>
</template>

<style scoped>
/* Phones (list view): artwork + title, then the measures stacked below. */
.skeleton-entry {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px 11px;
  padding: 12px;
  align-items: start;
}
.skeleton-entry:not(.is-card):nth-child(even) { background: var(--color-slate-50); }
.entry-art { width: 72px; height: 56px; }
.entry-name { padding-top: 2px; }
.entry-measures { grid-column: 1 / -1; display: flex; flex-direction: column; }
.entry-trophies {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 1px;
  border-top: 1px solid var(--color-slate-100);
  padding-top: 8px;
}
.entry-players,
.entry-rates {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 12px;
}
.entry-players > div { max-width: 4.5rem; }
.entry-players { padding-top: 7px; }
.entry-rates { padding-top: 5px; }
.entry-times {
  margin-top: 8px;
  border-top: 1px dashed var(--color-slate-200);
  padding-top: 7px;
}
.entry-arrow { display: none; }

/* Wider screens (list view): one row on the same columns as the list head. */
@media (min-width: 768px) {
  .skeleton-entry:not(.is-card) {
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 166px 12px;
    column-gap: 12px;
    padding: 11px 16px;
    min-height: 102px;
    align-items: center;
  }
  .skeleton-entry:not(.is-card).no-reference-times {
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 12px;
  }
  .skeleton-entry:not(.is-card) .entry-art { width: 96px; height: 64px; }
  .skeleton-entry:not(.is-card) .entry-measures { display: contents; }
  .skeleton-entry:not(.is-card) .entry-trophies {
    display: block;
    margin-top: 0;
    border-top: 0;
    padding-top: 0;
  }
  .skeleton-entry:not(.is-card) .trophy-count { margin-top: 8px; }
  .skeleton-entry:not(.is-card) .entry-players,
  .skeleton-entry:not(.is-card) .entry-rates {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding-top: 0;
  }
  .skeleton-entry:not(.is-card) .entry-players > div { max-width: none; }
  .skeleton-entry:not(.is-card) .entry-rates { align-items: center; }
  .skeleton-entry:not(.is-card) .entry-times {
    margin-top: 0;
    border-top: 0;
    padding-top: 0;
  }
  .skeleton-entry:not(.is-card) .entry-arrow { display: block; }
}

/* Grid view: the bordered card. */
.is-card {
  background: white;
  border: 1px solid var(--color-slate-200);
  border-radius: 8px;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 10px 12px;
  padding: 13px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.025);
}
.is-card .entry-art { width: 76px; height: 64px; }
.is-card .entry-trophies { margin-top: 0; padding-top: 9px; }
.is-card .entry-players { padding-top: 8px; }
.is-card .entry-rates { padding-top: 6px; }
.is-card .entry-times { margin-top: 9px; padding-top: 8px; }

@media (min-width: 1024px) {
  .is-card .entry-measures {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(166px, 0.9fr);
    grid-template-areas:
      'trophies trophies'
      'players times'
      'rates times';
    column-gap: 18px;
  }
  .is-card .entry-trophies { grid-area: trophies; }
  .is-card .entry-players { grid-area: players; align-self: end; }
  .is-card .entry-rates { grid-area: rates; align-self: start; }
  .is-card .entry-times {
    grid-area: times;
    align-self: stretch;
    margin-top: 7px;
    border-top: 0;
    border-left: 1px dashed var(--color-slate-200);
    padding-top: 0;
    padding-left: 16px;
  }
  .is-card.no-reference-times .entry-measures {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'trophies'
      'players'
      'rates';
  }
}
</style>
