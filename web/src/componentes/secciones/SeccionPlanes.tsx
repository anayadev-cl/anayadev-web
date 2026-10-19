import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatearMontoMoneda } from '../../lib/paises'
import type {
  PlanCatalogoPublico,
  PlanFuncionPublica,
  PlanPresetPublico,
  Seccion,
} from '../../lib/tipos'

interface SeccionPlanesProps {
  seccion: Seccion
}

const MONEDA_CL = {
  moneda: 'CLP',
  simbolo_moneda: '$',
  decimales: 0,
  locale: 'es-CL',
}

const ETIQUETAS_CUPO: Record<string, string> = {
  conversaciones: 'conversaciones',
  recordatorios: 'recordatorios',
  gemas: 'gemas',
}

const ADDON_UPGRADE = 'upgrade_cupo_premium'

function desdeDe(plan: PlanPresetPublico | undefined): number | null {
  if (!plan || plan.precios.length === 0) return null
  return Math.min(...plan.precios.map((p) => p.precio_persona))
}

function monto(precio: number | null): string {
  return precio === null ? '—' : formatearMontoMoneda(MONEDA_CL, precio)
}

function cuposDe(plan: PlanPresetPublico | undefined): string {
  if (!plan) return ''
  return plan.cupos
    .map((c) => `${c.cantidad_persona} ${ETIQUETAS_CUPO[c.recurso] ?? c.recurso}`)
    .join(' · ')
}

function ItemFuncion({ funcion }: { funcion: PlanFuncionPublica }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-turquesa/30 bg-turquesa/10 text-[10px] font-bold text-turquesa">
        ✓
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-blanco">{funcion.nombre}</span>
        {funcion.descripcion && (
          <span className="mt-0.5 block text-xs leading-relaxed text-bruma/70">
            {funcion.descripcion}
          </span>
        )}
      </span>
    </li>
  )
}

function TarjetaPlan({
  plan,
  destacado,
  incluye,
  todoBasico,
}: {
  plan: PlanPresetPublico
  destacado: boolean
  incluye: PlanFuncionPublica[]
  todoBasico: boolean
}) {
  const desde = desdeDe(plan)
  const cupos = cuposDe(plan)

  return (
    <article
      className={`relative flex flex-col rounded-2xl p-6 sm:p-8 ${
        destacado ? 'anillo-gradiente' : 'tarjeta-vidrio'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2xl font-bold text-blanco">{plan.nombre}</h3>
        {destacado && (
          <span className="shrink-0 rounded-full border border-turquesa/40 bg-turquesa/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-turquesa">
            Más completo
          </span>
        )}
      </div>
      {plan.descripcion && (
        <p className="mt-2 text-sm leading-relaxed text-bruma">{plan.descripcion}</p>
      )}

      <div className="mt-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bruma/60">
          Desde
        </span>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-bold texto-gradiente">{monto(desde)}</span>
          <span className="text-sm text-bruma">/persona /mes</span>
        </div>
      </div>

      <div className="mt-6 flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bruma/60">
          Incluye
        </span>
        <ul className="mt-3 space-y-2.5">
          {todoBasico && (
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-turquesa/30 bg-turquesa/10 text-[10px] font-bold text-turquesa">
                ✓
              </span>
              <span className="text-sm font-semibold text-blanco">Todo lo de Básico</span>
            </li>
          )}
          {incluye.map((funcion) => (
            <ItemFuncion key={funcion.codigo} funcion={funcion} />
          ))}
        </ul>
      </div>

      {cupos && (
        <p className="mt-5 rounded-xl border border-blanco/8 bg-abisal/60 px-3 py-2 text-xs leading-relaxed text-bruma/70">
          <span className="font-semibold text-bruma">Cupo por persona:</span> {cupos}
        </p>
      )}

      <a
        href={`/comprar?plan=${plan.codigo}`}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-5 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)]"
      >
        Ver {plan.nombre} y comprar
        <span aria-hidden>→</span>
      </a>
    </article>
  )
}

export function SeccionPlanes({ seccion }: SeccionPlanesProps) {
  const [catalogo, setCatalogo] = useState<PlanCatalogoPublico | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let activo = true
    api
      .planesCatalogo('CL')
      .then((datos) => {
        if (activo) setCatalogo(datos)
      })
      .catch(() => {
        if (activo) setError(true)
      })
    return () => {
      activo = false
    }
  }, [])

  const basico = catalogo?.planes.find((p) => p.codigo === 'basico')
  const premium = catalogo?.planes.find((p) => p.codigo === 'premium')
  const base = catalogo?.funciones.filter((f) => f.tipo === 'base') ?? []
  const addons =
    catalogo?.funciones.filter(
      (f) => f.tipo === 'addon' && f.codigo !== ADDON_UPGRADE,
    ) ?? []
  const maxDescuento =
    catalogo && catalogo.periodicidades.length > 0
      ? Math.max(...catalogo.periodicidades.map((p) => Math.abs(p.descuento_pct)))
      : 0
  const sinPlanes = catalogo !== null && !basico && !premium

  return (
    <section id={seccion.slug ?? undefined} className="relative py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-blanco sm:text-4xl">
            {seccion.titulo}
          </h2>
          {seccion.subtitulo && (
            <p className="mt-4 text-base leading-relaxed text-bruma">
              {seccion.subtitulo}
            </p>
          )}
        </div>

        {error || sinPlanes ? (
          <div className="tarjeta-vidrio mx-auto mt-10 max-w-xl rounded-2xl p-6 text-center">
            <p className="text-sm leading-relaxed text-bruma">
              No pudimos cargar los planes ahora. Puedes verlos y comprar en el
              checkout.
            </p>
            <a
              href="/comprar"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-5 py-2.5 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)]"
            >
              Ver planes y comprar
              <span aria-hidden>→</span>
            </a>
          </div>
        ) : !catalogo ? (
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="tarjeta-vidrio animate-pulse rounded-2xl p-6 sm:p-8"
              >
                <div className="h-7 w-32 rounded bg-blanco/10" />
                <div className="mt-3 h-4 w-3/4 rounded bg-blanco/8" />
                <div className="mt-6 h-9 w-40 rounded bg-blanco/10" />
                <div className="mt-6 space-y-3">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-4 w-full rounded bg-blanco/8" />
                  ))}
                </div>
                <div className="mt-8 h-11 w-full rounded-full bg-blanco/10" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              {basico && (
                <TarjetaPlan
                  plan={basico}
                  destacado={false}
                  incluye={base}
                  todoBasico={false}
                />
              )}
              {premium && (
                <TarjetaPlan
                  plan={premium}
                  destacado
                  incluye={addons}
                  todoBasico
                />
              )}
            </div>
            <div className="mx-auto mt-5 max-w-4xl">
              <div className="tarjeta-vidrio flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold text-blanco">Personalizado</p>
                  <p className="mt-1 text-sm leading-relaxed text-bruma">
                    ¿Necesitas algo a medida? Arma tu plan: el Básico + solo los
                    add-ons que necesites.
                  </p>
                </div>
                <a
                  href="/comprar?plan=personalizado"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-cian/40 bg-cian/5 px-5 py-2.5 text-sm font-semibold text-cian transition-colors hover:border-cian/60 hover:bg-cian/10"
                >
                  Armar mi plan
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-bruma/60">
              Precios mensuales por persona.
              {maxDescuento > 0
                ? ` Hasta −${maxDescuento}% según periodicidad.`
                : ''}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
