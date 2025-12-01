<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <!-- 标题 -->
    <h2 class="text-lg font-semibold text-gray-800 mb-1">外部链接</h2>
    <!-- 可选的简介或副标题 -->
    <p class="text-sm text-gray-500 mb-4">
      Find more about this game on official sites and social platforms
    </p>

    <!-- 社交网络链接 (网格展示) -->
    <div v-if="links.length" class="grid grid-cols-1 gap-3">
      <div v-for="(item, index) in links" :key="index" class="flex items-center flex-col">
        <a
          :href="item.url"
          target="_blank"
          class="group space-x-2 flex w-full items-center justify-start px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-md transition-colors"
        >
          <Icon :name="item.icon" class="size-4" />
          <span class="inline-block text-xs font-semibold group-hover:text-gray-800">
            {{ item.label }}
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const igdb = useGame();

const props = defineProps({
  game: {
    type: Object,
  },
});

const links = computed(() => {
  const items = [];
  if (props.game) {
    if (props.game?.igdb_slug) {
      items.push({
        label: 'IGDB Database',
        url: igdb.getIgdbLink(props.game),
        icon: 'material-symbols:database',
      });
    }
  }
  return items;
});
</script>
