import { useState } from 'react'
import { api } from '../../lib/api'
import type { Seccion } from '../../lib/tipos'

interface SeccionContactoProps {
  seccion: Seccion
  ajustes: Record<string, string>
}

export function SeccionContacto({ seccion, ajustes }: SeccionContactoProps) {
  const email = ajustes.email_contacto ?? ''
  const whatsapp = ajustes.whatsapp ?? ''
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`
    : ''

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState<'reposo' | 'enviando' | 'enviado' | 'error'>('reposo')
  const [textoError, setTextoError] = useState('')
  const [correoEnviado, setCorreoEnviado] = useState('')

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setEstado('enviando')
    setTextoError('')
    try {
      await api.enviarContacto(nombre, correo, mensaje)
      setCorreoEnviado(correo)
      setEstado('enviado')
      setNombre('')
      setCorreo('')
      setMensaje('')
    } catch (e) {
      setEstado('error')
      setTextoError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje')
    }
  }

  const entrada =
    'w-full rounded-xl border border-blanco/12 bg-abisal/80 px-4 py-3 text-sm text-blanco outline-none transition-colors placeholder:text-bruma/40 focus:border-cian/50 focus:ring-1 focus:ring-cian/30'

  return (
    <section id={seccion.slug ?? undefined} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="anillo-gradiente relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12 lg:px-16">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violeta/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cian/10 blur-3xl"
          />

          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cian">
                Contacto
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-blanco sm:text-4xl">
                {seccion.titulo}
              </h2>
              {seccion.subtitulo && (
                <p className="mt-4 max-w-md text-base leading-relaxed text-bruma">
                  {seccion.subtitulo}
                </p>
              )}

              <div className="mt-8 space-y-3">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-3 text-sm text-bruma transition-colors hover:text-cian"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cian/25 bg-cian/5 text-cian">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </span>
                    {email}
                  </a>
                )}
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 text-sm text-bruma transition-colors hover:text-turquesa"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-turquesa/25 bg-turquesa/5 text-turquesa">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.1-.6 3.4a11 11 0 0 0 4.2 4.5c1.6.9 2.6 1 3.5.9.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />
                      </svg>
                    </span>
                    {whatsapp}
                    <span className="text-xs text-bruma/60">(abre el chat)</span>
                  </a>
                )}
              </div>
            </div>

            <div>
              {estado === 'enviado' ? (
                <div className="tarjeta-vidrio flex h-full flex-col items-center justify-center gap-4 rounded-2xl p-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-turquesa/40 bg-turquesa/10 text-turquesa">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  <p className="text-lg font-semibold text-blanco">Mensaje recibido</p>
                  <p className="max-w-sm text-sm leading-relaxed text-bruma">
                    Gracias por escribir. Te responderemos pronto a{' '}
                    <span className="text-cian">{correoEnviado || 'tu correo'}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEstado('reposo')}
                    className="mt-2 text-sm font-semibold text-cian transition-colors hover:text-turquesa"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={enviar} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                        Tu nombre
                      </span>
                      <input
                        className={entrada}
                        placeholder="Cómo te llamas"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        maxLength={200}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                        Tu correo
                      </span>
                      <input
                        type="email"
                        className={entrada}
                        placeholder="tucorreo@ejemplo.com"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                        maxLength={300}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                      Mensaje
                    </span>
                    <textarea
                      className={`${entrada} min-h-32 resize-y`}
                      placeholder="Cuéntanos qué necesitas, en qué negocio estás o qué idea tienes en mente…"
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      required
                      maxLength={4000}
                    />
                  </label>

                  {estado === 'error' && (
                    <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                      {textoError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={estado === 'enviando'}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3.5 text-base font-semibold text-blanco transition-all hover:shadow-[0_0_32px_-8px_rgba(0,223,240,0.6)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {estado === 'enviando' ? 'Enviando…' : 'Enviar mensaje'}
                    <span aria-hidden>→</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
