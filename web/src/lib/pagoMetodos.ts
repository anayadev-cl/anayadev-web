import type { MetodoPagoPublico } from './tipos'

export interface ClasificacionMetodosPago {
  /** Métodos no-flow activos (transferencia/paypal/otro) → instrucciones. */
  transferencias: MetodoPagoPublico[]
  /** Hay un método `flow` activo → botón "Pagar con Flow". */
  flowActivo: boolean
  /**
   * Mostrar el bloque de transferencia (instrucciones + monto + comprobante).
   * Sin lista (null: falló la carga) o lista vacía se mantiene el abono manual
   * como respaldo; con métodos y ninguno no-flow, la transferencia no aparece.
   */
  mostrarTransferencias: boolean
}

/**
 * Render por TIPO de los métodos del CMS, igual que el landing de suspendidos
 * de Calenzia: `flow` no imprime instrucciones — dispara el botón; el resto va
 * al bloque de transferencia. El endpoint del CMS ya entrega solo los activos,
 * así que un método desactivado nunca llega acá.
 */
export function clasificarMetodosPago(
  metodos: MetodoPagoPublico[] | null,
): ClasificacionMetodosPago {
  const transferencias = (metodos ?? []).filter((m) => m.tipo !== 'flow')
  const flowActivo = (metodos ?? []).some((m) => m.tipo === 'flow')
  const mostrarTransferencias =
    metodos === null || metodos.length === 0 || transferencias.length > 0
  return { transferencias, flowActivo, mostrarTransferencias }
}
