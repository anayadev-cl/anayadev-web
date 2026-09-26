export interface BotonSeccion {
  texto: string
  enlace: string
  estilo: 'primario' | 'secundario'
}

export interface ItemSeccion {
  titulo: string
  texto: string
}

export interface Pais {
  iso: string
  nombre: string
  moneda: string
  simbolo_moneda: string
  decimales: number
  etiqueta_id_fiscal: string
  id_fiscal_obligatorio: boolean
  prefijo_telefono: string
  locale: string
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
  limite_estandar: number | null
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

export interface NecesidadCheckout {
  id: number
  codigo: string
  etiqueta: string
  ayuda: string
  modulos: string[]
  activo: boolean
  orden: number
}

export interface NecesidadPublica {
  id: number
  codigo: string
  etiqueta: string
  ayuda: string
  modulos: string[]
  incluye: string[]
}

export interface ModuloSeleccionado {
  modulo_codigo: string
}

export interface SugerenciaCalenzia {
  codigo: string
  tipo: 'edicion' | 'modulo'
  objetivo: string
  titulo: string
  motivo: string
  origen: 'regla' | 'superadmin'
  aceptada: boolean | null
}

export interface PagoSolicitudLanding {
  cobro_id: string
  total: number
  vencimiento_pago?: string | null
  glosa: string
  estado: 'por_pagar' | 'pagado'
  voucher_url?: string | null
  voucher_subido_en?: string | null
}

export interface SolicitudLanding {
  estado:
    | 'solicitada'
    | 'en_revision'
    | 'aprobada'
    | 'en_prueba'
    | 'activa'
    | 'rechazada'
    | 'expirada'
  negocio_nombre: string
  slug: string
  glosa?: string | null
  pais: string
  edicion: string
  nro_trabajadores: number
  modulos: string[]
  sugerencias: SugerenciaCalenzia[]
  moneda?: string | null
  simbolo_moneda?: string | null
  decimales?: number | null
  total_primera_factura?: number | null
  creado_en: string
  modulos_nombre?: Record<string, string>
  /** A.3: estado REAL del tenant (prueba/activo/moroso/…), null antes del provisioning. */
  tenant_estado?: string | null
  /** A.3: cobro del ciclo del tenant (estado, total, vencimiento, glosa, voucher). */
  pago?: PagoSolicitudLanding | null
}

export interface MetodoPagoPublico {
  tipo: 'transferencia' | 'paypal' | 'otro'
  nombre: string
  instrucciones_publicas: string
}

export interface MetodoPagoAdmin {
  id: number
  tipo: 'transferencia' | 'paypal' | 'otro'
  nombre: string
  instrucciones_publicas: string
  datos_privados: string | null
  activo: boolean
  orden: number
}

export interface SolicitudCalenzia {
  token: string | null
  solicitud_id: string | null
  estado: string | null
  slug: string | null
  ya_existia: boolean | null
  sugerencias: SugerenciaCalenzia[] | null
  creado_en: string | null
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
    moneda?: string
    locale?: string
    decimales?: number
    simbolo_moneda?: string
    etiqueta_id_fiscal?: string
    prefijo_telefono?: string
    id_fiscal?: string | null
    total_minor?: number | null
    total_monto?: string | null
    timezone: string
    equipo_personas: string | null
    necesidades: string[]
    modulos_extra: string[]
    admin_nombre: string
    admin_correo: string
    admin_telefono: string | null
    edicion?: 'comunicacion' | 'con_ia'
    nro_trabajadores?: number
    respuestas?: Record<string, unknown>
    calenzia?: SolicitudCalenzia | null
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
