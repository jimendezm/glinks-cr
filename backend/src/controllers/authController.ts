import { type Response, type NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import { loginSchema, registerSchema } from "../validators/auth.js";
import * as authService from "../services/authService.js";

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.registerUser(data.username, data.password, data.role);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data.username, data.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response) {
  res.json({
    success: true,
    data: {
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
    },
  });
}
