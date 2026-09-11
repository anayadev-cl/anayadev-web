import type {
  ContenidoPublico,
  MensajeContacto,
  Producto,
  Seccion,
} from './tipos'

const BASE = import.meta.env.VITE_API_URL ?? ''

let token: string | null = localStorage.getItem('token_anayadev')

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
    throw new Error(detalle)
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
}
