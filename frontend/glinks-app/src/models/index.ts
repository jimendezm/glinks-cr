// ═══════════════════════════════════════════════════
// Tipos alineados con el backend (Prisma + Zod)
// ═══════════════════════════════════════════════════

export type Role = "admin" | "tecnico";

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
}

// ─── Clientes ──────────────────────────────────────

export type PlanTipo = "4-4" | "6-6" | "8-8";

export interface ClienteFisico {
  id: string;
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
  createdAt: string;
}

export interface ClienteJuridico {
  id: string;
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
  createdAt: string;
}

/** Cliente unificado para mostrar ambas clases en una misma lista */
export type ClienteUnificado =
  | (ClienteFisico & { tipo: "fisico" })
  | (ClienteJuridico & { tipo: "juridico" });

// ─── Mantenimientos ────────────────────────────────

export interface Mantenimiento {
  id: string;
  descripcion: string;
  fecha: string;
  clienteFisicoId?: string | null;
  clienteJuridicoId?: string | null;
  responsableId: string;
  responsable?: {
    id: string;
    name: string;
    username: string;
  };
}

// ─── Inventario ────────────────────────────────────

export type ProductoTipo =
  | "Router"
  | "PoE"
  | "Tubo metálico"
  | "Antena AP"
  | "Cable"
  | "Otro";

export type ProductoEstado = "disponible" | "en_uso";

export interface Producto {
  id: string;
  nombre: string;
  tipo: ProductoTipo;
  serial: string;
  estado: ProductoEstado;
  stock: number;
  precio: number;
  createdAt?: string;
}

// ─── Facturación ───────────────────────────────────

export interface FacturaItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

export type FacturaEstado = "activa" | "anulada";

export interface Factura {
  id: string;
  numero: string;
  fecha: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: FacturaEstado;
  clienteFisicoId?: string | null;
  clienteJuridicoId?: string | null;
  clienteFisico?: {
    id: string;
    nombre: string;
    cedula: string;
  } | null;
  clienteJuridico?: {
    id: string;
    nombreEmpresa: string;
    cedulaJuridica: string;
  } | null;
  items: FacturaItem[];
}

// ─── API paginación ────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
