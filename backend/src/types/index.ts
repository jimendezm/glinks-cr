import type { Request } from "express";

export interface JwtPayload {
  userId: string;
  username: string;
  role: "admin" | "tecnico";
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
