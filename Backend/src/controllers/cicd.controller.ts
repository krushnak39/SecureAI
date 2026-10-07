import type { Request, Response } from "express";

import {
  getCICDOverview as getCICDOverviewService,
  syncCICD as syncCICDService,
  triggerCIAnalysis,
} from "../services/cicd.service.js";

function serializeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue,
    ),
  ) as T;
}

export async function getCICDOverview(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== "string" || !projectId) {
      res.status(400).json({
        message: "Project ID is required.",
      });
      return;
    }

    const result = await getCICDOverviewService(projectId);

    res.json(serializeBigInt(result));
  } catch (error) {
    console.error("[CI/CD] Overview error:", error);

    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load CI/CD intelligence.",
    });
  }
}

export async function runCICDSync(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== "string" || !projectId) {
      res.status(400).json({
        message: "Project ID is required.",
      });
      return;
    }

    const result = await syncCICDService(projectId);

    res.json(serializeBigInt(result));
  } catch (error) {
    console.error("[CI/CD] Sync error:", error);

    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to synchronize CI/CD data.",
    });
  }
}

export async function triggerCICDWorkflow(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== "string" || !projectId) {
      res.status(400).json({
        message: "Project ID is required.",
      });
      return;
    }

    const result = await triggerCIAnalysis(projectId);

    res.json(serializeBigInt(result));
  } catch (error) {
    console.error("[CI/CD] Workflow dispatch error:", error);

    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to trigger GitHub Actions workflow.",
    });
  }
}