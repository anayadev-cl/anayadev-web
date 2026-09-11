import { useState } from 'react'
import { api } from '../../lib/api'
import { Marca } from '../../componentes/Marca'
import { Boton, Campo, entradaClase } from './ui'

interface LoginProps {
  alEntrar: () => void
}

export function Login({ alEntrar }: LoginProps) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setCargando(true)
    setError('')
    try {
      await api.login(usuario, clave)
      alEntrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={enviar}
        className="anillo-gradiente w-full max-w-sm rounded-3xl p-8"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Marca tamano="md" />
          <p className="text-sm text-bruma">Panel de contenido del sitio</p>
        </div>

        <div className="mt-8 space-y-4">
          <Campo etiqueta="Usuario">
            <input
              className={entradaClase}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
            />
          </Campo>
          <Campo etiqueta="Clave">
            <input
              type="password"
              className={entradaClase}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Campo>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}

        <Boton
          variante="primario"
          className="mt-6 w-full py-3"
          disabled={cargando}
          type="submit"
        >
          {cargando ? 'Entrando…' : 'Entrar al panel'}
        </Boton>

        <a
          href="/"
          className="mt-5 block text-center text-sm text-bruma transition-colors hover:text-cian"
        >
          ← Volver al sitio
        </a>
      </form>
    </div>
  )
}
