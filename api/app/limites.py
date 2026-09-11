"""Límite de tasa simple en memoria, por IP.

Protección básica contra spam y abuso en los endpoints públicos del sitio
(chatbot, contacto). No es un guard definitivo (una IP compartida o un
proxy puede esquivarlo), pero corta los casos más comunes; para producción
real se sube a un middleware con almacenamiento compartido.

El diccionario es global del proceso: si hay múltiples workers, el límite
es por worker. Suficiente para el tráfico de la landing.
"""

import threading
import time
from collections import defaultdict, deque

_candado = threading.Lock()
_registro: dict[str, deque[float]] = defaultdict(deque)


def _limpiar(colas: dict[str, deque[float]], ventana: float, ahora: float) -> None:
    for cola in colas.values():
        while cola and ahora - cola[0] > ventana:
            cola.popleft()


def permitido(clave: str, maximo: int, ventana_segundos: float) -> bool:
    """True si la clave está dentro del límite (y registra el intento)."""
    ahora = time.monotonic()
    with _candado:
        _limpiar(_registro, ventana_segundos, ahora)
        cola = _registro[clave]
        if len(cola) >= maximo:
            return False
        cola.append(ahora)
        return True
