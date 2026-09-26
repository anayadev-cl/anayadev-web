import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { FondoCircuito } from './FondoCircuito'
import { Marca } from './Marca'
import { formatearMontoMoneda } from '../lib/paises'
import { api } from '../lib/api'
import type { MetodoPagoPublico, SolicitudLanding } from '../lib/tipos'

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
  return (
    <section className="tarjeta-vidrio rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-blanco">Lo que pediste</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Fila etiqueta="Negocio" valor={solicitud.negocio_nombre} />
        <Fila etiqueta="Tu página" valor={`agenda.anayadev.cl/${solicitud.slug}`} />
        <Fila etiqueta="País" valor={solicitud.pais} />
        <Fila etiqueta="Edición" valor={nombreEdicion(solicitud.edicion)} />
        <Fila
          etiqueta="Trabajadores"
          valor={`${solicitud.nro_trabajadores} ${
            solicitud.nro_trabajadores === 1 ? 'persona' : 'personas'
          }`}
        />
        <div className="border-t border-blanco/8 pt-2.5">
          <dt className="text-bruma/70">Módulos</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {solicitud.modulos.length === 0 ? (
              <span className="text-bruma/60">—</span>
            ) : (
              solicitud.modulos.map((codigo) => (
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
  metodosPago: MetodoPagoPublico[]
  token: string
  exigible: boolean
}) {
  const pago = solicitud.pago
  const [subiendo, setSubiendo] = useState(false)
  const [subido, setSubido] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const glosa = pago?.glosa || solicitud.glosa || ''
  const totalMinor = pago?.total ?? solicitud.total_primera_factura
  const puedeAdjuntar = pago != null && pago.estado === 'por_pagar' && !subido
  const vencimiento = fechaLegible(pago?.vencimiento_pago)

  async function adjuntar(archivo: File | null) {
    if (!archivo || !pago) return
    setError('')
    setSubiendo(true)
    try {
      await api.subirVoucherSolicitud(token, pago.cobro_id, archivo)
      setSubido(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos adjuntar tu comprobante.')
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
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-blanco/10 bg-abisal/60 px-5 py-4">
          <span className="text-sm font-semibold text-bruma">Total a pagar</span>
          <span className="text-2xl font-bold texto-gradiente">
            {formatearMontoMoneda(
              {
                moneda: solicitud.moneda,
                simbolo_moneda: solicitud.simbolo_moneda,
                decimales: solicitud.decimales,
              },
              totalMinor,
            )}
          </span>
        </div>
      )}
      {exigible && vencimiento && (
        <p className="mt-2 text-xs font-semibold text-turquesa">Vence el {vencimiento}</p>
      )}

      {glosa && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-blanco/10 bg-abisal/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-bruma/60">Referencia de tu transferencia</p>
            <p className="mt-0.5 truncate font-mono text-lg font-bold tracking-wide text-cian">
              {glosa}
            </p>
          </div>
          <BotonCopiar texto={glosa} />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {metodosPago.length === 0 ? (
          <p className="text-sm leading-relaxed text-bruma">
            Los datos de pago se publicarán pronto. Nuestro equipo te
            contactará para coordinar la transferencia.
          </p>
        ) : (
          metodosPago.map((metodo) => (
            <div
              key={`${metodo.tipo}-${metodo.nombre}`}
              className="rounded-2xl border border-blanco/10 bg-abisal/60 p-4"
            >
              <p className="text-sm font-semibold text-blanco">{metodo.nombre}</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-bruma">
                {metodo.instrucciones_publicas}
              </pre>
            </div>
          ))
        )}
      </div>

      {puedeAdjuntar && (
        <div className="mt-5">
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            className="hidden"
            onChange={(e) => void adjuntar(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
            className={`rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
              exigible
                ? 'bg-gradient-to-r from-violeta via-electrica to-cian text-blanco hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)]'
                : 'border border-cian/40 text-cian hover:bg-cian/10'
            }`}
          >
            {subiendo ? 'Subiendo…' : pago?.voucher_url ? 'Reemplazar comprobante' : 'Adjuntar comprobante'}
          </button>
          {pago?.voucher_url && !subido && (
            <a
              href={pago.voucher_url}
              target="_blank"
              rel="noreferrer"
              className="ml-3 text-xs font-semibold text-cian underline hover:text-turquesa"
            >
              Ver comprobante
            </a>
          )}
        </div>
      )}
      {subido && (
        <p className="mt-4 rounded-xl border border-turquesa/30 bg-turquesa/10 px-4 py-3 text-sm text-turquesa">
          Recibimos tu comprobante: lo estamos verificando. Cuando el equipo lo
          confirme, tu cuenta queda al día. ¡Gracias!
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
  metodosPago: MetodoPagoPublico[]
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
            : 'Lamentablemente no pudimos continuar con tu solicitud. Si crees que fue un error o tienes dudas, escríbenos y lo revisamos contigo.'}
        </p>
      </div>
      <section className="tarjeta-vidrio rounded-3xl p-5 sm:p-6">
        <LineaTiempo hitos={lineaDeTiempo(solicitud)} />
      </section>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {expirada && (
          <a
            href="/comprar"
            className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco"
          >
            Volver a intentarlo
          </a>
        )}
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
}: {
  token: string
  solicitud: SolicitudLanding
  metodosPago?: MetodoPagoPublico[]
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
