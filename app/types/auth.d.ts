import type { AuthRequirement } from '~/services/auth'

declare module '#app' {
  interface PageMeta {
    auth?: boolean | AuthRequirement
    guestOnly?: boolean
    /** `false` when the page renders its own `<LanguageLinks>` (its editions); see `SiteFooter`. */
    languageLinks?: boolean
    /** Widen the default layout's content column beyond `max-w-6xl` (e.g. the three-column /docs/api). */
    wide?: boolean
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    auth?: boolean | AuthRequirement
    guestOnly?: boolean
    languageLinks?: boolean
    wide?: boolean
  }
}

export {}
