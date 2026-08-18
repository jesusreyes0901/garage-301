export function compressImage(
  file: File,
  options: { maxSize?: number; maxEdge?: number; square?: boolean; quality?: number } = {},
): Promise<string> {
  const maxSize = options.maxSize ?? 2_000_000
  const maxEdge = options.maxEdge ?? 900
  const quality = options.quality ?? 0.78

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Solo se permiten imágenes.'))
      return
    }
    if (file.size > maxSize) {
      reject(new Error('La foto no debe superar 2 MB.'))
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('No se pudo procesar la imagen.'))
        return
      }
      if (options.square) {
        const size = Math.min(maxEdge, 256)
        canvas.width = size
        canvas.height = size
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size)
      } else {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    img.src = url
  })
}
