import { http } from "../httpClient";
import type {
  PhysicalClient,
  LegalClient,
  UnifiedClient,
} from "@/models";

// ─── Tipos para creación/actualización ─────────────

export type CreatePhysicalClientInput = {
  nationalId: string;
  name: string;
  lastName1: string;
  lastName2: string;
  primaryPhone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address: string;
  exonerated: boolean;
};

export type UpdatePhysicalClientInput = Partial<CreatePhysicalClientInput>;

export type CreateLegalClientInput = {
  legalId: string;
  name: string;
  primaryPhone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address: string;
  exonerated: boolean;
};

export type UpdateLegalClientInput = Partial<CreateLegalClientInput>;

// ─── Respuesta del backend ─────────────────────────
interface BackendPagination {
  take: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BackendListResponse<T> {
  success: boolean;
  data: T[];
  pagination: BackendPagination;
}

interface BackendSingleResponse<T> {
  success: boolean;
  data: T;
}

// ─── Físicos ───────────────────────────────────────

export const physicalClientsApi = {
  async list(page = 1, limit = 50) {
    const response = await http.get<BackendListResponse<PhysicalClient>>(
      `/clientes-fisicos?page=${page}&limit=${limit}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  async search(nationalId?: string, name?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (nationalId) params.set("nationalId", nationalId);
    if (name) params.set("name", name);
    const response = await http.get<BackendListResponse<PhysicalClient>>(
      `/clientes-fisicos/search?${params.toString()}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  async getById(id: string) {
    const response = await http.get<BackendSingleResponse<PhysicalClient>>(
      `/clientes-fisicos/${id}`
    );
    return response.data;
  },

  create(data: CreatePhysicalClientInput) {
    return http.post<PhysicalClient>("/clientes-fisicos", data);
  },

  update(id: string, data: UpdatePhysicalClientInput) {
    return http.put<PhysicalClient>(`/clientes-fisicos/${id}`, data);
  },

  remove(id: string) {
    return http.delete<{ message: string }>(`/clientes-fisicos/${id}`);
  },
};

// ─── Jurídicos ─────────────────────────────────────

export const legalClientsApi = {
  async list(page = 1, limit = 50) {
    const response = await http.get<BackendListResponse<LegalClient>>(
      `/clientes-juridicos?page=${page}&limit=${limit}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  async search(legalId?: string, name?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (legalId) params.set("legalId", legalId);
    if (name) params.set("name", name);
    const response = await http.get<BackendListResponse<LegalClient>>(
      `/clientes-juridicos/search?${params.toString()}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  async getById(id: string) {
    const response = await http.get<BackendSingleResponse<LegalClient>>(
      `/clientes-juridicos/${id}`
    );
    return response.data;
  },

  create(data: CreateLegalClientInput) {
    return http.post<LegalClient>("/clientes-juridicos", data);
  },

  update(id: string, data: UpdateLegalClientInput) {
    return http.put<LegalClient>(`/clientes-juridicos/${id}`, data);
  },

  remove(id: string) {
    return http.delete<{ message: string }>(`/clientes-juridicos/${id}`);
  },
};

// ─── Helpers para lista unificada ──────────────────

export async function fetchAllClients(): Promise<UnifiedClient[]> {
  const [physical, legal] = await Promise.all([
    physicalClientsApi.list(1, 1000),
    legalClientsApi.list(1, 1000),
  ]);

  const physicalData = physical.data ?? [];
  const legalData = legal.data ?? [];

  return [
    ...physicalData.map(
      (c): UnifiedClient => ({
        ...c,
        tipo: "fisico",
      }),
    ),
    ...legalData.map(
      (c): UnifiedClient => ({
        ...c,
        tipo: "juridico",
      }),
    ),
  ];
}