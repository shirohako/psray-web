<script setup lang="ts">
import {
  BookOpen,
  Bug,
  CircleHelp,
  Code2,
  Database,
  ExternalLink,
  FileText,
  FilePenLine,
  Languages,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
} from 'lucide'

const { t, locale } = useI18n()

const updatedAt = '2026-08-12'

const toc = computed(() => [
  { id: 'about', labelKey: 'about.toc.about' },
  { id: 'policies', labelKey: 'about.toc.policies' },
  { id: 'data', labelKey: 'about.toc.data' },
  { id: 'removal', labelKey: 'about.toc.removal' },
  { id: 'contact', labelKey: 'about.toc.contact' },
  { id: 'docs', labelKey: 'about.toc.docs' },
  { id: 'faq', labelKey: 'about.toc.faq' },
  { id: 'open-source', labelKey: 'about.toc.openSource' },
].map(item => ({ id: item.id, label: t(item.labelKey) })))

const faqs = [
  { questionKey: 'about.faq.items.official.question', answerKey: 'about.faq.items.official.answer' },
  { questionKey: 'about.faq.items.account.question', answerKey: 'about.faq.items.account.answer' },
  { questionKey: 'about.faq.items.notFound.question', answerKey: 'about.faq.items.notFound.answer' },
  { questionKey: 'about.faq.items.outdated.question', answerKey: 'about.faq.items.outdated.answer' },
  { questionKey: 'about.faq.items.private.question', answerKey: 'about.faq.items.private.answer' },
  { questionKey: 'about.faq.items.relisting.question', answerKey: 'about.faq.items.relisting.answer' },
  { questionKey: 'about.faq.items.report.question', answerKey: 'about.faq.items.report.answer' },
  { questionKey: 'about.faq.items.tips.question', answerKey: 'about.faq.items.tips.answer' },
  { questionKey: 'about.faq.items.api.question', answerKey: 'about.faq.items.api.answer' },
]

// /terms and /privacy exist in Japanese only; say so before the click.
const policiesJapaneseOnly = computed(() => locale.value !== 'ja')

const faqNumberClasses = [
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

const openFaqs = ref(new Set<number>())

function toggleFaq(index: number) {
  const next = new Set(openFaqs.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  openFaqs.value = next
}

function mailto(subject: string) {
  return `mailto:ame@abyss.moe?subject=${encodeURIComponent(`[PSRay] ${subject}`)}`
}

useSeo({
  title: () => t('about.seoTitle'),
  description: () => t('about.seoDescription'),
})
</script>

<template>
  <StaticPageLayout
    class="px-1 py-2 sm:px-0 sm:py-0"
    eyebrow="About PSRay"
    :title="t('about.title')"
    :lead="t('about.lead')"
    :updated-at="updatedAt"
    :items="toc"
  >
    <section id="about" class="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="flex items-center gap-3">
        <span class="grid size-12 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <img src="/logo.svg" alt="PSRay" class="size-full object-contain" />
        </span>
        <h2 class="text-xl font-bold tracking-tight text-slate-950">{{ t('about.intro.title') }}</h2>
      </div>
      <div class="mt-4 space-y-3 text-sm leading-7 text-slate-600">
        <p>{{ t('about.intro.mission') }}</p>
        <p>{{ t('about.intro.ai') }}</p>
        <p>{{ t('about.intro.disclaimer') }}</p>
      </div>
    </section>

    <section id="policies" class="scroll-mt-24 space-y-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Policies</p>
        <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-950">{{ t('about.policies.title') }}</h2>
        <p class="mt-2 text-sm leading-7 text-slate-500">{{ t('about.policies.lead') }}</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <AppLink to="/terms" class="group rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <LucideIcon :icon="FileText" class="size-5 text-amber-700" />
          <div class="mt-3 flex items-center justify-between gap-3">
            <h3 class="font-bold text-slate-900">{{ t('about.policies.terms.title') }}</h3>
            <span class="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden="true">→</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('about.policies.terms.body') }}</p>
          <span v-if="policiesJapaneseOnly" class="mt-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
            <LucideIcon :icon="Languages" class="size-3" />
            {{ t('about.policies.japaneseOnly') }}
          </span>
        </AppLink>
        <AppLink to="/privacy" class="group rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <LucideIcon :icon="ShieldCheck" class="size-5 text-emerald-700" />
          <div class="mt-3 flex items-center justify-between gap-3">
            <h3 class="font-bold text-slate-900">{{ t('about.policies.privacy.title') }}</h3>
            <span class="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden="true">→</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('about.policies.privacy.body') }}</p>
          <span v-if="policiesJapaneseOnly" class="mt-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
            <LucideIcon :icon="Languages" class="size-3" />
            {{ t('about.policies.japaneseOnly') }}
          </span>
        </AppLink>
      </div>
    </section>

    <section id="data" class="scroll-mt-24 space-y-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Data</p>
        <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-950">{{ t('about.data.title') }}</h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <article class="rounded-xl border border-sky-200 bg-sky-50/60 p-5 shadow-sm shadow-sky-900/5">
          <span class="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700"><LucideIcon :icon="Database" class="size-4.5" /></span>
          <h3 class="mt-3 font-bold text-slate-900">{{ t('about.data.collection.title') }}</h3>
          <p class="mt-2 text-sm leading-7 text-slate-600">{{ t('about.data.collection.body') }}</p>
        </article>
        <article class="rounded-xl border border-cyan-200 bg-cyan-50/60 p-5 shadow-sm shadow-cyan-900/5">
          <span class="grid size-9 place-items-center rounded-lg bg-cyan-100 text-cyan-700"><LucideIcon :icon="RefreshCw" class="size-4.5" /></span>
          <h3 class="mt-3 font-bold text-slate-900">{{ t('about.data.updates.title') }}</h3>
          <p class="mt-2 text-sm leading-7 text-slate-600">{{ t('about.data.updates.body') }}</p>
        </article>
      </div>
      <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        {{ t('about.data.notice') }}
      </div>
    </section>

    <section id="removal" class="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="flex items-center gap-3">
        <LucideIcon :icon="ShieldCheck" class="size-5 text-emerald-700" />
        <h2 class="text-xl font-bold tracking-tight text-slate-950">{{ t('about.removal.title') }}</h2>
      </div>
      <p class="mt-3 text-sm leading-7 text-slate-600">{{ t('about.removal.lead') }}</p>
      <ol class="mt-5 grid gap-3 sm:grid-cols-3">
        <li class="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
          <span class="text-xs font-bold text-sky-700">01</span>
          <h3 class="mt-1 text-sm font-bold text-slate-900">{{ t('about.removal.steps.request.title') }}</h3>
          <p class="mt-1.5 text-xs leading-6 text-slate-500">{{ t('about.removal.steps.request.body') }}</p>
        </li>
        <li class="rounded-xl border border-violet-100 bg-violet-50/80 p-4">
          <span class="text-xs font-bold text-violet-700">02</span>
          <h3 class="mt-1 text-sm font-bold text-slate-900">{{ t('about.removal.steps.verify.title') }}</h3>
          <p class="mt-1.5 text-xs leading-6 text-slate-500">{{ t('about.removal.steps.verify.body') }}</p>
        </li>
        <li class="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <span class="text-xs font-bold text-emerald-700">03</span>
          <h3 class="mt-1 text-sm font-bold text-slate-900">{{ t('about.removal.steps.hide.title') }}</h3>
          <p class="mt-1.5 text-xs leading-6 text-slate-500">{{ t('about.removal.steps.hide.body') }}</p>
        </li>
      </ol>
      <div class="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-bold text-slate-900">{{ t('about.removal.password.title') }}</p>
          <p class="mt-1 text-xs leading-5 text-slate-500">{{ t('about.removal.password.body') }}</p>
        </div>
        <a :href="mailto(t('about.removal.mailSubject'))" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
          <LucideIcon :icon="Mail" class="size-4" />
          {{ t('about.removal.cta') }}
        </a>
      </div>
    </section>

    <section id="contact" class="scroll-mt-24 space-y-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Contact</p>
        <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-950">{{ t('about.contact.title') }}</h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <article class="rounded-xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm">
          <LucideIcon :icon="UserRoundCog" class="size-5 text-violet-700" />
          <h3 class="mt-3 font-bold text-slate-900">{{ t('about.contact.maintenance.title') }}</h3>
          <p class="mt-2 text-sm leading-7 text-slate-600">{{ t('about.contact.maintenance.body') }}</p>
          <a href="https://x.com/shionari_" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline">
            {{ t('about.contact.maintenance.link') }}
            <LucideIcon :icon="ExternalLink" class="size-3.5" />
          </a>
        </article>
        <article class="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
          <LucideIcon :icon="Bug" class="size-5 text-rose-700" />
          <h3 class="mt-3 font-bold text-slate-900">{{ t('about.contact.bugs.title') }}</h3>
          <p class="mt-2 text-sm leading-7 text-slate-600">{{ t('about.contact.bugs.body') }}</p>
        </article>
      </div>
    </section>

    <section id="docs" class="scroll-mt-24 space-y-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Documentation</p>
        <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-950">{{ t('about.docs.title') }}</h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <AppLink to="/docs/markdown" class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
          <LucideIcon :icon="FilePenLine" class="size-5 text-sky-700" />
          <div class="mt-3 flex items-center justify-between gap-3">
            <h3 class="font-bold text-slate-900">{{ t('about.docs.markdown.title') }}</h3>
            <span class="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden="true">→</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('about.docs.markdown.body') }}</p>
        </AppLink>
        <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
          <LucideIcon :icon="Code2" class="size-5 text-slate-500" />
          <div class="mt-3 flex items-center justify-between gap-3">
            <h3 class="font-bold text-slate-700">{{ t('about.docs.api.title') }}</h3>
            <span class="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">{{ t('about.docs.api.badge') }}</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('about.docs.api.body') }}</p>
        </div>
      </div>
    </section>

    <section id="faq" class="scroll-mt-24 space-y-4">
      <div class="flex items-center gap-3">
        <LucideIcon :icon="CircleHelp" class="size-5 text-sky-700" />
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">FAQ</p>
          <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-950">{{ t('about.faq.title') }}</h2>
        </div>
      </div>
      <div class="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm shadow-sky-900/5">
        <div v-for="(faq, index) in faqs" :key="faq.questionKey" class="border-b border-slate-100 last:border-b-0">
          <!-- WAI-ARIA accordion: the toggle sits in a heading, so each question
               is reachable by heading navigation (and survives the Markdown view). -->
          <h3>
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 sm:px-6"
              :class="openFaqs.has(index) ? 'bg-sky-50/60' : 'bg-white'"
              :aria-expanded="openFaqs.has(index)"
              :aria-controls="`faq-answer-${index}`"
              @click="toggleFaq(index)"
            >
              <span class="flex items-center gap-3">
                <span
                  class="faq-motion grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold tabular-nums transition-transform duration-300"
                  :class="[faqNumberClasses[index % faqNumberClasses.length], openFaqs.has(index) ? 'scale-105' : '']"
                >
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <span>{{ t(faq.questionKey) }}</span>
              </span>
              <span class="faq-motion shrink-0 text-lg font-light text-slate-400 transition-transform duration-300" :class="openFaqs.has(index) ? 'rotate-45' : ''" aria-hidden="true">+</span>
            </button>
          </h3>
          <div
            :id="`faq-answer-${index}`"
            class="faq-answer-grid grid transition-[grid-template-rows,opacity] duration-300 ease-out"
            :class="openFaqs.has(index) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden">
              <p class="border-t border-slate-100 bg-slate-50/70 pb-5 pl-16 pr-5 pt-4 text-sm leading-7 text-slate-600 sm:pl-19 sm:pr-6">{{ t(faq.answerKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="open-source" class="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="flex items-center gap-3">
        <LucideIcon :icon="BookOpen" class="size-5 text-indigo-700" />
        <div>
          <h2 class="text-xl font-bold tracking-tight text-slate-950">{{ t('about.openSource.title') }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ t('about.openSource.lead') }}</p>
        </div>
      </div>
      <a
        href="https://github.com/achievements-app/psn-api"
        target="_blank"
        rel="noopener noreferrer"
        class="group mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-indigo-300 hover:shadow-sm"
      >
        <span class="flex min-w-0 items-center gap-3">
          <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current">
              <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.23.7-3.91-1.37-3.91-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.26 3.38.97.1-.75.4-1.26.74-1.55-2.58-.29-5.29-1.29-5.29-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.72 5.39-5.3 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-slate-800 group-hover:text-indigo-700">psn-api</span>
            <span class="block truncate text-xs text-slate-400">github.com/achievements-app/psn-api</span>
          </span>
        </span>
        <LucideIcon :icon="ExternalLink" class="size-3.5 shrink-0 text-slate-300 group-hover:text-indigo-600" />
      </a>
    </section>
  </StaticPageLayout>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .faq-answer-grid,
  .faq-motion {
    transition: none;
  }
}
</style>
