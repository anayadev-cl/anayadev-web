import { useEffect, useState } from 'react'
import { FondoCircuito } from '../componentes/FondoCircuito'
import { Marca } from '../componentes/Marca'
import { api } from '../lib/api'
import { formatearMonto } from '../lib/paises'
import type { Compra, NecesidadPublica, Pais } from '../lib/tipos'

const PASOS = ['Tu negocio', 'Tu plan', 'Tu equipo', 'Enviar']

interface ModuloCatalogo {
  codigo: string
  nombre: string
  descripcion: string
}

const entrada =
  'w-full rounded-xl border border-blanco/12 bg-abisal/80 px-4 py-3 text-sm text-blanco outline-none transition-colors placeholder:text-bruma/40 focus:border-cian/50 focus:ring-1 focus:ring-cian/30'

const OPCIONES_EQUIPO = [
  { valor: 'solo_yo', etiqueta: 'Solo yo', ayuda: 'Trabajo por mi cuenta', nro: 1 },
  { valor: '2_a_5', etiqueta: '2 a 5', ayuda: 'Un equipo pequeño', nro: 5 },
  { valor: '6_a_15', etiqueta: '6 a 15', ayuda: 'Varios profesionales', nro: 15 },
  { valor: '16_a_50', etiqueta: '16 a 50', ayuda: 'Un equipo grande', nro: 50 },
  { valor: 'mas_de_50', etiqueta: 'Más de 50', ayuda: 'Una organización', nro: 51 },
]

const NECESIDAD_BASE = 'reservas_online'

function recomendacionSegunEquipo(equipo: string): Record<string, boolean> {
  if (equipo === 'solo_yo') {
    return { asistente_ia: true, whatsapp: false, crecimiento: false }
  }
  if (equipo === '2_a_5') {
    return { asistente_ia: true, whatsapp: true, crecimiento: false }
  }
  return { asistente_ia: true, whatsapp: true, crecimiento: true }
}

export function PaginaCompra() {
  const [necesidades, setNecesidades] = useState<NecesidadPublica[]>([])
  const [modulosCatalogo, setModulosCatalogo] = useState<ModuloCatalogo[]>([])
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([])
  const [paises, setPaises] = useState<Pais[]>([])
  const [paisIso, setPaisIso] = useState('CL')
  const [precios, setPrecios] = useState<Record<string, number>>({})
  const [preciosPais, setPreciosPais] = useState<Pais | null>(null)
  const [cargando, setCargando] = useState(true)
  const [paso, setPaso] = useState(0)

  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [estadoSlug, setEstadoSlug] = useState<'comprobando' | 'libre' | 'ocupado' | null>(null)
  const [tipoEntidad, setTipoEntidad] = useState('empresa')
  const [rubroCodigo, setRubroCodigo] = useState('')
  const [equipo, setEquipo] = useState('')

  const [adminNombre, setAdminNombre] = useState('')
  const [adminCorreo, setAdminCorreo] = useState('')
  const [adminTelefono, setAdminTelefono] = useState('')
  const [idFiscal, setIdFiscal] = useState('')

  const [plan, setPlan] = useState<Record<string, boolean>>({})
  const [planTocado, setPlanTocado] = useState(false)
  const [extras, setExtras] = useState<Record<string, boolean>>({})
  const [compraPendiente, setCompraPendiente] = useState<Compra | null>(null)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<Compra | null>(null)

  useEffect(() => {
    api
      .checkoutCatalogo()
      .then((datos) => {
        setNecesidades(datos.necesidades)
        setRubros(datos.rubros)
        setModulosCatalogo(datos.modulos ?? [])
        setPaises(datos.paises ?? [])
        if (datos.rubros.length > 0) setRubroCodigo(datos.rubros[0].codigo)
      })
      .catch(() => setError('No pudimos cargar el catálogo. Recarga la página.'))
      .finally(() => setCargando(false))
  }, [])

  const paisActual = paises.find((p) => p.iso === paisIso) ?? null

  useEffect(() => {
    if (!paisIso) return
    let activo = true
    api
      .preciosCheckout(paisIso)
      .then((datos) => {
        if (!activo) return
        setPreciosPais(datos.pais)
        setPrecios(
          Object.fromEntries(datos.modulos.map((m) => [m.modulo_codigo, m.monto_minor])),
        )
      })
      .catch(() => {
        if (activo) {
          setPreciosPais(null)
          setPrecios({})
        }
      })
    return () => {
      activo = false
    }
  }, [paisIso])

  useEffect(() => {
    if (!equipo || planTocado) return
    setPlan(recomendacionSegunEquipo(equipo))
  }, [equipo, planTocado])

  useEffect(() => {
    if (!slug || !slugValido()) {
      setEstadoSlug(null)
      return
    }
    setEstadoSlug('comprobando')
    const temporizador = setTimeout(() => {
      api
        .slugDisponible(slug)
        .then((respuesta) => setEstadoSlug(respuesta.disponible ? 'libre' : 'ocupado'))
        .catch(() => setEstadoSlug(null))
    }, 500)
    return () => clearTimeout(temporizador)
  }, [slug])

  const preguntas = necesidades.filter((n) => n.codigo !== NECESIDAD_BASE)
  const codigosCubiertos = new Set(
    necesidades.flatMap((n) => n.modulos),
  )
  const extrasDisponibles = modulosCatalogo.filter((m) => !codigosCubiertos.has(m.codigo))

  const necesidadesElegidas = [
    NECESIDAD_BASE,
    ...preguntas.filter((n) => plan[n.codigo]).map((n) => n.codigo),
  ]
  const extrasElegidos = extrasDisponibles
    .filter((m) => extras[m.codigo])
    .map((m) => m.codigo)

  const codigosElegidos = [
    ...necesidades
      .filter((n) => necesidadesElegidas.includes(n.codigo))
      .flatMap((n) => n.modulos),
    ...extrasElegidos,
  ]
  const nombresContratados = [
    ...necesidades
      .filter((n) => necesidadesElegidas.includes(n.codigo))
      .flatMap((n) => n.incluye),
    ...extrasDisponibles.filter((m) => extrasElegidos.includes(m.codigo)).map((m) => m.nombre),
  ]
  const totalMinor = codigosElegidos.reduce(
    (suma, codigo) => suma + (precios[codigo] ?? 0),
    0,
  )
  const totalFormateado = formatearMonto(preciosPais, totalMinor)

  function generarSlug(nombre: string) {
    const candidato = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
    setSlug(candidato)
  }

  function slugValido() {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)
  }

  function puedeAvanzar(): boolean {
    if (paso === 0) {
      return (
        nombreEmpresa.trim().length > 0 &&
        slugValido() &&
        estadoSlug !== 'ocupado' &&
        rubroCodigo.length > 0 &&
        equipo.length > 0
      )
    }
    if (paso === 2) {
      const correoValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminCorreo.trim())
      const fiscalOk =
        !paisActual?.id_fiscal_obligatorio || idFiscal.trim().length > 0
      return adminNombre.trim().length > 0 && correoValido && fiscalOk
    }
    return true
  }

  function alternarPregunta(codigo: string) {
    setPlanTocado(true)
    setPlan({ ...plan, [codigo]: !plan[codigo] })
  }

  function alternarExtra(codigo: string) {
    setExtras({ ...extras, [codigo]: !extras[codigo] })
  }

  function aplicarRecomendacion() {
    setPlanTocado(true)
    setPlan(recomendacionSegunEquipo(equipo))
    setExtras({})
  }

  async function crearPedido() {
    setError('')
    setEnviando(true)
    try {
      const opcionEquipo = OPCIONES_EQUIPO.find((o) => o.valor === equipo)
      const compra = await api.crearCompra({
        slug,
        nombre_empresa: nombreEmpresa,
        tipo_entidad: tipoEntidad,
        rubro_codigo: rubroCodigo,
        pais: paisIso,
        equipo_personas: equipo,
        admin_nombre: adminNombre,
        admin_correo: adminCorreo,
        admin_telefono: adminTelefono || null,
        id_fiscal: idFiscal || null,
        necesidades: necesidadesElegidas,
        modulos_extra: extrasElegidos,
        edicion: plan['asistente_ia'] ? 'con_ia' : 'comunicacion',
        nro_trabajadores: opcionEquipo?.nro ?? 1,
        respuestas: {},
      })
      setCompraPendiente(compra)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el pedido')
    } finally {
      setEnviando(false)
    }
  }

  async function finalizar() {
    if (!compraPendiente) return
    setError('')
    setEnviando(true)
    try {
      const compra = await api.enviarSolicitud(compraPendiente.id)
      setResultado(compra)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    const fallo = resultado.estado === 'error_webhook'
    const telefono = (resultado.datos.admin_telefono ?? '').trim()
    const titulo = fallo ? 'Recibimos tu solicitud, con un detalle' : '¡Solicitud creada!'
    const detalle = fallo
      ? 'Tu solicitud quedó guardada, pero el registro automático falló. Nuestro equipo lo revisará y te contactará pronto.'
      : `Se creó tu solicitud con el código ${resultado.codigo.toUpperCase()}. Te enviamos un correo a ${resultado.datos.admin_correo} con todo lo que quedó registrado. El equipo de anayadev revisará el paquete, ajustará los límites a tu equipo y te contactará ${telefono ? 'por teléfono o correo' : 'por correo'} para coordinar la activación.`
    return (
      <div className="relative min-h-screen">
        <FondoCircuito />
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full border ${
              fallo
                ? 'border-violeta/40 bg-violeta/10 text-violeta'
                : 'border-turquesa/40 bg-turquesa/10 text-turquesa'
            }`}
          >
            {fallo ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            )}
          </span>
          <h1 className="mt-6 text-3xl font-bold text-blanco">{titulo}</h1>
          <p className="mt-4 text-base leading-relaxed text-bruma">{detalle}</p>
          {!fallo && (
            <p className="mt-2 text-sm text-bruma/70">
              Tu enlace quedó reservado:{' '}
              <span className="text-cian">agenda.anayadev.cl/{resultado.datos.slug}</span>
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/"
              className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco"
            >
              Volver al inicio
            </a>
            <a
              href="/#contacto"
              className="rounded-full border border-blanco/15 px-7 py-3 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian"
            >
              ¿Dudas? Conversemos
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <FondoCircuito />
      <header className="border-b border-blanco/8">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <a href="/" aria-label="Volver al inicio">
            <Marca tamano="sm" />
          </a>
          <a
            href="/"
            className="text-sm font-medium text-bruma transition-colors hover:text-cian"
          >
            ← Volver
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cian">
            Un momento, es rápido
          </p>
          <h1 className="mt-3 text-3xl font-bold text-blanco sm:text-4xl">
            Vamos a conocernos para dejarte{' '}
            <span className="texto-gradiente">Calenzia</span> lista
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bruma">
            Unas preguntas y queda funcionando. Por ahora Calenzia está
            disponible en Chile.
          </p>
        </div>

        <ol className="mt-10 flex items-center justify-center gap-1 sm:gap-2">
          {PASOS.map((etiqueta, i) => (
            <li key={etiqueta} className="flex items-center gap-1 sm:gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                  i < paso
                    ? 'border-turquesa/50 bg-turquesa/10 text-turquesa'
                    : i === paso
                      ? 'border-cian/60 bg-cian/10 text-cian'
                      : 'border-blanco/15 text-bruma/60'
                }`}
              >
                {i < paso ? '✓' : i + 1}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:block ${
                  i === paso ? 'text-blanco' : 'text-bruma/60'
                }`}
              >
                {etiqueta}
              </span>
              {i < PASOS.length - 1 && (
                <span className="mx-1 h-px w-6 bg-blanco/15 sm:w-10" />
              )}
            </li>
          ))}
        </ol>

        {error && (
          <p className="mt-8 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {cargando ? (
          <p className="mt-12 text-center text-sm text-bruma">Cargando catálogo…</p>
        ) : (
          <div className="tarjeta-vidrio mt-8 rounded-3xl p-6 sm:p-8">
            {paso === 0 && (
              <div className="space-y-7">
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-1.5 block text-lg font-semibold text-blanco">
                      ¿En qué país está tu negocio?
                    </span>
                    <select
                      className={entrada}
                      value={paisIso}
                      onChange={(e) => setPaisIso(e.target.value)}
                    >
                      {paises.map((pais) => (
                        <option key={pais.iso} value={pais.iso}>
                          {pais.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1.5 block text-xs text-bruma/60">
                      Los precios y el formato se adaptan al país que elijas.
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-lg font-semibold text-blanco">
                      ¿Cómo se llama tu negocio?
                    </span>
                    <input
                      className={entrada}
                      placeholder="Ej. Clínica del Sol"
                      value={nombreEmpresa}
                      onChange={(e) => {
                        setNombreEmpresa(e.target.value)
                        if (!slugManual) generarSlug(e.target.value)
                      }}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-lg font-semibold text-blanco">
                      ¿A qué se dedica?
                    </span>
                    <select
                      className={entrada}
                      value={rubroCodigo}
                      onChange={(e) => setRubroCodigo(e.target.value)}
                    >
                      {rubros.map((rubro) => (
                        <option key={rubro.codigo} value={rubro.codigo}>
                          {rubro.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1.5 block text-xs text-bruma/60">
                      Con esto preparamos tu Calenzia para tu rubro.
                    </span>
                  </label>

                  <div>
                    <span className="mb-2 block text-lg font-semibold text-blanco">
                      ¿Para cuántas personas es?
                    </span>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                      {OPCIONES_EQUIPO.map((opcion) => (
                        <button
                          key={opcion.valor}
                          type="button"
                          onClick={() => setEquipo(opcion.valor)}
                          className={`rounded-2xl border px-3 py-3 text-center transition-all ${
                            equipo === opcion.valor
                              ? 'border-cian/60 bg-cian/10 text-cian'
                              : 'border-blanco/10 bg-abisal/60 text-bruma hover:border-blanco/25'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{opcion.etiqueta}</span>
                          <span className="mt-0.5 block text-[11px] opacity-70">{opcion.ayuda}</span>
                        </button>
                      ))}
                    </div>
                    <span className="mt-1.5 block text-xs text-bruma/60">
                      Con esto sugerimos el plan inicial; lo ajustas en el
                      siguiente paso.
                    </span>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-lg font-semibold text-blanco">
                      ¿Cómo quieres que te encuentren tus clientes?
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-sm text-bruma/60">agenda.anayadev.cl/</span>
                      <input
                        className={entrada}
                        placeholder="clinica-del-sol"
                        value={slug}
                        onChange={(e) => {
                          setSlugManual(true)
                          setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                        }}
                      />
                    </div>
                    {slug && slugValido() && (
                      <span
                        className={`mt-1.5 block text-xs ${
                          estadoSlug === 'libre'
                            ? 'text-turquesa'
                            : estadoSlug === 'ocupado'
                              ? 'text-red-300'
                              : 'text-bruma/60'
                        }`}
                      >
                        {estadoSlug === 'comprobando' && 'Revisando disponibilidad…'}
                        {estadoSlug === 'libre' && 'Ese nombre está libre ✓'}
                        {estadoSlug === 'ocupado' && 'Ese nombre ya está en uso. Prueba con otro parecido.'}
                        {estadoSlug === null && 'El enlace donde tus clientes agendarán contigo.'}
                      </span>
                    )}
                    {slug && !slugValido() && (
                      <span className="mt-1.5 block text-xs text-red-300">
                        Solo letras minúsculas, números y guiones intermedios.
                      </span>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-lg font-semibold text-blanco">
                      ¿Eres una empresa o trabajas de forma independiente?
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { valor: 'empresa', etiqueta: 'Tengo una empresa' },
                        { valor: 'persona_natural', etiqueta: 'Trabajo por mi cuenta' },
                      ].map((opcion) => (
                        <button
                          key={opcion.valor}
                          type="button"
                          onClick={() => setTipoEntidad(opcion.valor)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${
                            tipoEntidad === opcion.valor
                              ? 'border-cian/60 bg-cian/10 text-cian'
                              : 'border-blanco/10 bg-abisal/60 text-bruma hover:border-blanco/25'
                          }`}
                        >
                          {opcion.etiqueta}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {paso === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-blanco">
                    Elige lo que necesitas hoy
                  </h2>
                  <p className="mt-1 text-sm text-bruma">
                    La agenda con reservas en línea viene incluida. Cuéntanos
                    qué más le hace sentido a tu negocio: puedes cambiarlo
                    cuando quieras.
                  </p>
                </div>

                <div className="space-y-3">
                  {preguntas.map((necesidad) => {
                    const activo = !!plan[necesidad.codigo]
                    return (
                      <button
                        key={necesidad.codigo}
                        type="button"
                        onClick={() => alternarPregunta(necesidad.codigo)}
                        className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all sm:p-5 ${
                          activo
                            ? 'border-cian/50 bg-cian/5 shadow-[0_0_26px_-14px_rgba(0,223,240,0.6)]'
                            : 'border-blanco/10 bg-abisal/60 hover:border-blanco/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-blanco">
                              {necesidad.etiqueta}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-bruma">
                              {necesidad.ayuda}
                            </p>
                          </div>
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                              activo
                                ? 'border-turquesa bg-turquesa/20 text-turquesa'
                                : 'border-blanco/25 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {extrasDisponibles.length > 0 && (
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                      Extras (opcionales)
                    </span>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {extrasDisponibles.map((modulo) => {
                        const activo = !!extras[modulo.codigo]
                        return (
                          <button
                            key={modulo.codigo}
                            type="button"
                            onClick={() => alternarExtra(modulo.codigo)}
                            className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                              activo
                                ? 'border-violeta/50 bg-violeta/5'
                                : 'border-blanco/10 bg-abisal/60 hover:border-blanco/25'
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                                activo
                                  ? 'border-violeta bg-violeta/25 text-violeta'
                                  : 'border-blanco/25 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-blanco">
                                {modulo.nombre}
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-bruma">
                                {modulo.descripcion}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-2xl border border-cian/30 bg-cian/5 px-5 py-4">
                  <span className="text-sm font-semibold text-bruma">Total mensual</span>
                  <span className="text-2xl font-bold texto-gradiente">
                    {totalFormateado}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={aplicarRecomendacion}
                  className="w-full rounded-2xl border border-dashed border-violeta/40 bg-violeta/5 px-4 py-3.5 text-sm font-semibold text-violeta transition-colors hover:bg-violeta/10"
                >
                  ¿No estás seguro? Te recomendamos lo esencial para tu equipo
                </button>
                <p className="text-xs leading-relaxed text-bruma/60">
                  Los límites de tu plan se ajustan al tamaño de tu equipo.
                  ¿Necesitas algo más especial?{' '}
                  <a href="/#contacto" className="font-semibold text-cian hover:text-turquesa">
                    Conversemos y lo armamos contigo
                  </a>
                  .
                </p>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-blanco">
                    ¿Quién estará a cargo de la cuenta?
                  </h2>
                  <p className="mt-1 text-sm text-bruma">
                    Es la persona que administrará la agenda y recibirá el
                    acceso. Puedes ser tú mismo.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                    Nombre completo
                  </span>
                  <input
                    className={entrada}
                    placeholder="Ej. Laura Rojas"
                    value={adminNombre}
                    onChange={(e) => setAdminNombre(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                    Correo
                  </span>
                  <input
                    type="email"
                    className={entrada}
                    placeholder="laura@clinicasol.cl"
                    value={adminCorreo}
                    onChange={(e) => setAdminCorreo(e.target.value)}
                  />
                  <span className="mt-1.5 block text-xs text-bruma/60">
                    Aquí te enviaremos el resumen de tu solicitud y tu acceso,
                    nada de spam.
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                    {paisActual?.etiqueta_id_fiscal ?? 'Identificador fiscal'}
                    {paisActual?.id_fiscal_obligatorio ? '' : ' (opcional)'}
                  </span>
                  <input
                    className={entrada}
                    placeholder={
                      paisActual?.iso === 'CL'
                        ? 'Ej. 76.543.210-K'
                        : `Ej. tu ${paisActual?.etiqueta_id_fiscal ?? 'ID'}`
                    }
                    value={idFiscal}
                    onChange={(e) => setIdFiscal(e.target.value)}
                  />
                  <span className="mt-1.5 block text-xs text-bruma/60">
                    Lo usamos para la facturación de tu plan.
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                    Teléfono (opcional)
                  </span>
                  <div className="flex items-center gap-2">
                    {paisActual && (
                      <span className="shrink-0 text-sm text-bruma/60">
                        {paisActual.prefijo_telefono}
                      </span>
                    )}
                    <input
                      className={entrada}
                      placeholder={
                        paisActual?.iso === 'CL' ? '9 1234 5678' : '(555) 123-4567'
                      }
                      value={adminTelefono}
                      onChange={(e) => setAdminTelefono(e.target.value)}
                    />
                  </div>
                </label>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-blanco">
                    Esto es lo que estás contratando
                  </h2>
                  <p className="mt-1 text-sm text-bruma">
                    Si algo no calza, puedes volver atrás y ajustarlo. Nuestro
                    equipo revisará el paquete y ajustará los límites a tu
                    equipo antes de activar.
                  </p>
                </div>

                <dl className="space-y-2.5 rounded-2xl bg-abisal/60 p-5 text-sm">
                  {[
                    ['Tu negocio', nombreEmpresa],
                    ['País', paisActual?.nombre ?? paisIso],
                    ['Rubro', rubros.find((r) => r.codigo === rubroCodigo)?.nombre ?? rubroCodigo],
                    [
                      'Equipo',
                      OPCIONES_EQUIPO.find((o) => o.valor === equipo)?.etiqueta ?? '—',
                    ],
                    ['Tu página', `agenda.anayadev.cl/${slug}`],
                    ['A cargo', `${adminNombre} · ${adminCorreo}`],
                  ].map(([clave, valor]) => (
                    <div key={clave} className="flex justify-between gap-4">
                      <dt className="shrink-0 text-bruma/70">{clave}</dt>
                      <dd className="text-right text-blanco">{valor}</dd>
                    </div>
                  ))}
                  <div className="border-t border-blanco/8 pt-2.5">
                    <dt className="text-bruma/70">Módulos incluidos</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5 text-right">
                      {nombresContratados.length === 0
                        ? '—'
                        : nombresContratados.map((nombre) => (
                            <span
                              key={nombre}
                              className="rounded-md border border-cian/25 bg-cian/5 px-2 py-0.5 text-[11px] font-medium text-cian"
                            >
                              {nombre}
                            </span>
                          ))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-blanco/8 pt-2.5">
                    <dt className="text-bruma/70">Total mensual</dt>
                    <dd className="text-right font-semibold text-blanco">
                      {totalFormateado}
                    </dd>
                  </div>
                </dl>

                {compraPendiente && (
                  <p className="rounded-xl border border-blanco/10 bg-abisal/60 px-4 py-3 text-xs leading-relaxed text-bruma">
                    Al enviar, te mandamos un correo con todo lo que quedó
                    registrado. Nuestro equipo confirma contigo el paquete
                    final y coordina la activación y el pago. No pagas nada
                    ahora.
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-blanco/8 pt-5">
              <button
                type="button"
                onClick={() => setPaso((p) => Math.max(0, p - 1))}
                disabled={paso === 0}
                className="rounded-full border border-blanco/15 px-6 py-3 text-sm font-semibold text-bruma transition-colors hover:border-cian/50 hover:text-cian disabled:opacity-40"
              >
                ← Atrás
              </button>
              {paso < 3 ? (
                <button
                  type="button"
                  disabled={!puedeAvanzar()}
                  onClick={() => setPaso((p) => p + 1)}
                  className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar →
                </button>
              ) : compraPendiente ? (
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => void finalizar()}
                  className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando ? 'Enviando…' : 'Enviar mi solicitud'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => void crearPedido()}
                  className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando ? 'Preparando…' : 'Revisar solicitud →'}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-bruma/60">
          ¿Tienes dudas antes de enviar? Escríbenos a{' '}
          <a href="mailto:hola@anayadev.cl" className="text-cian hover:text-turquesa">
            hola@anayadev.cl
          </a>{' '}
          o usa el chat de la esquina.
        </p>
      </main>
    </div>
  )
}
