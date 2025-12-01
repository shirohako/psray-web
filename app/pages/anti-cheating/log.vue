<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6">
    <h2 class="font-bold text-2xl">{{ $t('anti_cheat.records.title') }}</h2>
    <div class="text-gray-600 text-sm">
      {{ $t('anti_cheat.records.description') }}
    </div>

    <Paginator
      :first="data.offset"
      :totalRecords="data.totalRecords"
      :rows="data.recordsPerPage"
      @page="changePage"
    ></Paginator>

    <div class="my-3 flex flex-col gap-3">
      <div
        class="bg-zinc-900 px-3 py-2 rounded-lg border text-white"
        v-for="cheating in data.cheating"
      >
        <div class="flex p-2 gap-1">
          <div class="">
            <span class="bg-red-500 inline-block center w-3 h-3 rounded-full"></span>
          </div>
          <div class="circle">
            <span class="bg-yellow-500 inline-block center w-3 h-3 rounded-full"></span>
          </div>
          <div class="circle">
            <span class="bg-green-500 box inline-block center w-3 h-3 rounded-full"></span>
          </div>
        </div>
        <div class="card__content px-4 py-2">
          <div class="my-2">
            <span>{{ $t('anti_cheat.records.last_updated') }}：</span>
            <span>
              {{ format(fromUnixTime(cheating.updated_at), 'yyyy-MM-dd HH:mm:ss') }}
            </span>
          </div>
          <div class="my-3">
            <div>
              <span>{{ $t('anti_cheat.records.respondent') }}：</span>
              <span> {{ cheating.respondent }} (PSN ID)</span>
            </div>
            <div>
              <span>{{ $t('anti_cheat.records.type.name') }}：</span>
              <span>{{ $t('anti_cheat.records.type.moderators_ban') }}</span>
            </div>
            <div>
              <span>{{ $t('anti_cheat.records.cause.name') }}：</span>
              <span>{{ $t('anti_cheat.records.cause.cheating') }}</span>
            </div>
            <div>
              <span>{{ $t('anti_cheat.records.judge') }}：</span>
              <span>{{ cheating.executor.psnid }}</span>
            </div>
          </div>

          <div>
            <span>{{ $t('anti_cheat.records.level') }}：</span>
            <span> {{ $t('anti_cheat.level.termination') }}</span>
          </div>
          <div>
            <span>{{ $t('anti_cheat.records.measures') }}：</span>
            <span>{{ $t('anti_cheat.level.termination_text') }}</span>
          </div>
          <div>
            <span>{{ $t('anti_cheat.records.explanation') }}：</span>
            <span>{{ cheating.explanation }}</span>
          </div>
        </div>
      </div>
    </div>

    <Paginator
      :first="data.offset"
      :totalRecords="data.totalRecords"
      :rows="data.recordsPerPage"
      @page="changePage"
    ></Paginator>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const api = useApi();
const route = useRoute();
const router = useRouter();
const currentPage = ref(route.query.page || 1);
const { data, refresh } = await useAsyncData('anti-cheating-log', fetchData);

async function fetchData() {
  const res = await api.get('/log/anti-cheating-log', {
    params: {
      page: currentPage.value,
    },
  });
  return res.data;
}

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    query: { ...route.query, page: currentPage.value },
  });
  refresh();
}
</script>
