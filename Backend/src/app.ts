import "dotenv/config";

import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import githubRoutes from "./routes/github.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import dependencyRoutes from "./routes/dependency.routes.js";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Allow requests without an Origin header.
       *
       * This is useful for direct server/API requests.
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `CORS blocked origin: ${origin}`,
        ),
      );
    },

    credentials: true,

    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  }),
);

app.use(cookieParser());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

/*
 * API routes
 */

app.use(
  "/api/health",
  healthRoutes,
);

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/projects",
  projectRoutes,
);

app.use(
  "/api/github",
  githubRoutes,
);

app.use(
  "/api/analysis",
  analysisRoutes,
);

app.use(
  "/api/projects",
  dependencyRoutes,
);

/*
 * Global error handler
 */

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    if (res.headersSent) {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Internal server error.";

    res.status(500).json({
      success: false,
      message,
    });
  },
);

export default app;