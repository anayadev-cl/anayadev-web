import type { Producto, Seccion } from '../../lib/tipos'
import { NombreConZia } from '../../lib/marca'

interface SeccionProductosProps {
  seccion: Seccion
  productos: Producto[]
}

const ESTADOS: Record<
  Producto['estado'],
  { etiqueta: string; clase: string; punto: string }
> = {
  activo: {
    etiqueta: 'En producción',
    clase: 'border-turquesa/40 bg-turquesa/10 text-turquesa',
    punto: 'bg-turquesa',
  },
  en_desarrollo: {
    etiqueta: 'En desarrollo',
    clase: 'border-electrica/40 bg-electrica/10 text-electrica',
    punto: 'bg-electrica',
  },
  proximamente: {
    etiqueta: 'Próximamente',
    clase: 'border-violeta/40 bg-violeta/10 text-violeta',
    punto: 'bg-violeta',
  },
}

export function SeccionProductos({ seccion, productos }: SeccionProductosProps) {
  const datos = seccion.datos as { badge?: string }
  return (
    <section id={seccion.slug ?? undefined} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electrica">
            {datos.badge ?? 'Productos'}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-blanco sm:text-4xl">
            {seccion.titulo}
          </h2>
          {seccion.subtitulo && (
            <p className="mt-4 text-base leading-relaxed text-bruma">
              {seccion.subtitulo}
            </p>
          )}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => {
            const estado = ESTADOS[producto.estado] ?? ESTADOS.proximamente
            return (
              <article
                key={producto.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300 sm:p-7 ${
                  producto.estado === 'activo'
                    ? 'anillo-gradiente hover:shadow-[0_0_50px_-16px_rgba(0,223,240,0.55)]'
                    : producto.estado === 'proximamente'
                      ? 'tarjeta-vidrio border-dashed hover:border-violeta/40'
                      : 'tarjeta-vidrio hover:border-electrica/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${estado.clase}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
                    {estado.etiqueta}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-cian/60">
                    <circle cx="12" cy="12" r="2.4" />
                    <path d="M9 12H2.5M21.5 12H15M12 9V2.5M12 21.5V15" strokeLinecap="round" />
                  </svg>
                </div>

                {producto.imagen_url && (
                  <img
                    src={producto.imagen_url}
                    alt={`Vista de ${producto.nombre}`}
                    className="mt-5 h-40 w-full rounded-xl border border-blanco/8 bg-abisal object-contain p-2"
                    loading="lazy"
                  />
                )}

                <h3 className="mt-5 text-2xl font-bold text-blanco">
                  <NombreConZia nombre={producto.nombre} />
                </h3>
                <p className="mt-1.5 text-sm font-semibold">
                  <span className="texto-gradiente">{producto.eslogan}</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-bruma">
                  {producto.descripcion}
                </p>

                <ul className="mt-5 space-y-2.5">
                  {producto.caracteristicas.map((caracteristica, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-bruma">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violeta to-cian" />
                      {caracteristica}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex-1" />

                {producto.estado === 'activo' ? (
                  <div className="flex flex-col gap-2.5">
                    <a
                      href="/comprar"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-5 py-2.5 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)]"
                    >
                      Comprar {producto.nombre}
                      <span>→</span>
                    </a>
                    {producto.url && (
                      <a
                        href={producto.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-blanco/15 px-5 py-2.5 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
                      >
                        Conocer {producto.nombre} ↗
                      </a>
                    )}
                  </div>
                ) : producto.estado === 'en_desarrollo' ? (
                  <span className="inline-flex items-center justify-center gap-2 rounded-full border border-electrica/30 bg-electrica/5 px-5 py-2.5 text-sm font-medium text-electrica">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 3a9 9 0 1 0 9 9" />
                    </svg>
                    En construcción
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 rounded-full border border-violeta/30 bg-violeta/5 px-5 py-2.5 text-sm font-medium text-violeta">
                    En diseño
                  </span>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
