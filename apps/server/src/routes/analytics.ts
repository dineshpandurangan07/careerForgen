import { Router } from "express";
import { CATS, catScores, gaps, levelOf, overall, roadmap, roleOf } from "@careerforge/shared";
import { asyncHandler } from "../lib/asyncHandler.js";
import { loadProfile } from "../lib/profile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/** Student's own readiness summary, computed server-side. */
analyticsRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const { state } = await loadProfile(req.user!.id, req.user!.email);
    const o = overall(state);
    const cs = catScores(state);
    const gs = gaps(state);
    const rm = roadmap(state).filter((r) => !r.done);
    const applications = await Application.countDocuments({
      userId: req.user!.id,
      status: { $ne: "WITHDRAWN" },
    });
    res.json({
      success: true,
      data: {
        role: roleOf(state).name,
        readiness: Math.round(o * 100),
        level: levelOf(o),
        categories: CATS.map(([k, name]) => ({ key: k, name, score: Math.round(cs[k] * 100), level: levelOf(cs[k]) })),
        skillsAtTarget: gs.filter((g) => g.gap === 0).length,
        skillsTotal: gs.length,
        roadmapStepsLeft: rm.length,
        weeksLeft: rm.reduce((a, x) => a + x.weeks, 0),
        applications,
      },
    });
  }),
);

/** Most requested skills across real postings. */
analyticsRouter.get(
  "/skills",
  asyncHandler(async (_req, res) => {
    const jobs = await Job.find({ status: "published" }).lean();
    const demand: Record<string, { required: number; total: number }> = {};
    for (const j of jobs) {
      j.req.forEach((s) => {
        demand[s] = demand[s] || { required: 0, total: 0 };
        demand[s].required++;
        demand[s].total++;
      });
      j.pref.forEach((s) => {
        demand[s] = demand[s] || { required: 0, total: 0 };
        demand[s].total++;
      });
    }
    const list = Object.entries(demand)
      .map(([skill, d]) => ({ skill, required: d.required, total: d.total, share: d.total / Math.max(1, jobs.length) }))
      .sort((a, b) => b.total - a.total || b.required - a.required);
    res.json({ success: true, data: { openings: jobs.length, skills: list } });
  }),
);

/** Placement-level analytics for officers and admins. */
analyticsRouter.get(
  "/placement",
  requireRole("PLACEMENT_OFFICER", "ADMIN"),
  asyncHandler(async (_req, res) => {
    const [students, applications, jobs, byStatus] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Application.countDocuments(),
      Job.countDocuments({ status: "published" }),
      Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    res.json({
      success: true,
      data: {
        students,
        applications,
        activeJobs: jobs,
        byStatus: Object.fromEntries(byStatus.map((x) => [x._id, x.count])),
      },
    });
  }),
);
