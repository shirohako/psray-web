<template>
  <!-- 当visible=true时才渲染遮罩层 -->
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
  >
    <!-- 点击背景空白处关闭，也可加专门的按钮或 ESC 事件 -->
    <div class="absolute inset-0" @click.self="closeLightbox"></div>

    <!-- 中间显示的大图 -->
    <img :src="src" alt="Preview" class="max-w-full max-h-full relative z-10 object-contain" />

    <!-- 右上角关闭按钮 -->
    <button class="absolute top-5 right-5 text-white text-3xl z-10" @click="closeLightbox">
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 接收父组件传入的属性
// 1) src: 图片地址
// 2) modelValue: 用于双向绑定可见性
const props = defineProps<{
  src: string;
  modelValue: boolean;
}>();

// 向父组件发送事件
// 1) update:modelValue 用于 v-model
// 2) close (可选) 用于通知外部“已关闭”
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'close'): void;
}>();

// 用一个 computed 来实现 v-model 绑定
const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    emit('update:modelValue', val);
  },
});

function closeLightbox() {
  visible.value = false;
  emit('close'); // 如果父组件想知道关闭事件，就可以监听
}
</script>

<style scoped>
/* 你也可以在这里添加过渡动画，如 .fade-enter-active, .fade-leave-active 等 */
</style>
