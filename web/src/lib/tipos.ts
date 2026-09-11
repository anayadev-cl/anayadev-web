export interface BotonSeccion {
  texto: string
  enlace: string
  estilo: 'primario' | 'secundario'
}

export interface ItemSeccion {
  titulo: string
  texto: string
}

export interface Seccion {
  id: number
  slug: string | null
  tipo: string
  titulo: string
  subtitulo: string
  texto: string
  imagen_url: string | null
  datos: Record<string, unknown>
  orden: number
  visible: boolean
}

export interface Producto {
  id: number
  slug: string
  nombre: string
  eslogan: string
  descripcion: string
  estado: 'activo' | 'en_desarrollo' | 'proximamente'
  caracteristicas: string[]
  imagen_url: string | null
  url: string | null
  orden: number
  visible: boolean
}

export interface ContenidoPublico {
  secciones: Seccion[]
  productos: Producto[]
  ajustes: Record<string, string>
}

export interface MensajeContacto {
  id: number
  nombre: string
  correo: string
  mensaje: string
  leido: boolean
  creado_en: string
}
