<script setup lang="ts">
import { ArrowLeft, Search } from 'lucide'
import type { AdminManualTranslation, AdminTrophySetDetail } from '~/types/admin'
import { adminLanguageName, manualLanguageOptions } from '~/utils/adminTrophySet'

/**
 * 「添加翻译」: pick a language PSN lacks, then give the set's title in it to
 * create the manual translation; the rest can be filled in afterwards.
 * Languages PSN already has can't be picked; ones translated by hand open
 * their tab instead.
 */
const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  /** The set in its default language. */
  detail: AdminTrophySetDetail
}>()
const emit = defineEmits<{
  created: [translation: AdminManualTranslation]
  existing: [language: string]
}>()

const api = useAdminApi()
const query = ref('')
const picked = ref<string | null>(null)
const title = ref('')
const busy = ref(false)
const error = ref<any>(null)
watch(open, (value) => {
  if (!value) return
  query.value = ''
  picked.value = null
  title.value = ''
  error.value = null
})

const options = computed(() => {
  const q = query.value.trim().toLowerCase()
  return manualLanguageOptions(props.detail)
    .filter(option => !q || option.label.toLowerCase().includes(q) || option.code.toLowerCase().includes(q))
})
function pick(option: ReturnType<typeof manualLanguageOptions>[number]) {
  if (option.state === 'official') return
  if (option.state === 'manual') {
    open.value = false
    emit('existing', option.code)
    return
  }
  picked.value = option.code
  nextTick(() => document.getElementById('add-translation-title')?.focus())
}
async function create() {
  if (!picked.value || !title.value.trim() || busy.value) return
  busy.value = true
  error.value = null
  try {
    const translation = await api.write<AdminManualTranslation>(`/trophy-sets/${props.detail.id}/manual-translations/${picked.value}`, { name: title.value.trim() }, 'put')
    open.value = false
    emit('created', translation)
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open" :title="picked ? `添加${adminLanguageName(picked)}翻译` : '添加翻译'" size="md">
    <Transition mode="out-in" enter-active-class="transition duration-150 ease-out motion-reduce:transition-none" enter-from-class="opacity-0 translate-x-2" leave-active-class="transition duration-100 ease-in motion-reduce:transition-none" leave-to-class="opacity-0">
      <!-- Step 1: the language -->
      <div v-if="!picked" key="languages" class="p-3">
        <p class="px-2 pb-2 text-xs text-slate-500">只能选 PSN 没有官方翻译的语言，加上的翻译在前台标为非官方。</p>
        <label class="mx-1 mb-2 flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-slate-900">
          <LucideIcon :icon="Search" class="size-3.5 text-slate-400" />
          <input v-model="query" class="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="搜索语言" />
        </label>
        <ul class="max-h-[50vh] overflow-y-auto">
          <li v-for="option in options" :key="option.code">
            <button
              type="button"
              class="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left transition-colors"
              :class="option.state === 'official' ? 'cursor-not-allowed text-slate-400' : 'text-slate-900 hover:bg-slate-100'"
              :disabled="option.state === 'official'"
              @click="pick(option)"
            >
              <span class="text-[13px]">{{ option.label }}</span>
              <span class="text-[11px] text-slate-400">{{ option.code }}</span>
              <span v-if="option.state === 'official'" class="ml-auto rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-400">已有官方翻译</span>
              <span v-else-if="option.state === 'manual'" class="ml-auto rounded-full border border-dashed border-violet-200 bg-violet-50 px-2 py-px text-[11px] font-semibold text-violet-700">已添加，打开</span>
            </button>
          </li>
          <li v-if="!options.length" class="px-3 py-4 text-center text-xs text-slate-400">没有匹配的语言</li>
        </ul>
      </div>

      <!-- Step 2: the title -->
      <form v-else key="title" class="space-y-3 p-5" @submit.prevent="create">
        <div>
          <p class="text-xs text-slate-500">原文</p>
          <p class="mt-1 text-[13px] text-slate-900">{{ detail.name }}</p>
        </div>
        <div>
          <label for="add-translation-title" class="mb-1.5 block text-xs font-medium text-slate-700">{{ adminLanguageName(picked) }}标题</label>
          <input id="add-translation-title" v-model="title" maxlength="255" class="admin-input" />
          <p class="mt-1.5 text-xs text-slate-400">先填标题就能创建，分组和奖杯可以之后慢慢补。</p>
        </div>
        <AdminError :error="error" />
      </form>
    </Transition>
    <template v-if="picked" #footer>
      <div class="flex items-center gap-2">
        <button type="button" class="admin-button" @click="picked = null"><LucideIcon :icon="ArrowLeft" class="size-3.5" />换语言</button>
        <button type="button" class="admin-button admin-primary ml-auto" :disabled="!title.trim() || busy" @click="create">{{ busy ? '正在创建…' : '创建' }}</button>
      </div>
    </template>
  </Dialog>
</template>
