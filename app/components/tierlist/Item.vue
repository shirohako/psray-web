<script setup lang="ts">
import { Check, ExternalLink, Trash2, Undo2 } from 'lucide'
import { TIER_POOL, type TierItem } from '~/utils/tierList'

/**
 * A tile on the board. Drag it to rank it; click (or Enter) for a menu that
 * moves it without dragging, which is also the way on a keyboard.
 */
const props = defineProps<{
  item: TierItem
  zone: string
}>()

const editor = useTierEditor()
const src = computed(() => editor.itemSrc(props.item))
const failed = ref(false)
watch(src, () => { failed.value = false })

function startDrag(event: PointerEvent) {
  editor.drag.start(event, { kind: 'item', itemId: props.item.id }, event.currentTarget as HTMLElement, { src: src.value, color: props.item.color })
}

function moveTo(zone: string, close: () => void) {
  editor.move(props.item.id, zone)
  close()
}

function remove(close: () => void) {
  editor.remove(props.item.id)
  close()
}

const menuBase = 'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent'
const menuItem = `${menuBase} text-slate-600 hover:bg-slate-50 hover:text-slate-900`
const menuDanger = `${menuBase} text-rose-600 hover:bg-rose-50`
</script>

<template>
  <DropdownMenu
    :data-tier-item="item.id"
    class="relative h-16 w-12 shrink-0 select-none [-webkit-touch-callout:none] sm:h-20 sm:w-15"
    panel-class="w-60"
    @pointerdown="startDrag"
  >
    <button
      type="button"
      class="block size-full cursor-grab overflow-hidden rounded bg-slate-200 ring-1 ring-black/5 transition hover:ring-2 hover:ring-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:cursor-grabbing"
      :style="item.color ? { backgroundColor: item.color } : undefined"
      :title="item.name"
      :aria-label="$t('tierlist.item.menu', { name: item.name })"
    >
      <img
        v-if="src && !failed"
        :src="src"
        alt=""
        draggable="false"
        loading="lazy"
        decoding="async"
        class="pointer-events-none size-full object-cover"
        @error="failed = true"
      >
      <span v-else class="line-clamp-5 flex size-full items-center justify-center p-1 text-center text-[10px] leading-tight font-semibold break-words text-slate-700">
        {{ item.name }}
      </span>
    </button>

    <template #menu="{ close }">
      <p class="truncate border-b border-slate-100 px-3 pb-2 pt-1.5 text-xs font-semibold text-slate-900" :title="item.name">{{ item.name }}</p>
      <p class="px-3 pb-1 pt-2 text-[11px] font-semibold text-slate-400">{{ $t('tierlist.item.moveTo') }}</p>
      <button
        v-for="row in editor.list?.rows ?? []"
        :key="row.id"
        type="button"
        role="menuitem"
        :class="menuItem"
        :disabled="row.id === zone"
        @click="moveTo(row.id, close)"
      >
        <span class="size-3.5 shrink-0 rounded-sm ring-1 ring-black/10" :style="{ backgroundColor: row.color }" />
        <span class="min-w-0 flex-1 truncate">{{ row.label.trim() || $t('tierlist.untitledRow') }}</span>
        <LucideIcon v-if="row.id === zone" :icon="Check" class="size-3.5 shrink-0" />
      </button>
      <div class="my-1 border-t border-slate-100" />
      <button v-if="zone !== TIER_POOL" type="button" role="menuitem" :class="menuItem" @click="moveTo(TIER_POOL, close)">
        <LucideIcon :icon="Undo2" class="size-4 shrink-0 text-slate-400" />{{ $t('tierlist.item.backToPool') }}
      </button>
      <AppLink
        v-if="item.gameId"
        :to="`/games/${item.gameId}`"
        target="_blank"
        role="menuitem"
        :class="menuItem"
        @click="close"
      >
        <LucideIcon :icon="ExternalLink" class="size-4 shrink-0 text-slate-400" />{{ $t('tierlist.item.openGame') }}
      </AppLink>
      <button type="button" role="menuitem" :class="menuDanger" @click="remove(close)">
        <LucideIcon :icon="Trash2" class="size-4 shrink-0" />{{ $t('tierlist.item.remove') }}
      </button>
    </template>
  </DropdownMenu>
</template>
