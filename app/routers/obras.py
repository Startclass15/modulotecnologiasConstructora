from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/obras", tags=["Obras"])

@router.post("/", response_model=schemas.ObraOut, status_code=201)
def crear_obra(data: schemas.ObraCreate, db: Session = Depends(get_db)):
    if not db.get(models.Cliente, data.id_cliente):
        raise HTTPException(404, "El cliente indicado no existe.")
    if not db.get(models.Trabajador, data.id_trabajador):
        raise HTTPException(404, "El trabajador indicado no existe.")
    obj = models.Obra(**data.model_dump())
    db.add(obj)
    try: db.commit(); db.refresh(obj)
    except IntegrityError:
        db.rollback(); raise HTTPException(400, "No se pudo registrar la obra; revise las referencias.")
    return obj

@router.get("/", response_model=list[schemas.ObraOut])
def listar_obras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Obra).offset(skip).limit(min(limit, 500)).all()

@router.get("/{id_obra}", response_model=schemas.ObraOut)
def obtener_obra(id_obra: int, db: Session = Depends(get_db)):
    obj = db.get(models.Obra, id_obra)
    if not obj: raise HTTPException(404, "Obra no encontrada.")
    return obj

@router.put("/{id_obra}", response_model=schemas.ObraOut)
def actualizar_obra(id_obra: int, data: schemas.ObraUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.Obra, id_obra)
    if not obj: raise HTTPException(404, "Obra no encontrada.")
    values = data.model_dump(exclude_unset=True)
    if "id_cliente" in values and values["id_cliente"] is not None and not db.get(models.Cliente, values["id_cliente"]):
        raise HTTPException(404, "El cliente indicado no existe.")
    if "id_trabajador" in values and values["id_trabajador"] is not None and not db.get(models.Trabajador, values["id_trabajador"]):
        raise HTTPException(404, "El trabajador indicado no existe.")
    for k, v in values.items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/{id_obra}", status_code=204)
def eliminar_obra(id_obra: int, db: Session = Depends(get_db)):
    obj = db.get(models.Obra, id_obra)
    if not obj: raise HTTPException(404, "Obra no encontrada.")
    db.delete(obj); db.commit()
