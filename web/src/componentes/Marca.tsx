interface MarcaProps {
  tamano: 'sm' | 'md' | 'lg'
}

const TAMANOS = {
  sm: { imagen: 'h-7 w-7', texto: 'text-lg' },
  md: { imagen: 'h-9 w-9', texto: 'text-2xl' },
  lg: { imagen: 'h-12 w-12', texto: 'text-4xl' },
}

export function Marca({ tamano = 'md' }: MarcaProps) {
  const t = TAMANOS[tamano]
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/anayadev-logo-isotipo.png"
        alt="anayadev"
        className={`${t.imagen} drop-shadow-[0_0_12px_rgba(0,223,240,0.35)]`}
      />
      <span className={`${t.texto} font-bold tracking-tight text-blanco`}>
        anaya
        <span className="texto-gradiente">dev</span>
      </span>
    </span>
  )
}
