import prisma from "../config/database.js";

const maintenanceInclude = {
  responsible: { select: { id: true, username: true, role: true } },
  maintenanceProducts: { include: { product: true } },
  physical_client: true,
  legal_client: true,
} as const;

// ─── Physical Client Maintenances ────────────────────────────────────

export async function listPhysicalMaintenances(page: number, limit: number) {
  const where = { physical_client_id: { not: null } };

  const [maintenances, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      include: maintenanceInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.maintenance.count({ where }),
  ]);

  return { maintenances, total };
}

export async function createPhysicalMaintenance(data: {
  date: Date;
  description: string;
  physicalClientId: string;
  responsibleId: string;
  maintenanceProducts: { amount: number; productId: string }[];
}) {
  return prisma.maintenance.create({
    data: {
      date: data.date,
      description: data.description,
      physical_client_id: data.physicalClientId,
      legal_client_id: null,
      responsible_id: data.responsibleId,
      maintenanceProducts: {
        create: data.maintenanceProducts.map((p) => ({
          amount: p.amount,
          product_id: p.productId,
        })),
      },
    },
    include: maintenanceInclude,
  });
}

// ─── Legal Client Maintenances ───────────────────────────────────────

export async function listLegalMaintenances(page: number, limit: number) {
  const where = { legal_client_id: { not: null } };

  const [maintenances, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      include: maintenanceInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.maintenance.count({ where }),
  ]);

  return { maintenances, total };
}

export async function createLegalMaintenance(data: {
  date: Date;
  description: string;
  legalClientId: string;
  responsibleId: string;
  maintenanceProducts: { amount: number; productId: string }[];
}) {
  return prisma.maintenance.create({
    data: {
      date: data.date,
      description: data.description,
      physical_client_id: null,
      legal_client_id: data.legalClientId,
      responsible_id: data.responsibleId,
      maintenanceProducts: {
        create: data.maintenanceProducts.map((p) => ({
          amount: p.amount,
          product_id: p.productId,
        })),
      },
    },
    include: maintenanceInclude,
  });
}
