import { z } from "zod";

const maintenanceProductSchema = z.object({
  amount: z.number().int().positive(),
  productId: z.string().uuid()
})

export const createPhysicalMaintenanceSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1).max(255),
  physicalClientId: z.string().uuid(),
  responsibleId: z.string().uuid(),
  maintenanceProducts: z.array(maintenanceProductSchema)
});

export const createLegalMaintenanceSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1).max(255),
  legalClientId: z.string().uuid(),
  responsibleId: z.string().uuid(),
  maintenanceProducts: z.array(maintenanceProductSchema)
});
