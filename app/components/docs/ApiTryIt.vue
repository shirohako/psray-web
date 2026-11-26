<script setup lang="ts">
/**
 * "Try it" for one endpoint: editable parameters prefilled with the sample
 * values, then a real request from the browser. It calls the API with plain
 * `fetch` rather than the app's `$api`, so the reader's session token is never
 * attached and every response, errors included, is shown as the API sent it.
 */
import { CircleAlert, CircleCheck, FileJson, LoaderCircle, Send, Timer, X } from 'lucide'
import { exampleValues, missingPathParams, requestUrl, type ApiEndpoint } from '~/utils/apiDocs'

const props = defineProps<{
  endpoint: ApiEndpoint
  base: string
}>()

const { t, locale } = useI18n()
const copyText = useCopyText()

const values = reactive(exampleValues(props.endpoint))
// Show the reader's own language unless the sample sets one.
if ('lang' in values && !values.lang) values.lang = locale.value

const url = computed(() => requestUrl(props.base, props.endpoint, values))
const missing = computed(() => missingPathParams(props.endpoint, values))
const host = computed(() => {
  try { return new URL(props.base).host } catch { return props.base }
})

interface Result {
  status: number
  ok: boolean
  ms: number
  bytes: number
  text: string
  json: unknown
  isJson: boolean
}

const loading = ref(false)
const result = shallowRef<Result | null>(null)
const failure = ref('')
const view = ref<'tree' | 'raw'>('tree')
let controller: AbortController | undefined

async function send() {
  if (missing.value.length || loading.value) return
  controller = new AbortController()
  loading.value = true
  failure.value = ''
  const started = performance.now()
  try {
    const res = await fetch(url.value, { signal: controller.signal, headers: { Accept: 'application/json' } })
    const text = await res.text()
    let json: unknown = null
    let isJson = true
    try { json = JSON.parse(text) } catch { isJson = false }
    result.value = {
      status: res.status,
      ok: res.ok,
      ms: Math.round(performance.now() - started),
      bytes: new TextEncoder().encode(text).length,
      text,
      json,
      isJson,
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      result.value = null
      failure.value = t('apiDocs.tryIt.networkError')
    }
  } finally {
    loading.value = false
    controller = undefined
  }
}

function cancel() {
  controller?.abort()
}

onBeforeUnmount(cancel)

const pretty = computed(() => {
  const r = result.value
  if (!r) return ''
  return r.isJson ? JSON.stringify(r.json, null, 2) : r.text
})

const statusTone = computed(() => {
  const status = result.value?.status ?? 0
  if (status < 300) return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30'
  if (status < 500) return 'bg-amber-400/10 text-amber-300 ring-amber-400/30'
  return 'bg-rose-400/10 text-rose-300 ring-rose-400/30'
})

function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function inputId(name: string) {
  return `try-${props.endpoint.id}-${name.replace(/\W/g, '')}`
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs leading-5 text-slate-400">
      <i18n-t keypath="apiDocs.tryIt.hint" scope="global" tag="span">
        <template #host><span class="font-mono text-slate-200">{{ host }}</span></template>
      </i18n-t>
    </p>

    <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="send">
      <div v-for="param in endpoint.params" :key="param.name" class="min-w-0">
        <label :for="inputId(param.name)" class="mb-1 flex items-center gap-1.5 text-[11px]">
          <span class="font-mono font-medium text-slate-200">{{ param.name }}</span>
          <span class="text-slate-500">{{ $t(param.in === 'path' ? 'apiDocs.endpoint.location.path' : 'apiDocs.endpoint.location.query') }}</span>
          <span v-if="param.required" class="text-rose-300">*</span>
        </label>
        <input
          :id="inputId(param.name)"
          v-model="values[param.name]"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :list="param.options ? `${inputId(param.name)}-options` : undefined"
          :placeholder="param.name.endsWith('[]') ? 'PS5,PS4' : param.default ?? ''"
          :aria-describedby="param.name.endsWith('[]') ? `${inputId(param.name)}-hint` : undefined"
          class="h-8 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-600 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
        >
        <datalist v-if="param.options" :id="`${inputId(param.name)}-options`">
          <option v-for="option in param.options" :key="option" :value="option" />
        </datalist>
        <p v-if="param.name.endsWith('[]')" :id="`${inputId(param.name)}-hint`" class="mt-1 text-[11px] text-slate-500">{{ $t('apiDocs.tryIt.multiple') }}</p>
      </div>

      <div class="flex min-w-0 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-2.5 pr-1.5 sm:col-span-2">
        <span class="shrink-0 rounded bg-emerald-400/10 px-1.5 font-mono text-[10px] font-semibold leading-5 text-emerald-300">GET</span>
        <span class="min-w-0 flex-1 truncate font-mono text-[11.5px] text-slate-300" :title="url">{{ url }}</span>
        <button
          v-if="!loading"
          type="submit"
          :disabled="missing.length > 0"
          class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-sky-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          <LucideIcon :icon="Send" class="size-3.5" />
          {{ $t('apiDocs.tryIt.send') }}
        </button>
        <button
          v-else
          type="button"
          class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-slate-600 px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-400"
          @click="cancel"
        >
          <LucideIcon :icon="X" class="size-3.5" />
          {{ $t('apiDocs.tryIt.cancel') }}
        </button>
      </div>
      <p v-if="missing.length" class="-mt-1 text-[11px] text-amber-300 sm:col-span-2">
        {{ $t('apiDocs.tryIt.missing', { names: missing.join(', ') }) }}
      </p>
    </form>

    <div aria-live="polite">
      <div v-if="loading && !result" class="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-6 text-xs text-slate-400">
        <LucideIcon :icon="LoaderCircle" class="size-4 animate-spin motion-reduce:animate-none" />
        {{ $t('apiDocs.tryIt.sending') }}
      </div>

      <p v-else-if="failure" class="flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-xs leading-5 text-rose-200">
        <LucideIcon :icon="CircleAlert" class="mt-0.5 size-3.5 shrink-0" />
        {{ failure }}
      </p>

      <div v-else-if="result" class="space-y-2.5 transition-opacity duration-150" :class="loading ? 'opacity-50' : ''">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ring-1" :class="statusTone">
            <LucideIcon :icon="result.ok ? CircleCheck : CircleAlert" class="size-3" />
            {{ result.status }}
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
            <LucideIcon :icon="Timer" class="size-3 text-slate-500" />
            {{ result.ms }} ms
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
            <LucideIcon :icon="FileJson" class="size-3 text-slate-500" />
            {{ formatBytes(result.bytes) }}
          </span>
          <span class="flex-1" />
          <div v-if="result.isJson" role="tablist" class="flex gap-0.5 rounded-md bg-slate-950/60 p-0.5">
            <button
              v-for="mode in (['tree', 'raw'] as const)"
              :key="mode"
              type="button"
              role="tab"
              :aria-selected="view === mode"
              class="rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
              :class="view === mode ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'"
              @click="view = mode"
            >
              {{ $t(mode === 'tree' ? 'apiDocs.tryIt.tree' : 'apiDocs.tryIt.raw') }}
            </button>
          </div>
          <button
            type="button"
            class="rounded-md border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-100"
            @click="copyText(pretty, 'JSON')"
          >
            {{ $t('apiDocs.copy.button') }}
          </button>
        </div>

        <div class="max-h-[28rem] overflow-auto rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-6 pr-3">
          <DocsApiJsonNode v-if="result.isJson && view === 'tree'" :value="result.json" />
          <pre v-else class="font-mono text-[12px] leading-5 whitespace-pre-wrap break-all text-slate-300">{{ pretty }}</pre>
        </div>
      </div>

      <p v-else class="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-xs text-slate-500">
        {{ $t('apiDocs.tryIt.empty') }}
      </p>
    </div>
  </div>
</template>
