"""Layout HTML de los correos de anayadev-web (R-CORREO, 2026-09-28).

Port del chrome de Calenzia (`calenzia/agenda-api/app/correo/layout.py`) para
los 3 correos transaccionales del sitio (contacto, chat y confirmación de
solicitud). Todos son correos DE PLATAFORMA → marca anayadev/Calenzia fija
(logo de Calenzia + paleta anayadev), sin resolución de branding de tenant.

Email-safe: tablas + estilos inline (Outlook), `<style>` de normalización en
el head (Gmail/Apple), ancho máximo 600px. El cuerpo ya interpolado se inyecta
tal cual, como en el layout de Calenzia.
"""

from __future__ import annotations

from .config import ajustes

# Paleta anayadev (espejo de calenzia/agenda-api/app/correo/layout.py).
_COLOR_HEADER = "#00030C"  # match exacto con el fondo del PNG del logo
_COLOR_BOTON = "#2563FF"  # Electric Blue
_COLOR_ACENTO = "#7A5CFF"  # Electric Purple
_COLOR_TEXTO = "#0B1A2B"

# Chrome (colores de estructura, independientes de la marca).
_COLOR_FONDO_PAGINA = "#EEF2F7"
_COLOR_BORDE_CARD = "#E4EAF3"
_COLOR_TEXTO_SECUNDARIO = "#5A6A7E"
_COLOR_TEXTO_ATENUADO = "#8A97A8"
_COLOR_FONDO_FOOTER = "#F7F9FC"
_COLOR_DIVISOR = "#E8EDF4"

_FONT_STACK = (
    "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', "
    "Helvetica, Arial, sans-serif"
)

_CSS_NORMALIZACION = f"""
        body {{
            margin: 0;
            padding: 0;
            background-color: {_COLOR_FONDO_PAGINA};
            font-family: {_FONT_STACK};
            -webkit-font-smoothing: antialiased;
            text-size-adjust: 100%;
        }}
        .contenido-correo p {{
            margin: 0 0 18px 0;
        }}
        .contenido-correo p:last-child {{
            margin-bottom: 0;
        }}
        .contenido-correo a {{
            word-break: break-all;
        }}
        @media only screen and (max-width: 620px) {{
            .card-correo {{
                border-radius: 0 !important;
                border-left: 0 !important;
                border-right: 0 !important;
            }}
        }}
"""


def _escape(texto: str) -> str:
    """Escape mínimo para el `<title>` y el alt del logo."""
    return (
        texto.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def envolver_html(cuerpo_html: str, *, titulo: str) -> str:
    """Envuelve el cuerpo en el chrome completo (marca anayadev/Calenzia)."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <meta name="format-detection" content="telephone=no">
    <title>{_escape(titulo)}</title>
    <style>{_CSS_NORMALIZACION}</style>
</head>
<body style="margin: 0; padding: 0; background-color: {_COLOR_FONDO_PAGINA}; font-family: {_FONT_STACK}; color: {_COLOR_TEXTO};">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: {_COLOR_FONDO_PAGINA};">
        <tr>
            <td height="24" style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
        <tr>
            <td align="center" style="padding: 0 16px 32px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="card-correo" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid {_COLOR_BORDE_CARD}; box-shadow: 0 4px 16px rgba(11, 26, 43, 0.06);">
                    <tr>
                        <td align="center" bgcolor="{_COLOR_HEADER}" style="background-color: {_COLOR_HEADER}; background: {_COLOR_HEADER}; padding: 36px 24px 32px 24px;">
                            <img src="{ajustes.logo_calenzia_url}" alt="Calenzia" width="240" style="display: block; width: 240px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 44px 36px 44px;">
                            <div class="contenido-correo" style="font-size: 16px; line-height: 1.65; color: {_COLOR_TEXTO};">
                                {cuerpo_html}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="border-top: 1px solid {_COLOR_DIVISOR}; background-color: {_COLOR_FONDO_FOOTER}; padding: 22px 32px 24px 32px;">
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: {_COLOR_TEXTO_SECUNDARIO};"><strong style="color: #0B1A2B; font-weight: 700;">anayadev</strong><span style="color: {_COLOR_ACENTO};"> &mdash; </span>Inteligencia que conecta</p>
                            <p style="margin: 6px 0 0 0; font-size: 12px; line-height: 1.5; color: {_COLOR_TEXTO_ATENUADO};">Calenzia, el agendamiento inteligente para tu negocio</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td height="24" style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
    </table>
</body>
</html>"""


def envolver_texto(cuerpo_texto: str) -> str:
    """Envuelve el cuerpo de texto plano con el footer de marca."""
    return f"{cuerpo_texto}\n\n—\nanayadev — Inteligencia que conecta —"
