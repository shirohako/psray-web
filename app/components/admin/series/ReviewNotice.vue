<script setup lang="ts">
import { TriangleAlert } from 'lucide'
import type { AdminSeriesDetail } from '~/types/admin'
import { SERIES_REVIEW_LABELS } from '~/utils/adminSeries'

/**
 * Why automatic grouping flagged a series, spelled out: what it found (with
 * the series it overlaps, or the stage limit it went over), what to decide,
 * and when the flag goes away. Actions go in the default slot.
 */
const props = defineProps<{ series: AdminSeriesDetail }>()

const detail = computed(() => props.series.review_detail)
const containers = computed(() => (detail.value && 'containers' in detail.value ? detail.value.containers : []))
const works = computed(() => (detail.value && 'works' in detail.value ? detail.value.works : 0))
const threshold = computed(() => (detail.value && 'threshold' in detail.value ? detail.value.threshold : null))
const derived = computed(() => props.series.review_reason === 'overlap' || props.series.review_reason === 'large')
</script>

<template>
  <div class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] leading-6 text-amber-900">
    <div class="flex items-start gap-2.5">
      <LucideIcon :icon="TriangleAlert" class="mt-1 size-4 shrink-0" />
      <div class="min-w-0 flex-1 space-y-1.5">
        <p class="font-semibold">
          待审核：{{ series.review_reason ? SERIES_REVIEW_LABELS[series.review_reason] : '自动归类标记' }}
        </p>

        <template v-if="series.review_reason === 'overlap'">
          <template v-if="containers.length">
            <p v-for="container in containers" :key="container.id">
              这个系列的 {{ works }} 部作品中，有 {{ container.shared }} 部也在
              <NuxtLink :to="`/admin/series/${container.id}`" class="font-medium underline underline-offset-2">{{ container.name }}</NuxtLink>
              （共 {{ container.works }} 部）里。
            </p>
            <p>IGDB 常把小合集套在大合集里（比如「Call of Duty: Black Ops」整个在「Call of Duty」里），自动归类会把两个都建成系列。</p>
            <p>请判断：如果它是一条值得单独看的支线，保留即可；如果只是重复，合并进上面的系列，或者下架。</p>
          </template>
          <p v-else>现在已经没有系列包含它的大部分作品了（原来那个系列可能已下架或调整过），这个标记已经过时。下次每周归类会自动清掉，也可以直接标为已审核。</p>
        </template>

        <template v-else-if="series.review_reason === 'large'">
          <p>
            这个系列有 {{ series.stage_count }} 个主线阶段<template v-if="threshold">，超过了上限 {{ threshold }} 个</template>。
            阶段这么多，通常是发行商或品牌的合集（比如「ACA NEOGEO」），而不是一个系列。
          </p>
          <p>请判断：确实是一个系列就保留；只是合集的话，下架即可。</p>
        </template>

        <template v-else-if="series.review_reason === 'new_stage'">
          <p>你编辑过这个系列，之后每周归类又发现了新作品。为了不打乱你的安排，新作品只追加在最后（来源标为「自动」）。</p>
          <p>请把新阶段挪到正确的位置，或删掉不属于这个系列的，然后保存。</p>
        </template>

        <p class="text-xs text-amber-800/80">
          这个提示只有管理员看得到，前台照常显示这个系列。保存或标为已审核后提示消失<template v-if="derived">；每周归类也会重新检查，不再成立时自动清掉</template>。
        </p>
      </div>
      <slot />
    </div>
  </div>
</template>
