"""Envío del webhook de compra al onboarding de Calenzia.

Contrato (calenzia `agenda-api`, schemas/onboarding.py, sub-paso 4.4-api):

    POST {url}/api/v1/publico/onboarding/comprar
    Header: X-Webhook-Secret: {secreto}
    Body: { "tenant": {...}, "admin": {...}, "modulos": [...] }

La URL y el secreto viven en los ajustes del CMS (`webhook_onboarding_url` y
`webhook_onboarding_secret`). Si la URL está vacía, el webhook queda
desactivado y la compra se marca como pagada con activación pendiente manual.
"""

import json
import logging
import urllib.error
import urllib.request

from .modelos import Ajuste

log = logging.getLogger("anayadev.webhook")


def _ajustes_como_dict(ajustes_sesion) -> dict[str, str]:
    return {a.clave: a.valor for a in ajustes_sesion.query(Ajuste).all()}


def construir_payload(compra) -> dict:
    datos = compra.datos or {}
    return {
        "tenant": {
            "slug": datos.get("slug"),
            "nombre": datos.get("nombre_empresa"),
            "tipo_entidad": datos.get("tipo_entidad", "empresa"),
            "rubro_codigo": datos.get("rubro_codigo"),
            "pais": datos.get("pais", "CL"),
            "idioma": "es",
            "timezone": datos.get("timezone", "America/Santiago"),
        },
        "admin": {
            "correo": datos.get("admin_correo"),
            "nombre": datos.get("admin_nombre"),
            "telefono": datos.get("admin_telefono") or None,
        },
        "modulos": [
            {
                "modulo_codigo": m.get("modulo_codigo"),
                "precio_mensual_clp": int(m.get("precio_mensual_clp", 0)),
                "limite_mensual": m.get("limite_mensual"),
            }
            for m in (compra.modulos or [])
        ],
    }


def enviar_webhook_onboarding(compra, ajustes_sesion) -> tuple[str, str | None]:
    """Llama al onboarding de Calenzia.

    Devuelve (estado, texto de respuesta). El texto va a
    `compra.respuesta_webhook` para trazabilidad.
    """
    ajustes_vivos = _ajustes_como_dict(ajustes_sesion)
    url = (ajustes_vivos.get("webhook_onboarding_url") or "").strip()
    secreto = (ajustes_vivos.get("webhook_onboarding_secreto") or "").strip()

    if not url:
        return "pagada", "Webhook no configurado — activación manual pendiente."

    payload = construir_payload(compra)
    peticion = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Secret": secreto,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=20) as respuesta:
            cuerpo = respuesta.read().decode("utf-8")
            log.info("Webhook onboarding OK (%s) para compra %s", respuesta.status, compra.codigo)
            return "enviada", cuerpo
    except urllib.error.HTTPError as exc:
        cuerpo = exc.read().decode("utf-8", errors="replace")
        log.warning("Webhook onboarding rechazado (%s) para compra %s: %s", exc.code, compra.codigo, cuerpo)
        return "error_webhook", f"HTTP {exc.code}: {cuerpo}"
    except Exception as exc:  # red, timeout, etc.
        log.exception("Error de red en webhook onboarding para compra %s", compra.codigo)
        return "error_webhook", f"Error de red: {exc}"


def total_modulos(modulos: list[dict]) -> int:
    return sum(int(m.get("precio_mensual_clp", 0)) for m in modulos)
