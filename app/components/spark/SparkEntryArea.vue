<template>
  <div v-if="authenticated">
    <SparkPublisher @new-activity="emit('new-activity')" />
  </div>
  <div v-else class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
    <div class="text-gray-700 text-base mb-2 font-semibold">你还没有登录哦</div>
    <p class="text-sm text-gray-500 mb-4">登录后才能发布/回复动态，和大家一起互动~</p>
    <div class="inline-flex space-x-3">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="router.push(`/auth/login`)"
      >
        登录
      </button>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        @click="router.push(`/auth/signup`)"
      >
        注册
      </button>
    </div>
  </div>
</template>

<script setup>
import SparkPublisher from '~/components/spark/SparkPublisher.vue';

const router = useRouter();
const userStore = useUserStore();
const { authenticated, user } = storeToRefs(userStore);

const emit = defineEmits(['new-activity']);
</script>
