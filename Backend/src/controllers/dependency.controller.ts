import type { Request, Response } from "express";

import {
  listProjectDependencies,
} from "../services/dependency.service.js";

export async function getProjectDependencies(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.id;
    const projectId = String(req.params.projectId ?? "");

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        message: "Project ID is required.",
      });
    }

    const result =
      await listProjectDependencies(
        projectId,
        userId,
      );

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dependencies.";

    if (message === "Project not found.") {
      return res.status(404).json({
        message,
      });
    }

    console.error(
      "Dependency controller error:",
      error,
    );

    return res.status(500).json({
      message,
    });
  }
}