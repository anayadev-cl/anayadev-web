import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { NombreConZia } from '../../lib/marca'
import type { Producto } from '../../lib/tipos'
import { Aviso, Boton, Campo, Switch, entradaClase } from './ui'

const ESTADOS = [
  { valor: 'activo', etiqueta: 'En producción' },
  { valor: 'en_desarrollo', etiqueta: 'En desarrollo' },
  { valor: 'proximamente', etiqueta: 'Próximamente' },
]

const VACIO: Omit<Producto, 'id'> = {
  slug: '',
  nombre: '',
  eslogan: '',
  descripcion: '',
  estado: 'proximamente',
  caracteristicas: [],
  imagen_url: null,
  url: null,
  orden: 0,
  visible: true,
}

export function PanelProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<Omit<Producto, 'id'>>(VACIO)
  const [caracteristicasTexto, setCaracteristicasTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const recargar = useCallback(async () => {
    try {
      setProductos(await api.productos.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al listar productos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  function abrirEdicion(producto: Producto | null) {
    setAviso('')
    setError('')
    if (producto) {
      setFormulario(JSON.parse(JSON.stringify(producto)))
      setCaracteristicasTexto(producto.caracteristicas.join('\n'))
      setEditando(producto.id)
    } else {
      setFormulario(JSON.parse(JSON.stringify(VACIO)))
      setCaracteristicasTexto('')
      setEditando(-1)
    }
  }

  async function guardar() {
    setAviso('')
    setError('')
    try {
      const cuerpo = {
        ...formulario,
        caracteristicas: caracteristicasTexto
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l !== ''),
      }
      if (editando !== null && editando !== -1) {
        await api.productos.actualizar(editando, cuerpo)
        setAviso('Producto guardado')
      } else {
        await api.productos.crear(cuerpo)
        setAviso('Producto creado')
      }
      setEditando(null)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function eliminar(producto: Producto) {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return
    setError('')
    try {
      await api.productos.eliminar(producto.id)
      setEditando(null)
      await recargar()
      setAviso('Producto eliminado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function alternarVisible(producto: Producto) {
    setError('')
    try {
      await api.productos.actualizar(producto.id, { ...producto, visible: !producto.visible })
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar visibilidad')
    }
  }

  async function cambiarEstado(producto: Producto, estado: Producto['estado']) {
    setError('')
    try {
      await api.productos.actualizar(producto.id, { ...producto, estado })
      await recargar()
      setAviso(`"${producto.nombre}" ahora está: ${estado}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar el estado')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blanco">Productos del catálogo</h1>
          <p className="mt-1 text-sm text-bruma">
            La familia anayadev: lo que está en producción y lo que viene.
          </p>
        </div>
        <Boton variante="primario" onClick={() => abrirEdicion(null)}>
          + Nuevo producto
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
              {editando === -1 ? 'Nuevo producto' : 'Editando producto'}
            </h2>
            <Boton variante="fantasma" onClick={() => setEditando(null)}>
              Cerrar ✕
            </Boton>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo etiqueta="Nombre">
              <input
                className={entradaClase}
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Slug (único)">
              <input
                className={entradaClase}
                value={formulario.slug}
                onChange={(e) => setFormulario({ ...formulario, slug: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Estado">
              <select
                className={entradaClase}
                value={formulario.estado}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    estado: e.target.value as Producto['estado'],
                  })
                }
              >
                {ESTADOS.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.etiqueta}
                  </option>
                ))}
              </select>
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

          <Campo etiqueta="Eslogan">
            <input
              className={entradaClase}
              value={formulario.eslogan}
              onChange={(e) => setFormulario({ ...formulario, eslogan: e.target.value })}
            />
          </Campo>

          <Campo etiqueta="Descripción">
            <textarea
              className={`${entradaClase} min-h-24 resize-y`}
              value={formulario.descripcion}
              onChange={(e) =>
                setFormulario({ ...formulario, descripcion: e.target.value })
              }
            />
          </Campo>

          <Campo etiqueta="Características (una por línea)">
            <textarea
              className={`${entradaClase} min-h-24 resize-y`}
              value={caracteristicasTexto}
              onChange={(e) => setCaracteristicasTexto(e.target.value)}
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

          <Campo etiqueta="Enlace (solo productos activos)">
            <input
              className={entradaClase}
              placeholder="https://…"
              value={formulario.url ?? ''}
              onChange={(e) =>
                setFormulario({ ...formulario, url: e.target.value || null })
              }
            />
          </Campo>

          <div className="flex items-center justify-between gap-3 border-t border-blanco/8 pt-4">
            <div className="flex items-center gap-3">
              <Switch
                activo={formulario.visible}
                alCambiar={(valor) => setFormulario({ ...formulario, visible: valor })}
                etiqueta="Visible"
              />
              <span className="text-sm text-bruma">Visible en el catálogo</span>
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
        <p className="text-sm text-bruma">Cargando productos…</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productos.map((producto) => (
            <li
              key={producto.id}
              className={`tarjeta-vidrio flex flex-col gap-3 rounded-2xl p-5 ${
                !producto.visible ? 'opacity-55' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-blanco">
                    <NombreConZia nombre={producto.nombre} />
                  </p>
                  <p className="truncate text-sm text-bruma">{producto.eslogan}</p>
                </div>
                <select
                  value={producto.estado}
                  onChange={(e) => void cambiarEstado(producto, e.target.value as Producto['estado'])}
                  aria-label={`Estado de ${producto.nombre}`}
                  className="shrink-0 rounded-md border border-cian/25 bg-abisal px-2 py-1 text-[11px] font-semibold text-cian outline-none"
                >
                  <option value="activo">En producción</option>
                  <option value="en_desarrollo">En desarrollo</option>
                  <option value="proximamente">Próximamente</option>
                </select>
              </div>
              <p className="line-clamp-2 text-sm text-bruma">{producto.descripcion}</p>
              <div className="flex items-center justify-between gap-2 border-t border-blanco/8 pt-3">
                <div className="flex items-center gap-3">
                  <Switch
                    activo={producto.visible}
                    alCambiar={() => alternarVisible(producto)}
                    etiqueta={`Visibilidad de ${producto.nombre}`}
                  />
                  <Boton variante="secundario" onClick={() => abrirEdicion(producto)}>
                    Editar
                  </Boton>
                </div>
                <Boton variante="peligro" onClick={() => eliminar(producto)}>
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
