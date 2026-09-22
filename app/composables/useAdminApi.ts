import { adminApiPrefix } from '~/utils/admin'
export function useAdminApi() {
  const api = useApi()
  const prefix = adminApiPrefix(useRuntimeConfig().public.apiBase)
  return {
    get: <T = any>(path: string, query?: Record<string, any>) =>
      api.get<T>(prefix + path, { query }),
    list: <T = any>(path: string, query?: Record<string, any>) =>
      api.raw.get<T[]>(prefix + path, { query }),
    write: <T = any>(
      path: string,
      body: Record<string, any>,
      method: 'post' | 'patch' = 'post',
      key: string = crypto.randomUUID(),
    ) =>
      api[method]<T>(prefix + path, body, {
        headers: { 'Idempotency-Key': key },
      }),
  }
}
