"""Envío del webhook de compra al onboarding de Calenzia (contrato 8.58).

Contrato (calenzia `agenda-api`, `schemas/onboarding.py`, S29c):

    POST {calenzia_api_url}/api/v1/publico/onboarding/comprar
    Header: X-Webhook-Secret: {secreto}
    Body:
        {
          "negocio":          { slug, nombre, tipo_entidad, rubro_codigo, pais, ... },
          "contacto":         { correo, nombre, telefono?, identificador_fiscal?, tipo_identificador? },
          "edicion":          "comunicacion" | "con_ia",
          "nro_trabajadores": int,
          "modulos":          ["códigos"],
          "respuestas":       { ... }
        }

A diferencia del contrato anterior (tenant/admin/modulos-con-precios), ya no
se crea el tenant: Calenzia crea una **solicitud** en estado `solicitada` y
responde con `solicitud_id`, `token` (credencial del landing
`/mi-solicitud/{token}`), `estado` y `sugerencias`. Esa respuesta se guarda
en `compra.datos["calenzia"]` para que el landing la use en un bloque
posterior.

La URL del webhook sale del ajuste del CMS `webhook_onboarding_url`; si está
vacía se deriva de `calenzia_api_url` (ajuste del CMS o, en su defecto, el
setting `ANAYADEV_CALENZIA_API_URL`). Si aun así no hay URL, el webhook queda
desactivado y la compra se marca como pagada con activación manual pendiente.
"""

import json
import logging
import urllib.error
import urllib.request

from .config import ajustes
from .modelos import Ajuste

log = logging.getLogger("anayadev.webhook")

RUTA_COMPRAR = "/api/v1/publico/onboarding/comprar"

CLAVES_RESPUESTA = (
    "token",
    "solicitud_id",
    "estado",
    "slug",
    "ya_existia",
    "sugerencias",
    "creado_en",
)


def _ajustes_como_dict(ajustes_sesion) -> dict[str, str]:
    return {a.clave: a.valor for a in ajustes_sesion.query(Ajuste).all()}


def _url_webhook(ajustes_vivos: dict[str, str]) -> str:
    url = (ajustes_vivos.get("webhook_onboarding_url") or "").strip()
    if url:
        return url
    base = (
        (ajustes_vivos.get("calenzia_api_url") or "").strip()
        or (ajustes.calenzia_api_url or "").strip()
    )
    if not base:
        return ""
    return f"{base.rstrip('/')}{RUTA_COMPRAR}"


def construir_payload(compra) -> dict:
    datos = compra.datos or {}
    id_fiscal = datos.get("id_fiscal") or None
    nro_trabajadores = datos.get("nro_trabajadores")
    return {
        "negocio": {
            "slug": datos.get("slug"),
            "nombre": datos.get("nombre_empresa"),
            "tipo_entidad": datos.get("tipo_entidad", "empresa"),
            "rubro_codigo": datos.get("rubro_codigo"),
            "pais": datos.get("pais", "CL"),
            "idioma": "es",
            "timezone": datos.get("timezone", "America/Santiago"),
        },
        "contacto": {
            "correo": datos.get("admin_correo"),
            "nombre": datos.get("admin_nombre"),
            "telefono": datos.get("admin_telefono") or None,
            "identificador_fiscal": id_fiscal,
            # El schema de Calenzia exige la pareja fiscal coherente:
            # sin identificador no se manda el tipo (422 si viajara solo).
            "tipo_identificador": (datos.get("etiqueta_id_fiscal") or None)
            if id_fiscal
            else None,
        },
        "edicion": datos.get("edicion") or "comunicacion",
        "nro_trabajadores": int(nro_trabajadores)
        if nro_trabajadores is not None
        else 1,
        "modulos": [m.get("modulo_codigo") for m in (compra.modulos or [])],
        "respuestas": datos.get("respuestas") or {},
    }


def guardar_respuesta_onboarding(compra, cuerpo: str) -> None:
    """Parsea la respuesta de Calenzia y guarda token/solicitud/sugerencias.

    Lo que importa del JSON (`token`, `solicitud_id`, `sugerencias`, …) queda
    en `compra.datos["calenzia"]` para el landing; el texto crudo sigue en
    `compra.respuesta_webhook` por trazabilidad. Nunca levanta: si el cuerpo
    no es JSON válido, no guarda nada.
    """
    try:
        datos_json = json.loads(cuerpo)
    except (TypeError, ValueError):
        return
    if not isinstance(datos_json, dict):
        return
    nuevos_datos = dict(compra.datos or {})
    nuevos_datos["calenzia"] = {
        clave: datos_json.get(clave) for clave in CLAVES_RESPUESTA
    }
    compra.datos = nuevos_datos


def enviar_webhook_onboarding(compra, ajustes_sesion) -> tuple[str, str | None]:
    """Llama al onboarding de Calenzia (8.58).

    Devuelve (estado, texto de respuesta). El texto va a
    `compra.respuesta_webhook` para trazabilidad; en caso de éxito,
    `guardar_respuesta_onboarding` deja token/solicitud_id/sugerencias en
    `compra.datos["calenzia"]`.
    """
    ajustes_vivos = _ajustes_como_dict(ajustes_sesion)
    url = _url_webhook(ajustes_vivos)
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
            log.info(
                "Webhook onboarding OK (%s) para compra %s",
                respuesta.status,
                compra.codigo,
            )
            guardar_respuesta_onboarding(compra, cuerpo)
            return "enviada", cuerpo
    except urllib.error.HTTPError as exc:
        cuerpo = exc.read().decode("utf-8", errors="replace")
        log.warning(
            "Webhook onboarding rechazado (%s) para compra %s: %s",
            exc.code,
            compra.codigo,
            cuerpo,
        )
        return "error_webhook", f"HTTP {exc.code}: {cuerpo}"
    except Exception as exc:  # red, timeout, etc.
        log.exception("Error de red en webhook onboarding para compra %s", compra.codigo)
        return "error_webhook", f"Error de red: {exc}"


def total_modulos(modulos: list[dict]) -> int:
    return sum(int(m.get("precio_mensual_clp", 0)) for m in modulos)
