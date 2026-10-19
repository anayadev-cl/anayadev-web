import type { ContenidoPublico, Seccion } from '../../lib/tipos'
import { SeccionCircuito } from './SeccionCircuito'
import { SeccionContacto } from './SeccionContacto'
import { SeccionHero } from './SeccionHero'
import { SeccionProductos } from './SeccionProductos'
import { SeccionProceso } from './SeccionProceso'
import { SeccionTexto } from './SeccionTexto'

interface RenderizadorSeccionesProps {
  seccion: Seccion
  contenido: ContenidoPublico
}

export function RenderizadorSecciones({ seccion, contenido }: RenderizadorSeccionesProps) {
  switch (seccion.tipo) {
    case 'hero':
      return <SeccionHero seccion={seccion} />
    case 'circuito':
      return <SeccionCircuito seccion={seccion} />
    case 'productos':
      return <SeccionProductos seccion={seccion} productos={contenido.productos} />
    case 'proceso':
      return <SeccionProceso seccion={seccion} />
    case 'contacto':
      return <SeccionContacto seccion={seccion} ajustes={contenido.ajustes} />
    default:
      return <SeccionTexto seccion={seccion} />
  }
}
