import { Router } from "express";

import {
  getProjectDependencies,
} from "../controllers/dependency.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/projects/:projectId/dependencies",
  requireAuth,
  getProjectDependencies,
);

export default router;