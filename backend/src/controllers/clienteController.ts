import { type Response, type NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import {
  createClienteFisicoSchema,
  updateClienteFisicoSchema,
  createClienteJuridicoSchema,
  updateClienteJuridicoSchema,
} from "../validators/cliente.js";
import * as clienteService from "../services/clienteService.js";
import { ZodError } from "zod";
import { toInt, toStr, paramStr } from "../lib/utils.js";

export async function listFisicos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 50)));
    const result = await clienteService.listClientesFisicos(page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getFisico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cliente = await clienteService.getClienteFisico(paramStr(req.params.id));
    if (!cliente) {
      res.status(404).json({ success: false, error: "Cliente no encontrado" });
      return;
    }
    res.json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function createFisico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createClienteFisicoSchema.parse(req.body);
    const cliente = await clienteService.createClienteFisico(data);
    res.status(201).json({ success: true, data: cliente });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: "Datos inválidos", data: err.errors });
      return;
    }
    next(err);
  }
}

export async function updateFisico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateClienteFisicoSchema.parse(req.body);
    const cliente = await clienteService.updateClienteFisico(paramStr(req.params.id), data);
    res.json({ success: true, data: cliente });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: "Datos inválidos", data: err.errors });
      return;
    }
    next(err);
  }
}

export async function deleteFisico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cliente = await clienteService.deleteClienteFisico(paramStr(req.params.id));
    if (!cliente) {
      res.status(404).json({ success: false, error: "Cliente no encontrado" });
      return;
    }
    res.json({ success: true, message: "Cliente eliminado correctamente" });
  } catch (err) {
    next(err);
  }
}

export async function searchFisicos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      nombre: toStr(req.query.nombre),
      cedula: toStr(req.query.cedula),
      sectorial: toStr(req.query.sectorial),
    };
    const results = await clienteService.searchClientesFisicos(filters);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function listJuridicos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 50)));
    const result = await clienteService.listClientesJuridicos(page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getJuridico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cliente = await clienteService.getClienteJuridico(paramStr(req.params.id));
    if (!cliente) {
      res.status(404).json({ success: false, error: "Cliente no encontrado" });
      return;
    }
    res.json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function createJuridico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createClienteJuridicoSchema.parse(req.body);
    const cliente = await clienteService.createClienteJuridico(data);
    res.status(201).json({ success: true, data: cliente });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: "Datos inválidos", data: err.errors });
      return;
    }
    next(err);
  }
}

export async function updateJuridico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateClienteJuridicoSchema.parse(req.body);
    const cliente = await clienteService.updateClienteJuridico(paramStr(req.params.id), data);
    res.json({ success: true, data: cliente });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, error: "Datos inválidos", data: err.errors });
      return;
    }
    next(err);
  }
}

export async function deleteJuridico(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cliente = await clienteService.deleteClienteJuridico(paramStr(req.params.id));
    if (!cliente) {
      res.status(404).json({ success: false, error: "Cliente no encontrado" });
      return;
    }
    res.json({ success: true, message: "Cliente eliminado correctamente" });
  } catch (err) {
    next(err);
  }
}

export async function searchJuridicos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      nombreEmpresa: toStr(req.query.nombreEmpresa),
      cedulaJuridica: toStr(req.query.cedulaJuridica),
      sectorial: toStr(req.query.sectorial),
    };
    const results = await clienteService.searchClientesJuridicos(filters);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}
