import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "./ApiError.js";

type Source = "body" | "query" | "params";

/** Validates a request part against a Zod schema and replaces it with the parsed value. */
export function validate(schema: ZodSchema, source: Source = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.errors[0];
        const path = first?.path.join(".") || "field";
        return next(ApiError.badRequest(`${path}: ${first?.message ?? "invalid"}`, "validation_error"));
      }
      next(err);
    }
  };
}
