import { type Response, type NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import {
  createPhysicalMaintenanceSchema,
  createLegalMaintenanceSchema,
} from "../validators/mantenimiento.js";
import * as mantenimientoService from "../services/mantenimientoService.js";
import { parsePagination } from "../lib/utils.js";

export async function listPhysical(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { skip: _skip, ...pagination } = parsePagination(req.query as { page?: string; limit?: string });
    const { maintenances, total } = await mantenimientoService.listPhysicalMaintenances(pagination.page, pagination.limit);

    res.json({
      success: true,
      data: maintenances,
      pagination: { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function createPhysical(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createPhysicalMaintenanceSchema.parse(req.body);
    const maintenance = await mantenimientoService.createPhysicalMaintenance(data);
    res.status(201).json({ success: true, data: maintenance });
  } catch (err) {
    next(err);
  }
}

export async function listLegal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { skip: _skip, ...pagination } = parsePagination(req.query as { page?: string; limit?: string });
    const { maintenances, total } = await mantenimientoService.listLegalMaintenances(pagination.page, pagination.limit);

    res.json({
      success: true,
      data: maintenances,
      pagination: { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function createLegal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createLegalMaintenanceSchema.parse(req.body);
    const maintenance = await mantenimientoService.createLegalMaintenance(data);
    res.status(201).json({ success: true, data: maintenance });
  } catch (err) {
    next(err);
  }
}
