import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { Job } from "../models/Job.js";

export const jobsRouter = Router();
jobsRouter.use(requireAuth);

const querySchema = z.object({
  q: z.string().optional().default(""),
  mode: z.string().optional().default(""),
  loc: z.string().optional().default(""),
  company: z.string().optional().default(""),
  skill: z.string().optional().default(""),
  sort: z.string().optional().default("deadline"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

jobsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, mode, loc, company, skill, page, limit } = querySchema.parse(req.query);
    const filter: Record<string, unknown> = { status: "published" };
    if (mode && mode !== "All") filter.mode = mode;
    if (loc) filter.loc = { $regex: loc, $options: "i" };
    if (company) filter.co = { $regex: company, $options: "i" };
    if (skill) filter.req = { $regex: skill, $options: "i" };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { co: { $regex: q, $options: "i" } },
        { loc: { $regex: q, $options: "i" } },
        { req: { $regex: q, $options: "i" } },
      ];
    }
    const total = await Job.countDocuments(filter);
    const docs = await Job.find(filter)
      .sort({ id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({
      success: true,
      data: {
        jobs: docs.map((j) => ({
          id: j.id, title: j.title, co: j.co, loc: j.loc, mode: j.mode,
          lpa: j.lpa, min: j.min, req: j.req, pref: j.pref,
        })),
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }),
);

jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await Job.findOne({ id: Number(req.params.id) }).lean();
    if (!job) throw ApiError.notFound("Job not found.");
    res.json({ success: true, data: { job } });
  }),
);
