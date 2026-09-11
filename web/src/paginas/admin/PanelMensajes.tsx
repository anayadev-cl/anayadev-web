import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { MensajeContacto } from '../../lib/tipos'
import { Aviso, Boton } from './ui'

function FechaRelativa(valor: string) {
  const fecha = new Date(valor)
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
}

interface PanelMensajesProps {
  alCambiarNoLeidos: (cantidad: number) => void
}

export function PanelMensajes({ alCambiarNoLeidos }: PanelMensajesProps) {
  const [mensajes, setMensajes] = useState<MensajeContacto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const recargar = useCallback(async () => {
    try {
      const lista = await api.mensajes.listar()
      setMensajes(lista)
      alCambiarNoLeidos(lista.filter((m) => !m.leido).length)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al listar mensajes')
    } finally {
      setCargando(false)
    }
  }, [alCambiarNoLeidos])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function alternarLeido(mensaje: MensajeContacto) {
    setError('')
    try {
      await api.mensajes.marcarLeido(mensaje.id, !mensaje.leido)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar')
    }
  }

  async function eliminar(mensaje: MensajeContacto) {
    if (!window.confirm(`¿Eliminar el mensaje de "${mensaje.nombre}"?`)) return
    setError('')
    setAviso('')
    try {
      await api.mensajes.eliminar(mensaje.id)
      await recargar()
      setAviso('Mensaje eliminado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blanco">Mensajes del formulario</h1>
        <p className="mt-1 text-sm text-bruma">
          Todo lo que llega desde el formulario de contacto. Además queda
          enviado por correo según la configuración SMTP.
        </p>
      </div>

      <Aviso texto={aviso} />
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-bruma">Cargando mensajes…</p>
      ) : mensajes.length === 0 ? (
        <p className="tarjeta-vidrio rounded-2xl p-8 text-center text-sm text-bruma">
          Todavía no llegan mensajes. Cuando alguien use el formulario del
          sitio, aparecerán aquí.
        </p>
      ) : (
        <ul className="space-y-3">
          {mensajes.map((mensaje) => (
            <li
              key={mensaje.id}
              className={`tarjeta-vidrio rounded-2xl p-5 ${
                !mensaje.leido ? 'border-cian/30 shadow-[0_0_28px_-16px_rgba(0,223,240,0.4)]' : ''
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-blanco">{mensaje.nombre}</p>
                    {!mensaje.leido && (
                      <span className="rounded-full border border-cian/40 bg-cian/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cian">
                        nuevo
                      </span>
                    )}
                  </div>
                  <a
                    href={`mailto:${mensaje.correo}`}
                    className="mt-0.5 block truncate text-sm text-cian hover:text-turquesa"
                  >
                    {mensaje.correo}
                  </a>
                </div>
                <p className="shrink-0 text-xs text-bruma/70">
                  {FechaRelativa(mensaje.creado_en)}
                </p>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-xl bg-abisal/60 p-4 text-sm leading-relaxed text-bruma">
                {mensaje.mensaje}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-blanco/8 pt-3">
                <a
                  href={`mailto:${mensaje.correo}?subject=Re: tu mensaje a anayadev`}
                  className="text-sm font-semibold text-cian transition-colors hover:text-turquesa"
                >
                  Responder por correo ↗
                </a>
                <div className="flex gap-2">
                  <Boton
                    variante="secundario"
                    onClick={() => void alternarLeido(mensaje)}
                  >
                    {mensaje.leido ? 'Marcar no leído' : 'Marcar leído'}
                  </Boton>
                  <Boton variante="peligro" onClick={() => void eliminar(mensaje)}>
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
