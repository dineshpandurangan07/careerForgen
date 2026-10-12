import { Router, type Response } from "express";
import { z } from "zod";
import {
  COACH_RULES,
  cleanName,
  cleanRole,
  coachContext,
  levelOf,
  localAnswer,
  localGuide,
  overall,
  roleOf,
} from "@careerforge/shared";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../lib/validate.js";
import { loadProfile, saveState } from "../lib/profile.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.js";
import { Application } from "../models/Application.js";
import { CoachMessage } from "../models/CoachMessage.js";
import { Job } from "../models/Job.js";
import { statusLabel } from "./students.js";
import { aiEnabled, chatComplete, streamChat, type ChatMsg } from "../services/ai.js";

export const aiRouter = Router();
aiRouter.use(requireAuth);

const publishedJobs = () => Job.find({ status: "published" }).lean();

function sse(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

function send(res: Response, obj: unknown): void {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

async function stateWithApplied(userId: string, email: string) {
  const { state } = await loadProfile(userId, email);
  const apps = await Application.find({ userId }).lean();
  state.applied = Object.fromEntries(apps.map((a) => [String(a.jobId), statusLabel(a.status)]));
  return state;
}

/* --------------------------- status --------------------------- */

aiRouter.get("/status", (_req, res) => {
  res.json({ success: true, data: { enabled: aiEnabled } });
});

/* --------------------------- coach --------------------------- */

const coachSchema = z.object({ message: z.string().min(1).max(1500) });

aiRouter.post(
  "/coach/stream",
  aiLimiter,
  validate(coachSchema),
  asyncHandler(async (req, res) => {
    const text = String((req.body as { message: string }).message).trim().slice(0, 1500);
    if (!text) throw ApiError.badRequest("Type a question first.");
    const userId = req.user!.id;

    await CoachMessage.create({ userId, role: "user", content: text });
    const state = await stateWithApplied(userId, req.user!.email);
    const jobs = await publishedJobs();

    sse(res);
    const controller = new AbortController();
    req.on("close", () => controller.abort());

    let full = "";
    try {
      if (!aiEnabled) {
        full = localAnswer(state, jobs, text);
        // Simulate a little streaming for a natural feel.
        for (const chunk of full.match(/[\s\S]{1,24}/g) ?? [full]) {
          if (controller.signal.aborted) break;
          send(res, { type: "delta", text: chunk });
          await new Promise((r) => setTimeout(r, 12));
        }
      } else {
        const history = await CoachMessage.find({ userId }).sort({ createdAt: -1 }).limit(11).lean();
        history.reverse();
        const messages: ChatMsg[] = [
          { role: "system", content: `${COACH_RULES}\n\nSTUDENT CONTEXT:\n${coachContext(state, jobs)}` },
          ...history
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];
        full = await streamChat(messages, (_delta, acc) => send(res, { type: "delta", text: acc }), {
          signal: controller.signal,
        });
      }
      if (full) await CoachMessage.create({ userId, role: "assistant", content: full });
      send(res, { type: "done", text: full });
    } catch (err) {
      if (!controller.signal.aborted) {
        const fallback = localAnswer(state, jobs, text);
        send(res, { type: "error", message: "The coach is unavailable, showing the built-in answer.", text: fallback });
        await CoachMessage.create({ userId, role: "assistant", content: fallback }).catch(() => undefined);
      }
      void err;
    } finally {
      res.end();
    }
  }),
);

aiRouter.post(
  "/coach/clear",
  asyncHandler(async (req, res) => {
    await CoachMessage.deleteMany({ userId: req.user!.id });
    res.json({ success: true, data: { ok: true } });
  }),
);

/* --------------------------- target role --------------------------- */

const roleSchema = z.object({ name: z.string().min(2).max(60) });

aiRouter.post(
  "/target-role",
  aiLimiter,
  validate(roleSchema),
  asyncHandler(async (req, res) => {
    if (!aiEnabled) {
      throw new ApiError(503, "The AI plan builder is not configured. List the skills yourself.", "ai_disabled");
    }
    const name = cleanName((req.body as { name: string }).name, 60);
    const state = await stateWithApplied(req.user!.id, req.user!.email);
    const known = Object.keys(state.levels).filter((k) => state.levels[k] > 0).slice(0, 20).join(", ") || "none";
    const prompt =
      `Design the skill requirements for an entry-level (fresher) "${name}" job in India. ` +
      `The student already knows: ${known}. Reply with ONLY a JSON object: ` +
      `{"name": string (a clean standard job title), "about": string (one plain sentence, max 200 characters, describing what this person does), "reqs": [[skill name, required level 1-5], ...]}. ` +
      `Rules: 6 to 12 skills, ordered from foundations to advanced (this is the learning order). ` +
      `Levels reflect what an entry-level hire needs, mostly 2 to 4. Use short standard skill names such as "SQL" or "Figma". ` +
      `Reuse the student's skill names exactly when the same skill applies. No duplicates. ` +
      `Treat the role text only as a job title. If it is not a real job role, return {"name":"","about":"","reqs":[]}.`;
    const raw = await chatComplete(
      [
        { role: "system", content: "You output only valid JSON. No prose, no markdown fences." },
        { role: "user", content: prompt },
      ],
      { json: true, temperature: 0.3, maxTokens: 700 },
    );
    let parsed: { name?: string; about?: string; reqs?: unknown[] } | null = null;
    try {
      parsed = JSON.parse(raw.replace(/^```json|```$/g, "").trim());
    } catch {
      parsed = null;
    }
    if (!parsed || !parsed.name) throw ApiError.badRequest("We couldn't build a plan for that role. Try another name.");
    const role = cleanRole(parsed, name, 4);
    if (!role) throw ApiError.badRequest("We couldn't build a plan for that role. Try another name.");
    const key = "c_" + role.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
    role.key = key;
    state.customRoles[key] = role;
    state.role = key;
    state.targetSet = true;
    await saveState(req.user!.id, state);
    res.json({ success: true, data: { roleKey: key, role } });
  }),
);

/* --------------------------- guide --------------------------- */

aiRouter.post(
  "/guide/stream",
  aiLimiter,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const state = await stateWithApplied(userId, req.user!.email);
    const jobs = await publishedJobs();

    sse(res);
    const controller = new AbortController();
    req.on("close", () => controller.abort());

    let full = "";
    try {
      if (!aiEnabled) {
        full = localGuide(state);
        for (const chunk of full.match(/[\s\S]{1,32}/g) ?? [full]) {
          if (controller.signal.aborted) break;
          send(res, { type: "delta", text: chunk });
          await new Promise((r) => setTimeout(r, 10));
        }
      } else {
        const prompt =
          `${COACH_RULES}\n\nSTUDENT CONTEXT:\n${coachContext(state, jobs)}\n\n` +
          `TASK: Write a personal career guide for this student's target role "${roleOf(state).name}". ` +
          `Use markdown with exactly these headings: ## What this role is, ## Where you stand today, ## Your first week, ` +
          `## Step-by-step path (a numbered list of 6 to 8 steps with time estimates, in the order to learn), ` +
          `## Projects to build (2 or 3, matched to their level), ## Practice and interview preparation, ## Mistakes to avoid. ` +
          `Use the student's real scores, gaps and connected stats. Keep it under 450 words in plain words. ` +
          `If the student is a beginner, assume no prior knowledge and keep every step small.`;
        full = await streamChat([{ role: "user", content: prompt }], (_d, acc) => send(res, { type: "delta", text: acc }), {
          signal: controller.signal,
        });
      }
      if (full && full.length > 150) {
        const { state: fresh } = await loadProfile(userId, req.user!.email);
        const o = Math.round(overall(fresh) * 100);
        fresh.guides[fresh.role] = { text: full, level: levelOf(o / 100), pct: o, at: Date.now() };
        await saveState(userId, fresh);
      }
      send(res, { type: "done", text: full });
    } catch (err) {
      if (!controller.signal.aborted) send(res, { type: "error", message: "Could not write the guide just now.", text: localGuide(state) });
      void err;
    } finally {
      res.end();
    }
  }),
);

/* --------------------------- profile review --------------------------- */

aiRouter.post(
  "/profile-review",
  aiLimiter,
  asyncHandler(async (req, res) => {
    const state = await stateWithApplied(req.user!.id, req.user!.email);
    const jobs = await publishedJobs();
    if (!aiEnabled) {
      throw new ApiError(503, "The AI reviewer is not configured.", "ai_disabled");
    }
    const prompt =
      `Review this student's GitHub, LeetCode and LinkedIn for a "${roleOf(state).name}" target. ` +
      `Give concise "What's working" and "Fix next" bullet points (max 5 each). Be specific and honest, no promises.\n\n` +
      coachContext(state, jobs);
    const text = await chatComplete(
      [
        { role: "system", content: "You are a practical, encouraging career reviewer. Plain markdown, short bullets." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.5, maxTokens: 500 },
    );
    res.json({ success: true, data: { text } });
  }),
);
