<template>
  <div class="p-4 space-y-4">
    <h1 class="text-2xl font-bold mb-2">游戏系列编辑</h1>

    <!-- 顶部操作按钮组 -->
    <div class="flex space-x-2">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        @click="onAddStage"
      >
        添加Stage
      </button>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        @click="onShowGameDialog"
      >
        添加游戏
      </button>
      <button
        class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        @click="onSave"
      >
        保存
      </button>
    </div>

    <div>
      <label>系列名：</label>
      <InputText type="text" v-model="seriesName" />
    </div>

    <!-- 阶段列表 -->
    <StageList :stages="stages" @stage-delete="onDeleteStage" @update-stages="onUpdateStages" />

    <!-- 搜索弹窗 -->
    <GameSearchModal v-if="showGameDialog" @close="onCloseGameDialog" @add-game="onAddGame" />
  </div>
</template>

<script setup>
import StageList from '~/components/series/StageList.vue';
import GameSearchModal from '~/components/series/GameSearchModal.vue';

// 初始只有一个固定的 "No stage"
const stages = ref([
  {
    id: 'stage-0',
    name: 'No stage',
    games: [],
    fixed: true,
  },
]);

const showGameDialog = ref(false);
const seriesName = ref('Untitled');

// 添加新的 Stage（新添加的 Stage 的命名会在删除后统一重新排序）
const onAddStage = () => {
  const newStageId = `stage-${Date.now()}`;
  stages.value.push({
    id: newStageId,
    name: `Stage ${stages.value.length}`,
    games: [],
    fixed: false,
  });
};

// 删除 Stage 后，重新为所有 Stage 重新排序名称
const onDeleteStage = stageId => {
  const idx = stages.value.findIndex(stage => stage.id === stageId);
  if (idx > -1 && !stages.value[idx].fixed) {
    stages.value.splice(idx, 1);
    // 重新排序：第一个固定为 "No stage"，后续依次为 "Stage 1"、"Stage 2"……
    stages.value.forEach((stage, index) => {
      if (index === 0) {
        stage.name = 'No stage';
      } else {
        stage.name = `Stage ${index}`;
      }
    });
  }
};

// 用户拖拽后更新 stages 数据
const onUpdateStages = updatedStages => {
  stages.value = updatedStages;
};

// 显示或关闭游戏搜索对话框
const onShowGameDialog = () => {
  showGameDialog.value = true;
};

const onCloseGameDialog = () => {
  showGameDialog.value = false;
};

// 在游戏搜索弹窗中选中游戏后，添加到 "No stage" 内
const onAddGame = game => {
  stages.value[0].games.push(game);
  onCloseGameDialog();
};

// 新增：模拟保存数据（导出数据）
const onSave = () => {
  // 这里模拟将当前 series 数据导出，实际可调用接口或下载文件等
  console.log('导出数据：', JSON.stringify(stages.value, null, 2));
  alert('数据已导出，请查看控制台输出。');
};
</script>
