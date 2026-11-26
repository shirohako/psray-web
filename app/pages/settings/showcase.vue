<script setup lang="ts">
import { AlertTriangle, CircleDot, ExternalLink, GripVertical, LayoutDashboard, Loader2, Lock, LockKeyhole, RefreshCw } from 'lucide'
import type { UserSetting } from '~/services/account'
import { useAccountApi } from '~/services/account'
import type { ShowcaseColumn, ShowcaseLayout } from '~/services/profile'
import type { PickedTrophy } from '~/utils/profileShowcase'
import { ApiError } from '~/utils/ApiError'

/**
 * Profile showcases: switch each one on or off and drag it into place within
 * its column (left: above the tabbed main card; right: below stats and
 * account). The featured showcase's trophies are picked here too. Everything
 * is saved together from the unsaved-changes bar, like the profile page.
 */
const { user } = useAuth()
const { t } = useI18n()
const toast = useToast()
const errorText = useApiErrorText()
const accountApi = useAccountApi()

const { data: setting, pending: settingPending, error: settingError, refresh: refreshSetting }
  = await useApiFetch<UserSetting>('/user/setting')

interface ShowcaseForm {
  layout: ShowcaseLayout
  featured: PickedTrophy[]
}
const empty = (): ShowcaseForm => ({ layout: { left: [], right: [] }, featured: [] })
// `saved` is what the account has now; the diff is what save sends.
const form = reactive<ShowcaseForm>(empty())
const saved = reactive<ShowcaseForm>(empty())

watch(setting, (s) => {
  if (!s) return
  const featured = s.featured_trophies.map(toPicked)
  form.layout = cloneLayout(s.profile_showcases)
  form.featured = [...featured]
  saved.layout = cloneLayout(s.profile_showcases)
  saved.featured = [...featured]
}, { immediate: true })

const layoutChanged = computed(() => !sameLayout(form.layout, saved.layout))
const featuredChanged = computed(() => !samePicks(form.featured, saved.featured))
const dirty = computed(() => layoutChanged.value || featuredChanged.value)
const changeTags = computed(() => [
  ...(layoutChanged.value ? [t('settings.showcase.unsaved.layout')] : []),
  ...(featuredChanged.value ? [t('settings.showcase.unsaved.featured')] : []),
])

function setPicks(picks: PickedTrophy[]) {
  form.layout = layoutAfterPicking(form.layout, form.featured.length, picks.length)
  form.featured = picks
}

function discard() {
  form.layout = cloneLayout(saved.layout)
  form.featured = [...saved.featured]
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

// ── Featured picker ─────────────────────────────────────────────────────────
const pickerOpen = ref(false)
const isPrivate = computed(() => user.value?.is_profile_public === false)

// ── Save ────────────────────────────────────────────────────────────────────
const saving = ref(false)

async function save() {
  if (saving.value || !dirty.value) return
  saving.value = true
  try {
    await accountApi.updateSetting({
      ...(layoutChanged.value ? { profile_showcases: cloneLayout(form.layout) } : {}),
      ...(featuredChanged.value ? { featured_trophies: featuredRefs(form.featured) } : {}),
    })
    await refreshSetting()
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
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SettingsHero :icon="LayoutDashboard" eyebrow="Showcase" :title="$t('settings.showcase.heading')" :description="$t('settings.showcase.subheading')" />
        <AppLink
          v-if="user"
          :to="`/p/${encodeURIComponent(user.psnid)}`"
          class="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 sm:self-auto"
        >
          <LucideIcon :icon="ExternalLink" class="size-4" />
          {{ $t('settings.showcase.viewProfile') }}
        </AppLink>
      </div>

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
                    <p class="mt-0.5 text-xs text-slate-400">{{ $t(SHOWCASE_META[entry.key].descKey, { max: FEATURED_LIMIT }) }}</p>
                  </div>
                  <SettingsSwitch v-model="entry.on" :label="$t(SHOWCASE_META[entry.key].labelKey)" :disabled="saving" />
                </div>

                <!-- Featured: the picked trophies, inline -->
                <div
                  v-if="entry.key === 'featured'"
                  class="mx-3 mb-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100 transition-opacity sm:ml-12"
                  :class="{ 'opacity-60': !entry.on }"
                >
                  <SettingsFeaturedTray
                    :model-value="form.featured"
                    addable
                    :disabled="saving"
                    @update:model-value="setPicks"
                    @add="pickerOpen = true"
                  />
                  <div class="mt-2.5 flex items-center justify-between gap-3 text-[11px]">
                    <span class="text-slate-400">
                      {{ form.featured.length ? $t('settings.showcase.tray.hint') : $t('settings.showcase.tray.empty') }}
                    </span>
                    <span class="shrink-0 font-semibold tabular-nums text-slate-500">{{ form.featured.length }} / {{ FEATURED_LIMIT }}</span>
                  </div>
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

    <SettingsFeaturedPicker
      v-if="user"
      v-model:open="pickerOpen"
      :psnid="user.psnid"
      :picks="form.featured"
      @apply="setPicks"
    />
  </section>
</template>
