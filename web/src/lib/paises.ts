import type { Pais } from './tipos'

export type { Pais }

export function formatearMonto(pais: Pais | null, montoMinor: number): string {
  if (!pais) return '—'
  const unidades = montoMinor / 10 ** pais.decimales
  return new Intl.NumberFormat(pais.locale, {
    style: 'currency',
    currency: pais.moneda,
  }).format(unidades)
}
