import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { MetodoPagoAdmin } from '../../lib/tipos'
import { Aviso, Boton, Campo, Switch, entradaClase } from './ui'

const ETIQUETAS_TIPO: Record<MetodoPagoAdmin['tipo'], string> = {
  transferencia: 'Transferencia',
  paypal: 'PayPal',
  otro: 'Otro',
}

export function ListaMetodosPago({
  metodos,
  alEditar,
  alEliminar,
  alAlternar,
}: {
  metodos: MetodoPagoAdmin[]
  alEditar?: (metodo: MetodoPagoAdmin) => void
  alEliminar?: (metodo: MetodoPagoAdmin) => void
  alAlternar?: (metodo: MetodoPagoAdmin, valor: boolean) => void
}) {
  if (metodos.length === 0) {
    return (
      <p className="tarjeta-vidrio rounded-2xl p-8 text-center text-sm text-bruma">
        Todavía no hay métodos de pago. Agrega el primero para que los
        clientes sepan cómo pagar.
      </p>
    )
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metodos.map((metodo) => (
        <li
          key={metodo.id}
          className={`tarjeta-vidrio rounded-2xl p-4 ${!metodo.activo ? 'opacity-55' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-blanco">{metodo.nombre}</p>
              <span className="mt-1 inline-block rounded-full border border-cian/30 bg-cian/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cian">
                {ETIQUETAS_TIPO[metodo.tipo] ?? metodo.tipo}
              </span>
            </div>
            <p className="text-xs text-bruma/60">orden {metodo.orden}</p>
          </div>
          <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg bg-abisal/70 p-2.5 text-xs leading-relaxed text-bruma">
            {metodo.instrucciones_publicas || '(sin instrucciones)'}
          </pre>
          {metodo.datos_privados && (
            <p className="mt-2 text-[11px] text-violeta">Tiene datos privados (no se publican)</p>
          )}
          {(alAlternar || alEditar || alEliminar) && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-blanco/8 pt-3">
              <div className="flex items-center gap-3">
                {alAlternar && (
                  <Switch
                    activo={metodo.activo}
                    alCambiar={(valor) => alAlternar(metodo, valor)}
                    etiqueta={`Activar ${metodo.nombre}`}
                  />
                )}
                {alEditar && (
                  <Boton variante="secundario" onClick={() => alEditar(metodo)}>
                    Editar
                  </Boton>
                )}
              </div>
              {alEliminar && (
                <Boton variante="peligro" onClick={() => alEliminar(metodo)}>
                  Eliminar
                </Boton>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function PanelPagos() {
  const [metodos, setMetodos] = useState<MetodoPagoAdmin[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<Omit<MetodoPagoAdmin, 'id'>>({
    tipo: 'transferencia',
    nombre: '',
    instrucciones_publicas: '',
    datos_privados: null,
    activo: true,
    orden: 0,
  })
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    try {
      setMetodos(await api.pagosAdmin.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los métodos de pago')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function guardar() {
    setError('')
    setAviso('')
    try {
      if (editando !== null && editando !== -1) {
        await api.pagosAdmin.actualizar(editando, formulario)
      } else {
        await api.pagosAdmin.crear(formulario)
      }
      setEditando(null)
      await recargar()
      setAviso('Método de pago guardado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el método de pago')
    }
  }

  async function eliminar(metodo: MetodoPagoAdmin) {
    if (!window.confirm(`¿Eliminar el método "${metodo.nombre}"?`)) return
    try {
      await api.pagosAdmin.eliminar(metodo.id)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blanco">Métodos de pago</h1>
          <p className="mt-1 max-w-2xl text-sm text-bruma">
            Lo que el cliente ve en su solicitud aprobada para pagar. Las
            instrucciones son texto libre (banco, cuenta, titular, RUT, o
            link/correo de PayPal) y es lo ÚNICO que se publica. Los datos
            privados (credenciales futuras de API) nunca salen del panel.
          </p>
        </div>
        <Boton
          variante="primario"
          onClick={() => {
            setFormulario({
              tipo: 'transferencia',
              nombre: '',
              instrucciones_publicas: '',
              datos_privados: null,
              activo: true,
              orden: metodos.length,
            })
            setEditando(-1)
          }}
        >
          + Método de pago
        </Boton>
      </div>

      <Aviso texto={aviso} />
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      {editando !== null && (
        <div className="anillo-gradiente space-y-4 rounded-2xl p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Tipo">
              <select
                className={entradaClase}
                value={formulario.tipo}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    tipo: e.target.value as MetodoPagoAdmin['tipo'],
                  })
                }
              >
                <option value="transferencia">Transferencia</option>
                <option value="paypal">PayPal</option>
                <option value="otro">Otro</option>
              </select>
            </Campo>
            <Campo etiqueta="Nombre visible">
              <input
                className={entradaClase}
                placeholder="Ej. Transferencia bancaria"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              />
            </Campo>
          </div>
          <Campo etiqueta="Instrucciones públicas (lo que ve el cliente)">
            <textarea
              className={`${entradaClase} min-h-28`}
              placeholder={'Banco: …\nTitular: …\nRUT: …\nCuenta: …'}
              value={formulario.instrucciones_publicas}
              onChange={(e) =>
                setFormulario({ ...formulario, instrucciones_publicas: e.target.value })
              }
            />
          </Campo>
          <Campo etiqueta="Datos privados (nunca se publican — credenciales futuras)">
            <textarea
              className={`${entradaClase} min-h-16`}
              placeholder="Opcional: claves de API, tokens…"
              value={formulario.datos_privados ?? ''}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  datos_privados: e.target.value || null,
                })
              }
            />
          </Campo>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Campo etiqueta="Orden">
                <input
                  type="number"
                  className={`${entradaClase} w-24`}
                  value={formulario.orden}
                  onChange={(e) =>
                    setFormulario({ ...formulario, orden: Number(e.target.value) || 0 })
                  }
                />
              </Campo>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  activo={formulario.activo}
                  alCambiar={(valor) => setFormulario({ ...formulario, activo: valor })}
                  etiqueta="Activo"
                />
                <span className="text-sm text-bruma">Activo</span>
              </div>
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
        <p className="text-sm text-bruma">Cargando…</p>
      ) : (
        <ListaMetodosPago
          metodos={metodos}
          alEditar={(metodo) => {
            setFormulario(JSON.parse(JSON.stringify(metodo)))
            setEditando(metodo.id)
          }}
          alEliminar={eliminar}
          alAlternar={async (metodo, valor) => {
            await api.pagosAdmin.actualizar(metodo.id, { ...metodo, activo: valor })
            await recargar()
          }}
        />
      )}
    </div>
  )
}
