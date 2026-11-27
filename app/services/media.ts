/**
 * Image uploads: `POST /media` (psray-api docs/api/media/upload.md). Upload
 * first, then hand the returned `id` to the endpoint that uses the picture
 * (e.g. `PATCH /user/setting` with `banner` / `avatar`). Pictures that are
 * never attached are pruned by the API after a grace period.
 *
 * This goes through XMLHttpRequest rather than `$api`, because fetch can't
 * report upload progress. It sends the same headers as the `$api` plugin and
 * throws the same {@link ApiError}s.
 */
import type { MediaImage } from '~/types/media'
import type { UserMediaPurpose } from '~/utils/media'
import { ApiError } from '~/utils/ApiError'

/** A freshly uploaded picture: always stored locally, so `id` is set. */
export interface UploadedMedia extends MediaImage {
  id: string
  purpose: UserMediaPurpose
}

export interface UploadOptions {
  /** Sent as the file's name; the API only keeps it for the admin media page. */
  filename?: string
  /** Fraction of the body sent so far, 0–1. */
  onProgress?: (fraction: number) => void
  /** The whole body has been sent; the server is now working on it. */
  onSent?: () => void
  /** Aborting rejects with a `DOMException` named `AbortError`. */
  signal?: AbortSignal
}

/**
 * Sends a multipart form with upload progress, the same headers as the `$api`
 * plugin, and the same {@link ApiError}s. Resolves with the envelope's `data`.
 * Shared by every endpoint that takes a file (`POST /media`,
 * `POST /user/screenshots`).
 */
export function useUploadRequest() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('auth_token', { readonly: true })
  const { acceptLanguage } = usePreferences()

  return function send<T>(path: string, body: FormData, options: Omit<UploadOptions, 'filename'> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (options.signal?.aborted) {
        reject(new DOMException('The upload was aborted.', 'AbortError'))
        return
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${String(config.public.apiBase).replace(/\/+$/, '')}${path}`)
      xhr.responseType = 'json'
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.setRequestHeader('X-Request-Id', crypto.randomUUID())
      if (token.value) xhr.setRequestHeader('Authorization', `Bearer ${token.value}`)
      if (acceptLanguage.value) xhr.setRequestHeader('Accept-Language', acceptLanguage.value)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) options.onProgress?.(event.loaded / event.total)
      }
      xhr.upload.onload = () => {
        options.onProgress?.(1)
        options.onSent?.()
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.data) {
          options.onProgress?.(1)
          resolve(xhr.response.data as T)
        }
        else {
          reject(ApiError.fromResponse(xhr.status, xhr.response))
        }
      }
      // Network failure, CORS, or the server dropped the connection.
      xhr.onerror = () => reject(new ApiError({ code: 'INTERNAL_ERROR', message: 'The upload failed. Please try again.', status: 0 }))
      xhr.onabort = () => reject(new DOMException('The upload was aborted.', 'AbortError'))
      options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })

      xhr.send(body)
    })
  }
}

export function useMediaApi() {
  const send = useUploadRequest()

  function upload(file: Blob, purpose: UserMediaPurpose, options: UploadOptions = {}): Promise<UploadedMedia> {
    const body = new FormData()
    body.append('purpose', purpose)
    body.append('file', file, options.filename ?? `${purpose}.${extensionOf(file.type)}`)
    return send<UploadedMedia>('/media', body, options)
  }

  return { upload }
}

/** File extension for a MIME type, for the uploaded file's name. */
export function extensionOf(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  return type.startsWith('image/') ? type.slice(6) : 'bin'
}
