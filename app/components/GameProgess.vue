<template>
  <div class="relative w-full bg-gray-200 rounded-sm" :class="color">
    <div
      :style="{ width: value + '%' }"
      class="absolute top-0 h-5 rounded-sm shim"
      :class="{ shimmer: completed }"
    ></div>
    <div class="absolute w-full h-5 top-0 left-0 text-xs flex justify-center items-center">
      <span class="font-medium tracking-wider progress-text">{{ value }}%</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['value']);

const completed = computed(() => {
  return props.value == 100;
});

const color = computed(() => {
  if (props.value == 0) {
    return 'shim-0';
  } else if (props.value <= 30) {
    return 'shim-30';
  } else if (props.value <= 60) {
    return 'shim-60';
  } else if (props.value <= 80) {
    return 'shim-80';
  } else if (props.value < 100) {
    return 'shim-99';
  } else {
    return 'shim-100';
  }
});
</script>

<style scoped>
.shim {
  position: relative;
  overflow: hidden;
}

.shim-30 {
  background-color: #edf6cb;
}

.shim-60 {
  background-color: #bae8af;
}

.shim-80,
.shim-99 {
  background-color: #d3f6cb;
}

.shim-30 .shim {
  background-color: #c7e359;
}

.shim-60 .shim {
  background-color: #75d35d;
}

.shim-80 .shim {
  background-color: #5ad65a;
}

.shim-99 .shim {
  background-color: #4dd84d;
}

.shim-100 .shim {
  background-color: #38bdf8;
}

.shim-0 .progress-text .shim-30 .progress-text,
.shim-60 .progress-text {
  color: #252d0a;
}

.shim-80 .progress-text,
.shim-99 .progress-text,
.shim-100 .progress-text {
  color: #fff;
}

.shim::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(233, 233, 233, 1) 0,
    rgba(233, 233, 233, 0.9) 50%,
    rgba(233, 233, 233, 0.8) 100%
  );
  content: '';
}

.shimmer::after {
  animation: shimmer 2.5s ease-out infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(0%);
    opacity: 0;
  }
}
</style>
