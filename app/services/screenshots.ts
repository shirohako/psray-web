/**
 * Game screenshots (psray-api docs/api/user/screenshot/README.md): the owner
 * uploads and manages them on /me/screenshots; public ones appear on the
 * profile's screenshot showcases.
 *
 * Uploads go through XMLHttpRequest for progress, like `POST /media`; the
 * API re-encodes to WebP (long side ≤ 2560) and draws the chosen watermarks
 * into the picture, so those can't change afterwards.
 */
import type { MediaImage } from '~/types/media'
import type { ShowcaseGame } from '~/services/profile'
import { extensionOf, useUploadRequest, type UploadOptions } from '~/services/media'

/** A screenshot as anyone sees it (profile showcases, `GET /profile/:psnid/screenshots`). */
export interface Screenshot {
  id: number
  image: MediaImage
  caption: string | null
  /** The linked game (a trophy set the owner played), name in the display language. */
  game: ShowcaseGame | null
  created_at: string
}

/** The owner's view (`/user/screenshots`). */
export interface OwnScreenshot extends Screenshot {
  is_public: boolean
  /** Which watermarks were drawn in at upload. */
  watermarks: { psn: boolean, profile: boolean }
  /** Bytes it takes, all sizes together; counts towards the limit. */
  bytes: number
}

/** Storage used and the limits; a limit of 0 means none. */
export interface ScreenshotUsage {
  count: number
  bytes: number
  max_count: number
  max_bytes: number
}

/** A game the owner's screenshots link to, with how many. */
export interface ScreenshotGame extends ShowcaseGame {
  count: number
}

export interface ScreenshotPageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
  usage: ScreenshotUsage
  games: ScreenshotGame[]
}

export interface PublicScreenshotPageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Choices made for an upload; the watermarks are final. */
export interface ScreenshotUploadFields {
  is_public: boolean
  watermark_psn: boolean
  watermark_profile: boolean
  trophy_set_id?: number | null
  caption?: string | null
}

export interface ScreenshotUpdate {
  is_public?: boolean
  /** `null` or blank clears it. */
  caption?: string | null
  /** `null` unlinks the game. */
  trophy_set_id?: number | null
}

export function useScreenshotApi() {
  const send = useUploadRequest()
  const { patch, delete: del } = useApi()

  function upload(file: Blob, fields: ScreenshotUploadFields, options: UploadOptions = {}): Promise<OwnScreenshot> {
    const body = new FormData()
    body.append('file', file, options.filename ?? `screenshot.${extensionOf(file.type)}`)
    // multipart booleans are 1 / 0: the API doesn't take "true" / "false".
    body.append('is_public', fields.is_public ? '1' : '0')
    body.append('watermark_psn', fields.watermark_psn ? '1' : '0')
    body.append('watermark_profile', fields.watermark_profile ? '1' : '0')
    if (fields.trophy_set_id) body.append('trophy_set_id', String(fields.trophy_set_id))
    if (fields.caption?.trim()) body.append('caption', fields.caption.trim())
    return send<OwnScreenshot>('/user/screenshots', body, options)
  }

  function update(id: number, payload: ScreenshotUpdate): Promise<OwnScreenshot> {
    return patch<OwnScreenshot>(`/user/screenshots/${id}`, payload)
  }

  function remove(id: number): Promise<unknown> {
    return del(`/user/screenshots/${id}`)
  }

  return { upload, update, remove }
}
