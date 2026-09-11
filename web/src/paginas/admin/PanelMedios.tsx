import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { Aviso, Boton, entradaClase } from './ui'

interface Medio {
  nombre: string
  url: string
}

export function PanelMedios() {
  const [medios, setMedios] = useState<Medio[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const inputArchivo = useRef<HTMLInputElement>(null)

  const recargar = useCallback(async () => {
    try {
      setMedios(await api.medios.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al listar medios')
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function subir(archivo: File | undefined) {
    if (!archivo) return
    setSubiendo(true)
    setAviso('')
    setError('')
    try {
      await api.medios.subir(archivo)
      setAviso(`"${archivo.name}" subido. Copia la URL y pégala en el campo imagen.`)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setSubiendo(false)
      if (inputArchivo.current) inputArchivo.current.value = ''
    }
  }

  async function eliminar(nombre: string) {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return
    setError('')
    try {
      await api.medios.eliminar(nombre)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function copiar(url: string) {
    await navigator.clipboard.writeText(url)
    setAviso('URL copiada al portapapeles')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blanco">Medios (imágenes)</h1>
        <p className="mt-1 text-sm text-bruma">
          Sube imágenes para usarlas en las secciones. Máximo 10 MB (png, jpg,
          webp, gif, svg).
        </p>
      </div>

      <Aviso texto={aviso} />
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="tarjeta-vidrio flex flex-col items-center gap-4 rounded-2xl border-dashed p-8 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="font-semibold text-blanco">Arrastra o elige un archivo</p>
          <p className="mt-1 text-sm text-bruma">
            La imagen queda disponible en <span className="text-cian">/media/…</span>
          </p>
        </div>
        <input
          ref={inputArchivo}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.svg"
          className="hidden"
          onChange={(e) => void subir(e.target.files?.[0])}
        />
        <Boton
          variante="primario"
          disabled={subiendo}
          onClick={() => inputArchivo.current?.click()}
        >
          {subiendo ? 'Subiendo…' : 'Elegir archivo'}
        </Boton>
      </div>

      {medios.length === 0 ? (
        <p className="text-sm text-bruma">Todavía no hay medios subidos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {medios.map((medio) => (
            <li key={medio.nombre} className="tarjeta-vidrio overflow-hidden rounded-2xl">
              <img
                src={medio.url}
                alt={medio.nombre}
                className="h-36 w-full bg-abisal object-contain"
              />
              <div className="space-y-2 p-3">
                <p className="truncate text-xs text-bruma" title={medio.nombre}>
                  {medio.nombre}
                </p>
                <input
                  readOnly
                  value={medio.url}
                  onFocus={(e) => e.target.select()}
                  className={entradaClase}
                />
                <div className="flex gap-2">
                  <Boton
                    variante="secundario"
                    className="flex-1 px-2 text-xs"
                    onClick={() => void copiar(medio.url)}
                  >
                    Copiar URL
                  </Boton>
                  <Boton
                    variante="peligro"
                    className="px-2 text-xs"
                    onClick={() => void eliminar(medio.nombre)}
                  >
                    Eliminar
                  </Boton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
