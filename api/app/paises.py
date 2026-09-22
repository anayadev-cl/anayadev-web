"""Catálogo de países y precios desde la API pública de Calenzia.

Calenzia expone endpoints PÚBLICOS de solo lectura que son la fuente única
del checkout:

- `GET /publico/paises`: países activos con sus datos de presentación
  (iso, nombre, moneda, simbolo_moneda, decimales, etiqueta_id_fiscal,
  id_fiscal_obligatorio, prefijo_telefono, locale).
- `GET /publico/precios?pais=XX`: catálogo de precios por país en unidades
  menores, con la forma `{pais_iso, moneda, ..., items: [{concepto,
  precio_monto}]}` (8.58). Incluye las ediciones (`comunicacion`,
  `con_ia`) y los módulos con precio.

Las URLs completas se configuran por settings (`ANAYADEV_CALENZIA_PAISES_URL`
y `ANAYADEV_CALENZIA_PRECIOS_URL`, con `{pais}` como marcador opcional en la
de precios) y pueden sobrescribirse desde los ajustes del CMS. No hay mocks:
si Calenzia no responde, el catálogo queda vacío y el checkout lo reporta.
"""

import json
import logging
import urllib.request

log = logging.getLogger("anayadev.paises")


def obtener_paises(url: str | None) -> list[dict]:
    """Devuelve los países activos de Calenzia; [] si la URL falta o falla."""
    if not url:
        return []
    try:
        peticion = urllib.request.Request(
            url.strip(), headers={"Accept": "application/json"}
        )
        with urllib.request.urlopen(peticion, timeout=6) as respuesta:
            datos = json.loads(respuesta.read().decode("utf-8"))
        if isinstance(datos, list):
            return [
                {
                    "iso": p.get("iso"),
                    "nombre": p.get("nombre"),
                    "moneda": p.get("moneda"),
                    "simbolo_moneda": p.get("simbolo_moneda"),
                    "decimales": int(p.get("decimales", 0)),
                    "etiqueta_id_fiscal": p.get("etiqueta_id_fiscal"),
                    "id_fiscal_obligatorio": bool(p.get("id_fiscal_obligatorio", False)),
                    "prefijo_telefono": p.get("prefijo_telefono"),
                    "locale": p.get("locale"),
                }
                for p in datos
                if p.get("iso")
            ]
    except Exception:
        log.exception("No se pudieron obtener los países desde %s", url)
    return []


def buscar_pais(paises: list[dict], iso: str) -> dict | None:
    iso_norm = (iso or "").strip().upper()
    return next((p for p in paises if p["iso"] == iso_norm), None)


def _url_precios_para_pais(url: str, iso: str) -> str:
    destino = url.strip()
    if "{pais}" in destino:
        return destino.replace("{pais}", iso)
    separador = "&" if "?" in destino else "?"
    return f"{destino}{separador}pais={iso}"


def obtener_precios_por_pais(url: str | None, iso: str) -> dict[str, int] | None:
    """Devuelve {concepto: monto en unidades menores} para el país.

    Parseo de la forma 8.58 de `/publico/precios` (`items` con `concepto` y
    `precio_monto`). Los montos vienen en unidades menores según los
    `decimales` del país. Devuelve None si la URL falta o no se pudo resolver.
    """
    if not url:
        return None
    try:
        destino = _url_precios_para_pais(url, iso)
        peticion = urllib.request.Request(
            destino, headers={"Accept": "application/json"}
        )
        with urllib.request.urlopen(peticion, timeout=6) as respuesta:
            datos = json.loads(respuesta.read().decode("utf-8"))
        if isinstance(datos, dict):
            items = datos.get("items")
            if isinstance(items, list):
                return {
                    p.get("concepto"): int(p.get("precio_monto", 0))
                    for p in items
                    if p.get("concepto")
                }
        if isinstance(datos, list):
            return {
                p.get("modulo_codigo"): int(p.get("monto_minor", 0))
                for p in datos
                if p.get("modulo_codigo")
            }
    except Exception:
        log.exception("No se pudieron obtener los precios desde %s", url)
    return None


def formatear_monto(monto_minor: int, pais: dict) -> str:
    """Formatea un monto en unidades menores con el locale/moneda del país.

    El frontend usa Intl.NumberFormat; acá (correos) se replica lo esencial:
    separadores de miles/decimales y posición del símbolo según locale.
    """
    decimales = int(pais.get("decimales", 0))
    locale = pais.get("locale", "es-CL") or "es-CL"
    simbolo = pais.get("simbolo_moneda", "$") or "$"

    unidad = monto_minor / (10 ** decimales)
    if decimales:
        entero, decimal = f"{unidad:.{decimales}f}".split(".")
    else:
        entero, decimal = f"{int(round(unidad))}".rsplit(".", 1)[0], ""

    if locale.startswith("en"):
        miles, dec = ",", "."
    else:
        miles, dec = ".", ","

    entero_agrupado = f"{int(entero):,}".replace(",", miles)
    numero = entero_agrupado + (f"{dec}{decimal}" if decimal else "")

    if pais.get("moneda") == "EUR":
        return f"{numero} {simbolo}"
    return f"{simbolo}{numero}"
