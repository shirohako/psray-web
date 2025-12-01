<!-- pages/series/[id].vue -->
<template>
  <div class="max-w-screen-lg mx-auto px-4">
    <h1 class="text-3xl font-bold text-center mb-4">{{ seriesData.name }}</h1>
    <div class="p-4 bg-white">
      <div class="card flex justify-center">
        <SelectButton v-model="view" :options="options" />
      </div>
    </div>
    <SeriesList :works="seriesData.works" :view="view" />
  </div>
</template>

<script setup>
import SeriesList from '~/components/series/SeriesList.vue';

const api = useApi();
const route = useRoute();

const view = ref('游戏视图');
const options = ref(['游戏视图', '奖杯视图']);

const { data: seriesData, error } = await useAsyncData('series', fetchSeries);

async function fetchSeries() {
  const id = route.params.id;
  const res = await api.get(`/series/${id}`);
  return res.data;
}
</script>
