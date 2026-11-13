export type ViewMode3D = 'bim3d' | 'avance3d' | 'aconex3d';

export type CameraPreset = 'isometric' | 'top' | 'front' | 'side';

export type ActiveTab = 'dashboard' | 'avance' | 'ingenieria' | 'procedimientos' | 'alertas';

export type ModalType =
  | 'partida'
  | 'ingenieria'
  | 'procedimiento'
  | 'estructura3d'
  | 'importExcel'
  | 'supabase'
  | null;

export interface AvancePartida {
  item: string;
  id: string;
  nombre: string;
  proyectado: number;
  ejecutados_sp: number;
  en_ito: number;
  cerrado_protocolizado: number;
  protocolizado_pct: number;
  zona3d: string;
  descripcionZona: string;
  pos3d: { x: number; z: number };
}

export interface IngenieriaDoc {
  id: number;
  disciplina: string;
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
}

export interface ProcedimientoKimal {
  item: number;
  area: string;
  esp: string;
  nombre: string;
  codigo: string;
  estatus: string;
  rev: string;
  fecha_envio: string;
  fecha_aprobacion: string;
  observaciones: string;
}

export type ZonaGeometria =
  | 'transformador'
  | 'edificio'
  | 'torre_hvdc'
  | 'patio_ac'
  | 'canaleta';

export interface ZonaBim3D {
  zonaId: string;
  titulo: string;
  partida: string;
  tipoGeometria: ZonaGeometria;
  pos: { x: number; z: number };
  size: { w: number; h: number; d: number };
  estatusDominante: string;
  colorHex: number;
  resumen: string;
}

export interface SupabaseConnectionStatus {
  configured: boolean;
  connected: boolean;
  tablesReady: boolean;
  realtimeEnabled: boolean;
  source: 'supabase' | 'local';
  counts: {
    avance: number;
    ingenieria: number;
    procedimientos: number;
    zonas: number;
  };
  error?: string;
}
