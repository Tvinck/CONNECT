/**
 * Shared utility for ultra-reliable R2 IPA file uploads.
 * Uses 5MB chunked multipart uploads for files > 5MB, with automatic retry logic on network glitches.
 */

export async function uploadIpaToR2(
  file: File,
  appId: string,
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<string> {
  const R2_BASE = process.env.NEXT_PUBLIC_R2_WORKER_URL || 'https://bazzar-r2.artyomkoshelev-04.workers.dev'
  const R2_TOKEN = process.env.NEXT_PUBLIC_R2_UPLOAD_TOKEN || 'bazzar-r2-upload-2024-secret'

  const safeFileName = file.name.replace(/[^\w\.\-]/g, '_')
  const ipaKey = `ipa/${appId}/${safeFileName}`
  const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunk size
  const DIRECT_LIMIT = 5 * 1024 * 1024 // <= 5MB -> direct PUT

  const reportProgress = (pct: number, text: string) => {
    if (onProgress) onProgress(pct, text)
  }

  // Fetch helper with exponential backoff retries for network resilience
  const fetchWithRetry = async (url: string, init: RequestInit, maxAttempts = 5): Promise<Response> => {
    let lastError: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, init)
        if (res.ok || res.status < 500) return res
        lastError = new Error(`HTTP ${res.status}`)
      } catch (err) {
        lastError = err
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Ошибка сети при отправке данных')
  }

  // Direct PUT for small files (<= 5MB)
  if (file.size <= DIRECT_LIMIT) {
    reportProgress(20, 'Прямая загрузка файла...')
    const res = await fetchWithRetry(`${R2_BASE}/${ipaKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Upload-Token': R2_TOKEN,
      },
      body: file,
    })

    if (!res.ok) {
      throw new Error(`Ошибка загрузки: HTTP ${res.status}`)
    }

    reportProgress(100, 'Загрузка завершена!')
    return `${R2_BASE}/${ipaKey}`
  }

  // Multipart Upload for larger files
  reportProgress(5, 'Создание Multipart сессии...')
  const createRes = await fetchWithRetry(`${R2_BASE}/multipart/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Upload-Token': R2_TOKEN,
    },
    body: JSON.stringify({ key: ipaKey }),
  })

  if (!createRes.ok) {
    throw new Error('Не удалось запустить Multipart сессию в R2')
  }

  const { uploadId } = await createRes.json()
  const totalParts = Math.ceil(file.size / CHUNK_SIZE)
  const parts: { partNumber: number; etag: string }[] = []

  const abortMultipart = () =>
    fetch(`${R2_BASE}/multipart/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Upload-Token': R2_TOKEN },
      body: JSON.stringify({ uploadId, key: ipaKey }),
    }).catch(() => {})

  try {
    for (let i = 0; i < totalParts; i++) {
      const partNumber = i + 1
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const uploadedMB = (end / (1024 * 1024)).toFixed(1)
      const totalMB = (file.size / (1024 * 1024)).toFixed(1)
      const pct = Math.round((partNumber / totalParts) * 90)

      reportProgress(pct, `Загрузка: ${uploadedMB} MB / ${totalMB} MB (${partNumber}/${totalParts})...`)

      const partRes = await fetchWithRetry(
        `${R2_BASE}/multipart/part?uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}&key=${encodeURIComponent(ipaKey)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Upload-Token': R2_TOKEN,
          },
          body: chunk,
        }
      )

      if (!partRes.ok) {
        throw new Error(`Ошибка загрузки части ${partNumber}/${totalParts} (HTTP ${partRes.status})`)
      }

      const partData = await partRes.json()
      parts.push({ partNumber: partData.partNumber, etag: partData.etag })
    }

    reportProgress(95, 'Сборка файла на сервере R2...')
    const completeRes = await fetchWithRetry(`${R2_BASE}/multipart/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Upload-Token': R2_TOKEN,
      },
      body: JSON.stringify({ uploadId, key: ipaKey, parts }),
    })

    if (!completeRes.ok) {
      throw new Error('Не удалось завершить Multipart сборку')
    }

    reportProgress(100, 'Загрузка завершена!')
    return `${R2_BASE}/${ipaKey}`
  } catch (err) {
    await abortMultipart()
    throw err
  }
}
