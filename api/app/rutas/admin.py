from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..bd import get_sesion
from ..config import ajustes
from ..esquemas import (
    LoginPeticion,
    LoginRespuesta,
    MensajeContactoRespuesta,
    ProductoActualizar,
    ProductoCrear,
    ProductoRespuesta,
    SeccionActualizar,
    SeccionCrear,
    SeccionRespuesta,
)
from ..modelos import Ajuste, MensajeContacto, Producto, Seccion, Usuario
from ..seguridad import admin_actual, crear_token, verificar_clave

router = APIRouter()

EXTENSIONES_PERMITIDAS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}


# ---------------------------------------------------------------- autenticación


@router.post("/login", response_model=LoginRespuesta)
def login(peticion: LoginPeticion, sesion: Session = Depends(get_sesion)):
    usuario = (
        sesion.query(Usuario)
        .filter(Usuario.usuario == peticion.usuario)
        .first()
    )
    if usuario is None or not verificar_clave(peticion.clave, usuario.clave_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o clave incorrectos",
        )
    return LoginRespuesta(access_token=crear_token(usuario.usuario))


@router.get("/me")
def quien_soy(usuario: Usuario = Depends(admin_actual)):
    return {"usuario": usuario.usuario}


# -------------------------------------------------------------------- secciones


@router.get("/secciones", response_model=list[SeccionRespuesta])
def listar_secciones(
    sesion: Session = Depends(get_sesion), _: Usuario = Depends(admin_actual)
):
    return (
        sesion.query(Seccion).order_by(Seccion.orden, Seccion.id).all()
    )


@router.post("/secciones", response_model=SeccionRespuesta, status_code=201)
def crear_seccion(
    cuerpo: SeccionCrear,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    if cuerpo.slug:
        existente = sesion.query(Seccion).filter(Seccion.slug == cuerpo.slug).first()
        if existente:
            raise HTTPException(422, "Ya existe una sección con ese slug")
    seccion = Seccion(**cuerpo.model_dump())
    sesion.add(seccion)
    sesion.commit()
    sesion.refresh(seccion)
    return seccion


@router.put("/secciones/{seccion_id}", response_model=SeccionRespuesta)
def actualizar_seccion(
    seccion_id: int,
    cuerpo: SeccionActualizar,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    seccion = sesion.get(Seccion, seccion_id)
    if seccion is None:
        raise HTTPException(404, "Sección inexistente")
    if cuerpo.slug and cuerpo.slug != seccion.slug:
        existente = (
            sesion.query(Seccion).filter(Seccion.slug == cuerpo.slug).first()
        )
        if existente:
            raise HTTPException(422, "Ya existe una sección con ese slug")
    for campo, valor in cuerpo.model_dump().items():
        setattr(seccion, campo, valor)
    sesion.commit()
    sesion.refresh(seccion)
    return seccion


@router.delete("/secciones/{seccion_id}", status_code=204)
def eliminar_seccion(
    seccion_id: int,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    seccion = sesion.get(Seccion, seccion_id)
    if seccion is None:
        raise HTTPException(404, "Sección inexistente")
    sesion.delete(seccion)
    sesion.commit()


# -------------------------------------------------------------------- productos


@router.get("/productos", response_model=list[ProductoRespuesta])
def listar_productos(
    sesion: Session = Depends(get_sesion), _: Usuario = Depends(admin_actual)
):
    return sesion.query(Producto).order_by(Producto.orden, Producto.id).all()


@router.post("/productos", response_model=ProductoRespuesta, status_code=201)
def crear_producto(
    cuerpo: ProductoCrear,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    existente = sesion.query(Producto).filter(Producto.slug == cuerpo.slug).first()
    if existente:
        raise HTTPException(422, "Ya existe un producto con ese slug")
    producto = Producto(**cuerpo.model_dump())
    sesion.add(producto)
    sesion.commit()
    sesion.refresh(producto)
    return producto


@router.put("/productos/{producto_id}", response_model=ProductoRespuesta)
def actualizar_producto(
    producto_id: int,
    cuerpo: ProductoActualizar,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    producto = sesion.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(404, "Producto inexistente")
    if cuerpo.slug != producto.slug:
        existente = (
            sesion.query(Producto).filter(Producto.slug == cuerpo.slug).first()
        )
        if existente:
            raise HTTPException(422, "Ya existe un producto con ese slug")
    for campo, valor in cuerpo.model_dump().items():
        setattr(producto, campo, valor)
    sesion.commit()
    sesion.refresh(producto)
    return producto


@router.delete("/productos/{producto_id}", status_code=204)
def eliminar_producto(
    producto_id: int,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    producto = sesion.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(404, "Producto inexistente")
    sesion.delete(producto)
    sesion.commit()


# ---------------------------------------------------------------------- ajustes


@router.get("/ajustes")
def listar_ajustes(
    sesion: Session = Depends(get_sesion), _: Usuario = Depends(admin_actual)
):
    return {a.clave: a.valor for a in sesion.query(Ajuste).all()}


@router.put("/ajustes")
def actualizar_ajustes(
    cuerpo: dict[str, str],
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    existentes = {a.clave: a for a in sesion.query(Ajuste).all()}
    for clave, valor in cuerpo.items():
        if clave in existentes:
            existentes[clave].valor = valor
        else:
            sesion.add(Ajuste(clave=clave, valor=valor))
    sesion.commit()
    return {a.clave: a.valor for a in sesion.query(Ajuste).all()}


# -------------------------------------------------------------------- mensajes


@router.get("/mensajes", response_model=list[MensajeContactoRespuesta])
def listar_mensajes(
    sesion: Session = Depends(get_sesion), _: Usuario = Depends(admin_actual)
):
    return (
        sesion.query(MensajeContacto)
        .order_by(MensajeContacto.creado_en.desc(), MensajeContacto.id.desc())
        .all()
    )


@router.patch("/mensajes/{mensaje_id}/leido", response_model=MensajeContactoRespuesta)
def marcar_mensaje(
    mensaje_id: int,
    cuerpo: dict,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    mensaje = sesion.get(MensajeContacto, mensaje_id)
    if mensaje is None:
        raise HTTPException(404, "Mensaje inexistente")
    mensaje.leido = bool(cuerpo.get("leido", True))
    sesion.commit()
    sesion.refresh(mensaje)
    return mensaje


@router.delete("/mensajes/{mensaje_id}", status_code=204)
def eliminar_mensaje(
    mensaje_id: int,
    sesion: Session = Depends(get_sesion),
    _: Usuario = Depends(admin_actual),
):
    mensaje = sesion.get(MensajeContacto, mensaje_id)
    if mensaje is None:
        raise HTTPException(404, "Mensaje inexistente")
    sesion.delete(mensaje)
    sesion.commit()


# ----------------------------------------------------------------------- medios
@router.get("/medios")
def listar_medios(_: Usuario = Depends(admin_actual)):
    directorio = ajustes.directorio_uploads
    directorio.mkdir(parents=True, exist_ok=True)
    archivos = sorted(
        (a for a in directorio.iterdir() if a.is_file()),
        key=lambda a: a.stat().st_mtime,
        reverse=True,
    )
    return [
        {"nombre": a.name, "url": f"/media/{a.name}"}
        for a in archivos
    ]


@router.post("/medios", status_code=201)
async def subir_medio(
    archivo: UploadFile = File(...), _: Usuario = Depends(admin_actual)
):
    extension = Path(archivo.filename or "").suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(422, "Formato no permitido")
    nombre = f"{uuid4().hex[:10]}{extension}"
    destino = ajustes.directorio_uploads / nombre
    contenido = await archivo.read()
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(422, "El archivo supera los 10 MB")
    destino.write_bytes(contenido)
    return {"nombre": nombre, "url": f"/media/{nombre}"}


@router.delete("/medios/{nombre}", status_code=204)
def eliminar_medio(nombre: str, _: Usuario = Depends(admin_actual)):
    if "/" in nombre or "\\" in nombre or ".." in nombre:
        raise HTTPException(422, "Nombre inválido")
    destino = ajustes.directorio_uploads / nombre
    if not destino.is_file():
        raise HTTPException(404, "Archivo inexistente")
    destino.unlink()
