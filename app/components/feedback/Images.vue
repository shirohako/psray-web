<script setup lang="ts">
import { ImageOff } from 'lucide'

/**
 * Screenshots attached as links to outside image hosts. Thumbnails load lazily
 * and without a referrer (hosts that block hotlinking usually allow that); one
 * that fails to load falls back to its link.
 */
const props = defineProps<{ urls: string[] }>()

const images = computed(() => props.urls.filter(isHttpsUrl))
const failed = ref<Record<string, boolean>>({})

function host(url: string) {
  try {
    return new URL(url).hostname
  }
  catch {
    return url
  }
}
</script>

<template>
  <div v-if="images.length" class="flex flex-wrap gap-2">
    <a
      v-for="url in images"
      :key="url"
      :href="url"
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      :title="url"
      class="group block size-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition hover:border-slate-400 sm:size-24"
    >
      <img
        v-if="!failed[url]"
        :src="url"
        alt=""
        loading="lazy"
        referrerpolicy="no-referrer"
        class="size-full object-cover"
        @error="failed[url] = true"
      />
      <span v-else class="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-slate-400 group-hover:text-slate-600">
        <LucideIcon :icon="ImageOff" class="size-4" />
        <span class="w-full truncate text-[10px]">{{ host(url) }}</span>
      </span>
    </a>
  </div>
</template>
