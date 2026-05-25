import { z } from "zod";

const nationalIdRegex = /^[1-9][0-9]{6}$/;
const legalIdRegex = /^[1-9][0-9]{9}$/;
const phoneRegex = /^[2-8][0-9]{7}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createPhysicalClientSchema = z.object({
  nationalId: z.string().regex(nationalIdRegex, "Debe introducir la cédula en formato de 7 dígitos."),
  name: z.string().min(1).max(50),
  lastName1: z.string().min(1).max(50),
  lastName2: z.string().min(1).max(50),
  primaryPhone: z.string().regex(phoneRegex, "El número telefónico es inválido."),
  secondaryPhone: z.string().regex(phoneRegex, "El número telefónico es inválido.").optional().nullable(),
  email: z.string().regex(emailRegex, "El correo electrónico es inválido.").optional().nullable(),
  address: z.string().min(1).max(255),
  exonerated: z.boolean()
});

export const createLegalClientSchema = z.object({
  legalId: z.string().regex(legalIdRegex, "Debe introducir la cédula en formato de 10 dígitos."),
  name: z.string().min(1).max(50),
  primaryPhone: z.string().regex(phoneRegex, "El número telefónico es inválido."),
  secondaryPhone: z.string().regex(phoneRegex, "El número telefónico es inválido.").optional().nullable(),
  email: z.string().regex(emailRegex, "El correo electrónico es inválido.").optional().nullable(),
  address: z.string().min(1).max(255),
  exonerated: z.boolean()
});

export const updatePhysicalClientSchema = createPhysicalClientSchema.partial();

export const updateLegalClientSchema = createLegalClientSchema.partial();
