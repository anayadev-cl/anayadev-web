import type { Seccion } from '../../lib/tipos'

interface SeccionTextoProps {
  seccion: Seccion
}

export function SeccionTexto({ seccion }: SeccionTextoProps) {
  return (
    <section id={seccion.slug ?? undefined} className="relative py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-blanco sm:text-4xl">
            {seccion.titulo}
          </h2>
          {seccion.subtitulo && (
            <p className="mt-4 text-base leading-relaxed text-bruma">
              {seccion.subtitulo}
            </p>
          )}
          {seccion.texto && (
            <p className="mt-6 whitespace-pre-line text-left text-base leading-relaxed text-bruma">
              {seccion.texto}
            </p>
          )}
        </div>
        {seccion.imagen_url && (
          <img
            src={seccion.imagen_url}
            alt={seccion.titulo || 'Imagen de la sección'}
            className="mx-auto mt-10 max-h-[480px] w-auto max-w-full rounded-2xl border border-blanco/10"
          />
        )}
      </div>
    </section>
  )
}
