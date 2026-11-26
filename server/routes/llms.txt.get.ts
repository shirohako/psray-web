import { llmsText } from '../../shared/llmsTxt'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return llmsText(useRuntimeConfig(event).public)
})
