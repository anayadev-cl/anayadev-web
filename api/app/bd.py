from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import ajustes

if ajustes.base_datos_url.startswith("sqlite"):
    Path(ajustes.base_datos_url.removeprefix("sqlite:///")).parent.mkdir(
        parents=True, exist_ok=True
    )

motor = create_engine(
    ajustes.base_datos_url,
    connect_args={"check_same_thread": False}
    if ajustes.base_datos_url.startswith("sqlite")
    else {},
)

SesionLocal = sessionmaker(bind=motor, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_sesion():
    sesion = SesionLocal()
    try:
        yield sesion
    finally:
        sesion.close()
