import { http } from "../httpClient";
import type { Mantenimiento, PaginatedResponse } from "@/models";

// ─── Tipos ─────────────────────────────────────────

export type CreateMantenimientoInput = {
  descripcion: string;
  clienteFisicoId?: string;
  clienteJuridicoId?: string;
};

// ─── API ───────────────────────────────────────────

export const mantenimientosApi = {
  /** Mantenimientos de clientes físicos */
  listFisicos(clienteId?: string, page = 1, limit = 50) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (clienteId) params.set("clienteId", clienteId);
    return http.get<PaginatedResponse<Mantenimiento>>(
      `/mantenimientos/fisicos?${params.toString()}`,
    );
  },

  createFisico(data: CreateMantenimientoInput) {
    return http.post<Mantenimiento>("/mantenimientos/fisicos", {
      clienteFisicoId: data.clienteFisicoId,
      descripcion: data.descripcion,
    });
  },

  /** Mantenimientos de clientes jurídicos */
  listJuridicos(clienteId?: string, page = 1, limit = 50) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (clienteId) params.set("clienteId", clienteId);
    return http.get<PaginatedResponse<Mantenimiento>>(
      `/mantenimientos/juridicos?${params.toString()}`,
    );
  },

  createJuridico(data: CreateMantenimientoInput) {
    return http.post<Mantenimiento>("/mantenimientos/juridicos", {
      clienteJuridicoId: data.clienteJuridicoId,
      descripcion: data.descripcion,
    });
  },
};

// ─── Helpers para lista unificada ──────────────────

export async function fetchTodosMantenimientos(
  clienteId?: string,
  page = 1,
  limit = 50,
) {
  const [fisicos, juridicos] = await Promise.all([
    mantenimientosApi.listFisicos(clienteId, page, limit),
    mantenimientosApi.listJuridicos(clienteId, page, limit),
  ]);

  // Marcar cada registro con su origen para mostrarlo en UI
  const todos = [
    ...fisicos.data.map((m) => ({ ...m, _origen: "fisico" as const })),
    ...juridicos.data.map((m) => ({ ...m, _origen: "juridico" as const })),
  ];

  // Ordenar por fecha descendente
  todos.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  return {
    data: todos,
    total: fisicos.total + juridicos.total,
    page,
    limit,
  };
}