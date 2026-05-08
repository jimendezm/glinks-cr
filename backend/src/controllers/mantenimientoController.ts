import { type Response, type NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import {
  createMantenimientoFisicoSchema,
  createMantenimientoJuridicoSchema,
} from "../validators/mantenimiento.js";
import * as mantenimientoService from "../services/mantenimientoService.js";
import { ZodError } from "zod";
import { toInt, toStr } from "../lib/utils.js";

export async function listFisicos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 50)));
    const clienteId = toStr(req.query.clienteId);
    const result = await mantenimientoService.listMantenimientosFisicos(clienteId, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createFisico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createMantenimientoFisicoSchema.parse(req.body);
    const mantenimiento = await mantenimientoService.createMantenimientoFisico({
      ...data,
      responsableId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: mantenimiento });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: "Datos inválidos", data: err.errors });
      return;
    }
    next(err);
  }
}

export async function listJuridicos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 50)));
    const clienteId = toStr(req.query.clienteId);
    const result = await mantenimientoService.listMantenimientosJuridicos(clienteId, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createJuridico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createMantenimientoJuridicoSchema.parse(req.body);
    const mantenimiento = await mantenimientoService.createMantenimientoJuridico({
      ...data,
      responsableId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: mantenimiento });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: "Datos inválidos", data: err.errors });
      return;
    }
    next(err);
  }
}
