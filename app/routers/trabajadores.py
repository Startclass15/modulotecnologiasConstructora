from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/trabajadores", tags=["Trabajadores"])

@router.post("/", response_model=schemas.TrabajadorOut, status_code=201)
def crear_trabajador(data: schemas.TrabajadorCreate, db: Session = Depends(get_db)):
    obj = models.Trabajador(**data.model_dump())
    db.add(obj)
    try: db.commit(); db.refresh(obj)
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Ya existe un trabajador con ese CI.")
    return obj

@router.get("/", response_model=list[schemas.TrabajadorOut])
def listar_trabajadores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Trabajador).offset(skip).limit(min(limit, 500)).all()

@router.get("/{id_trabajador}", response_model=schemas.TrabajadorOut)
def obtener_trabajador(id_trabajador: int, db: Session = Depends(get_db)):
    obj = db.get(models.Trabajador, id_trabajador)
    if not obj: raise HTTPException(404, "Trabajador no encontrado.")
    return obj

@router.put("/{id_trabajador}", response_model=schemas.TrabajadorOut)
def actualizar_trabajador(id_trabajador: int, data: schemas.TrabajadorUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.Trabajador, id_trabajador)
    if not obj: raise HTTPException(404, "Trabajador no encontrado.")
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    try: db.commit(); db.refresh(obj)
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "El CI ya está registrado.")
    return obj

@router.delete("/{id_trabajador}", status_code=204)
def eliminar_trabajador(id_trabajador: int, db: Session = Depends(get_db)):
    obj = db.get(models.Trabajador, id_trabajador)
    if not obj: raise HTTPException(404, "Trabajador no encontrado.")
    if obj.obras: raise HTTPException(409, "No se puede eliminar: el trabajador tiene obras asignadas.")
    db.delete(obj); db.commit()
