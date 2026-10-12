import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../lib/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Application, APP_STATUS, type AppStatus } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { statusLabel } from "./students.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

applicationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const apps = await Application.find({ userId: req.user!.id }).sort({ updatedAt: -1 }).lean();
    const jobIds = apps.map((a) => a.jobId);
    const jobs = await Job.find({ id: { $in: jobIds } }).lean();
    const byId = new Map(jobs.map((j) => [j.id, j]));
    res.json({
      success: true,
      data: {
        applications: apps.map((a) => ({
          id: String(a._id),
          jobId: a.jobId,
          status: a.status,
          statusLabel: statusLabel(a.status),
          history: a.history,
          job: byId.get(a.jobId) ?? null,
        })),
      },
    });
  }),
);

applicationsRouter.post(
  "/:jobId/apply",
  asyncHandler(async (req, res) => {
    const jobId = Number(req.params.jobId);
    const job = await Job.findOne({ id: jobId }).lean();
    if (!job) throw ApiError.notFound("Job not found.");
    const existing = await Application.findOne({ userId: req.user!.id, jobId });
    if (existing && existing.status !== "WITHDRAWN") {
      throw ApiError.conflict("You have already applied to this job.");
    }
    if (existing) {
      existing.status = "APPLIED";
      existing.history.push({ status: "APPLIED", at: new Date() });
      await existing.save();
    } else {
      await Application.create({ userId: req.user!.id, jobId, status: "APPLIED", history: [{ status: "APPLIED", at: new Date() }] });
    }
    res.status(201).json({ success: true, data: { jobId, status: "APPLIED", statusLabel: statusLabel("APPLIED") } });
  }),
);

applicationsRouter.post(
  "/:jobId/withdraw",
  asyncHandler(async (req, res) => {
    const jobId = Number(req.params.jobId);
    const app = await Application.findOne({ userId: req.user!.id, jobId });
    if (!app) throw ApiError.notFound("No application found.");
    app.status = "WITHDRAWN";
    app.history.push({ status: "WITHDRAWN", at: new Date() });
    await app.save();
    res.json({ success: true, data: { jobId, status: "WITHDRAWN", statusLabel: statusLabel("WITHDRAWN") } });
  }),
);

const statusSchema = z.object({ status: z.enum(APP_STATUS) });

applicationsRouter.put(
  "/:id/status",
  requireRole("RECRUITER", "PLACEMENT_OFFICER", "ADMIN"),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: AppStatus };
    const app = await Application.findById(req.params.id);
    if (!app) throw ApiError.notFound("Application not found.");
    app.status = status;
    app.history.push({ status, at: new Date() });
    await app.save();
    res.json({ success: true, data: { id: String(app._id), status: app.status, history: app.history } });
  }),
);
