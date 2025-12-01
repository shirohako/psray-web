<template>
  <div class="bg-white shadow p-4 rounded-md">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold">
        {{ stage.name }}
      </h3>
      <!-- 如果当前 Stage 不是固定的（例如 No stage），显示删除按钮 -->
      <button v-if="!stage.fixed" class="text-red-500 hover:text-red-600" @click.stop="deleteStage">
        删除
      </button>
    </div>

    <!-- 游戏列表，支持拖拽排序 -->
    <ul ref="gamesListRef" class="space-y-2">
      <li
        v-for="(game, index) in localStage.games"
        :key="game.id"
        class="flex space-x-2 p-2 bg-gray-100 rounded shadow cursor-move"
      >
        <button
          class="text-red-500 hover:text-red-600 bg-white p-2"
          @click.stop="deleteGame(index)"
        >
          删除
        </button>
        <GameCard :game="game" class="grow"></GameCard>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Sortable from 'sortablejs';
import GameCard from '~/components/game/GameCard';

const props = defineProps({
  stage: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  totalStages: {
    type: Number,
    default: 1,
  },
});

const emits = defineEmits(['delete-stage', 'update-stages']);

// 使用内部状态 localStage 用于处理拖拽和局部修改
const localStage = ref(JSON.parse(JSON.stringify(props.stage)));
watch(
  () => props.stage,
  newVal => {
    localStage.value = JSON.parse(JSON.stringify(newVal));
  },
  { deep: true },
);

// 用于指向游戏列表 DOM 的引用
const gamesListRef = ref(null);
let sortableInstance = null;

onMounted(() => {
  initSortable();
});

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
});

// 初始化 Sortable 实例，实现拖拽排序和跨 Stage 拖拽
const initSortable = () => {
  if (!gamesListRef.value) return;
  sortableInstance = new Sortable(gamesListRef.value, {
    animation: 150,
    group: {
      name: 'games-group',
      pull: true,
      put: true,
    },
    draggable: 'li',
    onEnd: evt => {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      if (oldIndex === newIndex) return;

      const movedItem = localStage.value.games.splice(oldIndex, 1)[0];
      localStage.value.games.splice(newIndex, 0, movedItem);
      emits('update-stages', localStage.value);
    },
    onAdd: evt => {
      // 当游戏从其他 Stage 拖入时，触发更新
      emits('update-stages', localStage.value);
    },
    onRemove: evt => {
      // 当游戏从当前 Stage 拖出时，触发更新
      emits('update-stages', localStage.value);
    },
  });
};

// 删除当前 Stage（通知父组件删除）
const deleteStage = () => {
  emits('delete-stage', localStage.value.id);
};

// 删除指定位置的游戏，并更新 Stage 数据
const deleteGame = index => {
  localStage.value.games.splice(index, 1);
  emits('update-stages', localStage.value);
};
</script>
