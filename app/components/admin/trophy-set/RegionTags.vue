<script setup lang="ts">
import { parseRegion, regionTag } from '~/utils/adminTrophySet'

/** A trophy set's region tags as chips (icon, code, name), or 「未设置」. Takes the stored string or a list of codes. */
const props = defineProps<{ region: string | readonly string[] | null | undefined }>()
const tags = computed(() => (typeof props.region === 'string' || !props.region ? parseRegion(props.region) : props.region)
  .map(code => ({ code, label: regionTag(code)?.label })))
</script>

<template>
  <span v-if="tags.length" class="flex flex-wrap items-center gap-1.5">
    <TransitionGroup
      enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0 scale-90"
      leave-active-class="hidden"
    >
      <span v-for="tag in tags" :key="tag.code" class="inline-flex h-6 items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-1.5 pr-2 text-xs text-slate-700">
        <AdminTrophySetRegionIcon :code="tag.code" class="h-3.5" />
        <span class="text-[11px] font-bold tracking-wide text-slate-500">{{ tag.code }}</span>
        <span v-if="tag.label">{{ tag.label }}</span>
      </span>
    </TransitionGroup>
  </span>
  <span v-else class="text-[13px] text-slate-400">未设置</span>
</template>
