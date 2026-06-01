import { http } from "../httpClient";
import type { Maintenance } from "@/models";

interface BackendResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateMaintenanceProductInput {
  amount: number;
  productId: string;
}

export interface CreateMaintenanceInput {
  description: string;
  physicalClientId?: string;
  legalClientId?: string;
  maintenanceProducts: CreateMaintenanceProductInput[];
}

export const mantenimientosApi = {
  async listPhysical(page = 1, limit = 50) {
    const response = await http.get<BackendResponse<Maintenance[]>>(
      `/mantenimientos/fisicos?page=${page}&limit=${limit}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  createPhysical(data: Omit<CreateMaintenanceInput, "legalClientId">) {
    return http.post<Maintenance>("/mantenimientos/fisicos", {
      date: new Date(),
      description: data.description,
      physicalClientId: data.physicalClientId,
      maintenanceProducts: data.maintenanceProducts,
    });
  },

  async listLegal(page = 1, limit = 50) {
    const response = await http.get<BackendResponse<Maintenance[]>>(
      `/mantenimientos/juridicos?page=${page}&limit=${limit}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  createLegal(data: Omit<CreateMaintenanceInput, "physicalClientId">) {
    return http.post<Maintenance>("/mantenimientos/juridicos", {
      date: new Date(),
      description: data.description,
      legalClientId: data.legalClientId,
      maintenanceProducts: data.maintenanceProducts,
    });
  },
};

export async function fetchAllMaintenances(
  page = 1,
  limit = 50,
): Promise<{ data: Maintenance[]; total: number; page: number; limit: number }> {
  const [physical, legal] = await Promise.all([
    mantenimientosApi.listPhysical(page, limit),
    mantenimientosApi.listLegal(page, limit),
  ]);

  const all = [...(physical.data ?? []), ...(legal.data ?? [])];
  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    data: all,
    total: (physical.total ?? 0) + (legal.total ?? 0),
    page,
    limit,
  };
}