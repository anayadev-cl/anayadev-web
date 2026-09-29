"""Envío de correos transaccionales del sitio.

En desarrollo (sin SMTP ni clave Resend configurados) el correo se registra
en el log; en producción basta configurar las variables ANAYADEV_SMTP_* del
`.env`. Si el puerto SMTP está bloqueado (ej. firewall del droplet), se usa
la API HTTP de Resend con la clave de `ANAYADEV_SMTP_CLAVE` (claves `re_…`).

R-CORREO (2026-09-28): los correos pasan de texto plano a HTML con el layout
de marca (`correo_layout.py`, port del chrome de Calenzia). Todo envío lleva
versión HTML + texto plano (multipart/alternative para SMTP; `html`+`text`
para Resend) — el cliente sin HTML ve el texto, igual que antes.
"""

import json
import logging
import smtplib
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from .config import ajustes
from .correo_layout import envolver_html, envolver_texto

log = logging.getLogger("anayadev.correo")


def _enviar_por_resend(
    asunto: str,
    cuerpo_html: str,
    cuerpo_texto: str,
    destino: str,
    reply_to: str | None = None,
) -> bool:
    """Envía vía la API HTTP de Resend (https://resend.com/docs/api-reference/emails/send-email)."""
    clave = (ajustes.smtp_clave or "").strip()
    if not clave.startswith("re_"):
        return False
    datos: dict = {
        "from": formataddr((ajustes.email_nombre, "noreply@anayadev.cl")),
        "to": [destino],
        "subject": asunto,
        "html": cuerpo_html,
        "text": cuerpo_texto,
    }
    if reply_to:
        datos["reply_to"] = reply_to
    peticion = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(datos).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {clave}",
            "Content-Type": "application/json",
            "User-Agent": "anayadev-web/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=15) as respuesta:
            log.info(
                "Correo enviado por Resend (%s) a %s: %s",
                respuesta.status,
                destino,
                asunto,
            )
            return True
    except Exception:
        log.exception("No se pudo enviar el correo por Resend: %s", asunto)
        return False


def _enviar(
    asunto: str,
    cuerpo_html: str,
    cuerpo_texto: str,
    destino: str | None = None,
    reply_to: str | None = None,
) -> bool:
    destinatario = destino or ajustes.email_destino
    if not ajustes.smtp_host:
        if _enviar_por_resend(asunto, cuerpo_html, cuerpo_texto, destinatario, reply_to):
            return True
        log.info("[CORREO %s] SMTP sin configurar — mensaje registrado:\n%s", asunto, cuerpo_texto)
        return False

    remitente = ajustes.smtp_usuario or "noreply@anayadev.cl"
    correo_mime = MIMEMultipart("alternative")
    correo_mime["Subject"] = asunto
    correo_mime["From"] = formataddr((ajustes.email_nombre, remitente))
    correo_mime["To"] = destinatario
    if reply_to:
        correo_mime["Reply-To"] = reply_to
    correo_mime.attach(MIMEText(cuerpo_texto, "plain", "utf-8"))
    correo_mime.attach(MIMEText(cuerpo_html, "html", "utf-8"))

    try:
        with smtplib.SMTP(ajustes.smtp_host, ajustes.smtp_puerto, timeout=10) as servidor:
            if ajustes.smtp_tls:
                servidor.starttls()
            if ajustes.smtp_usuario and ajustes.smtp_clave:
                servidor.login(ajustes.smtp_usuario, ajustes.smtp_clave)
            servidor.send_message(correo_mime)
        return True
    except Exception:
        log.exception("No se pudo enviar el correo %s por SMTP", asunto)
        return _enviar_por_resend(asunto, cuerpo_html, cuerpo_texto, destinatario, reply_to)


def _enviar_con_layout(
    asunto: str,
    cuerpo_texto: str,
    *,
    destino: str | None = None,
    reply_to: str | None = None,
    cuerpo_html: str | None = None,
) -> bool:
    """Convierte el texto (párrafos separados por línea en blanco) a HTML con
    el layout de marca y envía html+texto."""
    html = cuerpo_html or _texto_a_html(cuerpo_texto)
    return _enviar(
        asunto,
        envolver_html(html, titulo=asunto),
        envolver_texto(cuerpo_texto),
        destino=destino,
        reply_to=reply_to,
    )


def _texto_a_html(cuerpo_texto: str) -> str:
    """Texto plano → párrafos HTML simples (para correos internos)."""
    parrafos = [
        parrafo.replace("\n", "<br>").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        for parrafo in cuerpo_texto.split("\n\n")
    ]
    return "".join(f"<p>{parrafo}</p>" for parrafo in parrafos)


def enviar_correo_contacto(nombre: str, correo: str, mensaje: str) -> bool:
    cuerpo_texto = (
        "Nuevo mensaje desde el sitio anayadev.cl\n"
        "----------------------------------------\n\n"
        f"Nombre: {nombre}\n"
        f"Correo: {correo}\n\n"
        f"{mensaje}\n"
    )
    return _enviar_con_layout(
        f"[anayadev.cl] Mensaje de {nombre}",
        cuerpo_texto,
        reply_to=correo,
    )


def enviar_correo_compra(compra) -> bool:
    datos = compra.datos or {}
    modulos = "\n".join(
        f"- {m.get('nombre', m.get('modulo_codigo', '?'))}"
        + (f" (límite {m['limite_mensual']})" if m.get("limite_mensual") else "")
        for m in (compra.modulos or [])
    ) or "(sin módulos)"
    total = datos.get("total_monto") or f"{compra.total_clp} CLP"
    cuerpo_texto = (
        "Nueva solicitud de compra en anayadev.cl\n"
        "------------------------------------------\n\n"
        f"Código: {compra.codigo.upper()}\n"
        f"Negocio: {datos.get('nombre_empresa', '')}\n"
        f"Slug: agenda.anayadev.cl/{datos.get('slug', '')}\n"
        f"País: {datos.get('pais', 'CL')}\n"
        f"Rubro: {datos.get('rubro_nombre', '')}\n"
        f"Equipo: {datos.get('equipo_personas') or '-'}\n"
        f"Edición: {datos.get('edicion') or 'comunicacion'}\n"
        f"Trabajadores: {datos.get('nro_trabajadores', '-')}\n"
        f"Admin: {datos.get('admin_nombre', '')} ({datos.get('admin_correo', '')})\n"
        f"Teléfono: {datos.get('admin_telefono') or '-'}\n"
        f"{datos.get('etiqueta_id_fiscal', 'RUT')}: {datos.get('id_fiscal') or '-'}\n\n"
        f"Módulos:\n{modulos}\n\n"
        f"Total mensual: {total}\n\n"
        "Revisa el panel Compras del CMS para reenviarla a Calenzia o "
        "activarla manualmente.\n"
    )
    return _enviar_con_layout(
        f"[anayadev.cl] Nueva compra: {datos.get('nombre_empresa', '')}",
        cuerpo_texto,
    )


def enviar_correo_cliente(compra) -> bool:
    datos = compra.datos or {}
    modulos = "\n".join(
        f"- {m.get('nombre', m.get('modulo_codigo', '?'))}"
        for m in (compra.modulos or [])
    ) or "(sin módulos)"
    total = datos.get("total_monto") or f"{compra.total_clp} CLP"
    cuerpo_texto = (
        "¡Gracias por solicitar Calenzia!\n"
        "--------------------------------\n\n"
        f"Hola {datos.get('admin_nombre', '')}: recibimos tu solicitud para "
        f"{datos.get('nombre_empresa', '')}.\n\n"
        "Esto es lo que quedó registrado:\n\n"
        f"Tu página: agenda.anayadev.cl/{datos.get('slug', '')}\n"
        f"País: {datos.get('pais', 'CL')}\n"
        f"Rubro: {datos.get('rubro_nombre', '')}\n"
        f"Equipo: {datos.get('equipo_personas') or '-'}\n"
        f"Módulos solicitados:\n{modulos}\n\n"
        f"Total mensual estimado: {total}\n\n"
        "Nuestro equipo revisará tu solicitud y te contactará a este correo "
        "para confirmar el paquete final, ajustar los límites a tu equipo y "
        "coordinar la activación y el pago. No pagas nada todavía.\n\n"
        "Si tienes dudas, responde este correo o escríbenos a "
        f"{ajustes.email_destino}.\n\n"
        "— equipo anayadev\n"
    )
    nombre_empresa = datos.get("nombre_empresa", "")
    return _enviar_con_layout(
        f"Recibimos tu solicitud de Calenzia ({nombre_empresa})",
        cuerpo_texto,
        destino=datos.get("admin_correo", ""),
        reply_to=ajustes.email_destino,
    )
