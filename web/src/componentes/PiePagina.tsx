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
