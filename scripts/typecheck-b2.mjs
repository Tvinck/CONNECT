// Scoped typecheck для модуля BazzarSerts 2.0.
//
// Контекст: в проекте включён `typescript.ignoreBuildErrors: true` (next.config.js),
// т.к. в легаси-коде ~231 ошибка типов, и одномоментно их не починить. Этот скрипт —
// «страховочная сетка» для НОВОГО кода: гоняет полный `tsc --noEmit`, но падает
// только если ошибка в файлах BazzarSerts 2.0 (app/(bazzar2), components/bazzar2,
// lib/bazzar2). Так новый модуль остаётся строго типизированным, не блокируя билд.
//
// Запуск: npm run typecheck:b2

import { spawnSync } from 'node:child_process'

const res = spawnSync('npx', ['tsc', '--noEmit'], { encoding: 'utf8', shell: true })
const out = (res.stdout || '') + (res.stderr || '')

const B2 = /(bazzar2|\(bazzar2\)|lib[\\/]+bazzar2)/
const errors = out
  .split(/\r?\n/)
  .filter((l) => /error TS/.test(l) && B2.test(l))

const totalErrors = (out.match(/error TS/g) || []).length

if (errors.length) {
  console.error(`\n❌ BazzarSerts 2.0: найдено ${errors.length} ошибок типов:\n`)
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`✅ BazzarSerts 2.0 — типы чисты. (${totalErrors} предсуществующих ошибок в остальном проекте игнорируются — техдолг, чинится отдельно.)`)
