import { Router } from "express";

import {
  getProjectFindings,
} from "../controllers/finding.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/:projectId/findings",
  getProjectFindings,
);

export default router;
