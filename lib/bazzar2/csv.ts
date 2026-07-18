// Экспорт в CSV (в браузере). Разделитель ';' и BOM — чтобы Excel корректно
// открывал кириллицу и не склеивал колонки.
export interface CsvColumn<T> {
  key: keyof T | string
  label: string
  value?: (row: T) => unknown
}

function esc(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function exportCsv<T extends Record<string, any>>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((c) => esc(c.label)).join(';')
  const body = rows
    .map((r) => columns.map((c) => esc(c.value ? c.value(r) : r[c.key as string])).join(';'))
    .join('\n')
  const csv = '﻿' + header + '\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
