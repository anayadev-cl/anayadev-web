import re
import unicodedata
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from .. import calenzia as integracion_calenzia
from ..bd import get_sesion
from ..config import ajustes
from ..correo import enviar_correo_contacto
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
    ModuloCheckout,
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
    return valor or None


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
    modulos = (
        sesion.query(ModuloCheckout)
        .filter(ModuloCheckout.activo.is_(True))
        .order_by(ModuloCheckout.orden, ModuloCheckout.id)
        .all()
    )
    modulos_por_codigo = {m.codigo: m for m in modulos}
    necesidades = (
        sesion.query(NecesidadCheckout)
        .filter(NecesidadCheckout.activo.is_(True))
        .order_by(NecesidadCheckout.orden, NecesidadCheckout.id)
        .all()
    )
    rubros = _rubros_para_checkout(sesion)
    return {
        "necesidades": [
            {
                "id": n.id,
                "codigo": n.codigo,
                "etiqueta": n.etiqueta,
                "ayuda": n.ayuda,
                "incluye": [
                    modulos_por_codigo[c].nombre
                    for c in (n.modulos or [])
                    if c in modulos_por_codigo
                ],
            }
            for n in necesidades
        ],
        "rubros": rubros,
        "pais": "CL",
    }


_PATRON_SLUG = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")


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

    modulos_existentes = {
        m.codigo: m
        for m in sesion.query(ModuloCheckout)
        .filter(ModuloCheckout.activo.is_(True))
        .all()
    }
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
            codigos_seleccionados[codigo_modulo] = None

    modulos_seleccionados = []
    for codigo_modulo in codigos_seleccionados:
        modulo = modulos_existentes.get(codigo_modulo)
        if modulo is None:
            continue
        modulos_seleccionados.append(
            {
                "modulo_codigo": modulo.codigo,
                "nombre": modulo.nombre,
                "precio_mensual_clp": modulo.precio_mensual_clp,
                "limite_mensual": modulo.limite_estandar,
            }
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
            "pais": "CL",
            "timezone": "America/Santiago",
            "equipo_personas": (cuerpo.equipo_personas or "").strip() or None,
            "necesidades": [n.strip().lower() for n in cuerpo.necesidades],
            "admin_nombre": cuerpo.admin_nombre.strip(),
            "admin_correo": cuerpo.admin_correo.strip(),
            "admin_telefono": (cuerpo.admin_telefono or "").strip() or None,
        },
        modulos=modulos_seleccionados,
        total_clp=total_modulos(modulos_seleccionados),
    )
    sesion.add(compra)
    sesion.commit()
    sesion.refresh(compra)
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
