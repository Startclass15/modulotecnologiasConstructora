import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AvancePartida,
  IngenieriaDoc,
  ProcedimientoKimal,
  SupabaseConnectionStatus,
  ZonaBim3D,
} from '../types/kimal';

const viteUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const viteAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!viteUrl || !viteAnon) return null;
  if (!browserClient) {
    browserClient = createClient(viteUrl, viteAnon);
  }
  return browserClient;
}

export interface BootstrapResponse {
  source: 'supabase' | 'local';
  seeded?: boolean;
  warning?: string;
  avance: AvancePartida[];
  ingenieria: IngenieriaDoc[];
  procedimientos: ProcedimientoKimal[];
  zonasBim: ZonaBim3D[];
}

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const kimalApi = {
  getStatus: () => apiJson<SupabaseConnectionStatus>('/api/kimal/status'),
  bootstrap: () => apiJson<BootstrapResponse>('/api/kimal/bootstrap'),
  seed: (reset = false) =>
    apiJson<{ ok: boolean; source: string; error?: string }>('/api/kimal/seed', {
      method: 'POST',
      body: JSON.stringify({ reset }),
    }),

  upsertAvance: (row: AvancePartida) =>
    apiJson<{ ok: boolean; source: string }>('/api/kimal/avance', {
      method: 'POST',
      body: JSON.stringify(row),
    }),
  patchAvance: (id: string, patch: Partial<AvancePartida>) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/avance/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteAvance: (id: string) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/avance/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  upsertIngenieria: (doc: IngenieriaDoc) =>
    apiJson<{ ok: boolean; source: string }>('/api/kimal/ingenieria', {
      method: 'POST',
      body: JSON.stringify(doc),
    }),
  patchIngenieria: (id: number, patch: Partial<IngenieriaDoc>) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/ingenieria/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteIngenieria: (id: number) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/ingenieria/${id}`, {
      method: 'DELETE',
    }),

  upsertProcedimiento: (proc: ProcedimientoKimal) =>
    apiJson<{ ok: boolean; source: string }>('/api/kimal/procedimientos', {
      method: 'POST',
      body: JSON.stringify(proc),
    }),
  patchProcedimiento: (item: number, patch: Partial<ProcedimientoKimal>) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/procedimientos/${item}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteProcedimiento: (item: number) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/procedimientos/${item}`, {
      method: 'DELETE',
    }),

  upsertZona: (zona: ZonaBim3D) =>
    apiJson<{ ok: boolean; source: string }>('/api/kimal/zonas', {
      method: 'POST',
      body: JSON.stringify(zona),
    }),
  deleteZona: (zonaId: string) =>
    apiJson<{ ok: boolean; source: string }>(`/api/kimal/zonas/${encodeURIComponent(zonaId)}`, {
      method: 'DELETE',
    }),

  bulkImport: (target: string, rows: unknown[]) =>
    apiJson<{ ok: boolean; source: string; count: number }>('/api/kimal/import', {
      method: 'POST',
      body: JSON.stringify({ target, rows }),
    }),
};
