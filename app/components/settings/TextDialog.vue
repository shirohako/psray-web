<script setup lang="ts">
import type { ShowcaseColumn, ShowcaseText } from '~/services/profile'

/**
 * Edits one text showcase: its title and a Markdown body, in the same split
 * editor (write on the left, preview on the right) the trophy comments use.
 * Nothing changes until "Done"; the settings page saves it with the rest of
 * the form. Lengths are counted in characters, as the API counts them.
 */
const props = defineProps<{ column: ShowcaseColumn; text: ShowcaseText }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ apply: [text: ShowcaseText] }>()
const { t } = useI18n()

const title = ref('')
const body = ref('')
watch(open, (value) => {
  if (!value) return
  title.value = props.text.title
  body.value = props.text.body
}, { immediate: true })

const titleLength = computed(() => textLength(title.value.trim()))
const bodyLength = computed(() => textLength(body.value.trim()))
const titleTooLong = computed(() => titleLength.value > TEXT_TITLE_MAX)
const bodyTooLong = computed(() => bodyLength.value > TEXT_BODY_MAX)

const name = computed(() => t(SHOWCASE_META[TEXT_KEYS[props.column]].labelKey))

function done() {
  if (titleTooLong.value || bodyTooLong.value) return
  emit('apply', { title: title.value.trim(), body: body.value.trim() })
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="4xl" :title="t('settings.showcase.text.dialogTitle', { name })">
    <form class="space-y-4 p-4 sm:p-5" @submit.prevent="done">
      <label class="block">
        <span class="mb-1.5 flex items-baseline justify-between gap-3">
          <span class="text-xs font-semibold text-slate-600">{{ t('settings.showcase.text.title') }}</span>
          <span class="text-[11px] tabular-nums" :class="titleTooLong ? 'font-semibold text-rose-600' : 'text-slate-400'">{{ titleLength }} / {{ TEXT_TITLE_MAX }}</span>
        </span>
        <input
          v-model="title"
          type="text"
          :placeholder="t('profile.showcase.text.defaultTitle')"
          :aria-invalid="titleTooLong"
          class="h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2"
          :class="titleTooLong ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'"
        />
        <span class="mt-1 block text-[11px] text-slate-400">{{ t('settings.showcase.text.titleHint', { title: t('profile.showcase.text.defaultTitle') }) }}</span>
      </label>

      <div>
        <LazyMarkdownEditor
          v-model="body"
          :placeholder="t('settings.showcase.text.placeholder')"
          :error="bodyTooLong ? t('settings.showcase.text.tooLong', { max: TEXT_BODY_MAX }) : undefined"
        />
        <p class="mt-1.5 text-right text-[11px] tabular-nums" :class="bodyTooLong ? 'font-semibold text-rose-600' : 'text-slate-400'">
          {{ bodyLength }} / {{ TEXT_BODY_MAX }}
        </p>
      </div>
    </form>

    <template #footer>
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
          class="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          :disabled="titleTooLong || bodyTooLong"
          @click="done"
        >
          {{ t('settings.showcase.picker.done') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
