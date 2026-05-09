import { http } from "../httpClient";
import type { Producto, ProductoTipo, PaginatedResponse } from "@/models";

// ─── Tipos ─────────────────────────────────────────

export type CreateProductoInput = {
  nombre: string;
  tipo: ProductoTipo;
  serial: string;
  stock: number;
  precio: number;
};

export type UpdateProductoInput = Partial<
  CreateProductoInput & { estado: string }
>;

export interface InventarioResumen {
  routers: { total: number; disponible: number; enUso: number };
  poes: { total: number; disponible: number; enUso: number };
}

// ─── API ───────────────────────────────────────────

export const productosApi = {
  resumen() {
    return http.get<InventarioResumen>("/productos/resumen");
  },

  list(page = 1, limit = 50) {
    return http.get<PaginatedResponse<Producto>>(
      `/productos?page=${page}&limit=${limit}`,
    );
  },

  getById(id: string) {
    return http.get<Producto>(`/productos/${id}`);
  },

  create(data: CreateProductoInput) {
    return http.post<Producto>("/productos", data);
  },

  update(id: string, data: UpdateProductoInput) {
    return http.put<Producto>(`/productos/${id}`, data);
  },

  remove(id: string) {
    return http.delete<{ message: string }>(`/productos/${id}`);
  },
};