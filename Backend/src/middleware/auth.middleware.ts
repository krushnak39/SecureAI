import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getUserFromSessionToken,
} from "../services/auth.service.js";

const SESSION_COOKIE = "secureai_session";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const user = await getUserFromSessionToken(token);

    if (!user) {
      res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      res.status(401).json({
        success: false,
        message: "Session expired or invalid",
      });

      return;
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    next(error);
  }
}