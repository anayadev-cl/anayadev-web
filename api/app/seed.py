"""Siembra inicial: admin, ajustes, secciones y productos.

Solo inserta lo que falta: si la tabla ya tiene datos, no toca nada.
"""

from sqlalchemy.orm import Session

from .bd import SesionLocal
from .config import ajustes
from .modelos import Ajuste, Producto, Seccion, Usuario
from .seguridad import encriptar_clave

AJUSTES_INICIALES = {
    "email_contacto": "hola@anayadev.cl",
    "whatsapp": "+56 9 0000 0000",
    "instagram": "@anayadev.cl",
    "linkedin": "anayadev",
    "github": "anayadev-cl",
    "footer_eslogan": "Inteligencia que conecta",
}

SECCIONES_INICIALES = [
    {
        "slug": "hero",
        "tipo": "hero",
        "titulo": "Inteligencia que conecta",
        "subtitulo": (
            "Construimos productos de software potenciados con inteligencia "
            "artificial: herramientas personalizables que resuelven problemas "
            "reales de negocios, de Chile hacia Latinoamérica."
        ),
        "texto": "",
        "imagen_url": None,
        "datos": {
            "badge": "SaaS con IA en el core",
            "botones": [
                {"texto": "Conoce Calenzia", "enlace": "#productos", "estilo": "primario"},
                {"texto": "Conversemos", "enlace": "#contacto", "estilo": "secundario"},
            ],
            "resumen": [
                "1 producto en producción",
                "1 producto en desarrollo",
                "IA en el núcleo de todo",
                "Hecho en Chile, rumbo a LATAM",
            ],
        },
        "orden": 0,
    },
    {
        "slug": "circuito",
        "tipo": "circuito",
        "titulo": "Un circuito, la familia ZIA",
        "subtitulo": (
            "Cada producto de anayadev nace con inteligencia artificial en su "
            "núcleo y con la personalización como regla: tu negocio no se "
            "adapta al software, el software se adapta a tu negocio."
        ),
        "texto": "",
        "imagen_url": None,
        "datos": {
            "items": [
                {
                    "titulo": "IA en el core",
                    "texto": (
                        "La inteligencia artificial no es un accesorio: está "
                        "dentro del flujo, agendando, atendiendo y aprendiendo "
                        "de cada negocio."
                    ),
                },
                {
                    "titulo": "Personalización profunda",
                    "texto": (
                        "Branding, vocabulario, módulos y flujos que se ajustan "
                        "al rubro de cada cliente, sin tocar el código."
                    ),
                },
                {
                    "titulo": "Servicio cercano",
                    "texto": (
                        "Trato directo con quien construye el producto: la "
                        "empresa crece, pero la conversación sigue siendo de "
                        "persona a persona."
                    ),
                },
                {
                    "titulo": "Familia ZIA",
                    "texto": (
                        "Calenzia, Soluzia… el sufijo zia firma cada producto "
                        "con su inteligencia: diferentes soluciones, una misma "
                        "inteligencia que conecta."
                    ),
                },
            ]
        },
        "orden": 1,
    },
    {
        "slug": "productos",
        "tipo": "productos",
        "titulo": "El catálogo",
        "subtitulo": (
            "La familia ZIA: los productos inteligentes de anayadev. "
            "Diferentes soluciones, una misma inteligencia que conecta."
        ),
        "texto": "",
        "imagen_url": None,
        "datos": {"badge": "Familia ZIA"},
        "orden": 2,
    },
    {
        "slug": "proceso",
        "tipo": "proceso",
        "titulo": "Cómo construimos",
        "subtitulo": (
            "Un proceso corto entre la idea y el producto vivo, con la "
            "inteligencia artificial integrada desde el primer día."
        ),
        "texto": "",
        "imagen_url": None,
        "datos": {
            "items": [
                {
                    "titulo": "Escuchar",
                    "texto": (
                        "Entendemos el problema real del negocio antes de "
                        "escribir una línea de código."
                    ),
                },
                {
                    "titulo": "Diseñar con IA",
                    "texto": (
                        "Definimos dónde la inteligencia artificial aporta de "
                        "verdad: como motor, no como demo."
                    ),
                },
                {
                    "titulo": "Construir",
                    "texto": (
                        "Stack moderno y robusto — FastAPI, React y PostgreSQL — "
                        "pensado para escalar contigo."
                    ),
                },
                {
                    "titulo": "Acompañar",
                    "texto": (
                        "Después del lanzamiento seguimos cerca: el producto "
                        "evoluciona junto a tu negocio."
                    ),
                },
            ]
        },
        "orden": 3,
    },
    {
        "slug": "contacto",
        "tipo": "contacto",
        "titulo": "Conversemos",
        "subtitulo": (
            "¿Quieres probar Calenzia, acompañar la salida de Soluzia o "
            "proponer una idea? Escríbenos."
        ),
        "texto": "",
        "imagen_url": None,
        "datos": {},
        "orden": 4,
    },
]

PRODUCTOS_INICIALES = [
    {
        "slug": "calenzia",
        "nombre": "Calenzia",
        "eslogan": "Tu agenda, con inteligencia",
        "descripcion": (
            "SaaS de agendamiento multitenant con IA en el core: reservas en "
            "línea, panel de administración, staff y clientes, todo en una "
            "plataforma que se adapta a cada negocio."
        ),
        "estado": "activo",
        "caracteristicas": [
            "Reservas en línea con wizard público",
            "Agente de IA que agienda y conversa",
            "Recordatorios automáticos por correo",
            "Integración con WhatsApp",
            "Campañas, presupuestos e inventario",
            "Branding y vocabulario por negocio",
        ],
        "imagen_url": "/calenzia1.png",
        "url": "https://agenda.anayadev.cl",
        "orden": 0,
    },
    {
        "slug": "soluzia",
        "nombre": "Soluzia",
        "eslogan": "La solución, con inteligencia",
        "descripcion": (
            "Mesa de ayuda inteligente con IA: tickets, chat en tiempo real y "
            "respuestas basadas en la base de conocimiento de tu empresa."
        ),
        "estado": "en_desarrollo",
        "caracteristicas": [
            "Mesa de ayuda con tickets",
            "Chat en tiempo real",
            "Base de conocimiento con RAG",
            "IA que responde con tus propios datos",
            "Multi-tenant desde el día uno",
        ],
        "imagen_url": None,
        "url": None,
        "orden": 1,
    },
    {
        "slug": "proximamente",
        "nombre": "Lo que viene",
        "eslogan": "Más piezas del circuito en camino",
        "descripcion": (
            "Estamos diseñando los próximos productos de la familia anayadev. "
            "Si tu negocio tiene una necesidad sin resolver, quizás sea el "
            "siguiente nodo."
        ),
        "estado": "proximamente",
        "caracteristicas": [
            "Nuevas herramientas para nuevos rubros",
            "Siempre con IA en el core",
            "Personalizables desde el día uno",
        ],
        "imagen_url": None,
        "url": None,
        "orden": 2,
    },
]


def sembrar() -> None:
    sesion: Session = SesionLocal()
    try:
        _sembrar_usuario(sesion)
        _sembrar_ajustes(sesion)
        _sembrar_secciones(sesion)
        _sembrar_productos(sesion)
        sesion.commit()
    finally:
        sesion.close()


def _sembrar_usuario(sesion: Session) -> None:
    if sesion.query(Usuario).count() > 0:
        return
    sesion.add(
        Usuario(
            usuario=ajustes.admin_usuario,
            clave_hash=encriptar_clave(ajustes.admin_clave),
        )
    )


def _sembrar_ajustes(sesion: Session) -> None:
    existentes = {a.clave for a in sesion.query(Ajuste).all()}
    for clave, valor in AJUSTES_INICIALES.items():
        if clave not in existentes:
            sesion.add(Ajuste(clave=clave, valor=valor))


def _sembrar_secciones(sesion: Session) -> None:
    if sesion.query(Seccion).count() > 0:
        return
    for datos in SECCIONES_INICIALES:
        sesion.add(Seccion(**datos))


def _sembrar_productos(sesion: Session) -> None:
    if sesion.query(Producto).count() > 0:
        return
    for datos in PRODUCTOS_INICIALES:
        sesion.add(Producto(**datos))
