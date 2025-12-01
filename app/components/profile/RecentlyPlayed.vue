<template>
  <!-- 游戏区域 -->
  <div class="mt-3">
    <div
      class="flex my-3 border rounded-md py-2 px-4 flex-wrap lg:flex-nowrap hover:border-stone-300 hover:bg-slate-50 bg-opacity-50 relative"
      :class="played.trophySet?.platform"
      v-for="played in recentlyPlayed"
    >
      <!-- 图片 -->
      <div class="flex shrink-0 justify-center items-center w-full lg:w-auto">
        <NuxtLink
          class="text-md"
          :href="
            getLink(
              getTitle(
                played.trophySet.localization,
                played.trophySet.trophyTitleName,
                played.trophySet.default_language,
              ),
              played.trophySet,
            )
          "
        >
          <img :src="played.trophySet.trophyTitleIconUrl" style="width: 160px" />
        </NuxtLink>
      </div>
      <!-- 标题 平台 最后更新时间 -->
      <div
        class="z-10 flex flex-col gap-1 justify-around px-2 py-1 grow items-center lg:items-start basis-full lg:basis-0"
      >
        <div class="text-base font-bold text-center md:text-left">
          <NuxtLink
            class="text-md"
            :href="
              getLink(
                getTitle(
                  played.trophySet.localization,
                  played.trophySet.trophyTitleName,
                  played.trophySet.default_language,
                ),
                played.trophySet,
              )
            "
          >
            {{
              getTitle(
                played.trophySet.localization,
                played.trophySet.trophyTitleName,
                played.trophySet.default_language,
              ).title
            }}
          </NuxtLink>
          <div class="flex justify-center gap-2 lg:justify-start my-0.5">
            <div
              class="flex items-center rounded-sm px-2.5 py-0.5 font-medium text-xs"
              :class="'platform-' + platform.toLowerCase()"
              v-for="platform in played.trophySet.platform"
            >
              <span>{{ platform }}</span>
            </div>
            <div
              class="flex items-center gap-1 rounded-sm px-2 py-0.5 font-medium text-xs text-gray-600 bg-gray-100"
              v-if="played.trophySet.region"
              v-for="region in played.trophySet.region.split(',')"
            >
              <Icon name="ph:globe" class="text-xs"></Icon>
              <span>{{ region }}</span>
            </div>
          </div>
        </div>
        <div class="text-xs text-center md:text-left">
          <p>{{ played.last_updated_at }}</p>
          <p>
            耗时
            {{ getPlayDuration(played.gap, played.progess) }}
          </p>
        </div>
      </div>
      <!-- 已经获得的奖杯 -->
      <div
        class="flex flex-col justify-center items-center px-2 shrink-0 basis-full lg:basis-0 mx-auto"
        style="min-width: 160px; max-width: 200px"
      >
        <div class="flex justify-center gap-2">
          <div class="flex items-center gap-1">
            <img class="size-5" :src="getTrophyIcon('gold')" />
            <span class="text-base">
              {{ played.earned_gold }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <img class="size-5" :src="getTrophyIcon('silver')" />
            <span class="text-base">
              {{ played.earned_silver }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <img class="size-5" :src="getTrophyIcon('bronze')" />
            <span class="text-base">
              {{ played.earned_bronze }}
            </span>
          </div>
        </div>
        <div class="mt-2 w-full">
          <GameProgess :value="played.progress" />
        </div>
      </div>
      <!-- 是否白金 -->
      <div
        class="flex flex-col justify-center items-center shrink-0 basis-full lg:basis-0 mt-3 lg:mt-0 min-w-20"
      >
        <!-- 白金图标 -->
        <div>
          <img
            class="size-9"
            :class="{ 'opacity-40': played.earned_platinum != 1 }"
            :src="getTrophyIcon('platinum')"
          />
        </div>

        <div>
          <!-- 白金率统计 -->
          <div
            class="text-xs mt-2.5 flex justify-center items-center"
            v-tooltip.bottom="{
              value: 'PSRay Platinum Rate',
              class: 'text-center',
            }"
          >
            <Icon name="lets-icons:done-ring-round-duotone" class="text-green-600 mr-0.5 text-lg" />
            <span>{{ played.trophySet.platinumRate }} %</span>
          </div>
          <div
            class="text-xs mt-1 flex justify-center items-center"
            v-if="played.trophySet?.completedRate"
            v-tooltip.bottom="{
              value: 'PSRay 100% Completed Rate',
              class: 'text-center',
              pt: {
                text: {
                  style: {
                    width: '250px;',
                  },
                },
              },
            }"
          >
            <Icon name="lets-icons:done-ring-round-duotone" class="text-blue-600 mr-0.5 text-lg" />
            <span>{{ played.trophySet.completedRate }} %</span>
          </div>
        </div>
      </div>
      <div class="hanamaru" v-if="played.progress === 100"></div>
    </div>
  </div>
</template>

<script setup>
import { zhCN } from 'date-fns/locale';
import { formatDuration, intervalToDuration } from 'date-fns';
import _ from 'lodash';
const { locale } = useI18n();
import { TROPHY_LANG_ORDER } from '~/constants/trophy';

const props = defineProps(['recentlyPlayed', 'psnid']);

const { getTrophyIcon, getTrophySetTitleSlug } = usePsn();

const setting = useSettingStore();
const { customLocalization, customLocalizationValue } = storeToRefs(setting);

function getPlayDuration(duration, progess) {
  if (progess > 0 && duration == 0) {
    duration = 1;
  }

  const gapString = formatDuration(
    intervalToDuration({
      start: 0,
      end: duration * 1000,
    }),
    { delimiter: ', ', locale: zhCN },
  );
  if (!gapString) {
    return '0 秒';
  }
  const parts = gapString.split(',');

  if (parts.length < 3) {
    return gapString;
  }
  return parts.slice(0, 3).join(',');
}

function getTrophyLanguageOrder() {
  if (!customLocalization.value) {
    return TROPHY_LANG_ORDER[locale.value] || ['default'];
  } else {
    return customLocalizationValue.value;
  }
}

function getTitle(localizations, defaultTitle, defaultLang) {
  const order = getTrophyLanguageOrder(); // e.g., ['zh-hans', 'zh-hant', 'default']

  for (const lang of order) {
    if (lang.toLowerCase() === 'default') {
      return { title: defaultTitle, lang: defaultLang };
    }

    const loc = _.find(localizations, l => l.language_code.toLowerCase() === lang.toLowerCase());
    if (loc && loc.title) {
      return { title: loc.title, lang: loc.language_code };
    }
  }

  // 如果都没有匹配到，fallback 到默认标题
  return { title: defaultTitle, lang: defaultLang };
}

function getLink(loc, trophySet) {
  return (
    '/trophies/' +
    trophySet.id +
    '/' +
    loc.lang +
    '/' +
    getTrophySetTitleSlug(loc.title) +
    '?psnid=' +
    props.psnid
  );
}
</script>

<style scoped>
.hanamaru {
  position: absolute;
  width: 80px;
  height: 80px;
  opacity: 10%;
  background-image: url('https://i.psray.net/i/2024/05/26/6652f82a20081.png');
  background-repeat: no-repeat;
  background-size: cover;
  right: 35%;
  bottom: 15%;
  z-index: 1;
}
</style>
