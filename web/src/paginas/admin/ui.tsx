import type { ReactNode } from 'react'

export const entradaClase =
  'w-full rounded-lg border border-blanco/10 bg-abisal/80 px-3.5 py-2.5 text-sm text-blanco outline-none transition-colors placeholder:text-bruma/40 focus:border-cian/50 focus:ring-1 focus:ring-cian/30'

export function Campo({
  etiqueta,
  children,
  className = '',
}: {
  etiqueta: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
        {etiqueta}
      </span>
      {children}
    </label>
  )
}

export function Boton({
  children,
  variante = 'primario',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'peligro' | 'fantasma'
}) {
  const clases = {
    primario:
      'bg-gradient-to-r from-violeta via-electrica to-cian text-blanco hover:shadow-[0_0_26px_-8px_rgba(0,223,240,0.6)]',
    secundario:
      'border border-blanco/15 text-bruma hover:border-cian/50 hover:text-cian',
    peligro: 'border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20',
    fantasma: 'text-bruma hover:text-blanco',
  }[variante]
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${clases} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Switch({
  activo,
  alCambiar,
  etiqueta,
}: {
  activo: boolean
  alCambiar: (valor: boolean) => void
  etiqueta: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => alCambiar(!activo)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        activo ? 'bg-gradient-to-r from-electrica to-turquesa' : 'bg-blanco/15'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-blanco shadow transition-transform ${
          activo ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function Aviso({ texto }: { texto: string }) {
  if (!texto) return null
  return (
    <p className="rounded-lg border border-turquesa/30 bg-turquesa/10 px-4 py-2.5 text-sm text-turquesa">
      {texto}
    </p>
  )
}
