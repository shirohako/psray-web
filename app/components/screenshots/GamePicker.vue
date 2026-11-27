<script setup lang="ts">
import type { PlayedGameRow } from '~/composables/usePlayedGames'
import type { ShowcaseGame } from '~/services/profile'

/**
 * Picks the game a screenshot is linked to: one of the owner's played games
 * (searchable, like the favorite-games picker). Choosing a row applies it and
 * closes the dialog.
 */
defineProps<{ psnid: string }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ select: [game: ShowcaseGame] }>()

function choose(row: PlayedGameRow) {
  emit('select', { id: row.id, name: row.name, display_language: row.lang, icon_url: row.icon, platform: row.platform })
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="2xl" :title="$t('screenshots.gamePicker.title')">
    <SettingsPlayedGames class="px-5 py-4" :psnid="psnid" mode="open" @select="choose" />
  </Dialog>
</template>
