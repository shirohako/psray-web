<template>
  <article
    class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 hover:border-slate-300 hover:shadow-md"
  >
    <div class="absolute inset-x-0 top-0 h-1" :class="typeTone.bar" />
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="min-w-0 space-y-2">
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
            :class="typeTone.badge"
          >
            <span class="h-2 w-2 rounded-full" :class="typeTone.dot" />
            <span>{{ typeLabel }}</span>
          </span>
          <span class="text-xs font-medium text-slate-500">{{ displayDate || '-' }}</span>
        </div>
        <h3 class="text-lg font-semibold leading-snug text-slate-900 md:text-xl">
          {{ localizedContent.title }}
        </h3>
      </div>

      <AnnouncementLanguageSwitch
        v-if="languageOptions.length > 1"
        v-model="activeLocale"
        :options="languageOptions"
        class="self-start"
      />
    </div>

    <div class="mt-4 rounded-lg border border-slate-100 px-4 py-3">
      <div
        class="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700"
        v-html="renderedContent"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import AnnouncementLanguageSwitch from '~/components/announcement/AnnouncementLanguageSwitch.vue';

interface AnnouncementRecord {
  id?: number | string;
  title?: string;
  content?: string;
  description?: string;
  body?: string;
  type?: string;
  published_at?: number | string;
  created_at?: number | string;
  updated_at?: number | string;
  content_list?: AnnouncementContentItem[];
  contents?: AnnouncementContentItem[];
  translations?: Record<string, { title?: string; content?: string; description?: string; body?: string }>;
  i18n?: Record<string, { title?: string; content?: string; description?: string; body?: string }>;
  [key: string]: any;
}

interface AnnouncementContentItem {
  lang?: string;
  locale?: string;
  language?: string;
  format?: string;
  title?: string;
  content?: string;
  description?: string;
  body?: string;
  text?: string;
}

interface Props {
  announcement: AnnouncementRecord;
}

const props = defineProps<Props>();

const { t, locale } = useI18n();
const { formatTimestamp } = useTime();

const activeLocale = ref('');

type ContentField = 'title' | 'content';
type TranslationField = 'title' | 'content' | 'description' | 'body';
type Tone = { badge: string; dot: string; bar: string };

const announcementType = computed(() => props.announcement.type?.toString().toLowerCase() ?? '');

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

const localeAliases: Record<string, string> = {
  'zh': 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh_hans': 'zh-Hans',
  'zh-hans': 'zh-Hans',
  'zh-tw': 'zh-Hant',
  'zh_hant': 'zh-Hant',
  'zh-hant': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'en': 'en-US',
  'en-us': 'en-US',
  'ja': 'ja-JP',
  'ja-jp': 'ja-JP',
  'ko': 'ko-KR',
  'ko-kr': 'ko-KR',
};

const normalizeLocale = (value: string) => value.toLowerCase().replace(/_/g, '-');

const resolveLocaleKey = (value: string) => {
  const normalized = normalizeLocale(value);
  return localeAliases[normalized] ?? value;
};

const resolveContentList = (item: AnnouncementRecord) => {
  const list = item.content_list ?? item.contents ?? item.content;
  if (Array.isArray(list)) return list as AnnouncementContentItem[];
  return [];
};

const readContentListField = (items: AnnouncementContentItem[], lang: string, field: ContentField) => {
  if (!items.length) return '';

  const resolved = resolveLocaleKey(lang);
  const normalized = normalizeLocale(lang);

  const match =
    items.find((entry) => resolveLocaleKey(entry.lang ?? '') === resolved) ||
    items.find((entry) => resolveLocaleKey(entry.locale ?? '') === resolved) ||
    items.find((entry) => resolveLocaleKey(entry.language ?? '') === resolved) ||
    items.find((entry) => normalizeLocale(entry.lang ?? '') === normalized) ||
    items.find((entry) => normalizeLocale(entry.locale ?? '') === normalized) ||
    items.find((entry) => normalizeLocale(entry.language ?? '') === normalized);

  const direct = match?.[field as keyof AnnouncementContentItem];
  if (typeof direct === 'string' && direct.trim()) return direct;

  if (field === 'content') {
    const fallback = match?.description ?? match?.body ?? match?.text;
    if (typeof fallback === 'string' && fallback.trim()) return fallback;
  }

  return '';
};

const getContentListLocales = (items: AnnouncementContentItem[]) => {
  return items
    .map((entry) => entry.language ?? entry.lang ?? entry.locale ?? '')
    .filter((value) => Boolean(value));
};

const readLocaleField = (item: AnnouncementRecord, lang: string, field: TranslationField) => {
  const normalized = normalizeLocale(lang);
  const canonical = resolveLocaleKey(lang);

  const translation: Partial<Record<TranslationField, string>> | undefined =
    item.translations?.[lang] ||
    item.translations?.[canonical] ||
    item.translations?.[normalized] ||
    item.i18n?.[lang] ||
    item.i18n?.[canonical] ||
    item.i18n?.[normalized];

  if (translation?.[field]) return translation[field] as string;

  const directKeys = [
    `${field}_${lang}`,
    `${field}_${canonical}`,
    `${field}_${normalized}`,
    `${field}_${normalized.replace(/-/g, '_')}`,
  ];

  for (const key of directKeys) {
    if (item[key]) return item[key] as string;
  }

  return '';
};

const getDefaultField = (item: AnnouncementRecord, field: ContentField) => {
  const fallback = item[field];
  if (typeof fallback === 'string' && fallback.trim()) return fallback;

  if (field === 'content') {
    return item.description || item.body || '';
  }

  return '';
};

const hasLocaleContent = (item: AnnouncementRecord, lang: string) => {
  const list = resolveContentList(item);
  if (list.length > 0) {
    return Boolean(readContentListField(list, lang, 'title') || readContentListField(list, lang, 'content'));
  }

  return (
    Boolean(readLocaleField(item, lang, 'title')) ||
    Boolean(readLocaleField(item, lang, 'content')) ||
    Boolean(readLocaleField(item, lang, 'description')) ||
    Boolean(readLocaleField(item, lang, 'body'))
  );
};

const languageOptions = computed(() => {
  const contentList = resolveContentList(props.announcement);
  const candidates = new Set<string>();
  const baseLocales = ['zh-Hans', 'zh-Hant', 'en-US', 'ja-JP', 'ko-KR'];

  baseLocales.forEach((entry) => {
    if (hasLocaleContent(props.announcement, entry)) {
      candidates.add(entry);
    }
  });

  const translationLocales = [
    ...Object.keys(props.announcement.translations ?? {}),
    ...Object.keys(props.announcement.i18n ?? {}),
  ];

  translationLocales.forEach((entry) => {
    const resolved = resolveLocaleKey(entry);
    if (hasLocaleContent(props.announcement, resolved)) {
      candidates.add(resolved);
    }
  });

  getContentListLocales(contentList).forEach((entry) => {
    const resolved = resolveLocaleKey(entry);
    candidates.add(resolved);
  });

  return [...candidates].map((entry) => ({
    value: entry,
    label: entry,
  }));
});

watch(
  languageOptions,
  (value) => {
    if (value.length === 0) {
      activeLocale.value = locale.value;
      return;
    }

    const preferred = resolveLocaleKey(locale.value);
    if (value.some((option) => option.value === preferred)) {
      activeLocale.value = preferred;
    } else if (!value.some((option) => option.value === activeLocale.value)) {
      const first = value[0];
      if (first) activeLocale.value = first.value;
    }
  },
  { immediate: true }
);

const resolveContentItem = (items: AnnouncementContentItem[], lang: string) => {
  if (!items.length) return null;

  const resolved = resolveLocaleKey(lang);
  const normalized = normalizeLocale(lang);

  return (
    items.find((entry) => resolveLocaleKey(entry.language ?? '') === resolved) ||
    items.find((entry) => resolveLocaleKey(entry.lang ?? '') === resolved) ||
    items.find((entry) => resolveLocaleKey(entry.locale ?? '') === resolved) ||
    items.find((entry) => normalizeLocale(entry.language ?? '') === normalized) ||
    items.find((entry) => normalizeLocale(entry.lang ?? '') === normalized) ||
    items.find((entry) => normalizeLocale(entry.locale ?? '') === normalized) ||
    items[0]
  );
};

const localizedContent = computed(() => {
  const contentList = resolveContentList(props.announcement);
  if (contentList.length > 0) {
    const entry = resolveContentItem(contentList, activeLocale.value);
    const title =
      entry?.title ||
      readContentListField(contentList, activeLocale.value, 'title') ||
      getDefaultField(props.announcement, 'title') ||
      '';
    const content =
      entry?.content ||
      entry?.description ||
      entry?.body ||
      entry?.text ||
      readContentListField(contentList, activeLocale.value, 'content') ||
      getDefaultField(props.announcement, 'content') ||
      '';

    return {
      title,
      content,
      format: entry?.format ?? 'text',
    };
  }

  const title =
    readLocaleField(props.announcement, activeLocale.value, 'title') ||
    getDefaultField(props.announcement, 'title') ||
    '';

  const content =
    readLocaleField(props.announcement, activeLocale.value, 'content') ||
    readLocaleField(props.announcement, activeLocale.value, 'description') ||
    readLocaleField(props.announcement, activeLocale.value, 'body') ||
    getDefaultField(props.announcement, 'content') ||
    '';

  return { title, content, format: 'text' };
});

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (match) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[match] || match;
  });

const renderPlainText = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped.replace(/\n/g, '<br />');
};

const renderMarkdown = (value: string) => {
  const safeValue = value.trim();
  if (!safeValue) return '';
  return markdown.render(safeValue);
};

const renderedContent = computed(() => {
  const content = localizedContent.value.content ?? '';
  const format = (localizedContent.value.format ?? 'text').toString().toLowerCase();

  if (!content.trim()) {
    return '';
  }

  if (format === 'html') {
    return content;
  }

  if (format === 'markdown' || format === 'md') {
    return renderMarkdown(content);
  }

  return `<p>${renderPlainText(content)}</p>`;
});

const displayDate = computed(() => {
  const raw =
    props.announcement.published_at ??
    props.announcement.created_at ??
    props.announcement.updated_at ??
    null;

  if (!raw) return '';

  try {
    return formatTimestamp(raw).split(' ')[0];
  } catch (err) {
    return '';
  }
});

const typeLabel = computed(() => {
  const labels: Record<string, string> = {
    notice: t('home.announcements.type.notice'),
    update: t('home.announcements.type.update'),
    feature: t('home.announcements.type.feature'),
  };

  return labels[announcementType.value] || props.announcement.type || t('home.announcements.type.notice');
});

const tones: Record<string, Tone> = {
  notice: {
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    dot: 'bg-cyan-500',
    bar: 'bg-cyan-500/80',
  },
  update: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500/80',
  },
  feature: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500/80',
  },
};

const getTone = (value: string): Tone => {
  if (value in tones) {
    return tones[value as keyof typeof tones]!;
  }
  return tones.notice!;
};

const typeTone = computed<Tone>(() => getTone(announcementType.value));
</script>
