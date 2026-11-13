import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import {
  Activity, Box, BarChart3, Layers, Cpu, FileText, CheckCircle2,
  AlertTriangle, Sliders, Play, Pause, RotateCcw, Eye, Sun, Moon,
  Plus, Search, Filter, Zap, ShieldCheck, TrendingUp, Compass,
  Wrench, Database, Sparkles, X, Check, Building2, FolderKanban,
  ClipboardCheck, ArrowUpRight, AlertOctagon, Info, Trash2, Edit3,
  Download, Upload, FileSpreadsheet, Copy, Save
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';

// ============================================================================
// 1. DATOS REALES OFICIALES DE LAS 3 TABLAS PROPORCIONADAS (SE KIMAL)
// ============================================================================

// TABLA 1: AVANCE Y PROTOCOLIZACIÓN SE KIMAL (Total Proyectado: 6995)
const INITIAL_AVANCE_KIMAL = [
  {
    item: '1.-',
    id: 'PART-01',
    nombre: 'Obras Civiles',
    proyectado: 3727,
    ejecutados_sp: 47,
    en_ito: 0,
    cerrado_protocolizado: 359,
    protocolizado_pct: 10,
    zona3d: 'Patio de Transformadores',
    descripcionZona: 'Patio de Transformadores Convertidores, Fundaciones y Terreno General',
    pos3d: { x: -11, z: 0 }
  },
  {
    item: '2.-',
    id: 'PART-02',
    nombre: 'Construcción de Canaletas (aún no definido)',
    proyectado: 280,
    ejecutados_sp: 0,
    en_ito: 0,
    cerrado_protocolizado: 103,
    protocolizado_pct: 37,
    zona3d: 'Canaletas y Drenaje',
    descripcionZona: 'Red de Canaletas Perimetrales, Drenaje Hidráulico y Trincheras',
    pos3d: { x: -6.5, z: 0 }
  },
  {
    item: '3.-',
    id: 'PART-03',
    nombre: 'Montaje Estructural y Electromecánico',
    proyectado: 704,
    ejecutados_sp: 0,
    en_ito: 0,
    cerrado_protocolizado: 0,
    protocolizado_pct: 0,
    zona3d: 'Edificio de Válvulas 1',
    descripcionZona: 'Edificio de Válvulas 1, Edificio de Control y Edificio STATCOM',
    pos3d: { x: -2, z: 0 }
  },
  {
    item: '4.-',
    id: 'PART-04',
    nombre: 'Montaje Alta Tensión',
    proyectado: 330,
    ejecutados_sp: 15,
    en_ito: 20,
    cerrado_protocolizado: 51,
    protocolizado_pct: 15,
    zona3d: 'Patio HVDC',
    descripcionZona: 'Estructuras Altas Patio HVDC, Patio Filtros 220kV AC y Patio 66kV AC',
    pos3d: { x: 2.5, z: 0 }
  },
  {
    item: '5.-',
    id: 'PART-05',
    nombre: 'Montaje Eléctrico y C&P',
    proyectado: 95,
    ejecutados_sp: 0,
    en_ito: 0,
    cerrado_protocolizado: 0,
    protocolizado_pct: 0,
    zona3d: 'Edificio de Control',
    descripcionZona: 'Salas de Control, Protecciones C&P y Caseta de Guardia',
    pos3d: { x: 7, z: 0 }
  },
  {
    item: '6.-',
    id: 'PART-06',
    nombre: 'Pruebas y Comisionamiento (aún no definido)',
    proyectado: 1859,
    ejecutados_sp: 0,
    en_ito: 0,
    cerrado_protocolizado: 0,
    protocolizado_pct: 0,
    zona3d: 'Edificio STATCOM',
    descripcionZona: 'Puesta en Servicio y Comisionamiento Integral Conversora Kimal',
    pos3d: { x: 11.5, z: 0 }
  }
];

// TABLA 2: 01 INGENIERÍA - CIVIL (16 Documentos Exactos)
const INITIAL_INGENIERIA_CIVIL = [
  {
    id: 1,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-ITC-E-0001',
    nombre: 'Mecánica de suelos',
    rev: '8',
    estatus: 'Toma de Conocimiento con Pendientes',
    recibido_en: 'CSG-XEEC-TRN-000055',
    fecha_actualizacion: '12/1/2026',
    fecha_aprobado: '12/1/2026',
    observaciones: '',
    zona3d: 'Suelo y Terreno General',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 2,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-ITC-I-0001',
    nombre: 'Estudio Hidrológico Kimal',
    rev: '1',
    estatus: 'Revisado con comentarios',
    recibido_en: 'CSG-XEEC-TRN-000030',
    fecha_actualizacion: '14/5/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Canaletas y Drenaje',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 3,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-ITC-I-0002',
    nombre: 'Estudio Hidráulico Kimal',
    rev: '1',
    estatus: 'Revisado con comentarios',
    recibido_en: 'CSG-XEEC-TRN-000030',
    fecha_actualizacion: '14/4/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Canaletas y Drenaje',
    partidaVinculada: '2.- Construcción de Canaletas (aún no definido)'
  },
  {
    id: 4,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0001',
    nombre: 'Edificios - Edificio de Control - Memoria de Calculo Fundaciones',
    rev: '2',
    estatus: 'Devuelto con Comentarios',
    recibido_en: 'CSG-XEEC-TRN-000030',
    fecha_actualizacion: '29/9/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Edificio de Control',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 5,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0002',
    nombre: 'Edificios -Edificio de Válvulas 1 - Fundaciones - Memoria de Calculo',
    rev: '5',
    estatus: 'Devuelto con Comentarios',
    recibido_en: 'CSG-XEEC-TRN-000030',
    fecha_actualizacion: '28/9/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Edificio de Válvulas 1',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 6,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-PLN-E-0028-L0001',
    nombre: 'Patio de Transformadores-Transformadores Convertidores - Fundaciones - Plano de Disposición',
    rev: '3',
    estatus: 'Toma de Conocimiento',
    recibido_en: 'CSG-XEEC-TRN-000103',
    fecha_actualizacion: '28/5/2026',
    fecha_aprobado: '28/5/2026',
    observaciones: '',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 7,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-PLN-E-0028-L0002',
    nombre: 'Patio de Transformadores-Transformadores Convertidores - Fundaciones - Detalles',
    rev: '5',
    estatus: 'Recibido',
    recibido_en: 'CSG-XEEC-TRN-000102',
    fecha_actualizacion: '23/10/2026',
    fecha_aprobado: '9/6/2026',
    observaciones: 'Actualización',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 8,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-PLN-E-0028-L0003',
    nombre: 'Patio de Transformadores-Transformadores Convertidores - Fundaciones - Topes sísmicos, caja',
    rev: '5',
    estatus: 'Recibido',
    recibido_en: 'CSG-XEEC-TRN-000102',
    fecha_actualizacion: '23/10/2026',
    fecha_aprobado: '9/6/2026',
    observaciones: 'Actualización',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 9,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-PLN-E-0028-L0004',
    nombre: 'Patio de Transformadores - Transformadores Conversores - Fundaciones - Formas y Armaduras',
    rev: '5',
    estatus: 'Recibido',
    recibido_en: 'CSG-XEEC-TRN-000102',
    fecha_actualizacion: '23/10/2026',
    fecha_aprobado: '11/6/2026',
    observaciones: 'Actualización',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 10,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-PLN-E-0028-L0005',
    nombre: 'Patio de Transformadores - Transformadores Conversores - Fundaciones - Formas y Armaduras',
    rev: '5',
    estatus: 'Recibido',
    recibido_en: 'CSG-XEEC-TRN-000102',
    fecha_actualizacion: '23/10/2026',
    fecha_aprobado: '11/6/2026',
    observaciones: 'Actualización',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 11,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0008',
    nombre: 'Edificios - Caseta de Guardia - Fundaciones - Memoria de cálculo',
    rev: '3',
    estatus: 'Toma de Conocimiento',
    recibido_en: 'CSG-XEEC-TRN-000016',
    fecha_actualizacion: '7/10/2025',
    fecha_aprobado: '7/10/2025',
    observaciones: '',
    zona3d: 'Caseta de Guardia',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 12,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0010',
    nombre: 'Edificios - Edificio STATCOM - Fundaciones - Memoria de cálculo',
    rev: '2',
    estatus: 'Revisado con comentarios',
    recibido_en: 'CSG-XEEC-TRN-000055',
    fecha_actualizacion: '19/6/2025',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Edificio STATCOM',
    partidaVinculada: '1.- Obras Civiles'
  },
  {
    id: 13,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0011',
    nombre: 'Estructuras altas - Patio HVDC - Fundaciones - Memoria de cálculo',
    rev: '2',
    estatus: 'Devuelto con Comentarios',
    recibido_en: 'CSG-XEEC-TRN-000077',
    fecha_actualizacion: '9/6/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Patio HVDC',
    partidaVinculada: '4.- Montaje Alta Tensión'
  },
  {
    id: 14,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0012',
    nombre: 'Estructuras Altas - Patio de Filtros 220kV AC - Marcos Simple y Doble - Fundaciones - Memoria de Cálculo',
    rev: '3',
    estatus: 'Devuelto con Comentarios',
    recibido_en: 'CSG-XEEC-TRN-000105',
    fecha_actualizacion: '1/10/2026',
    fecha_aprobado: '',
    observaciones: 'Desactualizado en Aconex, solo esta la revisión anterior o anter',
    zona3d: 'Patio Filtros 220kV AC',
    partidaVinculada: '4.- Montaje Alta Tensión'
  },
  {
    id: 15,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0013',
    nombre: 'Estructuras Altas - Patio 220kV AC - Marco de Barra 2 - Fundaciones - Memoria de Cálculo',
    rev: '1',
    estatus: 'Revisado con comentarios',
    recibido_en: 'CSG-XEEC-TRN-000055',
    fecha_actualizacion: '18/2/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Patio Filtros 220kV AC',
    partidaVinculada: '4.- Montaje Alta Tensión'
  },
  {
    id: 16,
    disciplina: '01 Ingeniería - Civil',
    codigo: 'CNX-KILO-001-DS-CK-CV-MCA-E-0014',
    nombre: 'Estructuras altas - Estructuras Altas Patio 66kV AC - Fundaciones - Memoria de cálculo',
    rev: '4',
    estatus: 'Toma de Conocimiento',
    recibido_en: '',
    fecha_actualizacion: '7/1/2026',
    fecha_aprobado: '13/8/2026',
    observaciones: 'Documento No disponible en Aconex',
    zona3d: 'Patio 66kV AC',
    partidaVinculada: '4.- Montaje Alta Tensión'
  }
];

// TABLA 3: PROCEDIMIENTOS CONVERSORA KIMAL (11 Documentos Exactos)
const INITIAL_PROCEDIMIENTOS_KIMAL = [
  {
    item: 1,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento Instalación de Faena',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0001',
    estatus: 'APROBADO',
    rev: '1',
    fecha_envio: '11/3/2026',
    fecha_aprobacion: '11/3/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 2,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento izaje, Carga y transporte de materiales',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0002',
    estatus: 'APROBADO',
    rev: '2',
    fecha_envio: '19/5/2026',
    fecha_aprobacion: '19/5/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 3,
    area: 'MA',
    esp: 'MA',
    nombre: 'Procedimiento codigo de colores',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0003',
    estatus: 'APROBADO',
    rev: '1',
    fecha_envio: '1/8/2026',
    fecha_aprobacion: '1/8/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 4,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento trabajo seguro de señalización',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0004',
    estatus: 'ELIMINADO',
    rev: '0',
    fecha_envio: '24/2/2026',
    fecha_aprobacion: '',
    observaciones: 'DCC (25-03-2026) - Corresponde a CSGI, ellos entregan el PL'
  },
  {
    item: 5,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento Uso de herramientas manuales y electricas',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0005',
    estatus: 'APROBADO',
    rev: '2',
    fecha_envio: '11/2/2026',
    fecha_aprobacion: '11/2/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 6,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento trabajo en caliente',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0006',
    estatus: 'ELIMINADO',
    rev: '',
    fecha_envio: '',
    fecha_aprobacion: '',
    observaciones: ''
  },
  {
    item: 7,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento carga de combustible',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0007',
    estatus: 'APROBADO',
    rev: '0',
    fecha_envio: '27/4/2026',
    fecha_aprobacion: '27/4/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 8,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento topografia',
    codigo: 'CNX-KILO-001-CS-CK-CV-PRC-E-0009',
    estatus: 'APROBADO',
    rev: '0',
    fecha_envio: '13/4/2026',
    fecha_aprobacion: '13/4/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 9,
    area: 'SSO',
    esp: 'SSO',
    nombre: 'Procedimiento trabajo en altura',
    codigo: 'CNX-KILO-001-CS-CK-CV-PRC-E-0012',
    estatus: 'APROBADO',
    rev: '0',
    fecha_envio: '8/8/2026',
    fecha_aprobacion: '10/9/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  },
  {
    item: 10,
    area: 'MA',
    esp: 'MA',
    nombre: 'Procedimiento mantenimiento menor y cambio de accesorios',
    codigo: 'CNX-KILO-001-HS-CK-NN-PRC-E-0047',
    estatus: 'ACONEX',
    rev: '0',
    fecha_envio: '1/9/2026',
    fecha_aprobacion: '',
    observaciones: 'Cargado en ACONEX (28-10-2026)'
  },
  {
    item: 11,
    area: 'QC',
    esp: 'QC',
    nombre: 'Procedimiento humectación con camión aljibe',
    codigo: 'CNX-KILO-001-CS-CK-CV-PRC-E-0053',
    estatus: 'APROBADO',
    rev: '0',
    fecha_envio: '12/6/2026',
    fecha_aprobacion: '12/6/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  }
];

// ZONAS ARQUITECTÓNICAS 3D DEL GEMELO DIGITAL SUBESTACIÓN CONVERTIDORA KIMAL
const INITIAL_ZONAS_BIM_3D = [
  {
    zonaId: 'Patio de Transformadores',
    titulo: 'Patio de Transformadores Convertidores',
    partida: '1.- Obras Civiles',
    tipoGeometria: 'transformador',
    pos: { x: -8, z: -4 },
    size: { w: 9, h: 2.6, d: 6 },
    estatusDominante: 'Recibido / Toma de Conocimiento',
    colorHex: 0x10b981,
    resumen: '5 Planos de Fundaciones (L0001 a L0005): Disposición, Detalles, Topes Sísmicos y Armaduras (Rev 3 y Rev 5).'
  },
  {
    zonaId: 'Edificio de Válvulas 1',
    titulo: 'Edificio de Válvulas 1 (HVDC)',
    partida: '3.- Montaje Estructural y Electromecánico',
    tipoGeometria: 'edificio',
    pos: { x: 0, z: -5 },
    size: { w: 6.5, h: 4.8, d: 5.2 },
    estatusDominante: 'Devuelto con Comentarios',
    colorHex: 0xef4444,
    resumen: 'Memoria de Cálculo Fundaciones MCA-E-0002 en Rev. 5 con estatus Devuelto con Comentarios (28/9/2026).'
  },
  {
    zonaId: 'Edificio de Control',
    titulo: 'Edificio de Control Principal',
    partida: '5.- Montaje Eléctrico y C&P',
    tipoGeometria: 'edificio',
    pos: { x: 7.5, z: -5 },
    size: { w: 4.8, h: 3.4, d: 4.2 },
    estatusDominante: 'Devuelto con Comentarios',
    colorHex: 0xef4444,
    resumen: 'Memoria de Cálculo Fundaciones MCA-E-0001 en Rev. 2 Devuelto con Comentarios (29/9/2026).'
  },
  {
    zonaId: 'Edificio STATCOM',
    titulo: 'Edificio STATCOM',
    partida: '6.- Pruebas y Comisionamiento (aún no definido)',
    tipoGeometria: 'edificio',
    pos: { x: 8.5, z: 3.5 },
    size: { w: 5.2, h: 3.2, d: 4.5 },
    estatusDominante: 'Revisado con comentarios',
    colorHex: 0xf59e0b,
    resumen: 'Memoria de Cálculo Fundaciones MCA-E-0010 en Rev. 2 Revisado con comentarios.'
  },
  {
    zonaId: 'Patio HVDC',
    titulo: 'Estructuras Altas - Patio HVDC',
    partida: '4.- Montaje Alta Tensión',
    tipoGeometria: 'torre_hvdc',
    pos: { x: -1, z: 4.5 },
    size: { w: 6, h: 6.5, d: 5 },
    estatusDominante: 'Devuelto con Comentarios',
    colorHex: 0xef4444,
    resumen: 'Estructuras Altas Patio HVDC (MCA-E-0011 Rev. 2) Devuelto con Comentarios. Avance AT: 15% Protocolizado.'
  },
  {
    zonaId: 'Patio Filtros 220kV AC',
    titulo: 'Patio de Filtros 220kV AC (Marcos Simple/Doble y Barra 2)',
    partida: '4.- Montaje Alta Tensión',
    tipoGeometria: 'patio_ac',
    pos: { x: -9.5, z: 4.8 },
    size: { w: 6.5, h: 5.8, d: 5 },
    estatusDominante: 'Alerta Aconex / Comentarios',
    colorHex: 0xf97316,
    resumen: 'MCA-E-0012 Rev. 3 (Desactualizado en Aconex) y MCA-E-0013 Rev. 1 (Revisado con comentarios).'
  },
  {
    zonaId: 'Patio 66kV AC',
    titulo: 'Estructuras Altas - Patio 66kV AC',
    partida: '4.- Montaje Alta Tensión',
    tipoGeometria: 'patio_ac',
    pos: { x: 14, z: -1 },
    size: { w: 4.5, h: 4.5, d: 4.5 },
    estatusDominante: 'Toma de Conocimiento (Sin Aconex)',
    colorHex: 0x38bdf8,
    resumen: 'MCA-E-0014 Rev. 4 aprobada el 13/8/2026 en Toma de Conocimiento (Observación: No disponible en Aconex).'
  },
  {
    zonaId: 'Caseta de Guardia',
    titulo: 'Caseta de Guardia y Control Acceso',
    partida: '1.- Obras Civiles',
    tipoGeometria: 'edificio',
    pos: { x: -14.5, z: 8.5 },
    size: { w: 2.8, h: 2.0, d: 2.4 },
    estatusDominante: 'Toma de Conocimiento',
    colorHex: 0x10b981,
    resumen: 'MCA-E-0008 Rev. 3 aprobada en Toma de Conocimiento (7/10/2025).'
  },
  {
    zonaId: 'Canaletas y Drenaje',
    titulo: 'Red de Canaletas (37% Protocolizado) y Drenaje Hidráulico',
    partida: '2.- Construcción de Canaletas (aún no definido)',
    tipoGeometria: 'canaleta',
    pos: { x: 0, z: 0 },
    size: { w: 26, h: 0.45, d: 1.4 },
    estatusDominante: '37% Protocolizado (103/280)',
    colorHex: 0x00f2fe,
    resumen: 'Lidera el % de protocolización en SE KIMAL (103 cerrados de 280 proyectados = 37%). Incluye ITC-I-0001 e ITC-I-0002.'
  }
];

// ============================================================================
// 2. MOTOR INTERACTIVO DE GRÁFICAS 3D Y GEMELO DIGITAL (THREE.JS)
// ============================================================================

function ThreeKimalScene({
  viewMode3D,
  setViewMode3D,
  zonasBim,
  avanceData,
  ingenieriaData,
  procedimientosData,
  selectedZoneId,
  setSelectedZoneId,
  selectedPartida,
  setSelectedPartida,
  wireframe,
  isNightMode,
  autoRotate,
  cameraPreset,
  onOpenNewStructureModal
}) {
  const mountRef = useRef(null);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const interactablesRef = useRef([]);

  const orbitRef = useRef({
    theta: 0.62,
    phi: 0.96,
    radius: 35,
    targetX: 0,
    targetY: 1.5,
    targetZ: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    particles: null,
    pulsingRings: []
  });

  // Ajustar cámara según preset o zona seleccionada
  useEffect(() => {
    const st = orbitRef.current;
    if (cameraPreset === 'isometric') {
      st.theta = 0.62;
      st.phi = 0.96;
      st.radius = 35;
      st.targetX = 0;
      st.targetZ = 0;
    } else if (cameraPreset === 'top') {
      st.theta = 0;
      st.phi = 0.14;
      st.radius = 40;
      st.targetX = 0;
      st.targetZ = 0;
    } else if (cameraPreset === 'front') {
      st.theta = 0;
      st.phi = 1.35;
      st.radius = 32;
      st.targetX = 0;
      st.targetZ = 0;
    } else if (cameraPreset === 'side') {
      st.theta = 1.56;
      st.phi = 1.28;
      st.radius = 34;
      st.targetX = 0;
      st.targetZ = 0;
    }
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x060b16 : 0x0f172a);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x060b16 : 0x0f172a, 0.011);

    const width = container.clientWidth || 850;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminación
    const ambient = new THREE.AmbientLight(isNightMode ? 0x60a5fa : 0xffffff, isNightMode ? 0.65 : 0.95);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, isNightMode ? 1.25 : 1.65);
    dirLight.position.set(24, 38, 22);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 1.5, 55);
    cyanLight.position.set(0, 14, 0);
    scene.add(cyanLight);

    // Suelo de la Subestación Kimal (Mecánica de Suelos ITC-E-0001 Rev 8)
    const groundGeo = new THREE.BoxGeometry(44, 0.6, 28);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x0b1324 : 0x1e293b,
      roughness: 0.75,
      metalness: 0.25,
      wireframe
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(44, 44, 0x00f2fe, isNightMode ? 0x1e293b : 0x334155);
    grid.position.y = 0.02;
    scene.add(grid);

    interactablesRef.current = [];
    orbitRef.current.pulsingRings = [];
    orbitRef.current.particles = null;

    // ========================================================================
    // MODO 1: GEMELO DIGITAL 3D SUBESTACIÓN CONVERTIDORA KIMAL (BIM + ACONEX)
    // ========================================================================
    if (viewMode3D === 'bim3d') {
      const hvdcNodes = [];

      zonasBim.forEach((z) => {
        const group = new THREE.Group();
        group.position.set(z.pos.x, 0, z.pos.z);

        const isSelected = selectedZoneId === z.zonaId;
        const docsZona = ingenieriaData.filter((d) => d.zona3d === z.zonaId);
        const tipoGeo = z.tipoGeometria || (z.zonaId.includes('Transformadores') ? 'transformador' : z.zonaId.includes('Patio') ? 'torre_hvdc' : z.zonaId.includes('Canaletas') ? 'canaleta' : 'edificio');

        // Losas de fundación civil
        const slabGeo = new THREE.BoxGeometry(z.size.w + 0.8, 0.35, z.size.d + 0.8);
        const slabMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x00f2fe : 0x334155,
          roughness: 0.6,
          wireframe
        });
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.y = 0.17;
        group.add(slab);

        if (tipoGeo === 'transformador') {
          const numUnits = z.zonaId === 'Patio de Transformadores' ? 5 : 3;
          const step = z.size.w / (numUnits + 0.5);
          for (let i = 0; i < numUnits; i++) {
            const txOffset = -((numUnits - 1) * step) / 2 + i * step;
            const txGeo = new THREE.BoxGeometry(1.1, 2.2, 2.4);
            const txMat = new THREE.MeshStandardMaterial({
              color: z.colorHex || 0x10b981,
              metalness: 0.65,
              roughness: 0.25,
              emissive: z.colorHex || 0x10b981,
              emissiveIntensity: isSelected ? 0.45 : 0.18,
              wireframe
            });
            const txMesh = new THREE.Mesh(txGeo, txMat);
            txMesh.position.set(txOffset, 1.45, 0);
            txMesh.castShadow = true;
            txMesh.userData = {
              tipo: 'zonaBIM',
              zona: z,
              subtitulo: `${z.titulo} · Unidad #${i + 1} (${docsZona.length} Docs ACONEX)`,
              docsCount: docsZona.length
            };
            group.add(txMesh);
            interactablesRef.current.push(txMesh);

            const bushGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 10);
            const bushMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
            const bush = new THREE.Mesh(bushGeo, bushMat);
            bush.position.set(txOffset, 3.1, 0.6);
            bush.rotation.x = 0.35;
            group.add(bush);
          }
          hvdcNodes.push(new THREE.Vector3(z.pos.x, 3.6, z.pos.z));
        } else if (tipoGeo === 'torre_hvdc' || tipoGeo === 'patio_ac') {
          const cols = [-z.size.w / 3, z.size.w / 3];
          cols.forEach((cx) => {
            const towerGeo = new THREE.CylinderGeometry(0.22, 0.7, z.size.h, 4);
            const towerMat = new THREE.MeshStandardMaterial({
              color: z.colorHex,
              emissive: z.colorHex,
              emissiveIntensity: isSelected ? 0.5 : 0.22,
              wireframe: true
            });
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(cx, z.size.h / 2 + 0.3, 0);
            tower.rotation.y = Math.PI / 4;
            group.add(tower);
          });

          const beamGeo = new THREE.BoxGeometry(z.size.w, 0.35, 0.35);
          const beamMat = new THREE.MeshStandardMaterial({ color: z.colorHex, metalness: 0.7, wireframe });
          const beam = new THREE.Mesh(beamGeo, beamMat);
          beam.position.set(0, z.size.h + 0.1, 0);
          group.add(beam);

          const hitGeo = new THREE.BoxGeometry(z.size.w, z.size.h, z.size.d);
          const hitMat = new THREE.MeshStandardMaterial({
            color: z.colorHex,
            transparent: true,
            opacity: isSelected ? 0.32 : 0.16,
            wireframe: false
          });
          const hitBox = new THREE.Mesh(hitGeo, hitMat);
          hitBox.position.y = z.size.h / 2 + 0.35;
          hitBox.userData = {
            tipo: 'zonaBIM',
            zona: z,
            subtitulo: `${z.estatusDominante} · ${docsZona.length} Doc(s) Ingeniería`,
            docsCount: docsZona.length
          };
          group.add(hitBox);
          interactablesRef.current.push(hitBox);

          hvdcNodes.push(new THREE.Vector3(z.pos.x, z.size.h + 0.2, z.pos.z));
        } else if (tipoGeo === 'canaleta') {
          const canalGeo = new THREE.BoxGeometry(z.size.w, z.size.h, z.size.d);
          const canalMat = new THREE.MeshStandardMaterial({
            color: z.colorHex || 0x00f2fe,
            emissive: z.colorHex || 0x00f2fe,
            emissiveIntensity: isSelected ? 0.6 : 0.35,
            roughness: 0.2,
            wireframe
          });
          const canalMesh = new THREE.Mesh(canalGeo, canalMat);
          canalMesh.position.y = 0.35;
          canalMesh.userData = {
            tipo: 'zonaBIM',
            zona: z,
            subtitulo: `${z.estatusDominante} · ${docsZona.length} Doc(s)`,
            docsCount: docsZona.length
          };
          group.add(canalMesh);
          interactablesRef.current.push(canalMesh);
        } else {
          const bldgGeo = new THREE.BoxGeometry(z.size.w, z.size.h, z.size.d);
          const bldgMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.55,
            roughness: 0.3,
            emissive: z.colorHex,
            emissiveIntensity: isSelected ? 0.5 : 0.22,
            wireframe
          });
          const bldg = new THREE.Mesh(bldgGeo, bldgMat);
          bldg.position.y = z.size.h / 2 + 0.35;
          bldg.castShadow = true;
          bldg.userData = {
            tipo: 'zonaBIM',
            zona: z,
            subtitulo: `${z.estatusDominante} · ${docsZona.length} Doc(s) en ACONEX`,
            docsCount: docsZona.length
          };
          group.add(bldg);
          interactablesRef.current.push(bldg);

          const roofGeo = new THREE.BoxGeometry(z.size.w + 0.2, 0.22, z.size.d + 0.2);
          const roofMat = new THREE.MeshBasicMaterial({ color: z.colorHex });
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.y = z.size.h + 0.45;
          group.add(roof);

          hvdcNodes.push(new THREE.Vector3(z.pos.x, z.size.h + 0.5, z.pos.z));
        }

        // Anillo indicador pulsante en la base de cada zona
        const ringGeo = new THREE.RingGeometry(
          Math.max(z.size.w, z.size.d) * 0.58,
          Math.max(z.size.w, z.size.d) * 0.64,
          32
        );
        const ringMat = new THREE.MeshBasicMaterial({
          color: z.colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.45
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.08;
        group.add(ring);
        orbitRef.current.pulsingRings.push(ring);

        scene.add(group);
      });

      // Líneas aéreas de interconexión en el patio + partículas energizadas
      if (hvdcNodes.length > 1) {
        const allCurvePts = [];
        for (let i = 0; i < hvdcNodes.length - 1; i++) {
          const p1 = hvdcNodes[i];
          const p2 = hvdcNodes[i + 1];
          const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
          mid.y += 1.2;
          const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
          const pts = curve.getPoints(20);
          allCurvePts.push(...pts);

          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
          scene.add(new THREE.Line(lineGeo, lineMat));
        }

        const pCount = 45;
        const pGeo = new THREE.BufferGeometry();
        const posArr = new Float32Array(pCount * 3);
        pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x00f2fe, size: 0.42 });
        const particles = new THREE.Points(pGeo, pMat);
        particles.userData = { curvePoints: allCurvePts };
        scene.add(particles);
        orbitRef.current.particles = particles;
      }
    }

    // ========================================================================
    // MODO 3: MATRIZ 3D ACONEX (DOCUMENTOS INGENIERÍA + PROCEDIMIENTOS)
    // ========================================================================
    else if (viewMode3D === 'aconex3d') {
      // Fila Trasera: Documentos de Ingeniería (altura = N° de Revisión + 1)
      ingenieriaData.forEach((doc, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const xPos = -14 + col * 4.0;
        const zPos = -6.5 + row * 3.8;

        const revNum = parseInt(doc.rev, 10) || 1;
        const height = Math.max(1.2, revNum * 1.15);

        const colorByStatus =
          doc.estatus === 'Toma de Conocimiento'
            ? 0x10b981
            : doc.estatus === 'Toma de Conocimiento con Pendientes'
            ? 0x38bdf8
            : doc.estatus === 'Recibido'
            ? 0x3b82f6
            : doc.estatus === 'Revisado con comentarios'
            ? 0xf59e0b
            : 0xef4444;

        const boxGeo = new THREE.BoxGeometry(1.7, height, 1.7);
        const boxMat = new THREE.MeshStandardMaterial({
          color: colorByStatus,
          emissive: colorByStatus,
          emissiveIntensity: 0.28,
          metalness: 0.5,
          roughness: 0.25,
          wireframe
        });
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.set(xPos, height / 2, zPos);
        mesh.castShadow = true;
        mesh.userData = {
          tipo: 'docCivil3D',
          doc,
          subtitulo: `${doc.disciplina || '01 Ingeniería - Civil'} · Rev. ${doc.rev} · ${doc.estatus}`
        };
        scene.add(mesh);
        interactablesRef.current.push(mesh);
      });

      // Fila Delantera: Procedimientos Conversora Kimal (Cilindros Hexagonales)
      procedimientosData.forEach((proc, idx) => {
        const col = idx % 11;
        const row = Math.floor(idx / 11);
        const xPos = -15 + col * 3.0;
        const zPos = 5.5 + row * 3.2;
        const revNum = parseInt(proc.rev, 10) || 0;
        const height = proc.estatus === 'ELIMINADO' ? 1.2 : Math.max(2.2, (revNum + 1) * 1.8);

        const procColor =
          proc.estatus === 'APROBADO'
            ? 0x10b981
            : proc.estatus === 'ACONEX' || proc.estatus === 'EN REVISIÓN'
            ? 0x00f2fe
            : 0xef4444;

        const cylGeo = new THREE.CylinderGeometry(0.85, 0.85, height, 6);
        const cylMat = new THREE.MeshStandardMaterial({
          color: procColor,
          emissive: procColor,
          emissiveIntensity: 0.3,
          metalness: 0.6,
          roughness: 0.2,
          wireframe
        });
        const mesh = new THREE.Mesh(cylGeo, cylMat);
        mesh.position.set(xPos, height / 2, zPos);
        mesh.castShadow = true;
        mesh.userData = {
          tipo: 'docProc3D',
          proc,
          subtitulo: `Procedimiento ${proc.area} · ${proc.estatus} (Rev. ${proc.rev || '-'})`
        };
        scene.add(mesh);
        interactablesRef.current.push(mesh);
      });
    }

    // ========================================================================
    // INTERACCIÓN ORBITAL Y RAYCASTING
    // ========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const updateCamera = () => {
      const st = orbitRef.current;
      camera.position.x = st.targetX + st.radius * Math.sin(st.phi) * Math.sin(st.theta);
      camera.position.y = st.targetY + st.radius * Math.cos(st.phi);
      camera.position.z = st.targetZ + st.radius * Math.sin(st.phi) * Math.cos(st.theta);
      camera.lookAt(st.targetX, st.targetY, st.targetZ);
    };

    const onMouseDown = (e) => {
      orbitRef.current.isDragging = true;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
    };

    const onMouseUp = () => {
      orbitRef.current.isDragging = false;
    };

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const st = orbitRef.current;

      if (st.isDragging) {
        const dx = e.clientX - st.lastX;
        const dy = e.clientY - st.lastY;
        st.theta -= dx * 0.008;
        st.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.06, st.phi - dy * 0.008));
        st.lastX = e.clientX;
        st.lastY = e.clientY;
      }

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(interactablesRef.current, false);
      if (hits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        setHoveredInfo(hits[0].object.userData);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        renderer.domElement.style.cursor = st.isDragging ? 'grabbing' : 'grab';
        setHoveredInfo(null);
      }
    };

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(interactablesRef.current, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data.tipo === 'zonaBIM' && data.zona) {
          setSelectedZoneId(data.zona.zonaId);
        } else if (data.tipo === 'barraAvance' && data.partida) {
          setSelectedPartida(data.partida);
        } else if (data.tipo === 'docCivil3D' && data.doc) {
          setSelectedZoneId(data.doc.zona3d);
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      orbitRef.current.radius = Math.max(14, Math.min(65, orbitRef.current.radius + e.deltaY * 0.025));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('click', onClick);
    dom.addEventListener('wheel', onWheel, { passive: false });

    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const st = orbitRef.current;

      if (autoRotate && !st.isDragging) {
        st.theta += 0.0022;
      }

      st.pulsingRings.forEach((r, idx) => {
        const s = 1 + Math.sin(t * 2.8 + idx) * 0.08;
        r.scale.set(s, s, 1);
      });

      if (st.particles && st.particles.userData.curvePoints) {
        const pts = st.particles.userData.curvePoints;
        const arr = st.particles.geometry.attributes.position.array;
        const total = arr.length / 3;
        for (let i = 0; i < total; i++) {
          const pIdx = Math.floor(((t * 0.22 + i / total) % 1) * (pts.length - 1));
          const pt = pts[pIdx] || pts[0];
          arr[i * 3] = pt.x;
          arr[i * 3 + 1] = pt.y;
          arr[i * 3 + 2] = pt.z;
        }
        st.particles.geometry.attributes.position.needsUpdate = true;
      }

      updateCamera();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('click', onClick);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [viewMode3D, zonasBim, avanceData, ingenieriaData, procedimientosData, selectedZoneId, selectedPartida, wireframe, isNightMode, autoRotate]);

  return (
    <div className="relative w-full h-full min-h-[470px] rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
      <div ref={mountRef} className="w-full h-full min-h-[470px]" />

      {/* Conmutador Superior de Escenarios 3D Reales + Botón Agregar Estructura 3D */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-xl">
          <button
            onClick={() => setViewMode3D('bim3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode3D === 'bim3d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            1. Gemelo 3D Subestación Kimal ({zonasBim.length})
          </button>
          <button
            onClick={() => setViewMode3D('avance3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode3D === 'avance3d'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            2. Barras 3D Avance ({avanceData.length} Partidas)
          </button>
          <button
            onClick={() => setViewMode3D('aconex3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode3D === 'aconex3d'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Matriz 3D ACONEX ({ingenieriaData.length + procedimientosData.length} Docs)
          </button>
        </div>

        {onOpenNewStructureModal && (
          <button
            onClick={onOpenNewStructureModal}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Añadir Estructura / Equipo al Mapa 3D
          </button>
        )}
      </div>

      {/* Leyenda Inferior Dinámica */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
        {viewMode3D === 'bim3d' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Toma de Conocimiento / Recibido (Patio Transformadores, Caseta)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Revisado con Comentarios (STATCOM, Hidrología)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Devuelto con Comentarios (Edif. Válvulas 1, Control, Patio HVDC, 220kV)
            </span>
          </div>
        )}
        {viewMode3D === 'avance3d' && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Barra Azul: Total Proyectado (6.995)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Barra Verde: Cerrado Protocolizado (513)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Cilindro: % Protocolizado (Canaletas 37%, AT 15%, Civiles 10%)
            </span>
          </div>
        )}
        {viewMode3D === 'aconex3d' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Aprobado / Toma Conocimiento
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> Recibido (L0002-L0005)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Revisado con Comentarios
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Devuelto con Comentarios / Eliminado
            </span>
            <span className="text-cyan-300 font-semibold">Altura 3D = N° de Revisión (Rev. 0 a Rev. 8)</span>
          </div>
        )}
      </div>

      {/* Tooltip Flotante en Raycasting */}
      {hoveredInfo && (
        <div
          style={{
            left: Math.min(tooltipPos.x + 15, 480),
            top: Math.max(tooltipPos.y - 20, 15)
          }}
          className="pointer-events-none absolute z-30 bg-slate-900/95 backdrop-blur-md border border-cyan-400/70 rounded-xl p-3 shadow-2xl text-xs max-w-xs"
        >
          {hoveredInfo.tipo === 'zonaBIM' && (
            <>
              <p className="font-bold text-cyan-400">{hoveredInfo.zona.titulo}</p>
              <p className="text-[11px] text-white mt-0.5">{hoveredInfo.subtitulo}</p>
              <p className="text-[11px] text-slate-300 mt-1">{hoveredInfo.zona.resumen}</p>
              <p className="text-[10px] text-cyan-300 mt-1.5 italic">Clic para filtrar sus planos en 01 Ingeniería - Civil</p>
            </>
          )}
          {hoveredInfo.tipo === 'barraAvance' && (
            <>
              <p className="font-bold text-emerald-400">
                {hoveredInfo.partida.item} {hoveredInfo.partida.nombre}
              </p>
              <p className="text-[11px] text-white mt-1">{hoveredInfo.subtitulo}</p>
              <div className="grid grid-cols-2 gap-1 mt-1.5 text-[11px] text-slate-300">
                <span>Proyectado: <strong>{hoveredInfo.partida.proyectado}</strong></span>
                <span>Protocolizado: <strong>{hoveredInfo.partida.cerrado_protocolizado}</strong></span>
                <span>Ejecutados SP: <strong>{hoveredInfo.partida.ejecutados_sp}</strong></span>
                <span>En ITO %: <strong>{hoveredInfo.partida.en_ito}%</strong></span>
              </div>
            </>
          )}
          {hoveredInfo.tipo === 'docCivil3D' && (
            <>
              <p className="font-mono font-bold text-cyan-400">{hoveredInfo.doc.codigo}</p>
              <p className="text-white font-semibold mt-0.5">{hoveredInfo.doc.nombre}</p>
              <p className="text-[11px] text-amber-300 mt-1">{hoveredInfo.subtitulo}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Transmittal: {hoveredInfo.doc.recibido_en || 'N/A'}</p>
            </>
          )}
          {hoveredInfo.tipo === 'docProc3D' && (
            <>
              <p className="font-mono font-bold text-amber-400">{hoveredInfo.proc.codigo}</p>
              <p className="text-white font-semibold mt-0.5">{hoveredInfo.proc.nombre}</p>
              <p className="text-[11px] text-cyan-300 mt-1">{hoveredInfo.subtitulo}</p>
              {hoveredInfo.proc.observaciones && (
                <p className="text-[10px] text-slate-300 mt-1">{hoveredInfo.proc.observaciones}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. COMPONENTE PRINCIPAL DE LA SUITE INTEGRADA SE KIMAL
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados con persistencia en LocalStorage e inicializados con los datos exactos de las 3 imágenes
  const [avanceKimal, setAvanceKimal] = useState(() => {
    try {
      const saved = localStorage.getItem('kimal_avance_v2');
      return saved ? JSON.parse(saved) : INITIAL_AVANCE_KIMAL;
    } catch {
      return INITIAL_AVANCE_KIMAL;
    }
  });

  const [ingenieriaCivil, setIngenieriaCivil] = useState(() => {
    try {
      const saved = localStorage.getItem('kimal_ingenieria_v2');
      return saved ? JSON.parse(saved) : INITIAL_INGENIERIA_CIVIL;
    } catch {
      return INITIAL_INGENIERIA_CIVIL;
    }
  });

  const [procedimientosKimal, setProcedimientosKimal] = useState(() => {
    try {
      const saved = localStorage.getItem('kimal_procedimientos_v2');
      return saved ? JSON.parse(saved) : INITIAL_PROCEDIMIENTOS_KIMAL;
    } catch {
      return INITIAL_PROCEDIMIENTOS_KIMAL;
    }
  });

  const [zonasBim, setZonasBim] = useState(() => {
    try {
      const saved = localStorage.getItem('kimal_zonas3d_v2');
      return saved ? JSON.parse(saved) : INITIAL_ZONAS_BIM_3D;
    } catch {
      return INITIAL_ZONAS_BIM_3D;
    }
  });

  // Guardar automáticamente cualquier nuevo registro o cambio en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('kimal_avance_v2', JSON.stringify(avanceKimal));
    } catch {}
  }, [avanceKimal]);

  useEffect(() => {
    try {
      localStorage.setItem('kimal_ingenieria_v2', JSON.stringify(ingenieriaCivil));
    } catch {}
  }, [ingenieriaCivil]);

  useEffect(() => {
    try {
      localStorage.setItem('kimal_procedimientos_v2', JSON.stringify(procedimientosKimal));
    } catch {}
  }, [procedimientosKimal]);

  useEffect(() => {
    try {
      localStorage.setItem('kimal_zonas3d_v2', JSON.stringify(zonasBim));
    } catch {}
  }, [zonasBim]);

  // Estados del Visor 3D
  const [viewMode3D, setViewMode3D] = useState('bim3d'); // 'bim3d' | 'avance3d' | 'aconex3d'
  const [selectedZoneId, setSelectedZoneId] = useState('Patio de Transformadores');
  const [selectedPartida, setSelectedPartida] = useState(INITIAL_AVANCE_KIMAL[0]);
  const [wireframe, setWireframe] = useState(false);
  const [isNightMode, setIsNightMode] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('isometric');

  // Filtros para Tabla 01 Ingeniería - Civil
  const [searchCivil, setSearchCivil] = useState('');
  const [filterEstatusCivil, setFilterEstatusCivil] = useState('Todos');
  const [filterTransmittal, setFilterTransmittal] = useState('Todos');
  const [filterDisciplinaCivil, setFilterDisciplinaCivil] = useState('Todas');

  // Filtros para Tabla Procedimientos Conversora Kimal
  const [searchProc, setSearchProc] = useState('');
  const [filterAreaProc, setFilterAreaProc] = useState('Todas');
  const [filterEstatusProc, setFilterEstatusProc] = useState('Todos');

  // ==========================================================================
  // ESTADOS DE MODALES PARA AGREGAR MÁS REGISTROS E IMPORTAR DESDE EXCEL
  // ==========================================================================
  const [modalType, setModalType] = useState(null); // 'partida' | 'ingenieria' | 'procedimiento' | 'estructura3d' | 'importExcel'
  const [importTarget, setImportTarget] = useState('ingenieria'); // 'avance' | 'ingenieria' | 'procedimientos'
  const [excelPasteText, setExcelPasteText] = useState('');

  // Formulario Nueva Partida (Tabla 1 + Barra 3D + Opción de Nodo 3D)
  const [newPartidaForm, setNewPartidaForm] = useState({
    item: '',
    nombre: '',
    proyectado: 250,
    ejecutados_sp: 10,
    en_ito: 5,
    cerrado_protocolizado: 45,
    zona3d: 'Patio HVDC',
    descripcionZona: '',
    crearEstructura3D: true,
    tipoGeometria: 'edificio'
  });

  // Formulario Nuevo Documento Ingeniería ACONEX (Tabla 2 + Matriz 3D)
  const [newDocCivilForm, setNewDocCivilForm] = useState({
    disciplina: '01 Ingeniería - Civil',
    tipoDoc: 'MCA', // ITC, MCA, PLN, ETT
    codigo: '',
    nombre: '',
    rev: '0',
    estatus: 'Recibido',
    recibido_en: 'CSG-XEEC-TRN-000106',
    fecha_actualizacion: '12/11/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles'
  });

  // Formulario Nuevo Procedimiento Conversora Kimal (Tabla 3 + Matriz 3D)
  const [newProcForm, setNewProcForm] = useState({
    area: 'SSO',
    esp: 'SSO',
    nombre: '',
    codigo: '',
    estatus: 'APROBADO',
    rev: '0',
    fecha_envio: '12/11/2026',
    fecha_aprobacion: '12/11/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado'
  });

  // Formulario Nueva Estructura / Nodo para el Gemelo Digital 3D
  const [newZona3DForm, setNewZona3DForm] = useState({
    zonaId: '',
    titulo: '',
    partida: '1.- Obras Civiles',
    tipoGeometria: 'edificio',
    estatusDominante: 'Recibido / En Construcción',
    colorHex: '#00f2fe',
    w: 5.0,
    h: 3.8,
    d: 4.5,
    resumen: ''
  });

  // Notificación Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3800);
  };

  // ==========================================================================
  // GENERADORES AUTOMÁTICOS DE CÓDIGOS CORRELATIVOS ACONEX KIMAL
  // ==========================================================================
  const generarCodigoIngenieria = (disciplina = '01 Ingeniería - Civil', tipo = 'MCA') => {
    const discCode =
      disciplina.includes('Eléctrica') ? 'EL' :
      disciplina.includes('Electromecánica') ? 'EM' :
      disciplina.includes('Control') ? 'CP' : 'CV';
    const nextNum = String(ingenieriaCivil.length + 15).padStart(4, '0');
    return `CNX-KILO-001-DS-CK-${discCode}-${tipo}-E-${nextNum}`;
  };

  const generarCodigoProcedimiento = (area = 'SSO') => {
    const areaPrefix = area === 'QC' || area === 'OPER' ? 'CS-CK-CV' : 'HS-CK-NN';
    const nextNum = String(procedimientosKimal.length + 54).padStart(4, '0');
    return `CNX-KILO-001-${areaPrefix}-PRC-E-${nextNum}`;
  };

  const openModalNuevo = (type) => {
    if (type === 'partida') {
      const nextIdx = avanceKimal.length + 1;
      setNewPartidaForm({
        item: `${nextIdx}.-`,
        nombre: '',
        proyectado: 300,
        ejecutados_sp: 12,
        en_ito: 10,
        cerrado_protocolizado: 45,
        zona3d: selectedZoneId || 'Patio HVDC',
        descripcionZona: 'Nuevo frente de trabajo incorporado a SE KIMAL',
        crearEstructura3D: false,
        tipoGeometria: 'edificio'
      });
    } else if (type === 'ingenieria') {
      setNewDocCivilForm((prev) => ({
        ...prev,
        codigo: generarCodigoIngenieria(prev.disciplina, prev.tipoDoc),
        zona3d: selectedZoneId || 'Patio de Transformadores'
      }));
    } else if (type === 'procedimiento') {
      setNewProcForm((prev) => ({
        ...prev,
        codigo: generarCodigoProcedimiento(prev.area)
      }));
    } else if (type === 'estructura3d') {
      setNewZona3DForm({
        zonaId: '',
        titulo: '',
        partida: avanceKimal[0]?.item + ' ' + avanceKimal[0]?.nombre || '1.- Obras Civiles',
        tipoGeometria: 'edificio',
        estatusDominante: 'Toma de Conocimiento',
        colorHex: '#10b981',
        w: 5.2,
        h: 3.8,
        d: 4.5,
        resumen: ''
      });
    }
    setModalType(type);
  };

  // ==========================================================================
  // FUNCIONES CRUD PARA AGREGAR, EDITAR Y ELIMINAR EN LAS 3 TABLAS Y EL 3D
  // ==========================================================================

  // 1. Agregar Nueva Partida a Tabla 1 (SE KIMAL) + Barra 3D
  const handleAddPartidaSubmit = (e) => {
    e.preventDefault();
    if (!newPartidaForm.nombre.trim()) return;
    const proy = Math.max(1, Number(newPartidaForm.proyectado) || 0);
    const cerr = Math.max(0, Number(newPartidaForm.cerrado_protocolizado) || 0);
    const pct = Math.min(100, Math.round((cerr / proy) * 100));
    const nextIdx = avanceKimal.length + 1;

    let targetZona3d = newPartidaForm.zona3d;

    // Si el usuario marcó crear también un edificio/estructura en el mapa 3D
    if (newPartidaForm.crearEstructura3D) {
      targetZona3d = newPartidaForm.nombre.trim();
      const angle = zonasBim.length * 0.85;
      const radius = 12 + (zonasBim.length % 3) * 3;
      const nuevaZona = {
        zonaId: targetZona3d,
        titulo: targetZona3d,
        partida: `${newPartidaForm.item || `${nextIdx}.-`} ${newPartidaForm.nombre}`,
        tipoGeometria: newPartidaForm.tipoGeometria,
        pos: {
          x: Math.round(Math.cos(angle) * radius * 10) / 10,
          z: Math.round(Math.sin(angle) * radius * 10) / 10
        },
        size: { w: 5.0, h: 3.8, d: 4.4 },
        estatusDominante: `${pct}% Protocolizado`,
        colorHex: pct >= 30 ? 0x10b981 : pct >= 10 ? 0x00f2fe : 0xf59e0b,
        resumen: newPartidaForm.descripcionZona || `Partida agregada con ${proy} protocolos proyectados.`
      };
      setZonasBim((prev) => [...prev, nuevaZona]);
      setSelectedZoneId(targetZona3d);
    }

    const nuevaPartida = {
      item: newPartidaForm.item || `${nextIdx}.-`,
      id: `PART-0${nextIdx}-${Date.now().toString().slice(-3)}`,
      nombre: newPartidaForm.nombre.trim(),
      proyectado: proy,
      ejecutados_sp: Number(newPartidaForm.ejecutados_sp) || 0,
      en_ito: Number(newPartidaForm.en_ito) || 0,
      cerrado_protocolizado: cerr,
      protocolizado_pct: pct,
      zona3d: targetZona3d,
      descripcionZona: newPartidaForm.descripcionZona || 'Frente operativo SE KIMAL',
      pos3d: { x: -11 + nextIdx * 3.5, z: 0 }
    };

    setAvanceKimal((prev) => [...prev, nuevaPartida]);
    setSelectedPartida(nuevaPartida);
    setModalType(null);
    showToast(`Nueva partida "${nuevaPartida.nombre}" agregada a SE KIMAL y al visor 3D`);
  };

  // 2. Agregar Nuevo Documento de Ingeniería (Tabla 2 + Matriz 3D)
  const handleAddDocCivilSubmit = (e) => {
    e.preventDefault();
    if (!newDocCivilForm.nombre.trim()) return;
    const nuevoDoc = {
      id: Date.now(),
      disciplina: newDocCivilForm.disciplina || '01 Ingeniería - Civil',
      codigo: newDocCivilForm.codigo.trim() || generarCodigoIngenieria(newDocCivilForm.disciplina, newDocCivilForm.tipoDoc),
      nombre: newDocCivilForm.nombre.trim(),
      rev: String(newDocCivilForm.rev || '0'),
      estatus: newDocCivilForm.estatus,
      recibido_en: newDocCivilForm.recibido_en.trim(),
      fecha_actualizacion: newDocCivilForm.fecha_actualizacion || '12/11/2026',
      fecha_aprobado: newDocCivilForm.fecha_aprobado || '',
      observaciones: newDocCivilForm.observaciones.trim(),
      zona3d: newDocCivilForm.zona3d,
      partidaVinculada: newDocCivilForm.partidaVinculada
    };
    setIngenieriaCivil((prev) => [nuevoDoc, ...prev]);
    setSelectedZoneId(nuevoDoc.zona3d);
    setModalType(null);
    showToast(`Documento ${nuevoDoc.codigo} agregado y vinculado a ${nuevoDoc.zona3d} en 3D`);
  };

  // 3. Agregar Nuevo Procedimiento (Tabla 3 + Matriz 3D)
  const handleAddProcSubmit = (e) => {
    e.preventDefault();
    if (!newProcForm.nombre.trim()) return;
    const nextItemNum =
      procedimientosKimal.length > 0
        ? Math.max(...procedimientosKimal.map((p) => Number(p.item) || 0)) + 1
        : 1;
    const nuevoProc = {
      item: nextItemNum,
      area: newProcForm.area,
      esp: newProcForm.esp || newProcForm.area,
      nombre: newProcForm.nombre.trim(),
      codigo: newProcForm.codigo.trim() || generarCodigoProcedimiento(newProcForm.area),
      estatus: newProcForm.estatus,
      rev: String(newProcForm.rev ?? '0'),
      fecha_envio: newProcForm.fecha_envio || '12/11/2026',
      fecha_aprobacion: newProcForm.estatus === 'APROBADO' ? (newProcForm.fecha_aprobacion || '12/11/2026') : newProcForm.fecha_aprobacion,
      observaciones: newProcForm.observaciones.trim()
    };
    setProcedimientosKimal((prev) => [...prev, nuevoProc]);
    setModalType(null);
    showToast(`Procedimiento #${nuevoProc.item} (${nuevoProc.codigo}) agregado exitosamente`);
  };

  // 4. Agregar Nueva Estructura / Nodo directamente al Gemelo Digital 3D
  const handleAddZona3DSubmit = (e) => {
    e.preventDefault();
    const idClean = (newZona3DForm.zonaId || newZona3DForm.titulo).trim();
    if (!idClean) return;

    const hexInt = parseInt((newZona3DForm.colorHex || '#00f2fe').replace('#', ''), 16) || 0x00f2fe;
    const idx = zonasBim.length;
    const angle = idx * 0.95;
    const dist = 11 + (idx % 3) * 3.5;

    const nuevaZona = {
      zonaId: idClean,
      titulo: (newZona3DForm.titulo || idClean).trim(),
      partida: newZona3DForm.partida,
      tipoGeometria: newZona3DForm.tipoGeometria,
      pos: {
        x: Math.round(Math.cos(angle) * dist * 10) / 10,
        z: Math.round(Math.sin(angle) * dist * 10) / 10
      },
      size: {
        w: Number(newZona3DForm.w) || 5.0,
        h: Number(newZona3DForm.h) || 3.8,
        d: Number(newZona3DForm.d) || 4.5
      },
      estatusDominante: newZona3DForm.estatusDominante || 'En Construcción',
      colorHex: hexInt,
      resumen: newZona3DForm.resumen || `Estructura incorporada al Gemelo Digital SE KIMAL.`
    };

    setZonasBim((prev) => [...prev, nuevaZona]);
    setSelectedZoneId(nuevaZona.zonaId);
    setViewMode3D('bim3d');
    setModalType(null);
    showToast(`Estructura 3D "${nuevaZona.titulo}" añadida al Gemelo Digital`);
  };

  // Eliminar filas en cualquiera de las 3 tablas
  const handleDeletePartida = (id) => {
    setAvanceKimal((prev) => prev.filter((r) => r.id !== id));
    showToast('Partida eliminada de la tabla y gráfica 3D');
  };

  const handleDeleteDocCivil = (id) => {
    setIngenieriaCivil((prev) => prev.filter((d) => d.id !== id));
    showToast('Documento de Ingeniería eliminado');
  };

  const handleDeleteProc = (itemNum) => {
    setProcedimientosKimal((prev) => prev.filter((p) => p.item !== itemNum));
    showToast(`Procedimiento #${itemNum} eliminado`);
  };

  // Editar campos en línea de Ingeniería y Procedimientos
  const handleInlineEditCivil = (id, field, value) => {
    setIngenieriaCivil((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const handleInlineEditProc = (itemNum, field, value) => {
    setProcedimientosKimal((prev) =>
      prev.map((p) => (p.item === itemNum ? { ...p, [field]: value } : p))
    );
  };

  // Importación masiva pegando filas directamente desde Excel (TSV / CSV)
  const handleImportFromExcel = (e) => {
    e.preventDefault();
    const lines = excelPasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    if (importTarget === 'avance') {
      const nuevos = lines.map((line, idx) => {
        const cols = line.includes('\t') ? line.split('\t') : line.split(';');
        const item = cols[0]?.trim() || `${avanceKimal.length + idx + 1}.-`;
        const nombre = cols[1]?.trim() || `Nueva Partida ${idx + 1}`;
        const proyectado = Math.max(1, parseInt(cols[2], 10) || 100);
        const ejecutados_sp = parseInt(cols[3], 10) || 0;
        const en_ito = parseInt(cols[4], 10) || 0;
        const cerrado_protocolizado = parseInt(cols[5], 10) || 0;
        const protocolizado_pct = Math.min(100, Math.round((cerrado_protocolizado / proyectado) * 100));
        return {
          item,
          id: `PART-IMP-${Date.now()}-${idx}`,
          nombre,
          proyectado,
          ejecutados_sp,
          en_ito,
          cerrado_protocolizado,
          protocolizado_pct,
          zona3d: 'Patio de Transformadores',
          descripcionZona: 'Importado desde Excel',
          pos3d: { x: 0, z: 0 }
        };
      });
      setAvanceKimal((prev) => [...prev, ...nuevos]);
      showToast(`${nuevos.length} partida(s) importadas a SE KIMAL`);
    } else if (importTarget === 'ingenieria') {
      const nuevos = lines.map((line, idx) => {
        const cols = line.includes('\t') ? line.split('\t') : line.split(';');
        return {
          id: Date.now() + idx,
          disciplina: '01 Ingeniería - Civil',
          codigo: cols[0]?.trim() || generarCodigoIngenieria('01 Ingeniería - Civil', 'MCA'),
          nombre: cols[1]?.trim() || `Documento Importado #${idx + 1}`,
          rev: cols[2]?.trim() || '0',
          estatus: cols[3]?.trim() || 'Recibido',
          recibido_en: cols[4]?.trim() || 'CSG-XEEC-TRN-000106',
          fecha_actualizacion: cols[5]?.trim() || '12/11/2026',
          fecha_aprobado: cols[6]?.trim() || '',
          observaciones: cols[7]?.trim() || '',
          zona3d: selectedZoneId || 'Patio de Transformadores',
          partidaVinculada: '1.- Obras Civiles'
        };
      });
      setIngenieriaCivil((prev) => [...nuevos, ...prev]);
      showToast(`${nuevos.length} documento(s) importados a Ingeniería`);
    } else if (importTarget === 'procedimientos') {
      const baseItem =
        procedimientosKimal.length > 0
          ? Math.max(...procedimientosKimal.map((p) => Number(p.item) || 0))
          : 0;
      const nuevos = lines.map((line, idx) => {
        const cols = line.includes('\t') ? line.split('\t') : line.split(';');
        const hasItemCol = !isNaN(parseInt(cols[0], 10));
        const offset = hasItemCol ? 1 : 0;
        return {
          item: baseItem + idx + 1,
          area: cols[offset]?.trim() || 'SSO',
          esp: cols[offset + 1]?.trim() || 'SSO',
          nombre: cols[offset + 2]?.trim() || `Procedimiento Importado #${idx + 1}`,
          codigo: cols[offset + 3]?.trim() || generarCodigoProcedimiento('SSO'),
          estatus: (cols[offset + 4]?.trim() || 'APROBADO').toUpperCase(),
          rev: cols[offset + 5]?.trim() || '0',
          fecha_envio: cols[offset + 6]?.trim() || '12/11/2026',
          fecha_aprobacion: cols[offset + 7]?.trim() || '',
          observaciones: cols[offset + 8]?.trim() || ''
        };
      });
      setProcedimientosKimal((prev) => [...prev, ...nuevos]);
      showToast(`${nuevos.length} procedimiento(s) importados a Conversora Kimal`);
    }

    setExcelPasteText('');
    setModalType(null);
  };

  // Exportar cualquier tabla a CSV compatible con Excel
  const handleExportCSV = (tipoTabla) => {
    let csvContent = '\uFEFF'; // BOM para acentos en Excel
    let filename = 'export_kimal.csv';

    if (tipoTabla === 'avance') {
      csvContent += 'ITEM;PARTIDA SE KIMAL;PROYECTADO;EJECUTADOS (SP);EN ITO %;CERRADO PROTOCOLIZADO;PROTOCOLIZADO %;ZONA 3D\n';
      avanceKimal.forEach((r) => {
        csvContent += `"${r.item}";"${r.nombre}";${r.proyectado};${r.ejecutados_sp};${r.en_ito};${r.cerrado_protocolizado};${r.protocolizado_pct}%;"${r.zona3d}"\n`;
      });
      filename = 'SE_KIMAL_Avance_Protocolos.csv';
    } else if (tipoTabla === 'ingenieria') {
      csvContent += 'DISCIPLINA;CODIGO;NOMBRE;REV.;ESTATUS;RECIBIDO EN;FECHA ACTUALIZACION;FECHA APROBADO;OBSERVACIONES;ZONA 3D\n';
      ingenieriaCivil.forEach((d) => {
        csvContent += `"${d.disciplina || '01 Ingeniería - Civil'}";"${d.codigo}";"${d.nombre}";"${d.rev}";"${d.estatus}";"${d.recibido_en}";"${d.fecha_actualizacion}";"${d.fecha_aprobado}";"${d.observaciones}";"${d.zona3d}"\n`;
      });
      filename = 'SE_KIMAL_01_Ingenieria_Civil_ACONEX.csv';
    } else {
      csvContent += 'ITEM;AREA;ESP.;NOMBRE DEL DOCUMENTO;CODIGO ACONEX Conversora Kimal;ESTATUS;REV.;FECHA ENVIO;FECHA APROBACION;OBSERVACIONES\n';
      procedimientosKimal.forEach((p) => {
        csvContent += `${p.item};"${p.area}";"${p.esp}";"${p.nombre}";"${p.codigo}";"${p.estatus}";"${p.rev}";"${p.fecha_envio}";"${p.fecha_aprobacion}";"${p.observaciones}"\n`;
      });
      filename = 'SE_KIMAL_Procedimientos_Conversora.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Archivo ${filename} descargado para Excel`);
  };

  // ==========================================================================
  // CÁLCULO DE KPIS EXACTOS A PARTIR DE LAS 3 TABLAS
  // ==========================================================================
  const kpis = useMemo(() => {
    const totalProyectado = avanceKimal.reduce((acc, r) => acc + r.proyectado, 0); // 6995
    const totalEjecutadosSP = avanceKimal.reduce((acc, r) => acc + r.ejecutados_sp, 0); // 62
    const totalCerradoProto = avanceKimal.reduce((acc, r) => acc + r.cerrado_protocolizado, 0); // 513
    const pctGlobalProtocolizado = totalProyectado > 0
      ? ((totalCerradoProto / totalProyectado) * 100).toFixed(1)
      : '0.0';

    // Conteos 01 Ingeniería - Civil (16 docs)
    const civilTotal = ingenieriaCivil.length;
    const civilDevueltos = ingenieriaCivil.filter((d) => d.estatus === 'Devuelto con Comentarios').length;
    const civilRevisadosCom = ingenieriaCivil.filter((d) => d.estatus === 'Revisado con comentarios').length;
    const civilRecibidos = ingenieriaCivil.filter((d) => d.estatus === 'Recibido').length;
    const civilTomaConocimiento = ingenieriaCivil.filter((d) =>
      d.estatus.includes('Toma de Conocimiento')
    ).length;

    // Conteos Procedimientos Conversora Kimal (11 docs)
    const procTotal = procedimientosKimal.length;
    const procAprobados = procedimientosKimal.filter((p) => p.estatus === 'APROBADO').length;
    const procEliminados = procedimientosKimal.filter((p) => p.estatus === 'ELIMINADO').length;
    const procAconex = procedimientosKimal.filter((p) => p.estatus === 'ACONEX').length;

    return {
      totalProyectado,
      totalEjecutadosSP,
      totalCerradoProto,
      pctGlobalProtocolizado,
      civilTotal,
      civilDevueltos,
      civilRevisadosCom,
      civilRecibidos,
      civilTomaConocimiento,
      procTotal,
      procAprobados,
      procEliminados,
      procAconex
    };
  }, [avanceKimal, ingenieriaCivil, procedimientosKimal]);

  // Zona 3D actualmente seleccionada y sus documentos reales asociados
  const activeZonaObj = useMemo(
    () => zonasBim.find((z) => z.zonaId === selectedZoneId) || zonasBim[0] || INITIAL_ZONAS_BIM_3D[0],
    [zonasBim, selectedZoneId]
  );

  const docsDeZonaSeleccionada = useMemo(
    () => ingenieriaCivil.filter((d) => d.zona3d === selectedZoneId),
    [ingenieriaCivil, selectedZoneId]
  );

  // Actualizar en vivo los valores de una partida de SE KIMAL y recalcular su % Protocolizado
  const handleUpdatePartida = (id, field, value) => {
    const numVal = Math.max(0, Number(value));
    setAvanceKimal((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: numVal };
        if (field === 'cerrado_protocolizado' || field === 'proyectado') {
          updated.protocolizado_pct =
            updated.proyectado > 0
              ? Math.min(100, Math.round((updated.cerrado_protocolizado / updated.proyectado) * 100))
              : 0;
        }
        if (selectedPartida?.id === id) {
          setSelectedPartida(updated);
        }
        return updated;
      })
    );
    showToast(`Partida ${id} actualizada en vivo (Gráficas 3D sincronizadas)`);
  };

  // Cambiar el estatus de un documento de Ingeniería Civil
  const handleChangeEstatusCivil = (id, nuevoEstatus) => {
    setIngenieriaCivil((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              estatus: nuevoEstatus,
              fecha_aprobado:
                nuevoEstatus === 'Toma de Conocimiento' && !doc.fecha_aprobado ? '12/11/2026' : doc.fecha_aprobado
            }
          : doc
      )
    );
    showToast(`Estatus ACONEX actualizado a: ${nuevoEstatus}`);
  };

  // Datos para gráficos analíticos 2D
  const estatusCivilChartData = useMemo(() => [
    { name: 'Toma de Conocimiento', cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Toma de Conocimiento').length, color: '#10b981' },
    { name: 'Toma Conoc. c/Pendientes', cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Toma de Conocimiento con Pendientes').length, color: '#38bdf8' },
    { name: 'Recibido', cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Recibido').length, color: '#3b82f6' },
    { name: 'Revisado c/Comentarios', cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Revisado con comentarios').length, color: '#f59e0b' },
    { name: 'Devuelto c/Comentarios', cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Devuelto con Comentarios').length, color: '#ef4444' }
  ], [ingenieriaCivil]);

  const transmittalsList = useMemo(() => {
    const setTrn = new Set(ingenieriaCivil.map((d) => d.recibido_en).filter(Boolean));
    return ['Todos', ...Array.from(setTrn)];
  }, [ingenieriaCivil]);

  // Helper de color de badge según estatus de Ingeniería Civil
  const getCivilStatusBadge = (estatus) => {
    if (estatus === 'Toma de Conocimiento')
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (estatus === 'Toma de Conocimiento con Pendientes')
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    if (estatus === 'Recibido')
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    if (estatus === 'Revisado con comentarios')
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Notificación flotante */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 border border-cyan-400/60 text-cyan-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* ====================================================================
          HEADER INSTITUCIONAL CONVERSORA SE KIMAL
      ==================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1640px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-300/30">
              <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                  SE KIMAL · CONVERSORA HVDC · CONTROL ACONEX & GEMELO 3D
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  CRUD Activo + 3D en Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Subestación Convertidora Kimal · Total Proyectado: {kpis.totalProyectado.toLocaleString()} Protocolos · Ingeniería ({kpis.civilTotal} Docs) · Procedimientos ({kpis.procTotal} Docs)
              </p>
            </div>
          </div>

          {/* Botones Globales Rápidos para Agregar Más Registros desde cualquier vista */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openModalNuevo('partida')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              + Partida SE KIMAL
            </button>
            <button
              onClick={() => openModalNuevo('ingenieria')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              + Doc. Ingeniería
            </button>
            <button
              onClick={() => openModalNuevo('procedimiento')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-bold text-amber-300 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              + Procedimiento
            </button>
            <button
              onClick={() => {
                setImportTarget(activeTab === 'avance' ? 'avance' : activeTab === 'procedimientos' ? 'procedimientos' : 'ingenieria');
                setModalType('importExcel');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-xs font-bold text-blue-300 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Pegar desde Excel
            </button>
            <button
              onClick={() => {
                setAvanceKimal(INITIAL_AVANCE_KIMAL);
                setIngenieriaCivil(INITIAL_INGENIERIA_CIVIL);
                setProcedimientosKimal(INITIAL_PROCEDIMIENTOS_KIMAL);
                setZonasBim(INITIAL_ZONAS_BIM_3D);
                localStorage.removeItem('kimal_avance_v2');
                localStorage.removeItem('kimal_ingenieria_v2');
                localStorage.removeItem('kimal_procedimientos_v2');
                localStorage.removeItem('kimal_zonas3d_v2');
                showToast('Datos restablecidos a los valores exactos de las planillas oficiales');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Restaurar Original
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="max-w-[1640px] mx-auto mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: `Gemelo 3D & Resumen SE KIMAL (${zonasBim.length} Zonas)`, icon: Box },
            { id: 'avance', label: `Tabla 1: Avance SE KIMAL (${kpis.totalProyectado.toLocaleString()})`, icon: TrendingUp },
            { id: 'ingenieria', label: `Tabla 2: 01 Ingeniería - Civil (${kpis.civilTotal})`, icon: Building2 },
            { id: 'procedimientos', label: `Tabla 3: Procedimientos Conversora (${kpis.procTotal})`, icon: ClipboardCheck },
            { id: 'alertas', label: 'Auditoría ACONEX & Alertas Críticas', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ====================================================================
          CONTENIDO PRINCIPAL
      ==================================================================== */}
      <main className="flex-1 max-w-[1640px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* TARJETAS DE KPIS REALES EXTRAÍDOS DE LAS 3 TABLAS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Proyectado y Cerrado Protocolizado */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                SE KIMAL · Total Proyectado
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">
                  {kpis.totalProyectado.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  {kpis.totalCerradoProto} Protocolizados ({kpis.pctGlobalProtocolizado}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Obras Civiles: 3.727 (359 cerrados) · Canaletas: 280 (37%)
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: Ejecutados (SP) y En ITO */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-cyan-500/40 transition-all">
            <div>
              <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Ejecutados (SP) & En ITO
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{kpis.totalEjecutadosSP} SP</span>
                <span className="text-xs font-semibold text-cyan-300">
                  20% En ITO (Montaje AT)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                47 en Obras Civiles · 15 en Montaje Alta Tensión
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: 01 Ingeniería - Civil (16 Documentos) */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-amber-500/40 transition-all">
            <div>
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                01 Ingeniería - Civil (ACONEX)
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{kpis.civilTotal} Docs</span>
                <span className="text-xs font-semibold text-rose-400">
                  {kpis.civilDevueltos} Devueltos c/Coment.
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {kpis.civilTomaConocimiento} Toma Conoc. · {kpis.civilRecibidos} Recibidos · {kpis.civilRevisadosCom} Revisados
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4: Procedimientos Conversora Kimal (11 Documentos) */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-blue-500/40 transition-all">
            <div>
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                Procedimientos Conversora Kimal
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">
                  {kpis.procAprobados} / {kpis.procTotal}
                </span>
                <span className="text-xs font-semibold text-slate-300">APROBADOS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {kpis.procEliminados} Eliminados (0004, 0006) · {kpis.procAconex} Cargado en ACONEX (0047)
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* ==================================================================
            PESTAÑA 1: GEMELO 3D INTERACTIVO & RESUMEN EJECUTIVO SE KIMAL
        ================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda (8 cols): Visor 3D con controles */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="bg-slate-900/85 border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold">Ángulo Cámara 3D:</span>
                    {[
                      { id: 'isometric', label: 'Isométrica' },
                      { id: 'top', label: 'Planta Layout' },
                      { id: 'front', label: 'Elevación Frontal' },
                      { id: 'side', label: 'Vista Lateral' }
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCameraPreset(c.id)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          cameraPreset === c.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWireframe(!wireframe)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        wireframe
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      Rayos X / Armaduras
                    </button>
                    <button
                      onClick={() => setAutoRotate(!autoRotate)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        autoRotate
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                      title="Rotación Orbital Automática"
                    >
                      {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setIsNightMode(!isNightMode)}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 hover:bg-slate-700"
                    >
                      {isNightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="h-[500px]">
                  <ThreeKimalScene
                    viewMode3D={viewMode3D}
                    setViewMode3D={setViewMode3D}
                    zonasBim={zonasBim}
                    avanceData={avanceKimal}
                    ingenieriaData={ingenieriaCivil}
                    procedimientosData={procedimientosKimal}
                    selectedZoneId={selectedZoneId}
                    setSelectedZoneId={setSelectedZoneId}
                    selectedPartida={selectedPartida}
                    setSelectedPartida={setSelectedPartida}
                    wireframe={wireframe}
                    isNightMode={isNightMode}
                    autoRotate={autoRotate}
                    cameraPreset={cameraPreset}
                    onOpenNewStructureModal={() => openModalNuevo('estructura3d')}
                  />
                </div>
              </div>

              {/* Columna Derecha (4 cols): Inspector Dinámico conectado a la Zona 3D o Partida */}
              <div className="lg:col-span-4 bg-slate-900/85 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Inspector Gemelo 3D & ACONEX
                      </span>
                      <h2 className="text-base font-bold text-white mt-0.5">
                        {activeZonaObj.titulo}
                      </h2>
                    </div>
                    <button
                      onClick={() => openModalNuevo('ingenieria')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> + Plano a Zona
                    </button>
                  </div>

                  {/* Selector Rápido de Estructuras de la Subestación Kimal */}
                  <div className="mt-3">
                    <label className="text-[11px] text-slate-400 block mb-1.5">
                      Seleccionar Edificio / Patio en SE KIMAL ({zonasBim.length}):
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {zonasBim.map((z) => (
                        <button
                          key={z.zonaId}
                          onClick={() => setSelectedZoneId(z.zonaId)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            selectedZoneId === z.zonaId
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                              : 'bg-slate-950/90 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {z.zonaId}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resumen de la Estructura Seleccionada */}
                  <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Partida SE KIMAL:</span>
                      <span className="font-bold text-emerald-400">{activeZonaObj.partida}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estatus Ingeniería:</span>
                      <span className="font-bold text-amber-300">{activeZonaObj.estatusDominante}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                      {activeZonaObj.resumen}
                    </p>
                  </div>

                  {/* Lista de Planos / Memorias de Cálculo de 01 Ingeniería Civil en esta Zona 3D */}
                  <div className="mt-4">
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Documentos 01 Ingeniería - Civil vinculados:</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                        {docsDeZonaSeleccionada.length} doc(s)
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {docsDeZonaSeleccionada.map((doc) => (
                        <div
                          key={doc.codigo}
                          className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 text-xs hover:border-cyan-500/40 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-cyan-400 text-[11px]">
                              {doc.codigo}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-white">
                              Rev. {doc.rev}
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium text-[11px] mt-1 line-clamp-2">
                            {doc.nombre}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full border font-semibold ${getCivilStatusBadge(doc.estatus)}`}>
                              {doc.estatus}
                            </span>
                            <span className="text-slate-400">
                              Act: {doc.fecha_actualizacion}
                            </span>
                          </div>
                          {doc.observaciones && (
                            <p className="mt-1.5 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                              Obs: {doc.observaciones}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botón rápido para ver las barras 3D de Avance */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => setViewMode3D(viewMode3D === 'avance3d' ? 'bim3d' : 'avance3d')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {viewMode3D === 'avance3d' ? 'Volver al Gemelo BIM 3D' : 'Ver Gráfica Barras 3D (6.995)'}
                  </button>
                  <button
                    onClick={() => setActiveTab('ingenieria')}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                  >
                    Tabla ACONEX
                  </button>
                </div>
              </div>
            </div>

            {/* Gráficas Analíticas 2D con los Datos Reales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Avance SE KIMAL por Partida */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      SE KIMAL: Proyectado vs. Cerrado Protocolizado y % Avance
                    </h3>
                    <p className="text-xs text-slate-400">
                      Total Proyectado: 6.995 | Obras Civiles (359 cerrados = 10%), Canaletas (103 cerrados = 37%), Montaje AT (51 cerrados = 15%)
                    </p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={avanceKimal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="item" stroke="#94a3b8" fontSize={12} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="#00f2fe" fontSize={12} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar yAxisId="left" dataKey="proyectado" name="Proyectado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="cerrado_protocolizado" name="Cerrado Protocolizado" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="protocolizado_pct" name="Protocolizado %" stroke="#00f2fe" strokeWidth={3} dot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Distribución de Estatus 01 Ingeniería Civil (16 Docs) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      Distribución de Estatus · 01 Ingeniería - Civil (16 Documentos)
                    </h3>
                    <p className="text-xs text-slate-400">
                      4 Recibidos, 4 Revisados con comentarios, 4 Devueltos con Comentarios, 3 Toma Conocimiento y 1 con Pendientes
                    </p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estatusCivilChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={11} width={155} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="cantidad" name="Cantidad de Documentos" radius={[0, 6, 6, 0]}>
                        {estatusCivilChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 2: TABLA OFICIAL AVANCE SE KIMAL (TOTAL PROYECTADO: 6995+)
        ================================================================== */}
        {activeTab === 'avance' && (
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Planilla Oficial de Protocolización · Editable y Ampliable
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  SE KIMAL · Control de Avance y Protocolos (Total Proyectado: {kpis.totalProyectado.toLocaleString()})
                </h2>
                <p className="text-xs text-slate-400">
                  Edita cualquier número en línea o agrega nuevas partidas con el botón <strong>+ Agregar Nueva Partida</strong>. Todo actualiza las barras 3D al instante.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openModalNuevo('partida')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> + Agregar Nueva Partida
                </button>
                <button
                  onClick={() => {
                    setImportTarget('avance');
                    setModalType('importExcel');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" /> Pegar desde Excel
                </button>
                <button
                  onClick={() => handleExportCSV('avance')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV
                </button>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setViewMode3D('avance3d');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <BarChart3 className="w-4 h-4" /> Ver en Barras 3D
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-950/70 border-b border-emerald-700/50 text-emerald-200 uppercase font-bold">
                    <th className="py-3.5 px-4 w-16">Ítem</th>
                    <th className="py-3.5 px-4">SE KIMAL · Partida / Especialidad</th>
                    <th className="py-3.5 px-4 text-center">Proyectado</th>
                    <th className="py-3.5 px-4 text-center">Ejecutados (SP)</th>
                    <th className="py-3.5 px-4 text-center">En Ito %</th>
                    <th className="py-3.5 px-4 text-center">Cerrado Protocolizado</th>
                    <th className="py-3.5 px-4 text-center">Protocolizado %</th>
                    <th className="py-3.5 px-4 text-center">Vínculo 3D</th>
                    <th className="py-3.5 px-3 text-center">Acción</th>
                  </tr>
                  {/* Fila Oficial Total Proyectado */}
                  <tr className="bg-emerald-900/30 border-b border-slate-700 font-bold text-white">
                    <td colSpan={2} className="py-3 px-4 text-center text-emerald-300 text-sm">
                      Total Proyectado
                    </td>
                    <td className="py-3 px-4 text-center text-base font-black text-white">
                      {kpis.totalProyectado}
                    </td>
                    <td className="py-3 px-4 text-center text-cyan-300">
                      {kpis.totalEjecutadosSP}
                    </td>
                    <td className="py-3 px-4 text-center text-amber-300">-</td>
                    <td className="py-3 px-4 text-center text-emerald-400">
                      {kpis.totalCerradoProto}
                    </td>
                    <td className="py-3 px-4 text-center text-cyan-300">
                      {kpis.pctGlobalProtocolizado}%
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-center text-[11px] text-slate-400">
                      {avanceKimal.length} Partidas Activas
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {avanceKimal.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-300">{row.item}</td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={row.nombre}
                          onChange={(e) =>
                            setAvanceKimal((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, nombre: e.target.value } : r))
                            )
                          }
                          className="w-full bg-transparent font-bold text-white text-sm border-b border-transparent focus:border-cyan-400 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-400">{row.descripcionZona}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          value={row.proyectado}
                          onChange={(e) => handleUpdatePartida(row.id, 'proyectado', e.target.value)}
                          className="w-24 text-center bg-slate-950 border border-blue-500/40 rounded-lg py-1 font-mono font-bold text-blue-400 text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.ejecutados_sp}
                          onChange={(e) => handleUpdatePartida(row.id, 'ejecutados_sp', e.target.value)}
                          className="w-20 text-center bg-slate-950 border border-slate-700 rounded-lg py-1 text-white font-bold focus:border-cyan-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.en_ito}
                          onChange={(e) => handleUpdatePartida(row.id, 'en_ito', e.target.value)}
                          className="w-20 text-center bg-slate-950 border border-slate-700 rounded-lg py-1 text-amber-300 font-bold focus:border-cyan-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={row.proyectado}
                            value={row.cerrado_protocolizado}
                            onChange={(e) => handleUpdatePartida(row.id, 'cerrado_protocolizado', e.target.value)}
                            className="w-24 text-center bg-slate-950 border border-emerald-500/50 rounded-lg py-1 text-emerald-400 font-bold focus:border-emerald-400 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                              row.protocolizado_pct >= 30
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : row.protocolizado_pct >= 10
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row.protocolizado_pct}%
                          </span>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                              style={{ width: `${Math.min(100, row.protocolizado_pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedZoneId(row.zona3d);
                            setActiveTab('dashboard');
                            setViewMode3D('bim3d');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> {row.zona3d}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleDeletePartida(row.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar Partida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 3: TABLA OFICIAL 01 INGENIERÍA - CIVIL (16+ DOCUMENTOS)
        ================================================================== */}
        {activeTab === 'ingenieria' && (
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Control Documental ACONEX · Especialidad 01 Ingeniería - Civil y Nuevas Disciplinas
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Listado Maestro de Memorias de Cálculo, Estudios y Planos ({ingenieriaCivil.length} Documentos)
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openModalNuevo('ingenieria')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> + Nuevo Documento ACONEX
                </button>
                <button
                  onClick={() => {
                    setImportTarget('ingenieria');
                    setModalType('importExcel');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" /> Pegar desde Excel
                </button>
                <button
                  onClick={() => handleExportCSV('ingenieria')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV
                </button>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setViewMode3D('aconex3d');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4" /> Matriz 3D
                </button>
              </div>
            </div>

            {/* Buscador y Filtros Exactos */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por código (ej. MCA-E-0002, L0001) o nombre (ej. Válvulas, STATCOM, 220kV)..."
                  value={searchCivil}
                  onChange={(e) => setSearchCivil(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <select
                value={filterDisciplinaCivil}
                onChange={(e) => setFilterDisciplinaCivil(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-semibold focus:border-cyan-400 focus:outline-none"
              >
                <option value="Todas">Todas las Disciplinas</option>
                <option value="01 Ingeniería - Civil">01 Ingeniería - Civil</option>
                <option value="02 Ingeniería - Eléctrica">02 Ingeniería - Eléctrica</option>
                <option value="03 Ingeniería - Electromecánica">03 Ingeniería - Electromecánica</option>
                <option value="04 Ingeniería - Control y Protecciones">04 Ingeniería - Control y Protecciones</option>
              </select>

              <select
                value={filterEstatusCivil}
                onChange={(e) => setFilterEstatusCivil(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="Todos">Todos los Estatus ({ingenieriaCivil.length})</option>
                <option value="Toma de Conocimiento">Toma de Conocimiento</option>
                <option value="Toma de Conocimiento con Pendientes">Toma de Conocimiento con Pendientes</option>
                <option value="Recibido">Recibido</option>
                <option value="Revisado con comentarios">Revisado con comentarios</option>
                <option value="Devuelto con Comentarios">Devuelto con Comentarios</option>
              </select>

              <select
                value={filterTransmittal}
                onChange={(e) => setFilterTransmittal(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                {transmittalsList.map((trn) => (
                  <option key={trn} value={trn}>
                    {trn === 'Todos' ? 'Todos los Transmittals (RECIBIDO EN)' : trn}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabla Oficial 01 Ingeniería - Civil con Edición en Línea */}
            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/90 border-b border-slate-700 text-slate-200 uppercase font-bold">
                    <th className="py-3 px-3">CÓDIGO</th>
                    <th className="py-3 px-3">NOMBRE</th>
                    <th className="py-3 px-2 text-center">REV.</th>
                    <th className="py-3 px-3">ESTATUS</th>
                    <th className="py-3 px-3">RECIBIDO EN:</th>
                    <th className="py-3 px-3 text-center">FECHA ACTUALIZACIÓN</th>
                    <th className="py-3 px-3 text-center">FECHA APROBADO</th>
                    <th className="py-3 px-3">OBSERVACIONES</th>
                    <th className="py-3 px-3 text-center">GEMELO 3D</th>
                    <th className="py-3 px-2 text-center">ACCIÓN</th>
                  </tr>
                  <tr className="bg-slate-900/90 border-b border-slate-800">
                    <td colSpan={10} className="py-2 px-3 font-bold text-cyan-400">
                      {filterDisciplinaCivil === 'Todas' ? '01 Ingeniería - Civil y Especialidades SE KIMAL' : filterDisciplinaCivil}
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {ingenieriaCivil
                    .filter((doc) => {
                      const matchText =
                        doc.codigo.toLowerCase().includes(searchCivil.toLowerCase()) ||
                        doc.nombre.toLowerCase().includes(searchCivil.toLowerCase()) ||
                        (doc.observaciones || '').toLowerCase().includes(searchCivil.toLowerCase());
                      const matchStatus = filterEstatusCivil === 'Todos' || doc.estatus === filterEstatusCivil;
                      const matchTrn = filterTransmittal === 'Todos' || doc.recibido_en === filterTransmittal;
                      const matchDisc = filterDisciplinaCivil === 'Todas' || (doc.disciplina || '01 Ingeniería - Civil') === filterDisciplinaCivil;
                      return matchText && matchStatus && matchTrn && matchDisc;
                    })
                    .map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {doc.codigo}
                        </td>
                        <td className="py-3 px-3 font-medium text-white min-w-[260px]">
                          <input
                            type="text"
                            value={doc.nombre}
                            onChange={(e) => handleInlineEditCivil(doc.id, 'nombre', e.target.value)}
                            className="w-full bg-transparent text-white border-b border-transparent focus:border-cyan-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input
                            type="text"
                            value={doc.rev}
                            onChange={(e) => handleInlineEditCivil(doc.id, 'rev', e.target.value)}
                            className="w-11 text-center px-1.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={doc.estatus}
                            onChange={(e) => handleChangeEstatusCivil(doc.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${getCivilStatusBadge(doc.estatus)} bg-slate-950`}
                          >
                            <option value="Toma de Conocimiento">Toma de Conocimiento</option>
                            <option value="Toma de Conocimiento con Pendientes">Toma de Conocimiento con Pendientes</option>
                            <option value="Recibido">Recibido</option>
                            <option value="Revisado con comentarios">Revisado con comentarios</option>
                            <option value="Devuelto con Comentarios">Devuelto con Comentarios</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="Sin TRN"
                            value={doc.recibido_en}
                            onChange={(e) => handleInlineEditCivil(doc.id, 'recibido_en', e.target.value)}
                            className="w-36 bg-transparent font-mono text-slate-300 border-b border-transparent focus:border-cyan-400 focus:outline-none placeholder:text-rose-400/70"
                          />
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300 whitespace-nowrap">
                          {doc.fecha_actualizacion}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-emerald-400 whitespace-nowrap">
                          {doc.fecha_aprobado || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="Agregar observación..."
                            value={doc.observaciones}
                            onChange={(e) => handleInlineEditCivil(doc.id, 'observaciones', e.target.value)}
                            className="w-full min-w-[150px] bg-transparent text-amber-200 placeholder:text-slate-600 border-b border-transparent focus:border-cyan-400 focus:outline-none text-[11px]"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (doc.zona3d !== 'Suelo y Terreno General') {
                                setSelectedZoneId(doc.zona3d);
                              }
                              setActiveTab('dashboard');
                              setViewMode3D('bim3d');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1"
                          >
                            <Box className="w-3 h-3" /> {doc.zona3d}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleDeleteDocCivil(doc.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar Documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 4: TABLA OFICIAL PROCEDIMIENTOS CONVERSORA KIMAL (11+ ÍTEMS)
        ================================================================== */}
        {activeTab === 'procedimientos' && (
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Control de Procedimientos Operativos, SSO, Medio Ambiente y Calidad
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Procedimientos Conversora Kimal ({procedimientosKimal.length} Documentos Oficiales ACONEX)
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openModalNuevo('procedimiento')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> + Nuevo Procedimiento Kimal
                </button>
                <button
                  onClick={() => {
                    setImportTarget('procedimientos');
                    setModalType('importExcel');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" /> Pegar desde Excel
                </button>
                <button
                  onClick={() => handleExportCSV('procedimientos')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* Filtros por Área (SSO, MA, QC, OPER) y Estatus */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de procedimiento o código CNX-KILO-001..."
                  value={searchProc}
                  onChange={(e) => setSearchProc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['Todas', 'SSO', 'MA', 'QC', 'OPER'].map((area) => (
                  <button
                    key={area}
                    onClick={() => setFilterAreaProc(area)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      filterAreaProc === area
                        ? 'bg-orange-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {area === 'Todas' ? 'Todas las Áreas' : `Área ${area}`}
                  </button>
                ))}
              </div>

              <select
                value={filterEstatusProc}
                onChange={(e) => setFilterEstatusProc(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="Todos">Todos los Estatus ({procedimientosKimal.length})</option>
                <option value="APROBADO">APROBADO ({kpis.procAprobados})</option>
                <option value="ACONEX">ACONEX ({kpis.procAconex})</option>
                <option value="EN REVISIÓN">EN REVISIÓN</option>
                <option value="ELIMINADO">ELIMINADO ({kpis.procEliminados})</option>
              </select>
            </div>

            {/* Tabla Oficial Procedimientos Conversora Kimal */}
            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-orange-950/60 border-b border-orange-700/40 text-orange-200 uppercase font-bold">
                    <th className="py-3.5 px-3 text-center">ITEM</th>
                    <th className="py-3.5 px-3 text-center">ÁREA</th>
                    <th className="py-3.5 px-3 text-center">ESP.</th>
                    <th className="py-3.5 px-4">NOMBRE DEL DOCUMENTO</th>
                    <th className="py-3.5 px-4">CODIGO ACONEXConversora Kimal</th>
                    <th className="py-3.5 px-3 text-center">ESTATUS</th>
                    <th className="py-3.5 px-2 text-center">REV.</th>
                    <th className="py-3.5 px-3 text-center">FECHA ENVIO</th>
                    <th className="py-3.5 px-3 text-center">FECHA APROBACIÓN</th>
                    <th className="py-3.5 px-4">OBSERVACIONES</th>
                    <th className="py-3.5 px-2 text-center">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {procedimientosKimal
                    .filter((p) => {
                      const matchText =
                        p.nombre.toLowerCase().includes(searchProc.toLowerCase()) ||
                        p.codigo.toLowerCase().includes(searchProc.toLowerCase());
                      const matchArea = filterAreaProc === 'Todas' || p.area === filterAreaProc;
                      const matchEst = filterEstatusProc === 'Todos' || p.estatus === filterEstatusProc;
                      return matchText && matchArea && matchEst;
                    })
                    .map((proc) => (
                      <tr key={proc.item} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 text-center font-bold text-slate-300">{proc.item}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              proc.area === 'SSO'
                                ? 'bg-blue-500/20 text-blue-300'
                                : proc.area === 'MA'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {proc.area}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-400 font-semibold">{proc.esp}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <input
                            type="text"
                            value={proc.nombre}
                            onChange={(e) => handleInlineEditProc(proc.item, 'nombre', e.target.value)}
                            className="w-full bg-transparent text-white border-b border-transparent focus:border-cyan-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {proc.codigo}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <select
                            value={proc.estatus}
                            onChange={(e) => handleInlineEditProc(proc.item, 'estatus', e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer bg-slate-950 ${
                              proc.estatus === 'APROBADO'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : proc.estatus === 'ACONEX' || proc.estatus === 'EN REVISIÓN'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            <option value="APROBADO">APROBADO</option>
                            <option value="ACONEX">ACONEX</option>
                            <option value="EN REVISIÓN">EN REVISIÓN</option>
                            <option value="ELIMINADO">ELIMINADO</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-white">
                          <input
                            type="text"
                            value={proc.rev}
                            onChange={(e) => handleInlineEditProc(proc.item, 'rev', e.target.value)}
                            className="w-10 text-center bg-slate-800 rounded py-0.5 text-white font-mono"
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-300 whitespace-nowrap">
                          {proc.fecha_envio || '-'}
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-emerald-400 whitespace-nowrap">
                          {proc.fecha_aprobacion || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <input
                            type="text"
                            placeholder="Sin observaciones"
                            value={proc.observaciones}
                            onChange={(e) => handleInlineEditProc(proc.item, 'observaciones', e.target.value)}
                            className="w-full bg-transparent text-slate-300 border-b border-transparent focus:border-cyan-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => handleDeleteProc(proc.item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar Procedimiento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 5: AUDITORÍA ACONEX & ALERTAS CRÍTICAS DETECTADAS
        ================================================================== */}
        {activeTab === 'alertas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Alerta 1: Fundaciones Devueltas con Comentarios */}
            <div className="bg-slate-900/85 border border-rose-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" /> Crítico · Ingeniería Civil
                </span>
                <span className="text-xs font-mono text-slate-400">4 Memorias de Cálculo</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Memorias de Cálculo de Fundaciones "Devuelto con Comentarios"
              </h3>
              <p className="text-xs text-slate-300">
                Existen 4 documentos estructurales clave que requieren subsanar comentarios para liberar frentes de montaje:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
                <li>• <strong className="text-cyan-400">MCA-E-0001 (Rev. 2)</strong>: Edificio de Control - Memoria de Cálculo Fundaciones (29/9/2026)</li>
                <li>• <strong className="text-cyan-400">MCA-E-0002 (Rev. 5)</strong>: Edificio de Válvulas 1 - Fundaciones (28/9/2026)</li>
                <li>• <strong className="text-cyan-400">MCA-E-0011 (Rev. 2)</strong>: Estructuras Altas - Patio HVDC - Fundaciones (9/6/2026)</li>
                <li>• <strong className="text-cyan-400">MCA-E-0012 (Rev. 3)</strong>: Patio de Filtros 220kV AC - Marcos Simple y Doble (1/10/2026)</li>
              </ul>
              <button
                onClick={() => {
                  setSelectedZoneId('Edificio de Válvulas 1');
                  setActiveTab('dashboard');
                  setViewMode3D('bim3d');
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Box className="w-4 h-4" /> Inspeccionar Edificio de Válvulas 1 en 3D
              </button>
            </div>

            {/* Alerta 2: Desfase Documental en ACONEX (MCA-E-0012 y MCA-E-0014) */}
            <div className="bg-slate-900/85 border border-amber-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Observaciones Críticas ACONEX
                </span>
                <span className="text-xs font-mono text-slate-400">Control Documental</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Inconsistencias de Carga y Versión en Plataforma ACONEX
              </h3>
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <p className="font-mono font-bold text-amber-400">CNX-KILO-001-DS-CK-CV-MCA-E-0012 (Rev. 3)</p>
                  <p className="text-slate-300 mt-0.5">
                    Observación oficial: <em>"Desactualizado en Aconex, solo esta la revisión anterior o anter"</em> (Recibido en CSG-XEECD-TRN-000105).
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <p className="font-mono font-bold text-cyan-400">CNX-KILO-001-DS-CK-CV-MCA-E-0014 (Rev. 4)</p>
                  <p className="text-slate-300 mt-0.5">
                    Estructuras Altas Patio 66kV AC: Aprobado en Toma de Conocimiento (13/8/2026), pero registra observación <em>"Documento No disponible en Aconex"</em> y sin código de Transmittal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedZoneId('Patio Filtros 220kV AC');
                  setActiveTab('dashboard');
                  setViewMode3D('bim3d');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Box className="w-4 h-4" /> Ver Patio 220kV y 66kV en el Gemelo 3D
              </button>
            </div>

            {/* Alerta 3: Brecha de Protocolización en Partidas 3, 5 y 6 */}
            <div className="bg-slate-900/85 border border-cyan-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Análisis de Avance SE KIMAL
                </span>
                <span className="text-xs font-mono text-slate-400">6.995 Total Proyectado</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Estado de Protocolización por Frente (513 Cerrados de 6.995)
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
                <li>• <strong className="text-emerald-400">Construcción de Canaletas</strong> lidera porcentualmente con <strong>37%</strong> (103 protocolizados de 280 proyectados).</li>
                <li>• <strong className="text-cyan-400">Montaje Alta Tensión</strong> alcanza <strong>15%</strong> protocolizado (51 de 330), con 15 Ejecutados (SP) y 20% en ITO.</li>
                <li>• <strong className="text-blue-400">Obras Civiles</strong> concentra el mayor volumen (3.727 proyectados = 53.3% de toda la subestación) con 359 cerrados (<strong>10%</strong>) y 47 Ejecutados (SP).</li>
                <li>• <strong className="text-amber-400">Montaje Estructural (704)</strong>, <strong className="text-amber-400">Eléctrico y C&P (95)</strong> y <strong className="text-amber-400">Pruebas y Comisionamiento (1.859)</strong> aún se encuentran en 0% protocolizado.</li>
              </ul>
            </div>

            {/* Alerta 4: Estado de Procedimientos Conversora Kimal */}
            <div className="bg-slate-900/85 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Procedimientos Operativos
                </span>
                <span className="text-xs font-mono text-slate-400">8 Aprobados / 11 Totales</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Trazabilidad de Procedimientos SSO, MA y QC
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
                <li>• <strong className="text-emerald-400">8 Procedimientos APROBADOS</strong> con toma de conocimiento y Proceso Terminado (Instalación de faena, Izaje, Código de colores, Herramientas, Combustible, Topografía, Altura y Humectación con camión aljibe).</li>
                <li>• <strong className="text-cyan-400">PRC-E-0047 (Mantenimiento menor y cambio de accesorios - MA)</strong>: En estatus <strong>ACONEX</strong>, cargado el 28-10-2026 pendiente de aprobación final.</li>
                <li>• <strong className="text-rose-400">2 Procedimientos ELIMINADOS</strong>: `PRC-E-0004` (Señalización - corresponde a CSGI) y `PRC-E-0006` (Trabajo en caliente).</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          MODALES INTERACTIVOS PARA AGREGAR NUEVOS REGISTROS E IMPORTAR EXCEL
      ==================================================================== */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">
                  {modalType === 'partida' && 'Agregar Nueva Partida a SE KIMAL (Tabla 1 & Barras 3D)'}
                  {modalType === 'ingenieria' && 'Agregar Nuevo Documento de Ingeniería ACONEX (Tabla 2)'}
                  {modalType === 'procedimiento' && 'Agregar Nuevo Procedimiento Conversora Kimal (Tabla 3)'}
                  {modalType === 'estructura3d' && 'Añadir Nueva Estructura / Equipo al Gemelo Digital 3D'}
                  {modalType === 'importExcel' && 'Pegar Filas Directamente desde Excel (Importación Rápida)'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. FORMULARIO NUEVA PARTIDA SE KIMAL */}
            {modalType === 'partida' && (
              <form onSubmit={handleAddPartidaSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Ítem</label>
                    <input
                      type="text"
                      value={newPartidaForm.item}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, item: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-slate-400 block mb-1">Nombre de la Partida / Especialidad *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Montaje Banco de Condensadores / Edificio Válvulas 2"
                      value={newPartidaForm.nombre}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, nombre: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-blue-400 font-bold block mb-1">Proyectado *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newPartidaForm.proyectado}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, proyectado: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-cyan-400 font-bold block mb-1">Ejecutados (SP)</label>
                    <input
                      type="number"
                      min="0"
                      value={newPartidaForm.ejecutados_sp}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, ejecutados_sp: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-amber-400 font-bold block mb-1">En Ito %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newPartidaForm.en_ito}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, en_ito: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-emerald-400 font-bold block mb-1">Cerrado Protocol.</label>
                    <input
                      type="number"
                      min="0"
                      value={newPartidaForm.cerrado_protocolizado}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, cerrado_protocolizado: e.target.value })}
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-emerald-300 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Zona 3D Vinculada</label>
                    <select
                      value={newPartidaForm.zona3d}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, zona3d: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {zonasBim.map((z) => (
                        <option key={z.zonaId} value={z.zonaId}>
                          {z.zonaId}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Descripción / Frente</label>
                    <input
                      type="text"
                      placeholder="Descripción del alcance..."
                      value={newPartidaForm.descripcionZona}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, descripcionZona: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={newPartidaForm.crearEstructura3D}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, crearEstructura3D: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                    Crear también un nuevo Edificio/Equipo propio en el Mapa 3D
                  </label>
                  {newPartidaForm.crearEstructura3D && (
                    <select
                      value={newPartidaForm.tipoGeometria}
                      onChange={(e) => setNewPartidaForm({ ...newPartidaForm, tipoGeometria: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300"
                    >
                      <option value="edificio">Edificio Industrial</option>
                      <option value="transformador">Banco Transformadores</option>
                      <option value="torre_hvdc">Pórtico / Torre HVDC</option>
                      <option value="canaleta">Trinchera / Canaleta</option>
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-extrabold"
                  >
                    Guardar Partida y Crear Barra 3D
                  </button>
                </div>
              </form>
            )}

            {/* 2. FORMULARIO NUEVO DOCUMENTO INGENIERÍA ACONEX */}
            {modalType === 'ingenieria' && (
              <form onSubmit={handleAddDocCivilSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Disciplina / Especialidad</label>
                    <select
                      value={newDocCivilForm.disciplina}
                      onChange={(e) => {
                        const disc = e.target.value;
                        setNewDocCivilForm({
                          ...newDocCivilForm,
                          disciplina: disc,
                          codigo: generarCodigoIngenieria(disc, newDocCivilForm.tipoDoc)
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-semibold"
                    >
                      <option value="01 Ingeniería - Civil">01 Ingeniería - Civil</option>
                      <option value="02 Ingeniería - Eléctrica">02 Ingeniería - Eléctrica</option>
                      <option value="03 Ingeniería - Electromecánica">03 Ingeniería - Electromecánica</option>
                      <option value="04 Ingeniería - Control y Protecciones">04 Ingeniería - Control y Protecciones</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tipo de Entregable</label>
                    <select
                      value={newDocCivilForm.tipoDoc}
                      onChange={(e) => {
                        const tDoc = e.target.value;
                        setNewDocCivilForm({
                          ...newDocCivilForm,
                          tipoDoc: tDoc,
                          codigo: generarCodigoIngenieria(newDocCivilForm.disciplina, tDoc)
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="MCA">MCA - Memoria de Cálculo</option>
                      <option value="PLN">PLN - Plano de Fundación / Disposición</option>
                      <option value="ITC">ITC - Informe Técnico / Estudio</option>
                      <option value="ETT">ETT - Especificación Técnica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-cyan-400 font-bold block mb-1">Código ACONEX (Autogenerado o Editable)</label>
                    <input
                      type="text"
                      required
                      value={newDocCivilForm.codigo}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, codigo: e.target.value })}
                      className="w-full bg-slate-950 border border-cyan-500/50 rounded-xl px-3 py-2 font-mono font-bold text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Revisión (REV.)</label>
                    <input
                      type="text"
                      value={newDocCivilForm.rev}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, rev: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nombre del Documento / Plano *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Edificios - Edificio de Válvulas 2 - Fundaciones - Memoria de Cálculo"
                    value={newDocCivilForm.nombre}
                    onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, nombre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Estatus ACONEX</label>
                    <select
                      value={newDocCivilForm.estatus}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, estatus: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                    >
                      <option value="Toma de Conocimiento">Toma de Conocimiento</option>
                      <option value="Toma de Conocimiento con Pendientes">Toma de Conocimiento con Pendientes</option>
                      <option value="Recibido">Recibido</option>
                      <option value="Revisado con comentarios">Revisado con comentarios</option>
                      <option value="Devuelto con Comentarios">Devuelto con Comentarios</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Recibido En (Transmittal)</label>
                    <input
                      type="text"
                      placeholder="CSG-XEEC-TRN-000106"
                      value={newDocCivilForm.recibido_en}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, recibido_en: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Fecha Actualización</label>
                    <input
                      type="text"
                      value={newDocCivilForm.fecha_actualizacion}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, fecha_actualizacion: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Fecha Aprobado</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={newDocCivilForm.fecha_aprobado}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, fecha_aprobado: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="text-cyan-400 font-bold block mb-1">Estructura Gemelo 3D</label>
                    <select
                      value={newDocCivilForm.zona3d}
                      onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, zona3d: e.target.value })}
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-cyan-300 font-semibold"
                    >
                      {zonasBim.map((z) => (
                        <option key={z.zonaId} value={z.zonaId}>
                          {z.zonaId}
                        </option>
                      ))}
                      <option value="Suelo y Terreno General">Suelo y Terreno General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Observaciones</label>
                  <input
                    type="text"
                    placeholder="Ej. Actualización / En revisión por especialista..."
                    value={newDocCivilForm.observaciones}
                    onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, observaciones: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold"
                  >
                    Agregar Documento a Ingeniería y 3D
                  </button>
                </div>
              </form>
            )}

            {/* 3. FORMULARIO NUEVO PROCEDIMIENTO CONVERSORA KIMAL */}
            {modalType === 'procedimiento' && (
              <form onSubmit={handleAddProcSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Área</label>
                    <select
                      value={newProcForm.area}
                      onChange={(e) => {
                        const ar = e.target.value;
                        setNewProcForm({
                          ...newProcForm,
                          area: ar,
                          esp: ar,
                          codigo: generarCodigoProcedimiento(ar)
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="SSO">SSO (Seguridad y Salud)</option>
                      <option value="MA">MA (Medio Ambiente)</option>
                      <option value="QC">QC (Calidad)</option>
                      <option value="OPER">OPER (Operaciones / Pruebas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Especialidad (ESP.)</label>
                    <input
                      type="text"
                      value={newProcForm.esp}
                      onChange={(e) => setNewProcForm({ ...newProcForm, esp: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Revisión (REV.)</label>
                    <input
                      type="text"
                      value={newProcForm.rev}
                      onChange={(e) => setNewProcForm({ ...newProcForm, rev: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-amber-400 font-bold block mb-1">Código ACONEX Conversora Kimal</label>
                  <input
                    type="text"
                    required
                    value={newProcForm.codigo}
                    onChange={(e) => setNewProcForm({ ...newProcForm, codigo: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 font-mono font-bold text-cyan-300"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nombre del Procedimiento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Procedimiento Montaje Electromecánico de Válvulas Tiristoras"
                    value={newProcForm.nombre}
                    onChange={(e) => setNewProcForm({ ...newProcForm, nombre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Estatus</label>
                    <select
                      value={newProcForm.estatus}
                      onChange={(e) => setNewProcForm({ ...newProcForm, estatus: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-bold"
                    >
                      <option value="APROBADO">APROBADO</option>
                      <option value="ACONEX">ACONEX</option>
                      <option value="EN REVISIÓN">EN REVISIÓN</option>
                      <option value="ELIMINADO">ELIMINADO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Fecha Envío</label>
                    <input
                      type="text"
                      value={newProcForm.fecha_envio}
                      onChange={(e) => setNewProcForm({ ...newProcForm, fecha_envio: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Fecha Aprobación</label>
                    <input
                      type="text"
                      value={newProcForm.fecha_aprobacion}
                      onChange={(e) => setNewProcForm({ ...newProcForm, fecha_aprobacion: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Observaciones</label>
                  <input
                    type="text"
                    value={newProcForm.observaciones}
                    onChange={(e) => setNewProcForm({ ...newProcForm, observaciones: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold"
                  >
                    Guardar Procedimiento
                  </button>
                </div>
              </form>
            )}

            {/* 4. FORMULARIO NUEVA ESTRUCTURA / NODO EN EL GEMELO DIGITAL 3D */}
            {modalType === 'estructura3d' && (
              <form onSubmit={handleAddZona3DSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-cyan-400 font-bold block mb-1">Identificador Corto (Zona 3D) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Edificio de Válvulas 2"
                      value={newZona3DForm.zonaId}
                      onChange={(e) =>
                        setNewZona3DForm({
                          ...newZona3DForm,
                          zonaId: e.target.value,
                          titulo: e.target.value
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tipo de Geometría 3D</label>
                    <select
                      value={newZona3DForm.tipoGeometria}
                      onChange={(e) => setNewZona3DForm({ ...newZona3DForm, tipoGeometria: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-semibold"
                    >
                      <option value="edificio">Edificio Principal (Nave / Sala)</option>
                      <option value="transformador">Banco de Transformadores + Bushings</option>
                      <option value="torre_hvdc">Pórtico / Torre Alta Tensión HVDC</option>
                      <option value="patio_ac">Patio de Filtros / Marco AC</option>
                      <option value="canaleta">Trinchera / Red de Canaletas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Partida SE KIMAL Asociada</label>
                    <select
                      value={newZona3DForm.partida}
                      onChange={(e) => setNewZona3DForm({ ...newZona3DForm, partida: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {avanceKimal.map((p) => (
                        <option key={p.id} value={`${p.item} ${p.nombre}`}>
                          {p.item} {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Estatus Visual / Color 3D</label>
                    <select
                      value={newZona3DForm.colorHex}
                      onChange={(e) => setNewZona3DForm({ ...newZona3DForm, colorHex: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                    >
                      <option value="#10b981">Verde Esmeralda (Aprobado / Toma Conocimiento)</option>
                      <option value="#00f2fe">Cian Eléctrico (En Ejecución / Protocolizado)</option>
                      <option value="#f59e0b">Ámbar (Revisado con Comentarios)</option>
                      <option value="#ef4444">Rojo Alerta (Devuelto con Comentarios)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Resumen Técnico de la Estructura</label>
                  <input
                    type="text"
                    placeholder="Ej. Segunda nave de válvulas convertidoras bipolo ±600 kV..."
                    value={newZona3DForm.resumen}
                    onChange={(e) => setNewZona3DForm({ ...newZona3DForm, resumen: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-extrabold"
                  >
                    Construir en el Gemelo Digital 3D
                  </button>
                </div>
              </form>
            )}

            {/* 5. IMPORTADOR RÁPIDO PEGANDO FILAS DESDE EXCEL */}
            {modalType === 'importExcel' && (
              <form onSubmit={handleImportFromExcel} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Seleccionar Tabla Destino:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'avance', label: '1. Avance SE KIMAL' },
                      { id: 'ingenieria', label: '2. Ingeniería Civil' },
                      { id: 'procedimientos', label: '3. Procedimientos' }
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setImportTarget(t.id)}
                        className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                          importTarget === t.id
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300">
                  {importTarget === 'avance' && (
                    <p>
                      Copia filas desde Excel con las columnas: <strong className="text-cyan-300">Ítem | Nombre Partida | Proyectado | Ejecutados (SP) | En Ito % | Cerrado Protocolizado</strong>
                    </p>
                  )}
                  {importTarget === 'ingenieria' && (
                    <p>
                      Copia filas desde Excel con las columnas: <strong className="text-cyan-300">CÓDIGO | NOMBRE | REV. | ESTATUS | RECIBIDO EN | FECHA ACT. | FECHA APROB. | OBSERVACIONES</strong>
                    </p>
                  )}
                  {importTarget === 'procedimientos' && (
                    <p>
                      Copia filas desde Excel con las columnas: <strong className="text-cyan-300">ITEM | ÁREA | ESP. | NOMBRE DEL DOCUMENTO | CÓDIGO ACONEX | ESTATUS | REV. | FECHA ENVÍO | FECHA APROB. | OBSERVACIONES</strong>
                    </p>
                  )}
                </div>

                <div>
                  <textarea
                    rows={6}
                    required
                    placeholder="Pega aquí (Ctrl+V) una o varias filas copiadas directamente desde tu planilla Excel..."
                    value={excelPasteText}
                    onChange={(e) => setExcelPasteText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-extrabold"
                  >
                    Importar Filas Ahora
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}