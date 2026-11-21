<script setup lang="ts">
import { regionTag } from '~/utils/adminTrophySet'

/**
 * Picture for one trophy-set region tag, always a 4:3 tile so tags line up:
 * the country's flag (or the EU's), two offset flags for North America, a
 * globe turned to Asia for the Asia store, and a small line drawing for
 * editions. Size it with a height class.
 */
const props = defineProps<{ code: string }>()
const flags = computed(() => regionTag(props.code)?.flags ?? [])

/**
 * Land for the Asia globe: simplified coastlines (Asia, Japan, Taiwan, the
 * Philippines and Indonesia, New Guinea, northern Australia) in an orthographic
 * projection centred on 100°E 28°N, on a globe at (16, 12) r 9.25. Points past
 * the horizon are pinned to its edge, so the shapes stay inside the circle.
 */
const ASIA_LAND = 'M11.4 4.7L13.1 4.6L13.1 5.2L13.5 5.6L14.6 5.4L15.1 5.4L16 5.1L16.6 5.4L17.4 5.4L18.4 5.3L19.1 4.9L19.7 4.8L20 5.1L20.3 5.7L20.5 6.2L20.9 7.1L20.3 6.6L19.9 6.3L19.2 6.6L19.3 7.4L20 8.2L19.6 9.1L19.4 9.7L19.5 10L19.7 10.4L19.4 10.6L19.3 10.1L19 9.9L18.7 9.8L18.2 10.1L18.4 10.3L18.8 10.3L18.5 10.7L19 11.2L18.9 11.7L18.8 12.3L18.5 12.6L18.1 12.8L17.5 13L17.5 13.2L17.2 13.1L16.9 13.4L17.2 13.9L17.4 14.5L17.1 14.7L16.8 15.1L16.7 14.8L16.1 14.4L16 14.5L15.9 15L16.1 15.4L16.6 16.1L16.2 15.9L16 15.5L15.7 15.2L15.8 14.5L15.6 13.9L15.1 13.9L15.1 13.4L14.7 12.9L14.4 12.9L14.1 13L13.7 13.3L13.3 13.7L12.9 14.1L12.9 14.6L12.5 14.8L12.3 14.5L12.1 13.7L12 13L12 12.7L11.7 12.3L11.5 12.2L11.4 11.8L10.7 11.5L10.3 11.4L10.5 11.9L10.2 12.2L9.7 12.5L8.9 12.6L8.5 12.6L8.4 12.6L9.2 13.1L8.5 14.2L7.9 14.8L8.3 16.2L8.4 17.1L8.6 17.5L8.3 17.1L6.8 11.9L8 7.9ZM20 11L19.9 10.5L20 10.5L20.5 10.4L20.7 10.2L20.9 10L20.8 9.7L20.7 9.2L20.5 9.1L20.6 9.4L20.6 9.7L20.4 10L20.1 10.2L20.1 10.6L20.1 10.9ZM20.5 9.1L20.8 8.6L20.3 8.5L20.4 8.8ZM19.1 12.2L19 12.7L18.9 12.6L19 12.3ZM19.1 13.3L19.7 13.9L19.2 14L19 13.7ZM19.9 14.5L20 15L19.4 15L19.6 14.7ZM18.7 15.1L18.9 15.6L19 16L18.6 16.3L18.3 16.8L17.8 16.7L17.4 16.4L17.5 16.1L17.8 15.9L18.2 15.6L18.5 15.2ZM15.2 15.5L15.9 15.9L16.6 16.3L17 16.7L16.9 17.1L16.3 16.9L16 16.5L15.6 16.1ZM17 17.1L17.8 17.2L18.3 17.3L18.3 17.4L17.6 17.4L17 17.3ZM19.9 15.7L19.2 16.2L19.1 16.9L19.5 16.7L19.4 16.2L19.5 15.9ZM20.8 15.8L21.6 15.7L22.1 15.6L22.8 15.8L23 16.2L22.2 16.3L21.9 16.6L21.5 16.2L21 16.2ZM20.6 17.4L20.9 17.2L21.4 17.1L21.2 17.5L21.7 17.6L22.1 16.7L22.3 17L22.3 17.5L22.6 17.7L22.6 18.1L22.1 18.7L21.6 19.2L21.2 19.5L20.7 19.6L20.7 19.5L20.3 19.4L19.1 19.9L18.2 20.1L18.1 19.8L18 19L18.8 18.7L19.4 18.2L20 17.7Z'
</script>

<template>
  <span class="relative inline-block aspect-4/3 shrink-0" aria-hidden="true">
    <img
      v-if="flags.length === 1"
      :src="flagSrc(flags[0]!)"
      alt=""
      loading="lazy"
      decoding="async"
      class="size-full rounded-[2px] object-cover ring-1 ring-black/10"
    />
    <template v-else-if="flags.length">
      <img :src="flagSrc(flags[0]!)" alt="" loading="lazy" decoding="async" class="absolute left-0 top-0 h-[64%] w-[64%] rounded-[2px] object-cover ring-1 ring-black/10" />
      <img :src="flagSrc(flags[1]!)" alt="" loading="lazy" decoding="async" class="absolute bottom-0 right-0 h-[64%] w-[64%] rounded-[2px] object-cover ring-[1.5px] ring-white" />
    </template>
    <svg
      v-else
      viewBox="0 0 32 24"
      class="size-full rounded-[2px] bg-slate-100 text-slate-600 ring-1 ring-black/5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- 亚洲: the globe turned to Asia -->
      <template v-if="code === 'AS'">
        <circle cx="16" cy="12" r="9.25" class="fill-white" stroke="none" />
        <path :d="ASIA_LAND" class="fill-current" stroke="none" />
        <circle cx="16" cy="12" r="9.25" stroke-width="1.5" />
      </template>
      <!-- 实体版: a case with the disc sliding out -->
      <template v-else-if="code === 'P'">
        <circle cx="19.5" cy="12" r="6.5" />
        <circle cx="19.5" cy="12" r="1.5" />
        <rect x="7.5" y="4.5" width="11" height="15" rx="1.5" class="fill-slate-100" />
        <path d="M10 4.5v15" />
      </template>
      <!-- 数字版: download from the store -->
      <g v-else-if="code === 'D'" transform="translate(7 2.5) scale(0.75)" stroke-width="2.33">
        <path d="M12 13v8l-4-4" />
        <path d="m12 21 4-4" />
        <path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284" />
      </g>
      <!-- 原版: a first-edition rosette -->
      <g v-else-if="code === 'ORIG'" transform="translate(7 2.5) scale(0.75)" stroke-width="2.33">
        <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
        <circle cx="12" cy="8" r="6" />
        <path d="M11 6.2 12.5 5v5.8" />
      </g>
      <!-- 合集版: several cases together -->
      <template v-else-if="code === 'BDL'">
        <rect x="5.5" y="6" width="9" height="13" rx="1.2" transform="rotate(-12 10 12.5)" class="fill-slate-100" />
        <rect x="17.5" y="6" width="9" height="13" rx="1.2" transform="rotate(12 22 12.5)" class="fill-slate-100" />
        <rect x="11.5" y="4.5" width="9" height="14" rx="1.2" class="fill-slate-100" />
        <path d="M13.5 4.5v14" />
      </template>
    </svg>
  </span>
</template>
