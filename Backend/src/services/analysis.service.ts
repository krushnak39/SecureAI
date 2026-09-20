import { prisma } from "../lib/prisma.js";

import {
  findSecureAIInstallation,
  getInstallationAccessToken,
  getValidGitHubAccount,
  getGitHubBranchCommit,
  downloadGitHubRepositoryArchive,
} from "./github.service.js";

import {
  analyzeRepositoryArchive,
  type RepositoryAnalysisSummary,
} from "./repository-analyzer.service.js";

interface RepositoryInput {
  id: string;
  fullName: string;
  externalId: string | null;
  defaultBranch: string;
  branch: string | null;
}

interface RunRepositoryAnalysisInput {
  analysisId: string;
  userId: string;
  repository: RepositoryInput;
}

interface RunRepositoryAnalysisResult {
  analysis: {
    id: string;
    status: string;
    trigger: string;
    branch: string | null;
    commitSha: string | null;
    filesAnalyzed: number;
    linesAnalyzed: number;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    healthScore: number | null;
    codeQuality: number | null;
    securityScore: number | null;
    performance: number | null;
    architecture: number | null;
    maintainability: number | null;
    errorMessage: string | null;
  };
  summary: RepositoryAnalysisSummary;
}

function getErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Repository analysis failed.";
}

export async function runRepositoryAnalysis(
  input: RunRepositoryAnalysisInput,
): Promise<RunRepositoryAnalysisResult> {
  const {
    analysisId,
    userId,
    repository,
  } = input;

  await prisma.analysis.update({
    where: {
      id: analysisId,
    },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const account =
      await getValidGitHubAccount(
        userId,
      );

    if (!account?.accessToken) {
      throw new Error(
        "GitHub is not connected. Please reconnect GitHub.",
      );
    }

    const installation =
      await findSecureAIInstallation(
        account.accessToken,
      );

    if (!installation) {
      throw new Error(
        "SecureAI GitHub App installation was not found.",
      );
    }

    const numericRepositoryId =
      repository.externalId
        ? Number(repository.externalId)
        : NaN;

    const installationToken =
      await getInstallationAccessToken(
        installation.id,
        Number.isInteger(
          numericRepositoryId,
        )
          ? [numericRepositoryId]
          : undefined,
      );

    const branch =
      repository.branch ||
      repository.defaultBranch ||
      "main";

    const branchData =
      await getGitHubBranchCommit(
        installationToken.token,
        repository.fullName,
        branch,
      );

    const archive =
      await downloadGitHubRepositoryArchive(
        installationToken.token,
        repository.fullName,
        branch,
      );

    const summary =
      analyzeRepositoryArchive(
        archive,
      );

    const completedAt =
      new Date();

    const updatedAnalysis =
      await prisma.analysis.update({
        where: {
          id: analysisId,
        },
        data: {
          status: "COMPLETED",
          branch,
          commitSha:
            branchData.commit.sha,
          filesAnalyzed:
            summary.filesAnalyzed,
          linesAnalyzed:
            summary.linesAnalyzed,
          completedAt,
          errorMessage: null,
        },
      });

    await prisma.repository.update({
      where: {
        id: repository.id,
      },
      data: {
        branch,
        lastAnalyzed:
          completedAt,
      },
    });

    return {
      analysis: updatedAnalysis,
      summary,
    };
  } catch (error) {
    const message =
      getErrorMessage(error);

    await prisma.analysis.update({
      where: {
        id: analysisId,
      },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage:
          message.slice(0, 2000),
      },
    });

    throw error;
  }
}