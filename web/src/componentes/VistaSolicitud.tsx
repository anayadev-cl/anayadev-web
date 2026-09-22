import { FondoCircuito } from './FondoCircuito'
import { Marca } from './Marca'
import { formatearMontoMoneda } from '../lib/paises'
import type { SolicitudLanding } from '../lib/tipos'

const ESTADOS_PENDIENTES = ['solicitada', 'en_revision']
const ESTADOS_CON_PLAN = ['aprobada', 'activa']

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

function TarjetaPagoPlaceholder() {
  return (
    <section className="rounded-3xl border border-dashed border-blanco/20 bg-abisal/40 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-blanco">Cómo pagar</h2>
      <p className="mt-2 text-sm leading-relaxed text-bruma">
        Datos de pago — próximamente.
      </p>
      <p className="mt-1 text-xs leading-relaxed text-bruma/60">
        Aquí encontrarás la información para pagar por transferencia. Nuestro
        equipo te contactará para coordinar la activación.
      </p>
    </section>
  )
}

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
      <TarjetaResumen solicitud={solicitud} />
      <TarjetaSugerencias solicitud={solicitud} />
    </>
  )
}

function VistaConPlan({ solicitud }: { solicitud: SolicitudLanding }) {
  const activa = solicitud.estado === 'activa'
  return (
    <>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-turquesa/40 bg-turquesa/10 text-turquesa">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-bold text-blanco">
          {activa ? 'Tu Calenzia ya está activa' : '¡Tu plan está aprobado!'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bruma">
          {activa ? (
            <>
              El servicio ya está funcionando para{' '}
              <span className="text-blanco">{solicitud.negocio_nombre}</span> en{' '}
              <span className="text-cian">agenda.anayadev.cl/{solicitud.slug}</span>.
            </>
          ) : (
            <>
              Revisamos tu solicitud y quedó lista para activar. Abajo está el
              total de la primera factura y, muy pronto, los datos de pago.
            </>
          )}
        </p>
      </div>
      <TarjetaResumen solicitud={solicitud} />
      <TarjetaPlanAprobado solicitud={solicitud} />
      <TarjetaPagoPlaceholder />
    </>
  )
}

function VistaCerrada({ solicitud }: { solicitud: SolicitudLanding }) {
  const expirada = solicitud.estado === 'expirada'
  return (
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
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
    </div>
  )
}

export function VistaSolicitud({ solicitud }: { solicitud: SolicitudLanding }) {
  const pendiente = ESTADOS_PENDIENTES.includes(solicitud.estado)
  const conPlan = ESTADOS_CON_PLAN.includes(solicitud.estado)
  const cerrada = !pendiente && !conPlan
  return (
    <div className="relative min-h-screen">
      <FondoCircuito />
      <Encabezado />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        {pendiente && <VistaPendiente solicitud={solicitud} />}
        {conPlan && <VistaConPlan solicitud={solicitud} />}
        {cerrada && <VistaCerrada solicitud={solicitud} />}
      </main>
    </div>
  )
}
