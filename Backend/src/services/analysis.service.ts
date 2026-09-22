import { prisma } from "../lib/prisma.js";

import {
  getInstallationAccessToken,
  getRepositoryInstallation,
  getValidGitHubAccount,
  getGitHubBranchCommit,
  downloadGitHubRepositoryArchive,
} from "./github.service.js";

import {
  analyzeRepositoryFiles,
  extractAnalyzableRepositoryFiles,
  type RepositoryAnalysisSummary,
} from "./repository-analyzer.service.js";

import {
  scanRepositorySecurity,
  type SecurityScanResult,
} from "./security-scanner.service.js";

import {
  analyzeRepositoryDependencies,
  type DependencyAnalysisSummary,
} from "./dependency-analyzer.service.js";

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

  security: SecurityScanResult;

  dependencies: DependencyAnalysisSummary;
}

function getErrorMessage(error: unknown) {
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
    const account = await getValidGitHubAccount(userId);

    if (!account?.accessToken) {
      throw new Error(
        "GitHub is not connected. Please reconnect GitHub.",
      );
    }

    /*
     * The GitHub OAuth token is used only
     * for the user's GitHub identity.
     *
     * The GitHub App installation is resolved
     * directly from the repository using the
     * GitHub App JWT.
     *
     * This avoids the incorrect:
     *
     * /user/installations
     *
     * request with an OAuth App token.
     */
    let installation;

    try {
      installation =
        await getRepositoryInstallation(
          repository.fullName,
        );
    } catch {
      throw new Error(
        "SecureAI GitHub App installation was not found for this repository.",
      );
    }

    if (!installation) {
      throw new Error(
        "SecureAI GitHub App installation was not found for this repository.",
      );
    }

    const numericRepositoryId =
      repository.externalId
        ? Number(repository.externalId)
        : NaN;

    const installationToken =
      await getInstallationAccessToken(
        installation.id,
        Number.isInteger(numericRepositoryId)
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

    /*
     * Extract the repository once.
     *
     * The same extracted file set is then
     * passed to:
     *
     * - repository analyzer
     * - security scanner
     * - dependency analyzer
     */
    const extracted =
      extractAnalyzableRepositoryFiles(
        archive,
      );

    const summary =
      analyzeRepositoryFiles(
        extracted.files,
        extracted.skippedFiles,
        extracted.archiveBytes,
      );

    /*
     * Security Intelligence
     */
    const security =
      scanRepositorySecurity(
        extracted.files,
      );

    /*
     * Dependency Intelligence
     *
     * Detects dependency manifests such as:
     *
     * - package.json
     * - requirements.txt
     * - pom.xml
     *
     * The first layer performs inventory only.
     * Advisory/latest-version intelligence will
     * be added as a separate layer.
     */
    const dependencyResult =
      analyzeRepositoryDependencies(
        extracted.files,
      );

    /*
     * Replace the repository's dependency
     * inventory with the latest analysis result.
     *
     * This prevents duplicate dependency rows
     * every time an analysis is rerun.
     */
    await prisma.dependency.deleteMany({
      where: {
        repositoryId: repository.id,
      },
    });

    if (
      dependencyResult.dependencies.length > 0
    ) {
      await prisma.dependency.createMany({
        data: dependencyResult.dependencies.map(
          (dependency) => ({
            repositoryId: repository.id,

            name: dependency.name,
            ecosystem: dependency.ecosystem,
            type: dependency.type,

            currentVersion:
              dependency.currentVersion,

            latestVersion:
              dependency.latestVersion,

            status: dependency.status,

            severity:
              dependency.severity,

            advisoryId:
              dependency.advisoryId,

            advisory:
              dependency.advisory,

            description:
              dependency.description,

            impact:
              dependency.impact,

            recommendation:
              dependency.recommendation,

            files:
              dependency.files,

            dependents:
              dependency.dependents,
          }),
        ),
      });
    }

    /*
     * Persist security findings.
     */
    if (security.findings.length > 0) {
      await prisma.finding.createMany({
        data: security.findings.map(
          (finding) => ({
            analysisId,

            severity:
              finding.severity,

            status:
              "OPEN" as const,

            category:
              "SECURITY" as const,

            title:
              finding.title,

            description:
              finding.description,

            impact:
              finding.impact,

            recommendation:
              finding.recommendation,

            filePath:
              finding.filePath,

            lineStart:
              finding.lineStart,

            lineEnd:
              finding.lineEnd,

            rule:
              finding.rule,

            scanner:
              finding.scanner,

            evidence:
              finding.evidence,

            confidence:
              finding.confidence,
          }),
        ),
      });
    }

    const completedAt =
      new Date();

    const updatedAnalysis =
      await prisma.analysis.update({
        where: {
          id: analysisId,
        },

        data: {
          status:
            "COMPLETED",

          branch,

          commitSha:
            branchData.commit.sha,

          filesAnalyzed:
            summary.filesAnalyzed,

          linesAnalyzed:
            summary.linesAnalyzed,

          securityScore:
            security.securityScore,

          completedAt,

          errorMessage:
            null,
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
      analysis:
        updatedAnalysis,

      summary,

      security,

      dependencies:
        dependencyResult.summary,
    };
  } catch (error) {
    const message =
      getErrorMessage(error);

    await prisma.analysis.update({
      where: {
        id: analysisId,
      },

      data: {
        status:
          "FAILED",

        completedAt:
          new Date(),

        errorMessage:
          message.slice(0, 2000),
      },
    });

    throw error;
  }
}