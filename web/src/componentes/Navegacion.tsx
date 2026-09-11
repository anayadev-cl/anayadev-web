import { useEffect, useState } from 'react'
import type { Seccion } from '../lib/tipos'
import { Marca } from './Marca'

interface NavegacionProps {
  secciones: Seccion[]
}

export function Navegacion({ secciones }: NavegacionProps) {
  const [abierto, setAbierto] = useState(false)
  const [conFondo, setConFondo] = useState(false)

  const enlaces = secciones
    .filter((s) => s.slug && ['circuito', 'productos', 'proceso', 'contacto'].includes(s.tipo))
    .map((s) => ({ slug: s.slug as string, titulo: s.titulo }))

  useEffect(() => {
    const alDesplazar = () => setConFondo(window.scrollY > 12)
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        conFondo || abierto
          ? 'border-b border-blanco/8 bg-noche/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#inicio" onClick={() => setAbierto(false)} aria-label="anayadev, inicio">
          <Marca tamano="sm" />
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {enlaces.map((e) => (
            <a
              key={e.slug}
              href={`#${e.slug}`}
              className="text-sm font-medium text-bruma transition-colors hover:text-cian"
            >
              {e.titulo}
            </a>
          ))}
          <a
            href="#contacto"
            className="anillo-gradiente rounded-full px-4 py-1.5 text-sm font-semibold text-blanco transition-shadow hover:shadow-[0_0_24px_-6px_rgba(0,223,240,0.6)]"
          >
            Conversemos
          </a>
        </div>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-blanco/10 text-blanco md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {abierto ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {abierto && (
        <div className="border-t border-blanco/8 bg-noche/95 px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {enlaces.map((e) => (
              <a
                key={e.slug}
                href={`#${e.slug}`}
                onClick={() => setAbierto(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-bruma transition-colors hover:bg-blanco/5 hover:text-cian"
              >
                {e.titulo}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setAbierto(false)}
              className="mt-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-4 py-3 text-center text-base font-semibold text-blanco"
            >
              Conversemos
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
