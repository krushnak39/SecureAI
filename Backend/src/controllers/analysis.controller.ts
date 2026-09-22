import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";

import { getProject } from "../services/project.service.js";

import {
  runRepositoryAnalysis,
} from "../services/analysis.service.js";

type ProjectParams = {
  projectId: string;
};

export async function runProjectAnalysis(
  req: Request<ProjectParams>,
  res: Response,
) {
  const userId =
    req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message:
        "Authentication required",
    });

    return;
  }

  const project =
    await getProject(
      req.params.projectId,
      userId,
    );

  if (!project) {
    res.status(404).json({
      success: false,
      message: "Project not found",
    });

    return;
  }

  if (!project.repository) {
    res.status(400).json({
      success: false,
      message:
        "Connect a GitHub repository before running an analysis.",
    });

    return;
  }

  const activeAnalysis =
    await prisma.analysis.findFirst({
      where: {
        repositoryId:
          project.repository.id,
        status: {
          in: [
            "QUEUED",
            "RUNNING",
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (activeAnalysis) {
    res.status(409).json({
      success: false,
      message:
        "An analysis is already running for this repository.",
      analysis: activeAnalysis,
    });

    return;
  }

  const analysis =
    await prisma.analysis.create({
      data: {
        repositoryId:
          project.repository.id,
        status: "QUEUED",
        trigger: "MANUAL",
        branch:
          project.repository.branch ||
          project.repository.defaultBranch,
      },
    });

  try {
    const result =
      await runRepositoryAnalysis({
        analysisId:
          analysis.id,
        userId,
        repository: {
          id:
            project.repository.id,
          fullName:
            project.repository.fullName,
          externalId:
            project.repository.externalId,
          defaultBranch:
            project.repository
              .defaultBranch,
          branch:
            project.repository.branch,
        },
      });

    res.status(201).json({
      success: true,
      message:
        "Repository analysis completed successfully.",
      analysis:
        result.analysis,
      summary:
        result.summary,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Repository analysis failed.";

    res.status(500).json({
      success: false,
      message,
      analysisId:
        analysis.id,
    });
  }
}
