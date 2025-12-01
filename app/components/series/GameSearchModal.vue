<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-md p-4 w-96">
      <h2 class="text-lg font-bold mb-3">搜索游戏</h2>

      <input
        v-model="searchKeyword"
        type="text"
        placeholder="输入游戏名称"
        class="border border-gray-300 px-3 py-2 rounded w-full mb-3"
        @keydown.enter.prevent="onSearch"
      />

      <button
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full mb-3"
        @click="onSearch"
      >
        搜索
      </button>

      <div v-if="searchResults.length > 0" class="space-y-2 mb-3">
        <div
          v-for="game in searchResults"
          class="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
          @click="onSelectGame(game)"
        >
          <span>#{{ game.id }}</span>
          <span>{{ game.title }}</span>
          <span class="text-sm text-gray-500">点击添加</span>
        </div>
      </div>

      <button
        class="bg-gray-200 text-gray-700 px-4 py-2 rounded w-full hover:bg-gray-300 transition"
        @click="$emit('close')"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script setup>
// props、emits可按需定义，如需让父组件决定搜索范围，可以传入更多 props
const emits = defineEmits(['close', 'add-game']);

const searchKeyword = ref('');
const searchResults = ref([]);
const api = useApi();

// 模拟搜索操作
const onSearch = async () => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    searchResults.value = [];
    return;
  }

  const result = await api.get(`games/get/${keyword}?simple=1`);

  if (result.data?.id) {
    searchResults.value = [result.data];
  } else {
    searchResults.value = [];
  }
};

const onSelectGame = game => {
  // 将选定的游戏回传给父组件
  emits('add-game', game);
};
</script>

<style scoped>
/* Tailwind 结合自定义样式亦可 */
</style>
