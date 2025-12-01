<template>
  <div class="space-y-4">
    <!-- 使用 v-for 渲染多个 StageItem -->
    <StageItem
      v-for="(stage, index) in localStages"
      :key="stage.id"
      :stage="stage"
      :index="index"
      :total-stages="localStages.length"
      @delete-stage="onDeleteStage"
      @update-stages="onInnerStageChange"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import StageItem from './StageItem.vue';

const props = defineProps({
  stages: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(['stage-delete', 'update-stages']);

// 为了在本组件中能做一些操作（如整体拖拽）而有必要拷贝一份内部数据
const localStages = ref(JSON.parse(JSON.stringify(props.stages)));

// 当父组件的 stages 变化时，需要同步更新内部
watch(
  () => props.stages,
  newVal => {
    localStages.value = JSON.parse(JSON.stringify(newVal));
  },
  { deep: true },
);

// 删除阶段
const onDeleteStage = stageId => {
  emits('stage-delete', stageId);
};

// 当内部stage(如games顺序)改变时，我们需要将整个 localStages 更新回父组件
const onInnerStageChange = updatedStage => {
  // updatedStage为某个stage的新数据，需要把它替换回 localStages
  const idx = localStages.value.findIndex(s => s.id === updatedStage.id);
  if (idx !== -1) {
    localStages.value[idx] = { ...updatedStage };
  }

  // 将当前最新 localStages 整体同步到父组件
  emits('update-stages', [...localStages.value]);
};
</script>
