import type { Producto } from './tipos'

export const ESTADOS_PRODUCTO: Record<
  Producto['estado'],
  { etiqueta: string; clase: string; punto: string }
> = {
  activo: {
    etiqueta: 'En producción',
    clase: 'border-turquesa/40 bg-turquesa/10 text-turquesa',
    punto: 'bg-turquesa',
  },
  en_desarrollo: {
    etiqueta: 'En desarrollo',
    clase: 'border-electrica/40 bg-electrica/10 text-electrica',
    punto: 'bg-electrica',
  },
  proximamente: {
    etiqueta: 'Próximamente',
    clase: 'border-violeta/40 bg-violeta/10 text-violeta',
    punto: 'bg-violeta',
  },
}
