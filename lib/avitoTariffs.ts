// Тарифы «Ручной регистрации» под Авито — источник правды на СЕРВЕРЕ.
// Используется для валидации цены при инициации оплаты, чтобы сумму нельзя
// было подменить с клиента. Должен совпадать с connect-mobile/src/lib/tariffs.ts.

export interface AvitoTariff {
  guaranteeMonths: number
  price: number
}

export const AVITO_TARIFFS: AvitoTariff[] = [
  { guaranteeMonths: 1, price: 400 },
  { guaranteeMonths: 2, price: 550 },
  { guaranteeMonths: 3, price: 650 },
  { guaranteeMonths: 10, price: 900 },
  { guaranteeMonths: 12, price: 1300 },
]

export function avitoPriceFor(months: number): number | null {
  const t = AVITO_TARIFFS.find((x) => x.guaranteeMonths === months)
  return t ? t.price : null
}
