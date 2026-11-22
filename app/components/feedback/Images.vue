<script setup lang="ts">
import { ImageOff } from 'lucide'
import type { MediaImage } from '~/types/media'

/**
 * Screenshots attached to a feedback thread, as thumbnails that open the full
 * image. Each tile shows the screenshot's average colour while it loads; one
 * that fails to load shows an icon instead.
 */
const props = defineProps<{ images: MediaImage[] }>()

const failed = ref<Record<string, boolean>>({})
const key = (image: MediaImage) => image.id ?? image.url
</script>

<template>
  <div v-if="props.images.length" class="flex flex-wrap gap-2">
    <a
      v-for="(image, index) in props.images"
      :key="key(image)"
      :href="image.url"
      target="_blank"
      rel="noopener"
      class="group block size-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition hover:border-slate-400 sm:size-24"
      :style="image.color ? { backgroundColor: image.color } : undefined"
    >
      <img
        v-if="!failed[key(image)]"
        :src="image.url"
        :srcset="image.srcset ?? undefined"
        sizes="96px"
        :alt="$t('feedback.imageAlt', { n: index + 1 })"
        loading="lazy"
        class="size-full object-cover"
        @error="failed[key(image)] = true"
      />
      <span v-else class="flex size-full items-center justify-center text-slate-400 group-hover:text-slate-600">
        <LucideIcon :icon="ImageOff" class="size-4" />
      </span>
    </a>
  </div>
</template>
