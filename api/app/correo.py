"""Envío de correos transaccionales del sitio.

En desarrollo (sin SMTP configurado) el correo se registra en el log; en
producción basta configurar las variables ANAYADEV_SMTP_* en el .env.
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr

from .config import ajustes

log = logging.getLogger("anayadev.correo")


def _enviar(asunto: str, cuerpo: str, reply_to: str | None = None) -> bool:
    if not ajustes.smtp_host:
        log.info("[CORREO %s] SMTP sin configurar — mensaje registrado:\n%s", asunto, cuerpo)
        return False

    remitente = ajustes.smtp_usuario or "noreply@anayadev.cl"
    correo_mime = MIMEText(cuerpo, "plain", "utf-8")
    correo_mime["Subject"] = asunto
    correo_mime["From"] = formataddr(("anayadev.cl", remitente))
    correo_mime["To"] = ajustes.email_destino
    if reply_to:
        correo_mime["Reply-To"] = reply_to

    try:
        with smtplib.SMTP(ajustes.smtp_host, ajustes.smtp_puerto, timeout=10) as servidor:
            if ajustes.smtp_tls:
                servidor.starttls()
            if ajustes.smtp_usuario and ajustes.smtp_clave:
                servidor.login(ajustes.smtp_usuario, ajustes.smtp_clave)
            servidor.send_message(correo_mime)
        return True
    except Exception:
        log.exception("No se pudo enviar el correo %s", asunto)
        return False


def enviar_correo_contacto(nombre: str, correo: str, mensaje: str) -> bool:
    cuerpo = (
        "Nuevo mensaje desde el sitio anayadev.cl\n"
        "----------------------------------------\n\n"
        f"Nombre: {nombre}\n"
        f"Correo: {correo}\n\n"
        f"{mensaje}\n"
    )
    return _enviar(f"[anayadev.cl] Mensaje de {nombre}", cuerpo, reply_to=correo)


def enviar_correo_compra(compra) -> bool:
    datos = compra.datos or {}
    modulos = "\n".join(
        f"- {m.get('nombre', m.get('modulo_codigo', '?'))}"
        + (f" (límite {m['limite_mensual']})" if m.get("limite_mensual") else "")
        for m in (compra.modulos or [])
    ) or "(sin módulos)"
    cuerpo = (
        "Nueva solicitud de compra en anayadev.cl\n"
        "------------------------------------------\n\n"
        f"Código: {compra.codigo.upper()}\n"
        f"Negocio: {datos.get('nombre_empresa', '')}\n"
        f"Slug: agenda.anayadev.cl/{datos.get('slug', '')}\n"
        f"Rubro: {datos.get('rubro_nombre', '')}\n"
        f"Equipo: {datos.get('equipo_personas') or '-'}\n"
        f"Admin: {datos.get('admin_nombre', '')} ({datos.get('admin_correo', '')})\n"
        f"Teléfono: {datos.get('admin_telefono') or '-'}\n\n"
        f"Módulos:\n{modulos}\n\n"
        f"Total mensual: {compra.total_clp} CLP\n\n"
        "Revisa el panel Compras del CMS para reenviarla a Calenzia o "
        "activarla manualmente.\n"
    )
    return _enviar(f"[anayadev.cl] Nueva compra: {datos.get('nombre_empresa', '')}", cuerpo)
