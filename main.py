
import os
import logging
import requests

from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from pydantic import BaseModel, Field
from supabase import create_client, Client


# ============================================================
# 1. CONFIGURACIÓN GENERAL
# ============================================================

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s"
)

logger = logging.getLogger("sistema-kimal")

BASE_DIR = Path(__file__).resolve().parent

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK", "")


# ============================================================
# 2. CONEXIÓN CON SUPABASE
# ============================================================

supabase: Client = None

try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Faltan SUPABASE_URL o SUPABASE_KEY en el archivo .env"
        )

    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_KEY
    )

    logger.info("Conexion Supabase configurada correctamente")

except Exception as e:
    logger.exception(f"Error de conexión con Supabase: {e}")


# ============================================================
# 3. CREACIÓN DE LA APLICACIÓN FASTAPI
# ============================================================

app = FastAPI(
    title="Sistema Kimal - Gestión de Obras con IA",
    description="Sistema de gestión documental y control de avance de obra",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# 4. MODELOS DE DATOS
# ============================================================

class AvanceProtocolo(BaseModel):
    id_protocolo: int
    nuevo_avance: float = Field(ge=0)


class NuevoProcedimiento(BaseModel):
    area: str
    nombre_documento: str
    codigo_aconex: str


# ============================================================
# 5. FUNCIONES AUXILIARES
# ============================================================

def verificar_supabase():
    """
    Verifica que exista una conexión configurada.
    """
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="La conexión con Supabase no está disponible"
        )


def notificar_slack(mensaje: str):
    """
    Envía una notificación al canal de Slack.
    La aplicación sigue funcionando si Slack falla.
    """

    if not SLACK_WEBHOOK:
        logger.info("Slack no está configurado. Se omite notificación.")
        return

    try:
        respuesta = requests.post(
            SLACK_WEBHOOK,
            json={"text": mensaje},
            timeout=5
        )

        respuesta.raise_for_status()

        logger.info("Notificación enviada a Slack")

    except requests.RequestException as e:
        logger.warning(f"Error al enviar notificación a Slack: {e}")


def calcular_porcentaje(ejecutado: float, proyectado: float):
    """
    Calcula el porcentaje de ejecución respecto al proyectado.
    """

    if proyectado <= 0:
        return 0

    return round((ejecutado / proyectado) * 100, 2)


# ============================================================
# 6. PÁGINA PRINCIPAL
# ============================================================

@app.get("/")
def inicio():
    archivo = BASE_DIR / "index.html"

    if not archivo.exists():
        raise HTTPException(
            status_code=404,
            detail="No se encontró el archivo index.html"
        )

    return FileResponse(archivo)


# ============================================================
# 7. ESTADO DEL SISTEMA
# ============================================================

@app.get("/api/estado")
def estado_sistema():

    return {
        "sistema": "Kimal - Gestión de Obras con IA",
        "estado": "Activo",
        "supabase": "Configurado" if supabase else "No disponible",
        "slack": "Configurado" if SLACK_WEBHOOK else "No configurado"
    }


# ============================================================
# 8. PROCEDIMIENTOS
# Tabla: protocolos
# ============================================================

@app.get("/api/protocolos")
def obtener_protocolos():

    verificar_supabase()

    try:
        respuesta = (
            supabase
            .table("protocolos")
            .select("*")
            .order("item")
            .execute()
        )

        return respuesta.data

    except Exception as e:

        logger.exception(f"Error al obtener procedimientos: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar procedimientos: {str(e)}"
        )


# ============================================================
# 9. REGISTRAR NUEVO PROCEDIMIENTO
# Tabla: protocolos
# ============================================================

@app.post("/api/protocolos")
def registrar_procedimiento(datos: NuevoProcedimiento):

    verificar_supabase()

    try:

        nuevo = {
            "area": datos.area,
            "nombre_documento": datos.nombre_documento,
            "codigo_aconex": datos.codigo_aconex,
            "estatus": "PENDIENTE"
        }

        respuesta = (
            supabase
            .table("protocolos")
            .insert(nuevo)
            .execute()
        )

        notificar_slack(
            f"*Nuevo procedimiento registrado en Kimal*\n"
            f"Área: {datos.area}\n"
            f"Documento: {datos.nombre_documento}\n"
            f"Código: {datos.codigo_aconex}"
        )

        return {
            "mensaje": "Procedimiento registrado correctamente",
            "datos": respuesta.data
        }

    except Exception as e:

        logger.exception(f"Error al registrar procedimiento: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"No se pudo registrar el procedimiento: {str(e)}"
        )


# ============================================================
# 10. INGENIERÍA
# Tabla: ingenieria
# ============================================================

@app.get("/api/ingenieria")
def obtener_ingenieria():

    verificar_supabase()

    try:

        respuesta = (
            supabase
            .table("ingenieria")
            .select("*")
            .execute()
        )

        return respuesta.data

    except Exception as e:

        logger.exception(f"Error al obtener ingeniería: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar ingeniería: {str(e)}"
        )


# ============================================================
# 11. AVANCE DE OBRA
# Tabla: avance_obra
# ============================================================

@app.get("/api/avance-obra")
def obtener_avance_obra():

    verificar_supabase()

    try:

        respuesta = (
            supabase
            .table("avance_obra")
            .select("*")
            .execute()
        )

        return respuesta.data

    except Exception as e:

        logger.exception(f"Error al obtener avance de obra: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar avance de obra: {str(e)}"
        )


# ============================================================
# 12. ACTUALIZAR AVANCE EJECUTADO
# Tabla: avance_obra
# ============================================================

@app.post("/api/protocolos/actualizar")
def actualizar_avance(datos: AvanceProtocolo):

    verificar_supabase()

    try:

        # ----------------------------------------------------
        # Buscar actividad
        # ----------------------------------------------------

        consulta = (
            supabase
            .table("avance_obra")
            .select("*")
            .eq("id_protocolo", datos.id_protocolo)
            .execute()
        )

        if not consulta.data:

            raise HTTPException(
                status_code=404,
                detail="No se encontró la actividad solicitada"
            )

        actividad = consulta.data[0]

        proyectado = float(
            actividad.get("proyectado") or 0
        )

        # ----------------------------------------------------
        # Calcular porcentaje
        # ----------------------------------------------------

        porcentaje = calcular_porcentaje(
            datos.nuevo_avance,
            proyectado
        )

        # ----------------------------------------------------
        # Actualizar en Supabase
        # ----------------------------------------------------

        respuesta = (
            supabase
            .table("avance_obra")
            .update({
                "ejecutados_sp": datos.nuevo_avance
            })
            .eq("id_protocolo", datos.id_protocolo)
            .execute()
        )

        if not respuesta.data:

            raise HTTPException(
                status_code=500,
                detail="No se pudo actualizar el avance"
            )

        # ----------------------------------------------------
        # Notificar a Slack
        # ----------------------------------------------------

        nombre_actividad = actividad.get(
            "actividad_se_kimal",
            "Actividad sin nombre"
        )

        mensaje = (
            "*Actualización de avance de obra - Kimal*\n"
            f"Actividad: {nombre_actividad}\n"
            f"Ejecutado: {datos.nuevo_avance}\n"
            f"Proyectado: {proyectado}\n"
            f"Avance calculado: {porcentaje}%"
        )

        notificar_slack(mensaje)

        # ----------------------------------------------------
        # Respuesta
        # ----------------------------------------------------

        return {
            "mensaje": "Avance actualizado correctamente",
            "actividad": nombre_actividad,
            "ejecutados_sp": datos.nuevo_avance,
            "proyectado": proyectado,
            "porcentaje": porcentaje,
            "datos": respuesta.data
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(f"Error al actualizar avance: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar avance: {str(e)}"
        )


# ============================================================
# 13. RESUMEN GENERAL DEL PROYECTO
# ============================================================

@app.get("/api/resumen")
def obtener_resumen():

    verificar_supabase()

    try:

        # Obtener procedimientos
        protocolos = (
            supabase
            .table("protocolos")
            .select("*")
            .execute()
        ).data

        # Obtener ingeniería
        ingenieria = (
            supabase
            .table("ingenieria")
            .select("*")
            .execute()
        ).data

        # Obtener avance de obra
        avances = (
            supabase
            .table("avance_obra")
            .select("*")
            .execute()
        ).data

        # Estadísticas documentales
        total_protocolos = len(protocolos)
        aprobados = sum(
            1 for p in protocolos
            if str(p.get("estatus", "")).upper() == "APROBADO"
        )

        total_ingenieria = len(ingenieria)

        # Estadísticas de avance
        total_proyectado = sum(
            float(a.get("proyectado") or 0)
            for a in avances
        )

        total_ejecutado = sum(
            float(a.get("ejecutados_sp") or 0)
            for a in avances
        )

        total_protocolizado = sum(
            float(a.get("protocolizado") or 0)
            for a in avances
        )

        porcentaje_ejecucion = calcular_porcentaje(
            total_ejecutado,
            total_proyectado
        )

        porcentaje_protocolizado = calcular_porcentaje(
            total_protocolizado,
            total_proyectado
        )

        return {
            "procedimientos": {
                "total": total_protocolos,
                "aprobados": aprobados
            },
            "ingenieria": {
                "total": total_ingenieria
            },
            "avance_obra": {
                "total_proyectado": total_proyectado,
                "total_ejecutado": total_ejecutado,
                "total_protocolizado": total_protocolizado,
                "porcentaje_ejecucion": porcentaje_ejecucion,
                "porcentaje_protocolizado": porcentaje_protocolizado
            }
        }

    except Exception as e:

        logger.exception(f"Error al generar resumen: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Error al generar resumen: {str(e)}"
        )


# ============================================================
# 14. INICIO
# Ejecutar con: uvicorn main:app --reload
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
