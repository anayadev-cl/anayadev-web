import type { Pais } from './tipos'

export type { Pais }

const LOCALES_POR_MONEDA: Record<string, string> = {
  CLP: 'es-CL',
  USD: 'en-US',
  EUR: 'es-ES',
}

export interface DatosMoneda {
  moneda?: string | null
  simbolo_moneda?: string | null
  decimales?: number | null
  locale?: string | null
}

export function formatearMontoMoneda(
  datos: DatosMoneda,
  montoMinor: number,
): string {
  const decimales = datos.decimales ?? 0
  const moneda = datos.moneda || ''
  const simbolo = datos.simbolo_moneda || moneda || '$'
  const locale =
    datos.locale || LOCALES_POR_MONEDA[moneda] || (decimales > 0 ? 'en-US' : 'es-CL')
  const unidades = montoMinor / 10 ** decimales
  const numero = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(unidades)
  if (moneda === 'EUR') return `${numero} ${simbolo}`
  return `${simbolo}${numero}`
}

export function formatearMonto(pais: Pais | null, montoMinor: number): string {
  if (!pais) return '—'
  return formatearMontoMoneda(
    {
      moneda: pais.moneda,
      simbolo_moneda: pais.simbolo_moneda,
      decimales: pais.decimales,
      locale: pais.locale,
    },
    montoMinor,
  )
}
