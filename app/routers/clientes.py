from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=schemas.ClienteOut, status_code=201)
def crear_cliente(data: schemas.ClienteCreate, db: Session = Depends(get_db)):
    obj = models.Cliente(**data.model_dump())
    db.add(obj)
    try:
        db.commit(); db.refresh(obj)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un cliente con ese CI.")
    return obj

@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Cliente).offset(skip).limit(min(limit, 500)).all()

@router.get("/{id_cliente}", response_model=schemas.ClienteOut)
def obtener_cliente(id_cliente: int, db: Session = Depends(get_db)):
    obj = db.get(models.Cliente, id_cliente)
    if not obj: raise HTTPException(404, "Cliente no encontrado.")
    return obj

@router.put("/{id_cliente}", response_model=schemas.ClienteOut)
def actualizar_cliente(id_cliente: int, data: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.Cliente, id_cliente)
    if not obj: raise HTTPException(404, "Cliente no encontrado.")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    try:
        db.commit(); db.refresh(obj)
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "El CI ya está registrado.")
    return obj

@router.delete("/{id_cliente}", status_code=204)
def eliminar_cliente(id_cliente: int, db: Session = Depends(get_db)):
    obj = db.get(models.Cliente, id_cliente)
    if not obj: raise HTTPException(404, "Cliente no encontrado.")
    if obj.obras: raise HTTPException(409, "No se puede eliminar: el cliente tiene obras asociadas.")
    db.delete(obj); db.commit()
