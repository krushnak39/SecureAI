import { Router } from "express";

import {
  githubCallback,
  githubLogin,
  googleCallback,
  googleLogin,
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/google", googleLogin);

router.get(
  "/google/callback",
  googleCallback,
);

router.get("/github", githubLogin);

router.get(
  "/github/callback",
  githubCallback,
);

router.get("/me", me);

router.post("/logout", logout);

export default router;