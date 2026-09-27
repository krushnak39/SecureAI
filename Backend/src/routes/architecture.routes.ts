import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getArchitecture } from "../controllers/architecture.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/:projectId/architecture", getArchitecture);

export default router;