"""Integración con la API pública de Calenzia (agenda-api).

El checkout de compra necesita dos datos que son propiedad de Calenzia:

- el catálogo de rubros activos (`GET /publico/rubros`),
- la disponibilidad de un slug (`GET /publico/tenants/{slug}`: 200/423 =
  ocupado, 404 = disponible).

Ambos son endpoints públicos de solo lectura. La URL base vive en el ajuste
`calenzia_api_url` del CMS; si está vacía (Calenzia no desplegada o modo
local), las funciones devuelven `None` y el checkout cae a sus catálogos
locales sin romperse.
"""

import json
import logging
import urllib.error
import urllib.request

log = logging.getLogger("anayadev.calenzia")


def _pedir(url: str, timeout: float = 4.0) -> tuple[int, str]:
    peticion = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(peticion, timeout=timeout) as respuesta:
        return respuesta.status, respuesta.read().decode("utf-8")


def obtener_rubros(url_base: str) -> list[dict] | None:
    """Devuelve [{codigo, nombre}, ...] de los rubros activos, o None si falla."""
    try:
        _, cuerpo = _pedir(f"{url_base.rstrip('/')}/api/v1/publico/rubros")
        datos = json.loads(cuerpo)
        if isinstance(datos, list):
            return [
                {"codigo": r.get("codigo"), "nombre": r.get("nombre")}
                for r in datos
                if r.get("codigo")
            ]
        return None
    except Exception:
        log.exception("No se pudieron obtener los rubros de Calenzia")
        return None


def slug_disponible(url_base: str, slug: str) -> bool | None:
    """True si el slug está libre, False si está ocupado, None si no se sabe.

    200 (demo/activo) o 423 (bloqueado) → ocupado; 404 → libre.
    """
    try:
        codigo, _ = _pedir(f"{url_base.rstrip('/')}/api/v1/publico/tenants/{slug}")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return True
        if exc.code in (200, 423):
            return False
        return None
    except Exception:
        return None
    return False if codigo == 200 else None
