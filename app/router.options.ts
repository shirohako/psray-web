import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
  // https://router.vuejs.org/api/interfaces/routeroptions.html#routes
  routes: _routes => [
    {
      name: 'home',
      redirect: { name: 'index' },
    },
    {
      path: '/p/:psnid',
      name: 'player-profile',
      component: () => import('~/pages/profile/[psnid].vue').then(r => r.default || r),
    },
    {
      path: '/trophies/:id(\\d+)/:language?/:title?',
      name: 'trophies-detail',
      component: () => import('~/pages/trophies/[id].vue').then(r => r.default || r),
    },
    {
      path: '/trophy/:id/:language?/:title?',
      name: 'trophy',
      component: () => import('~/pages/trophy/[id].vue').then(r => r.default || r),
    },
    ..._routes,
  ],
};
