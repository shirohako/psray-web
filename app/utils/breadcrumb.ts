/**
 * 面包屑工具类
 * 根据页面路由生成面包屑导航
 * 支持预定义路由规则和国际化
 */

import { breadcrumbConfig } from '~/config/breadcrumb';
import type { AppBreadcrumbConfig } from '~/config/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
}

export type BreadcrumbRoute =
  | string
  | {
      label: string;
      to?: string;
      icon?: string;
    };

/**
 * 从路由路径自动生成面包屑
 * @param path 路由路径
 * @param t i18n翻译函数
 * @returns 面包屑项数组
 */
function generateFromPath(path: string, t: (key: string) => string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;

    currentPath += `/${segment}`;

    // 跳过动态路由参数 (以 : 或 [ 开头)
    if (segment.startsWith(':') || segment.startsWith('[')) {
      continue;
    }

    // 尝试翻译
    const labelKey = `breadcrumb.${segment.replace(/-/g, '_')}`;
    const label = t(labelKey);

    items.push({
      label: label === labelKey ? segment : label,
      to: i === segments.length - 1 ? undefined : currentPath,
    });
  }

  return items;
}

/**
 * 根据路由生成面包屑导航
 * @param route 当前路由
 * @param t i18n翻译函数
 * @param customConfig 自定义配置(可选)
 * @returns 面包屑项数组
 */
export function getBreadcrumbs(
  route: { path: string; name?: string },
  t: (key: string) => string,
  customConfig?: AppBreadcrumbConfig,
): BreadcrumbItem[] {
  const config = customConfig || breadcrumbConfig;
  const path = route.path;

  // 首先尝试使用路由名称匹配
  if (route.name) {
    const routeConfig = config[route.name as string];
    if (routeConfig) {
      return processBreadcrumbConfig(routeConfig, t);
    }
  }

  // 然后尝试使用完整路径匹配
  const pathConfig = config[path];
  if (pathConfig) {
    return processBreadcrumbConfig(pathConfig, t);
  }

  // 尝试匹配动态路由 (移除最后一段路径参数)
  const pathSegments = path.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    // 尝试从最后一段开始逐步匹配
    for (let i = pathSegments.length; i > 0; i--) {
      const testPath = '/' + pathSegments.slice(0, i).join('/');
      const testConfig = config[testPath];
      if (testConfig) {
        return processBreadcrumbConfig(testConfig, t);
      }
    }
  }

  // 如果没有预定义配置,根据路径自动生成
  return generateFromPath(path, t);
}

/**
 * 处理面包屑配置,转换为面包屑项
 * @param configItems 配置项数组
 * @param t i18n翻译函数
 * @returns 面包屑项数组
 */
function processBreadcrumbConfig(
  configItems: BreadcrumbRoute[],
  t: (key: string) => string,
): BreadcrumbItem[] {
  return configItems.map(item => {
    if (typeof item === 'string') {
      return {
        label: t(item),
      };
    }

    return {
      label: t(item.label),
      to: item.to,
      icon: item.icon,
    };
  });
}
