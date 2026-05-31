import { readMultipartFormData } from 'h3'
import { buildClothingItemKey, uploadToR2 } from '~~/server/utils/r2'
import { requireUserId } from '~~/server/utils/session'

function extensionFromFilename(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return 'jpg'
  return filename.slice(dot + 1).toLowerCase() || 'jpg'
}

function mimeFromExtension(ext: string): string {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'heic':
    case 'heif':
      return 'image/heic'
    default:
      return 'application/octet-stream'
  }
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const filePart = parts.find((part) => part.name === 'file' && part.data?.length)
  if (!filePart?.data) {
    throw createError({ statusCode: 400, message: 'Missing file field' })
  }

  const filename = filePart.filename || 'photo.jpg'
  const extension = extensionFromFilename(filename)
  const contentType = filePart.type || mimeFromExtension(extension)
  const key = buildClothingItemKey(userId, extension)

  const { url } = await uploadToR2(key, filePart.data, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return { imageUrl: url, key }
})
