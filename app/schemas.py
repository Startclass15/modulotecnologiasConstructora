from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, EmailStr

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class ClienteBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)
    ci: str = Field(min_length=1, max_length=20)
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=150)
    correo: EmailStr | None = None

class ClienteCreate(ClienteBase): pass
class ClienteUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)
    apellido: str | None = Field(default=None, max_length=100)
    ci: str | None = Field(default=None, max_length=20)
    telefono: str | None = None
    direccion: str | None = None
    correo: EmailStr | None = None
class ClienteOut(ClienteBase, ORMModel):
    id_cliente: int

class TrabajadorBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)
    ci: str = Field(min_length=1, max_length=20)
    telefono: str | None = None
    cargo: str = Field(min_length=1, max_length=80)
    salario: Decimal | None = Field(default=None, ge=0)
class TrabajadorCreate(TrabajadorBase): pass
class TrabajadorUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    ci: str | None = None
    telefono: str | None = None
    cargo: str | None = None
    salario: Decimal | None = Field(default=None, ge=0)
class TrabajadorOut(TrabajadorBase, ORMModel):
    id_trabajador: int

class ObraBase(BaseModel):
    nombre_obra: str = Field(min_length=1, max_length=120)
    ubicacion: str = Field(min_length=1, max_length=150)
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    presupuesto: Decimal | None = Field(default=None, ge=0)
    estado: str = Field(default="Pendiente", max_length=30)
    id_cliente: int
    id_trabajador: int
class ObraCreate(ObraBase): pass
class ObraUpdate(BaseModel):
    nombre_obra: str | None = None
    ubicacion: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    presupuesto: Decimal | None = Field(default=None, ge=0)
    estado: str | None = None
    id_cliente: int | None = None
    id_trabajador: int | None = None
class ObraOut(ObraBase, ORMModel):
    id_obra: int
