import type { BotonSeccion, Seccion } from '../../lib/tipos'

interface SeccionHeroProps {
  seccion: Seccion
}

export function SeccionHero({ seccion }: SeccionHeroProps) {
  const datos = seccion.datos as {
    badge?: string
    botones?: BotonSeccion[]
    resumen?: string[]
  }

  return (
    <section id="inicio" className="relative flex min-h-[92vh] items-center">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {datos.badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-cian/25 bg-cian/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-cian">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cian opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cian" />
              </span>
              {datos.badge}
            </span>
          )}

          <h1 className="mt-7 text-4xl font-bold leading-[1.08] tracking-tight text-blanco sm:text-6xl lg:text-7xl">
            {seccion.titulo.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="texto-gradiente">
              {seccion.titulo.split(' ').slice(-1)[0]}
            </span>
          </h1>

          {seccion.subtitulo && (
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bruma sm:text-lg">
              {seccion.subtitulo}
            </p>
          )}

          {(datos.botones ?? []).length > 0 && (
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {datos.botones!.map((boton, i) =>
                boton.estilo === 'primario' ? (
                  <a
                    key={i}
                    href={boton.enlace}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3.5 text-base font-semibold text-blanco transition-all hover:shadow-[0_0_36px_-8px_rgba(0,223,240,0.65)] sm:w-auto"
                  >
                    {boton.texto}
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </a>
                ) : (
                  <a
                    key={i}
                    href={boton.enlace}
                    className="inline-flex w-full items-center justify-center rounded-full border border-blanco/15 px-7 py-3.5 text-base font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian sm:w-auto"
                  >
                    {boton.texto}
                  </a>
                ),
              )}
            </div>
          )}
        </div>

        {(datos.resumen ?? []).length > 0 && (
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {datos.resumen!.map((item, i) => (
              <div
                key={i}
                className="tarjeta-vidrio rounded-2xl px-5 py-4 text-center text-sm font-medium text-bruma"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violeta to-cian align-middle" />
                {item}
              </div>
            ))}
          </div>
        )}

        <div className="mx-auto mt-16 hidden justify-center sm:flex">
          <img
            src="/anayadev-logo.png"
            alt="anayadev — Inteligencia que conecta"
            className="animate-flotar max-h-44 rounded-2xl border border-blanco/8 opacity-90 shadow-[0_0_60px_-18px_rgba(132,56,244,0.5)]"
          />
        </div>
      </div>
    </section>
  )
}
