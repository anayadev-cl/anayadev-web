from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Ajustes(BaseSettings):
    nombre_app: str = "anayadev-api"
    entorno: str = "dev"
    base_datos_url: str = f"sqlite:///{BASE_DIR / 'data' / 'anayadev.db'}"
    secreto_jwt: str = "cambia-este-secreto-en-produccion"
    admin_usuario: str = "admin"
    admin_clave: str = "anayadev2026"
    directorio_uploads: Path = BASE_DIR / "uploads"
    cors_origenes: str = "http://localhost:5173,http://127.0.0.1:5173"
    email_destino: str = "hola@anayadev.cl"
    smtp_host: str = ""
    smtp_puerto: int = 587
    smtp_usuario: str = ""
    smtp_clave: str = ""
    smtp_tls: bool = True
    calenzia_api_url: str = "https://api.agenda.anayadev.cl"
    calenzia_paises_url: str = "https://api.agenda.anayadev.cl/api/v1/publico/paises"
    calenzia_precios_url: str = "https://api.agenda.anayadev.cl/api/v1/publico/precios?pais={pais}"

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_prefix = "ANAYADEV_"


ajustes = Ajustes()
