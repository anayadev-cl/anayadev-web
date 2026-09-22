import re
import unicodedata
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from .. import calenzia as integracion_calenzia
from .. import paises as catalogo_paises
from ..bd import get_sesion
from ..config import ajustes
from ..correo import enviar_correo_cliente, enviar_correo_compra, enviar_correo_contacto
from ..esquemas import (
    ChatbotPeticion,
    ChatbotRespuesta,
    CompraPeticion,
    CompraRespuesta,
    ContactoPeticion,
    ContactoRespuesta,
)
from ..limites import permitido
from ..modelos import (
    Ajuste,
    Compra,
    MensajeContacto,
    NecesidadCheckout,
    Producto,
    RespuestaChatbot,
    RubroCheckout,
    Seccion,
)
from ..webhook import enviar_webhook_onboarding, total_modulos

router = APIRouter()

EXTENSIONES_PERMITIDAS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"}


def _url_calenzia(sesion: Session) -> str | None:
    ajuste = sesion.query(Ajuste).filter(Ajuste.clave == "calenzia_api_url").first()
    valor = (ajuste.valor if ajuste else "").strip()
    return valor or (ajustes.calenzia_api_url or "").strip() or None


def _url_paises(valores: dict[str, str]) -> str | None:
    return (valores.get("calenzia_paises_url") or "").strip() or (
        ajustes.calenzia_paises_url or ""
    ).strip() or None


def _url_precios(valores: dict[str, str]) -> str | None:
    return (valores.get("calenzia_precios_url") or "").strip() or (
        ajustes.calenzia_precios_url or ""
    ).strip() or None


def _rubros_para_checkout(sesion: Session) -> list[dict]:
    url = _url_calenzia(sesion)
    if url:
        rubros = integracion_calenzia.obtener_rubros(url)
        if rubros:
            return rubros
    return [
        {"codigo": r.codigo, "nombre": r.nombre}
        for r in sesion.query(RubroCheckout)
        .filter(RubroCheckout.activo.is_(True))
        .order_by(RubroCheckout.orden, RubroCheckout.id)
        .all()
    ]


def _normalizar(texto: str) -> str:
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return sin_acentos.lower().strip()


@router.get("/contenido")
def contenido_publico(sesion: Session = Depends(get_sesion)):
    secciones = (
        sesion.query(Seccion)
        .filter(Seccion.visible.is_(True))
        .order_by(Seccion.orden, Seccion.id)
        .all()
    )
    productos = (
        sesion.query(Producto)
        .filter(Producto.visible.is_(True))
        .order_by(Producto.orden, Producto.id)
        .all()
    )
    ajustes = {a.clave: a.valor for a in sesion.query(Ajuste).all()}
    return {
        "secciones": [
            {
                "id": s.id,
                "slug": s.slug,
                "tipo": s.tipo,
                "titulo": s.titulo,
                "subtitulo": s.subtitulo,
                "texto": s.texto,
                "imagen_url": s.imagen_url,
                "datos": s.datos or {},
                "orden": s.orden,
                "visible": s.visible,
            }
            for s in secciones
        ],
        "productos": [
            {
                "id": p.id,
                "slug": p.slug,
                "nombre": p.nombre,
                "eslogan": p.eslogan,
                "descripcion": p.descripcion,
                "estado": p.estado,
                "caracteristicas": p.caracteristicas or [],
                "imagen_url": p.imagen_url,
                "url": p.url,
                "orden": p.orden,
                "visible": p.visible,
            }
            for p in productos
        ],
        "ajustes": ajustes,
    }


@router.post("/contacto", response_model=ContactoRespuesta, status_code=201)
def recibir_contacto(
    cuerpo: ContactoPeticion,
    peticion: Request,
    sesion: Session = Depends(get_sesion),
):
    ip = peticion.client.host if peticion.client else "desconocida"
    if cuerpo.sitio_web.strip():
        raise HTTPException(422, "El mensaje no es válido")
    if not permitido(f"contacto:{ip}", 4, 600):
        raise HTTPException(429, "Demasiados mensajes. Intenta más tarde.")

    nombre = cuerpo.nombre.strip()
    correo = cuerpo.correo.strip()
    mensaje = cuerpo.mensaje.strip()

    if not nombre:
        raise HTTPException(422, "El nombre es obligatorio")
    if len(nombre) > 200:
        raise HTTPException(422, "El nombre es demasiado largo")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", correo) or len(correo) > 300:
        raise HTTPException(422, "El correo no es válido")
    if not mensaje:
        raise HTTPException(422, "El mensaje es obligatorio")
    if len(mensaje) > 4000:
        raise HTTPException(422, "El mensaje es demasiado largo")

    registro = MensajeContacto(nombre=nombre, correo=correo, mensaje=mensaje)
    sesion.add(registro)
    sesion.commit()
    sesion.refresh(registro)

    enviar_correo_contacto(nombre, correo, mensaje)
    return ContactoRespuesta(estado="recibido", id=registro.id)


@router.post("/chatbot", response_model=ChatbotRespuesta)
def responder_chatbot(
    cuerpo: ChatbotPeticion,
    peticion: Request,
    sesion: Session = Depends(get_sesion),
):
    ip = peticion.client.host if peticion.client else "desconocida"
    if not permitido(f"chatbot:{ip}", 40, 300):
        raise HTTPException(429, "Demasiados mensajes. Espera un momento.")

    mensaje = _normalizar(cuerpo.mensaje)
    if not mensaje:
        raise HTTPException(422, "El mensaje está vacío")

    reglas = (
        sesion.query(RespuestaChatbot)
        .filter(RespuestaChatbot.activo.is_(True))
        .order_by(RespuestaChatbot.orden, RespuestaChatbot.id)
        .all()
    )

    mejor: RespuestaChatbot | None = None
    mejor_coincidencias = 0
    for regla in reglas:
        claves = [
            _normalizar(c)
            for c in re.split(r"[,\n]", regla.palabras_clave)
            if c.strip()
        ]
        coincidencias = sum(1 for c in claves if c and c in mensaje)
        if coincidencias > mejor_coincidencias:
            mejor = regla
            mejor_coincidencias = coincidencias

    if mejor is None:
        fallback = (
            sesion.query(Ajuste).filter(Ajuste.clave == "chatbot_fallback").first()
        )
        return ChatbotRespuesta(
            respuesta=fallback.valor
            if fallback and fallback.valor
            else "Todavía estoy aprendiendo. Escríbenos por el formulario de contacto y te respondemos pronto."
        )

    return ChatbotRespuesta(
        respuesta=mejor.respuesta, sugerencias=mejor.sugerencias or []
    )


@router.post("/chatbot/adjunto", response_model=ChatbotRespuesta)
async def chatbot_con_adjunto(
    peticion: Request,
    mensaje: str = Form(default=""),
    correo: str = Form(default=""),
    sitio_web: str = Form(default=""),
    archivo: UploadFile | None = File(default=None),
    sesion: Session = Depends(get_sesion),
):
    ip = peticion.client.host if peticion.client else "desconocida"
    if sitio_web.strip():
        raise HTTPException(422, "El mensaje no es válido")
    if not permitido(f"chatbot-adjunto:{ip}", 6, 600):
        raise HTTPException(429, "Demasiados mensajes. Intenta más tarde.")

    texto = mensaje.strip()
    correo_limpio = correo.strip()
    if correo_limpio and not re.match(
        r"^[^@\s]+@[^@\s]+\.[^@\s]+$", correo_limpio
    ):
        raise HTTPException(422, "El correo no es válido")

    ruta_adjunto = None
    nombre_archivo = None
    if archivo is not None and archivo.filename:
        extension = Path(archivo.filename or "").suffix.lower()
        if extension not in EXTENSIONES_PERMITIDAS:
            raise HTTPException(422, "Formato de archivo no permitido")
        contenido = await archivo.read()
        if len(contenido) > 10 * 1024 * 1024:
            raise HTTPException(422, "El archivo supera los 10 MB")
        nombre_archivo = archivo.filename
        nombre = f"{uuid4().hex[:10]}{extension}"
        ajustes.directorio_uploads.mkdir(parents=True, exist_ok=True)
        (ajustes.directorio_uploads / nombre).write_bytes(contenido)
        ruta_adjunto = f"/media/{nombre}"

    detalle = texto if texto else "(solo adjunto)"
    if ruta_adjunto:
        detalle = f"{detalle}\nAdjunto: {nombre_archivo} ({ruta_adjunto})"

    registro = MensajeContacto(
        nombre="Chat del sitio",
        correo=correo_limpio or "sin correo",
        mensaje=detalle,
    )
    sesion.add(registro)
    sesion.commit()
    sesion.refresh(registro)
    enviar_correo_contacto("Chat del sitio", correo_limpio or "sin correo", detalle)

    if correo_limpio:
        respuesta = (
            "¡Recibido! Tu mensaje" + (" y tu archivo" if ruta_adjunto else "")
            + f" quedaron con nuestro equipo. Te responderemos a {correo_limpio}."
        )
    else:
        respuesta = (
            "¡Recibido! Tu mensaje" + (" y tu archivo" if ruta_adjunto else "")
            + " quedaron con nuestro equipo. Si quieres que te respondamos "
            "directo, deja tu correo en el campo junto al clip."
        )
    return ChatbotRespuesta(respuesta=respuesta)


@router.get("/checkout")
def catalogo_checkout(sesion: Session = Depends(get_sesion)):
    valores = {a.clave: a.valor for a in sesion.query(Ajuste).all()}
    url = _url_calenzia(sesion)
    paises = catalogo_paises.obtener_paises(_url_paises(valores))

    modulos_calenzia = integracion_calenzia.obtener_modulos(url) if url else None
    iso_referencia = paises[0]["iso"] if paises else "CL"
    precios = catalogo_paises.obtener_precios_por_pais(
        _url_precios(valores), iso_referencia
    )
    disponibles = {m["codigo"]: m for m in (modulos_calenzia or [])}
    if modulos_calenzia is not None and precios is not None:
        # Solo conceptos contratables: módulos de Calenzia que tengan precio
        # (las ediciones `comunicacion`/`con_ia` no son módulos y no aplican).
        modulos_calenzia = [m for m in modulos_calenzia if m["codigo"] in precios]
    modulos_catalogo = [
        {
            "codigo": m["codigo"],
            "nombre": m["nombre"],
            "descripcion": m.get("descripcion") or "",
        }
        for m in (modulos_calenzia or [])
    ]

    necesidades = (
        sesion.query(NecesidadCheckout)
        .filter(NecesidadCheckout.activo.is_(True))
        .order_by(NecesidadCheckout.orden, NecesidadCheckout.id)
        .all()
    )
    rubros = _rubros_para_checkout(sesion)
    transferencia = {
        clave: valores.get(clave, "").strip()
        for clave in (
            "transferencia_banco",
            "transferencia_titular",
            "transferencia_rut",
            "transferencia_tipo_cuenta",
            "transferencia_numero_cuenta",
            "transferencia_correo",
        )
    }
    return {
        "necesidades": [
            {
                "id": n.id,
                "codigo": n.codigo,
                "etiqueta": n.etiqueta,
                "ayuda": n.ayuda,
                "modulos": [
                    c for c in (n.modulos or []) if c in disponibles
                ],
                "incluye": [
                    disponibles[c]["nombre"]
                    for c in (n.modulos or [])
                    if c in disponibles
                ],
            }
            for n in necesidades
        ],
        "rubros": rubros,
        "paises": paises,
        "transferencia": transferencia,
        "modulos": modulos_catalogo,
    }


@router.get("/checkout/precios")
def precios_checkout(pais: str, sesion: Session = Depends(get_sesion)):
    valores = {a.clave: a.valor for a in sesion.query(Ajuste).all()}
    paises = catalogo_paises.obtener_paises(_url_paises(valores))
    pais_datos = catalogo_paises.buscar_pais(paises, pais)
    if pais_datos is None:
        raise HTTPException(422, "El país seleccionado no existe")

    precios = catalogo_paises.obtener_precios_por_pais(
        _url_precios(valores), pais_datos["iso"]
    )
    if precios is None:
        raise HTTPException(502, "No se pudieron obtener los precios para ese país")

    return {
        "pais": pais_datos,
        "modulos": [
            {"modulo_codigo": concepto, "monto_minor": monto}
            for concepto, monto in precios.items()
        ],
    }


_PATRON_SLUG = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")

_EDICIONES_VALIDAS = ("comunicacion", "con_ia")

# Puente temporal (bloque 1): el formulario pregunta por rangos de equipo,
# no por un número exacto. Mientras llegan las preguntas calificadoras, se
# manda el tope del rango como `nro_trabajadores` del contrato 8.58.
_EQUIPO_A_TRABAJADORES = {
    "solo_yo": 1,
    "2_a_5": 5,
    "6_a_15": 15,
    "16_a_50": 50,
    "mas_de_50": 51,
}


@router.get("/slug-disponible")
def consultar_slug_disponible(slug: str, sesion: Session = Depends(get_sesion)):
    candidato = slug.strip().lower()
    if not _PATRON_SLUG.match(candidato):
        raise HTTPException(422, "Formato de slug inválido")

    url = _url_calenzia(sesion)
    if url:
        disponible = integracion_calenzia.slug_disponible(url, candidato)
        if disponible is not None:
            return {"slug": candidato, "disponible": disponible}

    local = (
        sesion.query(Compra)
        .filter(
            Compra.estado.in_(["pendiente_pago", "pagada", "enviada"]),
        )
        .all()
    )
    ocupado = any((c.datos or {}).get("slug") == candidato for c in local)
    return {"slug": candidato, "disponible": not ocupado}


@router.post("/compras", response_model=CompraRespuesta, status_code=201)
def crear_compra(cuerpo: CompraPeticion, sesion: Session = Depends(get_sesion)):
    slug = cuerpo.slug.strip().lower()
    if not _PATRON_SLUG.match(slug):
        raise HTTPException(
            422,
            "El slug debe empezar con letra minúscula, contener solo letras "
            "minúsculas, dígitos o guiones, y no tener guiones al inicio, al "
            "final o consecutivos.",
        )
    if not cuerpo.nombre_empresa.strip():
        raise HTTPException(422, "El nombre del negocio es obligatorio")
    if cuerpo.tipo_entidad not in ("empresa", "persona_natural"):
        raise HTTPException(422, "Tipo de entidad inválido")
    if not cuerpo.admin_nombre.strip():
        raise HTTPException(422, "El nombre del administrador es obligatorio")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", cuerpo.admin_correo.strip()):
        raise HTTPException(422, "El correo del administrador no es válido")

    edicion = (cuerpo.edicion or "comunicacion").strip().lower()
    if edicion not in _EDICIONES_VALIDAS:
        raise HTTPException(
            422, "La edición debe ser 'comunicacion' o 'con_ia'"
        )

    url = _url_calenzia(sesion)
    if url:
        disponible = integracion_calenzia.slug_disponible(url, slug)
        if disponible is False:
            raise HTTPException(
                409, "Ese nombre ya está en uso. Prueba con otro parecido."
            )

    rubro_codigo = cuerpo.rubro_codigo.strip().lower()
    rubros = _rubros_para_checkout(sesion)
    rubro = next((r for r in rubros if r["codigo"] == rubro_codigo), None)
    if rubro is None:
        raise HTTPException(422, "El rubro seleccionado no existe")

    modulos_calenzia = integracion_calenzia.obtener_modulos(url) if url else None
    if modulos_calenzia is None:
        raise HTTPException(
            502, "No pudimos verificar el catálogo de módulos de Calenzia. Intenta más tarde."
        )
    catalogo_por_codigo = {m["codigo"]: m for m in modulos_calenzia}

    necesidades_existentes = {
        n.codigo: n
        for n in sesion.query(NecesidadCheckout)
        .filter(NecesidadCheckout.activo.is_(True))
        .all()
    }
    codigos_seleccionados: dict[str, None] = {}
    for codigo_necesidad in cuerpo.necesidades:
        necesidad = necesidades_existentes.get(codigo_necesidad.strip().lower())
        if necesidad is None:
            raise HTTPException(422, f"La necesidad '{codigo_necesidad}' no existe")
        for codigo_modulo in necesidad.modulos or []:
            if codigo_modulo == "ia":
                # Puente temporal (bloque 1): la IA ya no es un módulo sino la
                # edición `con_ia`; el módulo `ia` no existe en Calenzia 8.58.
                continue
            codigos_seleccionados[codigo_modulo] = None

    for codigo_modulo in cuerpo.modulos_extra:
        codigo = codigo_modulo.strip().lower()
        if not codigo:
            continue
        if codigo not in catalogo_por_codigo:
            raise HTTPException(
                422, f"El módulo '{codigo_modulo}' no existe o no está disponible"
            )
        codigos_seleccionados[codigo] = None

    for codigo_modulo in codigos_seleccionados:
        if codigo_modulo not in catalogo_por_codigo:
            raise HTTPException(
                422, f"El módulo '{codigo_modulo}' no existe en el catálogo de Calenzia"
            )

    valores = {a.clave: a.valor for a in sesion.query(Ajuste).all()}
    paises = catalogo_paises.obtener_paises(_url_paises(valores))
    pais_datos = catalogo_paises.buscar_pais(paises, cuerpo.pais)
    if pais_datos is None:
        raise HTTPException(422, "El país seleccionado no existe")

    id_fiscal = (cuerpo.id_fiscal or "").strip() or None
    if pais_datos.get("id_fiscal_obligatorio") and not id_fiscal:
        raise HTTPException(
            422,
            f"El {pais_datos.get('etiqueta_id_fiscal', 'identificador fiscal')} es obligatorio",
        )

    nro_trabajadores = cuerpo.nro_trabajadores
    if nro_trabajadores is None:
        nro_trabajadores = _EQUIPO_A_TRABAJADORES.get(
            (cuerpo.equipo_personas or "").strip().lower(), 1
        )

    precios = catalogo_paises.obtener_precios_por_pais(
        _url_precios(valores), pais_datos["iso"]
    )
    modulos_seleccionados = [
        {
            "modulo_codigo": codigo_modulo,
            "nombre": catalogo_por_codigo[codigo_modulo]["nombre"],
            "precio_mensual_clp": precios.get(codigo_modulo, 0)
            if precios is not None
            else 0,
            "limite_mensual": None,
        }
        for codigo_modulo in codigos_seleccionados
    ]
    total_minor = (
        sum(m["precio_mensual_clp"] for m in modulos_seleccionados)
        if precios is not None
        else None
    )
    total_monto = (
        catalogo_paises.formatear_monto(total_minor, pais_datos)
        if total_minor is not None
        else None
    )

    compra = Compra(
        codigo=uuid4().hex[:12],
        estado="pendiente_pago",
        datos={
            "slug": slug,
            "nombre_empresa": cuerpo.nombre_empresa.strip(),
            "tipo_entidad": cuerpo.tipo_entidad,
            "rubro_codigo": rubro_codigo,
            "rubro_nombre": rubro["nombre"],
            "pais": pais_datos["iso"],
            "moneda": pais_datos["moneda"],
            "locale": pais_datos["locale"],
            "decimales": pais_datos["decimales"],
            "simbolo_moneda": pais_datos["simbolo_moneda"],
            "etiqueta_id_fiscal": pais_datos["etiqueta_id_fiscal"],
            "prefijo_telefono": pais_datos["prefijo_telefono"],
            "id_fiscal": id_fiscal,
            "total_minor": total_minor,
            "total_monto": total_monto,
            "timezone": "America/Santiago",
            "equipo_personas": (cuerpo.equipo_personas or "").strip() or None,
            "necesidades": [n.strip().lower() for n in cuerpo.necesidades],
            "modulos_extra": [m.strip().lower() for m in cuerpo.modulos_extra],
            "admin_nombre": cuerpo.admin_nombre.strip(),
            "admin_correo": cuerpo.admin_correo.strip(),
            "admin_telefono": (cuerpo.admin_telefono or "").strip() or None,
            "edicion": edicion,
            "nro_trabajadores": nro_trabajadores,
            "respuestas": dict(cuerpo.respuestas or {}),
        },
        modulos=modulos_seleccionados,
        total_clp=total_modulos(modulos_seleccionados),
    )
    sesion.add(compra)
    sesion.commit()
    sesion.refresh(compra)
    enviar_correo_compra(compra)
    enviar_correo_cliente(compra)
    return compra


@router.post("/compras/{compra_id}/pagar", response_model=CompraRespuesta)
def pagar_compra(compra_id: int, sesion: Session = Depends(get_sesion)):
    compra = sesion.get(Compra, compra_id)
    if compra is None:
        raise HTTPException(404, "Compra inexistente")
    if compra.estado == "enviada":
        return compra

    estado, respuesta = enviar_webhook_onboarding(compra, sesion)
    compra.estado = estado
    compra.respuesta_webhook = respuesta
    sesion.commit()
    sesion.refresh(compra)
    return compra
