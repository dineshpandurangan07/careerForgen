import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { env } from "../env.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: "Route not found", errorCode: "not_found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, message: err.message, errorCode: err.errorCode });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: "Validation failed", errorCode: "validation_error", errors: err.flatten() });
    return;
  }
  const anyErr = err as { code?: number; name?: string; message?: string };
  if (anyErr && anyErr.code === 11000) {
    res.status(409).json({ success: false, message: "That record already exists.", errorCode: "duplicate" });
    return;
  }
  if (anyErr && anyErr.name === "CastError") {
    res.status(400).json({ success: false, message: "Invalid identifier.", errorCode: "bad_id" });
    return;
  }
  console.error("[error]", err);
  res.status(500).json({
    success: false,
    message: env.isProd ? "Something went wrong." : anyErr?.message || "Something went wrong.",
    errorCode: "internal",
  });
}
