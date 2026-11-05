import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import models
from .routers import clientes, trabajadores, obras

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea las tablas si aún no existen. Para proyectos grandes se recomienda Alembic.
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="API - Sistema de Gestión de Constructora",
    description="API REST para administrar clientes, trabajadores y obras de una empresa constructora.",
    version="1.0.0",
    lifespan=lifespan
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Inicio"])
def inicio():
    return {
        "mensaje": "API del Sistema de Gestión de Constructora",
        "documentacion": "/docs",
        "recursos": ["/clientes", "/trabajadores", "/obras"]
    }

@app.get("/health", tags=["Estado"])
def health():
    return {"status": "ok"}

app.include_router(clientes.router)
app.include_router(trabajadores.router)
app.include_router(obras.router)
