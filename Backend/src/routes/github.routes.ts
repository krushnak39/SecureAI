import { Router } from "express";

import {
  connectGitHub,
  connectGitHubRepository,
  getGitHubRepositories,
  githubCallback,
  githubStatus,
} from "../controllers/github.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/connect",
  requireAuth,
  connectGitHub,
);

router.get(
  "/callback",
  requireAuth,
  githubCallback,
);

router.get(
  "/status",
  requireAuth,
  githubStatus,
);

router.get(
  "/repositories",
  requireAuth,
  getGitHubRepositories,
);

router.post(
  "/projects/:projectId/repositories",
  requireAuth,
  connectGitHubRepository,
);

export default router;