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
