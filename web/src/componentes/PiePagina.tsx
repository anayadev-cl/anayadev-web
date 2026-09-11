import type { ContenidoPublico } from '../lib/tipos'
import { Marca } from './Marca'

interface PiePaginaProps {
  contenido: ContenidoPublico | null
}

export function PiePagina({ contenido }: PiePaginaProps) {
  const ajustes = contenido?.ajustes ?? {}
  const anio = new Date().getFullYear()

  const redes = [
    {
      clave: 'instagram',
      nombre: 'Instagram',
      url: `https://instagram.com/${(ajustes.instagram ?? '@anayadev.cl').replace('@', '')}`,
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      clave: 'linkedin',
      nombre: 'LinkedIn',
      url: `https://linkedin.com/company/${ajustes.linkedin ?? 'anayadev'}`,
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-7.9c0-1.88-.03-4.3-2.62-4.3-2.63 0-3.03 2.05-3.03 4.17V23H8V8z" />
        </svg>
      ),
    },
    {
      clave: 'github',
      nombre: 'GitHub',
      url: `https://github.com/${ajustes.github ?? 'anayadev-cl'}`,
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.05.78 2.13v3.16c0 .31.21.67.8.55A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      ),
    },
  ].filter((r) => (ajustes[r.clave] ?? '').trim() !== '')

  return (
    <footer className="relative border-t border-blanco/8 bg-abisal/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Marca tamano="md" />
            <p className="mt-4 text-sm leading-relaxed text-bruma">
              {ajustes.footer_eslogan ?? 'Inteligencia que conecta'} — productos
              SaaS con IA en el core, personalizables y hechos en Chile.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bruma/70">
                Sitio
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ['circuito', 'La marca'],
                  ['productos', 'Catálogo'],
                  ['proceso', 'Proceso'],
                  ['contacto', 'Contacto'],
                ].map(([ancla, etiqueta]) => (
                  <li key={ancla}>
                    <a href={`#${ancla}`} className="text-bruma transition-colors hover:text-cian">
                      {etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bruma/70">
                Redes
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {redes.map((r) => (
                  <li key={r.clave}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-bruma transition-colors hover:text-cian"
                    >
                      {r.icono}
                      {r.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-blanco/8 pt-6 text-xs text-bruma/70 sm:flex-row">
          <p>© {anio} anayadev — Inteligencia que conecta</p>
          <a href="/admin" className="transition-colors hover:text-cian">
            Panel de contenido
          </a>
        </div>
      </div>
    </footer>
  )
}
