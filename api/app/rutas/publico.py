import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..bd import get_sesion
from ..correo import enviar_correo_contacto
from ..esquemas import ContactoPeticion, ContactoRespuesta
from ..modelos import Ajuste, MensajeContacto, Producto, Seccion

router = APIRouter()


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
