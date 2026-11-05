# Sistema de Gestión para una Constructora – API

Backend REST desarrollado con **FastAPI**, **SQLAlchemy** y **PostgreSQL de Supabase**. Incluye CRUD para clientes, trabajadores y obras, documentación Swagger y configuración para Render.

## 1. Funcionalidades

- Clientes: crear, listar, consultar por ID, actualizar y eliminar.
- Trabajadores: crear, listar, consultar por ID, actualizar y eliminar.
- Obras: crear, listar, consultar por ID, actualizar y eliminar.
- Validación de datos y relaciones entre obras, clientes y trabajadores.
- Documentación interactiva en `/docs`.
- Comprobación de estado en `/health`.

## 2. Tablas

- `clientes`: id_cliente, nombre, apellido, ci, telefono, direccion, correo.
- `trabajadores`: id_trabajador, nombre, apellido, ci, telefono, cargo, salario.
- `obras`: id_obra, nombre_obra, ubicacion, fecha_inicio, fecha_fin, presupuesto, estado, id_cliente, id_trabajador.

Las tablas se crean automáticamente al iniciar la API si no existen. Si ya creaste las tablas en Supabase con la Tarea 3, la API las reutilizará. Los nombres y tipos son compatibles con esa propuesta.

## 3. Ejecutar localmente

Requiere Python 3.11 o superior.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Configura la variable `DATABASE_URL` con la cadena PostgreSQL de Supabase. En Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://postgres.PROJECT_REF:DB_PASSWORD@HOST:5432/postgres"
uvicorn app.main:app --reload
```

En macOS/Linux:

```bash
export DATABASE_URL="postgresql://postgres.PROJECT_REF:DB_PASSWORD@HOST:5432/postgres"
uvicorn app.main:app --reload
```

Abre `http://127.0.0.1:8000/docs`.

Para probar sin Supabase, la aplicación utiliza SQLite local por defecto.

## 4. Desplegar en Render

1. Sube esta carpeta a un repositorio de GitHub.
2. En Render, selecciona **New + → Blueprint** y conecta el repositorio (Render detectará `render.yaml`), o crea un **Web Service** manualmente.
3. Si usas Blueprint, Render solicitará `DATABASE_URL`.
4. En Supabase abre **Connect** y copia la cadena PostgreSQL. Para Render, utiliza preferentemente la conexión **Session Pooler** si la conexión directa no es compatible con la red IPv4. Sustituye la contraseña por la contraseña real de la base de datos y conserva el formato de URL.
5. En Render, guarda esa cadena como variable de entorno `DATABASE_URL`. No la escribas en el código ni la subas a GitHub.
6. Despliega el servicio. El comando de inicio es `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. Cuando el despliegue termine, visita `https://TU-SERVICIO.onrender.com/health` y luego `/docs`.

## 5. Rutas principales

| Método | Ruta | Función |
|---|---|---|
| GET | `/clientes/` | Listar clientes |
| POST | `/clientes/` | Crear cliente |
| GET | `/clientes/{id}` | Consultar cliente |
| PUT | `/clientes/{id}` | Actualizar cliente |
| DELETE | `/clientes/{id}` | Eliminar cliente |
| GET | `/trabajadores/` | Listar trabajadores |
| POST | `/trabajadores/` | Crear trabajador |
| GET | `/obras/` | Listar obras |
| POST | `/obras/` | Crear obra |
| GET | `/obras/{id}` | Consultar obra |
| PUT | `/obras/{id}` | Actualizar obra |
| DELETE | `/obras/{id}` | Eliminar obra |

Las rutas de trabajadores y obras también incluyen operaciones de consulta, actualización y eliminación. La lista completa está en Swagger.

## 6. Ejemplos para probar en Swagger

### Crear cliente – POST `/clientes/`

```json
{
  "nombre": "Juan",
  "apellido": "Perez",
  "ci": "1234567",
  "telefono": "70012345",
  "direccion": "Zona Central, La Paz",
  "correo": "juan@example.com"
}
```

### Crear trabajador – POST `/trabajadores/`

```json
{
  "nombre": "Carlos",
  "apellido": "Mamani",
  "ci": "7654321",
  "telefono": "70123456",
  "cargo": "Ingeniero Civil",
  "salario": 5000
}
```

### Crear obra – POST `/obras/`

Utiliza los IDs que devolvieron las dos operaciones anteriores:

```json
{
  "nombre_obra": "Construccion de vivienda",
  "ubicacion": "La Paz - Bolivia",
  "fecha_inicio": "2026-11-10",
  "fecha_fin": "2027-05-10",
  "presupuesto": 250000,
  "estado": "En ejecución",
  "id_cliente": 1,
  "id_trabajador": 1
}
```

## 7. Seguridad importante

- No subas `.env` ni contraseñas al repositorio.
- No expongas la clave `service_role` ni credenciales de PostgreSQL.
- `DATABASE_URL` debe configurarse únicamente en las variables de entorno de Render.
- Este proyecto es una base académica para demostración. Antes de usarlo en producción real, agrega autenticación, autorización, políticas de acceso y migraciones de base de datos.
- Si tus tablas existentes tienen columnas o tipos diferentes, revisa el esquema antes de desplegar. `create_all` crea tablas faltantes, pero no modifica tablas existentes.

## 8. Tecnologías utilizadas

Python, FastAPI, SQLAlchemy, PostgreSQL, Supabase, Swagger/OpenAPI, GitHub y Render.
