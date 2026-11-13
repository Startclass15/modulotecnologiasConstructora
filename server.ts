import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_AVANCE_KIMAL,
  INITIAL_INGENIERIA_CIVIL,
  INITIAL_PROCEDIMIENTOS_KIMAL,
  INITIAL_ZONAS_BIM_3D,
} from './src/data/initialKimalData.ts';
import type {
  AvancePartida,
  IngenieriaDoc,
  ProcedimientoKimal,
  ZonaBim3D,
} from './src/types/kimal.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Mappers between camelCase TypeScript interfaces and snake_case Supabase PostgreSQL columns
function toDbAvance(row: AvancePartida) {
  return {
    id: row.id,
    item: row.item,
    nombre: row.nombre,
    proyectado: Number(row.proyectado) || 0,
    ejecutados_sp: Number(row.ejecutados_sp) || 0,
    en_ito: Number(row.en_ito) || 0,
    cerrado_protocolizado: Number(row.cerrado_protocolizado) || 0,
    protocolizado_pct: Number(row.protocolizado_pct) || 0,
    zona3d: row.zona3d,
    descripcion_zona: row.descripcionZona || '',
    pos3d: row.pos3d || { x: 0, z: 0 },
  };
}

function fromDbAvance(r: Record<string, any>): AvancePartida {
  return {
    id: String(r.id),
    item: String(r.item),
    nombre: String(r.nombre),
    proyectado: Number(r.proyectado) || 0,
    ejecutados_sp: Number(r.ejecutados_sp) || 0,
    en_ito: Number(r.en_ito) || 0,
    cerrado_protocolizado: Number(r.cerrado_protocolizado) || 0,
    protocolizado_pct: Number(r.protocolizado_pct) || 0,
    zona3d: String(r.zona3d || 'Patio de Transformadores'),
    descripcionZona: String(r.descripcion_zona || ''),
    pos3d: r.pos3d || { x: 0, z: 0 },
  };
}

function toDbIng(doc: IngenieriaDoc) {
  return {
    id: Number(doc.id),
    disciplina: doc.disciplina || '01 Ingeniería - Civil',
    codigo: doc.codigo,
    nombre: doc.nombre,
    rev: String(doc.rev ?? '0'),
    estatus: doc.estatus,
    recibido_en: doc.recibido_en || '',
    fecha_actualizacion: doc.fecha_actualizacion || '',
    fecha_aprobado: doc.fecha_aprobado || '',
    observaciones: doc.observaciones || '',
    zona3d: doc.zona3d || 'Patio de Transformadores',
    partida_vinculada: doc.partidaVinculada || '1.- Obras Civiles',
  };
}

function fromDbIng(r: Record<string, any>): IngenieriaDoc {
  return {
    id: Number(r.id),
    disciplina: String(r.disciplina || '01 Ingeniería - Civil'),
    codigo: String(r.codigo),
    nombre: String(r.nombre),
    rev: String(r.rev ?? '0'),
    estatus: String(r.estatus || 'Recibido'),
    recibido_en: String(r.recibido_en || ''),
    fecha_actualizacion: String(r.fecha_actualizacion || ''),
    fecha_aprobado: String(r.fecha_aprobado || ''),
    observaciones: String(r.observaciones || ''),
    zona3d: String(r.zona3d || 'Patio de Transformadores'),
    partidaVinculada: String(r.partida_vinculada || '1.- Obras Civiles'),
  };
}

function toDbProc(proc: ProcedimientoKimal) {
  return {
    item: Number(proc.item),
    area: proc.area || 'SSO',
    esp: proc.esp || proc.area || 'SSO',
    nombre: proc.nombre,
    codigo: proc.codigo,
    estatus: proc.estatus || 'APROBADO',
    rev: String(proc.rev ?? ''),
    fecha_envio: proc.fecha_envio || '',
    fecha_aprobacion: proc.fecha_aprobacion || '',
    observaciones: proc.observaciones || '',
  };
}

function fromDbProc(r: Record<string, any>): ProcedimientoKimal {
  return {
    item: Number(r.item),
    area: String(r.area || 'SSO'),
    esp: String(r.esp || 'SSO'),
    nombre: String(r.nombre),
    codigo: String(r.codigo),
    estatus: String(r.estatus || 'APROBADO'),
    rev: String(r.rev ?? ''),
    fecha_envio: String(r.fecha_envio || ''),
    fecha_aprobacion: String(r.fecha_aprobacion || ''),
    observaciones: String(r.observaciones || ''),
  };
}

function toDbZona(z: ZonaBim3D) {
  return {
    zona_id: z.zonaId,
    titulo: z.titulo,
    partida: z.partida,
    tipo_geometria: z.tipoGeometria,
    pos: z.pos,
    size: z.size,
    estatus_dominante: z.estatusDominante,
    color_hex: Number(z.colorHex) || 0x06b6d4,
    resumen: z.resumen || '',
  };
}

function fromDbZona(r: Record<string, any>): ZonaBim3D {
  return {
    zonaId: String(r.zona_id),
    titulo: String(r.titulo),
    partida: String(r.partida),
    tipoGeometria: r.tipo_geometria || 'edificio',
    pos: r.pos || { x: 0, z: 0 },
    size: r.size || { w: 5, h: 3.5, d: 4.5 },
    estatusDominante: String(r.estatus_dominante || 'Recibido'),
    colorHex: Number(r.color_hex) || 0x06b6d4,
    resumen: String(r.resumen || ''),
  };
}

// Fallback store when Supabase env vars are not yet configured
const fallbackStore = {
  avance: [...INITIAL_AVANCE_KIMAL],
  ingenieria: [...INITIAL_INGENIERIA_CIVIL],
  procedimientos: [...INITIAL_PROCEDIMIENTOS_KIMAL],
  zonasBim: [...INITIAL_ZONAS_BIM_3D],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // 1. Connection & table health check
  app.get('/api/kimal/status', async (_req, res) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({
        configured: false,
        connected: false,
        tablesReady: false,
        realtimeEnabled: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        source: 'local',
        counts: {
          avance: fallbackStore.avance.length,
          ingenieria: fallbackStore.ingenieria.length,
          procedimientos: fallbackStore.procedimientos.length,
          zonas: fallbackStore.zonasBim.length,
        },
      });
    }

    try {
      const [av, ing, proc, zon] = await Promise.all([
        supabase.from('kimal_avance_partidas').select('id', { count: 'exact', head: true }),
        supabase.from('kimal_ingenieria_docs').select('id', { count: 'exact', head: true }),
        supabase.from('kimal_procedimientos').select('item', { count: 'exact', head: true }),
        supabase.from('kimal_zonas_bim_3d').select('zona_id', { count: 'exact', head: true }),
      ]);

      const err = av.error || ing.error || proc.error || zon.error;
      if (err) {
        return res.json({
          configured: true,
          connected: true,
          tablesReady: false,
          realtimeEnabled: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
          source: 'local',
          counts: {
            avance: fallbackStore.avance.length,
            ingenieria: fallbackStore.ingenieria.length,
            procedimientos: fallbackStore.procedimientos.length,
            zonas: fallbackStore.zonasBim.length,
          },
          error: err.message,
        });
      }

      return res.json({
        configured: true,
        connected: true,
        tablesReady: true,
        realtimeEnabled: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        source: 'supabase',
        counts: {
          avance: av.count ?? 0,
          ingenieria: ing.count ?? 0,
          procedimientos: proc.count ?? 0,
          zonas: zon.count ?? 0,
        },
      });
    } catch (error: any) {
      return res.json({
        configured: true,
        connected: false,
        tablesReady: false,
        realtimeEnabled: false,
        source: 'local',
        counts: {
          avance: fallbackStore.avance.length,
          ingenieria: fallbackStore.ingenieria.length,
          procedimientos: fallbackStore.procedimientos.length,
          zonas: fallbackStore.zonasBim.length,
        },
        error: error?.message || 'Error connecting to Supabase',
      });
    }
  });

  // 2. Bootstrap all datasets (auto-seeds Supabase if tables exist and are empty)
  app.get('/api/kimal/bootstrap', async (_req, res) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({
        source: 'local',
        avance: fallbackStore.avance,
        ingenieria: fallbackStore.ingenieria,
        procedimientos: fallbackStore.procedimientos,
        zonasBim: fallbackStore.zonasBim,
      });
    }

    try {
      const [avRes, ingRes, procRes, zonRes] = await Promise.all([
        supabase.from('kimal_avance_partidas').select('*').order('item', { ascending: true }),
        supabase.from('kimal_ingenieria_docs').select('*').order('id', { ascending: true }),
        supabase.from('kimal_procedimientos').select('*').order('item', { ascending: true }),
        supabase.from('kimal_zonas_bim_3d').select('*'),
      ]);

      if (avRes.error || ingRes.error || procRes.error || zonRes.error) {
        const firstErr = avRes.error || ingRes.error || procRes.error || zonRes.error;
        return res.json({
          source: 'local',
          warning: firstErr?.message,
          avance: fallbackStore.avance,
          ingenieria: fallbackStore.ingenieria,
          procedimientos: fallbackStore.procedimientos,
          zonasBim: fallbackStore.zonasBim,
        });
      }

      const isEmpty =
        (avRes.data?.length || 0) === 0 &&
        (ingRes.data?.length || 0) === 0 &&
        (procRes.data?.length || 0) === 0 &&
        (zonRes.data?.length || 0) === 0;

      if (isEmpty) {
        await Promise.all([
          supabase.from('kimal_avance_partidas').upsert(INITIAL_AVANCE_KIMAL.map(toDbAvance)),
          supabase.from('kimal_ingenieria_docs').upsert(INITIAL_INGENIERIA_CIVIL.map(toDbIng)),
          supabase.from('kimal_procedimientos').upsert(INITIAL_PROCEDIMIENTOS_KIMAL.map(toDbProc)),
          supabase.from('kimal_zonas_bim_3d').upsert(INITIAL_ZONAS_BIM_3D.map(toDbZona)),
        ]);

        return res.json({
          source: 'supabase',
          seeded: true,
          avance: INITIAL_AVANCE_KIMAL,
          ingenieria: INITIAL_INGENIERIA_CIVIL,
          procedimientos: INITIAL_PROCEDIMIENTOS_KIMAL,
          zonasBim: INITIAL_ZONAS_BIM_3D,
        });
      }

      return res.json({
        source: 'supabase',
        avance: (avRes.data || []).map(fromDbAvance),
        ingenieria: (ingRes.data || []).map(fromDbIng),
        procedimientos: (procRes.data || []).map(fromDbProc),
        zonasBim: (zonRes.data || []).map(fromDbZona),
      });
    } catch (error: any) {
      return res.json({
        source: 'local',
        warning: error?.message,
        avance: fallbackStore.avance,
        ingenieria: fallbackStore.ingenieria,
        procedimientos: fallbackStore.procedimientos,
        zonasBim: fallbackStore.zonasBim,
      });
    }
  });

  // 3. Explicit Seed / Reset Official SE Kimal Data to Supabase
  app.post('/api/kimal/seed', async (req, res) => {
    const reset = Boolean(req.body?.reset);
    const supabase = getSupabaseAdmin();

    if (reset) {
      fallbackStore.avance = [...INITIAL_AVANCE_KIMAL];
      fallbackStore.ingenieria = [...INITIAL_INGENIERIA_CIVIL];
      fallbackStore.procedimientos = [...INITIAL_PROCEDIMIENTOS_KIMAL];
      fallbackStore.zonasBim = [...INITIAL_ZONAS_BIM_3D];
    }

    if (!supabase) {
      return res.json({ ok: true, source: 'local', reset });
    }

    try {
      if (reset) {
        await Promise.all([
          supabase.from('kimal_avance_partidas').delete().neq('id', '__none__'),
          supabase.from('kimal_ingenieria_docs').delete().gte('id', 0),
          supabase.from('kimal_procedimientos').delete().gte('item', 0),
          supabase.from('kimal_zonas_bim_3d').delete().neq('zona_id', '__none__'),
        ]);
      }

      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('kimal_avance_partidas').upsert(INITIAL_AVANCE_KIMAL.map(toDbAvance)),
        supabase.from('kimal_ingenieria_docs').upsert(INITIAL_INGENIERIA_CIVIL.map(toDbIng)),
        supabase.from('kimal_procedimientos').upsert(INITIAL_PROCEDIMIENTOS_KIMAL.map(toDbProc)),
        supabase.from('kimal_zonas_bim_3d').upsert(INITIAL_ZONAS_BIM_3D.map(toDbZona)),
      ]);

      const err = r1.error || r2.error || r3.error || r4.error;
      if (err) {
        return res.status(400).json({ ok: false, error: err.message });
      }

      return res.json({ ok: true, source: 'supabase', reset });
    } catch (error: any) {
      return res.status(500).json({ ok: false, error: error?.message || 'Seed error' });
    }
  });

  // 4. CRUD: Avance Partidas
  app.post('/api/kimal/avance', async (req, res) => {
    const row: AvancePartida = req.body;
    fallbackStore.avance = [...fallbackStore.avance.filter((r) => r.id !== row.id), row];
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local', data: row });

    const { error } = await supabase.from('kimal_avance_partidas').upsert(toDbAvance(row));
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase', data: row });
  });

  app.patch('/api/kimal/avance/:id', async (req, res) => {
    const { id } = req.params;
    const patch = req.body;
    fallbackStore.avance = fallbackStore.avance.map((r) => (r.id === id ? { ...r, ...patch } : r));
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const dbPatch: Record<string, any> = { ...patch };
    if ('descripcionZona' in dbPatch) {
      dbPatch.descripcion_zona = dbPatch.descripcionZona;
      delete dbPatch.descripcionZona;
    }

    const { error } = await supabase.from('kimal_avance_partidas').update(dbPatch).eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  app.delete('/api/kimal/avance/:id', async (req, res) => {
    const { id } = req.params;
    fallbackStore.avance = fallbackStore.avance.filter((r) => r.id !== id);
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const { error } = await supabase.from('kimal_avance_partidas').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  // 5. CRUD: Ingeniería Docs
  app.post('/api/kimal/ingenieria', async (req, res) => {
    const doc: IngenieriaDoc = req.body;
    fallbackStore.ingenieria = [doc, ...fallbackStore.ingenieria.filter((d) => d.id !== doc.id)];
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local', data: doc });

    const { error } = await supabase.from('kimal_ingenieria_docs').upsert(toDbIng(doc));
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase', data: doc });
  });

  app.patch('/api/kimal/ingenieria/:id', async (req, res) => {
    const id = Number(req.params.id);
    const patch = req.body;
    fallbackStore.ingenieria = fallbackStore.ingenieria.map((d) => (d.id === id ? { ...d, ...patch } : d));
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const dbPatch: Record<string, any> = { ...patch };
    if ('partidaVinculada' in dbPatch) {
      dbPatch.partida_vinculada = dbPatch.partidaVinculada;
      delete dbPatch.partidaVinculada;
    }

    const { error } = await supabase.from('kimal_ingenieria_docs').update(dbPatch).eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  app.delete('/api/kimal/ingenieria/:id', async (req, res) => {
    const id = Number(req.params.id);
    fallbackStore.ingenieria = fallbackStore.ingenieria.filter((d) => d.id !== id);
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const { error } = await supabase.from('kimal_ingenieria_docs').delete().eq('id', id);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  // 6. CRUD: Procedimientos Conversora Kimal
  app.post('/api/kimal/procedimientos', async (req, res) => {
    const proc: ProcedimientoKimal = req.body;
    fallbackStore.procedimientos = [
      ...fallbackStore.procedimientos.filter((p) => p.item !== proc.item),
      proc,
    ];
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local', data: proc });

    const { error } = await supabase.from('kimal_procedimientos').upsert(toDbProc(proc));
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase', data: proc });
  });

  app.patch('/api/kimal/procedimientos/:item', async (req, res) => {
    const item = Number(req.params.item);
    const patch = req.body;
    fallbackStore.procedimientos = fallbackStore.procedimientos.map((p) =>
      p.item === item ? { ...p, ...patch } : p
    );
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const { error } = await supabase.from('kimal_procedimientos').update(patch).eq('item', item);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  app.delete('/api/kimal/procedimientos/:item', async (req, res) => {
    const item = Number(req.params.item);
    fallbackStore.procedimientos = fallbackStore.procedimientos.filter((p) => p.item !== item);
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const { error } = await supabase.from('kimal_procedimientos').delete().eq('item', item);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  // 7. CRUD: Zonas BIM 3D
  app.post('/api/kimal/zonas', async (req, res) => {
    const zona: ZonaBim3D = req.body;
    fallbackStore.zonasBim = [
      ...fallbackStore.zonasBim.filter((z) => z.zonaId !== zona.zonaId),
      zona,
    ];
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local', data: zona });

    const { error } = await supabase.from('kimal_zonas_bim_3d').upsert(toDbZona(zona));
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase', data: zona });
  });

  app.delete('/api/kimal/zonas/:zonaId', async (req, res) => {
    const zonaId = decodeURIComponent(req.params.zonaId);
    fallbackStore.zonasBim = fallbackStore.zonasBim.filter((z) => z.zonaId !== zonaId);
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.json({ ok: true, source: 'local' });

    const { error } = await supabase.from('kimal_zonas_bim_3d').delete().eq('zona_id', zonaId);
    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.json({ ok: true, source: 'supabase' });
  });

  // 8. Bulk import endpoint
  app.post('/api/kimal/import', async (req, res) => {
    const { target, rows } = req.body as { target: string; rows: any[] };
    const supabase = getSupabaseAdmin();

    if (target === 'avance') {
      fallbackStore.avance = [...fallbackStore.avance, ...rows];
      if (supabase) {
        const { error } = await supabase.from('kimal_avance_partidas').upsert(rows.map(toDbAvance));
        if (error) return res.status(400).json({ ok: false, error: error.message });
      }
    } else if (target === 'ingenieria') {
      fallbackStore.ingenieria = [...rows, ...fallbackStore.ingenieria];
      if (supabase) {
        const { error } = await supabase.from('kimal_ingenieria_docs').upsert(rows.map(toDbIng));
        if (error) return res.status(400).json({ ok: false, error: error.message });
      }
    } else if (target === 'procedimientos') {
      fallbackStore.procedimientos = [...fallbackStore.procedimientos, ...rows];
      if (supabase) {
        const { error } = await supabase.from('kimal_procedimientos').upsert(rows.map(toDbProc));
        if (error) return res.status(400).json({ ok: false, error: error.message });
      }
    }

    return res.json({ ok: true, source: supabase ? 'supabase' : 'local', count: rows.length });
  });

  // Vite integration in dev vs static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SE Kimal Digital Twin server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
