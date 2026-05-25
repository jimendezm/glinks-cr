import { z } from "zod";

export const ServiceItemSchema = z.object({
  productId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

export const PhysicalItemSchema = z.object({
  productId: z.string().uuid(),
  amount: z.number().int().positive()
})

export const createPhysicalInvoiceSchema = z.object({
  physicalClientId: z.string().uuid(),
  physicalProductItems: z.array(PhysicalItemSchema),
  serviceProductItems: z.array(ServiceItemSchema)
})

export const createLegalInvoiceSchema = z.object({
  legalClientId: z.string().uuid(),
  physicalProductItems: z.array(PhysicalItemSchema),
  serviceProductItems: z.array(ServiceItemSchema)
})
