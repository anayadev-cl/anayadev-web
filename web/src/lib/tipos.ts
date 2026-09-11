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

export interface ChatbotRespuestaApi {
  respuesta: string
  sugerencias: string[]
}

export interface ReglaChatbot {
  id: number
  palabras_clave: string
  respuesta: string
  sugerencias: string[]
  orden: number
  activo: boolean
}

export interface ModuloCheckout {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  precio_mensual_clp: number
  permite_limite: boolean
  activo: boolean
  orden: number
}

export interface RubroCheckout {
  id: number
  codigo: string
  nombre: string
  activo: boolean
  orden: number
}

export interface ModuloSeleccionado {
  modulo_codigo: string
  limite_mensual: number | null
}

export interface Compra {
  id: number
  codigo: string
  estado: 'pendiente_pago' | 'pagada' | 'enviada' | 'error_webhook'
  datos: {
    slug: string
    nombre_empresa: string
    tipo_entidad: string
    rubro_codigo: string
    rubro_nombre: string
    pais: string
    timezone: string
    admin_nombre: string
    admin_correo: string
    admin_telefono: string | null
  }
  modulos: {
    modulo_codigo: string
    nombre: string
    precio_mensual_clp: number
    limite_mensual: number | null
  }[]
  total_clp: number
  respuesta_webhook: string | null
  creado_en: string
  actualizado_en: string
}
