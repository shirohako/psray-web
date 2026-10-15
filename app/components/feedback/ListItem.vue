<script setup lang="ts">
import { Image, MessageSquare } from 'lucide'
import type { FeedbackItem } from '~/types/feedback'

/** One row of the feedback list: author, badges, a few lines of the text, counts. */
defineProps<{ item: FeedbackItem }>()
</script>

<template>
  <article class="px-4 py-4 transition hover:bg-slate-50/70 sm:px-5">
    <div class="flex items-start justify-between gap-3">
      <FeedbackAuthor :author="item.author" />
      <time :datetime="item.created_at" class="shrink-0 whitespace-nowrap pt-1.5 text-xs tabular-nums text-slate-400">{{ fmtDateTime(item.created_at) }}</time>
    </div>

    <NuxtLink :to="`/feedback/${item.id}`" class="mt-2 block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40">
      <p class="line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{{ item.content }}</p>
    </NuxtLink>

    <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
      <FeedbackTags :type="item.type" :status="item.status" :visibility="item.visibility" />
      <span v-if="item.image_urls.length" class="inline-flex items-center gap-1 tabular-nums" :title="$t('feedback.images')">
        <LucideIcon :icon="Image" class="size-3.5" />{{ item.image_urls.length }}
      </span>
      <NuxtLink :to="`/feedback/${item.id}`" class="inline-flex items-center gap-1 tabular-nums transition hover:text-slate-700" :title="$t('feedback.replies')">
        <LucideIcon :icon="MessageSquare" class="size-3.5" />{{ item.reply_count }}
      </NuxtLink>
      <span v-if="item.has_staff_reply" class="rounded bg-sky-50 px-1.5 py-px text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
        {{ $t('feedback.staffReplied') }}
      </span>
    </div>
  </article>
</template>
