import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Layers,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KimalModals } from './components/KimalModals';
import { ThreeKimalScene } from './components/ThreeKimalScene';
import {
  INITIAL_AVANCE_KIMAL,
  INITIAL_INGENIERIA_CIVIL,
  INITIAL_PROCEDIMIENTOS_KIMAL,
  INITIAL_ZONAS_BIM_3D,
} from './data/initialKimalData';
import { getBrowserSupabase, kimalApi } from './lib/supabaseClient';
import type {
  ActiveTab,
  AvancePartida,
  CameraPreset,
  IngenieriaDoc,
  ModalType,
  ProcedimientoKimal,
  SupabaseConnectionStatus,
  ViewMode3D,
  ZonaBim3D,
  ZonaGeometria,
} from './types/kimal';

const STORAGE_KEYS = {
  avance: 'kimal_avance_v3',
  ingenieria: 'kimal_ingenieria_v3',
  procedimientos: 'kimal_procedimientos_v3',
  zonas: 'kimal_zonas3d_v3',
} as const;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const [avanceKimal, setAvanceKimal] = useState<AvancePartida[]>(() =>
    readStorage(STORAGE_KEYS.avance, INITIAL_AVANCE_KIMAL)
  );
  const [ingenieriaCivil, setIngenieriaCivil] = useState<IngenieriaDoc[]>(() =>
    readStorage(STORAGE_KEYS.ingenieria, INITIAL_INGENIERIA_CIVIL)
  );
  const [procedimientosKimal, setProcedimientosKimal] = useState<ProcedimientoKimal[]>(() =>
    readStorage(STORAGE_KEYS.procedimientos, INITIAL_PROCEDIMIENTOS_KIMAL)
  );
  const [zonasBim, setZonasBim] = useState<ZonaBim3D[]>(() =>
    readStorage(STORAGE_KEYS.zonas, INITIAL_ZONAS_BIM_3D)
  );

  // Supabase status & syncing state
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>({
    configured: false,
    connected: false,
    tablesReady: false,
    realtimeEnabled: false,
    source: 'local',
    counts: {
      avance: INITIAL_AVANCE_KIMAL.length,
      ingenieria: INITIAL_INGENIERIA_CIVIL.length,
      procedimientos: INITIAL_PROCEDIMIENTOS_KIMAL.length,
      zonas: INITIAL_ZONAS_BIM_3D.length,
    },
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist theme class on document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  // LocalStorage backup cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.avance, JSON.stringify(avanceKimal));
    } catch {
      // ignore storage quota errors
    }
  }, [avanceKimal]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ingenieria, JSON.stringify(ingenieriaCivil));
    } catch {
      // ignore
    }
  }, [ingenieriaCivil]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.procedimientos, JSON.stringify(procedimientosKimal));
    } catch {
      // ignore
    }
  }, [procedimientosKimal]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.zonas, JSON.stringify(zonasBim));
    } catch {
      // ignore
    }
  }, [zonasBim]);

  // 3D Viewer states
  const [viewMode3D, setViewMode3D] = useState<ViewMode3D>('bim3d');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('Patio de Transformadores');
  const [selectedPartida, setSelectedPartida] = useState<AvancePartida>(INITIAL_AVANCE_KIMAL[0]);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  // Filters: 01 Ingeniería - Civil
  const [searchCivil, setSearchCivil] = useState('');
  const [filterEstatusCivil, setFilterEstatusCivil] = useState('Todos');
  const [filterTransmittal, setFilterTransmittal] = useState('Todos');
  const [filterDisciplinaCivil, setFilterDisciplinaCivil] = useState('Todas');

  // Filters: Procedimientos Conversora Kimal
  const [searchProc, setSearchProc] = useState('');
  const [filterAreaProc, setFilterAreaProc] = useState('Todas');
  const [filterEstatusProc, setFilterEstatusProc] = useState('Todos');

  // Modal & form states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [importTarget, setImportTarget] = useState<'avance' | 'ingenieria' | 'procedimientos'>('ingenieria');
  const [excelPasteText, setExcelPasteText] = useState('');

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
    tipoGeometria: 'edificio' as ZonaGeometria,
  });

  const [newDocCivilForm, setNewDocCivilForm] = useState({
    disciplina: '01 Ingeniería - Civil',
    tipoDoc: 'MCA',
    codigo: '',
    nombre: '',
    rev: '0',
    estatus: 'Recibido',
    recibido_en: 'CSG-XEEC-TRN-000106',
    fecha_actualizacion: '12/11/2026',
    fecha_aprobado: '',
    observaciones: '',
    zona3d: 'Patio de Transformadores',
    partidaVinculada: '1.- Obras Civiles',
  });

  const [newProcForm, setNewProcForm] = useState({
    area: 'SSO',
    esp: 'SSO',
    nombre: '',
    codigo: '',
    estatus: 'APROBADO',
    rev: '0',
    fecha_envio: '12/11/2026',
    fecha_aprobacion: '12/11/2026',
    observaciones: 'Documento con toma de conocimiento, Proceso Terminado',
  });

  const [newZona3DForm, setNewZona3DForm] = useState({
    zonaId: '',
    titulo: '',
    partida: '1.- Obras Civiles',
    tipoGeometria: 'edificio' as ZonaGeometria,
    estatusDominante: 'Recibido / En Construcción',
    colorHex: '#06b6d4',
    w: 5.0,
    h: 3.8,
    d: 4.5,
    resumen: '',
  });

  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'warn' } | null>(null);
  const showToast = useCallback((msg: string, tone: 'ok' | 'warn' = 'ok') => {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 3800);
  }, []);

  // Load bootstrap + status from Express/Supabase API
  const refreshFromBackend = useCallback(
    async (silent = false) => {
      setIsSyncing(true);
      try {
        const [statusRes, bootRes] = await Promise.all([
          kimalApi.getStatus(),
          kimalApi.bootstrap(),
        ]);
        setSupabaseStatus(statusRes);
        if (bootRes.source === 'supabase') {
          if (bootRes.avance?.length) {
            setAvanceKimal(bootRes.avance);
            setSelectedPartida((prev) => bootRes.avance.find((a) => a.id === prev?.id) || bootRes.avance[0]);
          }
          if (bootRes.ingenieria?.length) setIngenieriaCivil(bootRes.ingenieria);
          if (bootRes.procedimientos?.length) setProcedimientosKimal(bootRes.procedimientos);
          if (bootRes.zonasBim?.length) setZonasBim(bootRes.zonasBim);
          if (!silent) {
            showToast(
              bootRes.seeded
                ? 'Supabase conectado y poblado con los datos iniciales de SE KIMAL'
                : 'Datos sincronizados desde Supabase PostgreSQL'
            );
          }
        } else if (!silent) {
          showToast(
            statusRes.configured
              ? 'Supabase detectado; ejecuta supabase/schema.sql para activar tablas remotas'
              : 'Modo caché local activo. Conecta Supabase en "Supabase SQL"',
            'warn'
          );
        }
      } catch (err: unknown) {
        if (!silent) {
          const message = err instanceof Error ? err.message : 'Error de sincronización';
          showToast(message, 'warn');
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void refreshFromBackend(true);
  }, [refreshFromBackend]);

  // Optional Supabase Realtime subscription when VITE_SUPABASE_* env vars are defined
  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;

    const channel = sb
      .channel('kimal-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kimal_avance_partidas' }, () => {
        void refreshFromBackend(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kimal_ingenieria_docs' }, () => {
        void refreshFromBackend(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kimal_procedimientos' }, () => {
        void refreshFromBackend(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kimal_zonas_bim_3d' }, () => {
        void refreshFromBackend(true);
      })
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [refreshFromBackend]);

  const handleSeedSupabase = async (reset: boolean) => {
    setIsSyncing(true);
    try {
      const res = await kimalApi.seed(reset);
      if (!res.ok) {
        showToast(res.error || 'No se pudo poblar Supabase', 'warn');
      } else {
        if (reset) {
          setAvanceKimal(INITIAL_AVANCE_KIMAL);
          setIngenieriaCivil(INITIAL_INGENIERIA_CIVIL);
          setProcedimientosKimal(INITIAL_PROCEDIMIENTOS_KIMAL);
          setZonasBim(INITIAL_ZONAS_BIM_3D);
          setSelectedPartida(INITIAL_AVANCE_KIMAL[0]);
          setSelectedZoneId('Patio de Transformadores');
        }
        await refreshFromBackend(true);
        showToast(
          res.source === 'supabase'
            ? 'Planillas oficiales SE KIMAL sincronizadas con Supabase'
            : 'Datos restablecidos en caché local (configura Supabase para nube)'
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al sincronizar';
      showToast(message, 'warn');
    } finally {
      setIsSyncing(false);
    }
  };

  // Code generators
  const generarCodigoIngenieria = (disciplina = '01 Ingeniería - Civil', tipo = 'MCA') => {
    const discCode = disciplina.includes('Eléctrica')
      ? 'EL'
      : disciplina.includes('Electromecánica')
      ? 'EM'
      : disciplina.includes('Control')
      ? 'CP'
      : 'CV';
    const nextNum = String(ingenieriaCivil.length + 15).padStart(4, '0');
    return `CNX-KILO-001-DS-CK-${discCode}-${tipo}-E-${nextNum}`;
  };

  const generarCodigoProcedimiento = (area = 'SSO') => {
    const areaPrefix = area === 'QC' || area === 'OPER' ? 'CS-CK-CV' : 'HS-CK-NN';
    const nextNum = String(procedimientosKimal.length + 54).padStart(4, '0');
    return `CNX-KILO-001-${areaPrefix}-PRC-E-${nextNum}`;
  };

  const openModalNuevo = (type: Exclude<ModalType, null>) => {
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
        tipoGeometria: 'edificio',
      });
    } else if (type === 'ingenieria') {
      setNewDocCivilForm((prev) => ({
        ...prev,
        codigo: generarCodigoIngenieria(prev.disciplina, prev.tipoDoc),
        zona3d: selectedZoneId || 'Patio de Transformadores',
      }));
    } else if (type === 'procedimiento') {
      setNewProcForm((prev) => ({
        ...prev,
        codigo: generarCodigoProcedimiento(prev.area),
      }));
    } else if (type === 'estructura3d') {
      setNewZona3DForm({
        zonaId: '',
        titulo: '',
        partida: avanceKimal[0] ? `${avanceKimal[0].item} ${avanceKimal[0].nombre}` : '1.- Obras Civiles',
        tipoGeometria: 'edificio',
        estatusDominante: 'Toma de Conocimiento',
        colorHex: '#10b981',
        w: 5.2,
        h: 3.8,
        d: 4.5,
        resumen: '',
      });
    }
    setModalType(type);
  };

  // ==========================================================================
  // CRUD HANDLERS (Optimistic State + LocalStorage + Supabase API Proxy)
  // ==========================================================================
  const handleAddPartidaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartidaForm.nombre.trim()) return;
    const proy = Math.max(1, Number(newPartidaForm.proyectado) || 0);
    const cerr = Math.max(0, Number(newPartidaForm.cerrado_protocolizado) || 0);
    const pct = Math.min(100, Math.round((cerr / proy) * 100));
    const nextIdx = avanceKimal.length + 1;

    let targetZona3d = newPartidaForm.zona3d;

    if (newPartidaForm.crearEstructura3D) {
      targetZona3d = newPartidaForm.nombre.trim();
      const angle = zonasBim.length * 0.85;
      const radius = 12 + (zonasBim.length % 3) * 3;
      const nuevaZona: ZonaBim3D = {
        zonaId: targetZona3d,
        titulo: targetZona3d,
        partida: `${newPartidaForm.item || `${nextIdx}.-`} ${newPartidaForm.nombre}`,
        tipoGeometria: newPartidaForm.tipoGeometria,
        pos: {
          x: Math.round(Math.cos(angle) * radius * 10) / 10,
          z: Math.round(Math.sin(angle) * radius * 10) / 10,
        },
        size: { w: 5.0, h: 3.8, d: 4.4 },
        estatusDominante: `${pct}% Protocolizado`,
        colorHex: pct >= 30 ? 0x10b981 : pct >= 10 ? 0x06b6d4 : 0xf59e0b,
        resumen: newPartidaForm.descripcionZona || `Partida agregada con ${proy} protocolos proyectados.`,
      };
      setZonasBim((prev) => [...prev, nuevaZona]);
      setSelectedZoneId(targetZona3d);
      void kimalApi.upsertZona(nuevaZona).catch(() => null);
    }

    const nuevaPartida: AvancePartida = {
      item: newPartidaForm.item || `${nextIdx}.-`,
      id: `PART-${String(nextIdx).padStart(2, '0')}-${Date.now().toString().slice(-3)}`,
      nombre: newPartidaForm.nombre.trim(),
      proyectado: proy,
      ejecutados_sp: Number(newPartidaForm.ejecutados_sp) || 0,
      en_ito: Number(newPartidaForm.en_ito) || 0,
      cerrado_protocolizado: cerr,
      protocolizado_pct: pct,
      zona3d: targetZona3d,
      descripcionZona: newPartidaForm.descripcionZona || 'Frente operativo SE KIMAL',
      pos3d: { x: -11 + nextIdx * 3.5, z: 0 },
    };

    setAvanceKimal((prev) => [...prev, nuevaPartida]);
    setSelectedPartida(nuevaPartida);
    setModalType(null);
    void kimalApi.upsertAvance(nuevaPartida).catch(() => null);
    showToast(`Partida "${nuevaPartida.nombre}" guardada y sincronizada`);
  };

  const handleAddDocCivilSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocCivilForm.nombre.trim()) return;
    const nuevoDoc: IngenieriaDoc = {
      id: Date.now(),
      disciplina: newDocCivilForm.disciplina || '01 Ingeniería - Civil',
      codigo:
        newDocCivilForm.codigo.trim() ||
        generarCodigoIngenieria(newDocCivilForm.disciplina, newDocCivilForm.tipoDoc),
      nombre: newDocCivilForm.nombre.trim(),
      rev: String(newDocCivilForm.rev || '0'),
      estatus: newDocCivilForm.estatus,
      recibido_en: newDocCivilForm.recibido_en.trim(),
      fecha_actualizacion: newDocCivilForm.fecha_actualizacion || '12/11/2026',
      fecha_aprobado: newDocCivilForm.fecha_aprobado || '',
      observaciones: newDocCivilForm.observaciones.trim(),
      zona3d: newDocCivilForm.zona3d,
      partidaVinculada: newDocCivilForm.partidaVinculada,
    };
    setIngenieriaCivil((prev) => [nuevoDoc, ...prev]);
    setSelectedZoneId(nuevoDoc.zona3d);
    setModalType(null);
    void kimalApi.upsertIngenieria(nuevoDoc).catch(() => null);
    showToast(`Documento ${nuevoDoc.codigo} agregado y vinculado a ${nuevoDoc.zona3d}`);
  };

  const handleAddProcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcForm.nombre.trim()) return;
    const nextItemNum =
      procedimientosKimal.length > 0
        ? Math.max(...procedimientosKimal.map((p) => Number(p.item) || 0)) + 1
        : 1;
    const nuevoProc: ProcedimientoKimal = {
      item: nextItemNum,
      area: newProcForm.area,
      esp: newProcForm.esp || newProcForm.area,
      nombre: newProcForm.nombre.trim(),
      codigo: newProcForm.codigo.trim() || generarCodigoProcedimiento(newProcForm.area),
      estatus: newProcForm.estatus,
      rev: String(newProcForm.rev ?? '0'),
      fecha_envio: newProcForm.fecha_envio || '12/11/2026',
      fecha_aprobacion:
        newProcForm.estatus === 'APROBADO'
          ? newProcForm.fecha_aprobacion || '12/11/2026'
          : newProcForm.fecha_aprobacion,
      observaciones: newProcForm.observaciones.trim(),
    };
    setProcedimientosKimal((prev) => [...prev, nuevoProc]);
    setModalType(null);
    void kimalApi.upsertProcedimiento(nuevoProc).catch(() => null);
    showToast(`Procedimiento #${nuevoProc.item} (${nuevoProc.codigo}) guardado`);
  };

  const handleAddZona3DSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idClean = (newZona3DForm.zonaId || newZona3DForm.titulo).trim();
    if (!idClean) return;

    const hexInt = parseInt((newZona3DForm.colorHex || '#06b6d4').replace('#', ''), 16) || 0x06b6d4;
    const idx = zonasBim.length;
    const angle = idx * 0.95;
    const dist = 11 + (idx % 3) * 3.5;

    const nuevaZona: ZonaBim3D = {
      zonaId: idClean,
      titulo: (newZona3DForm.titulo || idClean).trim(),
      partida: newZona3DForm.partida,
      tipoGeometria: newZona3DForm.tipoGeometria,
      pos: {
        x: Math.round(Math.cos(angle) * dist * 10) / 10,
        z: Math.round(Math.sin(angle) * dist * 10) / 10,
      },
      size: {
        w: Number(newZona3DForm.w) || 5.0,
        h: Number(newZona3DForm.h) || 3.8,
        d: Number(newZona3DForm.d) || 4.5,
      },
      estatusDominante: newZona3DForm.estatusDominante || 'En Construcción',
      colorHex: hexInt,
      resumen: newZona3DForm.resumen || 'Estructura incorporada al Gemelo Digital SE KIMAL.',
    };

    setZonasBim((prev) => [...prev, nuevaZona]);
    setSelectedZoneId(nuevaZona.zonaId);
    setViewMode3D('bim3d');
    setModalType(null);
    void kimalApi.upsertZona(nuevaZona).catch(() => null);
    showToast(`Estructura 3D "${nuevaZona.titulo}" añadida al Gemelo Digital`);
  };

  const handleDeletePartida = (id: string) => {
    setAvanceKimal((prev) => prev.filter((r) => r.id !== id));
    void kimalApi.deleteAvance(id).catch(() => null);
    showToast('Partida eliminada de la tabla y gráfica 3D');
  };

  const handleDeleteDocCivil = (id: number) => {
    setIngenieriaCivil((prev) => prev.filter((d) => d.id !== id));
    void kimalApi.deleteIngenieria(id).catch(() => null);
    showToast('Documento de Ingeniería eliminado');
  };

  const handleDeleteProc = (itemNum: number) => {
    setProcedimientosKimal((prev) => prev.filter((p) => p.item !== itemNum));
    void kimalApi.deleteProcedimiento(itemNum).catch(() => null);
    showToast(`Procedimiento #${itemNum} eliminado`);
  };

  const handleUpdatePartida = (
    id: string,
    field: 'proyectado' | 'ejecutados_sp' | 'en_ito' | 'cerrado_protocolizado',
    value: string
  ) => {
    const numVal = Math.max(0, Number(value) || 0);
    let patchPayload: Partial<AvancePartida> = { [field]: numVal };

    setAvanceKimal((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: numVal };
        if (field === 'cerrado_protocolizado' || field === 'proyectado') {
          updated.protocolizado_pct =
            updated.proyectado > 0
              ? Math.min(100, Math.round((updated.cerrado_protocolizado / updated.proyectado) * 100))
              : 0;
          patchPayload = { ...patchPayload, protocolizado_pct: updated.protocolizado_pct };
        }
        if (selectedPartida?.id === id) {
          setSelectedPartida(updated);
        }
        return updated;
      })
    );
    void kimalApi.patchAvance(id, patchPayload).catch(() => null);
  };

  const handleChangeEstatusCivil = (id: number, nuevoEstatus: string) => {
    let newFechaAprobado: string | undefined;
    setIngenieriaCivil((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        const fechaAprob =
          nuevoEstatus === 'Toma de Conocimiento' && !doc.fecha_aprobado
            ? '12/11/2026'
            : doc.fecha_aprobado;
        newFechaAprobado = fechaAprob;
        return { ...doc, estatus: nuevoEstatus, fecha_aprobado: fechaAprob };
      })
    );
    void kimalApi
      .patchIngenieria(id, {
        estatus: nuevoEstatus,
        ...(newFechaAprobado !== undefined ? { fecha_aprobado: newFechaAprobado } : {}),
      })
      .catch(() => null);
    showToast(`Estatus ACONEX actualizado a: ${nuevoEstatus}`);
  };

  const handleInlineEditCivil = (id: number, field: keyof IngenieriaDoc, value: string) => {
    setIngenieriaCivil((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
    void kimalApi.patchIngenieria(id, { [field]: value }).catch(() => null);
  };

  const handleInlineEditProc = (itemNum: number, field: keyof ProcedimientoKimal, value: string) => {
    setProcedimientosKimal((prev) =>
      prev.map((p) => (p.item === itemNum ? { ...p, [field]: value } : p))
    );
    void kimalApi.patchProcedimiento(itemNum, { [field]: value }).catch(() => null);
  };

  // Bulk Excel import (TSV/CSV)
  const handleImportFromExcel = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = excelPasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    if (importTarget === 'avance') {
      const nuevos: AvancePartida[] = lines.map((line, idx) => {
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
          pos3d: { x: 0, z: 0 },
        };
      });
      setAvanceKimal((prev) => [...prev, ...nuevos]);
      void kimalApi.bulkImport('avance', nuevos).catch(() => null);
      showToast(`${nuevos.length} partida(s) importadas a SE KIMAL`);
    } else if (importTarget === 'ingenieria') {
      const nuevos: IngenieriaDoc[] = lines.map((line, idx) => {
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
          partidaVinculada: '1.- Obras Civiles',
        };
      });
      setIngenieriaCivil((prev) => [...nuevos, ...prev]);
      void kimalApi.bulkImport('ingenieria', nuevos).catch(() => null);
      showToast(`${nuevos.length} documento(s) importados a Ingeniería`);
    } else if (importTarget === 'procedimientos') {
      const baseItem =
        procedimientosKimal.length > 0
          ? Math.max(...procedimientosKimal.map((p) => Number(p.item) || 0))
          : 0;
      const nuevos: ProcedimientoKimal[] = lines.map((line, idx) => {
        const cols = line.includes('\t') ? line.split('\t') : line.split(';');
        const hasItemCol = !Number.isNaN(parseInt(cols[0], 10));
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
          observaciones: cols[offset + 8]?.trim() || '',
        };
      });
      setProcedimientosKimal((prev) => [...prev, ...nuevos]);
      void kimalApi.bulkImport('procedimientos', nuevos).catch(() => null);
      showToast(`${nuevos.length} procedimiento(s) importados a Conversora Kimal`);
    }

    setExcelPasteText('');
    setModalType(null);
  };

  // CSV Export
  const handleExportCSV = (tipoTabla: 'avance' | 'ingenieria' | 'procedimientos') => {
    let csvContent = '\uFEFF';
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
  // COMPUTED KPIs, FILTERS & DYNAMIC AUDIT ALERTS
  // ==========================================================================
  const kpis = useMemo(() => {
    const totalProyectado = avanceKimal.reduce((acc, r) => acc + r.proyectado, 0);
    const totalEjecutadosSP = avanceKimal.reduce((acc, r) => acc + r.ejecutados_sp, 0);
    const totalCerradoProto = avanceKimal.reduce((acc, r) => acc + r.cerrado_protocolizado, 0);
    const pctGlobalProtocolizado =
      totalProyectado > 0 ? ((totalCerradoProto / totalProyectado) * 100).toFixed(1) : '0.0';

    const civilTotal = ingenieriaCivil.length;
    const civilDevueltos = ingenieriaCivil.filter((d) => d.estatus === 'Devuelto con Comentarios').length;
    const civilRevisadosCom = ingenieriaCivil.filter((d) => d.estatus === 'Revisado con comentarios').length;
    const civilRecibidos = ingenieriaCivil.filter((d) => d.estatus === 'Recibido').length;
    const civilTomaConocimiento = ingenieriaCivil.filter((d) =>
      d.estatus.includes('Toma de Conocimiento')
    ).length;

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
      procAconex,
    };
  }, [avanceKimal, ingenieriaCivil, procedimientosKimal]);

  const activeZonaObj = useMemo(
    () => zonasBim.find((z) => z.zonaId === selectedZoneId) || zonasBim[0] || INITIAL_ZONAS_BIM_3D[0],
    [zonasBim, selectedZoneId]
  );

  const docsDeZonaSeleccionada = useMemo(
    () => ingenieriaCivil.filter((d) => d.zona3d === selectedZoneId),
    [ingenieriaCivil, selectedZoneId]
  );

  const estatusCivilChartData = useMemo(
    () => [
      {
        name: 'Toma Conoc.',
        cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Toma de Conocimiento').length,
        color: '#10b981',
      },
      {
        name: 'Toma c/Pend.',
        cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Toma de Conocimiento con Pendientes').length,
        color: '#38bdf8',
      },
      {
        name: 'Recibido',
        cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Recibido').length,
        color: '#3b82f6',
      },
      {
        name: 'Rev. c/Com.',
        cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Revisado con comentarios').length,
        color: '#f59e0b',
      },
      {
        name: 'Devuelto c/Com.',
        cantidad: ingenieriaCivil.filter((d) => d.estatus === 'Devuelto con Comentarios').length,
        color: '#ef4444',
      },
    ],
    [ingenieriaCivil]
  );

  const transmittalsList = useMemo(() => {
    const setTrn = new Set(ingenieriaCivil.map((d) => d.recibido_en).filter(Boolean));
    return ['Todos', ...Array.from(setTrn)];
  }, [ingenieriaCivil]);

  const filteredIngenieria = useMemo(() => {
    return ingenieriaCivil.filter((doc) => {
      const matchSearch =
        !searchCivil ||
        doc.codigo.toLowerCase().includes(searchCivil.toLowerCase()) ||
        doc.nombre.toLowerCase().includes(searchCivil.toLowerCase()) ||
        doc.observaciones.toLowerCase().includes(searchCivil.toLowerCase()) ||
        doc.zona3d.toLowerCase().includes(searchCivil.toLowerCase());
      const matchEstatus = filterEstatusCivil === 'Todos' || doc.estatus === filterEstatusCivil;
      const matchTrn = filterTransmittal === 'Todos' || doc.recibido_en === filterTransmittal;
      const matchDisc =
        filterDisciplinaCivil === 'Todas' ||
        (doc.disciplina || '01 Ingeniería - Civil') === filterDisciplinaCivil;
      return matchSearch && matchEstatus && matchTrn && matchDisc;
    });
  }, [ingenieriaCivil, searchCivil, filterEstatusCivil, filterTransmittal, filterDisciplinaCivil]);

  const filteredProcedimientos = useMemo(() => {
    return procedimientosKimal.filter((p) => {
      const matchSearch =
        !searchProc ||
        p.codigo.toLowerCase().includes(searchProc.toLowerCase()) ||
        p.nombre.toLowerCase().includes(searchProc.toLowerCase()) ||
        p.observaciones.toLowerCase().includes(searchProc.toLowerCase());
      const matchArea = filterAreaProc === 'Todas' || p.area === filterAreaProc;
      const matchEstatus = filterEstatusProc === 'Todos' || p.estatus === filterEstatusProc;
      return matchSearch && matchArea && matchEstatus;
    });
  }, [procedimientosKimal, searchProc, filterAreaProc, filterEstatusProc]);

  // Dynamic audit alerts computed directly from live state
  const auditAlerts = useMemo(() => {
    const devueltos = ingenieriaCivil.filter((d) => d.estatus === 'Devuelto con Comentarios');
    const brechasAconex = ingenieriaCivil.filter(
      (d) => !d.recibido_en.trim() || /no disponible|desactualizado|actualiz/i.test(d.observaciones)
    );
    const partidasCero = avanceKimal.filter((p) => p.protocolizado_pct === 0);
    const procsPendientes = procedimientosKimal.filter(
      (p) => p.estatus === 'ACONEX' || p.estatus === 'EN REVISIÓN' || p.estatus === 'ELIMINADO'
    );
    return {
      devueltos,
      brechasAconex,
      partidasCero,
      procsPendientes,
      totalAlertas: devueltos.length + brechasAconex.length + partidasCero.length + procsPendientes.length,
    };
  }, [ingenieriaCivil, avanceKimal, procedimientosKimal]);

  const getCivilStatusBadge = (estatus: string) => {
    if (estatus === 'Toma de Conocimiento')
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35';
    if (estatus === 'Toma de Conocimiento con Pendientes')
      return 'bg-sky-500/15 text-sky-400 border-sky-500/35';
    if (estatus === 'Recibido') return 'bg-blue-500/15 text-blue-400 border-blue-500/35';
    if (estatus === 'Revisado con comentarios')
      return 'bg-amber-500/15 text-amber-400 border-amber-500/35';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/35';
  };

  const getProcStatusBadge = (estatus: string) => {
    if (estatus === 'APROBADO') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35';
    if (estatus === 'ACONEX' || estatus === 'EN REVISIÓN')
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/35';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/35';
  };

  // Theme-aware surface tokens (clean contrast without nested visual noise)
  const cardSurface = isDarkTheme
    ? 'bg-[#0b1222] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const subSurface = isDarkTheme
    ? 'bg-slate-950/90 border-slate-800'
    : 'bg-slate-50 border-slate-200';
  const inputSurface = isDarkTheme
    ? 'bg-slate-950 border-slate-700 text-white'
    : 'bg-white border-slate-300 text-slate-900';

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkTheme ? 'bg-[#050914] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg border shadow-2xl flex items-center gap-2.5 text-xs font-semibold ${
            toast.tone === 'warn'
              ? 'bg-slate-900 border-amber-500/60 text-amber-200'
              : 'bg-slate-900 border-emerald-500/60 text-emerald-200'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${toast.tone === 'warn' ? 'text-amber-400' : 'text-emerald-400'}`} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR (Compact single-row, crisp alignment) */}
      <header
        className={`sticky top-0 z-40 border-b ${
          isDarkTheme ? 'bg-[#070d1b]/95 border-slate-800' : 'bg-white/95 border-slate-200'
        } backdrop-blur-md`}
      >
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-extrabold text-sm shrink-0">
              SK
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate">
                SE KIMAL · HVDC Digital Twin
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Control Documental ACONEX & Avance Protocolización
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard' as const, label: 'Gemelo 3D & KPIs', icon: Layers },
              { id: 'avance' as const, label: `Avance (${avanceKimal.length})`, icon: BarChart3 },
              { id: 'ingenieria' as const, label: `Ingeniería (${ingenieriaCivil.length})`, icon: FileText },
              { id: 'procedimientos' as const, label: `Procedimientos (${procedimientosKimal.length})`, icon: ShieldCheck },
              { id: 'alertas' as const, label: `Auditoría (${auditAlerts.totalAlertas})`, icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : isDarkTheme
                      ? 'text-slate-300 hover:bg-slate-800/80'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDarkTheme((v) => !v)}
              title="Alternar tema claro/oscuro"
              className={`p-2 rounded-lg border transition-colors ${
                isDarkTheme
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/*<button
              onClick={() => setModalType('supabase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                supabaseStatus.tablesReady
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {supabaseStatus.tablesReady ? 'Supabase Activo' : 'Conectar Supabase'}
            </button>*/}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-5 space-y-5">
        {/* WORKSPACE QUICK ACTION BAR */}
        <div className={`rounded-xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 ${cardSurface}`}>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-cyan-400">Operaciones de Datos:</span>
            <span className="text-slate-400">
              Fuente:{' '}
              <strong className={supabaseStatus.source === 'supabase' ? 'text-emerald-400' : 'text-amber-300'}>
                {supabaseStatus.source === 'supabase' ? 'PostgreSQL Supabase' : 'Caché Local (Respaldo)'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openModalNuevo('partida')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Partida
            </button>
            <button
              onClick={() => openModalNuevo('ingenieria')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 hover:bg-cyan-500/25 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Doc. ACONEX
            </button>
            <button
              onClick={() => openModalNuevo('procedimiento')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-400 hover:bg-amber-500/25 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Procedimiento
            </button>
            <button
              onClick={() => setModalType('importExcel')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" /> Importar Excel
            </button>
            <button
              onClick={() => void refreshFromBackend(false)}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizar
            </button>
            <button
              onClick={() => void handleSeedSupabase(true)}
              disabled={isSyncing}
              title="Restablecer planillas oficiales de SE KIMAL"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer
            </button>
          </div>
        </div>

        {/* GLOBAL KPI STRIP (12-col grid, tabular-nums, max 3-4 datapoints per card) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-xl border p-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Proyectado Kimal
              </span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold mt-1.5 tabular-nums">
              {kpis.totalProyectado.toLocaleString('es-CL')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Ejecutados (SP): <strong className="text-cyan-400">{kpis.totalEjecutadosSP}</strong> · {avanceKimal.length} partidas
            </p>
          </div>

          <div className={`rounded-xl border p-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Cerrado Protocolizado
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {kpis.totalCerradoProto.toLocaleString('es-CL')}
              </p>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                ({kpis.pctGlobalProtocolizado}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Líder: Canaletas (37%) · Alta Tensión (15%)
            </p>
          </div>

          <div className={`rounded-xl border p-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ingeniería Civil ACONEX
              </span>
              <FileText className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-2xl font-bold tabular-nums">{kpis.civilTotal}</p>
              <span className="text-xs font-semibold text-rose-400 tabular-nums">
                {kpis.civilDevueltos} Devueltos · {kpis.civilRevisadosCom} c/Com.
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {kpis.civilRecibidos} Recibidos · {kpis.civilTomaConocimiento} Toma de Conocimiento
            </p>
          </div>

          <div className={`rounded-xl border p-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Procedimientos Conversora
              </span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-2xl font-bold tabular-nums">
                {kpis.procAprobados} / {kpis.procTotal}
              </p>
              <span className="text-xs font-semibold text-emerald-400">Aprobados</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {kpis.procAconex} en ACONEX · {kpis.procEliminados} Eliminados
            </p>
          </div>
        </section>

        {/* =================================================================== */}
        {/* TAB 1: DASHBOARD 3D & ANALYTICS                                     */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* 3D Viewport (8 cols) */}
              <div className="xl:col-span-8 flex flex-col gap-3">
                <div className={`rounded-xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 ${cardSurface}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-400 mr-1">Cámara:</span>
                    {(
                      [
                        { id: 'isometric', label: 'Isométrica' },
                        { id: 'top', label: 'Planta' },
                        { id: 'front', label: 'Frontal' },
                        { id: 'side', label: 'Lateral' },
                      ] as const
                    ).map((cam) => (
                      <button
                        key={cam.id}
                        onClick={() => setCameraPreset(cam.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          cameraPreset === cam.id
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cam.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAutoRotate((v) => !v)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${
                        autoRotate ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Rotación: {autoRotate ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => setWireframe((v) => !v)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${
                        wireframe ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Malla Wireframe
                    </button>
                  </div>
                </div>

                <div className="h-[520px]">
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
                    isNightMode={isDarkTheme}
                    autoRotate={autoRotate}
                    cameraPreset={cameraPreset}
                    onOpenNewStructureModal={() => openModalNuevo('estructura3d')}
                  />
                </div>
              </div>

              {/* Right Contextual Inspector (4 cols) */}
              <div className={`xl:col-span-4 rounded-xl border p-4 flex flex-col gap-3 max-h-[580px] overflow-y-auto ${cardSurface}`}>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold">
                      Inspector Gemelo 3D
                    </p>
                    <h2 className="text-sm font-bold mt-0.5">{activeZonaObj.titulo}</h2>
                  </div>
                  <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
                </div>

                <div className={`rounded-lg border p-3 text-xs space-y-1.5 ${subSurface}`}>
                  <p className="text-slate-400">
                    Partida: <strong className="text-slate-100">{activeZonaObj.partida}</strong>
                  </p>
                  <p className="text-slate-400">
                    Estatus: <strong className="text-cyan-300">{activeZonaObj.estatusDominante}</strong>
                  </p>
                  <p className="text-slate-300 leading-relaxed pt-1">{activeZonaObj.resumen}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Documentos ACONEX Vinculados ({docsDeZonaSeleccionada.length})
                  </span>
                  <button
                    onClick={() => openModalNuevo('ingenieria')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Vincular Doc
                  </button>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {docsDeZonaSeleccionada.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No hay documentos vinculados directamente a esta zona.
                    </p>
                  ) : (
                    docsDeZonaSeleccionada.map((doc) => (
                      <div key={doc.id} className={`rounded-lg border p-2.5 text-xs space-y-1 ${subSurface}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-cyan-400 truncate">{doc.codigo}</span>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">Rev. {doc.rev}</span>
                        </div>
                        <p className="font-medium line-clamp-2">{doc.nombre}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getCivilStatusBadge(doc.estatus)}`}>
                            {doc.estatus}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{doc.recibido_en || 'Sin TRN'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Partidas quick selector for 3D highlight */}
                <div className="border-t border-slate-800/80 pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2">
                    Zonas BIM Activas ({zonasBim.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {zonasBim.map((z) => (
                      <button
                        key={z.zonaId}
                        onClick={() => {
                          setSelectedZoneId(z.zonaId);
                          setViewMode3D('bim3d');
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          selectedZoneId === z.zonaId
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {z.zonaId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2D ANALYTICAL CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className={`rounded-xl border p-4 ${cardSurface}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold">Avance y Protocolización SE KIMAL</h3>
                    <p className="text-xs text-slate-400">Proyectado vs. Cerrado Protocolizado por Partida</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold tabular-nums">
                    {kpis.pctGlobalProtocolizado}% Global
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={avanceKimal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="item" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#22d3ee" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          fontSize: '12px',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar yAxisId="left" dataKey="proyectado" name="Proyectado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="cerrado_protocolizado" name="Protocolizado" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="protocolizado_pct" name="% Protocolizado" stroke="#22d3ee" strokeWidth={2.5} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${cardSurface}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold">Distribución Estatus ACONEX (Ingeniería)</h3>
                    <p className="text-xs text-slate-400">Conteo en tiempo real sobre {kpis.civilTotal} documentos</p>
                  </div>
                  <span className="text-xs font-mono text-rose-400 font-bold tabular-nums">
                    {kpis.civilDevueltos} Devueltos
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estatusCivilChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          fontSize: '12px',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="cantidad" name="Documentos" radius={[4, 4, 0, 0]}>
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

        {/* =================================================================== */}
        {/* TAB 2: AVANCE Y PROTOCOLIZACIÓN SE KIMAL (EDITABLE EN VIVO)         */}
        {/* =================================================================== */}
        {activeTab === 'avance' && (
          <section className={`rounded-xl border p-5 space-y-4 ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Planilla Maestra: Avance y Protocolización SE KIMAL</h2>
                <p className="text-xs text-slate-400">
                  Edita cualquier valor numérico en línea para recalcular KPIs, sincronizar Supabase y actualizar las barras 3D.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModalNuevo('partida')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva Partida
                </button>
                <button
                  onClick={() => handleExportCSV('avance')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" /> Exportar CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                    <th className="py-2.5 px-3">Ítem</th>
                    <th className="py-2.5 px-3">Partida / Alcance SE KIMAL</th>
                    <th className="py-2.5 px-3 text-right">Proyectado</th>
                    <th className="py-2.5 px-3 text-right">Ejecutados (SP)</th>
                    <th className="py-2.5 px-3 text-right">En ITO %</th>
                    <th className="py-2.5 px-3 text-right">Cerrado Protocol.</th>
                    <th className="py-2.5 px-3 text-right">% Protocolizado</th>
                    <th className="py-2.5 px-3">Zona 3D</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {avanceKimal.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{row.item}</td>
                      <td className="py-2.5 px-3 font-semibold">{row.nombre}</td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={row.proyectado}
                          onChange={(e) => handleUpdatePartida(row.id, 'proyectado', e.target.value)}
                          className={`w-24 text-right rounded border px-2 py-1 font-mono font-bold ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.ejecutados_sp}
                          onChange={(e) => handleUpdatePartida(row.id, 'ejecutados_sp', e.target.value)}
                          className={`w-20 text-right rounded border px-2 py-1 font-mono ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.en_ito}
                          onChange={(e) => handleUpdatePartida(row.id, 'en_ito', e.target.value)}
                          className={`w-20 text-right rounded border px-2 py-1 font-mono ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.cerrado_protocolizado}
                          onChange={(e) => handleUpdatePartida(row.id, 'cerrado_protocolizado', e.target.value)}
                          className={`w-24 text-right rounded border px-2 py-1 font-mono font-bold text-emerald-400 ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: `${Math.min(100, row.protocolizado_pct)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-emerald-400 w-10 text-right">
                            {row.protocolizado_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => {
                            setSelectedZoneId(row.zona3d);
                            setViewMode3D('bim3d');
                            setActiveTab('dashboard');
                          }}
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> {row.zona3d}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeletePartida(row.id)}
                          title="Eliminar partida"
                          className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 3: CONTROL DOCUMENTAL 01 INGENIERÍA - CIVIL ACONEX              */}
        {/* =================================================================== */}
        {activeTab === 'ingenieria' && (
          <section className={`rounded-xl border p-5 space-y-4 ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Control Documental Ingeniería · ACONEX</h2>
                <p className="text-xs text-slate-400">
                  Mostrando {filteredIngenieria.length} de {ingenieriaCivil.length} documentos técnicos vinculados al Gemelo 3D.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModalNuevo('ingenieria')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Documento
                </button>
                <button
                  onClick={() => handleExportCSV('ingenieria')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar código, plano u observación..."
                  value={searchCivil}
                  onChange={(e) => setSearchCivil(e.target.value)}
                  className={`w-full rounded-lg border pl-8 pr-3 py-2 ${inputSurface}`}
                />
              </div>
              <select
                value={filterDisciplinaCivil}
                onChange={(e) => setFilterDisciplinaCivil(e.target.value)}
                className={`rounded-lg border px-3 py-2 ${inputSurface}`}
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
                className={`rounded-lg border px-3 py-2 ${inputSurface}`}
              >
                <option value="Todos">Todos los Estatus ACONEX</option>
                <option value="Toma de Conocimiento">Toma de Conocimiento</option>
                <option value="Toma de Conocimiento con Pendientes">Toma de Conocimiento con Pendientes</option>
                <option value="Recibido">Recibido</option>
                <option value="Revisado con comentarios">Revisado con comentarios</option>
                <option value="Devuelto con Comentarios">Devuelto con Comentarios</option>
              </select>
              <select
                value={filterTransmittal}
                onChange={(e) => setFilterTransmittal(e.target.value)}
                className={`rounded-lg border px-3 py-2 font-mono ${inputSurface}`}
              >
                {transmittalsList.map((trn) => (
                  <option key={trn} value={trn}>
                    {trn === 'Todos' ? 'Todos los Transmittals' : trn}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                    <th className="py-2.5 px-3">Código ACONEX</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3 text-center">Rev.</th>
                    <th className="py-2.5 px-3">Estatus</th>
                    <th className="py-2.5 px-3">Transmittal</th>
                    <th className="py-2.5 px-3">Fecha Act.</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                    <th className="py-2.5 px-3">Zona 3D</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredIngenieria.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {doc.codigo}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-[10px] text-slate-400">{doc.disciplina}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          value={doc.rev}
                          onChange={(e) => handleInlineEditCivil(doc.id, 'rev', e.target.value)}
                          className={`w-12 text-center rounded border px-1 py-1 font-mono font-bold ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={doc.estatus}
                          onChange={(e) => handleChangeEstatusCivil(doc.id, e.target.value)}
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold bg-slate-950 ${getCivilStatusBadge(doc.estatus)}`}
                        >
                          <option value="Toma de Conocimiento">Toma de Conocimiento</option>
                          <option value="Toma de Conocimiento con Pendientes">Toma de Conocimiento con Pendientes</option>
                          <option value="Recibido">Recibido</option>
                          <option value="Revisado con comentarios">Revisado con comentarios</option>
                          <option value="Devuelto con Comentarios">Devuelto con Comentarios</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        {doc.recibido_en || <span className="text-rose-400">Sin TRN</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        {doc.fecha_actualizacion}
                      </td>
                      <td className="py-2.5 px-3 min-w-[160px]">
                        <input
                          type="text"
                          placeholder="Observación..."
                          value={doc.observaciones}
                          onChange={(e) => handleInlineEditCivil(doc.id, 'observaciones', e.target.value)}
                          className={`w-full rounded border px-2 py-1 text-[11px] ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedZoneId(doc.zona3d);
                            setViewMode3D('bim3d');
                            setActiveTab('dashboard');
                          }}
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> {doc.zona3d}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteDocCivil(doc.id)}
                          title="Eliminar documento"
                          className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PROCEDIMIENTOS CONVERSORA KIMAL                              */}
        {/* =================================================================== */}
        {activeTab === 'procedimientos' && (
          <section className={`rounded-xl border p-5 space-y-4 ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Procedimientos Operativos · Conversora Kimal</h2>
                <p className="text-xs text-slate-400">
                  Mostrando {filteredProcedimientos.length} de {procedimientosKimal.length} procedimientos SSO / MA / QC.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModalNuevo('procedimiento')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Procedimiento
                </button>
                <button
                  onClick={() => handleExportCSV('procedimientos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar procedimiento o código..."
                  value={searchProc}
                  onChange={(e) => setSearchProc(e.target.value)}
                  className={`w-full rounded-lg border pl-8 pr-3 py-2 ${inputSurface}`}
                />
              </div>
              <select
                value={filterAreaProc}
                onChange={(e) => setFilterAreaProc(e.target.value)}
                className={`rounded-lg border px-3 py-2 ${inputSurface}`}
              >
                <option value="Todas">Todas las Áreas</option>
                <option value="SSO">SSO (Seguridad y Salud)</option>
                <option value="MA">MA (Medio Ambiente)</option>
                <option value="QC">QC (Calidad)</option>
                <option value="OPER">OPER (Operaciones)</option>
              </select>
              <select
                value={filterEstatusProc}
                onChange={(e) => setFilterEstatusProc(e.target.value)}
                className={`rounded-lg border px-3 py-2 ${inputSurface}`}
              >
                <option value="Todos">Todos los Estatus</option>
                <option value="APROBADO">APROBADO</option>
                <option value="ACONEX">ACONEX</option>
                <option value="EN REVISIÓN">EN REVISIÓN</option>
                <option value="ELIMINADO">ELIMINADO</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                    <th className="py-2.5 px-3">Ítem</th>
                    <th className="py-2.5 px-3">Área</th>
                    <th className="py-2.5 px-3">Código ACONEX</th>
                    <th className="py-2.5 px-3">Nombre del Procedimiento</th>
                    <th className="py-2.5 px-3">Estatus</th>
                    <th className="py-2.5 px-3 text-center">Rev.</th>
                    <th className="py-2.5 px-3">Envío / Aprobación</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredProcedimientos.map((proc) => (
                    <tr key={proc.item} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold tabular-nums">{proc.item}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{proc.area}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300 whitespace-nowrap">{proc.codigo}</td>
                      <td className="py-2.5 px-3 font-medium">{proc.nombre}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={proc.estatus}
                          onChange={(e) => handleInlineEditProc(proc.item, 'estatus', e.target.value)}
                          className={`rounded-md border px-2 py-1 text-[11px] font-bold bg-slate-950 ${getProcStatusBadge(proc.estatus)}`}
                        >
                          <option value="APROBADO">APROBADO</option>
                          <option value="ACONEX">ACONEX</option>
                          <option value="EN REVISIÓN">EN REVISIÓN</option>
                          <option value="ELIMINADO">ELIMINADO</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          value={proc.rev}
                          onChange={(e) => handleInlineEditProc(proc.item, 'rev', e.target.value)}
                          className={`w-12 text-center rounded border px-1 py-1 font-mono ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono tabular-nums whitespace-nowrap">
                        <div>Env: {proc.fecha_envio || '-'}</div>
                        <div className="text-emerald-400">Apr: {proc.fecha_aprobacion || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3 min-w-[180px]">
                        <input
                          type="text"
                          value={proc.observaciones}
                          onChange={(e) => handleInlineEditProc(proc.item, 'observaciones', e.target.value)}
                          className={`w-full rounded border px-2 py-1 text-[11px] ${inputSurface}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteProc(proc.item)}
                          title="Eliminar procedimiento"
                          className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 5: AUDITORÍA ACONEX & ALERTAS CRÍTICAS (DINÁMICA EN VIVO)       */}
        {/* =================================================================== */}
        {activeTab === 'alertas' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Documentos Devueltos con Comentarios */}
            <div className={`rounded-xl border p-5 space-y-3 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Documentos Devueltos con Comentarios ({auditAlerts.devueltos.length})
                </h3>
                <button
                  onClick={() => {
                    setFilterEstatusCivil('Devuelto con Comentarios');
                    setActiveTab('ingenieria');
                  }}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Ver en tabla
                </button>
              </div>
              <div className="space-y-2">
                {auditAlerts.devueltos.length === 0 ? (
                  <p className="text-xs text-emerald-400">Sin documentos devueltos actualmente.</p>
                ) : (
                  auditAlerts.devueltos.map((doc) => (
                    <div key={doc.id} className={`rounded-lg border p-3 text-xs flex items-start justify-between gap-3 ${subSurface}`}>
                      <div>
                        <p className="font-mono font-bold text-rose-400">{doc.codigo} (Rev. {doc.rev})</p>
                        <p className="font-medium mt-0.5">{doc.nombre}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Zona 3D: {doc.zona3d} · Act: {doc.fecha_actualizacion}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedZoneId(doc.zona3d);
                          setViewMode3D('bim3d');
                          setActiveTab('dashboard');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold shrink-0"
                      >
                        Inspeccionar 3D
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Brechas de Trazabilidad ACONEX */}
            <div className={`rounded-xl border p-5 space-y-3 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Brechas / Desactualizaciones en ACONEX ({auditAlerts.brechasAconex.length})
                </h3>
              </div>
              <div className="space-y-2">
                {auditAlerts.brechasAconex.length === 0 ? (
                  <p className="text-xs text-emerald-400">Trazabilidad ACONEX 100% al día.</p>
                ) : (
                  auditAlerts.brechasAconex.map((doc) => (
                    <div key={doc.id} className={`rounded-lg border p-3 text-xs ${subSurface}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-amber-300">{doc.codigo}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {doc.recibido_en || 'Sin Transmittal'}
                        </span>
                      </div>
                      <p className="font-medium mt-0.5">{doc.nombre}</p>
                      <p className="text-[11px] text-amber-200/90 mt-1">
                        {doc.observaciones || 'Falta número de Transmittal ACONEX'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Partidas con 0% Protocolizado */}
            <div className={`rounded-xl border p-5 space-y-3 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Partidas en 0% Protocolizado ({auditAlerts.partidasCero.length})
                </h3>
                <button
                  onClick={() => setActiveTab('avance')}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Editar avance
                </button>
              </div>
              <div className="space-y-2">
                {auditAlerts.partidasCero.length === 0 ? (
                  <p className="text-xs text-emerald-400">Todas las partidas tienen avance protocolizado.</p>
                ) : (
                  auditAlerts.partidasCero.map((p) => (
                    <div key={p.id} className={`rounded-lg border p-3 text-xs flex items-center justify-between ${subSurface}`}>
                      <div>
                        <p className="font-bold">
                          {p.item} {p.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          Proyectado: {p.proyectado.toLocaleString('es-CL')} protocolos · Zona: {p.zona3d}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-mono font-bold tabular-nums">
                        0%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. Procedimientos Pendientes / Eliminados */}
            <div className={`rounded-xl border p-5 space-y-3 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Procedimientos en Trámite / Eliminados ({auditAlerts.procsPendientes.length})
                </h3>
                <button
                  onClick={() => setActiveTab('procedimientos')}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Ir a planilla
                </button>
              </div>
              <div className="space-y-2">
                {auditAlerts.procsPendientes.map((proc) => (
                  <div key={proc.item} className={`rounded-lg border p-3 text-xs flex items-start justify-between gap-2 ${subSurface}`}>
                    <div>
                      <p className="font-mono font-bold text-cyan-300">{proc.codigo}</p>
                      <p className="font-medium mt-0.5">{proc.nombre}</p>
                      {proc.observaciones && (
                        <p className="text-[11px] text-slate-400 mt-1">{proc.observaciones}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${getProcStatusBadge(proc.estatus)}`}>
                      {proc.estatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ALL MODALS (CRUD + EXCEL IMPORT + SUPABASE SQL & SYNC) */}
      <KimalModals
        modalType={modalType}
        setModalType={setModalType}
        zonasBim={zonasBim}
        avanceKimal={avanceKimal}
        supabaseStatus={supabaseStatus}
        onRefreshSupabase={() => refreshFromBackend(false)}
        onSeedSupabase={handleSeedSupabase}
        isSyncing={isSyncing}
        newPartidaForm={newPartidaForm}
        setNewPartidaForm={setNewPartidaForm}
        onSubmitPartida={handleAddPartidaSubmit}
        newDocCivilForm={newDocCivilForm}
        setNewDocCivilForm={setNewDocCivilForm}
        generarCodigoIngenieria={generarCodigoIngenieria}
        onSubmitDocCivil={handleAddDocCivilSubmit}
        newProcForm={newProcForm}
        setNewProcForm={setNewProcForm}
        generarCodigoProcedimiento={generarCodigoProcedimiento}
        onSubmitProc={handleAddProcSubmit}
        newZona3DForm={newZona3DForm}
        setNewZona3DForm={setNewZona3DForm}
        onSubmitZona3D={handleAddZona3DSubmit}
        importTarget={importTarget}
        setImportTarget={setImportTarget}
        excelPasteText={excelPasteText}
        setExcelPasteText={setExcelPasteText}
        onSubmitExcelImport={handleImportFromExcel}
      />
    </div>
  );
}
