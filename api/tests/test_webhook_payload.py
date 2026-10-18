"""El webhook de onboarding manda la selección del motor de planes.

Contrato aditivo con Calenzia: además de `edicion` (compat) viajan
`plan_codigo`, `periodicidad_codigo` y `addons`, EXACTAMENTE como el checkout
los usó para cotizar. `edicion` se deriva del plan cuando no viene guardada.
"""

from types import SimpleNamespace

from app.webhook import construir_payload


def _compra(datos: dict, modulos: list[dict] | None = None) -> SimpleNamespace:
    return SimpleNamespace(datos=datos, modulos=modulos or [])


def _base(**extra: object) -> dict:
    datos: dict = {
        "slug": "demo",
        "nombre_empresa": "Demo SpA",
        "tipo_entidad": "empresa",
        "rubro_codigo": "estetica",
        "pais": "CL",
        "admin_nombre": "Ana",
        "admin_correo": "ana@demo.cl",
        "nro_trabajadores": 3,
    }
    datos.update(extra)
    return datos


def test_payload_plan_premium_conserva_edicion_y_seleccion() -> None:
    payload = construir_payload(
        _compra(
            _base(
                edicion="con_ia",
                plan_codigo="premium",
                periodicidad_codigo="anual",
                addons=[],
            )
        )
    )
    assert payload["plan_codigo"] == "premium"
    assert payload["periodicidad_codigo"] == "anual"
    assert payload["addons"] == []
    assert payload["edicion"] == "con_ia"
    assert payload["nro_trabajadores"] == 3


def test_payload_personalizado_deriva_edicion_comunicacion() -> None:
    payload = construir_payload(
        _compra(
            _base(
                edicion=None,
                plan_codigo=None,
                periodicidad_codigo="trimestral",
                addons=["multi_trabajador", "campanas"],
            )
        )
    )
    assert payload["plan_codigo"] is None
    assert payload["periodicidad_codigo"] == "trimestral"
    assert payload["addons"] == ["multi_trabajador", "campanas"]
    # Sin edicion guardada, se deriva: Personalizado = base (comunicación).
    assert payload["edicion"] == "comunicacion"


def test_payload_premium_deriva_con_ia_si_falta_edicion() -> None:
    payload = construir_payload(
        _compra(
            _base(
                edicion=None,
                plan_codigo="premium",
                periodicidad_codigo="mensual",
                addons=[],
            )
        )
    )
    assert payload["edicion"] == "con_ia"


def test_payload_legacy_sin_plan_mantiene_modulos() -> None:
    payload = construir_payload(
        _compra(
            _base(edicion="comunicacion"),
            modulos=[{"modulo_codigo": "whatsapp"}],
        )
    )
    assert payload["plan_codigo"] is None
    assert payload["periodicidad_codigo"] == "mensual"
    assert payload["addons"] == []
    assert payload["edicion"] == "comunicacion"
    assert payload["modulos"] == ["whatsapp"]
