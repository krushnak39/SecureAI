import { Router } from "express";

import {
  sendChatMessage,
} from "../controllers/chat.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/projects/:projectId/chat",
  requireAuth,
  sendChatMessage,
);

export default router;