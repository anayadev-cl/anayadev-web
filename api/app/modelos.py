from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text

from .bd import Base


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


class Seccion(Base):
    """Bloque de contenido del sitio, ordenable y ocultable."""

    __tablename__ = "secciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(120), unique=True, nullable=True)
    tipo = Column(String(40), default="texto")
    titulo = Column(String(300), default="")
    subtitulo = Column(Text, default="")
    texto = Column(Text, default="")
    imagen_url = Column(String(500), nullable=True)
    datos = Column(JSON, default=dict)
    orden = Column(Integer, default=0)
    visible = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=ahora_utc)
    actualizado_en = Column(DateTime, default=ahora_utc, onupdate=ahora_utc)


class Producto(Base):
    """Producto de la familia anayadev mostrado en el catálogo."""

    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(120), unique=True)
    nombre = Column(String(200))
    eslogan = Column(String(300), default="")
    descripcion = Column(Text, default="")
    estado = Column(String(30), default="proximamente")
    caracteristicas = Column(JSON, default=list)
    imagen_url = Column(String(500), nullable=True)
    url = Column(String(500), nullable=True)
    orden = Column(Integer, default=0)
    visible = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=ahora_utc)
    actualizado_en = Column(DateTime, default=ahora_utc, onupdate=ahora_utc)


class Ajuste(Base):
    """Par clave/valor de configuración global del sitio."""

    __tablename__ = "ajustes"

    clave = Column(String(120), primary_key=True)
    valor = Column(Text, default="")


class MensajeContacto(Base):
    """Mensaje recibido desde el formulario de contacto del sitio."""

    __tablename__ = "mensajes_contacto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200))
    correo = Column(String(300))
    mensaje = Column(Text)
    leido = Column(Boolean, default=False)
    creado_en = Column(DateTime, default=ahora_utc)


class RespuestaChatbot(Base):
    """Regla de respuestas del chatbot: palabras clave → respuesta."""

    __tablename__ = "chatbot_respuestas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    palabras_clave = Column(Text, default="")
    respuesta = Column(Text, default="")
    sugerencias = Column(JSON, default=list)
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)


class ModuloCheckout(Base):
    """Módulo contratable en el checkout de compra (espejo del catálogo de Calenzia)."""

    __tablename__ = "checkout_modulos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), unique=True)
    nombre = Column(String(200))
    descripcion = Column(Text, default="")
    precio_mensual_clp = Column(Integer, default=0)
    permite_limite = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    orden = Column(Integer, default=0)


class RubroCheckout(Base):
    """Rubro elegible en el checkout (el código debe existir en Calenzia)."""

    __tablename__ = "checkout_rubros"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), unique=True)
    nombre = Column(String(200))
    activo = Column(Boolean, default=True)
    orden = Column(Integer, default=0)


class Compra(Base):
    """Solicitud de compra de Calenzia desde el checkout del sitio."""

    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(40), unique=True)
    estado = Column(String(30), default="pendiente_pago")
    datos = Column(JSON, default=dict)
    modulos = Column(JSON, default=list)
    total_clp = Column(Integer, default=0)
    respuesta_webhook = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=ahora_utc)
    actualizado_en = Column(DateTime, default=ahora_utc, onupdate=ahora_utc)


class Usuario(Base):
    """Usuario del panel admin (uno solo por defecto)."""

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario = Column(String(120), unique=True)
    clave_hash = Column(String(300))
    creado_en = Column(DateTime, default=ahora_utc)
