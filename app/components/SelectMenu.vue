<script setup lang="ts" generic="T extends string | number | boolean | null | undefined">
import { Check, ChevronDown, Search } from 'lucide'
import type { SelectOption } from '~/types/select'

/**
 * Drop-in for a native `<select>`: a trigger button and a listbox panel that
 * is teleported to `body` and placed under the trigger (above it when there
 * is no room), so dialogs and `overflow-hidden` cards can't clip it.
 *
 * Keyboard: ↑/↓ (or Home/End) move, Enter/Space pick, Esc closes, typing jumps
 * to the next matching label (or filters, when `searchable`). `$attrs` (id,
 * aria-label, width classes…) land on the trigger, so `<label for>` works.
 *
 * ```vue
 * <SelectMenu v-model="sort" :options="[{ value: 'new', label: 'Newest' }]" />
 * <SelectMenu v-model="lang" :options="langs" searchable size="lg" class="w-full" />
 * <SelectMenu v-model="region" :options="regions" searchable panel-width="320">
 *   <template #value="{ option }">…</template>
 *   <template #option="{ option, selected }">…</template>
 * </SelectMenu>
 * ```
 */
// Trigger + teleported panel make this a fragment; class etc. go on the trigger.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  options: readonly SelectOption<T>[]
  /** sm: h-8 (toolbars, admin), md: h-9, lg: h-10 (forms). */
  size?: 'sm' | 'md' | 'lg'
  /** Shown when no option matches the value. */
  placeholder?: string
  disabled?: boolean
  /** Error state: rose border and ring. */
  invalid?: boolean
  /** Dark border, e.g. for a filter that is set. */
  highlight?: boolean
  /** Leading icon inside the trigger. */
  icon?: any
  /** A search box atop the list; worth it past a dozen or so options. */
  searchable?: boolean
  /** Defaults to 「Search」 / 「No matches」. */
  searchPlaceholder?: string
  emptyText?: string
  /** Fixed panel width in px; by default at least the trigger's width. */
  panelWidth?: number | string
}>(), { size: 'md', placeholder: '' })

const model = defineModel<T>({ required: true })

defineSlots<{
  /** Trigger content in place of the selected label. */
  value?: (props: { option: SelectOption<T> | undefined }) => any
  /** Row content (the check mark stays). */
  option?: (props: { option: SelectOption<T>; selected: boolean; active: boolean }) => any
}>()

const PANEL_MAX_HEIGHT = 320
const MARGIN = 8

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-md pl-2.5 pr-2 text-[13px]',
  md: 'h-9 gap-2 rounded-lg pl-3 pr-2 text-sm',
  lg: 'h-10 gap-2 rounded-lg pl-3 pr-2.5 text-sm',
} as const

const open = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const placement = ref<'bottom' | 'top'>('bottom')
const panelStyle = ref<Record<string, string>>({})
const listId = useId()

const selected = computed(() => props.options.find(o => o.value === model.value))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase() === q)
})
const activeId = computed(() => activeIndex.value >= 0 && filtered.value[activeIndex.value] ? `${listId}-${activeIndex.value}` : undefined)

function place() {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const viewportWidth = document.documentElement.clientWidth
  const below = window.innerHeight - rect.bottom
  placement.value = below < PANEL_MAX_HEIGHT && rect.top > below ? 'top' : 'bottom'
  const room = (placement.value === 'bottom' ? below : rect.top) - 14
  const width = panel.value?.offsetWidth ?? rect.width
  const left = Math.max(MARGIN, Math.min(rect.left, viewportWidth - width - MARGIN))
  panelStyle.value = {
    left: `${left}px`,
    minWidth: `${Math.min(rect.width, viewportWidth - MARGIN * 2)}px`,
    maxWidth: `${viewportWidth - MARGIN * 2}px`,
    ...(props.panelWidth ? { width: `${props.panelWidth}px` } : {}),
    maxHeight: `${Math.max(Math.min(PANEL_MAX_HEIGHT + (props.searchable ? 56 : 0), room), 160)}px`,
    // Opening upwards anchors the panel's bottom edge, so its height never matters.
    ...(placement.value === 'bottom'
      ? { top: `${rect.bottom + 6}px` }
      : { bottom: `${window.innerHeight - rect.top + 6}px` }),
  }
}

function firstEnabled(from: number, step: 1 | -1) {
  const items = filtered.value
  for (let i = 0; i < items.length; i++) {
    const index = (from + step * i + items.length * 2) % items.length
    if (!items[index]!.disabled) return index
  }
  return -1
}

function show() {
  if (props.disabled) return
  query.value = ''
  const current = filtered.value.findIndex(o => o.value === model.value)
  activeIndex.value = current >= 0 ? current : firstEnabled(0, 1)
  place()
  open.value = true
  nextTick(() => {
    // Now that the panel has a width, pull it back on-screen if needed.
    place()
    ;(props.searchable ? searchInput.value : list.value)?.focus({ preventScroll: true })
    scrollActiveIntoView()
  })
}

function close(refocus = false) {
  if (!open.value) return
  open.value = false
  if (refocus) trigger.value?.focus()
}

function pick(option: SelectOption<T> | undefined) {
  if (!option || option.disabled) return
  if (option.value !== model.value) model.value = option.value
  close(true)
}

// mousemove rather than mouseenter: a list scrolled under a still pointer
// shouldn't steal the keyboard's place.
function hover(index: number) {
  if (!filtered.value[index]?.disabled) activeIndex.value = index
}

function scrollActiveIntoView() {
  nextTick(() => list.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
}

function move(index: number) {
  if (index < 0) return
  activeIndex.value = index
  scrollActiveIntoView()
}

// Type-ahead without a search box: letters typed in quick succession jump to
// the next label starting with them.
let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined
function typeAhead(char: string) {
  typed += char.toLowerCase()
  clearTimeout(typedTimer)
  typedTimer = setTimeout(() => { typed = '' }, 600)
  const items = filtered.value
  // A repeated single letter cycles through matches; a longer prefix stays put if it still matches.
  const start = typed.length === 1 ? activeIndex.value + 1 : Math.max(activeIndex.value, 0)
  for (let i = 0; i < items.length; i++) {
    const index = (start + i) % items.length
    const item = items[index]!
    if (!item.disabled && item.label.toLowerCase().startsWith(typed)) return move(index)
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (open.value) return
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault()
    show()
  }
}

function onPanelKeydown(event: KeyboardEvent) {
  const count = filtered.value.length
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (count) move(firstEnabled(activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1), event.key === 'ArrowDown' ? 1 : -1))
      break
    case 'Home':
    case 'End':
      if (props.searchable) break
      event.preventDefault()
      move(event.key === 'Home' ? firstEnabled(0, 1) : firstEnabled(count - 1, -1))
      break
    case 'Enter':
      event.preventDefault()
      pick(filtered.value[activeIndex.value])
      break
    case ' ':
      if (props.searchable) break
      event.preventDefault()
      pick(filtered.value[activeIndex.value])
      break
    case 'Escape':
      // Keep an enclosing dialog or drawer open.
      event.preventDefault()
      event.stopPropagation()
      close(true)
      break
    case 'Tab':
      // Focus returns to the trigger, then Tab moves on from there.
      close(true)
      break
    default:
      if (!props.searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) typeAhead(event.key)
  }
}

watch(query, () => { activeIndex.value = firstEnabled(0, 1) })

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (!trigger.value?.contains(target) && !panel.value?.contains(target)) close()
}

function bindGlobals(on: boolean) {
  if (!import.meta.client) return
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('pointerdown', onPointerDown as EventListener)
  window[method]('resize', place)
  window[method]('scroll', place, true)
}

watch(open, bindGlobals)
watch(() => props.disabled, (v) => { if (v) close() })
onBeforeUnmount(() => {
  bindGlobals(false)
  clearTimeout(typedTimer)
})
</script>

<template>
  <button
    ref="trigger"
    type="button"
    v-bind="$attrs"
    :disabled="disabled"
    aria-haspopup="listbox"
    :aria-expanded="open"
    :aria-controls="open ? listId : undefined"
    class="group inline-flex min-w-0 items-center border bg-white text-left transition focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
    :class="[
      SIZES[size],
      invalid
        ? 'border-rose-300 focus-visible:ring-4 focus-visible:ring-rose-500/10'
        : open
          ? 'border-slate-400 ring-4 ring-slate-200/60'
          : highlight
            ? 'border-slate-900'
            : 'border-slate-200 enabled:hover:border-slate-300 focus-visible:border-slate-400 focus-visible:ring-4 focus-visible:ring-slate-200/60',
    ]"
    @click="open ? close() : show()"
    @keydown="onTriggerKeydown"
  >
    <LucideIcon v-if="icon" :icon="icon" class="size-4 shrink-0 text-slate-400" />
    <slot name="value" :option="selected">
      <!-- Every label sits invisibly in the same grid cell, so the trigger is as wide as the
           longest one (like a native select) instead of resizing with the selection. -->
      <span class="grid min-w-0 flex-1">
        <span
          v-for="(o, i) in options"
          :key="i"
          aria-hidden="true"
          class="invisible col-start-1 row-start-1 h-0 truncate font-medium"
        >{{ o.label }}</span>
        <span
          class="col-start-1 row-start-1 truncate"
          :class="selected ? 'font-medium text-slate-800 group-disabled:text-slate-400' : 'text-slate-400'"
        >{{ selected?.label ?? placeholder }}</span>
      </span>
    </slot>
    <LucideIcon
      :icon="ChevronDown"
      class="size-4 shrink-0 text-slate-400 transition-transform duration-200"
      :class="{ 'rotate-180': open }"
    />
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      :enter-from-class="placement === 'bottom' ? 'opacity-0 -translate-y-1' : 'opacity-0 translate-y-1'"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        ref="panel"
        class="fixed z-60 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5"
        :style="panelStyle"
        @keydown="onPanelKeydown"
      >
        <div v-if="searchable" class="border-b border-slate-100 p-2">
          <label class="relative block">
            <span class="sr-only">{{ searchPlaceholder || $t('common.search') }}</span>
            <LucideIcon :icon="Search" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref="searchInput"
              v-model="query"
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              :aria-controls="listId"
              :aria-activedescendant="activeId"
              :placeholder="searchPlaceholder || $t('common.search')"
              class="h-9 w-full rounded-lg bg-slate-50 pl-8 pr-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:ring-slate-400"
            >
          </label>
        </div>

        <ul
          :id="listId"
          ref="list"
          role="listbox"
          :tabindex="searchable ? undefined : -1"
          :aria-activedescendant="searchable ? undefined : activeId"
          :aria-label="($attrs['aria-label'] as string | undefined)"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 focus:outline-none"
        >
          <li
            v-for="(o, index) in filtered"
            :id="`${listId}-${index}`"
            :key="index"
            role="option"
            :aria-selected="o.value === model"
            :aria-disabled="o.disabled || undefined"
            :data-active="index === activeIndex"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
            :class="[
              o.disabled ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer',
              index === activeIndex && !o.disabled ? 'bg-slate-100' : '',
            ]"
            @mousemove="hover(index)"
            @click="pick(o)"
          >
            <slot name="option" :option="o" :selected="o.value === model" :active="index === activeIndex">
              <span
                class="min-w-0 flex-1 truncate"
                :class="o.disabled ? '' : o.value === model ? 'font-semibold text-slate-900' : 'text-slate-700'"
              >{{ o.label }}</span>
              <span v-if="o.hint" class="shrink-0 text-[11px] font-medium text-slate-400">{{ o.hint }}</span>
            </slot>
            <LucideIcon
              :icon="Check"
              class="size-4 shrink-0 text-slate-900"
              :class="o.value === model ? '' : 'invisible'"
            />
          </li>
          <li v-if="!filtered.length" class="px-3 py-6 text-center text-xs text-slate-500">{{ emptyText || $t('common.noMatches') }}</li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>
