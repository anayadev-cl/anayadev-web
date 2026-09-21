"""Catálogo de países para el checkout y la landing.

Calenzia expone un endpoint PÚBLICO con los países activos y sus datos de
presentación (iso, nombre, moneda, simbolo_moneda, decimales,
etiqueta_id_fiscal, id_fiscal_obligatorio, prefijo_telefono, locale) y un
catálogo de precios por país en unidades menores.

La URL de ambos endpoints vive en los ajustes del CMS (`calenzia_paises_url`
y `calenzia_precios_url`). Mientras Calenzia no los exponga, se usan los
mocks locales con la MISMA forma, para no bloquear el desarrollo.
"""

import json
import logging
import urllib.error
import urllib.request

log = logging.getLogger("anayadev.paises")

# Misma forma que el endpoint público de Calenzia (CL, US, ES).
PAISES_MOCK = [
    {
        "iso": "CL",
        "nombre": "Chile",
        "moneda": "CLP",
        "simbolo_moneda": "$",
        "decimales": 0,
        "etiqueta_id_fiscal": "RUT",
        "id_fiscal_obligatorio": True,
        "prefijo_telefono": "+56",
        "locale": "es-CL",
    },
    {
        "iso": "US",
        "nombre": "Estados Unidos",
        "moneda": "USD",
        "simbolo_moneda": "$",
        "decimales": 2,
        "etiqueta_id_fiscal": "Tax ID",
        "id_fiscal_obligatorio": True,
        "prefijo_telefono": "+1",
        "locale": "en-US",
    },
    {
        "iso": "ES",
        "nombre": "España",
        "moneda": "EUR",
        "simbolo_moneda": "€",
        "decimales": 2,
        "etiqueta_id_fiscal": "NIF",
        "id_fiscal_obligatorio": True,
        "prefijo_telefono": "+34",
        "locale": "es-ES",
    },
]

# Tasas del mock para derivar precios por país desde el catálogo local en CLP.
TASAS_MOCK = {"CL": 1.0, "US": 950.0, "ES": 1030.0}


def obtener_paises(url: str | None) -> list[dict]:
    """Devuelve los países activos. Si la URL no está configurada o falla,
    cae al mock local (misma forma)."""
    if url:
        try:
            peticion = urllib.request.Request(
                url.strip(), headers={"Accept": "application/json"}
            )
            with urllib.request.urlopen(peticion, timeout=6) as respuesta:
                datos = json.loads(respuesta.read().decode("utf-8"))
            if isinstance(datos, list) and datos:
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
    return [dict(p) for p in PAISES_MOCK]


def buscar_pais(paises: list[dict], iso: str) -> dict | None:
    iso_norm = (iso or "").strip().upper()
    return next((p for p in paises if p["iso"] == iso_norm), None)


def obtener_precios_por_pais(
    url: str | None, modulos: list[tuple[str, int]], iso: str
) -> dict[str, int] | None:
    """Devuelve {modulo_codigo: monto en unidades menores} para el país.

    Si la URL está configurada, pide el catálogo de precios de Calenzia
    (los montos vienen en unidades menores según los `decimales` del país).
    Si no, deriva del catálogo local en CLP con las tasas del mock.
    Devuelve None si no se pudo resolver.
    """
    if url:
        try:
            destino = url.strip().replace("{pais}", iso)
            peticion = urllib.request.Request(
                destino, headers={"Accept": "application/json"}
            )
            with urllib.request.urlopen(peticion, timeout=6) as respuesta:
                datos = json.loads(respuesta.read().decode("utf-8"))
            if isinstance(datos, list):
                return {
                    p.get("modulo_codigo"): int(p.get("monto_minor", 0))
                    for p in datos
                    if p.get("modulo_codigo")
                }
        except Exception:
            log.exception("No se pudieron obtener los precios desde %s", url)
    if iso not in TASAS_MOCK:
        return None
    tasa = TASAS_MOCK[iso]
    if iso == "CL":
        return {codigo: precio for codigo, precio in modulos}
    return {
        codigo: round(precio / tasa * 100)
        for codigo, precio in modulos
    }


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
