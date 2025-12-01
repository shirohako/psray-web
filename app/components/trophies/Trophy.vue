<template>
  <div
    class="flex flex-row flex-wrap items-center border rounded-md mt-2 hover:border-gray-300 bg-blue-50 bg-opacity-30 hover:bg-opacity-70"
    :class="[{ 'bg-green-100': earned, 'hover:bg-opacity-50': earned }, spacing]"
  >
    <div class="flex flex-row flex-nowrap w-full justify-center items-center px-6 sm:px-0">
      <!-- 序号 (大屏幕) -->
      <div
        class="flex-col justify-center items-center shrink-0 mx-1 text-center hidden sm:flex"
        style="width: 40px"
      >
        <Icon
          name="mdi:check-decagram"
          class="text-xl text-gray-400"
          :class="{ 'text-green-500': earned }"
        />
        <div class="flex items-center">
          <span class="text-xs">#</span>
          <span class="font-bold ml-0.5">
            {{ parseInt(trophy.trophyId) + 1 }}
          </span>
        </div>
      </div>
      <!-- 奖杯图片 -->
      <NuxtLink
        class="shrink-0"
        :to="{
          name: 'trophy',
          params: { id: trophy.id },
        }"
      >
        <img
          class="shrink-0 mr-1 border-4 p-0.5 rounded-md"
          :class="[
            {
              'border-green-400/30': earned,
              'border-stone-200': !earned,
            },
            iconSize,
          ]"
          :src="trophy.trophyIconUrl"
        />
      </NuxtLink>
      <div class="sm:grow flex flex-col justify-center mx-1 ml-2">
        <!-- 标题 -->
        <div class="font-bold text-base">
          <NuxtLink
            :to="{
              name: 'trophy',
              params: { id: trophy.id },
            }"
          >
            {{ trophyTitle }}
          </NuxtLink>
        </div>
        <!-- 描述 -->
        <div class="text-xs mt-1 break-words">{{ trophyDetail }}</div>
      </div>
      <!-- 获得时间 (大屏幕) -->
      <div
        class="shrink-0 ml-1 px-2 text-center hidden sm:inline-block"
        style="width: 60px"
        v-if="earnedDateTime"
        v-tooltip.bottom="{
          value: earnedDateTimeToolTip,
          class: 'text-center',
        }"
      >
        <div class="text-sm">
          {{ format(fromUnixTime(earnedDateTime), 'MM-dd') }}
        </div>
        <div class="text-xs">
          {{ format(fromUnixTime(earnedDateTime), 'HH:mm') }}
        </div>
      </div>
      <!-- 奖杯稀有度是否已经获得 / 稀有率 (大屏幕) -->
      <div class="flex-col items-center justify-center shrink-0 hidden sm:flex w-14">
        <div>
          <img
            :src="getTrophyIcon(trophy.trophyType)"
            class="size-8"
            v-tooltip.bottom="_.capitalize(trophy.trophyType)"
          />
        </div>
        <div class="text-xs mt-1 font-medium">
          <span
            v-tooltip.bottom="{
              value:
                'PSN Earned Rate: ' +
                trophy.trophyEarnedRate +
                '%\n PSRay Earned Rate: ' +
                trophy.psray_rate +
                '%',
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
            {{ trophy.trophyEarnedRate.toFixed(1) }}%
          </span>
        </div>
      </div>

      <!-- 折叠菜单 (通用) -->
      <div class="w-10 flex justify-center items-center">
        <OverlayBadge :value="trophy.tips" severity="contrast" size="small">
          <button
            @click="toggle"
            class="bg-gray-50 rounded-full size-6 border-2 border-blue-400 flex justify-center items-center"
          >
            <Icon name="ri:add-fill" class="text-blue-300"></Icon>
          </button>
        </OverlayBadge>
        <TieredMenu ref="menu" id="overlay_tmenu" :model="items" popup>
          <template #item="{ item, props, hasSubmenu }">
            <router-link
              v-if="item.route"
              v-slot="{ href, navigate }"
              :to="item.route"
              class="text-sm"
            >
              <a v-ripple :href="href" v-bind="props.action" @click="navigate">
                <Icon :name="item.icon" class="text-xl" />
                <span class="ml-2">{{ item.label }}</span>
              </a>
            </router-link>
            <a
              v-else
              v-ripple
              :href="item.url"
              :target="item.target"
              v-bind="props.action"
              class="text-sm"
            >
              <Icon :name="item.icon" class="text-xl" />
              <span class="ml-2">{{ item.label }}</span>
            </a>
          </template>
        </TieredMenu>
      </div>
    </div>

    <!-- 小屏幕用 -->
    <div class="w-full flex gap-3 justify-center items-center mt-3 sm:hidden">
      <!-- 序号 -->
      <div class="flex gap-0.5 items-center">
        <span class="text-xs">#</span>
        <span class="font-bold text-lg">
          {{ parseInt(trophy.trophyId) + 1 }}
        </span>
      </div>
      <Icon
        name="mdi:check-decagram"
        class="text-xl text-gray-400"
        :class="{ 'text-green-500': earned }"
      />
      <div class="flex items-center gap-1">
        <img :src="getTrophyIcon(trophy.trophyType)" class="size-6" />
        <span class="text-sm">{{ _.capitalize(trophy.trophyType) }}</span>
      </div>

      <div class="text-xs mt-1 font-medium">{{ trophy.trophyEarnedRate.toFixed(1) }}%</div>
      <!-- 是否获得 -->

      <!-- 获得时间 -->
      <div class="text-center" v-if="earnedDateTime">
        <div class="text-sm">
          {{ format(fromUnixTime(earnedDateTime), 'yyyy-MM-dd') }}
        </div>
        <div class="text-xs">
          {{ format(fromUnixTime(earnedDateTime), 'HH:mm:ss') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';
import { format, fromUnixTime } from 'date-fns';
import { TROPHY_ICON_SIZES, TROPHY_ROW_SPACINGS } from '~/constants/trophy';

const props = defineProps(['trophy', 'translate', 'earned', 'earnedDateTime']);
const setting = useSettingStore();

// 奖杯图标
const { getTrophyIcon } = usePsn();
const { trophiesIconSize, trophiesSpacings } = storeToRefs(setting);

const iconSize = computed(() => {
  const presets = _.find(TROPHY_ICON_SIZES, { value: trophiesIconSize.value });
  if (presets && presets.size) {
    return presets.size;
  } else {
    return 'trophy-icon-default';
  }
});

const spacing = computed(() => {
  const presets = _.find(TROPHY_ROW_SPACINGS, { value: trophiesSpacings.value });
  if (presets && presets.spacing) {
    return presets.spacing;
  } else {
    return 'trophy-gap-default';
  }
});

const trophyTitle = computed(() => {
  const trophy = props.trophy;
  if (props.translate) {
    const _trophy = _.chain(props.translate)
      .flatMap('trophy_data.trophyList')
      .find({ trophyId: trophy.trophyId })
      .value();
    return _trophy ? _trophy.trophyName : trophy.trophyName;
  }
  return trophy.trophyName;
});

const trophyDetail = computed(() => {
  const trophy = props.trophy;
  if (props.translate) {
    const _trophy = _.chain(props.translate)
      .flatMap('trophy_data.trophyList')
      .find({ trophyId: trophy.trophyId })
      .value();
    return _trophy ? _trophy.trophyDetail : trophy.trophyDetail;
  }
  return trophy.trophyDetail;
});

const earnedDateTimeToolTip = computed(() => {
  const _earnedDateTime = fromUnixTime(props.earnedDateTime);
  return format(_earnedDateTime, 'yyyy-MM-dd') + '\n' + format(_earnedDateTime, 'HH:mm:ss');
});

const menu = ref();
const items = ref([
  {
    label: 'Trophy Tips',
    icon: 'mdi:tooltip-edit-outline',
    route: { name: 'trophy', params: { id: props.trophy.id } },
  },
  {
    label: 'Player',
    icon: 'material-symbols:account-box-outline',
    route: { path: '/trophy/achievers', query: { id: props.trophy.id } },
  },
]);

const toggle = event => {
  menu.value.toggle(event);
};
</script>
