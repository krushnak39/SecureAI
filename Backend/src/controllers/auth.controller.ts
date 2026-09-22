import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  authenticateGithubUser,
  authenticateGoogleUser,
  authenticateUser,
  createSession,
  deleteSession,
  getGithubAuthorizationUrl,
  getGoogleAuthorizationUrl,
  getUserFromSessionToken,
  registerUser,
} from "../services/auth.service.js";

import {
  loginSchema,
  registerSchema,
} from "../utils/auth.validation.js";

const SESSION_COOKIE = "secureai_session";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure:
    process.env.NODE_ENV === "production",
  maxAge:
    7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const clearSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure:
    process.env.NODE_ENV === "production",
  path: "/",
};

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result =
      registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message ??
          "Invalid input",
      });

      return;
    }

    const user = await registerUser(
      result.data.name,
      result.data.email,
      result.data.password,
    );

    const session =
      await createSession(user.id);

    res.cookie(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions,
    );

    res.status(201).json({
      success: true,
      message:
        "Account created successfully",
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "An account with this email already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });

      return;
    }

    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result =
      loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message ??
          "Invalid input",
      });

      return;
    }

    const user = await authenticateUser(
      result.data.email,
      result.data.password,
    );

    const session =
      await createSession(user.id);

    res.cookie(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions,
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "Invalid email or password"
    ) {
      res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });

      return;
    }

    next(error);
  }
}

/**
 * Start Google OAuth flow.
 */
export function googleLogin(
  _req: Request,
  res: Response,
) {
  const authorizationUrl =
    getGoogleAuthorizationUrl();

  res.redirect(authorizationUrl);
}

/**
 * Handle Google's OAuth callback.
 */
export async function googleCallback(
  req: Request,
  res: Response,
) {
  try {
    const { code, error } =
      req.query;

    if (error) {
      res.redirect(
        `${FRONTEND_URL}/login?oauthError=google_denied`,
      );

      return;
    }

    if (
      typeof code !== "string" ||
      !code
    ) {
      res.redirect(
        `${FRONTEND_URL}/login?oauthError=missing_code`,
      );

      return;
    }

    const { user } =
      await authenticateGoogleUser(
        code,
      );

    const session =
      await createSession(user.id);

    res.cookie(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions,
    );

    res.redirect(
      `${FRONTEND_URL}/dashboard`,
    );
  } catch (error) {
    console.error(
      "Google OAuth callback error:",
      error,
    );

    res.redirect(
      `${FRONTEND_URL}/login?oauthError=google_failed`,
    );
  }
}

/**
 * Start GitHub OAuth flow.
 */
export function githubLogin(
  _req: Request,
  res: Response,
) {
  const authorizationUrl =
    getGithubAuthorizationUrl();

  res.redirect(authorizationUrl);
}

/**
 * Handle GitHub's OAuth callback.
 */
export async function githubCallback(
  req: Request,
  res: Response,
) {
  try {
    const { code, error } =
      req.query;

    if (error) {
      res.redirect(
        `${FRONTEND_URL}/login?oauthError=github_denied`,
      );

      return;
    }

    if (
      typeof code !== "string" ||
      !code
    ) {
      res.redirect(
        `${FRONTEND_URL}/login?oauthError=github_missing_code`,
      );

      return;
    }

    const { user } =
      await authenticateGithubUser(
        code,
      );

    const session =
      await createSession(user.id);

    res.cookie(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions,
    );

    res.redirect(
      `${FRONTEND_URL}/dashboard`,
    );
  } catch (error) {
    console.error(
      "GitHub OAuth callback error:",
      error,
    );

    res.redirect(
      `${FRONTEND_URL}/login?oauthError=github_failed`,
    );
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.[SESSION_COOKIE];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });

      return;
    }

    const user =
      await getUserFromSessionToken(
        token,
      );

    if (!user) {
      res.clearCookie(
        SESSION_COOKIE,
        clearSessionCookieOptions,
      );

      res.status(401).json({
        success: false,
        message:
          "Session expired or invalid",
      });

      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.[SESSION_COOKIE];

    if (token) {
      await deleteSession(token);
    }

    res.clearCookie(
      SESSION_COOKIE,
      clearSessionCookieOptions,
    );

    res.status(200).json({
      success: true,
      message:
        "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}