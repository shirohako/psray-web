import { sitemapUrl } from '../../shared/sitemap'

export default defineEventHandler((event) =>
  sendRedirect(event, sitemapUrl(useRuntimeConfig(event).public.sitemapUrl), 301))
