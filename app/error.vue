<template>
  <!-- 自定义错误页 -->
  <section class="w-screen h-screen p-8 flex justify-center items-center">
    <div class="flex w-full h-full border-4 border-black rounded-2xl justify-center items-center">
      <div class="p-4">
        <a href="/" class="flex justify-center">
          <img
            src="https://i.psray.net/i/2024/05/21/664b74c30dea5.png"
            class="h-24 me-3"
            alt="PSRay Logo"
          />
          <span
            class="self-center text-4xl font-semibold sm:text-4xl whitespace-nowrap dark:text-white"
          >
            PSRay
          </span>
        </a>
        <!-- 错误状态码 -->
        <h1 class="text-gray-400 text-6xl font-bold text-center my-1">{{ error.statusCode }}</h1>
        <!-- 错误信息 -->
        <h2 class="text-gray-400 text-2xl font-bold text-center my-1">{{ error.statusMessage }}</h2>
        <!-- 错误说明 -->
        <h2 class="text-gray-600 text-2xl text-center my-2">
          <!-- 404 -->
          <span v-if="error.statusCode == 404"> 该页面不存在 </span>
          <!-- 500 -->
          <span v-if="error.statusCode == 500">
            <span v-if="error.url.includes('/p/')"> {{ identParam }}的信息未同步！ </span>
          </span>
        </h2>
        <!--  -->
        <section class="flex my-6">
          <NuxtLink class="relative text-lg group mx-2 md:mx-4 cursor-pointer" to="/sync">
            <span
              class="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white"
              ><span class="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"></span
              ><span
                class="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"
              ></span
              ><span class="relative">账户同步</span></span
            ><span
              class="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0"
              data-rounded="rounded-lg"
            ></span>
          </NuxtLink>
          <NuxtLink class="relative text-lg group mx-2 md:mx-4 cursor-pointer" to="/">
            <span
              class="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white"
              ><span class="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"></span
              ><span
                class="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"
              ></span
              ><span class="relative">返回主页</span></span
            ><span
              class="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0"
              data-rounded="rounded-lg"
            ></span>
          </NuxtLink>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps(['error']);
const pathParams = props.error.url.split('/');
const identParam = pathParams[pathParams.length - 1];
</script>
