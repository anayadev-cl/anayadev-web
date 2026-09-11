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

  return (
    <section id={seccion.slug ?? undefined} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="anillo-gradiente relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violeta/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cian/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cian">
              Contacto
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-blanco sm:text-4xl">
              {seccion.titulo}
            </h2>
            {seccion.subtitulo && (
              <p className="mt-4 text-base leading-relaxed text-bruma">
                {seccion.subtitulo}
              </p>
            )}

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('abrir-chat'))}
              className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-8 py-3.5 text-base font-semibold text-blanco transition-all hover:shadow-[0_0_32px_-8px_rgba(0,223,240,0.6)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.4L3 21l2.1-5.6A8.5 8.5 0 1 1 21 11.5z" />
                <path d="M8.5 10.5h7M8.5 13.5h4" />
              </svg>
              Abrir el chat
            </button>

            <div className="mt-6 flex items-center justify-center gap-4">
              {email && (
                <a
                  href={`mailto:${email}`}
                  title={email}
                  aria-label={`Escribir a ${email}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cian/25 bg-cian/5 text-cian transition-all hover:border-cian/60 hover:shadow-[0_0_18px_-6px_rgba(0,223,240,0.6)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  title={`WhatsApp: ${whatsapp}`}
                  aria-label="Abrir chat de WhatsApp"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-turquesa/25 bg-turquesa/5 text-turquesa transition-all hover:border-turquesa/60 hover:shadow-[0_0_18px_-6px_rgba(0,216,200,0.6)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.1-.6 3.4a11 11 0 0 0 4.2 4.5c1.6.9 2.6 1 3.5.9.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
