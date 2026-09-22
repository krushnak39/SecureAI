import { Router } from "express";

import {
  runProjectAnalysis,
} from "../controllers/analysis.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/projects/:projectId/analyze",
  requireAuth,
  runProjectAnalysis,
);

export default router;