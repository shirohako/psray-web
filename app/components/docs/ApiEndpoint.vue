<script setup lang="ts">
/**
 * One endpoint on /docs/api: description, parameters, common fields and
 * errors on the left; the request in cURL / JavaScript, the sample response
 * and Try it in the dark column.
 */
import { ChevronRight, ListOrdered, Play, Unlock } from 'lucide'
import { curlCommand, exampleValues, fetchSnippet, type ApiEndpoint } from '~/utils/apiDocs'

const props = defineProps<{
  endpoint: ApiEndpoint
  base: string
  groupLabel: string
}>()

const { t } = useI18n()

const samples = computed(() => {
  const values = exampleValues(props.endpoint)
  return {
    curl: curlCommand(props.base, props.endpoint, values),
    js: fetchSnippet(props.base, props.endpoint, values),
  }
})

const requestTab = ref('curl')
const requestTabs = [
  { id: 'curl', label: 'cURL' },
  { id: 'js', label: 'JavaScript' },
]

const responseTab = ref('example')
const responseTabs = computed(() => [
  { id: 'example', label: t('apiDocs.endpoint.example') },
  { id: 'try', label: t('apiDocs.endpoint.tryIt') },
])
const exampleJson = computed(() => JSON.stringify(props.endpoint.example, null, 2))

/** The path with `{param}` segments picked out for styling. */
const pathParts = computed(() => props.endpoint.path.split(/(\{\w+\})/).filter(Boolean))
</script>

<template>
  <DocsApiSection :id="endpoint.id">
    <p aria-hidden="true" class="flex items-center gap-1.5 text-xs text-slate-400">
      <span>{{ groupLabel }}</span>
      <LucideIcon :icon="ChevronRight" class="size-3 text-slate-300" />
      <span>{{ $t(endpoint.titleKey) }}</span>
    </p>
    <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ $t(endpoint.titleKey) }}</h2>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span class="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">{{ endpoint.method }}</span>
      <code class="font-mono text-[15px] font-medium text-slate-900"><template v-for="(part, i) in pathParts" :key="i"><span v-if="part.startsWith('{')" class="text-sky-700">{{ part }}</span><template v-else>{{ part }}</template></template></code>
      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <LucideIcon :icon="Unlock" class="size-3" />
        {{ $t('apiDocs.endpoint.public') }}
      </span>
      <span v-if="endpoint.paginated" class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
        <LucideIcon :icon="ListOrdered" class="size-3" />
        {{ $t('apiDocs.endpoint.paginated') }}
      </span>
    </div>

    <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{{ $t(endpoint.descKey) }}</p>

    <h3 class="mt-8 text-sm font-bold text-slate-900">{{ $t('apiDocs.endpoint.params') }}</h3>
    <div class="mt-3 overflow-hidden rounded-xl border border-slate-200">
      <div class="hidden grid-cols-[9.5rem_4.5rem_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-500 sm:grid">
        <span>{{ $t('apiDocs.endpoint.columns.name') }}</span>
        <span>{{ $t('apiDocs.endpoint.columns.location') }}</span>
        <span>{{ $t('apiDocs.endpoint.columns.description') }}</span>
      </div>
      <ul class="divide-y divide-slate-100">
        <li v-for="param in endpoint.params" :key="param.name" class="grid gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[9.5rem_4.5rem_minmax(0,1fr)]">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-start">
            <code class="font-mono text-[13px] font-medium text-slate-900">{{ param.name }}</code>
            <span class="rounded-full bg-slate-100 px-2 py-px font-mono text-[10.5px] text-slate-500">{{ param.type }}</span>
          </div>
          <div class="hidden sm:block">
            <span
              class="inline-block rounded-full px-2 py-px text-[11px] font-semibold ring-1"
              :class="param.in === 'path' ? 'bg-violet-50 text-violet-700 ring-violet-200' : 'bg-sky-50 text-sky-700 ring-sky-200'"
            >
              {{ $t(param.in === 'path' ? 'apiDocs.endpoint.location.path' : 'apiDocs.endpoint.location.query') }}
            </span>
          </div>
          <div class="min-w-0 space-y-1.5 text-[13px] leading-6 text-slate-600">
            <p>
              <span v-if="param.required" class="mr-1.5 inline-block rounded-full bg-rose-50 px-2 py-px align-[1px] text-[11px] font-semibold leading-4 text-rose-700 ring-1 ring-rose-200">{{ $t('apiDocs.endpoint.required') }}</span>
              {{ $t(param.descKey, param.descArgs ?? {}) }}
            </p>
            <div v-if="param.options || param.default" class="flex flex-wrap items-center gap-1.5">
              <span v-if="param.default" class="rounded-md bg-slate-100 px-1.5 py-px text-[11px] text-slate-500">
                {{ $t('apiDocs.endpoint.default') }} <code class="font-mono text-slate-700">{{ param.default }}</code>
              </span>
              <code v-for="option in param.options" :key="option" class="rounded-md border border-slate-200 px-1.5 py-px font-mono text-[11px] text-slate-600">{{ option }}</code>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <h3 class="mt-8 text-sm font-bold text-slate-900">{{ $t('apiDocs.endpoint.fields') }}</h3>
    <p class="mt-1 text-xs text-slate-500">{{ $t('apiDocs.endpoint.fieldsNote') }}</p>
    <ul class="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
      <li v-for="field in endpoint.fields" :key="field.name" class="grid gap-x-3 gap-y-1 px-4 py-2.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <code class="font-mono text-[13px] font-medium break-all text-slate-900">{{ field.name }}</code>
          <span class="rounded-full bg-slate-100 px-2 py-px font-mono text-[10.5px] text-slate-500">{{ field.type }}</span>
        </div>
        <p class="text-[13px] leading-6 text-slate-600">{{ $t(field.descKey) }}</p>
      </li>
    </ul>

    <h3 class="mt-8 text-sm font-bold text-slate-900">{{ $t('apiDocs.endpoint.errors') }}</h3>
    <div class="mt-3 flex flex-wrap gap-2">
      <span v-for="error in endpoint.errors" :key="error.code" class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 py-0.5 pl-1 pr-2.5 font-mono text-[11px] text-rose-700 ring-1 ring-rose-200">
        <span class="rounded-full bg-white px-1.5 font-semibold">{{ error.status }}</span>
        {{ error.code }}
      </span>
      <a href="#errors" class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-500 underline-offset-2 transition-colors hover:text-slate-900 hover:underline">
        {{ $t('apiDocs.endpoint.allErrors') }}
      </a>
    </div>

    <template #code>
      <DocsApiCodePanel
        v-model="requestTab"
        class="shrink-0"
        :tabs="requestTabs"
        :copy-text="requestTab === 'curl' ? samples.curl : samples.js"
        :copy-label="requestTab === 'curl' ? 'cURL' : 'JavaScript'"
      >
        <DocsApiCode v-if="requestTab === 'curl'" :code="samples.curl" language="bash" />
        <DocsApiCode v-else :code="samples.js" language="js" />
      </DocsApiCodePanel>

      <DocsApiCodePanel
        v-model="responseTab"
        class="max-h-[34rem] flex-1 @4xl:max-h-none"
        :tabs="responseTabs"
        :copy-text="responseTab === 'example' ? exampleJson : undefined"
        copy-label="JSON"
      >
        <template v-if="responseTab === 'example'" #actions>
          <span class="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">200</span>
        </template>
        <DocsApiCode v-show="responseTab === 'example'" :code="exampleJson" language="json" line-numbers />
        <DocsApiTryIt v-show="responseTab === 'try'" :endpoint="endpoint" :base="base" />
      </DocsApiCodePanel>

      <button
        v-if="responseTab === 'example'"
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        @click="responseTab = 'try'"
      >
        <LucideIcon :icon="Play" class="size-3.5" />
        {{ $t('apiDocs.endpoint.tryThis') }}
      </button>
    </template>
  </DocsApiSection>
</template>
