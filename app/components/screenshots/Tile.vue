<script setup lang="ts">
import { Ellipsis, Eye, EyeOff, Gamepad2, Globe, Link2, Lock, Maximize2, Pencil, Stamp, Trash2 } from 'lucide'
import type { OwnScreenshot } from '~/services/screenshots'

/**
 * One screenshot on /me/screenshots: the picture with its visibility badge
 * (top left) and drawn-in watermarks (bottom right), the game or caption
 * below, and a menu of actions. Clicking the picture opens the viewer.
 */
const props = defineProps<{ screenshot: OwnScreenshot, busy?: boolean }>()
const emit = defineEmits<{ view: [], toggleVisibility: [], edit: [], copyLink: [], delete: [] }>()
const { t } = useI18n()

const watermarkLabel = computed(() => {
  const marks = [
    props.screenshot.watermarks.psn ? t('screenshots.watermarks.psn') : null,
    props.screenshot.watermarks.profile ? t('screenshots.watermarks.profile') : null,
  ].filter((mark): mark is string => mark !== null)
  return marks.length ? t('screenshots.watermarks.drawn', { list: formatList(marks) }) : null
})
const menuOpen = ref(false)
const shot = computed(() => props.screenshot)

const MENU_ROW = 'flex w-full items-center gap-2 whitespace-nowrap rounded-md py-1.5 pl-2 pr-4 text-left text-xs font-medium transition disabled:opacity-50'
const MENU_ROW_NORMAL = `${MENU_ROW} text-slate-700 hover:bg-slate-100 hover:text-slate-900`
const MENU_ROW_DANGER = `${MENU_ROW} text-rose-600 hover:bg-rose-50 hover:text-rose-700`
</script>

<template>
  <article
    class="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow"
    :class="{ 'opacity-60': busy }"
  >
    <button
      type="button"
      class="relative block aspect-video w-full overflow-hidden bg-slate-100"
      :style="{ backgroundColor: shot.image.color ?? undefined }"
      :aria-label="$t('screenshots.tile.view')"
      @click="emit('view')"
    >
      <img
        :src="shot.image.url"
        :srcset="shot.image.srcset ?? undefined"
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
        :alt="shot.caption || shot.game?.name || ''"
        loading="lazy"
        class="size-full object-cover transition duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
      >
      <span
        class="absolute left-2 top-2 inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold shadow-sm"
        :class="shot.is_public ? 'bg-white/95 text-emerald-700' : 'bg-slate-900/75 text-white'"
      >
        <LucideIcon :icon="shot.is_public ? Globe : Lock" class="size-3" />
        {{ shot.is_public ? $t('screenshots.public') : $t('screenshots.private') }}
      </span>
      <span
        v-if="watermarkLabel"
        class="absolute bottom-2 right-2 inline-flex h-5.5 items-center gap-1 rounded-full bg-slate-900/65 px-1.5 text-[10px] font-semibold text-white"
        :title="watermarkLabel"
      >
        <LucideIcon :icon="Stamp" class="size-3" />
        {{ (shot.watermarks.psn ? 1 : 0) + (shot.watermarks.profile ? 1 : 0) }}
        <span class="sr-only">{{ watermarkLabel }}</span>
      </span>
      <span class="absolute inset-0 grid place-items-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/15 group-hover:opacity-100 motion-reduce:transition-none">
        <span class="grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow"><LucideIcon :icon="Maximize2" class="size-4" /></span>
      </span>
    </button>

    <div class="flex items-center gap-2 px-2.5 py-2">
      <div class="min-w-0 flex-1">
        <p v-if="shot.caption" class="truncate text-xs font-semibold text-slate-800">{{ shot.caption }}</p>
        <p class="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500" :class="{ 'mt-0.5': shot.caption }">
          <img v-if="shot.game" :src="shot.game.icon_url" alt="" class="size-4 shrink-0 rounded object-cover">
          <LucideIcon v-else :icon="Gamepad2" class="size-3.5 shrink-0 text-slate-300" />
          <span v-if="shot.game" class="truncate" :lang="contentLang(shot.game.display_language, shot.game.name)">{{ shot.game.name }}</span>
          <span v-else class="truncate text-slate-400">{{ $t('screenshots.noGame') }}</span>
        </p>
      </div>

      <DropdownMenu
        align="right"
        panel-class="!min-w-0 w-max !rounded-lg !p-1"
        role="button"
        :aria-label="$t('screenshots.tile.actions')"
        :aria-expanded="menuOpen"
        class="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md transition"
        :class="menuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'"
        @open="menuOpen = true"
        @close="menuOpen = false"
      >
        <LucideIcon :icon="Ellipsis" class="size-4" />
        <template #menu="{ close }">
          <button type="button" :class="MENU_ROW_NORMAL" @click="close(); emit('view')">
            <LucideIcon :icon="Maximize2" class="size-3.5 text-slate-500" />{{ $t('screenshots.tile.view') }}
          </button>
          <button type="button" :class="MENU_ROW_NORMAL" :disabled="busy" @click="close(); emit('toggleVisibility')">
            <LucideIcon :icon="shot.is_public ? EyeOff : Eye" class="size-3.5 text-slate-500" />
            {{ shot.is_public ? $t('screenshots.tile.makePrivate') : $t('screenshots.tile.makePublic') }}
          </button>
          <button type="button" :class="MENU_ROW_NORMAL" :disabled="busy" @click="close(); emit('edit')">
            <LucideIcon :icon="Pencil" class="size-3.5 text-slate-500" />{{ $t('screenshots.tile.edit') }}
          </button>
          <button type="button" :class="MENU_ROW_NORMAL" @click="close(); emit('copyLink')">
            <LucideIcon :icon="Link2" class="size-3.5 text-slate-500" />{{ $t('screenshots.tile.copyLink') }}
          </button>
          <div class="mx-1 my-1 border-t border-slate-100" />
          <button type="button" :class="MENU_ROW_DANGER" :disabled="busy" @click="close(); emit('delete')">
            <LucideIcon :icon="Trash2" class="size-3.5" />{{ $t('screenshots.tile.delete') }}
          </button>
        </template>
      </DropdownMenu>
    </div>
  </article>
</template>

