import re
import unicodedata
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd import get_sesion
from ..correo import enviar_correo_contacto
from ..esquemas import (
    ChatbotPeticion,
    ChatbotRespuesta,
    CompraPeticion,
    CompraRespuesta,
    ContactoPeticion,
    ContactoRespuesta,
)
from ..modelos import (
    Ajuste,
    Compra,
    MensajeContacto,
    ModuloCheckout,
    Producto,
    RespuestaChatbot,
    RubroCheckout,
    Seccion,
)
from ..webhook import enviar_webhook_onboarding, total_modulos

router = APIRouter()


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
def recibir_contacto(cuerpo: ContactoPeticion, sesion: Session = Depends(get_sesion)):
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
def responder_chatbot(cuerpo: ChatbotPeticion, sesion: Session = Depends(get_sesion)):
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


@router.get("/checkout")
def catalogo_checkout(sesion: Session = Depends(get_sesion)):
    modulos = (
        sesion.query(ModuloCheckout)
        .filter(ModuloCheckout.activo.is_(True))
        .order_by(ModuloCheckout.orden, ModuloCheckout.id)
        .all()
    )
    rubros = (
        sesion.query(RubroCheckout)
        .filter(RubroCheckout.activo.is_(True))
        .order_by(RubroCheckout.orden, RubroCheckout.id)
        .all()
    )
    return {
        "modulos": [
            {
                "id": m.id,
                "codigo": m.codigo,
                "nombre": m.nombre,
                "descripcion": m.descripcion,
                "precio_mensual_clp": m.precio_mensual_clp,
                "permite_limite": m.permite_limite,
                "orden": m.orden,
            }
            for m in modulos
        ],
        "rubros": [
            {"id": r.id, "codigo": r.codigo, "nombre": r.nombre, "orden": r.orden}
            for r in rubros
        ],
    }


_PATRON_SLUG = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")


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

    rubro = (
        sesion.query(RubroCheckout)
        .filter(
            RubroCheckout.codigo == cuerpo.rubro_codigo.strip().lower(),
            RubroCheckout.activo.is_(True),
        )
        .first()
    )
    if rubro is None:
        raise HTTPException(422, "El rubro seleccionado no existe")

    modulos_existentes = {
        m.codigo: m
        for m in sesion.query(ModuloCheckout)
        .filter(ModuloCheckout.activo.is_(True))
        .all()
    }
    modulos_seleccionados = []
    for seleccion in cuerpo.modulos:
        modulo = modulos_existentes.get(seleccion.modulo_codigo)
        if modulo is None:
            raise HTTPException(422, f"El módulo '{seleccion.modulo_codigo}' no existe")
        limite = seleccion.limite_mensual if modulo.permite_limite else None
        modulos_seleccionados.append(
            {
                "modulo_codigo": modulo.codigo,
                "nombre": modulo.nombre,
                "precio_mensual_clp": modulo.precio_mensual_clp,
                "limite_mensual": limite,
            }
        )

    compra = Compra(
        codigo=uuid4().hex[:12],
        estado="pendiente_pago",
        datos={
            "slug": slug,
            "nombre_empresa": cuerpo.nombre_empresa.strip(),
            "tipo_entidad": cuerpo.tipo_entidad,
            "rubro_codigo": rubro.codigo,
            "rubro_nombre": rubro.nombre,
            "pais": cuerpo.pais,
            "timezone": cuerpo.timezone,
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
