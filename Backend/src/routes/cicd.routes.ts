import { Router } from "express";

import {
  getCICDOverview,
  runCICDSync,
  triggerCICDWorkflow,
} from "../controllers/cicd.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/projects/:projectId/cicd",
  requireAuth,
  getCICDOverview,
);

router.post(
  "/projects/:projectId/cicd/sync",
  requireAuth,
  runCICDSync,
);

router.post(
  "/projects/:projectId/cicd/run",
  requireAuth,
  triggerCICDWorkflow,
);

export default router;
