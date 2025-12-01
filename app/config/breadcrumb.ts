/**
 * 面包屑导航配置
 */

export interface AppBreadcrumbConfig {
  [key: string]: BreadcrumbRoute[];
}

// ============ 路由配置 ============

export const breadcrumbConfig: AppBreadcrumbConfig = {
  // 主页
  '/': [],

  // 排行榜
  '/leaderboard': [{ label: 'breadcrumb.leaderboard', to: '/leaderboard' }],

  // 奖杯组
  '/trophies/overview': [{ label: 'breadcrumb.trophies', to: '/trophies/overview' }],
  '/trophies/search': [
    { label: 'breadcrumb.trophies', to: '/trophies/overview' },
    { label: 'breadcrumb.search' },
  ],

  // 游戏
  '/games': [{ label: 'breadcrumb.games', to: '/games' }],
  '/games/overview': [{ label: 'breadcrumb.games', to: '/games' }],

  // 同步
  '/sync': [{ label: 'breadcrumb.sync', to: '/sync' }],

  // 社区实验室
  '/laboratory': [{ label: 'breadcrumb.laboratory', to: '/laboratory' }],
  '/laboratory/guide/tips': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.guide' },
    { label: 'breadcrumb.tips' },
  ],
  '/laboratory/wiki/ranking': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.wiki' },
    { label: 'breadcrumb.ranking' },
  ],
  '/laboratory/wiki/orphaned-trophies': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.wiki' },
    { label: 'breadcrumb.orphaned_trophies' },
  ],
  '/laboratory/rewards/star-piece': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.rewards' },
    { label: 'breadcrumb.star_piece' },
  ],
  '/laboratory/rewards/rare-candy': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.rewards' },
    { label: 'breadcrumb.rare_candy' },
  ],
  '/laboratory/rewards/philosophers-stone': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.rewards' },
    { label: 'breadcrumb.philosophers_stone' },
  ],
  '/laboratory/rewards/mira': [
    { label: 'breadcrumb.laboratory', to: '/laboratory' },
    { label: 'breadcrumb.rewards' },
    { label: 'breadcrumb.mira' },
  ],

  // 论坛
  '/forum': [{ label: 'breadcrumb.forum', to: '/forum' }],

  // 商店/兑换
  '/store': [{ label: 'breadcrumb.store', to: '/store' }],
  '/store/redeem': [{ label: 'breadcrumb.store', to: '/store' }, { label: 'breadcrumb.redeem' }],

  // 反作弊
  '/anti-cheating': [{ label: 'breadcrumb.anti_cheating', to: '/anti-cheating' }],
  '/anti-cheating/log': [
    { label: 'breadcrumb.anti_cheating', to: '/anti-cheating' },
    { label: 'breadcrumb.log' },
  ],

  // 关于
  '/about': [{ label: 'breadcrumb.about', to: '/about' }],

  // 登录/注册
  '/auth/login': [{ label: 'breadcrumb.login' }],
  '/auth/signup': [{ label: 'breadcrumb.signup' }],

  // 隐私和条款
  '/privacy': [{ label: 'breadcrumb.privacy' }],
  '/terms': [{ label: 'breadcrumb.terms' }],
  '/delete-data': [{ label: 'breadcrumb.delete_data' }],
};
