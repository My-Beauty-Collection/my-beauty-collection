/**
 * Foto dei prodotti.
 *
 * - Modalità Supabase: due JPEG compressi nel browser (grande + miniatura) nel bucket privato
 *   `product-photos`, cartella dell'utente. Il prodotto salva il percorso della foto grande;
 *   la miniatura ha lo stesso percorso con il suffisso `_t`. Si mostrano con URL firmati temporanei.
 * - Modalità locale: un'unica immagine piccola salvata come data URL dentro i dati.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export const PHOTO_BUCKET = 'product-photos'
const SIGNED_URL_SECONDS = 60 * 60

/** Ridimensiona e comprime un'immagine in JPEG (rispettando l'orientamento EXIF). */
export async function compressImage(file: Blob, maxSize: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff' // le PNG trasparenti diventano su sfondo bianco
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Compressione non riuscita'))), 'image/jpeg', quality),
  )
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export const isDataUrl = (photo: string) => photo.startsWith('data:')

export function thumbPath(path: string): string {
  return path.replace(/\.jpg$/, '_t.jpg')
}

/** Salva la foto e restituisce il valore da memorizzare nel prodotto. */
export async function savePhoto(file: Blob, productId: string, userId: string | null): Promise<string> {
  if (!supabase || !userId) {
    return blobToDataUrl(await compressImage(file, 640, 0.75))
  }
  const [full, thumb] = await Promise.all([compressImage(file, 1280, 0.82), compressImage(file, 320, 0.75)])
  const path = `${userId}/${productId}-${Date.now().toString(36)}.jpg`
  const bucket = supabase.storage.from(PHOTO_BUCKET)
  const options = { contentType: 'image/jpeg', upsert: false }
  const [a, b] = await Promise.all([bucket.upload(path, full, options), bucket.upload(thumbPath(path), thumb, options)])
  if (a.error || b.error) {
    await bucket.remove([path, thumbPath(path)])
    throw a.error ?? b.error
  }
  return path
}

/** Elimina una foto non più usata (silenziosamente: è solo pulizia). */
export async function deletePhoto(photo: string | null): Promise<void> {
  if (!photo || isDataUrl(photo) || !supabase) return
  urlCache.delete(photo)
  urlCache.delete(thumbPath(photo))
  await supabase.storage.from(PHOTO_BUCKET).remove([photo, thumbPath(photo)])
}

// ---------- URL firmati (con cache e richieste raggruppate) ----------

const urlCache = new Map<string, { url: string; expires: number }>()
let queue: Map<string, ((url: string | null) => void)[]> | null = null

function flush() {
  const batch = queue!
  queue = null
  const paths = [...batch.keys()]
  void supabase!.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS)
    .then(({ data }) => {
      const expires = Date.now() + (SIGNED_URL_SECONDS - 60) * 1000
      for (const path of paths) {
        const url = data?.find((d) => d.path === path)?.signedUrl ?? null
        if (url) urlCache.set(path, { url, expires })
        batch.get(path)!.forEach((resolve) => resolve(url))
      }
    })
}

function signedUrl(path: string): Promise<string | null> {
  const cached = urlCache.get(path)
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.url)
  return new Promise((resolve) => {
    if (!queue) {
      queue = new Map()
      queueMicrotask(flush)
    }
    queue.set(path, [...(queue.get(path) ?? []), resolve])
  })
}

function cachedUrl(path: string): string | null {
  const cached = urlCache.get(path)
  return cached && cached.expires > Date.now() ? cached.url : null
}

/** URL da usare in <img>: subito per i data URL, dopo la firma per le foto su Storage. */
export function usePhotoUrl(photo: string | null, variant: 'thumb' | 'full' = 'full'): string | null {
  const path = photo && !isDataUrl(photo) && variant === 'thumb' ? thumbPath(photo) : photo
  const immediate = !path ? null : isDataUrl(path) ? path : cachedUrl(path)
  const [resolved, setResolved] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!path || immediate || !supabase) return
    let alive = true
    void signedUrl(path).then((url) => alive && setResolved({ path, url }))
    return () => {
      alive = false
    }
  }, [path, immediate])

  return immediate ?? (resolved?.path === path ? resolved.url : null)
}
