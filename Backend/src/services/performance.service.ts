import { prisma } from "../lib/prisma.js";

export async function getProjectPerformance(
  projectId: string,
  userId: string,
) {
  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
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
    throw new Error("Project not found.");
  }

  const repository =
    project.repositories[0];

  if (!repository) {
    throw new Error(
      "No repository connected to this project.",
    );
  }

  const analysis =
    await prisma.analysis.findFirst({
      where: {
        repositoryId:
          repository.id,

        status:
          "COMPLETED",
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        performanceIssues: {
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
    return {
      success: true,

      analysis: null,

      metrics: {
        performanceHealth: null,
        issueCount: 0,
        highSeverityCount: 0,
        mediumSeverityCount: 0,
        lowSeverityCount: 0,
      },

      issues: [],
    };
  }

  const issues =
    analysis.performanceIssues;

  const highSeverityCount =
    issues.filter(
      (issue) =>
        issue.severity === "HIGH" ||
        issue.severity === "CRITICAL",
    ).length;

  const mediumSeverityCount =
    issues.filter(
      (issue) =>
        issue.severity === "MEDIUM",
    ).length;

  const lowSeverityCount =
    issues.filter(
      (issue) =>
        issue.severity === "LOW",
    ).length;

  return {
    success: true,

    analysis: {
      id:
        analysis.id,

      status:
        analysis.status,

      branch:
        analysis.branch,

      commitSha:
        analysis.commitSha,

      filesAnalyzed:
        analysis.filesAnalyzed,

      linesAnalyzed:
        analysis.linesAnalyzed,

      performance:
        analysis.performance,

      completedAt:
        analysis.completedAt,
    },

    metrics: {
      performanceHealth:
        analysis.performance,

      issueCount:
        issues.length,

      highSeverityCount,

      mediumSeverityCount,

      lowSeverityCount,
    },

    issues,
  };
}