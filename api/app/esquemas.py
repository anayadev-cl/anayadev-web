from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SeccionCrear(BaseModel):
    slug: str | None = None
    tipo: str = "texto"
    titulo: str = ""
    subtitulo: str = ""
    texto: str = ""
    imagen_url: str | None = None
    datos: dict[str, Any] = Field(default_factory=dict)
    orden: int = 0
    visible: bool = True


class SeccionActualizar(SeccionCrear):
    pass


class SeccionRespuesta(SeccionCrear):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProductoCrear(BaseModel):
    slug: str
    nombre: str
    eslogan: str = ""
    descripcion: str = ""
    estado: str = "proximamente"
    caracteristicas: list[str] = Field(default_factory=list)
    imagen_url: str | None = None
    url: str | None = None
    orden: int = 0
    visible: bool = True


class ProductoActualizar(ProductoCrear):
    pass


class ProductoRespuesta(ProductoCrear):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LoginPeticion(BaseModel):
    usuario: str
    clave: str


class LoginRespuesta(BaseModel):
    access_token: str
    tipo_token: str = "bearer"


class ContactoPeticion(BaseModel):
    nombre: str
    correo: str
    mensaje: str
    sitio_web: str = ""


class ContactoRespuesta(BaseModel):
    estado: str
    id: int


class MensajeContactoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    correo: str
    mensaje: str
    leido: bool
    creado_en: Any


class ChatbotPeticion(BaseModel):
    mensaje: str


class ChatbotRespuesta(BaseModel):
    respuesta: str
    sugerencias: list[str] = Field(default_factory=list)


class RespuestaChatbotAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    palabras_clave: str
    respuesta: str
    sugerencias: list[str] = Field(default_factory=list)
    orden: int
    activo: bool


class RespuestaChatbotGuardar(BaseModel):
    palabras_clave: str = ""
    respuesta: str = ""
    sugerencias: list[str] = Field(default_factory=list)
    orden: int = 0
    activo: bool = True


class ModuloCheckoutAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    nombre: str
    descripcion: str
    precio_mensual_clp: int
    limite_estandar: int | None
    activo: bool
    orden: int


class ModuloCheckoutGuardar(BaseModel):
    codigo: str
    nombre: str
    descripcion: str = ""
    precio_mensual_clp: int = 0
    limite_estandar: int | None = Field(default=None, ge=0)
    activo: bool = True
    orden: int = 0


class RubroCheckoutAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    nombre: str
    activo: bool
    orden: int


class RubroCheckoutGuardar(BaseModel):
    codigo: str
    nombre: str
    activo: bool = True
    orden: int = 0


class NecesidadCheckoutAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    etiqueta: str
    ayuda: str
    modulos: list[str] = Field(default_factory=list)
    activo: bool
    orden: int


class NecesidadCheckoutGuardar(BaseModel):
    codigo: str
    etiqueta: str
    ayuda: str = ""
    modulos: list[str] = Field(default_factory=list)
    activo: bool = True
    orden: int = 0


class CompraPeticion(BaseModel):
    slug: str
    nombre_empresa: str
    tipo_entidad: str
    rubro_codigo: str
    equipo_personas: str | None = Field(default=None, max_length=60)
    admin_nombre: str
    admin_correo: str
    admin_telefono: str | None = None
    necesidades: list[str] = Field(default_factory=list)


class CompraRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    estado: str
    datos: dict[str, Any]
    modulos: list[dict[str, Any]]
    total_clp: int
    respuesta_webhook: str | None
    creado_en: Any
    actualizado_en: Any
