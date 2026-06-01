import { http } from "../httpClient";
import type { Invoice } from "@/models";

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

export interface ServiceProductItemInput {
  productId: string;
  startDate: Date;
  endDate: Date;
}

export interface PhysicalProductItemInput {
  productId: string;
  amount: number;
}

export interface CreatePhysicalInvoiceInput {
  physicalClientId: string;
  physicalProductItems: PhysicalProductItemInput[];
  serviceProductItems: ServiceProductItemInput[];
}

export interface CreateLegalInvoiceInput {
  legalClientId: string;
  physicalProductItems: PhysicalProductItemInput[];
  serviceProductItems: ServiceProductItemInput[];
}

export const facturasApi = {
  async list(page = 1, limit = 50) {
    const response = await http.get<BackendResponse<Invoice[]>>(
      `/facturas?page=${page}&limit=${limit}`
    );
    return {
      data: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? page,
      limit: response.pagination?.limit ?? limit,
    };
  },

  getById(id: string) {
    return http.get<Invoice>(`/facturas/${id}`);
  },

  createPhysical(data: CreatePhysicalInvoiceInput) {
    return http.post<Invoice>("/facturas/fisicos", data);
  },

  createLegal(data: CreateLegalInvoiceInput) {
    return http.post<Invoice>("/facturas/juridicos", data);
  },
};

export function calculateInvoiceTotals(invoice: Invoice): {
  subtotal: number;
  total: number;
} {
  let subtotal = 0;

  for (const item of invoice.physicalProductItems ?? []) {
    if (item?.product?.unit_price) {
      subtotal += item.product.unit_price * (item.amount ?? 1);
    }
  }

  for (const item of invoice.serviceProductItems ?? []) {
    if (item?.product?.unit_price) {
      subtotal += item.product.unit_price;
    }
  }

  return { subtotal, total: subtotal };
}