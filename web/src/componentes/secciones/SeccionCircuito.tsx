import type { ItemSeccion, Seccion } from '../../lib/tipos'

interface SeccionCircuitoProps {
  seccion: Seccion
}

const ICONOS = [
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2.4" />
      <path d="M9 12H2.5M21.5 12H15M12 9V2.5M12 21.5V15M6.9 6.9 3.5 3.5M20.5 20.5l-3.4-3.4M17.1 6.9l3.4-3.4M3.5 20.5l3.4-3.4" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h10M4 12h10M4 16h10" />
      <circle cx="17.5" cy="8" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9 9h6v6H9zM9 12h2M13 9v2M15 15h2" />
    </svg>
  ),
]

export function SeccionCircuito({ seccion }: SeccionCircuitoProps) {
  const items = (seccion.datos.items as ItemSeccion[] | undefined) ?? []

  return (
    <section id={seccion.slug ?? undefined} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violeta">
            La marca
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

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="group tarjeta-vidrio relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-cian/30 hover:shadow-[0_0_40px_-16px_rgba(0,223,240,0.5)] sm:p-7"
            >
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-violeta/20 to-cian/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violeta/30 bg-violeta/10 text-cian">
                {ICONOS[i % ICONOS.length]}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-blanco">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bruma">{item.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
