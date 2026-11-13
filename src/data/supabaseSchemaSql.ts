export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- SE KIMAL · CONVERSORA HVDC · ESQUEMA SUPABASE POSTGRESQL
-- Copia y ejecuta este script en el SQL Editor de tu proyecto Supabase
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kimal_avance_partidas (
  id TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  nombre TEXT NOT NULL,
  proyectado INTEGER NOT NULL DEFAULT 0,
  ejecutados_sp INTEGER NOT NULL DEFAULT 0,
  en_ito INTEGER NOT NULL DEFAULT 0,
  cerrado_protocolizado INTEGER NOT NULL DEFAULT 0,
  protocolizado_pct INTEGER NOT NULL DEFAULT 0,
  zona3d TEXT NOT NULL DEFAULT 'Patio de Transformadores',
  descripcion_zona TEXT NOT NULL DEFAULT '',
  pos3d JSONB NOT NULL DEFAULT '{"x": 0, "z": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kimal_ingenieria_docs (
  id BIGINT PRIMARY KEY,
  disciplina TEXT NOT NULL DEFAULT '01 Ingeniería - Civil',
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rev TEXT NOT NULL DEFAULT '0',
  estatus TEXT NOT NULL DEFAULT 'Recibido',
  recibido_en TEXT NOT NULL DEFAULT '',
  fecha_actualizacion TEXT NOT NULL DEFAULT '',
  fecha_aprobado TEXT NOT NULL DEFAULT '',
  observaciones TEXT NOT NULL DEFAULT '',
  zona3d TEXT NOT NULL DEFAULT 'Patio de Transformadores',
  partida_vinculada TEXT NOT NULL DEFAULT '1.- Obras Civiles',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kimal_procedimientos (
  item INTEGER PRIMARY KEY,
  area TEXT NOT NULL DEFAULT 'SSO',
  esp TEXT NOT NULL DEFAULT 'SSO',
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  estatus TEXT NOT NULL DEFAULT 'APROBADO',
  rev TEXT NOT NULL DEFAULT '0',
  fecha_envio TEXT NOT NULL DEFAULT '',
  fecha_aprobacion TEXT NOT NULL DEFAULT '',
  observaciones TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kimal_zonas_bim_3d (
  zona_id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  partida TEXT NOT NULL,
  tipo_geometria TEXT NOT NULL DEFAULT 'edificio',
  pos JSONB NOT NULL DEFAULT '{"x": 0, "z": 0}'::jsonb,
  size JSONB NOT NULL DEFAULT '{"w": 5, "h": 3.5, "d": 4.5}'::jsonb,
  estatus_dominante TEXT NOT NULL DEFAULT 'Recibido',
  color_hex INTEGER NOT NULL DEFAULT 62206,
  resumen TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kimal_avance_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kimal_ingenieria_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kimal_procedimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kimal_zonas_bim_3d ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kimal_avance_all" ON public.kimal_avance_partidas;
CREATE POLICY "kimal_avance_all" ON public.kimal_avance_partidas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kimal_ing_all" ON public.kimal_ingenieria_docs;
CREATE POLICY "kimal_ing_all" ON public.kimal_ingenieria_docs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kimal_proc_all" ON public.kimal_procedimientos;
CREATE POLICY "kimal_proc_all" ON public.kimal_procedimientos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kimal_zonas_all" ON public.kimal_zonas_bim_3d;
CREATE POLICY "kimal_zonas_all" ON public.kimal_zonas_bim_3d FOR ALL USING (true) WITH CHECK (true);
`;
