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
from pathlib import Path
from uuid import uuid4

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


def obtener_modulos(url_base: str) -> list[dict] | None:
    """Devuelve [{codigo, nombre, descripcion}, ...] de los módulos activos, o None si falla."""
    try:
        _, cuerpo = _pedir(f"{url_base.rstrip('/')}/api/v1/publico/modulos")
        datos = json.loads(cuerpo)
        if isinstance(datos, list):
            return [
                {
                    "codigo": m.get("codigo"),
                    "nombre": m.get("nombre"),
                    "descripcion": m.get("descripcion"),
                }
                for m in datos
                if m.get("codigo")
            ]
        return None
    except Exception:
        log.exception("No se pudieron obtener los módulos de Calenzia")
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


def obtener_solicitud_publica(url_base: str, token: str) -> tuple[int, dict | None]:
    """GET /publico/onboarding/solicitud/{token}: la solicitud vista por su dueño.

    Devuelve (codigo_http, dict) con el JSON tal cual lo entrega Calenzia
    (contrato 8.58, sin transformarlo): estado, negocio_nombre, slug, pais,
    edicion, nro_trabajadores, modulos (códigos), sugerencias, creado_en y,
    solo si está aprobada/en_prueba/activa, moneda/simbolo_moneda/decimales/
    total_primera_factura; desde A.3 suma `tenant_estado` y el bloque `pago`
    (cobro del ciclo: estado, total, vencimiento, glosa y voucher).
    Un token inexistente viaja como (404, None); un error de red o una
    respuesta inesperada, como (0, None).
    """
    destino = f"{url_base.rstrip('/')}/api/v1/publico/onboarding/solicitud/{token}"
    try:
        _, cuerpo = _pedir(destino)
        datos = json.loads(cuerpo)
        if isinstance(datos, dict):
            return 200, datos
        return 0, None
    except urllib.error.HTTPError as exc:
        return exc.code, None
    except Exception:
        log.exception("No se pudo consultar la solicitud de onboarding")
        return 0, None


def subir_voucher_solicitud(
    url_base: str, token: str, cobro_id: str, contenido: bytes, nombre: str
) -> tuple[int, dict | None]:
    """POST /publico/onboarding/solicitud/{token}/cobros/{cobro_id}/voucher (A.3).

    Reenvía el comprobante del landing en multipart/form-data (el campo se
    llama `archivo`, igual que en Calenzia). Devuelve (codigo_http, dict) con
    el JSON de respuesta o None: (200, {cobro_id, voucher_url, estado,
    subido_en}), (404/409/422/502, None con el detalle perdido) o (0, None)
    ante un error de red.
    """
    destino = (
        f"{url_base.rstrip('/')}/api/v1/publico/onboarding/solicitud/{token}"
        f"/cobros/{cobro_id}/voucher"
    )
    borde = uuid4().hex
    nombre_seguro = Path(nombre or "comprobante").name
    cuerpo = (
        f"--{borde}\r\n"
        f'Content-Disposition: form-data; name="archivo"; filename="{nombre_seguro}"\r\n'
        "Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8")
    cuerpo += contenido + f"\r\n--{borde}--\r\n".encode("utf-8")

    peticion = urllib.request.Request(
        destino,
        data=cuerpo,
        headers={"Content-Type": f"multipart/form-data; boundary={borde}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=20) as respuesta:
            datos = json.loads(respuesta.read().decode("utf-8"))
            return respuesta.status, datos if isinstance(datos, dict) else None
    except urllib.error.HTTPError as exc:
        try:
            detalle = json.loads(exc.read().decode("utf-8", errors="replace"))
            return exc.code, detalle if isinstance(detalle, dict) else None
        except Exception:
            return exc.code, None
    except Exception:
        log.exception("No se pudo subir el comprobante a Calenzia")
        return 0, None
