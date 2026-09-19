import { Router } from "express";

import {
  connectRepositoryController,
  createProjectController,
  deleteProjectController,
  getProjectById,
  getProjects,
  updateProjectController,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getProjects);

router.post(
  "/",
  createProjectController,
);

router.get(
  "/:id",
  getProjectById,
);

router.patch(
  "/:id",
  updateProjectController,
);

router.delete(
  "/:id",
  deleteProjectController,
);

router.post(
  "/:id/repositories",
  connectRepositoryController,
);

export default router;