import { Router } from "express";
import { z } from "zod";
import { DEMO_LEVELS, DEMO_PROF, DEMO_PROJECTS, blank } from "@careerforge/shared";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../lib/validate.js";
import { loadProfile, saveState } from "../lib/profile.js";
import { sanitizeState } from "../lib/sanitize.js";
import { Application } from "../models/Application.js";
import { CoachMessage } from "../models/CoachMessage.js";

export const studentsRouter = Router();
studentsRouter.use(requireAuth);

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    APPLIED: "Applied",
    UNDER_REVIEW: "Under review",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview scheduled",
    SELECTED: "Selected",
    REJECTED: "Not selected",
    WITHDRAWN: "Withdrawn",
  };
  return map[s] ?? s;
}

async function hydrate(userId: string, email: string) {
  const { state } = await loadProfile(userId, email);
  const apps = await Application.find({ userId }).lean();
  state.applied = Object.fromEntries(apps.map((a) => [String(a.jobId), statusLabel(a.status)]));
  const msgs = await CoachMessage.find({ userId }).sort({ createdAt: 1 }).limit(40).lean();
  state.chat = msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  return state;
}

studentsRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const state = await hydrate(req.user!.id, req.user!.email);
    res.json({ success: true, data: { state } });
  }),
);

const stateBody = z.object({}).passthrough();

studentsRouter.put(
  "/profile",
  validate(stateBody),
  asyncHandler(async (req, res) => {
    const clean = sanitizeState(req.body, req.user!.email);
    await saveState(req.user!.id, clean);
    const state = await hydrate(req.user!.id, req.user!.email);
    res.json({ success: true, data: { state } });
  }),
);

studentsRouter.put(
  "/connections",
  validate(z.object({ connect: z.record(z.any()) })),
  asyncHandler(async (req, res) => {
    const { state } = await loadProfile(req.user!.id, req.user!.email);
    const clean = sanitizeState({ ...state, connect: req.body.connect }, req.user!.email);
    await saveState(req.user!.id, clean);
    const fresh = await hydrate(req.user!.id, req.user!.email);
    res.json({ success: true, data: { state: fresh } });
  }),
);

studentsRouter.post(
  "/reset",
  asyncHandler(async (req, res) => {
    await saveState(req.user!.id, blank(req.user!.email));
    await Application.deleteMany({ userId: req.user!.id });
    await CoachMessage.deleteMany({ userId: req.user!.id });
    const state = await hydrate(req.user!.id, req.user!.email);
    res.json({ success: true, data: { state } });
  }),
);

studentsRouter.post(
  "/sample",
  asyncHandler(async (req, res) => {
    const { state } = await loadProfile(req.user!.id, req.user!.email);
    state.levels = { ...DEMO_LEVELS };
    state.prof = { ...DEMO_PROF };
    state.projects = DEMO_PROJECTS.map((p) => ({ name: p.name, tech: [...p.tech] }));
    state.targetSet = true;
    await saveState(req.user!.id, state);
    const fresh = await hydrate(req.user!.id, req.user!.email);
    res.json({ success: true, data: { state: fresh } });
  }),
);
