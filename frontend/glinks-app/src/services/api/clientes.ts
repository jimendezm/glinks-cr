import { http } from "../httpClient";
import type {
  ClienteFisico,
  ClienteJuridico,
  PlanTipo,
  PaginatedResponse,
} from "@/models";

// ─── Tipos para creación/actualización ─────────────

export type CreateClienteFisicoInput = {
  cedula: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  telefonoPrimario: string;
  telefonoSecundario?: string | null;
  email?: string | null;
  domicilio: string;
  plan: PlanTipo;
  sectorial: string;
  tipoAP: string;
  routerId: number;
  poeId: number;
};

export type UpdateClienteFisicoInput = Partial<CreateClienteFisicoInput>;

export type CreateClienteJuridicoInput = {
  cedulaJuridica: string;
  nombreEmpresa: string;
  telefonoPrimario: string;
  telefonoSecundario?: string | null;
  email?: string | null;
  domicilio: string;
  plan: PlanTipo;
  sectorial: string;
  tipoAP: string;
  routerId: number;
  poeId: number;
};

export type UpdateClienteJuridicoInput = Partial<CreateClienteJuridicoInput>;

export type ClienteSearchFilters = {
  nombre?: string;
  cedula?: string;
  nombreEmpresa?: string;
  cedulaJuridica?: string;
  sectorial?: string;
};

// ─── Físicos ───────────────────────────────────────

export const clientesFisicosApi = {
  list(page = 1, limit = 50) {
    return http.get<PaginatedResponse<ClienteFisico>>(
      `/clientes-fisicos?page=${page}&limit=${limit}`,
    );
  },

  search(filters: {
    nombre?: string;
    cedula?: string;
    sectorial?: string;
  }) {
    const params = new URLSearchParams();
    if (filters.nombre) params.set("nombre", filters.nombre);
    if (filters.cedula) params.set("cedula", filters.cedula);
    if (filters.sectorial) params.set("sectorial", filters.sectorial);
    return http.get<ClienteFisico[]>(
      `/clientes-fisicos/search?${params.toString()}`,
    );
  },

  getById(id: string) {
    return http.get<ClienteFisico>(`/clientes-fisicos/${id}`);
  },

  create(data: CreateClienteFisicoInput) {
    return http.post<ClienteFisico>("/clientes-fisicos", data);
  },

  update(id: string, data: UpdateClienteFisicoInput) {
    return http.put<ClienteFisico>(`/clientes-fisicos/${id}`, data);
  },

  remove(id: string) {
    return http.delete<{ message: string }>(`/clientes-fisicos/${id}`);
  },
};

// ─── Jurídicos ─────────────────────────────────────

export const clientesJuridicosApi = {
  list(page = 1, limit = 50) {
    return http.get<PaginatedResponse<ClienteJuridico>>(
      `/clientes-juridicos?page=${page}&limit=${limit}`,
    );
  },

  search(filters: {
    nombreEmpresa?: string;
    cedulaJuridica?: string;
    sectorial?: string;
  }) {
    const params = new URLSearchParams();
    if (filters.nombreEmpresa) params.set("nombreEmpresa", filters.nombreEmpresa);
    if (filters.cedulaJuridica) params.set("cedulaJuridica", filters.cedulaJuridica);
    if (filters.sectorial) params.set("sectorial", filters.sectorial);
    return http.get<ClienteJuridico[]>(
      `/clientes-juridicos/search?${params.toString()}`,
    );
  },

  getById(id: string) {
    return http.get<ClienteJuridico>(`/clientes-juridicos/${id}`);
  },

  create(data: CreateClienteJuridicoInput) {
    return http.post<ClienteJuridico>("/clientes-juridicos", data);
  },

  update(id: string, data: UpdateClienteJuridicoInput) {
    return http.put<ClienteJuridico>(`/clientes-juridicos/${id}`, data);
  },

  remove(id: string) {
    return http.delete<{ message: string }>(`/clientes-juridicos/${id}`);
  },
};

// ─── Helpers para lista unificada ──────────────────

export async function fetchTodosClientes() {
  const [fisicos, juridicos] = await Promise.all([
    clientesFisicosApi.list(),
    clientesJuridicosApi.list(),
  ]);

  return [
    ...fisicos.data.map(
      (c): ClienteFisico & { tipo: "fisico" } => ({ ...c, tipo: "fisico" }),
    ),
    ...juridicos.data.map(
      (c): ClienteJuridico & { tipo: "juridico" } => ({
        ...c,
        tipo: "juridico",
      }),
    ),
  ] as Array<
    | (ClienteFisico & { tipo: "fisico" })
    | (ClienteJuridico & { tipo: "juridico" })
  >;
}