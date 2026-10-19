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
  muestra_planes: boolean
  demo_url: string | null
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

/** Un comprobante (adjunto) de una declaración de transferencia. */
export interface AbonoAdjuntoLanding {
  id: string
  nombre?: string | null
  adjunto_url: string
}

/** Una declaración de transferencia (abono) con su estado (pago-ux). */
export interface AbonoSolicitudLanding {
  id: string
  monto: number | null
  estado: 'pendiente' | 'verificado' | 'rechazado'
  rechazo_motivo?: string | null
  creado_en?: string | null
  adjuntos?: AbonoAdjuntoLanding[]
}

export interface PagoSolicitudLanding {
  cobro_id: string
  total: number
  vencimiento_pago?: string | null
  glosa: string
  estado: 'por_pagar' | 'pagado'
  voucher_url?: string | null
  voucher_subido_en?: string | null
  // Abonos: lo verificado y lo que falta (el landing muestra el saldo).
  pagado_total?: number
  saldo?: number
  // pago-ux: las declaraciones de transferencia con su estado y comprobantes.
  abonos?: AbonoSolicitudLanding[]
}

export interface ModuloPrecioLanding {
  concepto: string
  precio_monto: number
}

/** onboarding-aceptacion: el plan propuesto por el superadmin (contrato + precio). */
export interface PlanPropuestoLanding {
  edicion: string
  modulos: string[]
  modulos_precio: ModuloPrecioLanding[]
  nro_trabajadores: number
  moneda: string
  simbolo_moneda: string
  decimales: number
  precio_trabajador: number
  total_primera_factura: number
  propuesto_en: string
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
  /** onboarding-aceptacion: el pedido original del cliente (para el diff). */
  solicitud_original?: {
    edicion: string
    modulos: string[]
    nro_trabajadores: number
  } | null
  /** onboarding-aceptacion: el plan propuesto (contrato final + precio). */
  plan_propuesto?: PlanPropuestoLanding | null
  /** onboarding-aceptacion: NULL · 'pendiente' · 'aceptada' · 'conversar'. */
  aceptacion_estado?: string | null
  aceptada_en?: string | null
}

export interface MetodoPagoPublico {
  tipo: 'transferencia' | 'paypal' | 'otro' | 'flow'
  nombre: string
  instrucciones_publicas: string
}

export interface MetodoPagoAdmin {
  id: number
  tipo: 'transferencia' | 'paypal' | 'otro' | 'flow'
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

// --- Motor de planes de Calenzia (público; la web no calcula precios) ---
export interface PlanTramoPublico {
  codigo: string
  nombre: string
  min_trabajadores: number
  max_trabajadores: number | null
}

export interface PlanPeriodicidadPublica {
  codigo: string
  nombre: string
  meses: number
  descuento_pct: number
}

export interface PlanPrecioPublico {
  tramo_codigo: string
  precio_persona: number
}

export interface PlanCupoPublico {
  recurso: string
  cantidad_persona: number
}

export interface PlanPresetPublico {
  codigo: string
  nombre: string
  descripcion: string | null
  precios: PlanPrecioPublico[]
  cupos: PlanCupoPublico[]
}

export interface PlanFuncionPublica {
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: 'base' | 'addon'
  precios: PlanPrecioPublico[]
}

export interface PlanCatalogoPublico {
  pais_iso: string
  redondeo_precio: number
  tramos: PlanTramoPublico[]
  periodicidades: PlanPeriodicidadPublica[]
  planes: PlanPresetPublico[]
  funciones: PlanFuncionPublica[]
  recursos_cupo: string[]
}

export interface PlanSimularRequest {
  plan_codigo?: string | null
  addons?: string[]
  nro_trabajadores: number
  periodicidad_codigo?: string
  pais_iso?: string
}

export interface PlanLineaDesglose {
  concepto: string
  descripcion: string
  tipo: 'base' | 'addon'
  precio_persona: number
}

export interface PlanSimular {
  tramo_codigo: string
  periodicidad_codigo: string
  descuento_pct: number
  precio_persona_base: number
  precio_persona: number
  /** Total mensual: precio_persona × nro_trabajadores. */
  total: number
  /** Meses del período de la periodicidad (1 = mensual). */
  meses?: number
  /** Cobro único del período: total mensual × meses. */
  total_periodo?: number
  nro_trabajadores: number
  cupo: Record<string, number>
  cupo_persona: Record<string, number>
  desglose: PlanLineaDesglose[]
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
    /** Cobro del período (un solo pago por adelantado). */
    total_minor?: number | null
    total_monto?: string | null
    /** Referencia mensual del período (para mostrar "$Y/mes"). */
    total_mensual_minor?: number | null
    total_mensual_monto?: string | null
    meses?: number | null
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
    // Checkout nuevo (modelo de planes).
    plan_codigo?: string | null
    plan_nombre?: string | null
    periodicidad_codigo?: string | null
    addons?: string[]
    tramo_codigo?: string | null
    descuento_pct?: number | null
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
