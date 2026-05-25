import { z } from "zod";

const maintenanceProductSchema = z.object({
  amount: z.number(),
  productId: z.string().uuid()
})

export const createMaintenanceSchema = z.object({
  date: z.date(),
  description: z.string().min(1).max(255),
  physicalClientId: z.string().uuid().optional().nullable(),
  legalClientId: z.string().uuid().optional().nullable(),
  responsibleId: z.string().uuid(),
  maintenanceProducts: z.array(maintenanceProductSchema)
});
