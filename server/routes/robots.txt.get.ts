import { robotsText } from '../../shared/sitemap'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return robotsText(useRuntimeConfig(event).public.sitemapUrl)
})
