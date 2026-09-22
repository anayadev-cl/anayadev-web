import type {
  ChatbotRespuestaApi,
  Compra,
  ContenidoPublico,
  MensajeContacto,
  MetodoPagoAdmin,
  MetodoPagoPublico,
  ModuloCheckout,
  NecesidadCheckout,
  NecesidadPublica,
  Pais,
  Producto,
  ReglaChatbot,
  RubroCheckout,
  Seccion,
  SolicitudLanding,
} from './tipos'

const BASE = import.meta.env.VITE_API_URL ?? ''

let token: string | null =
  typeof localStorage === 'undefined' ? null : localStorage.getItem('token_anayadev')

export const getToken = () => token

export function setToken(nuevo: string | null) {
  token = nuevo
  if (nuevo) localStorage.setItem('token_anayadev', nuevo)
  else localStorage.removeItem('token_anayadev')
}

async function pedir(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  const cabeceras: Record<string, string> = {
    ...((opciones.headers as Record<string, string> | undefined) ?? {}),
  }
  if (token) cabeceras.Authorization = `Bearer ${token}`
  if (typeof opciones.body === 'string') cabeceras['Content-Type'] = 'application/json'
  const respuesta = await fetch(`${BASE}${ruta}`, { ...opciones, headers: cabeceras })
  if (!respuesta.ok) {
    if (respuesta.status === 401 && ruta !== '/api/v1/admin/login') setToken(null)
    const cuerpo = await respuesta.json().catch(() => null)
    const detalle =
      typeof cuerpo?.detail === 'string' ? cuerpo.detail : `Error ${respuesta.status}`
    const error = new Error(detalle) as Error & { status?: number }
    error.status = respuesta.status
    throw error
  }
  return respuesta
}

export const api = {
  contenidoPublico: async (): Promise<ContenidoPublico> =>
    (await pedir('/api/v1/publico/contenido')).json(),

  enviarContacto: async (nombre: string, correo: string, mensaje: string) =>
    pedir('/api/v1/publico/contacto', {
      method: 'POST',
      body: JSON.stringify({ nombre, correo, mensaje }),
    }),

  chatbot: async (mensaje: string): Promise<ChatbotRespuestaApi> =>
    (await pedir('/api/v1/publico/chatbot', {
      method: 'POST',
      body: JSON.stringify({ mensaje }),
    })).json(),

  chatbotAdjunto: async (formulario: FormData): Promise<ChatbotRespuestaApi> =>
    (await pedir('/api/v1/publico/chatbot/adjunto', {
      method: 'POST',
      body: formulario,
    })).json(),

  checkoutCatalogo: async (): Promise<{
    necesidades: NecesidadPublica[]
    rubros: { codigo: string; nombre: string }[]
    paises: Pais[]
    modulos: { codigo: string; nombre: string; descripcion: string }[]
  }> => (await pedir('/api/v1/publico/checkout')).json(),

  pagosPublicos: async (): Promise<MetodoPagoPublico[]> =>
    (await pedir('/api/v1/publico/pagos')).json(),

  preciosCheckout: async (
    pais: string,
  ): Promise<{
    pais: Pais
    modulos: { modulo_codigo: string; monto_minor: number }[]
  }> => (await pedir(`/api/v1/publico/checkout/precios?pais=${encodeURIComponent(pais)}`)).json(),

  slugDisponible: async (
    slug: string,
  ): Promise<{ slug: string; disponible: boolean }> =>
    (await pedir(`/api/v1/publico/slug-disponible?slug=${encodeURIComponent(slug)}`)).json(),

  crearCompra: async (cuerpo: {
    slug: string
    nombre_empresa: string
    tipo_entidad: string
    rubro_codigo: string
    pais: string
    equipo_personas?: string | null
    admin_nombre: string
    admin_correo: string
    admin_telefono?: string | null
    id_fiscal?: string | null
    necesidades: string[]
    modulos_extra: string[]
    edicion: 'comunicacion' | 'con_ia'
    nro_trabajadores: number
    respuestas?: Record<string, unknown>
  }): Promise<Compra> =>
    (await pedir('/api/v1/publico/compras', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    })).json(),

  enviarSolicitud: async (id: number): Promise<Compra> =>
    (await pedir(`/api/v1/publico/compras/${id}/pagar`, { method: 'POST' })).json(),

  verSolicitud: async (token: string): Promise<SolicitudLanding> =>
    (
      await pedir(`/api/v1/publico/onboarding/solicitud/${encodeURIComponent(token)}`)
    ).json(),

  login: async (usuario: string, clave: string) => {
    const respuesta = await pedir('/api/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, clave }),
    })
    const datos = await respuesta.json()
    setToken(datos.access_token)
    return datos
  },

  secciones: {
    listar: async (): Promise<Seccion[]> =>
      (await pedir('/api/v1/admin/secciones')).json(),
    crear: async (cuerpo: Partial<Seccion>): Promise<Seccion> =>
      (await pedir('/api/v1/admin/secciones', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Partial<Seccion>): Promise<Seccion> =>
      (await pedir(`/api/v1/admin/secciones/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/secciones/${id}`, { method: 'DELETE' })
    },
  },

  productos: {
    listar: async (): Promise<Producto[]> =>
      (await pedir('/api/v1/admin/productos')).json(),
    crear: async (cuerpo: Partial<Producto>): Promise<Producto> =>
      (await pedir('/api/v1/admin/productos', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Partial<Producto>): Promise<Producto> =>
      (await pedir(`/api/v1/admin/productos/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/productos/${id}`, { method: 'DELETE' })
    },
  },

  ajustes: {
    listar: async (): Promise<Record<string, string>> =>
      (await pedir('/api/v1/admin/ajustes')).json(),
    guardar: async (cuerpo: Record<string, string>): Promise<Record<string, string>> =>
      (await pedir('/api/v1/admin/ajustes', { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
  },

  mensajes: {
    listar: async (): Promise<MensajeContacto[]> =>
      (await pedir('/api/v1/admin/mensajes')).json(),
    marcarLeido: async (id: number, leido: boolean): Promise<MensajeContacto> =>
      (await pedir(`/api/v1/admin/mensajes/${id}/leido`, {
        method: 'PATCH',
        body: JSON.stringify({ leido }),
      })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/mensajes/${id}`, { method: 'DELETE' })
    },
  },

  chatbotAdmin: {
    listar: async (): Promise<ReglaChatbot[]> =>
      (await pedir('/api/v1/admin/chatbot')).json(),
    crear: async (cuerpo: Omit<ReglaChatbot, 'id'>): Promise<ReglaChatbot> =>
      (await pedir('/api/v1/admin/chatbot', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Omit<ReglaChatbot, 'id'>): Promise<ReglaChatbot> =>
      (await pedir(`/api/v1/admin/chatbot/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/chatbot/${id}`, { method: 'DELETE' })
    },
  },

  comprasAdmin: {
    listar: async (): Promise<Compra[]> =>
      (await pedir('/api/v1/admin/compras')).json(),
    reenviar: async (id: number): Promise<Compra> =>
      (await pedir(`/api/v1/admin/compras/${id}/reenviar`, { method: 'POST' })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/compras/${id}`, { method: 'DELETE' })
    },
  },

  modulosCheckout: {
    listar: async (): Promise<ModuloCheckout[]> =>
      (await pedir('/api/v1/admin/checkout/modulos')).json(),
    crear: async (cuerpo: Omit<ModuloCheckout, 'id'>): Promise<ModuloCheckout> =>
      (await pedir('/api/v1/admin/checkout/modulos', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Omit<ModuloCheckout, 'id'>): Promise<ModuloCheckout> =>
      (await pedir(`/api/v1/admin/checkout/modulos/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/checkout/modulos/${id}`, { method: 'DELETE' })
    },
  },

  rubrosCheckout: {
    listar: async (): Promise<RubroCheckout[]> =>
      (await pedir('/api/v1/admin/checkout/rubros')).json(),
    crear: async (cuerpo: Omit<RubroCheckout, 'id'>): Promise<RubroCheckout> =>
      (await pedir('/api/v1/admin/checkout/rubros', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Omit<RubroCheckout, 'id'>): Promise<RubroCheckout> =>
      (await pedir(`/api/v1/admin/checkout/rubros/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/checkout/rubros/${id}`, { method: 'DELETE' })
    },
  },

  necesidadesCheckout: {
    listar: async (): Promise<NecesidadCheckout[]> =>
      (await pedir('/api/v1/admin/checkout/necesidades')).json(),
    crear: async (cuerpo: Omit<NecesidadCheckout, 'id'>): Promise<NecesidadCheckout> =>
      (await pedir('/api/v1/admin/checkout/necesidades', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Omit<NecesidadCheckout, 'id'>): Promise<NecesidadCheckout> =>
      (await pedir(`/api/v1/admin/checkout/necesidades/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/checkout/necesidades/${id}`, { method: 'DELETE' })
    },
  },

  medios: {
    listar: async (): Promise<{ nombre: string; url: string }[]> =>
      (await pedir('/api/v1/admin/medios')).json(),
    subir: async (archivo: File): Promise<{ nombre: string; url: string }> => {
      const formulario = new FormData()
      formulario.append('archivo', archivo)
      return (await pedir('/api/v1/admin/medios', { method: 'POST', body: formulario })).json()
    },
    eliminar: async (nombre: string) => {
      await pedir(`/api/v1/admin/medios/${nombre}`, { method: 'DELETE' })
    },
  },

  pagosAdmin: {
    listar: async (): Promise<MetodoPagoAdmin[]> =>
      (await pedir('/api/v1/admin/pagos')).json(),
    crear: async (cuerpo: Omit<MetodoPagoAdmin, 'id'>): Promise<MetodoPagoAdmin> =>
      (await pedir('/api/v1/admin/pagos', { method: 'POST', body: JSON.stringify(cuerpo) })).json(),
    actualizar: async (id: number, cuerpo: Omit<MetodoPagoAdmin, 'id'>): Promise<MetodoPagoAdmin> =>
      (await pedir(`/api/v1/admin/pagos/${id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })).json(),
    eliminar: async (id: number) => {
      await pedir(`/api/v1/admin/pagos/${id}`, { method: 'DELETE' })
    },
  },
}
