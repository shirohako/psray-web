<template>
  <div
    class="home-app-block bg-white w-full p-10 rounded-2xl shadow-md flex flex-col"
    :style="{ 'background-image': 'url(' + props.image + ')' }"
  >
    <slot></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  image: {
    type: String,
    required: true,
  },
});
</script>

<style>
.home-app-block {
  border: 1px solid #f1f1f4;
  background-position: 100% 50px;
  background-size: 500px auto;
  background-repeat: no-repeat;
  min-height: 240px;
}
</style>
