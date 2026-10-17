<script setup lang="ts">
import { ImageOff } from 'lucide'

/**
 * A Sony CDN image that shows up as broken when its URL no longer loads (old
 * trophy art goes 404). Size it with a class on the component; `broken` fires
 * once per failing URL so a parent can count them.
 */
const props = defineProps<{ src: string | null }>()
const emit = defineEmits<{ broken: [src: string | null] }>()

const failed = ref(!props.src)
const img = ref<HTMLImageElement | null>(null)

function fail() {
  if (failed.value) return
  failed.value = true
  emit('broken', props.src)
}

// Cached failures can finish before the listener is attached.
function check() {
  const el = img.value
  if (el?.complete && el.naturalWidth === 0) fail()
}

watch(() => props.src, async (src) => {
  failed.value = false
  if (!src) return fail()
  await nextTick()
  check()
})

onMounted(() => (props.src ? check() : emit('broken', props.src)))
</script>

<template>
  <span class="relative inline-grid shrink-0 place-items-center overflow-hidden rounded bg-slate-100">
    <span
      v-if="failed"
      class="grid size-full place-items-center bg-red-50 text-red-400 ring-1 ring-inset ring-red-200"
      :title="src ? `图片无法加载：${src}` : '没有图片地址'"
    >
      <LucideIcon :icon="ImageOff" class="size-1/2 max-h-5 max-w-5" />
    </span>
    <img
      v-else
      ref="img"
      :src="src!"
      alt=""
      loading="lazy"
      decoding="async"
      class="size-full object-contain"
      @error="fail"
    />
  </span>
</template>
