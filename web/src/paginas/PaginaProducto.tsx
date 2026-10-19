import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chatbot } from '../componentes/Chatbot'
import { FondoCircuito } from '../componentes/FondoCircuito'
import { Marca } from '../componentes/Marca'
import { PiePagina } from '../componentes/PiePagina'
import { SeccionPlanes } from '../componentes/secciones/SeccionPlanes'
import { api } from '../lib/api'
import { NombreConZia } from '../lib/marca'
import { ESTADOS_PRODUCTO } from '../lib/productos'
import type { ContenidoPublico, Seccion } from '../lib/tipos'

function Cabecera() {
  return (
    <header className="sticky top-0 z-40 border-b border-blanco/8 bg-noche/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Volver al inicio">
          <Marca tamano="sm" />
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-bruma transition-colors hover:text-cian"
        >
          ← Volver
        </Link>
      </div>
    </header>
  )
}

export function PaginaProducto() {
  const { slug } = useParams<{ slug: string }>()
  const [contenido, setContenido] = useState<ContenidoPublico | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    api
      .contenidoPublico()
      .then((datos) => {
        if (activo) setContenido(datos)
      })
      .catch(() => {
        if (activo) setError('No pudimos cargar el producto.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [slug])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

  const producto = contenido?.productos.find((p) => p.slug === slug) ?? null

  if (cargando) {
    return (
      <div className="relative min-h-screen">
        <FondoCircuito />
        <Cabecera />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="tarjeta-vidrio rounded-2xl p-8 text-sm text-bruma">
            Cargando producto…
          </p>
        </main>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="relative min-h-screen">
        <FondoCircuito />
        <Cabecera />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="tarjeta-vidrio rounded-2xl p-8 text-sm text-bruma">
            {error || 'No encontramos ese producto.'}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-6 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)]"
          >
            Volver al inicio
            <span aria-hidden>→</span>
          </Link>
        </main>
        <PiePagina contenido={contenido} />
      </div>
    )
  }

  const estado =
    ESTADOS_PRODUCTO[producto.estado] ?? ESTADOS_PRODUCTO.proximamente
  const seccionPlanes: Seccion = {
    id: 0,
    slug: 'planes',
    tipo: 'planes',
    titulo: 'Planes',
    subtitulo: `Elige cómo empezar con ${producto.nombre}.`,
    texto: '',
    imagen_url: null,
    datos: {},
    orden: 0,
    visible: true,
  }

  return (
    <div className="relative min-h-screen pb-24">
      <FondoCircuito />
      <Cabecera />

      <main>
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div
              className={`grid items-center gap-10 ${
                producto.imagen_url ? 'lg:grid-cols-[1.15fr_0.85fr]' : ''
              }`}
            >
              <div className={producto.imagen_url ? '' : 'max-w-3xl'}>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${estado.clase}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
                  {estado.etiqueta}
                </span>

                <h1 className="mt-5 text-4xl font-bold tracking-tight text-blanco sm:text-5xl">
                  <NombreConZia nombre={producto.nombre} />
                </h1>
                {producto.eslogan && (
                  <p className="mt-2 text-lg font-semibold">
                    <span className="texto-gradiente">{producto.eslogan}</span>
                  </p>
                )}
                {producto.descripcion && (
                  <p className="mt-5 text-base leading-relaxed text-bruma">
                    {producto.descripcion}
                  </p>
                )}

                {producto.caracteristicas.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {producto.caracteristicas.map((caracteristica, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-bruma"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violeta to-cian" />
                        {caracteristica}
                      </li>
                    ))}
                  </ul>
                )}

                {producto.demo_url && (
                  <a
                    href={producto.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-blanco/15 px-6 py-3 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
                  >
                    Ver demo
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </div>

              {producto.imagen_url && (
                <div className="anillo-gradiente rounded-3xl p-4 sm:p-6">
                  <img
                    src={producto.imagen_url}
                    alt={`Vista de ${producto.nombre}`}
                    className="mx-auto max-h-[420px] w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {producto.muestra_planes && <SeccionPlanes seccion={seccionPlanes} />}
      </main>

      <PiePagina contenido={contenido} />
      <Chatbot />

      {producto.muestra_planes && producto.estado === 'activo' && (
        <a
          href="/comprar"
          className="fixed bottom-5 left-5 z-40 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-6 py-3 text-sm font-semibold text-blanco shadow-[0_0_34px_-8px_rgba(0,223,240,0.7)] transition-transform hover:scale-105"
        >
          Comprar
          <span aria-hidden>→</span>
        </a>
      )}
    </div>
  )
}
