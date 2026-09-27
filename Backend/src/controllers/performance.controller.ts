import type {
  Request,
  Response,
} from "express";

import {
  getProjectPerformance,
} from "../services/performance.service.js";

export async function getProjectPerformanceController(
  req: Request,
  res: Response,
) {
  try {
    const userId =
      req.user?.id;

    const projectId =
      String(
        req.params.projectId ?? "",
      );

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        message:
          "Project ID is required.",
      });
    }

    const result =
      await getProjectPerformance(
        projectId,
        userId,
      );

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load performance analysis.";

    if (
      message ===
      "Project not found."
    ) {
      return res.status(404).json({
        message,
      });
    }

    if (
      message ===
      "No repository connected to this project."
    ) {
      return res.status(404).json({
        message,
      });
    }

    console.error(
      "Performance controller error:",
      error,
    );

    return res.status(500).json({
      message,
    });
  }
}
