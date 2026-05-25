import prisma from "../config/database.js";

// ─── Physical Clients ────────────────────────────────────────────────

export async function listPhysicalClients(page: number, limit: number) {
  const [clients, total] = await Promise.all([
    prisma.physicalClient.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.physicalClient.count(),
  ]);

  return { clients, total };
}

export async function searchPhysicalClients(
  name: string | undefined,
  nationalId: string | undefined,
  page: number,
  limit: number,
) {
  const where = {
    ...(nationalId ? { national_id: nationalId } : {}),
    ...(name
      ? {
          OR: [
            { name: { contains: name, mode: "insensitive" as const } },
            { last_name_1: { contains: name, mode: "insensitive" as const } },
            { last_name_2: { contains: name, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.physicalClient.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.physicalClient.count({ where }),
  ]);

  return { clients, total };
}

export async function getPhysicalClientById(id: string) {
  const client = await prisma.physicalClient.findUnique({ where: { id } });
  if (!client) {
    throw new Error("Cliente físico no encontrado");
  }
  return client;
}

export async function createPhysicalClient(data: {
  nationalId: string;
  name: string;
  lastName1: string;
  lastName2: string;
  primaryPhone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address: string;
  exonerated: boolean;
}) {
  return prisma.physicalClient.create({
    data: {
      national_id: data.nationalId,
      name: data.name,
      last_name_1: data.lastName1,
      last_name_2: data.lastName2,
      primary_phone: data.primaryPhone,
      secondary_phone: data.secondaryPhone ?? null,
      email: data.email ?? null,
      address: data.address,
      exonerated: data.exonerated,
    },
  });
}

export async function updatePhysicalClient(
  id: string,
  data: {
    nationalId?: string;
    name?: string;
    lastName1?: string;
    lastName2?: string;
    primaryPhone?: string;
    secondaryPhone?: string | null;
    email?: string | null;
    address?: string;
    exonerated?: boolean;
  },
) {
  // Verify the client exists before updating.
  await getPhysicalClientById(id);

  return prisma.physicalClient.update({
    where: { id },
    data: {
      ...(data.nationalId !== undefined && { national_id: data.nationalId }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.lastName1 !== undefined && { last_name_1: data.lastName1 }),
      ...(data.lastName2 !== undefined && { last_name_2: data.lastName2 }),
      ...(data.primaryPhone !== undefined && { primary_phone: data.primaryPhone }),
      ...(data.secondaryPhone !== undefined && { secondary_phone: data.secondaryPhone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.exonerated !== undefined && { exonerated: data.exonerated }),
    },
  });
}

export async function deletePhysicalClient(id: string) {
  // Verify the client exists before deleting.
  await getPhysicalClientById(id);

  return prisma.physicalClient.delete({ where: { id } });
}

// ─── Legal Clients ───────────────────────────────────────────────────

export async function listLegalClients(page: number, limit: number) {
  const [clients, total] = await Promise.all([
    prisma.legalClient.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.legalClient.count(),
  ]);

  return { clients, total };
}

export async function searchLegalClients(
  name: string | undefined,
  legalId: string | undefined,
  page: number,
  limit: number,
) {
  const where = {
    ...(legalId ? { legal_id: legalId } : {}),
    ...(name
      ? { name: { contains: name, mode: "insensitive" as const } }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.legalClient.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.legalClient.count({ where }),
  ]);

  return { clients, total };
}

export async function getLegalClientById(id: string) {
  const client = await prisma.legalClient.findUnique({ where: { id } });
  if (!client) {
    throw new Error("Cliente jurídico no encontrado");
  }
  return client;
}

export async function createLegalClient(data: {
  legalId: string;
  name: string;
  primaryPhone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address: string;
  exonerated: boolean;
}) {
  return prisma.legalClient.create({
    data: {
      legal_id: data.legalId,
      name: data.name,
      primary_phone: data.primaryPhone,
      secondary_phone: data.secondaryPhone ?? null,
      email: data.email ?? null,
      address: data.address,
      exonerated: data.exonerated,
    },
  });
}

export async function updateLegalClient(
  id: string,
  data: {
    legalId?: string;
    name?: string;
    primaryPhone?: string;
    secondaryPhone?: string | null;
    email?: string | null;
    address?: string;
    exonerated?: boolean;
  },
) {
  // Verify the client exists before updating.
  await getLegalClientById(id);

  return prisma.legalClient.update({
    where: { id },
    data: {
      ...(data.legalId !== undefined && { legal_id: data.legalId }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.primaryPhone !== undefined && { primary_phone: data.primaryPhone }),
      ...(data.secondaryPhone !== undefined && { secondary_phone: data.secondaryPhone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.exonerated !== undefined && { exonerated: data.exonerated }),
    },
  });
}

export async function deleteLegalClient(id: string) {
  // Verify the client exists before deleting.
  await getLegalClientById(id);

  return prisma.legalClient.delete({ where: { id } });
}
