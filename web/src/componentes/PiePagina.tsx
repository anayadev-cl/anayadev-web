import type { ContenidoPublico } from '../lib/tipos'
import { Marca } from './Marca'

interface PiePaginaProps {
  contenido: ContenidoPublico | null
}

export function PiePagina({ contenido }: PiePaginaProps) {
  const ajustes = contenido?.ajustes ?? {}
  const anio = new Date().getFullYear()
  const instagram = ajustes.instagram ?? ''
  const email = ajustes.email_contacto ?? ''

  return (
    <footer className="border-t border-blanco/8 bg-abisal/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <Marca tamano="sm" />
          <span className="hidden text-xs text-bruma/70 sm:inline">
            {ajustes.footer_eslogan ?? 'Inteligencia que conecta'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-bruma/70">
          <span className="hidden sm:inline">
            © {anio} anayadev — Inteligencia que conecta
          </span>
          {email && (
            <a
              href={`mailto:${email}`}
              aria-label={`Escribir a ${email}`}
              className="text-bruma transition-colors hover:text-cian"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </a>
          )}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de anayadev"
              className="text-bruma transition-colors hover:text-cian"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          )}
          <a href="/admin" className="transition-colors hover:text-cian">
            Panel
          </a>
        </div>
      </div>
    </footer>
  )
}
