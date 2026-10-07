import { Router } from "express";

import {
  getProjectPerformanceController,
} from "../controllers/performance.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router =
  Router();

router.get(
  "/:projectId/performance",
  requireAuth,
  getProjectPerformanceController,
);

export default router;