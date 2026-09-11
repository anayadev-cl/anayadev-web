import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Seccion } from '../../lib/tipos'
import { Aviso, Boton, Campo, Switch, entradaClase } from './ui'

const TIPOS = ['hero', 'circuito', 'productos', 'proceso', 'contacto', 'texto']

const VACIA: Omit<Seccion, 'id'> = {
  slug: null,
  tipo: 'texto',
  titulo: '',
  subtitulo: '',
  texto: '',
  imagen_url: null,
  datos: {},
  orden: 0,
  visible: true,
}

interface Formulario extends Omit<Seccion, 'id'> {}

function SeccionVacia(): Formulario {
  return JSON.parse(JSON.stringify(VACIA))
}

function EditorItems({
  items,
  alCambiar,
}: {
  items: { titulo: string; texto: string }[]
  alCambiar: (items: { titulo: string; texto: string }[]) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-blanco/8 p-3 sm:flex-row">
          <input
            className={entradaClase}
            placeholder="Título"
            value={item.titulo}
            onChange={(e) => {
              const copia = [...items]
              copia[i] = { ...copia[i], titulo: e.target.value }
              alCambiar(copia)
            }}
          />
          <input
            className={`${entradaClase} sm:flex-1`}
            placeholder="Texto"
            value={item.texto}
            onChange={(e) => {
              const copia = [...items]
              copia[i] = { ...copia[i], texto: e.target.value }
              alCambiar(copia)
            }}
          />
          <Boton
            variante="peligro"
            className="shrink-0"
            onClick={() => alCambiar(items.filter((_, j) => j !== i))}
          >
            Quitar
          </Boton>
        </div>
      ))}
      <Boton
        variante="secundario"
        onClick={() => alCambiar([...items, { titulo: '', texto: '' }])}
      >
        + Agregar ítem
      </Boton>
    </div>
  )
}

function EditorBotones({
  botones,
  alCambiar,
}: {
  botones: { texto: string; enlace: string; estilo: string }[]
  alCambiar: (botones: { texto: string; enlace: string; estilo: string }[]) => void
}) {
  return (
    <div className="space-y-2">
      {botones.map((boton, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-blanco/8 p-3 sm:flex-row">
          <input
            className={entradaClase}
            placeholder="Texto del botón"
            value={boton.texto}
            onChange={(e) => {
              const copia = [...botones]
              copia[i] = { ...copia[i], texto: e.target.value }
              alCambiar(copia)
            }}
          />
          <input
            className={entradaClase}
            placeholder="Enlace (#contacto o URL)"
            value={boton.enlace}
            onChange={(e) => {
              const copia = [...botones]
              copia[i] = { ...copia[i], enlace: e.target.value }
              alCambiar(copia)
            }}
          />
          <select
            className={`${entradaClase} sm:w-36`}
            value={boton.estilo}
            onChange={(e) => {
              const copia = [...botones]
              copia[i] = { ...copia[i], estilo: e.target.value }
              alCambiar(copia)
            }}
          >
            <option value="primario">Primario</option>
            <option value="secundario">Secundario</option>
          </select>
          <Boton
            variante="peligro"
            className="shrink-0"
            onClick={() => alCambiar(botones.filter((_, j) => j !== i))}
          >
            Quitar
          </Boton>
        </div>
      ))}
      <Boton
        variante="secundario"
        onClick={() => alCambiar([...botones, { texto: '', enlace: '', estilo: 'primario' }])}
      >
        + Agregar botón
      </Boton>
    </div>
  )
}

export function PanelSecciones() {
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(SeccionVacia())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const recargar = useCallback(async () => {
    try {
      setSecciones(await api.secciones.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al listar secciones')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  function abrirEdicion(seccion: Seccion | null) {
    setAviso('')
    setError('')
    setFormulario(seccion ? JSON.parse(JSON.stringify(seccion)) : SeccionVacia())
    setEditando(seccion ? seccion.id : -1)
  }

  async function guardar() {
    setAviso('')
    setError('')
    try {
      const cuerpo = { ...formulario }
      if (editando !== null && editando !== -1) {
        await api.secciones.actualizar(editando, cuerpo)
        setAviso('Sección guardada')
      } else {
        await api.secciones.crear(cuerpo)
        setAviso('Sección creada')
      }
      setEditando(null)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function eliminar(seccion: Seccion) {
    if (!window.confirm(`¿Eliminar la sección "${seccion.titulo || seccion.slug || seccion.tipo}"?`)) return
    setError('')
    try {
      await api.secciones.eliminar(seccion.id)
      setEditando(null)
      await recargar()
      setAviso('Sección eliminada')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function mover(seccion: Seccion, direccion: -1 | 1) {
    const i = secciones.findIndex((s) => s.id === seccion.id)
    const destino = secciones[i + direccion]
    if (!destino) return
    setError('')
    try {
      await api.secciones.actualizar(seccion.id, { ...seccion, orden: destino.orden })
      await api.secciones.actualizar(destino.id, { ...destino, orden: seccion.orden })
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reordenar')
    }
  }

  async function alternarVisible(seccion: Seccion) {
    setError('')
    try {
      await api.secciones.actualizar(seccion.id, { ...seccion, visible: !seccion.visible })
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar visibilidad')
    }
  }

  const datos = formulario.datos as Record<string, unknown>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blanco">Secciones del sitio</h1>
          <p className="mt-1 text-sm text-bruma">
            Bloques que se muestran en la página principal, en orden.
          </p>
        </div>
        <Boton variante="primario" onClick={() => abrirEdicion(null)}>
          + Nueva sección
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
              {editando === -1 ? 'Nueva sección' : `Editando sección #${editando}`}
            </h2>
            <Boton variante="fantasma" onClick={() => setEditando(null)}>
              Cerrar ✕
            </Boton>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo etiqueta="Tipo">
              <select
                className={entradaClase}
                value={formulario.tipo}
                onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Slug (ancla, opcional)">
              <input
                className={entradaClase}
                placeholder="mi-seccion"
                value={formulario.slug ?? ''}
                onChange={(e) =>
                  setFormulario({ ...formulario, slug: e.target.value || null })
                }
              />
            </Campo>
            <Campo etiqueta="Orden">
              <input
                type="number"
                className={entradaClase}
                value={formulario.orden}
                onChange={(e) =>
                  setFormulario({ ...formulario, orden: Number(e.target.value) || 0 })
                }
              />
            </Campo>
          </div>

          <Campo etiqueta="Título">
            <input
              className={entradaClase}
              value={formulario.titulo}
              onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
            />
          </Campo>

          <Campo etiqueta="Subtítulo">
            <textarea
              className={`${entradaClase} min-h-20 resize-y`}
              value={formulario.subtitulo}
              onChange={(e) => setFormulario({ ...formulario, subtitulo: e.target.value })}
            />
          </Campo>

          <Campo etiqueta="Texto (para secciones de tipo texto)">
            <textarea
              className={`${entradaClase} min-h-28 resize-y`}
              value={formulario.texto}
              onChange={(e) => setFormulario({ ...formulario, texto: e.target.value })}
            />
          </Campo>

          <Campo etiqueta="Imagen (URL o /media/…)">
            <input
              className={entradaClase}
              placeholder="/media/abc123.png o https://…"
              value={formulario.imagen_url ?? ''}
              onChange={(e) =>
                setFormulario({ ...formulario, imagen_url: e.target.value || null })
              }
            />
          </Campo>

          {formulario.tipo === 'hero' && (
            <>
              <Campo etiqueta="Badge (etiqueta superior)">
                <input
                  className={entradaClase}
                  value={(datos.badge as string) ?? ''}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      datos: { ...datos, badge: e.target.value },
                    })
                  }
                />
              </Campo>
              <Campo etiqueta="Botones">
                <EditorBotones
                  botones={(datos.botones as { texto: string; enlace: string; estilo: string }[]) ?? []}
                  alCambiar={(botones) =>
                    setFormulario({ ...formulario, datos: { ...datos, botones } })
                  }
                />
              </Campo>
              <Campo etiqueta="Resumen (un ítem por línea)">
                <textarea
                  className={`${entradaClase} min-h-20 resize-y`}
                  value={((datos.resumen as string[]) ?? []).join('\n')}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      datos: {
                        ...datos,
                        resumen: e.target.value.split('\n').filter((l) => l.trim() !== ''),
                      },
                    })
                  }
                />
              </Campo>
            </>
          )}

          {(formulario.tipo === 'circuito' || formulario.tipo === 'proceso') && (
            <Campo etiqueta="Ítems">
              <EditorItems
                items={(datos.items as { titulo: string; texto: string }[]) ?? []}
                alCambiar={(items) =>
                  setFormulario({ ...formulario, datos: { ...datos, items } })
                }
              />
            </Campo>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-blanco/8 pt-4">
            <div className="flex items-center gap-3">
              <Switch
                activo={formulario.visible}
                alCambiar={(valor) => setFormulario({ ...formulario, visible: valor })}
                etiqueta="Visible"
              />
              <span className="text-sm text-bruma">Visible en el sitio</span>
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
        <p className="text-sm text-bruma">Cargando secciones…</p>
      ) : (
        <ul className="space-y-3">
          {secciones.map((seccion, i) => (
            <li
              key={seccion.id}
              className={`tarjeta-vidrio flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center ${
                !seccion.visible ? 'opacity-55' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-cian/25 bg-cian/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cian">
                    {seccion.tipo}
                  </span>
                  {!seccion.visible && (
                    <span className="rounded-md border border-bruma/25 bg-bruma/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-bruma">
                      oculta
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate font-semibold text-blanco">
                  {seccion.titulo || seccion.slug || 'Sin título'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Boton
                  variante="secundario"
                  className="px-2.5"
                  disabled={i === 0}
                  onClick={() => mover(seccion, -1)}
                  aria-label="Subir"
                >
                  ↑
                </Boton>
                <Boton
                  variante="secundario"
                  className="px-2.5"
                  disabled={i === secciones.length - 1}
                  onClick={() => mover(seccion, 1)}
                  aria-label="Bajar"
                >
                  ↓
                </Boton>
                <Switch
                  activo={seccion.visible}
                  alCambiar={() => alternarVisible(seccion)}
                  etiqueta={`Visibilidad de ${seccion.titulo}`}
                />
                <Boton variante="secundario" onClick={() => abrirEdicion(seccion)}>
                  Editar
                </Boton>
                <Boton variante="peligro" onClick={() => eliminar(seccion)}>
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
