<template>
  <div>
    <h2 class="text-2xl font-semibold text-gray-800 mb-4">筛选条件</h2>
    <div class="space-y-4">
      <!-- 发售年份筛选 -->
      <div>
        <label class="block text-gray-700 mb-1">发售年份</label>
        <input
          type="number"
          v-model="localFilter.year"
          placeholder="2023"
          class="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      <button
        @click="emitFilter"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
      >
        应用筛选
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  filter: {
    type: Object,
    default: () => ({ category: '', platform: '', year: '' }),
  },
});

const emit = defineEmits(['apply-filter']);

const localFilter = ref({ ...props.filter });

watch(
  () => props.filter,
  newVal => {
    localFilter.value = { ...newVal };
  },
  { deep: true },
);

function emitFilter() {
  emit('apply-filter', { ...localFilter.value });
}
</script>
