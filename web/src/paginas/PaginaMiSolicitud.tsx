import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FondoCircuito } from '../componentes/FondoCircuito'
import { Marca } from '../componentes/Marca'
import { VistaSolicitud } from '../componentes/VistaSolicitud'
import { api } from '../lib/api'
import type { SolicitudLanding } from '../lib/tipos'

function Pantalla({
  titulo,
  detalle,
  boton,
}: {
  titulo: string
  detalle: string
  boton?: { texto: string; enlace: string }
}) {
  return (
    <div className="relative min-h-screen">
      <FondoCircuito />
      <header className="border-b border-blanco/8">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <a href="/" aria-label="Volver al inicio">
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
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-blanco">{titulo}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-bruma">{detalle}</p>
        {boton && (
          <a
            href={boton.enlace}
            className="mt-8 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco"
          >
            {boton.texto}
          </a>
        )}
      </main>
    </div>
  )
}

export function PaginaMiSolicitud() {
  const { token = '' } = useParams()
  const [solicitud, setSolicitud] = useState<SolicitudLanding | null>(null)
  const [fallo, setFallo] = useState<'no_encontrada' | 'error' | null>(null)

  useEffect(() => {
    let activo = true
    setSolicitud(null)
    setFallo(null)
    api
      .verSolicitud(token)
      .then((datos) => {
        if (activo) setSolicitud(datos)
      })
      .catch((e: Error & { status?: number }) => {
        if (!activo) return
        setFallo(e.status === 404 ? 'no_encontrada' : 'error')
      })
    return () => {
      activo = false
    }
  }, [token])

  if (fallo === 'no_encontrada') {
    return (
      <Pantalla
        titulo="No encontramos tu solicitud"
        detalle="No encontramos ninguna solicitud con ese enlace. Revisa que el enlace esté completo o escríbenos y te ayudamos a ubicarla."
        boton={{ texto: 'Hablar con nosotros', enlace: '/#contacto' }}
      />
    )
  }
  if (fallo === 'error') {
    return (
      <Pantalla
        titulo="No pudimos consultar tu solicitud"
        detalle="Tuvimos un problema al consultar tu solicitud. Intenta de nuevo en unos minutos; si el problema continúa, escríbenos."
      />
    )
  }
  if (!solicitud) {
    return <Pantalla titulo="Cargando tu solicitud…" detalle="" />
  }
  return <VistaSolicitud solicitud={solicitud} />
}
