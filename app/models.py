from sqlalchemy import String, Date, Numeric, ForeignKey, CheckConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import BigInteger
from .database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    id_cliente: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    ci: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20))
    direccion: Mapped[str | None] = mapped_column(String(150))
    correo: Mapped[str | None] = mapped_column(String(100))
    obras: Mapped[list["Obra"]] = relationship(back_populates="cliente")

class Trabajador(Base):
    __tablename__ = "trabajadores"
    id_trabajador: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    ci: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20))
    cargo: Mapped[str] = mapped_column(String(80), nullable=False)
    salario: Mapped[float | None] = mapped_column(Numeric(10, 2))
    obras: Mapped[list["Obra"]] = relationship(back_populates="trabajador")

class Obra(Base):
    __tablename__ = "obras"
    id_obra: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    nombre_obra: Mapped[str] = mapped_column(String(120), nullable=False)
    ubicacion: Mapped[str] = mapped_column(String(150), nullable=False)
    fecha_inicio: Mapped[object | None] = mapped_column(Date)
    fecha_fin: Mapped[object | None] = mapped_column(Date)
    presupuesto: Mapped[float | None] = mapped_column(Numeric(12, 2))
    estado: Mapped[str] = mapped_column(String(30), nullable=False, default="Pendiente")
    id_cliente: Mapped[int] = mapped_column(ForeignKey("clientes.id_cliente"), nullable=False)
    id_trabajador: Mapped[int] = mapped_column(ForeignKey("trabajadores.id_trabajador"), nullable=False)
    cliente: Mapped["Cliente"] = relationship(back_populates="obras")
    trabajador: Mapped["Trabajador"] = relationship(back_populates="obras")
    __table_args__ = (CheckConstraint("presupuesto IS NULL OR presupuesto >= 0", name="ck_obra_presupuesto_no_negativo"),)
