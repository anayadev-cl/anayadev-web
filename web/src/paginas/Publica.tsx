import { useEffect, useState } from 'react'
import { FondoCircuito } from '../componentes/FondoCircuito'
import { Navegacion } from '../componentes/Navegacion'
import { PiePagina } from '../componentes/PiePagina'
import { RenderizadorSecciones } from '../componentes/secciones/RenderizadorSecciones'
import { api } from '../lib/api'
import type { ContenidoPublico } from '../lib/tipos'

export function Publica() {
  const [contenido, setContenido] = useState<ContenidoPublico | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    api
      .contenidoPublico()
      .then((datos) => {
        if (activo) setContenido(datos)
      })
      .catch((e: Error) => {
        if (activo) setError(e.message)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="min-h-screen">
      <FondoCircuito />
      <Navegacion secciones={contenido?.secciones ?? []} />
      <main>
        {error && (
          <div className="mx-auto max-w-3xl px-4 pt-32 text-center">
            <p className="tarjeta-vidrio rounded-2xl p-6 text-bruma">
              No pudimos cargar el contenido ({error}). Verifica que la API esté
              corriendo en el puerto 8100.
            </p>
          </div>
        )}
        {contenido?.secciones.map((seccion) => (
          <RenderizadorSecciones key={seccion.id} seccion={seccion} contenido={contenido} />
        ))}
      </main>
      <PiePagina contenido={contenido} />
    </div>
  )
}
