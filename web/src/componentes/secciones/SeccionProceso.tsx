import type { ItemSeccion, Seccion } from '../../lib/tipos'

interface SeccionProcesoProps {
  seccion: Seccion
}

export function SeccionProceso({ seccion }: SeccionProcesoProps) {
  const items = (seccion.datos.items as ItemSeccion[] | undefined) ?? []

  return (
    <section id={seccion.slug ?? undefined} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-turquesa">
            Proceso
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

        <div className="relative mt-16">
          <div
            aria-hidden
            className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-violeta/50 via-electrica/40 to-cian/30 lg:left-0 lg:right-0 lg:top-6 lg:mx-auto lg:h-px lg:w-full lg:bg-gradient-to-r"
          />
          <ol className="grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-6">
            {items.map((item, i) => (
              <li key={i} className="relative flex gap-6 lg:flex-col lg:gap-0 lg:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cian/40 bg-noche text-sm font-bold text-cian shadow-[0_0_20px_-6px_rgba(0,223,240,0.5)] lg:mx-auto">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="pb-2 lg:mt-6 lg:px-2">
                  <h3 className="text-lg font-semibold text-blanco">{item.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-bruma">{item.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
