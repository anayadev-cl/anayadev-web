"""El checkout acepta un código nuevo del catálogo de Calenzia y lo conserva
hasta el payload del webhook de onboarding."""

from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import calenzia as integracion_calenzia
from app import paises as catalogo_paises
from app.bd import Base
from app.esquemas import CompraPeticion
from app.rutas import publico
from app.webhook import construir_payload

PAIS_CL = {
    "iso": "CL",
    "nombre": "Chile",
    "moneda": "CLP",
    "simbolo_moneda": "$",
    "decimales": 0,
    "etiqueta_id_fiscal": "RUT",
    "id_fiscal_obligatorio": False,
    "prefijo_telefono": "+56",
    "locale": "es-CL",
}


@pytest.fixture
def sesion() -> Iterator[Session]:
    motor = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(motor)
    Sesion = sessionmaker(bind=motor)
    db = Sesion()
    try:
        yield db
    finally:
        db.close()
        motor.dispose()


def test_crear_compra_y_payload_webhook_con_rubro_nuevo(
    sesion: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(publico, "_url_calenzia", lambda _: "http://calenzia.test")
    monkeypatch.setattr(
        integracion_calenzia,
        "slug_disponible",
        lambda _url, _slug: True,
    )
    monkeypatch.setattr(
        integracion_calenzia,
        "obtener_rubros",
        lambda _url: [{"codigo": "peluqueria", "nombre": "Peluquería"}],
    )
    monkeypatch.setattr(
        integracion_calenzia,
        "obtener_modulos",
        lambda _url: [],
    )
    monkeypatch.setattr(
        catalogo_paises,
        "obtener_paises",
        lambda _url: [PAIS_CL],
    )
    monkeypatch.setattr(
        catalogo_paises,
        "obtener_precios_por_pais",
        lambda _url, _iso: {},
    )
    monkeypatch.setattr(publico, "enviar_correo_compra", lambda _compra: None)
    monkeypatch.setattr(publico, "enviar_correo_cliente", lambda _compra: None)

    compra = publico.crear_compra(
        CompraPeticion(
            slug="peluqueria-demo",
            nombre_empresa="Peluquería Demo",
            tipo_entidad="empresa",
            rubro_codigo="peluqueria",
            pais="CL",
            admin_nombre="Ana",
            admin_correo="ana@peluqueria.cl",
            nro_trabajadores=2,
            respuestas={
                "rubro_etiqueta": "Peluquería",
                "responde_fuera_de_horario": False,
            },
        ),
        sesion,
    )

    assert compra.datos["rubro_codigo"] == "peluqueria"  # type: ignore[index]
    assert compra.datos["rubro_nombre"] == "Peluquería"  # type: ignore[index]

    payload = construir_payload(compra)
    assert payload["negocio"]["rubro_codigo"] == "peluqueria"
    assert payload["respuestas"]["rubro_etiqueta"] == "Peluquería"
