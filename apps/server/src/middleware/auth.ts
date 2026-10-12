import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import { verifyAccess } from "../lib/jwt.js";
import { User, type UserRole } from "../models/User.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole; email: string; name: string };
    }
  }
}

export const requireAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized("Sign in to continue.");
    let payload;
    try {
      payload = verifyAccess(token);
    } catch {
      throw ApiError.unauthorized("Your session expired. Please sign in again.", "token_expired");
    }
    const user = await User.findById(payload.sub).lean();
    if (!user) throw ApiError.unauthorized("Account not found.");
    req.user = { id: String(user._id), role: user.role as UserRole, email: user.email, name: user.name };
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole =
  (...allowed: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(ApiError.forbidden("You do not have access to this resource."));
    next();
  };
