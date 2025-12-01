// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from './app/config/theme.js';
import { execSync } from 'child_process';

const gitCommitId = execSync('git rev-parse --short HEAD').toString().trim();
const gitCommitDate = execSync('git log -1 --format=%cd --date=format:%Y%m%d').toString().trim();

export default defineNuxtConfig({
  devtools: { enabled: false },
  compatibilityDate: '2025-03-08',
  routeRules: {
    '/**': { ssr: false },
    '/': { ssr: true },
    '/trophies/**': { ssr: true },
    '/p/**': { ssr: true },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', sizes: "256x256", href: '/favicon.png' },
        { rel: 'icon', type: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: "180x180" },
        { rel: 'icon', type: 'image/png', sizes: "32x32", href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: "16x16", href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    }
  },
  devServer: {
    port: 3001,
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    '@primevue/nuxt-module',
    'nuxt-umami',
  ],
  build: {
    transpile: [/vue3-calendar-heatmap/]
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE,
      gitCommitId,
      gitCommitDate,
    },
  },
  icon: {
    serverBundle: 'local'
  },
  umami: {
    id: 'a8667f99-db2b-432b-9cb0-d1b046e09c8f',
    host: 'https://akari.abyss.moe',
    autoTrack: true,
  },
  primevue: {
    options: {
      theme: {
        prefix: 'prime',
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        }
      }
    },
    components: {
      exclude: ['Editor', 'Form', 'Chart', 'FormField']
    }
  },
  piniaPluginPersistedstate: {
    cookieOptions: {
      sameSite: 'strict',
      maxAge: 34560000
    },
  },
  i18n: {
    strategy: "no_prefix",
    locales: [
      {
        code: "en",
        file: "en-US.js",
      },
      {
        code: "zh-Hans",
        file: "zh-Hans.js",
      },
      {
        code: "zh-Hant",
        file: "zh-Hant.js",
      },
      {
        code: "ja",
        file: "ja-JP.js",
      },
      {
        code: "ko",
        file: "ko-KR.js",
      },
    ],
    defaultLocale: "ja",
  },
});