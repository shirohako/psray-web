<script setup lang="ts">
/**
 * Public API reference: a few common read-only endpoints, laid out in three
 * columns (section nav, prose, dark code column). Endpoint data, samples and
 * Try it requests all come from `~/utils/apiDocs`; samples point at this
 * deployment's API (`runtimeConfig.public.apiBase`).
 */
import {
  BookMarked,
  Braces,
  Clock,
  Compass,
  Copy,
  Gamepad2,
  Globe,
  KeyRound,
  Layers,
  LibraryBig,
  MessageSquare,
  Network,
  RefreshCw,
  Route,
  ShieldCheck,
  Timer,
  UserRound,
  type IconNode,
} from 'lucide'
import {
  API_ENDPOINTS,
  API_ERROR_CODES,
  API_ERROR_EXAMPLES,
  API_GROUPS,
  curlCommand,
  exampleValues,
  fetchSnippet,
  type ApiGroupId,
} from '~/utils/apiDocs'

definePageMeta({ wide: true })

const { t } = useI18n()

useSeo({
  title: () => t('apiDocs.seoTitle'),
  description: () => t('apiDocs.seoDescription'),
})

const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
const copyText = useCopyText()

const GROUP_ICONS: Record<ApiGroupId, IconNode> = {
  trophies: Gamepad2,
  profile: UserRound,
  games: LibraryBig,
  series: Layers,
}

interface NavItem { id: string, labelKey: string, method?: string }
interface NavGroup { id: string, labelKey: string, icon: IconNode, items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    id: 'overview',
    labelKey: 'apiDocs.nav.overview',
    icon: Compass,
    items: [
      { id: 'introduction', labelKey: 'apiDocs.sections.introduction' },
      { id: 'responses', labelKey: 'apiDocs.sections.responses' },
      { id: 'languages', labelKey: 'apiDocs.sections.languages' },
    ],
  },
  ...API_GROUPS.map(group => ({
    id: group.id,
    labelKey: group.labelKey,
    icon: GROUP_ICONS[group.id],
    items: API_ENDPOINTS
      .filter(endpoint => endpoint.group === group.id)
      .map(endpoint => ({ id: endpoint.id, labelKey: endpoint.titleKey, method: endpoint.method })),
  })),
  {
    id: 'reference',
    labelKey: 'apiDocs.nav.reference',
    icon: BookMarked,
    items: [
      { id: 'errors', labelKey: 'apiDocs.sections.errors' },
      { id: 'usage', labelKey: 'apiDocs.sections.usage' },
    ],
  },
]

// Same order as the sections on the page, which the scroll spy relies on.
const activeId = useActiveSection(navGroups.flatMap(group => group.items.map(item => item.id)))

const groupLabel = (id: ApiGroupId) => t(API_GROUPS.find(group => group.id === id)!.labelKey)

// Quick start: the trophy set detail request.
const quickStartEndpoint = API_ENDPOINTS.find(endpoint => endpoint.id === 'trophies-show')!
const quickStart = {
  curl: curlCommand(base, quickStartEndpoint, exampleValues(quickStartEndpoint)),
  js: fetchSnippet(base, quickStartEndpoint, exampleValues(quickStartEndpoint)),
}
const quickStartTab = ref('curl')

const responseTab = ref('list')
const LIST_SHAPE = `{
  "data": [ … ],
  "meta": {
    "page": 1,
    "per_page": 24,
    "total": 35,
    "total_pages": 2
  }
}`
const responseSamples: Record<string, string> = {
  list: LIST_SHAPE,
  error: JSON.stringify(API_ERROR_EXAMPLES.validation, null, 2),
}

const languageTab = ref('query')
const languageSamples: Record<string, string> = {
  query: `curl '${base}/trophies/5059?lang=ja'`,
  header: `curl '${base}/trophies/5059' \\\n  -H 'Accept-Language: zh-TW,ja;q=0.8,en;q=0.5'`,
}

const notFoundSample = JSON.stringify(API_ERROR_EXAMPLES.notFound, null, 2)

const introPoints: { icon: IconNode, textKey: string }[] = [
  { icon: Route, textKey: 'apiDocs.intro.points.noPrefix' },
  { icon: KeyRound, textKey: 'apiDocs.intro.points.noAuth' },
  { icon: Braces, textKey: 'apiDocs.intro.points.json' },
  { icon: Globe, textKey: 'apiDocs.intro.points.cors' },
]

const usageItems: { icon: IconNode, textKey: string }[] = [
  { icon: Timer, textKey: 'apiDocs.usage.items.cache' },
  { icon: RefreshCw, textKey: 'apiDocs.usage.items.fields' },
  { icon: ShieldCheck, textKey: 'apiDocs.usage.items.data' },
]

const statusTone = (status: number) => status >= 500
  ? 'bg-rose-50 text-rose-700 ring-rose-200'
  : 'bg-amber-50 text-amber-700 ring-amber-200'
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
    <!-- Section nav: a scrolling strip on small screens, a sticky column from lg -->
    <nav :aria-label="$t('apiDocs.nav.label')" class="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
      <ul class="flex min-w-max gap-1">
        <template v-for="group in navGroups" :key="group.id">
          <li v-for="item in group.items" :key="item.id">
            <a
              :href="`#${item.id}`"
              :aria-current="activeId === item.id ? 'location' : undefined"
              class="block rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200"
              :class="activeId === item.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
            >
              {{ $t(item.labelKey) }}
            </a>
          </li>
        </template>
      </ul>
    </nav>

    <nav :aria-label="$t('apiDocs.nav.label')" class="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
      <div v-for="group in navGroups" :key="group.id" class="not-first:mt-3">
        <p class="flex items-center gap-1.5 px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <LucideIcon :icon="group.icon" class="size-3.5" />
          {{ $t(group.labelKey) }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.id">
            <a
              :href="`#${item.id}`"
              :aria-current="activeId === item.id ? 'location' : undefined"
              class="nav-link relative flex items-center gap-2 rounded-lg py-1.5 pl-4 pr-2 text-[13px] font-medium transition-all duration-200"
              :class="activeId === item.id ? 'translate-x-1 bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'"
            >
              <span
                aria-hidden="true"
                class="absolute inset-y-1 left-0 w-1 rounded-full bg-slate-950 transition-all duration-200"
                :class="activeId === item.id ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0'"
              />
              <span v-if="item.method" class="w-6 shrink-0 font-mono text-[9.5px] font-semibold text-emerald-700">{{ item.method }}</span>
              <span class="truncate">{{ $t(item.labelKey) }}</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <article class="@container overflow-clip rounded-2xl border border-slate-200 bg-white shadow-sm">
      <!-- Introduction -->
      <DocsApiSection id="introduction">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Developers</p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">PSRay API</h1>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{{ $t('apiDocs.lead') }}</p>

        <div class="mt-4 flex flex-wrap gap-1.5">
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <LucideIcon :icon="BookMarked" class="size-3" />{{ $t('apiDocs.chips.readOnly') }}
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
            <LucideIcon :icon="KeyRound" class="size-3" />{{ $t('apiDocs.chips.noKey') }}
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
            <LucideIcon :icon="Braces" class="size-3" />JSON
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
            <LucideIcon :icon="Globe" class="size-3" />{{ $t('apiDocs.chips.cors') }}
          </span>
        </div>

        <div class="mt-6 flex max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-2">
          <LucideIcon :icon="Network" class="size-4 shrink-0 text-slate-400" />
          <span class="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">Base URL</span>
          <code class="min-w-0 flex-1 truncate font-mono text-sm font-medium text-slate-900">{{ base }}</code>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            @click="copyText(base, 'Base URL')"
          >
            <LucideIcon :icon="Copy" class="size-3.5" />
            {{ $t('apiDocs.copy.button') }}
          </button>
        </div>

        <ul class="mt-6 grid gap-3 sm:grid-cols-2">
          <li v-for="{ icon, textKey } in introPoints" :key="textKey" class="flex gap-3 rounded-xl border border-slate-100 bg-white p-3.5">
            <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <LucideIcon :icon="icon" class="size-4" />
            </span>
            <i18n-t :keypath="textKey" scope="global" tag="p" class="text-[13px] leading-6 text-slate-600">
              <template #prefix><code class="rounded bg-slate-100 px-1 font-mono text-[12px] text-slate-800">/api</code></template>
            </i18n-t>
          </li>
        </ul>

        <template #code>
          <DocsApiCodePanel
            v-model="quickStartTab"
            :tabs="[{ id: 'curl', label: 'cURL' }, { id: 'js', label: 'JavaScript' }]"
            :copy-text="quickStartTab === 'curl' ? quickStart.curl : quickStart.js"
            :copy-label="quickStartTab === 'curl' ? 'cURL' : 'JavaScript'"
          >
            <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ $t('apiDocs.intro.quickStart') }}</p>
            <DocsApiCode :code="quickStartTab === 'curl' ? quickStart.curl : quickStart.js" :language="quickStartTab === 'curl' ? 'bash' : 'js'" />
          </DocsApiCodePanel>
        </template>
      </DocsApiSection>

      <!-- Response format -->
      <DocsApiSection id="responses">
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Responses</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-950">{{ $t('apiDocs.sections.responses') }}</h2>
        <div class="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-slate-600">
          <i18n-t keypath="apiDocs.responses.success" scope="global" tag="p">
            <template #data><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">data</code></template>
            <template #meta><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">meta</code></template>
          </i18n-t>
          <i18n-t keypath="apiDocs.responses.failure" scope="global" tag="p">
            <template #error><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">error</code></template>
            <template #code><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">error.code</code></template>
            <template #message><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">error.message</code></template>
            <template #details><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">error.details</code></template>
          </i18n-t>
          <i18n-t keypath="apiDocs.responses.requestId" scope="global" tag="p">
            <template #header><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">X-Request-Id</code></template>
            <template #field><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">request_id</code></template>
          </i18n-t>
          <i18n-t keypath="apiDocs.responses.time" scope="global" tag="p">
            <template #example><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">2026-08-10T15:23:07.000000Z</code></template>
          </i18n-t>
        </div>

        <template #code>
          <DocsApiCodePanel
            v-model="responseTab"
            :tabs="[{ id: 'list', label: $t('apiDocs.responses.list') }, { id: 'error', label: $t('apiDocs.responses.error') }]"
            :copy-text="responseSamples[responseTab]"
            copy-label="JSON"
          >
            <template #actions>
              <span
                class="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ring-1"
                :class="responseTab === 'list' ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30' : 'bg-amber-400/10 text-amber-300 ring-amber-400/30'"
              >{{ responseTab === 'list' ? 200 : 422 }}</span>
            </template>
            <DocsApiCode :code="responseSamples[responseTab] ?? ''" language="json" line-numbers />
          </DocsApiCodePanel>
        </template>
      </DocsApiSection>

      <!-- Display language -->
      <DocsApiSection id="languages">
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Languages</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-950">{{ $t('apiDocs.sections.languages') }}</h2>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{{ $t('apiDocs.languages.body') }}</p>
        <ol class="mt-4 max-w-3xl space-y-2">
          <li v-for="(step, i) in ['query', 'header', 'fallback']" :key="step" class="flex items-start gap-3 text-sm leading-7 text-slate-600">
            <span aria-hidden="true" class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{{ i + 1 }}</span>
            <i18n-t :keypath="`apiDocs.languages.steps.${step}`" scope="global" tag="span">
              <template #lang><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">lang</code></template>
              <template #example><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">?lang=zh-Hans</code></template>
              <template #header><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">Accept-Language</code></template>
            </i18n-t>
          </li>
        </ol>
        <div class="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-slate-600">
          <i18n-t keypath="apiDocs.languages.normalize" scope="global" tag="p">
            <template #tw><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">zh-TW</code></template>
            <template #hant><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">zh-Hant</code></template>
            <template #cn><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">zh-CN</code></template>
            <template #hans><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">zh-Hans</code></template>
          </i18n-t>
          <i18n-t keypath="apiDocs.languages.field" scope="global" tag="p">
            <template #field><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">display_language</code></template>
            <template #name><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">name</code></template>
            <template #localized><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">localized_name</code></template>
          </i18n-t>
        </div>

        <template #code>
          <DocsApiCodePanel
            v-model="languageTab"
            :tabs="[{ id: 'query', label: '?lang=' }, { id: 'header', label: 'Accept-Language' }]"
            :copy-text="languageSamples[languageTab]"
            copy-label="cURL"
          >
            <DocsApiCode :code="languageSamples[languageTab] ?? ''" language="bash" />
          </DocsApiCodePanel>
        </template>
      </DocsApiSection>

      <!-- Endpoints -->
      <DocsApiEndpoint
        v-for="endpoint in API_ENDPOINTS"
        :key="endpoint.id"
        :endpoint="endpoint"
        :base="base"
        :group-label="groupLabel(endpoint.group)"
      />

      <!-- Error codes -->
      <DocsApiSection id="errors">
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Errors</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-950">{{ $t('apiDocs.sections.errors') }}</h2>
        <i18n-t keypath="apiDocs.errors.body" scope="global" tag="p" class="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          <template #code><code class="rounded bg-slate-100 px-1 font-mono text-[12.5px] text-slate-800">error.code</code></template>
        </i18n-t>
        <ul class="mt-5 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          <li v-for="error in API_ERROR_CODES" :key="error.code" class="grid items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:grid-cols-[3.5rem_minmax(0,14rem)_minmax(0,1fr)]">
            <span class="w-fit rounded-full px-2 py-px font-mono text-[11px] font-semibold ring-1" :class="statusTone(error.status)">{{ error.status }}</span>
            <code class="font-mono text-[13px] font-medium break-all text-slate-900">{{ error.code }}</code>
            <p class="text-[13px] leading-6 text-slate-600">{{ $t(error.descKey) }}</p>
          </li>
        </ul>

        <template #code>
          <DocsApiCodePanel :tabs="[{ id: 'not-found', label: $t('apiDocs.responses.error') }]" :copy-text="notFoundSample" copy-label="JSON">
            <template #actions>
              <span class="rounded-full bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30">404</span>
            </template>
            <DocsApiCode :code="notFoundSample" language="json" line-numbers />
          </DocsApiCodePanel>
        </template>
      </DocsApiSection>

      <!-- Usage notes -->
      <DocsApiSection id="usage">
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Usage</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-950">{{ $t('apiDocs.sections.usage') }}</h2>
        <ul class="mt-5 max-w-3xl space-y-3">
          <li v-for="item in usageItems" :key="item.textKey" class="flex gap-3 text-sm leading-7 text-slate-600">
            <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <LucideIcon :icon="item.icon" class="size-4" />
            </span>
            <span>{{ $t(item.textKey) }}</span>
          </li>
          <li class="flex gap-3 text-sm leading-7 text-slate-600">
            <span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <LucideIcon :icon="MessageSquare" class="size-4" />
            </span>
            <i18n-t keypath="apiDocs.usage.items.feedback" scope="global" tag="span">
              <template #link>
                <AppLink to="/feedback" class="font-semibold text-sky-700 underline-offset-2 hover:underline">{{ $t('apiDocs.usage.feedbackLink') }}</AppLink>
              </template>
            </i18n-t>
          </li>
        </ul>
        <p class="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
          <LucideIcon :icon="Clock" class="size-3.5" />
          {{ $t('apiDocs.usage.stability') }}
        </p>
      </DocsApiSection>
    </article>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .nav-link > span {
    transition: none;
  }
}
</style>
