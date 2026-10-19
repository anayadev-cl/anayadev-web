import { useEffect, useRef, useState } from 'react'
import type { ContenidoPublico } from '../lib/tipos'

interface ModalPromoProps {
  contenido: ContenidoPublico | null
}

function activo(valor: string | undefined): boolean {
  return valor === '1' || valor === 'true' || valor === 'on'
}

export function ModalPromo({ contenido }: ModalPromoProps) {
  const ajustes = contenido?.ajustes ?? {}
  const activoModal = activo(ajustes.modal_activo)
  const slug = ajustes.modal_producto_slug || 'calenzia'
  const version = ajustes.modal_version || '1'
  const clave = `anayadev:modal:${slug}:${version}`
  const producto = contenido?.productos.find((p) => p.slug === slug) ?? null
  const [abierto, setAbierto] = useState(false)
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!activoModal) {
      setAbierto(false)
      return
    }
    let descartado = false
    try {
      descartado = window.localStorage.getItem(clave) === '1'
    } catch {
      descartado = false
    }
    if (descartado) return
    const temporizador = window.setTimeout(() => setAbierto(true), 1200)
    return () => window.clearTimeout(temporizador)
  }, [activoModal, clave])

  useEffect(() => {
    if (!abierto) return
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        try {
          window.localStorage.setItem(clave, '1')
        } catch {}
        setAbierto(false)
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = overflowOriginal
      window.removeEventListener('keydown', alTeclear)
    }
  }, [abierto, clave])

  function cerrar() {
    try {
      window.localStorage.setItem(clave, '1')
    } catch {}
    setAbierto(false)
  }

  if (!abierto) return null

  const titulo = ajustes.modal_titulo || producto?.nombre || 'Novedad'
  const texto =
    ajustes.modal_texto || producto?.eslogan || producto?.descripcion || ''
  const ctaTexto = ajustes.modal_cta_texto || 'Ver más'
  const ctaUrl = ajustes.modal_cta_url || (producto ? `/${producto.slug}` : '/comprar')

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-noche/80 p-4 backdrop-blur-sm"
      onClick={cerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-promo-titulo"
        className="tarjeta-vidrio relative w-full max-w-md rounded-3xl p-6 sm:p-7"
        onClick={(evento) => evento.stopPropagation()}
      >
        <button
          ref={cerrarRef}
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-blanco/10 text-bruma transition-colors hover:border-cian/40 hover:text-cian"
        >
          ✕
        </button>

        {producto?.imagen_url && (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="mx-auto h-24 w-24 object-contain"
          />
        )}
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-cian">
          Novedad
        </p>
        <h2
          id="modal-promo-titulo"
          className="mt-2 pr-8 text-2xl font-bold text-blanco"
        >
          {titulo}
        </h2>
        {texto && (
          <p className="mt-3 text-sm leading-relaxed text-bruma">{texto}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href={ctaUrl}
            onClick={cerrar}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-5 py-2.5 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)]"
          >
            {ctaTexto}
            <span aria-hidden>→</span>
          </a>
          <button
            type="button"
            onClick={cerrar}
            className="inline-flex items-center justify-center rounded-full border border-blanco/15 px-5 py-2.5 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
