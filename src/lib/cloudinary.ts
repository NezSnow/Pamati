const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

/**
 * Transform a Cloudinary secure_url to serve a resized, format-optimised variant.
 * - Non-Cloudinary URLs (Supabase legacy, blob:) are returned unchanged.
 * - f_auto: WebP/AVIF in supporting browsers, JPEG elsewhere.
 * - q_auto: Cloudinary picks the best quality/size balance automatically.
 * - w_<width>: resize to this pixel width (height stays proportional).
 */
export function cloudinaryUrl(url: string, width: number): string {
  if (!url || url.startsWith('blob:') || !url.includes('res.cloudinary.com')) return url
  // Insert transform segment right after /upload/
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}

interface OptimizedBlob {
  blob: Blob
  /** Filename hint for multipart upload — WebP-first, JPEG fallback gives .jpg */
  filename: string
}

/**
 * Resize image to fit within maxWidth (max 2000px), prefer WebP, fall back to JPEG
 * when the browser can't encode WebP from canvas (common on some Safari / mobile builds).
 */
function optimizeImage(file: File | Blob, maxWidth = 2000): Promise<OptimizedBlob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        webpBlob => {
          if (webpBlob && webpBlob.size > 0) {
            resolve({ blob: webpBlob, filename: 'image.webp' })
            return
          }
          canvas.toBlob(
            jpegBlob => {
              if (!jpegBlob || jpegBlob.size === 0) {
                reject(new Error('Could not compress image — try another file or browser.'))
                return
              }
              resolve({ blob: jpegBlob, filename: 'image.jpg' })
            },
            'image/jpeg',
            0.82,
          )
        },
        'image/webp',
        0.85,
      )
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

/**
 * Optimize then upload a file to Cloudinary using an unsigned upload preset.
 * Returns the Cloudinary secure_url — a permanent CDN URL ready to store in the DB.
 */
export async function uploadToCloudinary(file: File | Blob): Promise<string> {
  if (!CLOUD_NAME?.trim() || !UPLOAD_PRESET?.trim()) {
    throw new Error(
      'Cloudinary env vars missing. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to `.env`, then restart `npm run dev`.',
    )
  }

  const { blob, filename } = await optimizeImage(file)
  const fd = new FormData()
  fd.append('file', blob, filename)
  fd.append('upload_preset', UPLOAD_PRESET!)

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME!.trim()}/image/upload`
  const res = await fetch(uploadUrl, { method: 'POST', body: fd })
  const json = await res.json() as { secure_url?: string; error?: { message: string } }

  if (!res.ok || !json.secure_url) {
    const reason = json.error?.message ?? res.statusText
    console.error('[Cloudinary] Upload failed:', reason, json)
    throw new Error(`Cloudinary upload failed: ${reason}`)
  }

  return json.secure_url
}
