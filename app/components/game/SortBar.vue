<template>
  <div class="flex items-center space-x-4">
    <button :class="buttonClass('addedTime')" @click="onSort('addedTime')">添加时间</button>
    <button :class="buttonClass('releaseDate')" @click="onSort('releaseDate')">游戏发售时间</button>
    <button :class="buttonClass('popularity', true)" disabled>热门程度</button>
    <button :class="buttonClass('comprehensive', true)" disabled>综合评分</button>
  </div>
</template>

<script setup>
const props = defineProps({
  currentSort: {
    type: String,
    default: 'addedTime',
  },
});

const emit = defineEmits(['change-sort']);

// 处理排序按钮点击事件
function onSort(criteria) {
  // 如果是禁用状态的排序，则不触发事件
  if (criteria === 'popularity' || criteria === 'comprehensive') return;
  emit('change-sort', criteria);
}

// 按钮样式，根据当前选中和是否禁用来设置
function buttonClass(criteria, disabled = false) {
  const base = 'px-4 py-2 rounded transition';
  if (disabled) {
    return `${base} bg-gray-200 text-gray-500 cursor-not-allowed opacity-50`;
  }
  if (props.currentSort === criteria) {
    return `${base} bg-blue-500 text-white`;
  } else {
    return `${base} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  }
}
</script>
