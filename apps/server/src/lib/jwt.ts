import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export interface AccessPayload {
  sub: string;
  role: string;
  email: string;
}

export interface RefreshPayload {
  sub: string;
  /** refresh token version, bumped on rotate/logout to invalidate old tokens */
  tv: number;
}

const accessOpts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
const refreshOpts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] };

export const signAccess = (p: AccessPayload): string =>
  jwt.sign(p, env.JWT_SECRET, accessOpts);

export const signRefresh = (p: RefreshPayload): string =>
  jwt.sign(p, env.JWT_REFRESH_SECRET, refreshOpts);

export const verifyAccess = (token: string): AccessPayload =>
  jwt.verify(token, env.JWT_SECRET) as AccessPayload;

export const verifyRefresh = (token: string): RefreshPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;

export const REFRESH_COOKIE = "cf_refresh";

export interface ResetPayload {
  sub: string;
  purpose: "reset";
}

export const signReset = (sub: string): string =>
  jwt.sign({ sub, purpose: "reset" } satisfies ResetPayload, env.JWT_SECRET, { expiresIn: "30m" });

export const verifyReset = (token: string): ResetPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET) as ResetPayload;
  if (payload.purpose !== "reset") throw new Error("invalid token purpose");
  return payload;
};
