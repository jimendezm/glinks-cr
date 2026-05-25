import { type Response, type NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import {
  createPhysicalInvoiceSchema,
  createLegalInvoiceSchema,
} from "../validators/facturacion.js";
import * as facturacionService from "../services/facturacionService.js";
import { parsePagination, paramStr } from "../lib/utils.js";

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { skip: _skip, ...pagination } = parsePagination(req.query as { page?: string; limit?: string });
    const { invoices, total } = await facturacionService.listInvoices(pagination.page, pagination.limit);

    res.json({
      success: true,
      data: invoices,
      pagination: { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    const invoice = await facturacionService.getInvoiceById(id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function createPhysical(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createPhysicalInvoiceSchema.parse(req.body);
    const invoice = await facturacionService.createPhysicalInvoice(data);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function createLegal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createLegalInvoiceSchema.parse(req.body);
    const invoice = await facturacionService.createLegalInvoice(data);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}
