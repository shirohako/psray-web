/**
 * An image as every API field returns it (psray-api docs/media.md "ImageObject"):
 * WebP variants under `/media/…`, never overwritten, so URLs can be cached for good.
 *
 * `id` is what forms send back to attach the image. It is `null` only for a
 * game cover that has not been copied locally yet: then just `url` (the IGDB
 * original) is set and the rest is `null`.
 */
export interface MediaImage {
  id: string | null
  /** Largest variant. */
  url: string
  width: number | null
  height: number | null
  /** Average colour (`#rrggbb`), for a placeholder while the image loads. */
  color: string | null
  /** Ready for `<img srcset>`. */
  srcset: string | null
}
