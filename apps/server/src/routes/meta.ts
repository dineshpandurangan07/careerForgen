import { Router } from "express";
import { CATS, DEFAULT_WEIGHTS, LI_CHECKS, ROLES } from "@careerforge/shared";

export const metaRouter = Router();

metaRouter.get("/roles", (_req, res) => {
  res.json({ success: true, data: { roles: ROLES } });
});

metaRouter.get("/categories", (_req, res) => {
  res.json({
    success: true,
    data: { categories: CATS, defaultWeights: DEFAULT_WEIGHTS, linkedinChecks: LI_CHECKS },
  });
});
