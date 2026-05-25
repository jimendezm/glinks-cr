import { z } from "zod";

export const ServiceItemSchema = z.object({
  productId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
})

export const PhysicalItemSchema = z.object({
  productId: z.string().uuid(),
  amount: z.number()
})

export const createInvoiceSchema = z.object({
  physicalClientId: z.string().uuid().optional().nullable(),
  legalClientId: z.string().uuid().optional().nullable(),
  physicalProductItems: z.array(PhysicalItemSchema),
  serviceProductItems: z.array(ServiceItemSchema)
})
