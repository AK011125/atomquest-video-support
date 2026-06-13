import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    message: env.NODE_ENV === "production" ? "Internal server error" : message
  });
}
