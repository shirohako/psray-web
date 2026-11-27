<script setup lang="ts">
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide'
import type { AccountPlatform } from '~/services/profile'
import type { AccountDraft } from '~/utils/profileAccounts'

/**
 * The "other platforms" showcase's accounts, edited inline: one row per added
 * platform (drag the handle or use the arrow keys to reorder, the bin to take
 * it out), "Add account" picks a platform not added yet. The owner may paste
 * a profile link; leaving the input tidies it to the handle or ID that is
 * saved. A row that can't be saved is marked once left, or every such row
 * once `showErrors` is set (a save was refused).
 */
const props = withDefaults(defineProps<{
  modelValue: AccountDraft[]
  disabled?: boolean
  showErrors?: boolean
}>(), { disabled: false, showErrors: false })
const emit = defineEmits<{ 'update:modelValue': [drafts: AccountDraft[]] }>()
const { t } = useI18n()

const list = ref<HTMLElement | null>(null)
const { dragging, onPointerDown, onKeydown } = useSortDrag({
  container: list,
  move: (from, to) => emit('update:modelValue', moveIndex(props.modelValue, from, to)),
  longPress: false,
})

// Rows the owner has left at least once; their errors show from then on.
const touched = reactive(new Set<AccountPlatform>())

const remaining = computed(() => ACCOUNT_PLATFORMS.filter(platform => !props.modelValue.some(d => d.platform === platform)))

const inputs = new Map<AccountPlatform, HTMLInputElement>()
function setInput(platform: AccountPlatform, el: unknown) {
  if (el instanceof HTMLInputElement) inputs.set(platform, el)
  else inputs.delete(platform)
}

function add(platform: AccountPlatform) {
  emit('update:modelValue', [...props.modelValue, { platform, input: '' }])
  nextTick(() => inputs.get(platform)?.focus())
}

function remove(platform: AccountPlatform) {
  touched.delete(platform)
  emit('update:modelValue', props.modelValue.filter(d => d.platform !== platform))
}

function setInputValue(platform: AccountPlatform, input: string) {
  emit('update:modelValue', props.modelValue.map(d => (d.platform === platform ? { platform, input } : d)))
}

/** Leaving an input tidies a pasted link or `@handle` into what is saved. */
function onBlur(draft: AccountDraft) {
  touched.add(draft.platform)
  const value = normalizeAccount(draft.platform, draft.input)
  if (value !== null) {
    const tidy = accountInput(draft.platform, value)
    if (tidy !== draft.input) setInputValue(draft.platform, tidy)
  }
}

const showError = (draft: AccountDraft) => isInvalidDraft(draft) && (props.showErrors || touched.has(draft.platform))

const numeric = (platform: AccountPlatform) => platform === 'nintendo' || platform === 'bilibili'
</script>

<template>
  <div>
    <div v-if="modelValue.length" ref="list">
      <TransitionGroup
        tag="ul"
        class="space-y-1.5"
        move-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
      >
        <li
          v-for="(draft, index) in modelValue"
          :key="draft.platform"
          :data-sort-index="index"
          class="relative rounded-lg border bg-white transition-[box-shadow,border-color]"
          :class="dragging === index ? 'z-10 border-slate-300 shadow-lg shadow-slate-900/10' : 'border-slate-200'"
        >
          <div class="flex items-center gap-2 py-1.5 pl-1 pr-1.5">
            <button
              type="button"
              class="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 active:cursor-grabbing disabled:pointer-events-none"
              :aria-label="t('settings.showcase.tray.move', { name: ACCOUNT_META[draft.platform].name })"
              :disabled="disabled"
              @pointerdown="onPointerDown($event, index)"
              @keydown="onKeydown($event, index, modelValue.length)"
            >
              <LucideIcon :icon="GripVertical" class="size-4" />
            </button>

            <div class="flex shrink-0 items-center gap-2 sm:w-40">
              <ProfileAccountIcon :platform="draft.platform" class="size-4 shrink-0" />
              <div class="hidden min-w-0 sm:block">
                <p class="truncate text-[13px] font-semibold leading-4 text-slate-900">{{ ACCOUNT_META[draft.platform].name }}</p>
                <p class="truncate text-[11px] leading-4 text-slate-400">{{ t(`settings.showcase.accounts.fields.${ACCOUNT_META[draft.platform].field}`) }}</p>
              </div>
            </div>

            <label
              class="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-lg border bg-white transition focus-within:ring-2"
              :class="showError(draft)
                ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100'
                : 'border-slate-200 focus-within:border-slate-400 focus-within:ring-slate-100'"
            >
              <span
                v-if="ACCOUNT_META[draft.platform].prefix"
                class="hidden h-full shrink-0 items-center border-r border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-400 sm:flex"
              >{{ ACCOUNT_META[draft.platform].prefix }}</span>
              <input
                :ref="el => setInput(draft.platform, el)"
                :value="draft.input"
                type="text"
                :inputmode="numeric(draft.platform) ? 'numeric' : 'text'"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                :maxlength="ACCOUNT_INPUT_MAX"
                :placeholder="ACCOUNT_META[draft.platform].placeholder"
                :aria-label="`${ACCOUNT_META[draft.platform].name} ${t(`settings.showcase.accounts.fields.${ACCOUNT_META[draft.platform].field}`)}`"
                :aria-invalid="showError(draft)"
                :disabled="disabled"
                class="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-300 disabled:opacity-60"
                @input="setInputValue(draft.platform, ($event.target as HTMLInputElement).value)"
                @blur="onBlur(draft)"
              >
            </label>

            <button
              type="button"
              class="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              :aria-label="t('settings.showcase.tray.remove', { name: ACCOUNT_META[draft.platform].name })"
              :disabled="disabled"
              @click="remove(draft.platform)"
            >
              <LucideIcon :icon="Trash2" class="size-4" />
            </button>
          </div>
          <p v-if="showError(draft)" class="-mt-0.5 pb-2 pl-[4.25rem] pr-3 text-xs text-rose-600 sm:pl-[13.25rem]">
            {{ t(`settings.showcase.accounts.errors.${ACCOUNT_META[draft.platform].field}`) }}
          </p>
        </li>
      </TransitionGroup>
    </div>

    <div class="flex items-center justify-between gap-3" :class="{ 'mt-2.5': modelValue.length }">
      <DropdownMenu
        v-if="remaining.length"
        panel-class="!min-w-48 !rounded-lg !py-1"
        class="inline-flex"
        :class="{ 'pointer-events-none opacity-50': disabled }"
      >
        <button
          type="button"
          aria-haspopup="menu"
          :disabled="disabled"
          class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          <LucideIcon :icon="Plus" class="size-3.5 text-slate-500" />
          {{ t('settings.showcase.accounts.add') }}
          <LucideIcon :icon="ChevronDown" class="size-3.5 text-slate-400" />
        </button>
        <template #menu="{ close }">
          <button
            v-for="platform in remaining"
            :key="platform"
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            @click="add(platform); close()"
          >
            <ProfileAccountIcon :platform="platform" class="size-4 shrink-0" />
            {{ ACCOUNT_META[platform].name }}
          </button>
        </template>
      </DropdownMenu>
      <span class="ml-auto text-[11px] text-slate-400">
        {{ modelValue.length ? t('settings.showcase.accounts.hint') : t('settings.showcase.accounts.empty') }}
      </span>
    </div>
  </div>
</template>
