import { useEffect, useMemo, useState } from 'react'
import { FondoCircuito } from '../componentes/FondoCircuito'
import { Marca } from '../componentes/Marca'
import { api } from '../lib/api'
import { formatearMonto } from '../lib/paises'
import type {
  Compra,
  Pais,
  PlanCatalogoPublico,
  PlanSimular,
  PlanSimularRequest,
  PlanTramoPublico,
} from '../lib/tipos'
import {
  TELEFONO_DIGITOS_POR_PAIS,
  formatearRut,
  formatearTelefono,
  validarRut,
  validarTelefono,
} from '../lib/validaciones'

const PASOS = ['Tu plan', 'Tu negocio', 'Tu cuenta']

const entrada =
  'w-full rounded-xl border border-blanco/12 bg-abisal/80 px-4 py-3 text-sm text-blanco outline-none transition-colors placeholder:text-bruma/40 focus:border-cian/50 focus:ring-1 focus:ring-cian/30'

const MAX_TRABAJADORES = 5000
const PAIS_FIJO = 'CL'

const TEXTO_PERSONALIZADO =
  'Todo lo de abajo ya viene incluido. Suma solo lo que necesites y verás el total al instante.'

function numeroTrabajadoresValido(texto: string): number | null {
  const valor = texto.trim()
  if (!/^\d+$/.test(valor)) return null
  const numero = parseInt(valor, 10)
  return numero >= 1 && numero <= MAX_TRABAJADORES ? numero : null
}

function etiquetaEquipo(nroTrabajadores: number): string {
  return `${nroTrabajadores} ${nroTrabajadores === 1 ? 'persona' : 'personas'}`
}

function periodoDe(sim: PlanSimular): {
  meses: number
  totalPeriodo: number
  totalMensual: number
} {
  const meses = sim.meses ?? 1
  return {
    meses,
    totalPeriodo: sim.total_periodo ?? sim.total,
    totalMensual: sim.total,
  }
}

function textoMeses(meses: number): string {
  return meses === 1 ? '1 mes' : `${meses} meses`
}

function tramoPara(
  nroTrabajadores: number,
  tramos: PlanTramoPublico[],
): PlanTramoPublico | undefined {
  const ordenados = [...tramos].sort((a, b) => a.min_trabajadores - b.min_trabajadores)
  return (
    ordenados.find(
      (t) =>
        nroTrabajadores >= t.min_trabajadores &&
        (t.max_trabajadores === null || nroTrabajadores <= t.max_trabajadores),
    ) ?? ordenados[0]
  )
}

function leerHandoff(): {
  plan: string | null
  trabajadores: string | null
  periodicidad: string | null
  addons: string[]
} {
  if (typeof window === 'undefined') {
    return { plan: null, trabajadores: null, periodicidad: null, addons: [] }
  }
  const params = new URLSearchParams(window.location.search)
  const addons = (params.get('addons') || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
  return {
    plan: params.get('plan'),
    trabajadores: params.get('trabajadores'),
    periodicidad: params.get('periodicidad'),
    addons,
  }
}

export function PaginaCompra() {
  const handoff = useMemo(leerHandoff, [])

  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([])
  const [paises, setPaises] = useState<Pais[]>([])
  const [planes, setPlanes] = useState<PlanCatalogoPublico | null>(null)
  const [cargando, setCargando] = useState(true)
  const [paso, setPaso] = useState(0)

  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [estadoSlug, setEstadoSlug] = useState<'comprobando' | 'libre' | 'ocupado' | null>(null)
  const [rubroCodigo, setRubroCodigo] = useState('')
  const [nroTrabajadores, setNroTrabajadores] = useState(handoff.trabajadores ?? '1')

  const [adminNombre, setAdminNombre] = useState('')
  const [adminCorreo, setAdminCorreo] = useState('')
  const [adminTelefono, setAdminTelefono] = useState('')
  const [mostrarFiscal, setMostrarFiscal] = useState(false)
  const [idFiscal, setIdFiscal] = useState('')

  const [planSeleccion, setPlanSeleccion] = useState<string | null>(
    handoff.plan && handoff.plan !== 'null' ? handoff.plan : null,
  )
  const [periodicidad, setPeriodicidad] = useState(handoff.periodicidad ?? 'mensual')
  const [addons, setAddons] = useState<string[]>(handoff.addons)
  const [simulaciones, setSimulaciones] = useState<Record<string, PlanSimular | null>>({})
  const [simulando, setSimulando] = useState(false)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<Compra | null>(null)

  useEffect(() => {
    api
      .checkoutCatalogo()
      .then((datos) => {
        setRubros(datos.rubros)
        setPaises(datos.paises ?? [])
        if (datos.rubros.length > 0) setRubroCodigo(datos.rubros[0].codigo)
      })
      .catch(() => setError('No pudimos cargar el catálogo. Recarga la página.'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    let activo = true
    api
      .planesCatalogo(PAIS_FIJO)
      .then((datos) => {
        if (activo) setPlanes(datos)
      })
      .catch(() => {
        if (activo) setError('No pudimos cargar los planes. Recarga la página.')
      })
    return () => {
      activo = false
    }
  }, [])

  // Valida el handoff contra el catálogo real.
  useEffect(() => {
    if (!planes) return
    const addonsValidos = new Set(
      planes.funciones.filter((f) => f.tipo === 'addon').map((f) => f.codigo),
    )
    setPlanSeleccion((prev) =>
      prev && prev !== 'personalizado' && !planes.planes.some((p) => p.codigo === prev)
        ? null
        : prev,
    )
    setPeriodicidad((prev) =>
      planes.periodicidades.some((p) => p.codigo === prev)
        ? prev
        : (planes.periodicidades[0]?.codigo ?? 'mensual'),
    )
    setAddons((prev) => prev.filter((a) => addonsValidos.has(a)))
  }, [planes])

  const paisActual = paises.find((p) => p.iso === PAIS_FIJO) ?? null
  const trabajadoresValidos = numeroTrabajadoresValido(nroTrabajadores)
  const equipoEtiqueta = trabajadoresValidos === null ? '—' : etiquetaEquipo(trabajadoresValidos)

  const periodicidadActual = planes?.periodicidades.find((p) => p.codigo === periodicidad)

  // La MISMA tupla se usa para simular y para enviar al webhook.
  function seleccion(): PlanSimularRequest {
    const planCodigo = planSeleccion === 'personalizado' ? null : planSeleccion
    return {
      plan_codigo: planCodigo,
      addons: planSeleccion === 'personalizado' ? [...addons].sort() : [],
      nro_trabajadores: trabajadoresValidos ?? 1,
      periodicidad_codigo: periodicidad,
      pais_iso: PAIS_FIJO,
    }
  }

  // Simula Básico y Premium (precios/totales del servidor) al cambiar
  // personas o periodicidad.
  useEffect(() => {
    if (trabajadoresValidos === null) {
      setSimulaciones({})
      setSimulando(false)
      return
    }
    let activo = true
    setSimulando(true)
    const temporizador = setTimeout(() => {
      Promise.all([
        api.simularPlan({
          plan_codigo: 'basico',
          addons: [],
          nro_trabajadores: trabajadoresValidos,
          periodicidad_codigo: periodicidad,
          pais_iso: PAIS_FIJO,
        }),
        api.simularPlan({
          plan_codigo: 'premium',
          addons: [],
          nro_trabajadores: trabajadoresValidos,
          periodicidad_codigo: periodicidad,
          pais_iso: PAIS_FIJO,
        }),
      ])
        .then(([basico, premium]) => {
          if (activo) {
            setSimulaciones((prev) => ({ ...prev, basico, premium }))
            setError('')
          }
        })
        .catch(() => {
          if (activo) setError('No pudimos calcular los planes. Revisa la conexión.')
        })
        .finally(() => {
          if (activo) setSimulando(false)
        })
    }, 250)
    return () => {
      activo = false
      clearTimeout(temporizador)
    }
  }, [nroTrabajadores, periodicidad, trabajadoresValidos])

  // Simula Personalizado (base + add-ons elegidos).
  useEffect(() => {
    if (trabajadoresValidos === null) return
    let activo = true
    const temporizador = setTimeout(() => {
      api
        .simularPlan({
          plan_codigo: null,
          addons: [...addons].sort(),
          nro_trabajadores: trabajadoresValidos,
          periodicidad_codigo: periodicidad,
          pais_iso: PAIS_FIJO,
        })
        .then((personalizado) => {
          if (activo) setSimulaciones((prev) => ({ ...prev, personalizado }))
        })
        .catch(() => {
          if (activo) setSimulaciones((prev) => ({ ...prev, personalizado: null }))
        })
    }, 250)
    return () => {
      activo = false
      clearTimeout(temporizador)
    }
  }, [nroTrabajadores, periodicidad, addons, trabajadoresValidos])

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [paso])

  const tramoActual =
    simulaciones.basico?.tramo_codigo ??
    (planes && trabajadoresValidos !== null
      ? tramoPara(trabajadoresValidos, planes.tramos)?.codigo
      : undefined)

  const simulacionActual =
    (planSeleccion === 'personalizado'
      ? simulaciones.personalizado
      : planSeleccion
        ? simulaciones[planSeleccion]
        : null) ?? null

  function precioAddon(codigo: string): number | null {
    const funcion = planes?.funciones.find((f) => f.codigo === codigo)
    const precio = funcion?.precios.find((x) => x.tramo_codigo === tramoActual)
    return precio ? precio.precio_persona : null
  }

  function alternarAddon(codigo: string) {
    setAddons((prev) =>
      prev.includes(codigo) ? prev.filter((a) => a !== codigo) : [...prev, codigo],
    )
  }

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
        planSeleccion !== null &&
        trabajadoresValidos !== null &&
        simulacionActual !== null
      )
    }
    if (paso === 1) {
      return (
        nombreEmpresa.trim().length > 0 &&
        slugValido() &&
        estadoSlug !== 'ocupado' &&
        rubroCodigo.length > 0
      )
    }
    if (paso === 2) {
      const correoValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminCorreo.trim())
      const rutOk =
        !mostrarFiscal || idFiscal.trim() === '' || validarRut(idFiscal)
      const telefonoOk =
        adminTelefono.trim() === '' ||
        validarTelefono(adminTelefono, PAIS_FIJO)
      return (
        adminNombre.trim().length > 0 &&
        correoValido &&
        rutOk &&
        telefonoOk
      )
    }
    return true
  }

  async function enviarSolicitud() {
    setError('')
    setEnviando(true)
    try {
      const trabajadores = trabajadoresValidos
      if (trabajadores === null || planSeleccion === null || simulacionActual === null) {
        throw new Error('Completa tu plan antes de enviar.')
      }
      const sel = seleccion()
      const edicion = sel.plan_codigo === 'premium' ? 'con_ia' : 'comunicacion'
      const compra = await api.crearCompra({
        slug,
        nombre_empresa: nombreEmpresa,
        tipo_entidad: 'empresa',
        rubro_codigo: rubroCodigo,
        pais: PAIS_FIJO,
        equipo_personas: etiquetaEquipo(trabajadores),
        admin_nombre: adminNombre,
        admin_correo: adminCorreo,
        admin_telefono: adminTelefono || null,
        id_fiscal: mostrarFiscal && idFiscal.trim() ? idFiscal : null,
        necesidades: [],
        modulos_extra: [],
        edicion,
        nro_trabajadores: trabajadores,
        respuestas: { responde_fuera_de_horario: edicion === 'con_ia' },
        plan_codigo: sel.plan_codigo,
        periodicidad_codigo: sel.periodicidad_codigo,
        addons: sel.addons,
      })
      const enviada = await api.enviarSolicitud(compra.id)
      setResultado(enviada)
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
          {!fallo && resultado.datos.total_monto && (
            <p className="mt-2 text-sm text-bruma/70">
              Pago del período
              {resultado.datos.meses && resultado.datos.meses > 1
                ? ` (${textoMeses(resultado.datos.meses)})`
                : ''}
              :{' '}
              <span className="text-blanco">{resultado.datos.total_monto}</span>
              {resultado.datos.total_mensual_monto
                ? ` · equivale a ${resultado.datos.total_mensual_monto} / mes`
                : ''}
            </p>
          )}
          {!fallo && resultado.datos.calenzia?.token && (
            <p className="mt-2 text-sm text-bruma/70">
              Guarda el enlace para seguir tu solicitud:{' '}
              <a
                href={`/mi-solicitud/${resultado.datos.calenzia.token}`}
                className="font-semibold text-cian hover:text-turquesa"
              >
                ver mi solicitud
              </a>
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

  const planNombre =
    planSeleccion === 'personalizado'
      ? 'Personalizado'
      : planes?.planes.find((p) => p.codigo === planSeleccion)?.nombre ?? '—'
  const addonsTxt =
    (planSeleccion === 'personalizado' ? addons : [])
      .map((codigo) => planes?.funciones.find((f) => f.codigo === codigo)?.nombre ?? codigo)
      .join(', ') || '—'
  const funcionesBase = (planes?.funciones ?? []).filter((f) => f.tipo === 'base')
  const funcionesAddon = (planes?.funciones ?? []).filter((f) => f.tipo === 'addon')
  const personalizadoPeriodo = simulaciones.personalizado
    ? periodoDe(simulaciones.personalizado)
    : null
  const periodoActual = simulacionActual ? periodoDe(simulacionActual) : null

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
            Elige tu plan y déjanos tus datos. Por ahora Calenzia está disponible en Chile.
          </p>
        </div>

        <ol className="mt-10 flex items-center justify-center gap-1 sm:gap-2">
          {PASOS.map((etiqueta, i) => (
            <li key={etiqueta} className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={i >= paso}
                onClick={() => setPaso(i)}
                title={i < paso ? `Volver a ${etiqueta}` : undefined}
                aria-label={i < paso ? `Volver a ${etiqueta}` : etiqueta}
                className={`group flex items-center gap-1 sm:gap-2 ${
                  i < paso ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                    i < paso
                      ? 'border-turquesa/50 bg-turquesa/10 text-turquesa group-hover:border-turquesa group-hover:bg-turquesa/25'
                      : i === paso
                        ? 'border-cian/60 bg-cian/10 text-cian'
                        : 'border-blanco/15 text-bruma/60'
                  }`}
                >
                  {i < paso ? '✓' : i + 1}
                </span>
                <span
                  className={`hidden text-xs font-semibold sm:block ${
                    i === paso
                      ? 'text-blanco'
                      : i < paso
                        ? 'text-bruma/70 underline-offset-4 group-hover:text-cian group-hover:underline'
                        : 'text-bruma/60'
                  }`}
                >
                  {etiqueta}
                </span>
              </button>
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-blanco">Elige tu plan</h2>
                  <p className="mt-1 text-sm text-bruma">
                    Primero dinos cuántas personas atienden: eso fija el tramo y el
                    total de cada plan.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-base font-semibold text-blanco">
                    ¿Cuántas personas atienden?
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={MAX_TRABAJADORES}
                      inputMode="numeric"
                      className={`${entrada} max-w-40 text-lg`}
                      placeholder="1"
                      value={nroTrabajadores}
                      onChange={(e) => setNroTrabajadores(e.target.value)}
                    />
                    <span className="text-sm text-bruma/70">
                      {trabajadoresValidos === null
                        ? 'Escribe un número entero (mínimo 1).'
                        : `Tramo: ${tramoActual ?? '—'}`}
                    </span>
                  </div>
                </label>

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                    Periodicidad
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(planes?.periodicidades ?? []).map((p) => (
                      <button
                        key={p.codigo}
                        type="button"
                        onClick={() => setPeriodicidad(p.codigo)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                          periodicidad === p.codigo
                            ? 'border-cian/60 bg-cian/10 text-cian'
                            : 'border-blanco/15 text-bruma hover:border-blanco/30'
                        }`}
                      >
                        {p.nombre}
                        {p.descuento_pct !== 0 && (
                          <span className="ml-1 text-turquesa">
                            −{Math.abs(p.descuento_pct)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-bruma/60">
                    El descuento ya está en el precio mensual. Pagas el período completo
                    por adelantado, en un solo pago.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(planes?.planes ?? []).map((plan) => {
                    const sim = simulaciones[plan.codigo]
                    const periodo = sim ? periodoDe(sim) : null
                    const activo = planSeleccion === plan.codigo
                    return (
                      <button
                        key={plan.codigo}
                        type="button"
                        onClick={() => setPlanSeleccion(plan.codigo)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          activo
                            ? 'border-cian/60 bg-cian/10 shadow-[0_0_26px_-14px_rgba(0,223,240,0.6)]'
                            : 'border-blanco/10 bg-abisal/60 hover:border-blanco/25'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-blanco">
                            {plan.nombre}
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                              activo
                                ? 'border-turquesa bg-turquesa/20 text-turquesa'
                                : 'border-blanco/25 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </span>
                        {plan.descripcion && (
                          <span className="mt-1 block text-xs leading-relaxed text-bruma">
                            {plan.descripcion}
                          </span>
                        )}
                        <span className="mt-2 block text-xs font-semibold text-cian">
                          {sim
                            ? `${formatearMonto(paisActual, sim.precio_persona)} / persona / mes`
                            : 'Calculando…'}
                        </span>
                        <span className="mt-0.5 block text-sm font-bold text-blanco">
                          {periodo
                            ? `Pagas ${formatearMonto(paisActual, periodo.totalPeriodo)} por ${textoMeses(periodo.meses)}`
                            : '—'}
                        </span>
                        {sim && periodo && (
                          <span className="mt-1 block text-[11px] text-bruma/60">
                            {formatearMonto(paisActual, periodo.totalMensual)} / mes ·{' '}
                            {formatearMonto(paisActual, sim.precio_persona)} ×{' '}
                            {sim.nro_trabajadores}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setPlanSeleccion('personalizado')}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      planSeleccion === 'personalizado'
                        ? 'border-cian/60 bg-cian/10 shadow-[0_0_26px_-14px_rgba(0,223,240,0.6)]'
                        : 'border-blanco/10 bg-abisal/60 hover:border-blanco/25'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-blanco">Personalizado</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                          planSeleccion === 'personalizado'
                            ? 'border-turquesa bg-turquesa/20 text-turquesa'
                            : 'border-blanco/25 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-bruma">
                      Base Básico + los add-ons que elijas.
                    </span>
                    <span className="mt-2 block text-sm font-bold text-blanco">
                      {personalizadoPeriodo
                        ? `Pagas ${formatearMonto(paisActual, personalizadoPeriodo.totalPeriodo)} por ${textoMeses(personalizadoPeriodo.meses)}`
                        : 'Calculando…'}
                    </span>
                    {personalizadoPeriodo && (
                      <span className="mt-0.5 block text-[11px] text-bruma/60">
                        {formatearMonto(paisActual, personalizadoPeriodo.totalMensual)} / mes
                      </span>
                    )}
                  </button>
                </div>

                {planSeleccion === 'personalizado' && (
                  <div className="space-y-4">
                    <p className="rounded-xl border border-cian/25 bg-cian/5 px-4 py-3 text-sm leading-relaxed text-bruma">
                      {TEXTO_PERSONALIZADO}
                    </p>

                    <div>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                        Ya incluido en la base
                      </span>
                      <ul className="space-y-1.5">
                        {funcionesBase.map((f) => (
                          <li key={f.codigo} className="text-sm">
                            <span className="font-semibold text-blanco">{f.nombre}</span>
                            {f.descripcion && (
                              <span className="block text-xs text-bruma/70">
                                {f.descripcion}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                        Suma lo que necesites
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {funcionesAddon.map((f) => {
                          const activo = addons.includes(f.codigo)
                          const precio = precioAddon(f.codigo)
                          return (
                            <button
                              key={f.codigo}
                              type="button"
                              onClick={() => alternarAddon(f.codigo)}
                              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                                activo
                                  ? 'border-cian/50 bg-cian/5'
                                  : 'border-blanco/10 bg-abisal/60 hover:border-blanco/25'
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                                  activo
                                    ? 'border-turquesa bg-turquesa/20 text-turquesa'
                                    : 'border-blanco/25 text-transparent'
                                }`}
                              >
                                ✓
                              </span>
                              <span className="flex-1">
                                <span className="flex items-baseline justify-between gap-2">
                                  <span className="text-sm font-semibold text-blanco">
                                    {f.nombre}
                                  </span>
                                  {precio !== null && (
                                    <span className="shrink-0 text-xs font-semibold text-cian">
                                      {formatearMonto(paisActual, precio)} / persona
                                    </span>
                                  )}
                                </span>
                                {f.descripcion && (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-bruma/70">
                                    {f.descripcion}
                                  </span>
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-cian/30 bg-cian/5 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <span className="block text-sm font-semibold text-bruma">
                        Pago del período{' '}
                        {periodicidadActual ? `(${periodicidadActual.nombre})` : ''}
                      </span>
                      <span className="block text-xs text-bruma/60">
                        para {equipoEtiqueta}
                        {simulacionActual
                          ? ` · ${formatearMonto(paisActual, simulacionActual.precio_persona)} / persona`
                          : ''}
                        {simulacionActual && simulacionActual.descuento_pct !== 0
                          ? ` · ${simulacionActual.descuento_pct}% por periodicidad`
                          : ''}
                      </span>
                    </div>
                    <span className="text-right text-xl font-bold texto-gradiente sm:text-2xl">
                      {simulando
                        ? '…'
                        : periodoActual
                          ? `Pagas ${formatearMonto(paisActual, periodoActual.totalPeriodo)} por ${textoMeses(periodoActual.meses)}`
                          : '—'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-bruma/60">
                    Un solo pago por adelantado
                    {periodoActual && periodoActual.meses > 1
                      ? `: cubre ${textoMeses(periodoActual.meses)} de servicio, sin cobros mensuales durante ese período.`
                      : '.'}{' '}
                    {periodoActual
                      ? `Equivale a ${formatearMonto(paisActual, periodoActual.totalMensual)} / mes; el descuento por periodicidad ya está incluido.`
                      : ''}
                  </p>
                </div>
              </div>
            )}

            {paso === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-blanco">Tu negocio</h2>
                  <p className="mt-1 text-sm text-bruma">
                    Con esto preparamos tu Calenzia. El país es Chile.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-base font-semibold text-blanco">
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
                  <span className="mb-1.5 block text-base font-semibold text-blanco">
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
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-base font-semibold text-blanco">
                    Tu página
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
                      {estadoSlug === null && 'Lo sugerimos desde el nombre; puedes cambiarlo.'}
                    </span>
                  )}
                  {slug && !slugValido() && (
                    <span className="mt-1.5 block text-xs text-red-300">
                      Solo letras minúsculas, números y guiones intermedios.
                    </span>
                  )}
                </label>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-blanco">Tu cuenta</h2>
                  <p className="mt-1 text-sm text-bruma">
                    La persona que administrará la agenda y recibirá el acceso.
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
                    Aquí te enviaremos el resumen y tu acceso, nada de spam.
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
                      placeholder="9 1234 5678"
                      value={adminTelefono}
                      onChange={(e) =>
                        setAdminTelefono(formatearTelefono(e.target.value, PAIS_FIJO))
                      }
                    />
                  </div>
                  {adminTelefono.trim() !== '' &&
                    !validarTelefono(adminTelefono, PAIS_FIJO) && (
                      <span className="mt-1.5 block text-xs text-red-300">
                        El teléfono debe tener{' '}
                        {TELEFONO_DIGITOS_POR_PAIS[PAIS_FIJO] ?? 'entre 6 y 15'} dígitos.
                      </span>
                    )}
                </label>

                <div className="rounded-2xl border border-blanco/10 bg-abisal/60">
                  <button
                    type="button"
                    onClick={() => setMostrarFiscal((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-blanco">
                      Datos de facturación (opcional)
                    </span>
                    <span className="text-xs text-bruma/60">
                      {mostrarFiscal ? 'Ocultar' : 'Agregar'}
                    </span>
                  </button>
                  {mostrarFiscal && (
                    <div className="space-y-2 border-t border-blanco/10 px-4 py-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-bruma/70">
                          RUT
                        </span>
                        <input
                          className={entrada}
                          placeholder="Ej. 12.345.678-5"
                          value={idFiscal}
                          onChange={(e) => setIdFiscal(formatearRut(e.target.value))}
                        />
                        {idFiscal.trim() !== '' && !validarRut(idFiscal) && (
                          <span className="mt-1 block text-xs text-red-300">
                            El RUT no es válido. Revisa los dígitos y el dígito verificador.
                          </span>
                        )}
                      </label>
                      <p className="text-xs leading-relaxed text-bruma/60">
                        Puedes dejarlo para después: lo pedimos al activar tu cuenta.
                      </p>
                    </div>
                  )}
                </div>

                <dl className="space-y-2.5 rounded-2xl bg-abisal/60 p-5 text-sm">
                  {[
                    ['Negocio', nombreEmpresa],
                    ['Rubro', rubros.find((r) => r.codigo === rubroCodigo)?.nombre ?? rubroCodigo],
                    ['Tu página', `agenda.anayadev.cl/${slug}`],
                    ['Personas', equipoEtiqueta],
                    ['Plan', planNombre],
                    ['Periodicidad', periodicidadActual?.nombre ?? periodicidad],
                    ['Add-ons', addonsTxt],
                    ['A cargo', `${adminNombre} · ${adminCorreo}`],
                  ].map(([clave, valor]) => (
                    <div key={clave} className="flex justify-between gap-4">
                      <dt className="shrink-0 text-bruma/70">{clave}</dt>
                      <dd className="text-right text-blanco">{valor}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-t border-blanco/8 pt-2.5">
                    <dt className="text-bruma/70">Pago del período</dt>
                    <dd className="text-right font-semibold text-blanco">
                      {periodoActual
                        ? `${formatearMonto(paisActual, periodoActual.totalPeriodo)} · ${textoMeses(periodoActual.meses)}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-bruma/70">Equivalente mensual</dt>
                    <dd className="text-right text-blanco">
                      {periodoActual
                        ? `${formatearMonto(paisActual, periodoActual.totalMensual)} / mes`
                        : '—'}
                    </dd>
                  </div>
                  {periodoActual && periodoActual.meses > 1 && (
                    <p className="pt-1 text-xs text-bruma/60">
                      Un solo pago por adelantado; cubre {textoMeses(periodoActual.meses)}.
                    </p>
                  )}
                </dl>
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
              {paso < 2 ? (
                <button
                  type="button"
                  disabled={!puedeAvanzar()}
                  onClick={() => setPaso((p) => p + 1)}
                  className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => void enviarSolicitud()}
                  className="rounded-full bg-gradient-to-r from-violeta via-electrica to-cian px-7 py-3 text-sm font-semibold text-blanco transition-all hover:shadow-[0_0_30px_-8px_rgba(0,223,240,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando ? 'Enviando…' : 'Enviar mi solicitud'}
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
