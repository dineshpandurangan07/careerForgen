import { createHash, randomBytes } from "node:crypto";
import { Router, type Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../lib/validate.js";
import { hashPassword, isStrongPassword, verifyPassword } from "../lib/password.js";
import {
  REFRESH_COOKIE,
  signAccess,
  signRefresh,
  signReset,
  verifyRefresh,
  verifyReset,
} from "../lib/jwt.js";
import { User } from "../models/User.js";
import { loadProfile } from "../lib/profile.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { env } from "../env.js";

export const authRouter = Router();

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .refine(isStrongPassword, "Use at least 8 characters with a letter and a number.");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name, 2 to 60 characters.").max(60),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

const MAX_FAILS = 5;
const LOCK_MS = 30_000;

function refreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

function publicUser(u: { _id: unknown; name: string; email: string; role: string }) {
  return { id: String(u._id), name: u.name, email: u.email, role: u.role };
}

async function issueTokens(
  res: Response,
  user: { _id: unknown; role: string; email: string; refreshVersion?: number },
): Promise<string> {
  const tv = user.refreshVersion ?? 0;
  const access = signAccess({ sub: String(user._id), role: user.role, email: user.email });
  const refresh = signRefresh({ sub: String(user._id), tv });
  await User.updateOne({ _id: user._id }, { $set: { refreshTokenHash: sha(refresh) } });
  refreshCookie(res, refresh);
  return access;
}

authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as z.infer<typeof registerSchema>;
    const existing = await User.findOne({ email }).lean();
    if (existing) throw ApiError.conflict("An account with this email already exists. Sign in instead.");
    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash, provider: "password" });
    await loadProfile(String(user._id), email);
    const access = await issueTokens(res, user);
    res.status(201).json({ success: true, data: { user: publicUser(user), accessToken: access } });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email }).select("+passwordHash +refreshVersion +failedLogins +lockedUntil");
    if (!user) {
      // Generic message; do a dummy compare to reduce timing signal.
      await hashPassword(password).catch(() => "");
      throw ApiError.unauthorized("The email or password is incorrect.");
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const secs = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      throw ApiError.tooMany(`Too many attempts. Try again in ${secs} seconds.`, "locked");
    }
    if (!user.passwordHash) {
      throw ApiError.badRequest("This account uses Google. Use Continue with Google instead.");
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      user.failedLogins = (user.failedLogins ?? 0) + 1;
      if (user.failedLogins >= MAX_FAILS) {
        user.failedLogins = 0;
        user.lockedUntil = new Date(Date.now() + LOCK_MS);
      }
      await user.save();
      throw ApiError.unauthorized("The email or password is incorrect.");
    }
    user.failedLogins = 0;
    user.lockedUntil = null;
    await user.save();
    const access = await issueTokens(res, user);
    res.json({ success: true, data: { user: publicUser(user), accessToken: access } });
  }),
);

authRouter.post(
  "/refresh",
  authLimiter,
  asyncHandler(async (req, res) => {
    const token = (req.cookies?.[REFRESH_COOKIE] as string) || "";
    if (!token) throw ApiError.unauthorized("No active session.");
    let payload;
    try {
      payload = verifyRefresh(token);
    } catch {
      clearRefreshCookie(res);
      throw ApiError.unauthorized("Session expired. Sign in again.", "token_expired");
    }
    const user = await User.findById(payload.sub).select("+refreshTokenHash +refreshVersion");
    if (!user || !user.refreshTokenHash || user.refreshTokenHash !== sha(token)) {
      clearRefreshCookie(res);
      throw ApiError.unauthorized("Session is no longer valid.", "token_revoked");
    }
    if (payload.tv !== (user.refreshVersion ?? 0)) {
      clearRefreshCookie(res);
      throw ApiError.unauthorized("Session is no longer valid.", "token_revoked");
    }
    // Rotate.
    user.refreshVersion = (user.refreshVersion ?? 0) + 1;
    await user.save();
    const access = await issueTokens(res, user);
    res.json({ success: true, data: { user: publicUser(user), accessToken: access } });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = (req.cookies?.[REFRESH_COOKIE] as string) || "";
    if (token) {
      try {
        const payload = verifyRefresh(token);
        await User.updateOne({ _id: payload.sub }, { $inc: { refreshVersion: 1 }, $set: { refreshTokenHash: null } });
      } catch {
        /* ignore */
      }
    }
    clearRefreshCookie(res);
    res.json({ success: true, data: { ok: true } });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw ApiError.unauthorized();
    res.json({ success: true, data: { user: publicUser(user) } });
  }),
);

/* --------------------------- Password reset --------------------------- */

authRouter.post(
  "/forgot",
  authLimiter,
  validate(z.object({ email: emailSchema })),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const user = await User.findOne({ email }).select("+passwordHash");
    // Generic response: never reveal whether the account exists.
    let devToken: string | undefined;
    if (user && user.passwordHash) {
      const token = signReset(String(user._id));
      user.resetTokenHash = sha(token);
      user.resetExpires = new Date(Date.now() + 30 * 60_000);
      await user.save();
      if (!env.isProd) devToken = token;
      // In production an email would be sent here (SMTP config from env).
    }
    res.json({
      success: true,
      data: { ok: true, message: "If that email exists, a reset link has been sent.", devToken },
    });
  }),
);

authRouter.post(
  "/reset",
  authLimiter,
  validate(z.object({ token: z.string().min(10), password: passwordSchema })),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };
    let payload;
    try {
      payload = verifyReset(token);
    } catch {
      throw ApiError.badRequest("This reset link is invalid or has expired.");
    }
    const user = await User.findById(payload.sub).select("+resetTokenHash +resetExpires");
    if (!user || !user.resetTokenHash || user.resetTokenHash !== sha(token) || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
      throw ApiError.badRequest("This reset link is invalid or has expired.");
    }
    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = null;
    user.resetExpires = null;
    user.refreshVersion = (user.refreshVersion ?? 0) + 1;
    await user.save();
    res.json({ success: true, data: { ok: true } });
  }),
);

/* --------------------------- Google OAuth --------------------------- */

const googleConfigured = () => !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;

authRouter.get("/google", (req, res) => {
  if (!googleConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Google sign-in is not configured on this server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      errorCode: "google_not_configured",
    });
  }
  const state = randomBytes(16).toString("hex");
  res.cookie("cf_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: env.isProd, maxAge: 600_000 });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

authRouter.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    if (!googleConfigured()) throw ApiError.badRequest("Google sign-in is not configured.");
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state || state !== req.cookies?.cf_oauth_state) {
      throw ApiError.badRequest("Invalid Google sign-in response.");
    }
    res.clearCookie("cf_oauth_state");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw ApiError.badRequest("Google token exchange failed.");
    const tokens = (await tokenRes.json()) as { access_token?: string };
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) throw ApiError.badRequest("Could not read your Google profile.");
    const info = (await infoRes.json()) as { email?: string; name?: string; email_verified?: boolean };
    const email = (info.email || "").toLowerCase();
    if (!email) throw ApiError.badRequest("Your Google account has no email.");

    let user = await User.findOne({ email });
    if (user && user.provider === "password") {
      // Never let Google silently take over a password account.
      return res.redirect(`${env.CLIENT_URL}/?google=link_required`);
    }
    if (!user) {
      user = await User.create({
        email,
        name: info.name || email.split("@")[0],
        provider: "google",
        emailVerified: !!info.email_verified,
      });
      await loadProfile(String(user._id), email);
    }
    await issueTokens(res, user);
    res.redirect(`${env.CLIENT_URL}/?google=ok`);
  }),
);
