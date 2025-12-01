<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6">
    <!-- 导航面包屑 -->
    <div class="px-4 py-6 bg-blue-100 text-blue-500 rounded-md my-3">
      {{ $t('anti_cheat.pinned') }}
    </div>
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-1">
        <h2 class="font-bold text-xl">{{ $t('anti_cheat.title') }}</h2>
        <div>{{ $t('anti_cheat.text_1') }}</div>
        <div>
          {{ $t('anti_cheat.text_2') }}
        </div>
        <div class="mt-3 grid grid-cols-1 gap-3">
          <NuxtLink
            :to="{
              path: '/anti-cheating/log',
            }"
          >
            <div class="flex gap-3 items-center justify-between border p-2 rounded-md">
              <div class="flex gap-3 items-center">
                <img src="https://i.psray.net/i/2024/09/28/66f8103941cc0.png" class="w-8 h-8" />
                <span class="font-bold">{{ $t('anti_cheat.ban_record') }}</span>
              </div>
              <Icon
                name="material-symbols:arrow-right-alt-rounded"
                class="text-2xl hover:translate-x-1 transition-transform"
              ></Icon>
            </div>
          </NuxtLink>
        </div>
        <div class="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white rounded-lg border">
            <div class="flex px-3 py-2 gap-1">
              <div class="circle">
                <span class="bg-yellow-400 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-blue-500 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-purple-500 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-pink-500 box inline-block center w-3 h-3 rounded-full"></span>
              </div>
            </div>
            <div class="card__content px-4 py-2">
              <p class="font-semibold">{{ $t('anti_cheat.card_1') }}</p>
              <p class="font-bold text-4xl mt-3">{{ data.termination }}</p>
            </div>
          </div>

          <div class="bg-white rounded-lg border">
            <div class="flex px-3 py-2 gap-1">
              <div class="circle">
                <span class="bg-yellow-400 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-blue-500 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-purple-500 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-pink-500 box inline-block center w-3 h-3 rounded-full"></span>
              </div>
            </div>
            <div class="card__content px-4 py-2">
              <p class="font-semibold">{{ $t('anti_cheat.card_2') }}</p>
              <p class="font-bold text-4xl mt-3">0</p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="font-bold text-xl">
          {{ $t('anti_cheat.description.title') }}
        </h2>
        <ul class="list-disc space-y-2 mt-3">
          <li>
            {{ $t('anti_cheat.description.text_1') }}
          </li>
          <li>
            {{ $t('anti_cheat.description.text_2') }}
          </li>
          <li>
            {{ $t('anti_cheat.description.text_3') }}
          </li>
          <li>
            {{ $t('anti_cheat.description.text_4') }}
          </li>
          <li>
            {{ $t('anti_cheat.description.text_5') }}
          </li>
        </ul>
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="font-bold text-xl">{{ $t('anti_cheat.level.title') }}</h2>
        <div class="text-sm">
          {{ $t('anti_cheat.level.description') }}
        </div>
        <div class="flex flex-col">
          <div class="-m-1.5 overflow-x-auto">
            <div class="p-1.5 min-w-full inline-block align-middle">
              <div class="overflow-hidden">
                <table class="divide-y divide-gray-200 table-fixed">
                  <thead>
                    <tr class="font-bold text-base text-gray-800">
                      <th class="px-6 py-3 text-start uppercase">
                        {{ $t('anti_cheat.level.table_head') }}
                      </th>
                      <th class="px-6 py-3 text-start uppercase min-w-28">
                        {{ $t('anti_cheat.level.measures') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <div class="flex items-center gap-1">
                          <span
                            class="bg-yellow-400 inline-block center w-3 h-3 rounded-full"
                          ></span>
                          <span>{{ $t('anti_cheat.level.warning') }}</span>
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <span>{{ $t('anti_cheat.level.warning_text') }}</span>
                      </td>
                    </tr>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <div class="flex items-center gap-1">
                          <span class="bg-blue-500 inline-block center w-3 h-3 rounded-full"></span>
                          <span>{{ $t('anti_cheat.level.suspension') }}</span>
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <span>
                          {{ $t('anti_cheat.level.suspension_text') }}
                        </span>
                      </td>
                    </tr>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <div class="flex items-center gap-1">
                          <span
                            class="bg-purple-500 inline-block center w-3 h-3 rounded-full"
                          ></span>
                          <span>{{ $t('anti_cheat.level.ban') }}</span>
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <span>{{ $t('anti_cheat.level.ban_text') }}</span>
                      </td>
                    </tr>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <div class="flex items-center gap-1">
                          <span class="bg-pink-400 inline-block center w-3 h-3 rounded-full"></span>
                          <span>{{ $t('anti_cheat.level.termination') }}</span>
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <span>
                          {{ $t('anti_cheat.level.termination_text') }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="font-bold text-xl">
          {{ $t('anti_cheat.components.title') }}
        </h2>
        <div class="text-sm">
          {{ $t('anti_cheat.components.description') }}
        </div>
        <ul class="list-disc space-y-2 mt-3">
          <li>
            {{ $t('anti_cheat.components.text_1') }}
          </li>
          <li>
            {{ $t('anti_cheat.components.text_2') }}
          </li>
          <li>
            {{ $t('anti_cheat.components.text_3') }}
          </li>
        </ul>
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="font-bold text-xl">
          {{ $t('anti_cheat.auto_detection.title') }}
        </h2>
        <div class="text-sm">{{ $t('anti_cheat.auto_detection.text_1') }}</div>
        <div>
          {{ $t('anti_cheat.auto_detection.text_2') }}
        </div>
        <div>{{ $t('anti_cheat.auto_detection.text_3') }}</div>
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="font-bold text-xl">{{ $t('anti_cheat.appeal.title') }}</h2>
        <div>
          {{ $t('anti_cheat.appeal.text_1') }}
          <code class="ml-1 rounded-md px-2 py-1 bg-slate-100"> ame@psray.net </code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const api = useApi();

const { data } = await useAsyncData('anti-cheating', fetchData);

async function fetchData() {
  const res = await api.get('/log/anti-cheating-statis');
  return res.data;
}
</script>
