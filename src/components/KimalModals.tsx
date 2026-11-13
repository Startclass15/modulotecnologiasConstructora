import React, { useState } from 'react';
import { Check, Copy, Database, Download, Plus, RefreshCw, Server, X } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../data/supabaseSchemaSql';
import type {
  AvancePartida,
  ModalType,
  SupabaseConnectionStatus,
  ZonaBim3D,
  ZonaGeometria,
} from '../types/kimal';

interface KimalModalsProps {
  modalType: ModalType;
  setModalType: (type: ModalType) => void;
  zonasBim: ZonaBim3D[];
  avanceKimal: AvancePartida[];
  supabaseStatus: SupabaseConnectionStatus;
  onRefreshSupabase: () => Promise<void>;
  onSeedSupabase: (reset: boolean) => Promise<void>;
  isSyncing: boolean;
  // Partida form
  newPartidaForm: {
    item: string;
    nombre: string;
    proyectado: number;
    ejecutados_sp: number;
    en_ito: number;
    cerrado_protocolizado: number;
    zona3d: string;
    descripcionZona: string;
    crearEstructura3D: boolean;
    tipoGeometria: ZonaGeometria;
  };
  setNewPartidaForm: React.Dispatch<React.SetStateAction<KimalModalsProps['newPartidaForm']>>;
  onSubmitPartida: (e: React.FormEvent) => void;
  // Ingeniería form
  newDocCivilForm: {
    disciplina: string;
    tipoDoc: string;
    codigo: string;
    nombre: string;
    rev: string;
    estatus: string;
    recibido_en: string;
    fecha_actualizacion: string;
    fecha_aprobado: string;
    observaciones: string;
    zona3d: string;
    partidaVinculada: string;
  };
  setNewDocCivilForm: React.Dispatch<React.SetStateAction<KimalModalsProps['newDocCivilForm']>>;
  generarCodigoIngenieria: (disciplina: string, tipo: string) => string;
  onSubmitDocCivil: (e: React.FormEvent) => void;
  // Procedimiento form
  newProcForm: {
    area: string;
    esp: string;
    nombre: string;
    codigo: string;
    estatus: string;
    rev: string;
    fecha_envio: string;
    fecha_aprobacion: string;
    observaciones: string;
  };
  setNewProcForm: React.Dispatch<React.SetStateAction<KimalModalsProps['newProcForm']>>;
  generarCodigoProcedimiento: (area: string) => string;
  onSubmitProc: (e: React.FormEvent) => void;
  // Zona 3D form
  newZona3DForm: {
    zonaId: string;
    titulo: string;
    partida: string;
    tipoGeometria: ZonaGeometria;
    estatusDominante: string;
    colorHex: string;
    w: number;
    h: number;
    d: number;
    resumen: string;
  };
  setNewZona3DForm: React.Dispatch<React.SetStateAction<KimalModalsProps['newZona3DForm']>>;
  onSubmitZona3D: (e: React.FormEvent) => void;
  // Excel Import
  importTarget: 'avance' | 'ingenieria' | 'procedimientos';
  setImportTarget: (target: 'avance' | 'ingenieria' | 'procedimientos') => void;
  excelPasteText: string;
  setExcelPasteText: (text: string) => void;
  onSubmitExcelImport: (e: React.FormEvent) => void;
}

export function KimalModals({
  modalType,
  setModalType,
  zonasBim,
  avanceKimal,
  supabaseStatus,
  onRefreshSupabase,
  onSeedSupabase,
  isSyncing,
  newPartidaForm,
  setNewPartidaForm,
  onSubmitPartida,
  newDocCivilForm,
  setNewDocCivilForm,
  generarCodigoIngenieria,
  onSubmitDocCivil,
  newProcForm,
  setNewProcForm,
  generarCodigoProcedimiento,
  onSubmitProc,
  newZona3DForm,
  setNewZona3DForm,
  onSubmitZona3D,
  importTarget,
  setImportTarget,
  excelPasteText,
  setExcelPasteText,
  onSubmitExcelImport,
}: KimalModalsProps) {
  const [copiedSql, setCopiedSql] = useState(false);

  if (!modalType) return null;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SCHEMA_SQL], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'se_kimal_supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0c1322] border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            {modalType === 'supabase' ? (
              <Database className="w-5 h-5 text-emerald-400" />
            ) : (
              <Plus className="w-5 h-5 text-cyan-400" />
            )}
            <h3 className="text-base font-bold text-white">
              {modalType === 'partida' && 'Agregar Nueva Partida a SE KIMAL'}
              {modalType === 'ingenieria' && 'Agregar Documento de Ingeniería ACONEX'}
              {modalType === 'procedimiento' && 'Agregar Procedimiento Conversora Kimal'}
              {modalType === 'estructura3d' && 'Añadir Estructura al Gemelo Digital 3D'}
              {modalType === 'importExcel' && 'Importar Filas desde Excel'}
              {modalType === 'supabase' && 'Conexión Supabase PostgreSQL & Esquema SQL'}
            </h3>
          </div>
          <button
            onClick={() => setModalType(null)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL SUPABASE SCHEMA & SYNC (Zero API Key inputs in UI) */}
        {modalType === 'supabase' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400 text-[11px]">Variables de Entorno</p>
                <p className={`font-bold mt-1 ${supabaseStatus.configured ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {supabaseStatus.configured ? 'Configuradas en Servidor' : 'Pendientes en Secrets'}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400 text-[11px]">Tablas PostgreSQL</p>
                <p className={`font-bold mt-1 ${supabaseStatus.tablesReady ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {supabaseStatus.tablesReady ? '4 Tablas Activas' : 'Ejecutar schema.sql'}
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400 text-[11px]">Fuente de Datos Actual</p>
                <p className="font-bold mt-1 text-cyan-300">
                  {supabaseStatus.source === 'supabase' ? 'Supabase Cloud' : 'Caché Local (Respaldo)'}
                </p>
              </div>
            </div>

            {supabaseStatus.error && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200">
                Detalle de conexión: <span className="font-mono">{supabaseStatus.error}</span>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 text-slate-300">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Server className="w-4 h-4 text-cyan-400" />
                Pasos para conectar tu proyecto Supabase:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>
                  En el panel <strong>Secrets</strong> de tu entorno (o archivo <code className="text-cyan-300">.env</code>), define{' '}
                  <code className="text-emerald-300">SUPABASE_URL</code> y{' '}
                  <code className="text-emerald-300">SUPABASE_ANON_KEY</code> (opcional:{' '}
                  <code className="text-emerald-300">SUPABASE_SERVICE_ROLE_KEY</code> y{' '}
                  <code className="text-emerald-300">VITE_SUPABASE_URL</code> /{' '}
                  <code className="text-emerald-300">VITE_SUPABASE_ANON_KEY</code> para Realtime).
                </li>
                <li>
                  Copia el script SQL inferior y ejecútalo una sola vez en el <strong>SQL Editor</strong> de Supabase para crear las 4 tablas y habilitar RLS.
                </li>
                <li>
                  Pulsa <strong>Cargar Datos Iniciales a Supabase</strong> para poblar las planillas oficiales de SE Kimal.
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Script PostgreSQL (supabase/schema.sql)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copiado' : 'Copiar SQL'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSql}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Descargar .sql
                  </button>
                </div>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-cyan-200 max-h-48 overflow-auto">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isSyncing}
                onClick={onRefreshSupabase}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Verificar y Recargar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => onSeedSupabase(false)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  Sincronizar Datos a Supabase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. FORMULARIO NUEVA PARTIDA */}
        {modalType === 'partida' && (
          <form onSubmit={onSubmitPartida} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Ítem</label>
                <input
                  type="text"
                  value={newPartidaForm.item}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, item: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
              <div className="col-span-3">
                <label className="text-slate-400 block mb-1">Nombre de la Partida / Especialidad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Montaje Banco de Condensadores / Edificio Válvulas 2"
                  value={newPartidaForm.nombre}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-blue-400 font-semibold block mb-1">Proyectado</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newPartidaForm.proyectado}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, proyectado: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-cyan-400 font-semibold block mb-1">Ejecutados (SP)</label>
                <input
                  type="number"
                  min="0"
                  value={newPartidaForm.ejecutados_sp}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, ejecutados_sp: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-amber-400 font-semibold block mb-1">En ITO %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPartidaForm.en_ito}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, en_ito: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-emerald-400 font-semibold block mb-1">Cerrado Protocol.</label>
                <input
                  type="number"
                  min="0"
                  value={newPartidaForm.cerrado_protocolizado}
                  onChange={(e) =>
                    setNewPartidaForm({ ...newPartidaForm, cerrado_protocolizado: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-300 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Zona 3D Vinculada</label>
                <select
                  value={newPartidaForm.zona3d}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, zona3d: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                <input
                  type="checkbox"
                  checked={newPartidaForm.crearEstructura3D}
                  onChange={(e) => setNewPartidaForm({ ...newPartidaForm, crearEstructura3D: e.target.checked })}
                  className="rounded accent-cyan-400"
                />
                Crear estructura propia en el Mapa 3D
              </label>
              {newPartidaForm.crearEstructura3D && (
                <select
                  value={newPartidaForm.tipoGeometria}
                  onChange={(e) =>
                    setNewPartidaForm({ ...newPartidaForm, tipoGeometria: e.target.value as ZonaGeometria })
                  }
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
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Guardar Partida
              </button>
            </div>
          </form>
        )}

        {/* 2. FORMULARIO NUEVO DOCUMENTO INGENIERÍA */}
        {modalType === 'ingenieria' && (
          <form onSubmit={onSubmitDocCivil} className="space-y-3.5 text-xs">
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
                      codigo: generarCodigoIngenieria(disc, newDocCivilForm.tipoDoc),
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-semibold"
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
                      codigo: generarCodigoIngenieria(newDocCivilForm.disciplina, tDoc),
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                <label className="text-cyan-400 font-semibold block mb-1">Código ACONEX</label>
                <input
                  type="text"
                  required
                  value={newDocCivilForm.codigo}
                  onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, codigo: e.target.value })}
                  className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg px-3 py-2 font-mono font-bold text-cyan-300"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Revisión</label>
                <input
                  type="text"
                  value={newDocCivilForm.rev}
                  onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, rev: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nombre del Documento / Plano</label>
              <input
                type="text"
                required
                placeholder="Ej. Edificios - Edificio de Válvulas 2 - Fundaciones - Memoria de Cálculo"
                value={newDocCivilForm.nombre}
                onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Estatus ACONEX</label>
                <select
                  value={newDocCivilForm.estatus}
                  onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, estatus: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-white"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Fecha Aprobado</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={newDocCivilForm.fecha_aprobado}
                  onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, fecha_aprobado: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300"
                />
              </div>
              <div>
                <label className="text-cyan-400 font-semibold block mb-1">Estructura Gemelo 3D</label>
                <select
                  value={newDocCivilForm.zona3d}
                  onChange={(e) => setNewDocCivilForm({ ...newDocCivilForm, zona3d: e.target.value })}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-2 text-cyan-300 font-semibold"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Agregar Documento
              </button>
            </div>
          </form>
        )}

        {/* 3. FORMULARIO NUEVO PROCEDIMIENTO */}
        {modalType === 'procedimiento' && (
          <form onSubmit={onSubmitProc} className="space-y-3.5 text-xs">
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
                      codigo: generarCodigoProcedimiento(ar),
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                >
                  <option value="SSO">SSO (Seguridad y Salud)</option>
                  <option value="MA">MA (Medio Ambiente)</option>
                  <option value="QC">QC (Calidad)</option>
                  <option value="OPER">OPER (Operaciones / Pruebas)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Especialidad</label>
                <input
                  type="text"
                  value={newProcForm.esp}
                  onChange={(e) => setNewProcForm({ ...newProcForm, esp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Revisión</label>
                <input
                  type="text"
                  value={newProcForm.rev}
                  onChange={(e) => setNewProcForm({ ...newProcForm, rev: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-amber-400 font-semibold block mb-1">Código ACONEX Conversora Kimal</label>
              <input
                type="text"
                required
                value={newProcForm.codigo}
                onChange={(e) => setNewProcForm({ ...newProcForm, codigo: e.target.value })}
                className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 font-mono font-bold text-cyan-300"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nombre del Procedimiento</label>
              <input
                type="text"
                required
                placeholder="Ej. Procedimiento Montaje Electromecánico de Válvulas Tiristoras"
                value={newProcForm.nombre}
                onChange={(e) => setNewProcForm({ ...newProcForm, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Estatus</label>
                <select
                  value={newProcForm.estatus}
                  onChange={(e) => setNewProcForm({ ...newProcForm, estatus: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300 font-bold"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Fecha Aprobación</label>
                <input
                  type="text"
                  value={newProcForm.fecha_aprobacion}
                  onChange={(e) => setNewProcForm({ ...newProcForm, fecha_aprobacion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Observaciones</label>
              <input
                type="text"
                value={newProcForm.observaciones}
                onChange={(e) => setNewProcForm({ ...newProcForm, observaciones: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
              >
                Guardar Procedimiento
              </button>
            </div>
          </form>
        )}

        {/* 4. FORMULARIO NUEVA ESTRUCTURA 3D */}
        {modalType === 'estructura3d' && (
          <form onSubmit={onSubmitZona3D} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-cyan-400 font-semibold block mb-1">Identificador Zona 3D</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Edificio de Válvulas 2"
                  value={newZona3DForm.zonaId}
                  onChange={(e) =>
                    setNewZona3DForm({
                      ...newZona3DForm,
                      zonaId: e.target.value,
                      titulo: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tipo de Geometría 3D</label>
                <select
                  value={newZona3DForm.tipoGeometria}
                  onChange={(e) =>
                    setNewZona3DForm({ ...newZona3DForm, tipoGeometria: e.target.value as ZonaGeometria })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-semibold"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {avanceKimal.map((p) => (
                    <option key={p.id} value={`${p.item} ${p.nombre}`}>
                      {p.item} {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Color / Estatus Visual 3D</label>
                <select
                  value={newZona3DForm.colorHex}
                  onChange={(e) => setNewZona3DForm({ ...newZona3DForm, colorHex: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="#10b981">Verde Esmeralda (Aprobado / Toma Conocimiento)</option>
                  <option value="#06b6d4">Cian Eléctrico (En Ejecución / Protocolizado)</option>
                  <option value="#f59e0b">Ámbar (Revisado con Comentarios)</option>
                  <option value="#ef4444">Rojo Alerta (Devuelto con Comentarios)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Resumen Técnico</label>
              <input
                type="text"
                placeholder="Ej. Segunda nave de válvulas convertidoras bipolo ±600 kV..."
                value={newZona3DForm.resumen}
                onChange={(e) => setNewZona3DForm({ ...newZona3DForm, resumen: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Construir en 3D
              </button>
            </div>
          </form>
        )}

        {/* 5. IMPORTADOR RÁPIDO DESDE EXCEL */}
        {modalType === 'importExcel' && (
          <form onSubmit={onSubmitExcelImport} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seleccionar Tabla Destino:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'avance' as const, label: '1. Avance SE KIMAL' },
                  { id: 'ingenieria' as const, label: '2. Ingeniería Civil' },
                  { id: 'procedimientos' as const, label: '3. Procedimientos' },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setImportTarget(t.id)}
                    className={`py-2 px-3 rounded-lg font-bold border transition-colors ${
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

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300">
              {importTarget === 'avance' && (
                <p>
                  Columnas Excel: <strong className="text-cyan-300">Ítem | Nombre Partida | Proyectado | Ejecutados (SP) | En Ito % | Cerrado Protocolizado</strong>
                </p>
              )}
              {importTarget === 'ingenieria' && (
                <p>
                  Columnas Excel: <strong className="text-cyan-300">CÓDIGO | NOMBRE | REV. | ESTATUS | RECIBIDO EN | FECHA ACT. | FECHA APROB. | OBSERVACIONES</strong>
                </p>
              )}
              {importTarget === 'procedimientos' && (
                <p>
                  Columnas Excel: <strong className="text-cyan-300">ITEM | ÁREA | ESP. | NOMBRE DEL DOCUMENTO | CÓDIGO ACONEX | ESTATUS | REV. | FECHA ENVÍO | FECHA APROB. | OBSERVACIONES</strong>
                </p>
              )}
            </div>

            <textarea
              rows={6}
              required
              placeholder="Pega aquí (Ctrl+V) una o varias filas copiadas directamente desde tu planilla Excel..."
              value={excelPasteText}
              onChange={(e) => setExcelPasteText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Importar Filas
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
