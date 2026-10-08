import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { FondoCircuito } from './FondoCircuito'
import { Marca } from './Marca'
import { formatearMontoMoneda } from '../lib/paises'
import { api } from '../lib/api'
import { clasificarMetodosPago } from '../lib/pagoMetodos'
import type { MetodoPagoPublico, SolicitudLanding } from '../lib/tipos'
// Iconos propios (SVG inline) — anayadev-web no usa lucide-react.
function Icono({ d, className = 'size-4' }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
const CreditCard = ({ className }: { className?: string }) => (
  <Icono className={className} d="M2 5h20v14H2zM2 10h20" />
)
const ArrowRight = ({ className }: { className?: string }) => (
  <Icono className={className} d="M5 12h14M13 6l6 6-6 6" />
)
const Lock = ({ className }: { className?: string }) => (
  <Icono className={className} d="M5 11h14v10H5zM8 11V7a4 4 0 018 0v4" />
)
const Banknote = ({ className }: { className?: string }) => (
  <Icono className={className} d="M2 6h20v12H2zM12 14a2 2 0 100-4 2 2 0 000 4M6 12h.01M18 12h.01" />
)
const ChevronDown = ({ className }: { className?: string }) => (
  <Icono className={className} d="m6 9 6 6 6-6" />
)
const Upload = ({ className }: { className?: string }) => (
  <Icono className={className} d="M12 16V4M6 10l6-6 6 6M4 20h16" />
)
const Paperclip = ({ className }: { className?: string }) => (
  <Icono className={className} d="M21 11l-9 9a5 5 0 01-7-7l9-9a3 3 0 014 4l-9 9a1 1 0 01-2-2l8-8" />
)
const Trash2 = ({ className }: { className?: string }) => (
  <Icono className={className} d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
)

const ESTADOS_PENDIENTES = ['solicitada', 'en_revision']

function nombreEdicion(edicion: string): string {
  if (edicion === 'con_ia') return 'Con IA'
  if (edicion === 'comunicacion') return 'Comunicación'
  return edicion
}

function fechaLegible(iso: string | null | undefined): string | null {
  if (!iso) return null
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function BotonCopiar({ texto, etiqueta = 'Copiar' }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* portapapeles no disponible */
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copiar()}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        copiado
          ? 'border-turquesa/60 bg-turquesa/15 text-turquesa'
          : 'border-cian/40 text-cian hover:bg-cian/10'
      }`}
    >
      {copiado ? '¡Copiado!' : etiqueta}
    </button>
  )
}

function BloqueGlosa({ solicitud, paraPagar }: { solicitud: SolicitudLanding; paraPagar: boolean }) {
  if (!solicitud.glosa) return null
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 sm:px-5 ${
        paraPagar ? 'border-turquesa/40 bg-turquesa/10' : 'border-blanco/10 bg-abisal/60'
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs text-bruma/60">
          {paraPagar ? 'Referencia de tu transferencia' : 'Tu código de solicitud'}
        </p>
        <p className="mt-0.5 truncate font-mono text-lg font-bold tracking-wide text-cian">
          {solicitud.glosa}
        </p>
        {paraPagar && (
          <p className="mt-0.5 text-xs leading-relaxed text-bruma">
            Incluye este código como referencia o comentario de tu transferencia.
          </p>
        )}
      </div>
      <BotonCopiar texto={solicitud.glosa} />
    </div>
  )
}

// ----------------------------------------------------------------------
// Línea de tiempo (A.3)
// ----------------------------------------------------------------------

interface Hito {
  etiqueta: string
  estado: 'hecho' | 'actual' | 'futuro' | 'fallo'
}

function lineaDeTiempo(s: SolicitudLanding): Hito[] {
  if (s.estado === 'rechazada') {
    return [
      { etiqueta: 'Recibida', estado: 'hecho' },
      { etiqueta: 'En revisión', estado: 'hecho' },
      { etiqueta: 'Rechazada', estado: 'fallo' },
    ]
  }
  if (s.estado === 'expirada') {
    return [
      { etiqueta: 'Recibida', estado: 'hecho' },
      { etiqueta: 'En revisión', estado: 'hecho' },
      { etiqueta: 'Aprobada', estado: 'hecho' },
      { etiqueta: 'Expirada', estado: 'fallo' },
    ]
  }

  // El hito «En prueba» solo aparece cuando el camino pasó por el trial:
  // la solicitud sigue en_prueba o el tenant todavía está en prueba.
  const conPrueba = s.estado === 'en_prueba' || s.tenant_estado === 'prueba'
  const etiquetas = conPrueba
    ? ['Recibida', 'En revisión', 'Aprobada', 'En prueba', 'Pago', 'Activa']
    : ['Recibida', 'En revisión', 'Aprobada', 'Pago', 'Activa']

  const indicePago = etiquetas.indexOf('Pago')
  const indicePrueba = etiquetas.indexOf('En prueba')
  const pagoHecho = s.pago?.estado === 'pagado'

  let actual: number
  if (s.estado === 'solicitada' || s.estado === 'en_revision') {
    actual = 1 // «En revisión»
  } else if (s.estado === 'aprobada') {
    actual = indicePago // pago directo: el siguiente paso es pagar
  } else if (s.estado === 'en_prueba') {
    actual = s.tenant_estado === 'moroso' ? indicePago : indicePrueba
  } else {
    actual = etiquetas.length - 1 // activa
  }
  if (s.tenant_estado === 'moroso') actual = indicePago
  if (s.tenant_estado === 'activo') actual = etiquetas.length - 1

  return etiquetas.map((etiqueta, i) => {
    if (i < actual) return { etiqueta, estado: 'hecho' as const }
    if (i === actual) return { etiqueta, estado: 'actual' as const }
    // «Pago» ya cumplido durante la prueba (mes 1 pagado por adelantado).
    if (etiqueta === 'Pago' && pagoHecho) return { etiqueta, estado: 'hecho' as const }
    return { etiqueta, estado: 'futuro' as const }
  })
}

function LineaTiempo({ hitos }: { hitos: Hito[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {hitos.map((hito, i) => (
        <li key={hito.etiqueta} className="flex items-center">
          {i > 0 && (
            <span
              className={`mx-1.5 h-px w-5 sm:w-8 ${
                hito.estado === 'futuro' ? 'bg-blanco/10' : 'bg-turquesa/30'
              }`}
            />
          )}
          <span className="flex items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${
                hito.estado === 'hecho'
                  ? 'border-turquesa/60 bg-turquesa/15 text-turquesa'
                  : hito.estado === 'actual'
                    ? 'border-cian/70 bg-cian/10 text-cian ring-1 ring-cian/30'
                    : hito.estado === 'fallo'
                      ? 'border-red-400/50 bg-red-500/10 text-red-300'
                      : 'border-blanco/15 text-bruma/40'
              }`}
            >
              {hito.estado === 'hecho' ? '✓' : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                hito.estado === 'actual'
                  ? 'text-cian'
                  : hito.estado === 'fallo'
                    ? 'text-red-300'
                    : hito.estado === 'hecho'
                      ? 'text-bruma'
                      : 'text-bruma/40'
              }`}
            >
              {hito.etiqueta}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

// ----------------------------------------------------------------------
// Tarjetas
// ----------------------------------------------------------------------

function Encabezado() {
  return (
    <header className="border-b border-blanco/8">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
        <a href="/" aria-label="Volver al inicio">
          <Marca tamano="sm" />
        </a>
        <a
          href="/"
          className="text-sm font-medium text-bruma transition-colors hover:text-cian"
        >
          ← Volver
        </a>
      </div>
    </header>
  )
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-bruma/70">{etiqueta}</dt>
      <dd className="text-right text-blanco">{valor}</dd>
    </div>
  )
}

function TarjetaResumen({ solicitud }: { solicitud: SolicitudLanding }) {
  const nombres = solicitud.modulos_nombre ?? {}
  const fecha = fechaLegible(solicitud.creado_en)
  // "Lo que pediste" = el pedido ORIGINAL del cliente. `solicitud.modulos`
  // trae el contrato YA ajustado por el superadmin; el diff vive en
  // TarjetaPlanPropuesto. Filas viejas sin captura caen al contrato actual.
  const original = solicitud.solicitud_original ?? {
    edicion: solicitud.edicion,
    modulos: solicitud.modulos,
    nro_trabajadores: solicitud.nro_trabajadores,
  }
  return (
    <section className="tarjeta-vidrio rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-blanco">Lo que pediste</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Fila etiqueta="Negocio" valor={solicitud.negocio_nombre} />
        <Fila etiqueta="Tu página" valor={`agenda.anayadev.cl/${solicitud.slug}`} />
        <Fila etiqueta="País" valor={solicitud.pais} />
        <Fila etiqueta="Edición" valor={nombreEdicion(original.edicion)} />
        <Fila
          etiqueta="Trabajadores"
          valor={`${original.nro_trabajadores} ${
            original.nro_trabajadores === 1 ? 'persona' : 'personas'
          }`}
        />
        <div className="border-t border-blanco/8 pt-2.5">
          <dt className="text-bruma/70">Módulos</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {original.modulos.length === 0 ? (
              <span className="text-bruma/60">—</span>
            ) : (
              original.modulos.map((codigo) => (
                <span
                  key={codigo}
                  className="rounded-md border border-cian/25 bg-cian/5 px-2 py-0.5 text-[11px] font-medium text-cian"
                >
                  {nombres[codigo] ?? codigo}
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>
      {fecha && <p className="mt-4 text-xs text-bruma/60">Solicitada el {fecha}</p>}
    </section>
  )
}

function BadgeAceptacion({ estado }: { estado: string | null | undefined }) {
  if (estado === 'aceptada') {
    return (
      <span className="shrink-0 rounded-full border border-turquesa/40 bg-turquesa/10 px-3 py-1 text-xs font-semibold text-turquesa">
        Aceptado ✓
      </span>
    )
  }
  if (estado === 'conversar') {
    return (
      <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
        Quieres conversarlo
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full border border-cian/40 bg-cian/10 px-3 py-1 text-xs font-semibold text-cian">
      Pendiente de aceptación
    </span>
  )
}

function TarjetaPlanPropuesto({
  solicitud,
  token,
  onActualizar,
}: {
  solicitud: SolicitudLanding
  token: string
  onActualizar?: (s: SolicitudLanding) => void
}) {
  const plan = solicitud.plan_propuesto
  const [enviando, setEnviando] = useState<'aceptar' | 'conversar' | null>(null)
  const [error, setError] = useState('')
  if (!plan) return null

  const nombres = solicitud.modulos_nombre ?? {}
  const original = solicitud.solicitud_original
  const estado = solicitud.aceptacion_estado
  const origMods = new Set(original?.modulos ?? [])
  const propMods = new Set(plan.modulos)
  const agregados = plan.modulos.filter((m) => !origMods.has(m))
  const quitados = (original?.modulos ?? []).filter((m) => !propMods.has(m))
  const edicionCambio = !!original && original.edicion !== plan.edicion
  const trabCambio = !!original && original.nro_trabajadores !== plan.nro_trabajadores

  const formatear = (monto: number) =>
    formatearMontoMoneda(
      { moneda: plan.moneda, simbolo_moneda: plan.simbolo_moneda, decimales: plan.decimales },
      monto,
    )

  async function aceptar() {
    setError('')
    setEnviando('aceptar')
    try {
      const actualizada = await api.aceptarPlan(token)
      onActualizar?.(actualizada)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos aceptar tu plan.')
    } finally {
      setEnviando(null)
    }
  }

  async function conversar() {
    setError('')
    setEnviando('conversar')
    try {
      const actualizada = await api.pedirCambiosPlan(token)
      onActualizar?.(actualizada)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar tu pedido.')
    } finally {
      setEnviando(null)
    }
  }

  return (
    <section className="tarjeta-vidrio rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-blanco">Tu plan propuesto</h2>
        <BadgeAceptacion estado={estado} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-cian/30 bg-cian/5 px-5 py-4">
        <span className="text-sm font-semibold text-bruma">Total mensual</span>
        <span className="texto-gradiente text-2xl font-bold">
          {formatear(plan.total_primera_factura)}
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {plan.modulos.map((codigo) => {
          const precio = plan.modulos_precio.find((p) => p.concepto === codigo)
          const esNuevo = agregados.includes(codigo)
          return (
            <li
              key={codigo}
              className="flex items-center justify-between gap-3 rounded-lg border border-blanco/10 bg-abisal/50 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-blanco">
                {nombres[codigo] ?? codigo}
                {esNuevo && (
                  <span className="rounded-full border border-cian/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cian">
                    nuevo
                  </span>
                )}
              </span>
              <span className="text-bruma">{precio ? formatear(precio.precio_monto) : '—'}</span>
            </li>
          )
        })}
        {quitados.map((codigo) => (
          <li
            key={`quitado-${codigo}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-500/5 px-3 py-2"
          >
            <span className="text-bruma line-through">{nombres[codigo] ?? codigo}</span>
            <span className="text-[11px] uppercase tracking-wide text-red-300">quitado</span>
          </li>
        ))}
      </ul>

      {(edicionCambio || trabCambio) && original && (
        <div className="mt-3 space-y-1 text-xs text-bruma">
          {edicionCambio && (
            <p>
              Edición: <span className="line-through">{nombreEdicion(original.edicion)}</span>{' '}
              → <span className="font-semibold text-blanco">{nombreEdicion(plan.edicion)}</span>
            </p>
          )}
          {trabCambio && (
            <p>
              Trabajadores: <span className="line-through">{original.nro_trabajadores}</span> →{' '}
              <span className="font-semibold text-blanco">{plan.nro_trabajadores}</span>
            </p>
          )}
        </div>
      )}

      {estado === 'pendiente' && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void aceptar()}
            disabled={enviando !== null}
            className="flex-1 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-6 py-3 text-sm font-semibold text-blanco transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
          >
            {enviando === 'aceptar' ? 'Aceptando…' : 'Acepto este plan'}
          </button>
          <button
            type="button"
            onClick={() => void conversar()}
            disabled={enviando !== null}
            className="rounded-full border border-blanco/20 px-6 py-3 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian disabled:opacity-50"
          >
            {enviando === 'conversar' ? 'Enviando…' : 'Quiero conversarlo'}
          </button>
        </div>
      )}

      {estado === 'aceptada' && (
        <p className="mt-5 rounded-2xl border border-turquesa/30 bg-turquesa/5 px-4 py-3 text-sm leading-relaxed text-turquesa">
          Aceptaste este plan. Falta la confirmación de nuestro equipo — te avisamos
          por correo.
        </p>
      )}
      {estado === 'conversar' && (
        <p className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/5 px-4 py-3 text-sm leading-relaxed text-amber-200">
          Pediste conversarlo. Te contactaremos para ajustar los detalles antes de avanzar.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  )
}

function TarjetaSugerencias({ solicitud }: { solicitud: SolicitudLanding }) {
  return (
    <section className="tarjeta-vidrio rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-blanco">Esto te sugerimos</h2>
      {solicitud.sugerencias.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          Tu paquete quedó completo: no tenemos sugerencias adicionales.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {solicitud.sugerencias.map((sugerencia) => (
            <li
              key={sugerencia.codigo}
              className="rounded-2xl border border-violeta/25 bg-violeta/5 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-blanco">{sugerencia.titulo}</p>
                <span className="shrink-0 rounded-full border border-violeta/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violeta">
                  {sugerencia.tipo === 'edicion' ? 'Edición' : 'Módulo'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-bruma">
                {sugerencia.motivo}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs leading-relaxed text-bruma/60">
        Nuestro equipo revisará tu solicitud y te contactará para confirmar
        el paquete final. No tienes que hacer nada por ahora.
      </p>
    </section>
  )
}

function TarjetaPlanAprobado({ solicitud }: { solicitud: SolicitudLanding }) {
  const tieneImporte =
    solicitud.total_primera_factura != null && solicitud.moneda != null
  return (
    <section className="tarjeta-vidrio rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-blanco">Tu plan</h2>
      {tieneImporte ? (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-cian/30 bg-cian/5 px-5 py-4">
          <span className="text-sm font-semibold text-bruma">Total primera factura</span>
          <span className="text-2xl font-bold texto-gradiente">
            {formatearMontoMoneda(
              {
                moneda: solicitud.moneda,
                simbolo_moneda: solicitud.simbolo_moneda,
                decimales: solicitud.decimales,
              },
              solicitud.total_primera_factura as number,
            )}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-bruma">
          El detalle de tu plan estará disponible apenas se confirme el pago.
        </p>
      )}
    </section>
  )
}

// ----------------------------------------------------------------------
// Bloque de pago dinámico (A.3)
// ----------------------------------------------------------------------

function TarjetaPago({
  solicitud,
  metodosPago,
  token,
  exigible,
}: {
  solicitud: SolicitudLanding
  metodosPago: MetodoPagoPublico[] | null
  token: string
  exigible: boolean
}) {
  const pago = solicitud.pago
  const [subiendo, setSubiendo] = useState(false)
  const [subido, setSubido] = useState(false)
  const [monto, setMonto] = useState('')
  const [saldo, setSaldo] = useState<number | null>(pago?.saldo ?? null)
  const [error, setError] = useState('')
  const [iniciandoFlow, setIniciandoFlow] = useState(false)
  const [acordeon, setAcordeon] = useState(false)
  const [archivos, setArchivos] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const glosa = pago?.glosa || solicitud.glosa || ''
  const totalMinor = pago?.total ?? solicitud.total_primera_factura
  const pagadoMinor = pago?.pagado_total ?? 0
  const puedeAdjuntar = pago != null && pago.estado === 'por_pagar' && !subido
  const vencimiento = fechaLegible(pago?.vencimiento_pago)

  // CMS: se renderiza POR TIPO, igual que el landing de suspendidos: `flow`
  // dispara el botón "Pagar con tarjeta"; transferencia/paypal/otro van al bloque
  // de instrucciones. El CMS ya entrega solo métodos activos.
  const { transferencias, flowActivo, mostrarTransferencias } =
    clasificarMetodosPago(metodosPago)
  const puedePagarFlow = puedeAdjuntar && flowActivo

  // boton-flow-v2: bloque de monto encima del CTA. En el panel de prueba
  // (opcional, sin pago aún) se muestra «Tu plan / Mensualidad» con «/ mes»;
  // con pago parcial real o cuenta exigible se conserva «Saldo pendiente».
  const esPlanMensual = !exigible && pagadoMinor === 0 && pago?.estado !== 'pagado'
  const etiquetaMonto =
    pago?.estado === 'pagado'
      ? 'Total a pagar'
      : esPlanMensual
        ? 'Tu plan'
        : 'Saldo pendiente'
  const montoPago =
    totalMinor != null && solicitud.moneda
      ? formatearMontoMoneda(
          {
            moneda: solicitud.moneda,
            simbolo_moneda: solicitud.simbolo_moneda,
            decimales: solicitud.decimales,
          },
          saldo ?? totalMinor,
        )
      : ''

  async function pagarFlow() {
    if (!pago) return
    setError('')
    setIniciandoFlow(true)
    try {
      const { url } = await api.iniciarPagoFlowSolicitud(token, pago.cobro_id)
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar el pago con Flow.')
      setIniciandoFlow(false)
    }
  }

  function agregarArchivos(lista: FileList | null) {
    if (!lista) return
    setArchivos((prev) => [...prev, ...Array.from(lista)])
  }

  function quitarArchivo(i: number) {
    setArchivos((prev) => prev.filter((_, j) => j !== i))
  }

  async function declarar() {
    if (!pago) return
    const montoEntero = Number(monto)
    if (!Number.isFinite(montoEntero) || montoEntero <= 0) {
      setError('Indica el monto de ESTA transferencia.')
      return
    }
    if (archivos.length === 0) {
      setError('Adjunta al menos un comprobante.')
      return
    }
    setError('')
    setSubiendo(true)
    try {
      const resultado = await api.subirAbonoSolicitud(
        token,
        pago.cobro_id,
        montoEntero,
        archivos,
      )
      setSaldo(resultado.saldo)
      if (resultado.completado) {
        setSubido(true)
      }
      setMonto('')
      setArchivos([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos registrar tu abono.')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section
      className={`rounded-3xl border p-6 sm:p-8 ${
        exigible
          ? 'border-turquesa/30 bg-turquesa/5'
          : 'border-cian/20 bg-cian/5'
      }`}
    >
      <h2 className="text-lg font-semibold text-blanco">
        {exigible ? 'Para seguir, paga tu mensualidad' : 'Tu pago (opcional)'}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-bruma">
        {exigible
          ? 'Transfiere y adjunta tu comprobante: en cuanto lo verifiquemos, tu cuenta sigue al día.'
          : 'Puedes adelantar tu pago cuando quieras — no pierdes días de prueba. O simplemente espera: tu mensualidad arranca al terminar la prueba.'}
      </p>

      {totalMinor != null && solicitud.moneda && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-blanco/10 bg-abisal/60 px-5 py-4">
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-bruma">{etiquetaMonto}</span>
            {esPlanMensual && (
              <span className="text-xs text-bruma/60">Mensualidad</span>
            )}
          </span>
          <span className="flex items-baseline gap-1">
            <span className="texto-gradiente text-2xl font-bold">{montoPago}</span>
            {esPlanMensual && (
              <span className="text-sm font-medium text-bruma/70">/ mes</span>
            )}
          </span>
        </div>
      )}
      {pagadoMinor > 0 && saldo !== null && pago?.estado === 'por_pagar' && (
        <p className="mt-2 text-xs font-semibold text-turquesa">
          Ya pagaste{' '}
          {formatearMontoMoneda(
            {
              moneda: solicitud.moneda,
              simbolo_moneda: solicitud.simbolo_moneda,
              decimales: solicitud.decimales,
            },
            pagadoMinor,
          )}{' '}
          — te faltan{' '}
          {formatearMontoMoneda(
            {
              moneda: solicitud.moneda,
              simbolo_moneda: solicitud.simbolo_moneda,
              decimales: solicitud.decimales,
            },
            saldo ?? totalMinor,
          )}
          . Puedes seguir pagando en partes.
        </p>
      )}
      {exigible && vencimiento && (
        <p className="mt-2 text-xs font-semibold text-turquesa">Vence el {vencimiento}</p>
      )}

      {/* pago-ux: las declaraciones de transferencia con su estado y comprobantes. */}
      {pago && (pago.abonos ?? []).length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-bruma">
            Tus transferencias declaradas
          </p>
          <ul className="flex flex-col gap-2">
            {(pago.abonos ?? []).map((abono) => (
              <li
                key={abono.id}
                className="flex flex-col gap-1 rounded-2xl border border-blanco/10 bg-abisal/60 p-3 text-xs"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-bruma">
                    {solicitud.simbolo_moneda ?? '$'}
                    {(abono.monto ?? 0).toLocaleString('es-CL')}
                  </span>
                  <span
                    className={
                      abono.estado === 'verificado'
                        ? 'font-semibold text-turquesa'
                        : abono.estado === 'rechazado'
                          ? 'font-semibold text-red-300'
                          : 'font-semibold text-amber-300'
                    }
                  >
                    {abono.estado === 'verificado'
                      ? 'verificado'
                      : abono.estado === 'rechazado'
                        ? 'rechazado'
                        : 'en verificación'}
                  </span>
                </span>
                {abono.estado === 'rechazado' && abono.rechazo_motivo && (
                  <span className="text-red-300">Motivo: {abono.rechazo_motivo}</span>
                )}
                {(abono.adjuntos ?? []).length > 0 && (
                  <span className="flex flex-wrap gap-2">
                    {(abono.adjuntos ?? []).map((adj, i) => (
                      <a
                        key={adj.id ?? i}
                        href={adj.adjunto_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cian underline"
                      >
                        comprobante {i + 1}
                      </a>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {puedePagarFlow && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void pagarFlow()}
              disabled={iniciandoFlow || subiendo}
              className="group flex h-14 w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-violeta via-electrica to-cian px-6 text-sm font-semibold text-blanco shadow-lg shadow-cian/20 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            >
              <CreditCard className="size-5 shrink-0" />
              <span className="flex-1 text-center">
                {iniciandoFlow ? 'Redirigiendo…' : `Pagar ${montoPago} con tarjeta`}
              </span>
              <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-bruma/70">
              <Lock className="size-3.5 shrink-0" />
              <span>Pago seguro procesado por</span>
              <img src="/flow-logo-light.png" alt="Flow" className="h-4 w-auto" />
            </div>
          </div>
        )}

        {mostrarTransferencias && puedeAdjuntar && (
          <div className="overflow-hidden rounded-2xl border border-blanco/10">
            <button
              type="button"
              onClick={() => setAcordeon((v) => !v)}
              className="flex w-full items-center justify-between gap-2 bg-abisal/60 px-4 py-3 text-left transition-colors hover:bg-abisal"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-blanco">
                <Banknote className="size-4 text-cian" /> Pagar por transferencia
              </span>
              <ChevronDown
                className={`size-4 text-bruma transition-transform ${
                  acordeon ? 'rotate-180' : ''
                }`}
              />
            </button>
            {acordeon && (
              <div className="flex flex-col gap-3 border-t border-blanco/10 p-4">
                {transferencias.length === 0 ? (
                  <p className="text-sm leading-relaxed text-bruma">
                    Los datos de pago se publicarán pronto. Nuestro equipo te
                    contactará para coordinar la transferencia.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {transferencias.map((metodo) => (
                      <li
                        key={`${metodo.tipo}-${metodo.nombre}`}
                        className="rounded-2xl border border-blanco/10 bg-abisal/60 p-4"
                      >
                        <p className="text-sm font-semibold text-blanco">
                          {metodo.nombre}
                        </p>
                        <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-bruma">
                          {metodo.instrucciones_publicas}
                        </pre>
                      </li>
                    ))}
                  </ul>
                )}

                {glosa && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-blanco/10 bg-abisal/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-bruma/60">
                        Referencia de tu transferencia
                      </p>
                      <p className="mt-0.5 truncate font-mono text-base font-bold tracking-wide text-cian">
                        {glosa}
                      </p>
                    </div>
                    <BotonCopiar texto={glosa} />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-bruma">
                    Monto de ESTA transferencia (puedes pagar en partes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder={
                      solicitud.moneda
                        ? formatearMontoMoneda(
                            {
                              moneda: solicitud.moneda,
                              simbolo_moneda: solicitud.simbolo_moneda,
                              decimales: solicitud.decimales,
                            },
                            saldo ?? totalMinor ?? 0,
                          )
                        : 'Monto'
                    }
                    className="w-full rounded-2xl border border-blanco/10 bg-abisal/60 px-4 py-3 text-sm text-blanco placeholder:text-bruma/40 focus:outline-none focus:ring-1 focus:ring-cian/50"
                  />
                </div>

                <div>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      agregarArchivos(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blanco/15 px-4 py-2 text-xs font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
                  >
                    <Upload className="size-3.5" /> Agregar comprobante
                  </button>
                  {archivos.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {archivos.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-abisal/60 px-3 py-1.5 text-xs text-bruma"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Paperclip className="size-3 shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarArchivo(i)}
                            className="shrink-0 text-bruma/60 hover:text-red-300"
                            title="Quitar"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void declarar()}
                  disabled={subiendo || !monto || archivos.length === 0}
                  className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-6 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)] disabled:opacity-50"
                >
                  {subiendo ? 'Enviando…' : 'Declarar transferencia'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {subido && (
        <p className="mt-4 rounded-xl border border-turquesa/30 bg-turquesa/10 px-4 py-3 text-sm text-turquesa">
          ¡Cobro completo! Recibimos tus abonos y los estamos verificando.
          Cuando el equipo los confirme, tu cuenta queda al día.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  )
}

// ----------------------------------------------------------------------
// Vistas por estado
// ----------------------------------------------------------------------

function VistaPendiente({ solicitud }: { solicitud: SolicitudLanding }) {
  return (
    <>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cian/40 bg-cian/10 text-cian">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-bold text-blanco">Recibimos tu solicitud</h1>
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          Ya tenemos los datos de <span className="text-blanco">{solicitud.negocio_nombre}</span>.
          Nuestro equipo la está revisando y te contactará pronto para
          confirmar el paquete final.
        </p>
      </div>
      <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
        <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
      </section>
      <TarjetaResumen solicitud={solicitud} />
      {solicitud.glosa && <BloqueGlosa solicitud={solicitud} paraPagar={false} />}
      <TarjetaSugerencias solicitud={solicitud} />
    </>
  )
}

function VistaAprobada({ solicitud }: { solicitud: SolicitudLanding }) {
  return (
    <>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-turquesa/40 bg-turquesa/10 text-turquesa">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-bold text-blanco">¡Tu plan está aprobado!</h1>
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          Revisamos tu solicitud y quedó lista para activar. Abajo está el
          total de la primera factura y cómo pagarla.
        </p>
      </div>
      <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
        <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
      </section>
      <TarjetaResumen solicitud={solicitud} />
      <TarjetaPlanAprobado solicitud={solicitud} />
    </>
  )
}

function VistaEnPrueba({
  solicitud,
  metodosPago,
  token,
}: {
  solicitud: SolicitudLanding
  metodosPago: MetodoPagoPublico[] | null
  token: string
}) {
  const pago = solicitud.pago
  const moroso = solicitud.tenant_estado === 'moroso'
  const pagado = pago?.estado === 'pagado'

  return (
    <>
      <div className="text-center">
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${
            moroso ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-turquesa/40 bg-turquesa/10 text-turquesa'
          }`}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {moroso ? (
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </>
            ) : (
              <path d="m5 12 5 5L20 7" />
            )}
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-bold text-blanco">
          {moroso
            ? 'Tu prueba terminó'
            : pagado
              ? '¡Prueba activa, primer mes pagado!'
              : '¡Tu prueba está activa!'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          {moroso ? (
            <>
              Tu período de prueba terminó y tu Calenzia quedó en pausa. Para
              seguir usando <span className="text-blanco">agenda.anayadev.cl/{solicitud.slug}</span>,
              paga tu mensualidad: abajo está todo.
            </>
          ) : pagado ? (
            <>
              Tu Calenzia ya está funcionando para{' '}
              <span className="text-blanco">{solicitud.negocio_nombre}</span> y el
              primer mes quedó pagado. ¡Disfruta la prueba completa!
            </>
          ) : (
            <>
              Tu Calenzia ya está funcionando para{' '}
              <span className="text-blanco">{solicitud.negocio_nombre}</span> en{' '}
              <span className="text-cian">agenda.anayadev.cl/{solicitud.slug}</span>.
              Puedes adelantar tu pago cuando quieras — no pierdes días de
              prueba — o esperar: tu mensualidad arranca al terminar.
            </>
          )}
        </p>
      </div>
      <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
        <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
      </section>
      <TarjetaResumen solicitud={solicitud} />
      {moroso ? (
        <TarjetaPago solicitud={solicitud} metodosPago={metodosPago} token={token} exigible />
      ) : pagado ? (
        <section className="rounded-3xl border border-turquesa/30 bg-turquesa/10 p-6 sm:p-8 text-center">
          <p className="text-sm font-semibold text-turquesa">
            Tu primer mes está pagado ✓
          </p>
          <p className="mt-1 text-sm leading-relaxed text-bruma">
            Cuando termine tu prueba, tu plan sigue sin interrupciones.
          </p>
        </section>
      ) : (
        <TarjetaPago
          solicitud={solicitud}
          metodosPago={metodosPago}
          token={token}
          exigible={false}
        />
      )}
    </>
  )
}

function VistaActiva({ solicitud }: { solicitud: SolicitudLanding }) {
  return (
    <>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-turquesa/40 bg-turquesa/10 text-turquesa">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-bold text-blanco">Tu Calenzia ya está activa</h1>
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          El servicio ya está funcionando para{' '}
          <span className="text-blanco">{solicitud.negocio_nombre}</span> en{' '}
          <span className="text-cian">agenda.anayadev.cl/{solicitud.slug}</span>.
        </p>
      </div>
      <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
        <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
      </section>
      <TarjetaResumen solicitud={solicitud} />
    </>
  )
}

function VistaCerrada({ solicitud }: { solicitud: SolicitudLanding }) {
  const expirada = solicitud.estado === 'expirada'
  return (
    <>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-bruma/30 bg-abisal/60 text-bruma">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9 9l6 6M15 9l-6 6" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-bold text-blanco">
          {expirada ? 'Tu solicitud venció' : 'Tu solicitud no fue aprobada'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          {expirada
            ? 'La solicitud expiró sin completarse. Puedes volver a solicitarla cuando quieras: todo el proceso toma un par de minutos.'
            : 'No pudimos continuar con tu solicitud esta vez. Puedes volver a postular cuando quieras corrigiendo lo indicado — te dejamos el detalle en el correo que te enviamos.'}
        </p>
      </div>
      <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
        <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
      </section>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href="/comprar"
          className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco"
        >
          {expirada ? 'Volver a intentarlo' : 'Volver a postular'}
        </a>
        <a
          href="/#contacto"
          className="rounded-full border border-blanco/15 px-7 py-3 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
        >
          Hablar con nosotros
        </a>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------
// Orquestador
// ----------------------------------------------------------------------

export function VistaSolicitud({
  token,
  solicitud,
  metodosPago = [],
  onActualizar,
}: {
  token: string
  solicitud: SolicitudLanding
  metodosPago?: MetodoPagoPublico[] | null
  onActualizar?: (s: SolicitudLanding) => void
}) {
  const pendiente = ESTADOS_PENDIENTES.includes(solicitud.estado)
  const cerrada = solicitud.estado === 'rechazada' || solicitud.estado === 'expirada'

  // El estado REAL se deriva del tenant (A.3): una vez provisionado, manda
  // sobre el estado de la solicitud.
  const tenantMoroso = solicitud.tenant_estado === 'moroso'
  const tenantActivo = solicitud.tenant_estado === 'activo'

  let vista: ReactNode
  if (cerrada) {
    vista = <VistaCerrada solicitud={solicitud} />
  } else if (pendiente && solicitud.plan_propuesto) {
    // onboarding-aceptacion: el plan ya está propuesto y espera al cliente.
    vista = (
      <>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blanco">Tu plan está listo</h1>
          <p className="mt-3 text-sm leading-relaxed text-bruma">
            Revisamos tu solicitud y preparamos este plan. Míralo y acéptalo para
            seguir; si algo no te cuadra, conversémoslo.
          </p>
        </div>
        <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
          <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
        </section>
        <TarjetaPlanPropuesto
          solicitud={solicitud}
          token={token}
          onActualizar={onActualizar}
        />
        <TarjetaResumen solicitud={solicitud} />
      </>
    )
  } else if (pendiente) {
    vista = <VistaPendiente solicitud={solicitud} />
  } else if (solicitud.estado === 'aprobada') {
    vista = (
      <>
        <VistaAprobada solicitud={solicitud} />
        <TarjetaPago
          solicitud={solicitud}
          metodosPago={metodosPago}
          token={token}
          exigible
        />
      </>
    )
  } else if (solicitud.estado === 'en_prueba' && !tenantActivo && !tenantMoroso) {
    vista = (
      <VistaEnPrueba solicitud={solicitud} metodosPago={metodosPago} token={token} />
    )
  } else if (tenantMoroso) {
    vista = (
      <VistaEnPrueba solicitud={solicitud} metodosPago={metodosPago} token={token} />
    )
  } else {
    vista = <VistaActiva solicitud={solicitud} />
  }

  return (
    <div className="relative min-h-screen">
      <FondoCircuito />
      <Encabezado />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        {vista}
      </main>
    </div>
  )
}
