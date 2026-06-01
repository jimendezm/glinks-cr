import type { Product } from "@/models";

// ✅ Como el backend no tiene endpoint de productos, usamos mock data
// Cuando implementes el backend, reemplaza esto

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "MikroTik hAP ac2", type: "Router", description: "Router inalámbrico dual-band", unit_price: 45000, billable: true, createdAt: new Date().toISOString() },
  { id: "2", name: "Ubiquiti PoE Injector", type: "PoE", description: "Inyector PoE 24V", unit_price: 8500, billable: true, createdAt: new Date().toISOString() },
  { id: "3", name: "Ubiquiti LiteAP AC", type: "Antena AP", description: "Antena sectorial 5GHz", unit_price: 120000, billable: true, createdAt: new Date().toISOString() },
  { id: "4", name: "Plan Internet 4-4 Mbps", type: "Otro", description: "Servicio de internet dedicado", unit_price: 35000, billable: false, createdAt: new Date().toISOString() },
  { id: "5", name: "Plan Internet 6-6 Mbps", type: "Otro", description: "Servicio de internet dedicado", unit_price: 45000, billable: false, createdAt: new Date().toISOString() },
  { id: "6", name: "Plan Internet 8-8 Mbps", type: "Otro", description: "Servicio de internet dedicado", unit_price: 55000, billable: false, createdAt: new Date().toISOString() },
  { id: "7", name: "Cable UTP Cat6", type: "Cable", description: "Cable de red Cat6", unit_price: 25000, billable: true, createdAt: new Date().toISOString() },
];

export type CreateProductInput = {
  name: string;
  type: string;
  description: string;
  unit_price: number;
  billable: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export const productosApi = {
  async list(page = 1, limit = 50) {
    // Mock: retornar productos paginados
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: MOCK_PRODUCTS.slice(start, end),
      total: MOCK_PRODUCTS.length,
      page,
      limit,
    };
  },

  getById(id: string) {
    const product = MOCK_PRODUCTS.find(p => p.id === id);
    return Promise.resolve(product || null);
  },

  create(data: CreateProductInput) {
    const newProduct: Product = {
      id: String(MOCK_PRODUCTS.length + 1),
      ...data,
      createdAt: new Date().toISOString()
    };
    MOCK_PRODUCTS.push(newProduct);
    return Promise.resolve(newProduct);
  },

  update(id: string, data: UpdateProductInput) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index !== -1) {
      MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...data };
      return Promise.resolve(MOCK_PRODUCTS[index]);
    }
    return Promise.reject(new Error("Producto no encontrado"));
  },

  remove(id: string) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index !== -1) {
      MOCK_PRODUCTS.splice(index, 1);
      return Promise.resolve({ message: "Producto eliminado" });
    }
    return Promise.reject(new Error("Producto no encontrado"));
  },
};