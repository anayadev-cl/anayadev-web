import { useCallback, useEffect, useState } from 'react'
import { Marca } from '../../componentes/Marca'
import { api, getToken, setToken } from '../../lib/api'
import { Login } from './Login'
import { PanelAjustes } from './PanelAjustes'
import { PanelChatbot } from './PanelChatbot'
import { PanelCompras } from './PanelCompras'
import { PanelMedios } from './PanelMedios'
import { PanelMensajes } from './PanelMensajes'
import { PanelPagos } from './PanelPagos'
import { PanelProductos } from './PanelProductos'
import { PanelSecciones } from './PanelSecciones'

type Pestana = 'secciones' | 'productos' | 'mensajes' | 'compras' | 'pagos' | 'chatbot' | 'ajustes' | 'medios'

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'secciones', etiqueta: 'Secciones' },
  { id: 'productos', etiqueta: 'Productos' },
  { id: 'mensajes', etiqueta: 'Mensajes' },
  { id: 'compras', etiqueta: 'Compras' },
  { id: 'pagos', etiqueta: 'Pagos' },
  { id: 'chatbot', etiqueta: 'Chatbot' },
  { id: 'ajustes', etiqueta: 'Ajustes' },
  { id: 'medios', etiqueta: 'Medios' },
]

export function AdminApp() {
  const [logueado, setLogueado] = useState(() => getToken() !== null)
  const [pestana, setPestana] = useState<Pestana>('secciones')
  const [noLeidos, setNoLeidos] = useState(0)

  const refrescarNoLeidos = useCallback(async () => {
    try {
      const lista = await api.mensajes.listar()
      setNoLeidos(lista.filter((m) => !m.leido).length)
    } catch {
      /* el tab de mensajes muestra el error si algo falla */
    }
  }, [])

  useEffect(() => {
    if (logueado) void refrescarNoLeidos()
  }, [logueado, refrescarNoLeidos])

  if (!logueado) {
    return <Login alEntrar={() => setLogueado(true)} />
  }

  function salir() {
    setToken(null)
    setLogueado(false)
  }

  return (
    <div className="min-h-screen bg-noche text-blanco">
      <header className="sticky top-0 z-40 border-b border-blanco/8 bg-noche/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/" aria-label="Volver al sitio">
              <Marca tamano="sm" />
            </a>
            <span className="hidden rounded-md border border-violeta/30 bg-violeta/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violeta sm:inline-block">
              CMS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-lg border border-blanco/15 px-3.5 py-2 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
            >
              Ver sitio ↗
            </a>
            <button
              type="button"
              onClick={salir}
              className="rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <div className="flex gap-1 pb-0">
            {PESTANAS.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPestana(id)}
                className={`relative shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  pestana === id
                    ? 'border-cian text-cian'
                    : 'border-transparent text-bruma hover:text-blanco'
                }`}
              >
                {etiqueta}
                {id === 'mensajes' && noLeidos > 0 && (
                  <span className="absolute -top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-violeta to-cian px-1 text-[10px] font-bold text-blanco">
                    {noLeidos}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {pestana === 'secciones' && <PanelSecciones />}
        {pestana === 'productos' && <PanelProductos />}
        {pestana === 'mensajes' && (
          <PanelMensajes
            alCambiarNoLeidos={(cantidad) => {
              setNoLeidos(cantidad)
            }}
          />
        )}
        {pestana === 'ajustes' && <PanelAjustes />}
        {pestana === 'compras' && <PanelCompras />}
        {pestana === 'pagos' && <PanelPagos />}
        {pestana === 'chatbot' && <PanelChatbot />}
        {pestana === 'medios' && <PanelMedios />}
      </main>
    </div>
  )
}
