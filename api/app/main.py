import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import seed
from .bd import Base, motor
from .config import ajustes
from .rutas import admin, publico

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def ciclo_vida(_: FastAPI):
    Base.metadata.create_all(motor)
    seed.sembrar()
    yield


app = FastAPI(
    title="anayadev API",
    description="Contenido público y CMS del sitio anayadev.cl",
    version="0.1.0",
    lifespan=ciclo_vida,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ajustes.cors_origenes.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(publico.router, prefix="/api/v1/publico", tags=["publico"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

ajustes.directorio_uploads.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=ajustes.directorio_uploads), name="media")


@app.get("/salud")
def salud():
    return {"estado": "ok", "app": ajustes.nombre_app}
