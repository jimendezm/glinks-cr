import { type Response, type NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import {
  createLegalClientSchema,
  updateLegalClientSchema,
} from "../validators/cliente.js";
import * as clienteService from "../services/clienteService.js";
import { parsePagination, paramStr, toStr } from "../lib/utils.js";

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { skip: _skip, ...pagination } = parsePagination(req.query as { page?: string; limit?: string });
    const { clients, total } = await clienteService.listLegalClients(pagination.page, pagination.limit);

    res.json({
      success: true,
      data: clients,
      pagination: { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function search(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const name = toStr(req.query.name);
    const legalId = toStr(req.query.legalId);
    const { skip: _skip, ...pagination } = parsePagination(req.query as { page?: string; limit?: string });
    const { clients, total } = await clienteService.searchLegalClients(name, legalId, pagination.page, pagination.limit);

    res.json({
      success: true,
      data: clients,
      pagination: { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    const client = await clienteService.getLegalClientById(id);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createLegalClientSchema.parse(req.body);
    const client = await clienteService.createLegalClient(data);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    const data = updateLegalClientSchema.parse(req.body);
    const client = await clienteService.updateLegalClient(id, data);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = paramStr(req.params.id);
    await clienteService.deleteLegalClient(id);
    res.json({ success: true, message: "Cliente jurídico eliminado correctamente" });
  } catch (err) {
    next(err);
  }
}
