import crypto from 'crypto'

// Т-Банк (Тинькофф) интернет-эквайринг.
// Token = SHA-256 от конкатенации значений ВСЕХ параметров верхнего уровня
// (кроме вложенных объектов Receipt/DATA и самого Token) + Password,
// отсортированных по ключу. Тот же алгоритм используется и для проверки вебхука.

export function computeTbankToken(params: Record<string, unknown>, password: string): string {
  const flat: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (k === 'Token') continue
    if (v === undefined || v === null) continue
    if (typeof v === 'object') continue // исключаем вложенные Receipt / DATA
    flat[k] = String(v)
  }
  flat.Password = password
  const concatenated = Object.keys(flat)
    .sort()
    .map((k) => flat[k])
    .join('')
  return crypto.createHash('sha256').update(concatenated, 'utf8').digest('hex')
}

export interface TbankInitResult {
  Success: boolean
  ErrorCode?: string
  Message?: string
  Details?: string
  PaymentId?: string
  PaymentURL?: string
  Status?: string
}

export async function tbankInit(payload: Record<string, unknown>): Promise<TbankInitResult> {
  const res = await fetch('https://securepay.tinkoff.ru/v2/Init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}
