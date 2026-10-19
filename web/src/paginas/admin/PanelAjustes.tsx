import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Producto } from '../../lib/tipos'
import { Aviso, Boton, Campo, Switch, entradaClase } from './ui'

const CLAVES_CONOCIDAS = [
  { clave: 'email_contacto', etiqueta: 'Correo de contacto' },
  { clave: 'whatsapp', etiqueta: 'WhatsApp (con código de país)' },
  { clave: 'instagram', etiqueta: 'Instagram (usuario, sin @)' },
  { clave: 'footer_eslogan', etiqueta: 'Eslogan del pie de página' },
  { clave: 'chatbot_fallback', etiqueta: 'Chatbot: respuesta cuando no entiende' },
  {
    clave: 'webhook_onboarding_url',
    etiqueta: 'Webhook de onboarding (URL completa; vacío = derivarla de la API de Calenzia)',
  },
  {
    clave: 'webhook_onboarding_secreto',
    etiqueta: 'Webhook de onboarding: secreto (X-Webhook-Secret)',
  },
  {
    clave: 'calenzia_api_url',
    etiqueta: 'API de Calenzia (base; vacío = usar ANAYADEV_CALENZIA_API_URL)',
  },
  {
    clave: 'calenzia_paises_url',
    etiqueta: 'Endpoint de países de Calenzia (vacío = usar el valor por defecto del servidor)',
  },
  {
    clave: 'calenzia_precios_url',
    etiqueta: 'Endpoint de precios por país de Calenzia (usa {pais}; vacío = valor por defecto del servidor)',
  },
]

const CLAVES_MODAL = [
  'modal_activo',
  'modal_producto_slug',
  'modal_titulo',
  'modal_texto',
  'modal_cta_texto',
  'modal_cta_url',
  'modal_version',
]

export function PanelAjustes() {
  const [borrador, setBorrador] = useState<Record<string, string>>({})
  const [productos, setProductos] = useState<Producto[]>([])
  const [nuevaClave, setNuevaClave] = useState('')
  const [nuevoValor, setNuevoValor] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    api.ajustes
      .listar()
      .then((datos) => {
        setBorrador(datos)
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    api.productos
      .listar()
      .then((datos) => setProductos(datos.filter((p) => p.visible)))
      .catch(() => setProductos([]))
  }, [])

  async function guardar() {
    setAviso('')
    setError('')
    try {
      const resultado = await api.ajustes.guardar(borrador)
      setBorrador(resultado)
      setNuevaClave('')
      setNuevoValor('')
      setAviso('Ajustes guardados: la página pública ya los refleja')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  const clavesExtra = Object.keys(borrador).filter(
    (clave) =>
      !CLAVES_CONOCIDAS.some((c) => c.clave === clave) &&
      !CLAVES_MODAL.includes(clave),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blanco">Ajustes del sitio</h1>
        <p className="mt-1 text-sm text-bruma">
          Datos de contacto, redes y textos globales usados por la página.
        </p>
      </div>

      <Aviso texto={aviso} />
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CLAVES_CONOCIDAS.map(({ clave, etiqueta }) => (
          <Campo key={clave} etiqueta={etiqueta}>
            <input
              className={entradaClase}
              value={borrador[clave] ?? ''}
              onChange={(e) => setBorrador({ ...borrador, [clave]: e.target.value })}
            />
          </Campo>
        ))}
        {clavesExtra.map((clave) => (
          <Campo key={clave} etiqueta={clave}>
            <div className="flex gap-2">
              <input
                className={entradaClase}
                value={borrador[clave]}
                onChange={(e) => setBorrador({ ...borrador, [clave]: e.target.value })}
              />
              <Boton
                variante="peligro"
                className="shrink-0"
                onClick={() => {
                  const copia = { ...borrador }
                  delete copia[clave]
                  setBorrador(copia)
                }}
              >
                ✕
              </Boton>
            </div>
          </Campo>
        ))}
      </div>

      <div className="tarjeta-vidrio space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-bruma/70">
            Modal de portada
          </h2>
          <p className="mt-1 text-xs text-bruma/60">
            Se muestra una vez por visitante. Sube la versión para volver a
            mostrarlo a quienes ya lo cerraron.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Switch
            activo={(borrador.modal_activo ?? '0') === '1'}
            alCambiar={(valor) =>
              setBorrador({ ...borrador, modal_activo: valor ? '1' : '0' })
            }
            etiqueta="Mostrar modal en la portada"
          />
          <span className="text-sm text-bruma">
            {(borrador.modal_activo ?? '0') === '1' ? 'Activo' : 'Apagado'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Producto objetivo">
            <select
              className={entradaClase}
              value={borrador.modal_producto_slug ?? ''}
              onChange={(e) =>
                setBorrador({ ...borrador, modal_producto_slug: e.target.value })
              }
            >
              <option value="">— Sin producto —</option>
              {productos.map((producto) => (
                <option key={producto.slug} value={producto.slug}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Versión (para volver a mostrarlo)">
            <input
              type="number"
              min={1}
              className={entradaClase}
              value={borrador.modal_version ?? '1'}
              onChange={(e) =>
                setBorrador({ ...borrador, modal_version: e.target.value })
              }
            />
          </Campo>
          <Campo etiqueta="Título">
            <input
              className={entradaClase}
              value={borrador.modal_titulo ?? ''}
              onChange={(e) =>
                setBorrador({ ...borrador, modal_titulo: e.target.value })
              }
            />
          </Campo>
          <Campo etiqueta="Texto del CTA">
            <input
              className={entradaClase}
              value={borrador.modal_cta_texto ?? ''}
              onChange={(e) =>
                setBorrador({ ...borrador, modal_cta_texto: e.target.value })
              }
            />
          </Campo>
          <Campo etiqueta="URL del CTA">
            <input
              className={entradaClase}
              placeholder="/calenzia o /comprar"
              value={borrador.modal_cta_url ?? ''}
              onChange={(e) =>
                setBorrador({ ...borrador, modal_cta_url: e.target.value })
              }
            />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Texto">
              <textarea
                className={`${entradaClase} min-h-20 resize-y`}
                value={borrador.modal_texto ?? ''}
                onChange={(e) =>
                  setBorrador({ ...borrador, modal_texto: e.target.value })
                }
              />
            </Campo>
          </div>
        </div>
      </div>

      <div className="tarjeta-vidrio rounded-2xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-bruma/70">
          Agregar clave propia
        </h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={`${entradaClase} sm:w-56`}
            placeholder="clave"
            value={nuevaClave}
            onChange={(e) => setNuevaClave(e.target.value)}
          />
          <input
            className={`${entradaClase} flex-1`}
            placeholder="valor"
            value={nuevoValor}
            onChange={(e) => setNuevoValor(e.target.value)}
          />
          <Boton
            variante="secundario"
            className="shrink-0"
            onClick={() => {
              const clave = nuevaClave.trim()
              if (!clave) return
              setBorrador({ ...borrador, [clave]: nuevoValor })
              setNuevaClave('')
              setNuevoValor('')
            }}
          >
            Agregar
          </Boton>
        </div>
      </div>

      <div className="flex justify-end border-t border-blanco/8 pt-5">
        <Boton variante="primario" onClick={guardar}>
          Guardar ajustes
        </Boton>
      </div>
    </div>
  )
}
