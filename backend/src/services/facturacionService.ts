import prisma from "../config/database.js";

const invoiceInclude = {
  physicalClient: true,
  legalClient: true,
  serviceProductItems: { include: { product: true } },
  physicalProductItems: { include: { product: true } },
} as const;

// ─── List & Get ──────────────────────────────────────────────────────

export async function listInvoices(page: number, limit: number) {
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      include: invoiceInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.invoice.count(),
  ]);

  return { invoices, total };
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: invoiceInclude,
  });
  if (!invoice) {
    throw new Error("Factura no encontrada");
  }
  return invoice;
}

// ─── Create ──────────────────────────────────────────────────────────

export async function createPhysicalInvoice(data: {
  physicalClientId: string;
  physicalProductItems: { productId: string; amount: number }[];
  serviceProductItems: { productId: string; startDate: Date; endDate: Date }[];
}) {
  return prisma.invoice.create({
    data: {
      physical_client_id: data.physicalClientId,
      legal_client_id: null,
      physicalProductItems: {
        create: data.physicalProductItems.map((item) => ({
          product_id: item.productId,
          amount: item.amount,
        })),
      },
      serviceProductItems: {
        create: data.serviceProductItems.map((item) => ({
          product_id: item.productId,
          start_date: item.startDate,
          end_date: item.endDate,
        })),
      },
    },
    include: invoiceInclude,
  });
}

export async function createLegalInvoice(data: {
  legalClientId: string;
  physicalProductItems: { productId: string; amount: number }[];
  serviceProductItems: { productId: string; startDate: Date; endDate: Date }[];
}) {
  return prisma.invoice.create({
    data: {
      physical_client_id: null,
      legal_client_id: data.legalClientId,
      physicalProductItems: {
        create: data.physicalProductItems.map((item) => ({
          product_id: item.productId,
          amount: item.amount,
        })),
      },
      serviceProductItems: {
        create: data.serviceProductItems.map((item) => ({
          product_id: item.productId,
          start_date: item.startDate,
          end_date: item.endDate,
        })),
      },
    },
    include: invoiceInclude,
  });
}
