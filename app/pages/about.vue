<script setup lang="ts">
import {
  ArrowUpRight,
  BookOpen,
  Bug,
  CircleHelp,
  Code2,
  Copy,
  Database,
  ExternalLink,
  FileText,
  FilePenLine,
  Languages,
  Mail,
  Megaphone,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
} from 'lucide'

const { t, locale } = useI18n()

const updatedAt = '2026-11-27'

const toc = computed(() => [
  { id: 'about', labelKey: 'about.toc.about' },
  { id: 'policies', labelKey: 'about.toc.policies' },
  { id: 'data', labelKey: 'about.toc.data' },
  { id: 'removal', labelKey: 'about.toc.removal' },
  { id: 'contact', labelKey: 'about.toc.contact' },
  { id: 'community', labelKey: 'about.toc.community' },
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

/** Brand colours of the community rows: a light tint behind the glyph and the join button, a shade dark enough to read on it. */
const BRANDS = {
  telegram: { glyph: '#26A5E4', tint: 'rgb(38 165 228 / 0.10)', tintHover: 'rgb(38 165 228 / 0.18)', ink: '#0874AE' },
  discord: { glyph: '#5865F2', tint: 'rgb(88 101 242 / 0.10)', tintHover: 'rgb(88 101 242 / 0.18)', ink: '#4752C4' },
  qq: { glyph: '#1EBAFC', tint: 'rgb(30 186 252 / 0.12)', tintHover: 'rgb(30 186 252 / 0.20)', ink: '#0779B8' },
}

/** Brand glyphs from simple-icons 16.38.1 (CC0-1.0), 24×24 viewBox. */
const GLYPHS = {
  telegram: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  discord: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
  qq: 'M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673',
}

/**
 * Official community: the Telegram channel carries announcements, the three
 * groups are for chat. The QQ group can also be joined by number.
 */
const QQ_GROUP = '664366349'
const community = [
  { key: 'telegramChannel', brand: 'telegram', kind: 'news', url: 'https://t.me/psraynet', handle: 't.me/psraynet' },
  { key: 'telegramGroup', brand: 'telegram', kind: 'chat', url: 'https://t.me/psraychat', handle: 't.me/psraychat' },
  { key: 'discord', brand: 'discord', kind: 'chat', url: 'https://discord.gg/cwaPGv5Wb', handle: 'discord.gg/cwaPGv5Wb' },
  { key: 'qq', brand: 'qq', kind: 'chat', url: 'https://qm.qq.com/q/IKzFhh5i8Y', handle: null },
] as const

const copyText = useCopyText()

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

    <section id="community" class="scroll-mt-24 space-y-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Community</p>
        <h2 class="mt-1 text-xl font-bold tracking-tight text-slate-950">{{ t('about.community.title') }}</h2>
        <p class="mt-2 text-sm leading-7 text-slate-500">{{ t('about.community.lead') }}</p>
      </div>
      <ul class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <li
          v-for="item in community"
          :key="item.key"
          class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3.5 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-x-4"
          :style="{ '--tint': BRANDS[item.brand].tint, '--tint-hover': BRANDS[item.brand].tintHover, '--ink': BRANDS[item.brand].ink }"
        >
          <span class="row-span-2 grid size-10 place-items-center self-center rounded-xl bg-(--tint) md:row-span-1">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="size-5" :fill="BRANDS[item.brand].glyph"><path :d="GLYPHS[item.brand]" /></svg>
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 class="text-sm font-bold text-slate-900">{{ t(`about.community.${item.key}.title`) }}</h3>
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="item.kind === 'news' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'"
              >
                <LucideIcon :icon="item.kind === 'news' ? Megaphone : MessagesSquare" class="size-3" />
                {{ t(`about.community.kinds.${item.kind}`) }}
              </span>
            </div>
            <p class="mt-0.5 text-xs leading-5 text-slate-500">{{ t(`about.community.${item.key}.body`) }}</p>
          </div>
          <!-- Under the text on phones, beside the buttons from md up. -->
          <span class="col-start-2 row-start-2 truncate text-xs leading-5 text-slate-400 md:col-start-3 md:row-start-1">
            {{ item.handle ?? t('about.community.qqNumber', { number: QQ_GROUP }) }}
          </span>
          <div class="col-start-3 row-span-2 row-start-1 flex items-center gap-2 md:col-start-4 md:row-span-1">
            <button
              v-if="item.brand === 'qq'"
              type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 sm:px-3"
              :aria-label="t('about.community.copyNumber')"
              @click="copyText(QQ_GROUP, t('about.community.qqNumberLabel'))"
            >
              <LucideIcon :icon="Copy" class="size-3.5 text-slate-500" />
              <span class="hidden sm:inline">{{ t('about.community.copyNumber') }}</span>
            </button>
            <a
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex h-8 items-center gap-1.5 rounded-lg bg-(--tint) px-3 text-[13px] font-semibold text-(--ink) transition hover:bg-(--tint-hover)"
            >
              <LucideIcon :icon="ArrowUpRight" class="size-3.5 transition group-hover:-translate-y-px group-hover:translate-x-px motion-reduce:transform-none" />
              {{ t('about.community.join') }}
            </a>
          </div>
        </li>
      </ul>
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
        <AppLink to="/docs/api" class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
          <LucideIcon :icon="Code2" class="size-5 text-sky-700" />
          <div class="mt-3 flex items-center justify-between gap-3">
            <h3 class="font-bold text-slate-900">{{ t('about.docs.api.title') }}</h3>
            <span class="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden="true">→</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('about.docs.api.body') }}</p>
        </AppLink>
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
