<script setup lang="ts">
/**
 * Feedback and reply bodies: plain text with line breaks kept and http(s)
 * URLs turned into links. Built from segments, so nothing goes through v-html.
 */
const props = defineProps<{ text: string }>()

const segments = computed(() => linkifyText(props.text))
</script>

<template>
  <p class="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700"><template v-for="(segment, index) in segments" :key="index"><a
    v-if="segment.type === 'link'"
    :href="segment.value"
    target="_blank"
    rel="noopener noreferrer nofollow ugc"
    class="break-all text-sky-700 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-900"
  >{{ segment.value }}</a><template v-else>{{ segment.value }}</template></template></p>
</template>
