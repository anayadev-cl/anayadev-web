"""Siembra inicial: admin, ajustes, secciones y productos.

Solo inserta lo que falta: si la tabla ya tiene datos, no toca nada.
"""

from sqlalchemy.orm import Session

from .bd import SesionLocal
from .config import ajustes
from .modelos import (
    Ajuste,
    ModuloCheckout,
    NecesidadCheckout,
    Producto,
    RespuestaChatbot,
    RubroCheckout,
    Seccion,
    Usuario,
)
from .seguridad import encriptar_clave

AJUSTES_INICIALES = {
    "email_contacto": "hola@anayadev.cl",
    "whatsapp": "+56 9 0000 0000",
    "instagram": "@anayadev_cl",
    "footer_eslogan": "Inteligencia que conecta",
    "chatbot_fallback": (
        "Buena pregunta. Todavía estoy aprendiendo, pero puedes escribirnos "
        "a través del formulario de contacto y te respondemos de persona a "
        "persona."
    ),
    "webhook_onboarding_url": "",
    "webhook_onboarding_secreto": "",
    "calenzia_api_url": "http://localhost:8000",
    "calenzia_paises_url": "",
    "calenzia_precios_url": "",
    "transferencia_banco": "",
    "transferencia_titular": "",
    "transferencia_rut": "",
    "transferencia_tipo_cuenta": "",
    "transferencia_numero_cuenta": "",
    "transferencia_correo": "",
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
            "botones": [],
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
            "El chat es nuestro canal directo: atiende tanto a futuros "
            "clientes como a quienes ya usan Calenzia. Puedes adjuntar "
            "documentos y te respondemos de persona a persona."
        ),
        "texto": "",
        "imagen_url": None,
        "datos": {},
        "orden": 4,
    },
]

RESPUESTAS_CHATBOT_INICIALES = [
    {
        "palabras_clave": "hola, buenas, buenos dias, buenas tardes, hey",
        "respuesta": (
            "¡Hola! Soy el asistente virtual de anayadev. Puedo contarte sobre "
            "Calenzia, la familia ZIA o cómo comprar un producto para tu "
            "negocio. ¿Qué te gustaría saber?"
        ),
        "sugerencias": [
            "¿Qué es Calenzia?",
            "¿Cómo la adquiero?",
            "¿Qué es la familia ZIA?",
            "Hablar con una persona",
        ],
        "orden": 0,
    },
    {
        "palabras_clave": "calenzia, agenda, agendar, reservas, citas, calendario",
        "respuesta": (
            "Calenzia es nuestro SaaS de agendamiento con IA en el core: "
            "reservas en línea, panel de administración, recordatorios "
            "automáticos, integración con WhatsApp y mucho más. Cada negocio "
            "lo personaliza con su branding, vocabulario y módulos.\n\n"
            "Puedes probar el demo o comprarla para tu negocio desde el botón "
            "«Comprar Calenzia»."
        ),
        "sugerencias": ["¿Cómo la adquiero?", "¿Tiene demo?", "¿Qué módulos tiene?"],
        "orden": 1,
    },
    {
        "palabras_clave": "comprar, compra, compro, pago, pagar, precio, precios, cuanto cuesta, adquirir, adquiero, valor",
        "respuesta": (
            "Puedes adquirir Calenzia directo desde el sitio: presiona «Comprar "
            "Calenzia», responde unas preguntas sobre tu negocio y envía tu "
            "solicitud. Nuestro equipo la revisa, activa tu cuenta y te "
            "contacta por correo."
        ),
        "sugerencias": ["¿Qué módulos tiene?", "Hablar con una persona"],
        "orden": 2,
    },
    {
        "palabras_clave": "modulos, modulo, plan, planes",
        "respuesta": (
            "Al comprar eliges los módulos que tu negocio necesita: agenda, "
            "asistente IA, recordatorios por WhatsApp, campañas, presupuestos, "
            "inventario, reportes avanzados y más. Cada módulo suma al valor "
            "mensual y puedes empezar solo con lo esencial."
        ),
        "sugerencias": ["¿Cómo la adquiero?", "¿Qué es Calenzia?"],
        "orden": 3,
    },
    {
        "palabras_clave": "demo, probar, prueba",
        "respuesta": (
            "Claro: puedes recorrer Calenzia con datos de ejemplo en el demo "
            "público en agenda.anayadev.cl/demo, sin registrarte."
        ),
        "sugerencias": ["¿Cómo la adquiero?", "¿Qué módulos tiene?"],
        "orden": 4,
    },
    {
        "palabras_clave": "soluzia, soporte, mesa de ayuda, tickets, helpdesk",
        "respuesta": (
            "Soluzia es nuestra mesa de ayuda inteligente con IA: tickets, "
            "chat en tiempo real y respuestas basadas en el conocimiento de "
            "tu negocio. Está en desarrollo — pronto habrá más detalles."
        ),
        "sugerencias": ["¿Qué es la familia ZIA?", "Hablar con una persona"],
        "orden": 5,
    },
    {
        "palabras_clave": "zia, familia, productos, anayadev, empresa, quienes son",
        "respuesta": (
            "anayadev es nuestra marca, e «Inteligencia que conecta» su "
            "concepto. La familia ZIA reúne los productos con IA: Calenzia "
            "(CALENdario + zIA), Soluzia (SOLUción + zIA) y los que vendrán. "
            "Diferentes soluciones, una misma inteligencia que conecta."
        ),
        "sugerencias": ["¿Qué es Calenzia?", "¿Qué es Soluzia?"],
        "orden": 6,
    },
    {
        "palabras_clave": (
            "contacto, correo, email, whatsapp, humano, persona, hablar con, "
            "asesor, atencion, ayuda, consulta"
        ),
        "respuesta": (
            "Yo mismo puedo pasarte con el equipo: deja tu correo en el campo "
            "junto al clip y adjunta lo que necesites (documentos, "
            "pantallazos). También puedes escribirnos a hola@anayadev.cl o "
            "por WhatsApp. Te respondemos de persona a persona."
        ),
        "sugerencias": ["¿Qué es Calenzia?", "¿Cómo la adquiero?"],
        "orden": 7,
    },
    {
        "palabras_clave": (
            "soy cliente, tengo cuenta, mi cuenta, soporte, problema, "
            "no funciona, error, mi negocio, ya uso calenzia"
        ),
        "respuesta": (
            "Si ya usas Calenzia, este mismo chat es tu canal: deja tu correo "
            "junto al clip y adjunta lo que necesites (pantallazos, "
            "documentos). Nuestro equipo lo revisa y te responde directo."
        ),
        "sugerencias": ["Adjuntar un documento", "¿Qué es la familia ZIA?"],
        "orden": 8,
    },
    {
        "palabras_clave": (
            "adjuntar, adjunto, documento, archivo, pdf, imagen, pantallazo, "
            "screenshot, subir"
        ),
        "respuesta": (
            "Puedes adjuntar archivos con el clip de la barra del chat: "
            "documentos, imágenes y PDF. Si dejas tu correo junto al clip, te "
            "respondemos con todo el contexto."
        ),
        "sugerencias": ["Hablar con una persona"],
        "orden": 9,
    },
    {
        "palabras_clave": "gracias, excelente, perfecto, genial",
        "respuesta": "¡Gracias a ti! Cualquier otra duda, aquí estoy.",
        "sugerencias": ["¿Cómo la adquiero?", "¿Qué es la familia ZIA?"],
        "orden": 10,
    },
]

MODULOS_CHECKOUT_INICIALES = [
    ("agenda", "Agenda", "Agenda y calendario de citas para tu equipo.", 0, None),
    ("agendamiento_publico", "Agendamiento público", "Tus clientes reservan en línea desde tu propia página.", 0, None),
    ("ia", "Asistente IA", "Agente de IA que agienda, conversa y responde por ti.", 0, 300),
    ("whatsapp", "Recordatorios WhatsApp", "Recordatorios y conversaciones por WhatsApp.", 0, 500),
    ("campanas", "Campañas", "Marketing y comunicaciones masivas a tus clientes.", 0, 2000),
    ("presupuestos", "Presupuestos", "Envía presupuestos y haz seguimiento.", 0, None),
    ("inventario", "Inventario", "Controla productos y stock.", 0, None),
    ("reportes_avanzados", "Reportes avanzados", "Métricas y reportes del negocio.", 0, None),
    ("encuestas", "Encuestas", "Encuestas de satisfacción a tus clientes.", 0, None),
    ("facturacion", "Facturación", "Boletas y documentos de venta.", 0, None),
    ("fichas_clinicas", "Fichas clínicas", "Registro clínico de tus pacientes.", 0, None),
    ("portal_familias", "Portal de familias", "Portal para que familias sigan el avance.", 0, None),
    ("evaluaciones", "Evaluaciones del desarrollo", "Seguimiento y evaluaciones.", 0, None),
    ("branding_avanzado", "Branding avanzado", "Personaliza la plataforma con tu marca a fondo.", 0, None),
]

RUBROS_CHECKOUT_INICIALES = [
    ("terapias", "Terapias y salud"),
    ("belleza", "Belleza y estética"),
    ("servicios", "Servicios profesionales"),
    ("otros", "Otro rubro"),
]

NECESIDADES_CHECKOUT_INICIALES = [
    (
        "reservas_online",
        "¿Quieres que tus clientes reserven solos, sin llamarte?",
        "Tus clientes eligen su hora desde tu propia página, a cualquier hora.",
        ["agenda", "agendamiento_publico"],
    ),
    (
        "asistente_ia",
        "¿Quieres que una IA atienda y agende por ti?",
        "Responde consultas y agenda citas incluso fuera de horario.",
        ["ia"],
    ),
    (
        "whatsapp",
        "¿Quieres recordatorios automáticos por WhatsApp?",
        "Tus clientes recuerdan su hora sin que tengas que hacer nada.",
        ["whatsapp"],
    ),
    (
        "crecimiento",
        "¿Quieres llegar a más clientes con campañas?",
        "Promociones y mensajes masivos a tu cartera de clientes.",
        ["campanas"],
    ),
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
            "Mesa de ayuda inteligente con IA para equipos de soporte. "
            "Actualmente en desarrollo: pronto habrá más detalles."
        ),
        "estado": "en_desarrollo",
        "caracteristicas": [
            "Mesa de ayuda con tickets",
            "Chat en tiempo real",
            "Respuestas basadas en el conocimiento de tu negocio",
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
        _sembrar_chatbot(sesion)
        _sembrar_checkout_modulos(sesion)
        _sembrar_checkout_rubros(sesion)
        _sembrar_checkout_necesidades(sesion)
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


def _sembrar_chatbot(sesion: Session) -> None:
    if sesion.query(RespuestaChatbot).count() > 0:
        return
    for orden, datos in enumerate(RESPUESTAS_CHATBOT_INICIALES):
        sesion.add(RespuestaChatbot(**{**datos, "orden": orden}))


def _sembrar_checkout_modulos(sesion: Session) -> None:
    if sesion.query(ModuloCheckout).count() > 0:
        return
    for orden, (codigo, nombre, descripcion, precio, limite) in enumerate(
        MODULOS_CHECKOUT_INICIALES
    ):
        sesion.add(
            ModuloCheckout(
                codigo=codigo,
                nombre=nombre,
                descripcion=descripcion,
                precio_mensual_clp=precio,
                limite_estandar=limite,
                orden=orden,
            )
        )


def _sembrar_checkout_rubros(sesion: Session) -> None:
    if sesion.query(RubroCheckout).count() > 0:
        return
    for orden, (codigo, nombre) in enumerate(RUBROS_CHECKOUT_INICIALES):
        sesion.add(RubroCheckout(codigo=codigo, nombre=nombre, orden=orden))


def _sembrar_checkout_necesidades(sesion: Session) -> None:
    if sesion.query(NecesidadCheckout).count() > 0:
        return
    for orden, (codigo, etiqueta, ayuda, modulos) in enumerate(
        NECESIDADES_CHECKOUT_INICIALES
    ):
        sesion.add(
            NecesidadCheckout(
                codigo=codigo,
                etiqueta=etiqueta,
                ayuda=ayuda,
                modulos=modulos,
                orden=orden,
            )
        )
