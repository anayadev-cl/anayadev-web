export const TELEFONO_DIGITOS_POR_PAIS: Record<string, number> = {
  CL: 9,
  US: 10,
  ES: 9,
}

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function formatearRut(valor: string): string {
  const limpio = valor.replace(/[^\dkK]/g, '').slice(0, 9).toUpperCase()
  if (!limpio) return ''
  const cuerpo = limpio.slice(0, -1)
  const digito = limpio.slice(-1)
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${digito}`
}

export function validarRut(valor: string): boolean {
  const limpio = valor.replace(/[^\dkK]/g, '').toUpperCase()
  if (!/^\d{1,8}[\dK]$/.test(limpio)) return false
  const cuerpo = limpio.slice(0, -1)
  const digito = limpio.slice(-1)
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return digito === esperado
}

export function formatearTelefono(valor: string, iso: string): string {
  const digitos = soloDigitos(valor).slice(0, 15)
  if (!digitos) return ''
  if (iso === 'CL') {
    const resto = digitos.slice(1)
    return resto.length <= 4
      ? `${digitos[0]} ${resto}`
      : `${digitos[0]} ${resto.slice(0, 4)} ${resto.slice(4)}`
  }
  if (iso === 'US') {
    if (digitos.length <= 3) return digitos
    if (digitos.length <= 6) return `(${digitos.slice(0, 3)}) ${digitos.slice(3)}`
    return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6)}`
  }
  if (iso === 'ES') {
    return digitos.replace(/(\d{3})(?=\d)/g, '$1 ')
  }
  return digitos
}

export function validarTelefono(valor: string, iso: string): boolean {
  const digitos = soloDigitos(valor)
  const esperado = TELEFONO_DIGITOS_POR_PAIS[iso]
  if (esperado) return digitos.length === esperado
  return digitos.length >= 6 && digitos.length <= 15
}
