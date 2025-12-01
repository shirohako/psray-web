<template>
  <Breadcrumb :model="items" :home="home" :pt="ptOptions">
    <template #item="{ item, props }">
      <NuxtLink v-if="item.route" :to="item.route" :class="linkClass" v-bind="props.action">
        <Icon v-if="item.icon" :name="item.icon" class="text-lg" />
        <span class="font-normal">{{ item.label }}</span>
      </NuxtLink>
      <span v-else :class="currentClass" v-bind="props.action">
        <Icon v-if="item.icon" :name="item.icon" class="text-lg" />
        <span class="font-semibold">{{ item.label }}</span>
      </span>
    </template>
    <template #separator>
      <Icon name="material-symbols:chevron-right" :class="separatorClass" />
    </template>
  </Breadcrumb>
</template>

<script setup lang="ts">
import Breadcrumb from 'primevue/breadcrumb';
import { getBreadcrumbs } from '~/utils/breadcrumb';
import type { BreadcrumbItem } from '~/utils/breadcrumb';

interface Props {
  /**
   * 自定义面包屑项（可选）
   * 如果提供，将覆盖自动生成的面包屑
   */
  items?: BreadcrumbItem[];
  /**
   * 是否显示主页
   * @default true
   */
  showHome?: boolean;
  /**
   * 主页图标
   * @default 'material-symbols:home-outline'
   */
  homeIcon?: string;
  /**
   * 样式变体
   * @default 'light'
   */
  variant?: 'light' | 'dark';
}

const props = withDefaults(defineProps<Props>(), {
  showHome: true,
  homeIcon: 'material-symbols:home-outline',
  variant: 'light',
});

const route = useRoute();
const { t } = useI18n();

// 生成面包屑项
const breadcrumbs = computed(() => {
  // 如果提供了自定义项，使用自定义项
  if (props.items && props.items.length > 0) {
    return props.items;
  }

  // 否则根据路由自动生成
  return getBreadcrumbs(
    {
      path: route.path,
      name: typeof route.name === 'string' ? route.name : undefined,
    },
    t,
  );
});

// 主页项
const home = computed(() => {
  if (!props.showHome) {
    return undefined;
  }

  return {
    icon: props.homeIcon,
    label: t('breadcrumb.home'),
    route: '/',
  };
});

// 转换为 PrimeVue Breadcrumb 格式
const items = computed(() => {
  return breadcrumbs.value.map(item => ({
    label: item.label,
    route: item.to,
    icon: item.icon,
  }));
});

// PrimeVue Passthrough 选项
const ptOptions = {
  root: {
    class: '!bg-transparent !border-0 !p-0',
  },
  list: {
    class: 'flex items-center gap-1 flex-wrap',
  },
  item: {
    class: 'flex items-center',
  },
  separator: {
    class: 'mx-1',
  },
};

const linkClass = computed(() => {
  if (props.variant === 'dark') {
    return 'flex items-center gap-2 text-white hover:text-gray-200 no-underline';
  }
  return 'flex items-center gap-2 text-gray-600 hover:text-gray-950 no-underline';
});

const currentClass = computed(() => {
  if (props.variant === 'dark') {
    return 'flex items-center gap-2 text-white';
  }
  return 'flex items-center gap-2 text-gray-800';
});

const separatorClass = computed(() => {
  if (props.variant === 'dark') {
    return 'text-gray-500';
  }
  return 'text-gray-400';
});
</script>
