<script setup lang="ts">
import { Check, ChevronDown, Search } from 'lucide'

/**
 * Region picker. The trigger shows the selected region's flag, name and code;
 * the panel adds a search box above the full {@link REGIONS} list. The panel is teleported to `body` and positioned under
 * the trigger (above it when there is no room), so cards with `overflow-hidden`
 * can't clip it. Keyboard: ↑/↓ move, Enter picks, Esc closes.
 *
 * ```vue
 * <LeaderboardRegionSelect v-model="region" />
 * ```
 */
// Trigger + teleported panel make this a fragment; class etc. go on the trigger.
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

const PANEL_WIDTH = 320
const PANEL_MAX_HEIGHT = 420

const { t } = useI18n()
const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const trigger = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const position = ref<{ placement: 'bottom' | 'top'; style: Record<string, string> }>({ placement: 'bottom', style: {} })
const listId = useId()

const selected = computed(() => REGIONS.find(r => r.code === model.value))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return REGIONS
  return REGIONS.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase() === q)
})

function place() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const below = window.innerHeight - rect.bottom
  const placement = below < PANEL_MAX_HEIGHT && rect.top > below ? 'top' : 'bottom'
  const left = Math.min(Math.max(rect.left, 8), window.innerWidth - PANEL_WIDTH - 8)
  // Never taller than the room on the chosen side, less a small margin.
  const room = (placement === 'bottom' ? below : rect.top) - 14
  position.value = {
    placement,
    // Opening upwards anchors the panel's bottom edge, so its height never matters.
    style: {
      left: `${left}px`,
      width: `${PANEL_WIDTH}px`,
      maxHeight: `${Math.max(Math.min(PANEL_MAX_HEIGHT, room), 160)}px`,
      ...(placement === 'bottom'
        ? { top: `${rect.bottom + 6}px` }
        : { bottom: `${window.innerHeight - rect.top + 6}px` }),
    },
  }
}

function show() {
  query.value = ''
  activeIndex.value = Math.max(filtered.value.findIndex(r => r.code === model.value), 0)
  place()
  open.value = true
  nextTick(() => {
    searchInput.value?.focus()
    scrollActiveIntoView()
  })
}

function close(refocus = false) {
  open.value = false
  if (refocus) trigger.value?.focus()
}

function select(code: string) {
  model.value = code
  close(true)
}

function scrollActiveIntoView() {
  nextTick(() => panel.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const count = filtered.value.length
    if (!count) return
    activeIndex.value = (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + count) % count
    scrollActiveIntoView()
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    const region = filtered.value[activeIndex.value]
    if (region) select(region.code)
  }
  else if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
  }
}

watch(query, () => { activeIndex.value = 0 })

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (!trigger.value?.contains(target) && !panel.value?.contains(target)) close()
}

function bindGlobals(on: boolean) {
  if (!import.meta.client) return
  if (on) {
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
  }
  else {
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('resize', place)
    window.removeEventListener('scroll', place, true)
  }
}

watch(open, bindGlobals)
onBeforeUnmount(() => bindGlobals(false))
</script>

<template>
  <button
    ref="trigger"
    type="button"
    v-bind="$attrs"
    aria-haspopup="listbox"
    :aria-expanded="open"
    class="group inline-flex h-9 w-56 items-center gap-2.5 rounded-lg border bg-white pl-2.5 pr-2 text-sm transition"
    :class="open ? 'border-slate-400 ring-4 ring-slate-200/60' : 'border-slate-200 hover:border-slate-300'"
    @click="open ? close() : show()"
  >
    <RegionFlag :country="model" class="shrink-0 overflow-hidden rounded-sm text-lg" />
    <span class="min-w-0 flex-1 truncate text-left font-medium text-slate-800">{{ selected?.name ?? model }}</span>
    <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">{{ model }}</span>
    <LucideIcon :icon="ChevronDown" class="size-4 shrink-0 text-slate-400 transition" :class="{ 'rotate-180': open }" />
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      :enter-from-class="position.placement === 'bottom' ? 'opacity-0 -translate-y-1' : 'opacity-0 translate-y-1'"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        ref="panel"
        class="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
        :style="position.style"
        @keydown="onKeydown"
      >
        <!-- Search -->
        <div class="border-b border-slate-100 p-2">
          <label class="relative block">
            <span class="sr-only">{{ t('leaderboard.regionSearch') }}</span>
            <LucideIcon :icon="Search" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref="searchInput"
              v-model="query"
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              :aria-controls="listId"
              :aria-activedescendant="filtered[activeIndex] ? `${listId}-${filtered[activeIndex]!.code}` : undefined"
              :placeholder="t('leaderboard.regionSearch')"
              class="h-9 w-full rounded-lg bg-slate-50 pl-8 pr-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:ring-slate-400"
            >
          </label>
        </div>

        <!-- Full list -->
        <ul :id="listId" role="listbox" :aria-label="t('leaderboard.regionLabel')" class="min-h-0 flex-1 overflow-y-auto p-1.5">
          <li
            v-for="(r, index) in filtered"
            :id="`${listId}-${r.code}`"
            :key="r.code"
            role="option"
            :aria-selected="r.code === model"
            :data-active="index === activeIndex"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition"
            :class="index === activeIndex ? 'bg-slate-100' : ''"
            @mouseenter="activeIndex = index"
            @click="select(r.code)"
          >
            <RegionFlag :country="r.code" class="shrink-0 overflow-hidden rounded-sm text-lg" />
            <span class="min-w-0 flex-1 truncate" :class="r.code === model ? 'font-semibold text-slate-900' : 'text-slate-700'">{{ r.name }}</span>
            <span class="text-[11px] font-medium text-slate-400">{{ r.code }}</span>
            <LucideIcon v-if="r.code === model" :icon="Check" class="size-4 shrink-0 text-slate-900" />
          </li>
          <li v-if="!filtered.length" class="px-3 py-6 text-center text-xs text-slate-500">{{ t('leaderboard.regionEmpty') }}</li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>
