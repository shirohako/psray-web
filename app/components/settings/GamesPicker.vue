<script setup lang="ts">
import type { PlayedGameRow } from '~/composables/usePlayedGames'
import type { PickedGame } from '~/utils/profileShowcase'

/**
 * Picks the favorite games: tick up to six of the owner's played games
 * (searchable, like the profile's recently played tab). The picks sit in the
 * footer tray, where they can be reordered or taken out. Nothing changes
 * until "Done"; the settings page saves it with the rest of the form.
 */
const props = defineProps<{ psnid: string; picks: PickedGame[] }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ apply: [picks: PickedGame[]] }>()
const { t } = useI18n()

/** The picks being edited; copied from `picks` each time the dialog opens. */
const working = ref<PickedGame[]>([])
const ids = computed(() => working.value.map(g => g.id))
const full = computed(() => working.value.length >= GAMES_LIMIT)

function toggle(row: PlayedGameRow) {
  if (ids.value.includes(row.id)) {
    working.value = working.value.filter(g => g.id !== row.id)
  }
  else if (!full.value) {
    working.value = [...working.value, { id: row.id, name: row.name, display_language: row.lang, icon_url: row.icon, platform: row.platform }]
  }
}

watch(open, (value) => {
  if (value) working.value = [...props.picks]
}, { immediate: true })

function done() {
  emit('apply', working.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="2xl" :title="t('settings.showcase.gamesPicker.title')">
    <SettingsPlayedGames class="px-5 py-4" :psnid="psnid" mode="check" :checked="ids" :full="full" @select="toggle" />

    <template #footer>
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="font-semibold tabular-nums text-slate-600">
            {{ t('settings.showcase.picker.picked', { count: working.length, max: GAMES_LIMIT }) }}
          </span>
          <span v-if="full" class="text-amber-600">{{ t('settings.showcase.picker.limit', { max: GAMES_LIMIT }) }}</span>
          <span v-else-if="working.length > 1" class="text-slate-400">{{ t('settings.showcase.tray.hint') }}</span>
        </div>
        <SettingsSortTray
          v-model="working"
          :item-key="game => game.id"
          :item-label="game => game.name"
          :limit="GAMES_LIMIT"
          tile-class="h-9 w-16"
        >
          <template #tile="{ item }">
            <SettingsGameTile :game="item" />
          </template>
        </SettingsSortTray>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            @click="open = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="done"
          >
            {{ t('settings.showcase.picker.done') }}
          </button>
        </div>
      </div>
    </template>
  </Dialog>
</template>
