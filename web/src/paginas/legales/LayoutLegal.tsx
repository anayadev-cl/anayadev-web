import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { FondoCircuito } from '../../componentes/FondoCircuito'
import { Marca } from '../../componentes/Marca'

interface LayoutLegalProps {
  titulo: string
  descripcion: string
  children: ReactNode
}

export const ENLACES_LEGALES = [
  { href: '/privacidad', texto: 'Política de Privacidad' },
  { href: '/terminos', texto: 'Términos de Servicio' },
  { href: '/eliminacion-datos', texto: 'Eliminación de datos' },
]

export function LayoutLegal({ titulo, descripcion, children }: LayoutLegalProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="relative min-h-screen">
      <title>{`${titulo} — anayadev`}</title>
      <meta name="description" content={descripcion} />

      <FondoCircuito />

      <header className="border-b border-blanco/8">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <a href="/" aria-label="Volver al inicio de anayadev">
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <article className="tarjeta-vidrio rounded-2xl p-6 sm:p-10">{children}</article>
      </main>

      <footer className="border-t border-blanco/8 bg-abisal/60">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-6 text-xs text-bruma/70 sm:flex-row sm:justify-between sm:px-6">
          <Marca tamano="sm" />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {ENLACES_LEGALES.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="transition-colors hover:text-cian"
              >
                {enlace.texto}
              </a>
            ))}
          </nav>
          <span>© {new Date().getFullYear()} anayadev</span>
        </div>
      </footer>
    </div>
  )
}
