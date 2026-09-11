import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { ReglaChatbot } from '../../lib/tipos'
import { Aviso, Boton, Campo, Switch, entradaClase } from './ui'

const VACIA: Omit<ReglaChatbot, 'id'> = {
  palabras_clave: '',
  respuesta: '',
  sugerencias: [],
  orden: 0,
  activo: true,
}

export function PanelChatbot() {
  const [reglas, setReglas] = useState<ReglaChatbot[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<Omit<ReglaChatbot, 'id'>>(VACIA)
  const [sugerenciasTexto, setSugerenciasTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const recargar = useCallback(async () => {
    try {
      setReglas(await api.chatbotAdmin.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al listar reglas')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  function abrirEdicion(regla: ReglaChatbot | null) {
    setAviso('')
    setError('')
    if (regla) {
      setFormulario(JSON.parse(JSON.stringify(regla)))
      setSugerenciasTexto(regla.sugerencias.join('\n'))
      setEditando(regla.id)
    } else {
      setFormulario(JSON.parse(JSON.stringify(VACIA)))
      setSugerenciasTexto('')
      setEditando(-1)
    }
  }

  async function guardar() {
    setAviso('')
    setError('')
    try {
      const cuerpo = {
        ...formulario,
        sugerencias: sugerenciasTexto
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s !== ''),
      }
      if (editando !== null && editando !== -1) {
        await api.chatbotAdmin.actualizar(editando, cuerpo)
        setAviso('Regla guardada')
      } else {
        await api.chatbotAdmin.crear(cuerpo)
        setAviso('Regla creada')
      }
      setEditando(null)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function eliminar(regla: ReglaChatbot) {
    if (!window.confirm('¿Eliminar esta regla del chatbot?')) return
    setError('')
    try {
      await api.chatbotAdmin.eliminar(regla.id)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function alternarActivo(regla: ReglaChatbot) {
    setError('')
    try {
      await api.chatbotAdmin.actualizar(regla.id, { ...regla, activo: !regla.activo })
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blanco">Chatbot</h1>
          <p className="mt-1 text-sm text-bruma">
            Reglas de respuesta del asistente: si el mensaje contiene alguna
            palabra clave, responde con el texto asociado. La respuesta por
            defecto se edita en Ajustes.
          </p>
        </div>
        <Boton variante="primario" onClick={() => abrirEdicion(null)}>
          + Nueva regla
        </Boton>
      </div>

      <Aviso texto={aviso} />
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      {editando !== null && (
        <div className="anillo-gradiente space-y-5 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blanco">
              {editando === -1 ? 'Nueva regla' : 'Editando regla'}
            </h2>
            <Boton variante="fantasma" onClick={() => setEditando(null)}>
              Cerrar ✕
            </Boton>
          </div>

          <Campo etiqueta="Palabras clave (separadas por coma)">
            <textarea
              className={`${entradaClase} min-h-20 resize-y`}
              placeholder="hola, buenas, saludos"
              value={formulario.palabras_clave}
              onChange={(e) =>
                setFormulario({ ...formulario, palabras_clave: e.target.value })
              }
            />
          </Campo>

          <Campo etiqueta="Respuesta">
            <textarea
              className={`${entradaClase} min-h-28 resize-y`}
              value={formulario.respuesta}
              onChange={(e) =>
                setFormulario({ ...formulario, respuesta: e.target.value })
              }
            />
          </Campo>

          <Campo etiqueta="Sugerencias (botones rápidos, una por línea)">
            <textarea
              className={`${entradaClase} min-h-20 resize-y`}
              value={sugerenciasTexto}
              onChange={(e) => setSugerenciasTexto(e.target.value)}
            />
          </Campo>

          <div className="flex items-center justify-between gap-3 border-t border-blanco/8 pt-4">
            <div className="flex items-center gap-3">
              <Switch
                activo={formulario.activo}
                alCambiar={(valor) => setFormulario({ ...formulario, activo: valor })}
                etiqueta="Activa"
              />
              <span className="text-sm text-bruma">Regla activa</span>
            </div>
            <div className="flex gap-2">
              <Boton variante="secundario" onClick={() => setEditando(null)}>
                Cancelar
              </Boton>
              <Boton variante="primario" onClick={guardar}>
                Guardar
              </Boton>
            </div>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-bruma">Cargando reglas…</p>
      ) : (
        <ul className="space-y-3">
          {reglas.map((regla) => (
            <li
              key={regla.id}
              className={`tarjeta-vidrio rounded-2xl p-5 ${!regla.activo ? 'opacity-55' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {regla.palabras_clave.split(',').slice(0, 5).map((clave) => (
                  <span
                    key={clave}
                    className="rounded-md border border-cian/25 bg-cian/5 px-2 py-0.5 text-[11px] font-medium text-cian"
                  >
                    {clave.trim()}
                  </span>
                ))}
                {!regla.activo && (
                  <span className="rounded-md border border-bruma/25 bg-bruma/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-bruma">
                    inactiva
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-bruma">
                {regla.respuesta}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-blanco/8 pt-3">
                <div className="flex items-center gap-3">
                  <Switch
                    activo={regla.activo}
                    alCambiar={() => alternarActivo(regla)}
                    etiqueta={`Activar regla ${regla.id}`}
                  />
                  <Boton variante="secundario" onClick={() => abrirEdicion(regla)}>
                    Editar
                  </Boton>
                </div>
                <Boton variante="peligro" onClick={() => eliminar(regla)}>
                  Eliminar
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
