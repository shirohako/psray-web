<script setup lang="ts">
import { AlertTriangle, ChevronRight, CircleDot, ExternalLink, GripVertical, LayoutDashboard, Loader2, Lock, LockKeyhole, Pencil, RefreshCw } from 'lucide'
import type { UpdateSettingPayload, UserSetting } from '~/services/account'
import { useAccountApi } from '~/services/account'
import type { ShowcaseColumn, ShowcaseKey, ShowcaseLayout, ShowcaseText } from '~/services/profile'
import type { PickedGame, PickedScreenshot, PickedTrophy } from '~/utils/profileShowcase'
import type { AccountDraft } from '~/utils/profileAccounts'
import { ApiError } from '~/utils/ApiError'

/**
 * Profile showcases: switch each one on or off and drag it into place within
 * its column (left: above the tabbed main card; right: below stats and
 * account). What the featured, favorite-games and favorite-screenshots
 * showcases hold is picked here, the two texts are written here and the
 * other-platform accounts filled in here. Everything is saved together from
 * the unsaved-changes bar, like the profile page.
 */
const { user } = useAuth()
const { t } = useI18n()
const toast = useToast()
const errorText = useApiErrorText()
const accountApi = useAccountApi()

const { data: setting, pending: settingPending, error: settingError, refresh: refreshSetting }
  = await useApiFetch<UserSetting>('/user/setting')

type Texts = Record<ShowcaseColumn, ShowcaseText>
interface ShowcaseForm {
  layout: ShowcaseLayout
  featured: PickedTrophy[]
  games: PickedGame[]
  screenshots: PickedScreenshot[]
  texts: Texts
  accounts: AccountDraft[]
}
const emptyText = (): ShowcaseText => ({ title: '', body: '' })
const empty = (): ShowcaseForm => ({ layout: { left: [], right: [] }, featured: [], games: [], screenshots: [], texts: { left: emptyText(), right: emptyText() }, accounts: [] })
const copyTexts = (texts: Texts): Texts => ({ left: { ...texts.left }, right: { ...texts.right } })
// `saved` is what the account has now; the diff is what save sends.
const form = reactive<ShowcaseForm>(empty())
const saved = reactive<ShowcaseForm>(empty())

function load(target: ShowcaseForm, s: UserSetting) {
  target.layout = cloneLayout(s.profile_showcases)
  target.featured = s.featured_trophies.map(toPicked)
  target.games = [...s.favorite_games]
  target.screenshots = [...(s.favorite_screenshots ?? [])]
  target.texts = copyTexts(s.showcase_texts)
  target.accounts = toDrafts(s.accounts ?? [])
}
watch(setting, (s) => {
  if (!s) return
  load(form, s)
  load(saved, s)
}, { immediate: true })

const changed = computed(() => ({
  layout: !sameLayout(form.layout, saved.layout),
  featured: !samePicks(form.featured, saved.featured),
  games: !sameGames(form.games, saved.games),
  screenshots: !sameScreenshots(form.screenshots, saved.screenshots),
  texts: !sameTexts(form.texts, saved.texts),
  accounts: !sameDrafts(form.accounts, saved.accounts),
}))
const dirty = computed(() => Object.values(changed.value).some(Boolean))
const changeTags = computed(() => (Object.keys(changed.value) as (keyof ShowcaseForm)[])
  .filter(part => changed.value[part])
  .map(part => t(`settings.showcase.unsaved.${part}`)))

/** Fill a showcase's content; the first content switches the showcase on. */
function fill(key: ShowcaseKey, wasEmpty: boolean, isEmpty: boolean) {
  form.layout = layoutAfterFilling(form.layout, key, wasEmpty, isEmpty)
}
function setPicks(picks: PickedTrophy[]) {
  fill('featured', !form.featured.length, !picks.length)
  form.featured = picks
}
function setGames(games: PickedGame[]) {
  fill('games', !form.games.length, !games.length)
  form.games = games
}
function setScreenshots(picks: PickedScreenshot[]) {
  fill('favorite_screenshots', !form.screenshots.length, !picks.length)
  form.screenshots = picks
}
function setText(column: ShowcaseColumn, text: ShowcaseText) {
  fill(TEXT_KEYS[column], !form.texts[column].body, !text.body)
  form.texts = { ...form.texts, [column]: text }
}
function setAccounts(drafts: AccountDraft[]) {
  const filled = (list: AccountDraft[]) => list.some(d => d.input.trim())
  fill('accounts', !filled(form.accounts), !filled(drafts))
  form.accounts = drafts
}

function discard() {
  form.layout = cloneLayout(saved.layout)
  form.featured = [...saved.featured]
  form.games = [...saved.games]
  form.screenshots = [...saved.screenshots]
  form.texts = copyTexts(saved.texts)
  form.accounts = [...saved.accounts]
  accountErrors.value = false
}

// ── Sorting, one list per column ────────────────────────────────────────────
const leftList = ref<HTMLElement | null>(null)
const rightList = ref<HTMLElement | null>(null)
function mover(column: ShowcaseColumn) {
  return (from: number, to: number) => {
    form.layout[column] = moveIndex(form.layout[column], from, to)
  }
}
const sorts = {
  left: useSortDrag({ container: leftList, move: mover('left'), longPress: false }),
  right: useSortDrag({ container: rightList, move: mover('right'), longPress: false }),
}

const columns = [
  { key: 'left' as const, titleKey: 'settings.showcase.columns.left', hintKey: 'settings.showcase.columns.leftHint' },
  { key: 'right' as const, titleKey: 'settings.showcase.columns.right', hintKey: 'settings.showcase.columns.rightHint' },
]

// Template refs inside `v-for` arrive as a function call, one per column.
function setListRef(column: ShowcaseColumn, el: unknown) {
  ;(column === 'left' ? leftList : rightList).value = (el as HTMLElement | null) ?? null
}

// ── Pickers and the text editor ─────────────────────────────────────────────
const pickerOpen = ref(false)
const gamesPickerOpen = ref(false)
const screenshotsPickerOpen = ref(false)
const textColumn = ref<ShowcaseColumn>('left')
const textOpen = ref(false)
function editText(column: ShowcaseColumn) {
  textColumn.value = column
  textOpen.value = true
}
/** The text showcase in this layout row, if it is one. */
const textColumnOf = (key: ShowcaseKey): ShowcaseColumn | null =>
  key === TEXT_KEYS.left ? 'left' : key === TEXT_KEYS.right ? 'right' : null

const isPrivate = computed(() => user.value?.is_profile_public === false)

/** Row description, with the limit it mentions. */
function describe(key: ShowcaseKey) {
  const max = key === 'games' ? GAMES_LIMIT : key === 'favorite_screenshots' ? FAVORITE_SCREENSHOTS_LIMIT : FEATURED_LIMIT
  return t(SHOWCASE_META[key].descKey, { max })
}

// ── Save ────────────────────────────────────────────────────────────────────
const saving = ref(false)
/** Set when a save was refused for accounts that can't be saved, so every such row shows why. */
const accountErrors = ref(false)

async function save() {
  if (saving.value || !dirty.value) return
  if (changed.value.accounts && form.accounts.some(isInvalidDraft)) {
    accountErrors.value = true
    toast.error({ title: t('settings.showcase.saveFailed'), description: t('settings.showcase.accounts.invalid') })
    return
  }
  saving.value = true
  try {
    const payload: UpdateSettingPayload = {}
    if (changed.value.layout) payload.profile_showcases = cloneLayout(form.layout)
    if (changed.value.featured) payload.featured_trophies = featuredRefs(form.featured)
    if (changed.value.games) payload.favorite_games = form.games.map(g => g.id)
    if (changed.value.screenshots) payload.favorite_screenshots = form.screenshots.map(shot => shot.id)
    if (changed.value.texts) payload.showcase_texts = copyTexts(form.texts)
    if (changed.value.accounts) payload.accounts = accountsPayload(form.accounts)
    await accountApi.updateSetting(payload)
    await refreshSetting()
    accountErrors.value = false
    toast.success({ title: t('settings.showcase.saved') })
  }
  catch (error) {
    const field = error instanceof ApiError && error.isValidation ? Object.values(error.fieldErrors())[0] : undefined
    toast.error({ title: t('settings.showcase.saveFailed'), description: field ?? errorText(error) })
  }
  finally {
    saving.value = false
  }
}

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm(t('settings.showcase.leaveConfirm'))) return false
})
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="space-y-6 p-5">
      <!-- The link sits in the banner's own slot, styled for its dark ground. -->
      <SettingsHero :icon="LayoutDashboard" eyebrow="Showcase" :title="$t('settings.showcase.heading')" :description="$t('settings.showcase.subheading')">
        <AppLink
          v-if="user"
          :to="`/p/${encodeURIComponent(user.psnid)}`"
          class="inline-flex shrink-0 items-center gap-1.5 justify-self-start whitespace-nowrap rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/15"
        >
          <LucideIcon :icon="ExternalLink" class="size-4 text-sky-200" />
          {{ $t('settings.showcase.viewProfile') }}
        </AppLink>
      </SettingsHero>

      <!-- Loading -->
      <div v-if="settingPending" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-lg bg-slate-100" />
      </div>

      <!-- Error -->
      <div
        v-else-if="settingError"
        class="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
      >
        <p class="flex items-center gap-2 text-sm font-medium text-rose-700">
          <LucideIcon :icon="AlertTriangle" class="size-4.5 shrink-0" />
          {{ $t('settings.showcase.loadFailed') }}
        </p>
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
          @click="refreshSetting()"
        >
          <LucideIcon :icon="RefreshCw" class="size-4" />
          {{ $t('common.retry') }}
        </button>
      </div>

      <template v-else>
        <!-- PSN trophy privacy closed: the trophy showcases can't show. -->
        <p
          v-if="isPrivate"
          class="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <LucideIcon :icon="LockKeyhole" class="mt-0.5 size-4 shrink-0" />
          {{ $t('settings.showcase.privateNotice') }}
        </p>

        <div v-for="column in columns" :key="column.key" class="space-y-2">
          <h3 class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span class="text-xs font-bold text-slate-700">{{ $t(column.titleKey) }}</span>
            <span class="text-xs text-slate-400">{{ $t(column.hintKey) }}</span>
          </h3>

          <!-- Right column: the fixed cards come first. -->
          <p
            v-if="column.key === 'right'"
            class="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500"
          >
            <LucideIcon :icon="Lock" class="size-3.5 shrink-0 text-slate-400" />
            {{ $t('settings.showcase.fixed.side') }}
          </p>

          <div :ref="el => setListRef(column.key, el)">
            <TransitionGroup
              tag="ul"
              class="space-y-2"
              move-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
            >
              <li
                v-for="(entry, index) in form.layout[column.key]"
                :key="entry.key"
                :data-sort-index="index"
                class="relative rounded-lg border bg-white transition-[box-shadow,border-color]"
                :class="sorts[column.key].dragging.value === index
                  ? 'z-10 border-slate-300 shadow-lg shadow-slate-900/10'
                  : 'border-slate-200'"
              >
                <div class="flex items-center gap-3 py-2.5 pl-1.5 pr-3 sm:pr-4">
                  <button
                    type="button"
                    class="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 active:cursor-grabbing"
                    :aria-label="$t('settings.showcase.move', { name: $t(SHOWCASE_META[entry.key].labelKey) })"
                    @pointerdown="sorts[column.key].onPointerDown($event, index)"
                    @keydown="sorts[column.key].onKeydown($event, index, form.layout[column.key].length)"
                  >
                    <LucideIcon :icon="GripVertical" class="size-4.5" />
                  </button>
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-lg transition-colors"
                    :class="entry.on ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'"
                  >
                    <LucideIcon :icon="SHOWCASE_META[entry.key].icon" class="size-4.5" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold transition-colors" :class="entry.on ? 'text-slate-900' : 'text-slate-500'">
                      {{ $t(SHOWCASE_META[entry.key].labelKey) }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-400">{{ describe(entry.key) }}</p>
                  </div>
                  <SettingsSwitch v-model="entry.on" :label="$t(SHOWCASE_META[entry.key].labelKey)" :disabled="saving" />
                </div>

                <!-- Featured: the picked trophies, inline -->
                <div
                  v-if="entry.key === 'featured'"
                  class="mx-3 mb-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <SettingsSortTray
                    :model-value="form.featured"
                    :item-key="pick => pick.trophy_id"
                    :item-label="pick => pick.name"
                    :limit="FEATURED_LIMIT"
                    tile-class="size-13"
                    addable
                    :add-label="$t('settings.showcase.tray.addTrophies')"
                    :disabled="saving"
                    @update:model-value="setPicks"
                    @add="pickerOpen = true"
                  >
                    <template #tile="{ item }">
                      <SettingsTrophyTile :pick="item" badge />
                    </template>
                  </SettingsSortTray>
                  <div class="mt-2.5 flex items-center justify-between gap-3 text-[11px]">
                    <span class="text-slate-400">
                      {{ form.featured.length ? $t('settings.showcase.tray.hint') : $t('settings.showcase.tray.emptyTrophies') }}
                    </span>
                    <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ form.featured.length }} / {{ FEATURED_LIMIT }}</span>
                  </div>
                </div>

                <!-- Favorite games: the picked games, inline -->
                <div
                  v-else-if="entry.key === 'games'"
                  class="mx-3 mb-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <SettingsSortTray
                    :model-value="form.games"
                    :item-key="game => game.id"
                    :item-label="game => game.name"
                    :limit="GAMES_LIMIT"
                    tile-class="h-11 w-20"
                    addable
                    :add-label="$t('settings.showcase.tray.addGames')"
                    :disabled="saving"
                    @update:model-value="setGames"
                    @add="gamesPickerOpen = true"
                  >
                    <template #tile="{ item }">
                      <SettingsGameTile :game="item" />
                    </template>
                  </SettingsSortTray>
                  <div class="mt-2.5 flex items-center justify-between gap-3 text-[11px]">
                    <span class="text-slate-400">
                      {{ form.games.length ? $t('settings.showcase.tray.hint') : $t('settings.showcase.tray.emptyGames') }}
                    </span>
                    <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ form.games.length }} / {{ GAMES_LIMIT }}</span>
                  </div>
                </div>

                <!-- Favorite screenshots: the picked screenshots, inline -->
                <div
                  v-else-if="entry.key === 'favorite_screenshots'"
                  class="mx-3 mb-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <SettingsSortTray
                    :model-value="form.screenshots"
                    :item-key="shot => shot.id"
                    :item-label="shot => shot.caption || shot.game?.name || String(shot.id)"
                    :limit="FAVORITE_SCREENSHOTS_LIMIT"
                    tile-class="h-11 w-20"
                    addable
                    :add-label="$t('settings.showcase.tray.addScreenshots')"
                    :disabled="saving"
                    @update:model-value="setScreenshots"
                    @add="screenshotsPickerOpen = true"
                  >
                    <template #tile="{ item }">
                      <img :src="item.image.url" :srcset="item.image.srcset ?? undefined" sizes="80px" alt="" class="size-full rounded object-cover">
                    </template>
                  </SettingsSortTray>
                  <div class="mt-2.5 flex items-center justify-between gap-3 text-[11px]">
                    <span class="text-slate-400">
                      {{ form.screenshots.length ? $t('settings.showcase.tray.hint') : $t('settings.showcase.tray.emptyScreenshots') }}
                    </span>
                    <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ form.screenshots.length }} / {{ FAVORITE_SCREENSHOTS_LIMIT }}</span>
                  </div>
                </div>

                <!-- Newest screenshots: managed on their own page -->
                <div
                  v-else-if="entry.key === 'screenshots'"
                  class="mx-3 mb-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <p class="min-w-0 text-xs text-slate-400">{{ $t('settings.showcase.screenshots.note') }}</p>
                  <AppLink
                    to="/me/screenshots"
                    class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    {{ $t('settings.showcase.screenshots.manage') }}
                    <LucideIcon :icon="ChevronRight" class="size-3.5" />
                  </AppLink>
                </div>

                <!-- Text: title and an excerpt; "Edit" opens the editor -->
                <div
                  v-else-if="textColumnOf(entry.key)"
                  class="mx-3 mb-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <div v-if="form.texts[textColumnOf(entry.key)!].body" class="min-w-0 flex-1">
                    <p class="truncate text-[13px] font-semibold text-slate-900">
                      {{ form.texts[textColumnOf(entry.key)!].title || $t('profile.showcase.text.defaultTitle') }}
                    </p>
                    <p class="mt-0.5 line-clamp-2 text-xs text-slate-500">{{ tipExcerpt(form.texts[textColumnOf(entry.key)!].body, 160) }}</p>
                  </div>
                  <p v-else class="min-w-0 flex-1 text-xs text-slate-400">{{ $t('settings.showcase.text.empty') }}</p>
                  <button
                    type="button"
                    class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                    :disabled="saving"
                    @click="editText(textColumnOf(entry.key)!)"
                  >
                    <LucideIcon :icon="Pencil" class="size-3.5" />
                    {{ $t('settings.showcase.text.edit') }}
                  </button>
                </div>

                <!-- Other platforms: the accounts, edited inline -->
                <div
                  v-else-if="entry.key === 'accounts'"
                  class="mx-3 mb-3 rounded-lg bg-slate-50 p-2.5 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <SettingsAccountsEditor
                    :model-value="form.accounts"
                    :disabled="saving"
                    :show-errors="accountErrors"
                    @update:model-value="setAccounts"
                  />
                </div>
              </li>
            </TransitionGroup>
          </div>

          <!-- Left column: the tabbed main card comes last. -->
          <p
            v-if="column.key === 'left'"
            class="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500"
          >
            <LucideIcon :icon="Lock" class="size-3.5 shrink-0 text-slate-400" />
            {{ $t('settings.showcase.fixed.main') }}
          </p>
        </div>

        <!-- Unsaved changes -->
        <Transition
          enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="translate-y-2 opacity-0"
          leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
          leave-to-class="translate-y-2 opacity-0"
        >
          <div
            v-if="dirty"
            class="sticky bottom-4 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-slate-900 px-4 py-3 text-white shadow-lg shadow-slate-900/20"
            role="status"
          >
            <LucideIcon :icon="CircleDot" class="size-4.5 shrink-0 text-amber-400" />
            <span class="text-sm font-medium">{{ $t('settings.profile.unsaved.title') }}</span>
            <ul class="flex flex-wrap gap-1.5">
              <li
                v-for="tag in changeTags"
                :key="tag"
                class="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200 ring-1 ring-inset ring-white/15"
              >
                {{ tag }}
              </li>
            </ul>
            <div class="ml-auto flex items-center gap-2">
              <button
                type="button"
                :disabled="saving"
                class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                @click="discard"
              >
                {{ $t('settings.profile.unsaved.discard') }}
              </button>
              <button
                type="button"
                :disabled="saving"
                class="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60"
                @click="save"
              >
                <LucideIcon v-if="saving" :icon="Loader2" class="size-4 animate-spin" />
                {{ saving ? $t('common.saving') : $t('common.save') }}
              </button>
            </div>
          </div>
        </Transition>
      </template>
    </div>

    <template v-if="user">
      <SettingsFeaturedPicker v-model:open="pickerOpen" :psnid="user.psnid" :picks="form.featured" @apply="setPicks" />
      <SettingsGamesPicker v-model:open="gamesPickerOpen" :psnid="user.psnid" :picks="form.games" @apply="setGames" />
    </template>
    <SettingsScreenshotsPicker v-model:open="screenshotsPickerOpen" :picks="form.screenshots" @apply="setScreenshots" />
    <SettingsTextDialog
      v-model:open="textOpen"
      :column="textColumn"
      :text="form.texts[textColumn]"
      @apply="setText(textColumn, $event)"
    />
  </section>
</template>
