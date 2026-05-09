import { http } from "../httpClient";
import type { Factura, FacturaItem, PaginatedResponse } from "@/models";

// ─── Tipos ─────────────────────────────────────────

export type CreateFacturaInput = {
  items: FacturaItem[];
  clienteFisicoId?: string;
  clienteJuridicoId?: string;
};

// ─── API ───────────────────────────────────────────

export const facturasApi = {
  list(page = 1, limit = 50) {
    return http.get<PaginatedResponse<Factura>>(
      `/facturas?page=${page}&limit=${limit}`,
    );
  },

  getById(id: string) {
    return http.get<Factura>(`/facturas/${id}`);
  },

  /** Crear factura para cliente físico */
  createFisico(data: CreateFacturaInput) {
    return http.post<Factura>("/facturas/fisicos", {
      clienteFisicoId: data.clienteFisicoId,
      items: data.items,
    });
  },

  /** Crear factura para cliente jurídico */
  createJuridico(data: CreateFacturaInput) {
    return http.post<Factura>("/facturas/juridicos", {
      clienteJuridicoId: data.clienteJuridicoId,
      items: data.items,
    });
  },

  anular(id: string) {
    return http.patch<Factura>(`/facturas/${id}/anular`);
  },
};