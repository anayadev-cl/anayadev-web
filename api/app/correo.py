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


def enviar_correo_contacto(nombre: str, correo: str, mensaje: str) -> bool:
    cuerpo = (
        "Nuevo mensaje desde el sitio anayadev.cl\n"
        "----------------------------------------\n\n"
        f"Nombre: {nombre}\n"
        f"Correo: {correo}\n\n"
        f"{mensaje}\n"
    )
    if not ajustes.smtp_host:
        log.info("[CORREO_CONTACTO] SMTP sin configurar — mensaje registrado:\n%s", cuerpo)
        return False

    remitente = ajustes.smtp_usuario or "noreply@anayadev.cl"
    correo_mime = MIMEText(cuerpo, "plain", "utf-8")
    correo_mime["Subject"] = f"[anayadev.cl] Mensaje de {nombre}"
    correo_mime["From"] = formataddr(("anayadev.cl", remitente))
    correo_mime["To"] = ajustes.email_destino
    correo_mime["Reply-To"] = correo

    try:
        with smtplib.SMTP(ajustes.smtp_host, ajustes.smtp_puerto, timeout=10) as servidor:
            if ajustes.smtp_tls:
                servidor.starttls()
            if ajustes.smtp_usuario and ajustes.smtp_clave:
                servidor.login(ajustes.smtp_usuario, ajustes.smtp_clave)
            servidor.send_message(correo_mime)
        return True
    except Exception:
        log.exception("No se pudo enviar el correo de contacto")
        return False
