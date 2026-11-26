/**
 * The tier list maker's image library: pictures the visitor uploaded, kept in
 * IndexedDB on their device and never sent to the server. Lists refer to an
 * image by id, so one picture can be used in several lists. localStorage would
 * hold only a few of them (about 5 MB in all), which is why they live here.
 *
 * Images are scaled down before they are stored: a tile is at most a few
 * hundred pixels wide, even in an exported PNG.
 */

const DB_NAME = 'psray-tierlist'
const DB_VERSION = 1
const STORE = 'images'

/** Longest side of a stored image. */
export const TIER_IMAGE_MAX_SIDE = 600
/** Files above this are refused before they are decoded. */
export const TIER_IMAGE_MAX_BYTES = 20 * 1024 * 1024

export interface TierImage {
  id: string
  name: string
  blob: Blob
  width: number
  height: number
  createdAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB is blocked'))
  }).catch((error) => {
    dbPromise = null
    throw error
  })
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = action(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = () => reject(tx.error ?? request.error)
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export function listTierImages(): Promise<TierImage[]> {
  return run('readonly', store => store.getAll() as IDBRequest<TierImage[]>)
    .then(images => images.sort((a, b) => b.createdAt - a.createdAt))
}

export function saveTierImage(image: TierImage): Promise<IDBValidKey> {
  return run('readwrite', store => store.put(image))
}

export function deleteTierImage(id: string): Promise<undefined> {
  return run('readwrite', store => store.delete(id))
}

/** The file name without its extension, as the image's default name. */
export function imageNameFromFile(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]{1,5}$/i, '').trim().slice(0, 200) || 'image'
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

/**
 * Decodes an uploaded file, scales it to `TIER_IMAGE_MAX_SIDE` and re-encodes
 * it (WebP where the browser can write it). Throws when the file isn't an
 * image the browser can read.
 */
export async function prepareTierImage(file: File, id: string): Promise<TierImage> {
  const decoded = await decode(file)
  try {
    const ratio = Math.min(1, TIER_IMAGE_MAX_SIDE / Math.max(decoded.width, decoded.height))
    const width = Math.max(1, Math.round(decoded.width * ratio))
    const height = Math.max(1, Math.round(decoded.height * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not available')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(decoded.source, 0, 0, width, height)

    // Browsers that can't write WebP hand back a PNG instead; JPEG is smaller
    // for photos, PNG keeps the transparency of PNG and GIF uploads.
    let blob = await encode(canvas, 'image/webp', 0.86)
    if (!blob || blob.type !== 'image/webp') {
      blob = /png|gif/.test(file.type) ? await encode(canvas, 'image/png') : await encode(canvas, 'image/jpeg', 0.88)
    }
    if (!blob) throw new Error('Image encoding failed')
    return { id, name: imageNameFromFile(file.name), blob, width, height, createdAt: Date.now() }
  }
  finally {
    decoded.close()
  }
}

/** `createImageBitmap` where it can read the file; an `<img>` for the rest (SVG in Chrome). */
async function decode(file: File): Promise<{ source: CanvasImageSource, width: number, height: number, close: () => void }> {
  try {
    const bitmap = await createImageBitmap(file)
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
  }
  catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      // An SVG without a size of its own reports 0; give it a square.
      const width = img.naturalWidth || TIER_IMAGE_MAX_SIDE
      const height = img.naturalHeight || TIER_IMAGE_MAX_SIDE
      return { source: img, width, height, close: () => URL.revokeObjectURL(url) }
    }
    catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
  }
}
