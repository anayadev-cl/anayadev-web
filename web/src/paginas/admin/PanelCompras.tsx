import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Compra, ModuloCheckout, NecesidadCheckout, RubroCheckout } from '../../lib/tipos'
import { Aviso, Boton, Campo, Switch, entradaClase } from './ui'

const ESTADOS_COMPRA: Record<Compra['estado'], { etiqueta: string; clase: string }> = {
  pendiente_pago: { etiqueta: 'Pendiente de pago', clase: 'border-bruma/30 bg-bruma/10 text-bruma' },
  pagada: { etiqueta: 'Pagada (activación manual)', clase: 'border-electrica/40 bg-electrica/10 text-electrica' },
  enviada: { etiqueta: 'Enviada a Calenzia', clase: 'border-turquesa/40 bg-turquesa/10 text-turquesa' },
  error_webhook: { etiqueta: 'Error en webhook', clase: 'border-red-400/40 bg-red-500/10 text-red-300' },
}

function formatearCLP(valor: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor)
}

export function PanelCompras() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [modulos, setModulos] = useState<ModuloCheckout[]>([])
  const [rubros, setRubros] = useState<RubroCheckout[]>([])
  const [necesidades, setNecesidades] = useState<NecesidadCheckout[]>([])
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(true)

  const [necesidadEditando, setNecesidadEditando] = useState<number | null>(null)
  const [necesidadForm, setNecesidadForm] = useState<Omit<NecesidadCheckout, 'id'>>({
    codigo: '',
    etiqueta: '',
    ayuda: '',
    modulos: [],
    activo: true,
    orden: 0,
  })

  const [moduloEditando, setModuloEditando] = useState<number | null>(null)
  const [moduloForm, setModuloForm] = useState<Omit<ModuloCheckout, 'id'>>({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio_mensual_clp: 0,
    limite_estandar: null,
    activo: true,
    orden: 0,
  })

  const [rubroEditando, setRubroEditando] = useState<number | null>(null)
  const [rubroForm, setRubroForm] = useState<Omit<RubroCheckout, 'id'>>({
    codigo: '',
    nombre: '',
    activo: true,
    orden: 0,
  })

  const recargar = useCallback(async () => {
    try {
      const [listaCompras, listaModulos, listaRubros, listaNecesidades] = await Promise.all([
        api.comprasAdmin.listar(),
        api.modulosCheckout.listar(),
        api.rubrosCheckout.listar(),
        api.necesidadesCheckout.listar(),
      ])
      setCompras(listaCompras)
      setModulos(listaModulos)
      setRubros(listaRubros)
      setNecesidades(listaNecesidades)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar compras')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function reenviar(compra: Compra) {
    setError('')
    setAviso('')
    try {
      const actualizada = await api.comprasAdmin.reenviar(compra.id)
      setAviso(
        actualizada.estado === 'enviada'
          ? 'Compra reenviada a Calenzia correctamente.'
          : 'El webhook respondió con error. Revisa la URL/secreto en Ajustes.',
      )
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reenviar')
    }
  }

  async function eliminarCompra(compra: Compra) {
    if (!window.confirm(`¿Eliminar la compra ${compra.codigo}?`)) return
    try {
      await api.comprasAdmin.eliminar(compra.id)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function guardarModulo() {
    setError('')
    setAviso('')
    try {
      if (moduloEditando !== null && moduloEditando !== -1) {
        await api.modulosCheckout.actualizar(moduloEditando, moduloForm)
      } else {
        await api.modulosCheckout.crear(moduloForm)
      }
      setModuloEditando(null)
      await recargar()
      setAviso('Módulo guardado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar módulo')
    }
  }

  async function eliminarModulo(modulo: ModuloCheckout) {
    if (!window.confirm(`¿Eliminar el módulo "${modulo.nombre}"?`)) return
    try {
      await api.modulosCheckout.eliminar(modulo.id)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function guardarRubro() {
    setError('')
    setAviso('')
    try {
      if (rubroEditando !== null && rubroEditando !== -1) {
        await api.rubrosCheckout.actualizar(rubroEditando, rubroForm)
      } else {
        await api.rubrosCheckout.crear(rubroForm)
      }
      setRubroEditando(null)
      await recargar()
      setAviso('Rubro guardado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar rubro')
    }
  }

  async function eliminarRubro(rubro: RubroCheckout) {
    if (!window.confirm(`¿Eliminar el rubro "${rubro.nombre}"?`)) return
    try {
      await api.rubrosCheckout.eliminar(rubro.id)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function guardarNecesidad() {
    setError('')
    setAviso('')
    try {
      if (necesidadEditando !== null && necesidadEditando !== -1) {
        await api.necesidadesCheckout.actualizar(necesidadEditando, necesidadForm)
      } else {
        await api.necesidadesCheckout.crear(necesidadForm)
      }
      setNecesidadEditando(null)
      await recargar()
      setAviso('Necesidad guardada')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar necesidad')
    }
  }

  async function eliminarNecesidad(necesidad: NecesidadCheckout) {
    if (!window.confirm(`¿Eliminar la necesidad "${necesidad.codigo}"?`)) return
    try {
      await api.necesidadesCheckout.eliminar(necesidad.id)
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blanco">Compras de Calenzia</h1>
          <p className="mt-1 text-sm text-bruma">
            Solicitudes del checkout. Al enviar, la solicitud se registra en
            Calenzia como tenant en estado <span className="text-cian">demo</span> y
            se activa desde el superadmin cuando la revisas (sin pasarela de
            pago aún). Configura la URL y el secreto del webhook en Ajustes.
          </p>
        </div>

        <Aviso texto={aviso} />
        {error && (
          <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}

        {cargando ? (
          <p className="text-sm text-bruma">Cargando…</p>
        ) : compras.length === 0 ? (
          <p className="tarjeta-vidrio rounded-2xl p-8 text-center text-sm text-bruma">
            Todavía no hay compras. Cuando alguien complete el checkout,
            aparecerán aquí.
          </p>
        ) : (
          <ul className="space-y-4">
            {compras.map((compra) => {
              const estado = ESTADOS_COMPRA[compra.estado] ?? ESTADOS_COMPRA.pendiente_pago
              return (
                <li key={compra.id} className="tarjeta-vidrio rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-blanco">
                        {compra.datos.nombre_empresa}
                      </p>
                      <span className="text-xs text-bruma/70">
                        {compra.codigo.toUpperCase()}
                      </span>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${estado.clase}`}>
                      {estado.etiqueta}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-bruma sm:grid-cols-2">
                    <p>
                      Página: <span className="text-cian">agenda.anayadev.cl/{compra.datos.slug}</span>
                    </p>
                    <p>
                      Rubro: <span className="text-blanco">{compra.datos.rubro_nombre}</span>
                    </p>
                    <p>
                      Admin: <span className="text-blanco">{compra.datos.admin_nombre} · {compra.datos.admin_correo}</span>
                    </p>
                    <p>
                      Total: <span className="text-blanco">{compra.datos.total_monto ?? formatearCLP(compra.total_clp)}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {compra.modulos.map((modulo) => (
                      <span
                        key={modulo.modulo_codigo}
                        className="rounded-md border border-cian/25 bg-cian/5 px-2 py-0.5 text-[11px] font-medium text-cian"
                      >
                        {modulo.nombre}
                        {modulo.limite_mensual != null && ` · límite ${modulo.limite_mensual}`}
                      </span>
                    ))}
                  </div>

                  {compra.respuesta_webhook && compra.estado === 'error_webhook' && (
                    <p className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-abisal/70 p-3 text-xs text-red-300">
                      {compra.respuesta_webhook}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-blanco/8 pt-3">
                    <span className="text-xs text-bruma/60">
                      {new Date(compra.creado_en).toLocaleString('es-CL')}
                    </span>
                    <div className="flex gap-2">
                      <Boton variante="secundario" onClick={() => reenviar(compra)}>
                        Reenviar a Calenzia
                      </Boton>
                      <Boton variante="peligro" onClick={() => eliminarCompra(compra)}>
                        Eliminar
                      </Boton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-blanco">Módulos del checkout</h2>
            <p className="mt-1 text-sm text-bruma">
              Lo que el comprador puede elegir. El código debe existir en el
              catálogo de Calenzia (superadmin → módulos).
            </p>
          </div>
          <Boton
            variante="primario"
            onClick={() => {
              setModuloForm({
                codigo: '',
                nombre: '',
                descripcion: '',
                precio_mensual_clp: 0,
                limite_estandar: null,
                activo: true,
                orden: modulos.length,
              })
              setModuloEditando(-1)
            }}
          >
            + Módulo
          </Boton>
        </div>

        {moduloEditando !== null && (
          <div className="anillo-gradiente space-y-4 rounded-2xl p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Campo etiqueta="Código (igual que Calenzia)">
                <input
                  className={entradaClase}
                  value={moduloForm.codigo}
                  onChange={(e) => setModuloForm({ ...moduloForm, codigo: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Nombre">
                <input
                  className={entradaClase}
                  value={moduloForm.nombre}
                  onChange={(e) => setModuloForm({ ...moduloForm, nombre: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Precio mensual (CLP)">
                <input
                  type="number"
                  min={0}
                  className={entradaClase}
                  value={moduloForm.precio_mensual_clp}
                  onChange={(e) =>
                    setModuloForm({ ...moduloForm, precio_mensual_clp: Number(e.target.value) || 0 })
                  }
                />
              </Campo>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Campo etiqueta="Descripción">
                <input
                  className={entradaClase}
                  value={moduloForm.descripcion}
                  onChange={(e) => setModuloForm({ ...moduloForm, descripcion: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Límite estándar mensual (vacío = sin límite)">
                <input
                  type="number"
                  min={0}
                  className={entradaClase}
                  placeholder="Ej. 500"
                  value={moduloForm.limite_estandar ?? ''}
                  onChange={(e) =>
                    setModuloForm({
                      ...moduloForm,
                      limite_estandar: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </Campo>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-3">
                  <Switch
                    activo={moduloForm.activo}
                    alCambiar={(valor) => setModuloForm({ ...moduloForm, activo: valor })}
                    etiqueta="Activo"
                  />
                  <span className="text-sm text-bruma">Activo</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setModuloEditando(null)}>
                Cancelar
              </Boton>
              <Boton variante="primario" onClick={guardarModulo}>
                Guardar
              </Boton>
            </div>
          </div>
        )}

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modulos.map((modulo) => (
            <li key={modulo.id} className={`tarjeta-vidrio rounded-2xl p-4 ${!modulo.activo ? 'opacity-55' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-blanco">{modulo.nombre}</p>
                  <p className="text-xs text-cian">{modulo.codigo}</p>
                </div>
                <p className="text-sm font-semibold text-cian">
                  {modulo.precio_mensual_clp > 0 ? formatearCLP(modulo.precio_mensual_clp) : '$0'}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-bruma">{modulo.descripcion}</p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-blanco/8 pt-3">
                <div className="flex items-center gap-3">
                  <Switch
                    activo={modulo.activo}
                    alCambiar={async (valor) => {
                      await api.modulosCheckout.actualizar(modulo.id, { ...modulo, activo: valor })
                      await recargar()
                    }}
                    etiqueta={`Activar ${modulo.nombre}`}
                  />
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setModuloForm(JSON.parse(JSON.stringify(modulo)))
                      setModuloEditando(modulo.id)
                    }}
                  >
                    Editar
                  </Boton>
                </div>
                <Boton variante="peligro" onClick={() => eliminarModulo(modulo)}>
                  Eliminar
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-blanco">Rubros del checkout</h2>
            <p className="mt-1 text-sm text-bruma">
              El checkout toma los rubros en vivo desde la API de Calenzia
              (ajuste <span className="text-cian">calenzia_api_url</span>); esta
              lista es el respaldo local por si Calenzia no responde.
            </p>
          </div>
          <Boton
            variante="primario"
            onClick={() => {
              setRubroForm({ codigo: '', nombre: '', activo: true, orden: rubros.length })
              setRubroEditando(-1)
            }}
          >
            + Rubro
          </Boton>
        </div>

        {rubroEditando !== null && (
          <div className="anillo-gradiente flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-end">
            <Campo etiqueta="Código" className="flex-1">
              <input
                className={entradaClase}
                value={rubroForm.codigo}
                onChange={(e) => setRubroForm({ ...rubroForm, codigo: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Nombre" className="flex-1">
              <input
                className={entradaClase}
                value={rubroForm.nombre}
                onChange={(e) => setRubroForm({ ...rubroForm, nombre: e.target.value })}
              />
            </Campo>
            <div className="flex items-center gap-2">
              <Boton variante="secundario" onClick={() => setRubroEditando(null)}>
                Cancelar
              </Boton>
              <Boton variante="primario" onClick={guardarRubro}>
                Guardar
              </Boton>
            </div>
          </div>
        )}

        <ul className="flex flex-wrap gap-3">
          {rubros.map((rubro) => (
            <li
              key={rubro.id}
              className={`tarjeta-vidrio flex items-center gap-3 rounded-xl px-4 py-2.5 ${!rubro.activo ? 'opacity-55' : ''}`}
            >
              <div>
                <p className="text-sm font-semibold text-blanco">{rubro.nombre}</p>
                <p className="text-xs text-cian">{rubro.codigo}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  activo={rubro.activo}
                  alCambiar={async (valor) => {
                    await api.rubrosCheckout.actualizar(rubro.id, { ...rubro, activo: valor })
                    await recargar()
                  }}
                  etiqueta={`Activar ${rubro.nombre}`}
                />
                <Boton
                  variante="secundario"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => {
                    setRubroForm(JSON.parse(JSON.stringify(rubro)))
                    setRubroEditando(rubro.id)
                  }}
                >
                  Editar
                </Boton>
                <Boton
                  variante="peligro"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => eliminarRubro(rubro)}
                >
                  ✕
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-blanco">Necesidades del checkout</h2>
            <p className="mt-1 text-sm text-bruma">
              Las preguntas que hace el checkout: cada una activa un conjunto
              de módulos. El cliente elige necesidades, no módulos.
            </p>
          </div>
          <Boton
            variante="primario"
            onClick={() => {
              setNecesidadForm({
                codigo: '',
                etiqueta: '',
                ayuda: '',
                modulos: [],
                activo: true,
                orden: necesidades.length,
              })
              setNecesidadEditando(-1)
            }}
          >
            + Necesidad
          </Boton>
        </div>

        {necesidadEditando !== null && (
          <div className="anillo-gradiente space-y-4 rounded-2xl p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Campo etiqueta="Código">
                <input
                  className={entradaClase}
                  value={necesidadForm.codigo}
                  onChange={(e) => setNecesidadForm({ ...necesidadForm, codigo: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Pregunta (así la ve el cliente)" className="sm:col-span-2">
                <input
                  className={entradaClase}
                  value={necesidadForm.etiqueta}
                  onChange={(e) => setNecesidadForm({ ...necesidadForm, etiqueta: e.target.value })}
                />
              </Campo>
            </div>
            <Campo etiqueta="Ayuda (texto de apoyo)">
              <input
                className={entradaClase}
                value={necesidadForm.ayuda}
                onChange={(e) => setNecesidadForm({ ...necesidadForm, ayuda: e.target.value })}
              />
            </Campo>
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                Módulos que activa
              </span>
              <div className="flex flex-wrap gap-2">
                {modulos.map((modulo) => {
                  const activo = necesidadForm.modulos.includes(modulo.codigo)
                  return (
                    <button
                      key={modulo.codigo}
                      type="button"
                      onClick={() =>
                        setNecesidadForm({
                          ...necesidadForm,
                          modulos: activo
                            ? necesidadForm.modulos.filter((c) => c !== modulo.codigo)
                            : [...necesidadForm.modulos, modulo.codigo],
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        activo
                          ? 'border-cian/50 bg-cian/10 text-cian'
                          : 'border-blanco/10 text-bruma hover:border-blanco/25'
                      }`}
                    >
                      {modulo.nombre}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Switch
                  activo={necesidadForm.activo}
                  alCambiar={(valor) => setNecesidadForm({ ...necesidadForm, activo: valor })}
                  etiqueta="Activa"
                />
                <span className="text-sm text-bruma">Activa</span>
              </div>
              <div className="flex gap-2">
                <Boton variante="secundario" onClick={() => setNecesidadEditando(null)}>
                  Cancelar
                </Boton>
                <Boton variante="primario" onClick={guardarNecesidad}>
                  Guardar
                </Boton>
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {necesidades.map((necesidad) => (
            <li
              key={necesidad.id}
              className={`tarjeta-vidrio rounded-2xl p-4 ${!necesidad.activo ? 'opacity-55' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-blanco">{necesidad.etiqueta}</p>
                  <p className="mt-1 text-xs text-bruma">{necesidad.ayuda}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {necesidad.modulos.map((codigo) => (
                      <span
                        key={codigo}
                        className="rounded-md border border-cian/25 bg-cian/5 px-2 py-0.5 text-[11px] font-medium text-cian"
                      >
                        {modulos.find((m) => m.codigo === codigo)?.nombre ?? codigo}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    activo={necesidad.activo}
                    alCambiar={async (valor) => {
                      await api.necesidadesCheckout.actualizar(necesidad.id, {
                        ...necesidad,
                        activo: valor,
                      })
                      await recargar()
                    }}
                    etiqueta={`Activar ${necesidad.codigo}`}
                  />
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setNecesidadForm(JSON.parse(JSON.stringify(necesidad)))
                      setNecesidadEditando(necesidad.id)
                    }}
                  >
                    Editar
                  </Boton>
                  <Boton variante="peligro" onClick={() => eliminarNecesidad(necesidad)}>
                    Eliminar
                  </Boton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
