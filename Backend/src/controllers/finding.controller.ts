import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../lib/prisma.js";

type FindingParams = {
  projectId: string;
};

function getAuthenticatedUserId(
  req: Request,
): string | null {
  return req.userId ?? null;
}

export async function getProjectFindings(
  req: Request<FindingParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.projectId,
        ownerId: userId,
      },
      include: {
        repositories: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    const repository = project.repositories[0];

    if (!repository) {
      res.status(404).json({
        success: false,
        message:
          "No repository connected to this project",
      });

      return;
    }

    const analysis =
      await prisma.analysis.findFirst({
        where: {
          repositoryId: repository.id,
          status: "COMPLETED",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          findings: {
            orderBy: [
              {
                severity: "asc",
              },
              {
                createdAt: "desc",
              },
            ],
          },
        },
      });

    if (!analysis) {
      res.status(200).json({
        success: true,
        analysis: null,
        findings: [],
      });

      return;
    }

    res.status(200).json({
      success: true,

      analysis: {
        id: analysis.id,
        status: analysis.status,
        filesAnalyzed: analysis.filesAnalyzed,
        linesAnalyzed: analysis.linesAnalyzed,

        codeQuality: analysis.codeQuality,
        securityScore: analysis.securityScore,
        performance: analysis.performance,
        architecture: analysis.architecture,
        maintainability:
          analysis.maintainability,
        healthScore: analysis.healthScore,

        completedAt: analysis.completedAt,
      },

      findings: analysis.findings,
    });
  } catch (error) {
    next(error);
  }
}