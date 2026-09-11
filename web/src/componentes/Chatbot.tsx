import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { Marca } from './Marca'

interface MensajeChat {
  origen: 'usuario' | 'bot'
  texto: string
  sugerencias?: string[]
}

export function Chatbot() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [entrada, setEntrada] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [sinLeer, setSinLeer] = useState(0)
  const zonaMensajes = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      void saludar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  useEffect(() => {
    zonaMensajes.current?.scrollTo({ top: zonaMensajes.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, escribiendo])

  async function saludar() {
    setEscribiendo(true)
    try {
      const respuesta = await api.chatbot('hola')
      setMensajes([{ origen: 'bot', texto: respuesta.respuesta, sugerencias: respuesta.sugerencias }])
    } catch {
      setMensajes([
        {
          origen: 'bot',
          texto: '¡Hola! Soy el asistente de anayadev. ¿En qué te ayudo?',
          sugerencias: ['¿Qué es Calenzia?', '¿Cómo la compro?', 'Hablar con una persona'],
        },
      ])
    } finally {
      setEscribiendo(false)
    }
  }

  async function enviar(texto: string) {
    const limpio = texto.trim()
    if (!limpio || escribiendo) return
    setEntrada('')
    setMensajes((actuales) => [...actuales, { origen: 'usuario', texto: limpio }])
    setEscribiendo(true)
    try {
      const respuesta = await api.chatbot(limpio)
      setMensajes((actuales) => [
        ...actuales,
        { origen: 'bot', texto: respuesta.respuesta, sugerencias: respuesta.sugerencias },
      ])
    } catch {
      setMensajes((actuales) => [
        ...actuales,
        {
          origen: 'bot',
          texto: 'Tuvimos un problema de conexión. Intenta de nuevo o escríbenos por el formulario de contacto.',
        },
      ])
    } finally {
      setEscribiendo(false)
    }
  }

  function abrir() {
    setAbierto(true)
    setSinLeer(0)
  }

  useEffect(() => {
    if (!abierto && mensajes.length > 0) setSinLeer(1)
  }, [abierto, mensajes.length])

  return (
    <>
      <button
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        aria-label={abierto ? 'Cerrar el asistente' : 'Abrir chat con el asistente'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violeta via-electrica to-cian text-blanco shadow-[0_0_34px_-8px_rgba(0,223,240,0.7)] transition-transform hover:scale-105"
      >
        {abierto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z" />
            <path d="M8.5 10.5h7M8.5 13.5h4" />
          </svg>
        )}
        {!abierto && sinLeer > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violeta text-[10px] font-bold ring-2 ring-noche">
            {sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="anillo-gradiente fixed bottom-24 right-4 left-4 z-50 flex h-[68vh] flex-col overflow-hidden rounded-3xl bg-abisal shadow-2xl sm:left-auto sm:right-5 sm:h-[560px] sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-blanco/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <Marca tamano="sm" />
              <div>
                <p className="text-sm font-semibold text-blanco">Asistente virtual</p>
                <p className="flex items-center gap-1.5 text-xs text-bruma/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-turquesa" />
                  en línea
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="rounded-lg border border-blanco/10 p-1.5 text-bruma transition-colors hover:text-blanco"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div ref={zonaMensajes} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {mensajes.map((mensaje, i) => (
              <div key={i}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    mensaje.origen === 'usuario'
                      ? 'ml-auto w-fit rounded-br-md bg-gradient-to-r from-electrica to-violeta text-blanco'
                      : 'tarjeta-vidrio rounded-bl-md text-bruma'
                  }`}
                >
                  {mensaje.texto}
                </div>
                {mensaje.origen === 'bot' &&
                  i === mensajes.length - 1 &&
                  !escribiendo &&
                  (mensaje.sugerencias ?? []).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {mensaje.sugerencias!.map((sugerencia) => (
                        <button
                          key={sugerencia}
                          type="button"
                          onClick={() => void enviar(sugerencia)}
                          className="rounded-full border border-cian/30 bg-cian/5 px-3 py-1.5 text-xs font-medium text-cian transition-colors hover:bg-cian/15"
                        >
                          {sugerencia}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {escribiendo && (
              <div className="tarjeta-vidrio w-fit rounded-2xl rounded-bl-md px-4 py-3">
                <span className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cian" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cian" style={{ animationDelay: '180ms' }} />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cian" style={{ animationDelay: '360ms' }} />
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void enviar(entrada)
            }}
            className="flex gap-2 border-t border-blanco/8 p-3"
          >
            <input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="w-full rounded-xl border border-blanco/10 bg-noche/70 px-4 py-2.5 text-sm text-blanco outline-none placeholder:text-bruma/40 focus:border-cian/50"
            />
            <button
              type="submit"
              disabled={!entrada.trim() || escribiendo}
              aria-label="Enviar mensaje"
              className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violeta to-cian text-blanco transition-opacity disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4 12 16-8-6 16-3-6-7-2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
