<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <!-- 主动态 -->
      <div
        class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50"
      >
        <SparkCard :spark="spark" />
      </div>

      <!-- 回复发布框 -->
      <SparkEntryArea @new-activity="refresh" />

      <!-- 回复列表 -->
      <div class="space-y-4">
        <h3 class="text-base font-semibold text-gray-700 text-center">全部回复</h3>
        <div
          v-if="spark.replies.length === 0"
          class="text-gray-400 italic text-sm text-center bg-white rounded-lg px-3 py-5 shadow-sm border"
        >
          暂无回复
        </div>
        <div
          v-for="reply in spark.replies"
          :key="reply.id"
          class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50"
        >
          <SparkCard :spark="reply" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SparkCard from '~/components/spark/SparkCard.vue';

const api = useApi();
const route = useRoute();

const { data: spark, error, refresh } = await useAsyncData('spark', fetchData);

async function fetchData() {
  const id = route.params.id;
  const res = await api.get(`/spark/${id}`);
  return res.data;
}
</script>
