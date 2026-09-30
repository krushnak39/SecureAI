import {
  enrichDependenciesWithIntelligence,
} from "./dependency-intelligence.service.js";

import {
  analyzeRepositoryPerformance,
  type PerformanceAnalysisResult,
} from "./performance-analyzer.service.js";

import {
  reviewRepositoryCode,
} from "./code-review.service.js";

import {
  reviewFindingWithAI,
} from "./ai-code-review.service.js";

import {
  enrichDependenciesWithVulnerabilities,
} from "./vulnerability-intelligence.service.js";

import {
  understandRepositoryCode,
} from "./code-understanding.service.js";

import { prisma } from "../lib/prisma.js";

import {
  CodeChunkLanguage,
  FindingCategory,
} from "../generated/prisma/enums.js";

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

import {
  analyzeArchitecture,
  type ArchitectureAnalysisResult,
} from "./architecture-analyzer.service.js";

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

  performance: PerformanceAnalysisResult;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Repository analysis failed.";
}

/**
 * Extract a focused section of source code around a finding.
 *
 * We intentionally do not send the entire repository file
 * to the local LLM. A bounded context keeps AI requests
 * smaller and faster while still giving Qwen enough context.
 */
function getRelevantCodeContext(
  content: string,
  lineStart: number,
  lineEnd: number,
): string {
  const lines = content.split(/\r?\n/);

  const contextBefore = 8;
  const contextAfter = 16;

  const startIndex = Math.max(
    0,
    lineStart - 1 - contextBefore,
  );

  const endIndex = Math.min(
    lines.length,
    Math.max(lineEnd, lineStart) + contextAfter,
  );

  return lines
    .slice(startIndex, endIndex)
    .map(
      (line, index) =>
        `${startIndex + index + 1}: ${line}`,
    )
    .join("\n");
}

/**
 * Convert the code-review category into the Prisma
 * FindingCategory enum.
 */
function getFindingCategory(
  category: string,
): FindingCategory {
  if (category === "CODE_QUALITY") {
    return FindingCategory.CODE_QUALITY;
  }

  if (category === "PERFORMANCE") {
    return FindingCategory.PERFORMANCE;
  }

  return FindingCategory.MAINTAINABILITY;
}

/**
 * Convert architecture component health into
 * a numeric component health value.
 */
function getArchitectureComponentHealth(
  health: string,
): number {
  switch (health) {
    case "healthy":
      return 100;

    case "warning":
      return 70;

    case "risk":
      return 40;

    default:
      return 100;
  }
}

/**
 * Convert the language reported by the repository
 * analyzer into the Prisma CodeChunkLanguage enum.
 *
 * The Code Understanding Engine works with string
 * language names, while the database uses a strict
 * Prisma enum.
 */
function mapCodeChunkLanguage(
  language: string,
): CodeChunkLanguage {
  const normalized =
    language.trim().toLowerCase();

  switch (normalized) {
    case "typescript":
    case "tsx":
      return CodeChunkLanguage.TYPESCRIPT;

    case "javascript":
    case "jsx":
      return CodeChunkLanguage.JAVASCRIPT;

    case "python":
      return CodeChunkLanguage.PYTHON;

    case "java":
      return CodeChunkLanguage.JAVA;

    case "c#":
    case "csharp":
      return CodeChunkLanguage.CSHARP;

    case "go":
      return CodeChunkLanguage.GO;

    case "rust":
      return CodeChunkLanguage.RUST;

    case "sql":
      return CodeChunkLanguage.SQL;

    case "html":
      return CodeChunkLanguage.HTML;

    case "css":
      return CodeChunkLanguage.CSS;

    case "json":
      return CodeChunkLanguage.JSON;

    case "yaml":
    case "yml":
      return CodeChunkLanguage.YAML;

    case "markdown":
    case "md":
      return CodeChunkLanguage.MARKDOWN;

    default:
      return CodeChunkLanguage.OTHER;
  }
}

/* -------------------------------------------------------------------------- */
/* Code Understanding persistence                                             */
/* -------------------------------------------------------------------------- */

/**
 * Persist the structured code understanding model.
 *
 * The Code Understanding Engine produces:
 *
 * - file-level context chunks
 * - symbol-level context chunks
 * - imports
 * - exports
 * - complexity
 * - parameters
 * - parent symbols
 * - embedding eligibility
 *
 * CodeChunk rows are repository-scoped rather than
 * analysis-scoped, so every new repository analysis
 * replaces the previous repository chunk inventory.
 */
async function persistCodeUnderstanding(
  repositoryId: string,
  chunks: ReturnType<
    typeof understandRepositoryCode
  >["chunks"],
): Promise<void> {
  /*
   * Remove the previous repository code model.
   *
   * This keeps the CodeChunk table idempotent across
   * repeated repository analyses and prevents duplicate
   * chunks from accumulating.
   */
  await prisma.codeChunk.deleteMany({
    where: {
      repositoryId,
    },
  });

  if (chunks.length === 0) {
    console.log(
      "[SecureAI Code Understanding] No code chunks generated.",
    );

    return;
  }

  /*
   * Persist all generated chunks in one batch.
   */
  await prisma.codeChunk.createMany({
  data: chunks.map(
    (chunk) => ({
      repositoryId,

      filePath:
        chunk.filePath,

      symbolName:
        chunk.symbolName,

      startLine:
        chunk.startLine,

      endLine:
        chunk.endLine,

      language:
        mapCodeChunkLanguage(
          chunk.language,
        ),

      content:
        chunk.content,

      tokenCount:
        chunk.tokenCount,

      hash:
        chunk.hash,

      metadata: JSON.parse(
        JSON.stringify({
          ...chunk.metadata,

          contextType:
            chunk.contextType,

          embeddingEligible:
            chunk.embeddingEligible,
        }),
      ),
    }),
  ),
});
  const embeddingEligibleCount =
    chunks.filter(
      (chunk) =>
        chunk.embeddingEligible,
    ).length;

  const fileContextCount =
    chunks.filter(
      (chunk) =>
        chunk.contextType ===
        "FILE_CONTEXT",
    ).length;

  const symbolContextCount =
    chunks.filter(
      (chunk) =>
        chunk.contextType ===
        "SYMBOL_CONTEXT",
    ).length;

  console.log(
    `[SecureAI Code Understanding] Persisted ${chunks.length} CodeChunk rows (${fileContextCount} file-context, ${symbolContextCount} symbol-context, ${embeddingEligibleCount} embedding-eligible).`,
  );
}

/* -------------------------------------------------------------------------- */
/* Architecture persistence                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Persist the architecture graph generated from the repository.
 *
 * Architecture analysis is deterministic/static.
 * No LLM is involved here.
 */
async function persistArchitectureAnalysis(
  analysisId: string,
  architecture: ArchitectureAnalysisResult,
): Promise<void> {
  /*
   * Remove any existing architecture graph for this
   * analysis so retries remain idempotent.
   */
  await prisma.architectureComponent.deleteMany({
    where: {
      analysisId,
    },
  });

  /*
   * Create components first because relationships
   * reference component IDs.
   */
  const componentIdByKey =
    new Map<string, string>();

  for (const component of architecture.components) {
    const created =
      await prisma.architectureComponent.create({
        data: {
          analysisId,

          name:
            component.name,

          type:
            component.type,

          technology:
            component.technology,

          description:
            component.description,

          files:
            component.files,

          health:
            getArchitectureComponentHealth(
              component.health,
            ),
        },
      });

    componentIdByKey.set(
      component.key,
      created.id,
    );
  }

  /*
   * Create architecture relationships.
   */
  for (
    const relationship of architecture.relationships
  ) {
    const sourceId =
      componentIdByKey.get(
        relationship.sourceKey,
      );

    const targetId =
      componentIdByKey.get(
        relationship.targetKey,
      );

    if (!sourceId || !targetId) {
      continue;
    }

    await prisma.architectureRelationship.create({
      data: {
        sourceId,

        targetId,

        relation:
          relationship.relation,

        metadata:
          relationship.metadata,
      },
    });
  }

  /*
   * Convert architecture findings into the shared
   * Finding model.
   */
  const architectureFindings =
    architecture.findings.map(
      (finding) => ({
        analysisId,

        severity:
          finding.severity,

        status:
          "OPEN" as const,

        category:
          FindingCategory.ARCHITECTURE,

        title:
          finding.title,

        description:
          finding.description,

        impact:
          finding.impact,

        recommendation:
          finding.recommendation,

        filePath:
          null,

        lineStart:
          null,

        lineEnd:
          null,

        functionName:
          null,

        rule:
          "ARCHITECTURE_ANALYZER",

        scanner:
          "SecureAI Architecture Analyzer",

        evidence:
          `Component: ${finding.component}`,

        confidence:
          95,
      }),
    );

  if (
    architectureFindings.length > 0
  ) {
    await prisma.finding.createMany({
      data:
        architectureFindings,
    });
  }

  /*
   * Store architecture health on the Analysis.
   */
  await prisma.analysis.update({
    where: {
      id: analysisId,
    },

    data: {
      architecture:
        architecture.metrics
          .architectureHealth,
    },
  });

  console.log(
    `[SecureAI Architecture] ${architecture.metrics.componentCount} components, ${architecture.metrics.relationshipCount} relationships, ${architecture.metrics.findingCount} findings, score=${architecture.metrics.architectureHealth}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Performance persistence                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Persist deterministic performance-analysis results.
 *
 * Performance issues use the dedicated PerformanceIssue model
 * rather than the general Finding model.
 */
async function persistPerformanceAnalysis(
  analysisId: string,
  performance: PerformanceAnalysisResult,
): Promise<void> {
  /*
   * Remove any existing performance issues for this
   * analysis so retries remain idempotent.
   */
  await prisma.performanceIssue.deleteMany({
    where: {
      analysisId,
    },
  });

  /*
   * Persist performance issues.
   */
  if (performance.issues.length > 0) {
    await prisma.performanceIssue.createMany({
      data: performance.issues.map(
        (issue) => ({
          analysisId,

          severity:
            issue.severity,

          category:
            issue.category,

          title:
            issue.title,

          description:
            issue.description,

          impact:
            issue.impact,

          recommendation:
            issue.recommendation,

          filePath:
            issue.filePath,

          line:
            issue.line,

          metric:
            issue.metric,

          currentValue:
            issue.currentValue,

          expectedValue:
            issue.expectedValue,

          evidence:
            issue.evidence,
        }),
      ),
    });
  }

  /*
   * Store the calculated performance score
   * directly on the Analysis record.
   */
  await prisma.analysis.update({
    where: {
      id: analysisId,
    },

    data: {
      performance:
        performance.metrics
          .performanceHealth,
    },
  });

  console.log(
    `[SecureAI Performance] ${performance.metrics.issueCount} issues, ${performance.metrics.highSeverityCount} high severity, ${performance.metrics.mediumSeverityCount} medium severity, ${performance.metrics.lowSeverityCount} low severity, score=${performance.metrics.performanceHealth}`,
  );
}

/* -------------------------------------------------------------------------- */
/* AI Review                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Run the local AI review layer after static Finding
 * rows have already been persisted.
 *
 * Static findings remain the source of truth.
 * AI only enriches selected findings.
 */
async function runAIReviewLayer(
  analysisId: string,
  codeReviewFindings: ReturnType<
    typeof reviewRepositoryCode
  >,
  repositoryFiles: ReturnType<
    typeof extractAnalyzableRepositoryFiles
  >["files"],
): Promise<void> {
  const configuredConcurrency = Number(
    process.env.AI_REVIEW_CONCURRENCY || "2",
  );

  const concurrency = Math.max(
    1,
    Math.min(
      Number.isFinite(configuredConcurrency)
        ? Math.floor(configuredConcurrency)
        : 2,
      2,
    ),
  );

  const MAX_AI_REVIEWS = 20;

  /*
   * Prioritize findings that benefit most from AI review.
   */
  const prioritizedFindings =
    [...codeReviewFindings]
      .sort((a, b) => {
        const severityScore: Record<
          string,
          number
        > = {
          CRITICAL: 100,
          HIGH: 80,
          MEDIUM: 50,
          LOW: 20,
        };

        const getSecurityScore = (
          finding: typeof a,
        ): number => {
          const text = [
            finding.category,
            finding.title,
            finding.rule,
          ]
            .join(" ")
            .toUpperCase();

          if (
            text.includes("SECURITY") ||
            text.includes("SECRET") ||
            text.includes("EVAL") ||
            text.includes("INJECTION") ||
            text.includes("AUTH") ||
            text.includes("XSS") ||
            text.includes("SQL")
          ) {
            return 30;
          }

          return 0;
        };

        const getRepetitionPenalty = (
          finding: typeof a,
        ): number => {
          const text = [
            finding.title,
            finding.rule,
          ]
            .join(" ")
            .toUpperCase();

          if (
            text.includes("LONG_FUNCTION") ||
            text.includes("LARGE FUNCTION")
          ) {
            return -25;
          }

          return 0;
        };

        const scoreA =
          (severityScore[a.severity] ?? 0) +
          getSecurityScore(a) +
          getRepetitionPenalty(a);

        const scoreB =
          (severityScore[b.severity] ?? 0) +
          getSecurityScore(b) +
          getRepetitionPenalty(b);

        return scoreB - scoreA;
      })
      .slice(0, MAX_AI_REVIEWS);

  console.log(
    `[SecureAI AI] Selected ${prioritizedFindings.length}/${codeReviewFindings.length} findings for AI review.`,
  );

  let nextIndex = 0;
  let completedReviews = 0;
  let failedReviews = 0;

  const fileMap = new Map(
    repositoryFiles.map((file) => [
      file.path,
      file,
    ]),
  );

  async function worker(
    workerId: number,
  ): Promise<void> {
    while (true) {
      const currentIndex =
        nextIndex++;

      if (
        currentIndex >=
        prioritizedFindings.length
      ) {
        return;
      }

      const finding =
        prioritizedFindings[currentIndex];

      const repositoryFile =
        fileMap.get(
          finding.filePath,
        );

      if (!repositoryFile) {
        console.warn(
          `[SecureAI AI] Worker ${workerId}: source file not found: ${finding.filePath}`,
        );

        failedReviews++;
        continue;
      }

      const persistedFinding =
        await prisma.finding.findFirst({
          where: {
            analysisId,

            category:
              getFindingCategory(
                finding.category,
              ),

            title:
              finding.title,

            filePath:
              finding.filePath,

            lineStart:
              finding.lineStart,

            lineEnd:
              finding.lineEnd,

            functionName:
              finding.functionName,

            rule:
              finding.rule,
          },
        });

      if (!persistedFinding) {
        console.warn(
          `[SecureAI AI] Worker ${workerId}: persisted finding not found for ${finding.filePath}:${finding.lineStart}`,
        );

        failedReviews++;
        continue;
      }

      const relevantCode =
        getRelevantCodeContext(
          repositoryFile.content,
          finding.lineStart,
          finding.lineEnd,
        );

      try {
        console.log(
          `[SecureAI AI] Worker ${workerId} reviewing ${currentIndex + 1}/${prioritizedFindings.length}: ${finding.filePath}:${finding.lineStart} - ${finding.title}`,
        );

        const result =
          await reviewFindingWithAI({
            filePath:
              finding.filePath,

            language:
              repositoryFile.language,

            code:
              relevantCode,

            finding: {
              severity:
                finding.severity,

              category:
                finding.category,

              title:
                finding.title,

              description:
                finding.description,

              impact:
                finding.impact,

              recommendation:
                finding.recommendation,

              lineStart:
                finding.lineStart,

              lineEnd:
                finding.lineEnd,

              functionName:
                finding.functionName,

              rule:
                finding.rule,

              evidence:
                finding.evidence,
            },
          });

        await prisma.finding.update({
          where: {
            id:
              persistedFinding.id,
          },

          data: {
            aiExplanation:
              result.explanation,

            aiRootCause:
              result.rootCause,

            aiImpact:
              result.impact,

            aiRecommendation:
              result.recommendation,

            aiSuggestedFix:
              result.suggestedFix,

            aiConfidence:
              result.confidence,

            aiModel:
              process.env.OLLAMA_MODEL ||
              "qwen2.5-coder:7b",

            aiReviewedAt:
              new Date(),
          },
        });

        completedReviews++;

        console.log(
          `[SecureAI AI] Worker ${workerId} completed ${finding.filePath}:${finding.lineStart} | confidence=${result.confidence}% | progress=${completedReviews}/${prioritizedFindings.length}`,
        );
      } catch (error) {
        failedReviews++;

        console.error(
          `[SecureAI AI] Worker ${workerId} failed ${finding.filePath}:${finding.lineStart}`,
          error,
        );
      }
    }
  }

  console.log(
    `[SecureAI AI] Starting ${prioritizedFindings.length} AI reviews with concurrency=${concurrency}`,
  );

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrency,
          prioritizedFindings.length,
        ),
      },
      (_, index) =>
        worker(index + 1),
    ),
  );

  console.log(
    `[SecureAI AI] AI review layer finished: ${completedReviews}/${prioritizedFindings.length} completed, ${failedReviews} failed.`,
  );

  console.log(
    `[SecureAI AI] Static findings retained: ${codeReviewFindings.length}. AI-reviewed: ${completedReviews}.`,
  );
}

/* -------------------------------------------------------------------------- */
/* Main repository analysis                                                   */
/* -------------------------------------------------------------------------- */

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
      status:
        "RUNNING",

      startedAt:
        new Date(),
    },
  });

  try {
    const account =
      await getValidGitHubAccount(userId);

    if (!account?.accessToken) {
      throw new Error(
        "GitHub is not connected. Please reconnect GitHub.",
      );
    }

    /*
     * Resolve the GitHub App installation for
     * this repository.
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

    /*
     * Extract the repository once.
     *
     * The same extracted file set is passed to:
     *
     * - repository analyzer
     * - code understanding engine
     * - security scanner
     * - code review engine
     * - dependency analyzer
     * - architecture analyzer
     * - performance analyzer
     * - AI code review
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

    /* -------------------------------------------------------------------- */
    /* Code Understanding Engine                                           */
    /* -------------------------------------------------------------------- */

    console.log(
      `[SecureAI Code Understanding] Understanding ${extracted.files.length} repository files...`,
    );

    const codeUnderstanding =
      understandRepositoryCode(
        extracted.files,
      );

    console.log(
      `[SecureAI Code Understanding] ${codeUnderstanding.summary.filesAnalyzed} files analyzed, ${codeUnderstanding.summary.symbolsDetected} symbols detected, ${codeUnderstanding.summary.chunksCreated} chunks created.`,
    );

    /*
     * Persist the structured code model.
     *
     * This happens immediately after code understanding
     * so all later analysis layers can rely on the same
     * repository code model.
     */
    await persistCodeUnderstanding(
      repository.id,
      codeUnderstanding.chunks,
    );

    /* -------------------------------------------------------------------- */
    /* Security Intelligence                                                */
    /* -------------------------------------------------------------------- */

    const security =
      scanRepositorySecurity(
        extracted.files,
      );

    /* -------------------------------------------------------------------- */
    /* Code Review Intelligence                                             */
    /* -------------------------------------------------------------------- */

    const codeReviewFindings =
      reviewRepositoryCode(
        extracted.files,
      );

    /* -------------------------------------------------------------------- */
    /* Dependency Intelligence                                              */
    /* -------------------------------------------------------------------- */

    const dependencyResult =
      analyzeRepositoryDependencies(
        extracted.files,
      );

    const enrichedDependencies =
      await enrichDependenciesWithIntelligence(
        dependencyResult.dependencies,
      );

    const vulnerabilityResults =
      await enrichDependenciesWithVulnerabilities(
        dependencyResult.dependencies,
      );

    /*
     * Merge vulnerability intelligence into
     * dependency intelligence.
     *
     * Vulnerability lookup is ecosystem-aware.
     */
    const finalDependencies =
      enrichedDependencies.map(
        (dependency) => {
          const vulnerability =
            vulnerabilityResults.get(
              `${dependency.ecosystem}:${dependency.name}`,
            );

          if (!vulnerability) {
            return dependency;
          }

          return {
            ...dependency,

            status:
              vulnerability.status,

            severity:
              vulnerability.severity,

            advisoryId:
              vulnerability.advisoryId,

            advisory:
              vulnerability.advisory,

            description:
              vulnerability.description,

            impact:
              vulnerability.impact,

            recommendation:
              vulnerability.recommendation,
          };
        },
      );

    const enrichedDependencyResult = {
      ...dependencyResult,

      dependencies:
        finalDependencies,
    };

    /*
     * Replace the repository dependency inventory
     * with the latest analysis result.
     */
    await prisma.dependency.deleteMany({
      where: {
        repositoryId:
          repository.id,
      },
    });

    if (
      enrichedDependencyResult
        .dependencies.length > 0
    ) {
      await prisma.dependency.createMany({
        data:
          enrichedDependencyResult.dependencies.map(
            (dependency) => ({
              repositoryId:
                repository.id,

              name:
                dependency.name,

              ecosystem:
                dependency.ecosystem,

              type:
                dependency.type,

              currentVersion:
                dependency.currentVersion,

              latestVersion:
                dependency.latestVersion,

              status:
                dependency.status,

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

    /* -------------------------------------------------------------------- */
    /* Remove old findings for this analysis                                */
    /* -------------------------------------------------------------------- */

    await prisma.finding.deleteMany({
      where: {
        analysisId,
      },
    });

    /* -------------------------------------------------------------------- */
    /* Architecture Intelligence                                            */
    /* -------------------------------------------------------------------- */

    console.log(
      `[SecureAI Architecture] Analyzing architecture for ${extracted.files.length} repository files...`,
    );

    const architecture =
      analyzeArchitecture(
        extracted.files,
      );

    await persistArchitectureAnalysis(
      analysisId,
      architecture,
    );

    /* -------------------------------------------------------------------- */
    /* Performance Intelligence                                             */
    /* -------------------------------------------------------------------- */

    console.log(
      `[SecureAI Performance] Analyzing performance for ${extracted.files.length} repository files...`,
    );

    const performance =
      analyzeRepositoryPerformance(
        extracted.files,
      );

    await persistPerformanceAnalysis(
      analysisId,
      performance,
    );

    /* -------------------------------------------------------------------- */
    /* Build static findings                                                 */
    /* -------------------------------------------------------------------- */

    const allFindings = [
      /*
       * Security findings
       */
      ...security.findings.map(
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

      /*
       * Code review findings
       */
      ...codeReviewFindings.map(
        (finding) => ({
          analysisId,

          severity:
            finding.severity,

          status:
            "OPEN" as const,

          category:
            getFindingCategory(
              finding.category,
            ),

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

          functionName:
            finding.functionName,

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
    ];

    /*
     * Architecture findings are already persisted by
     * persistArchitectureAnalysis().
     *
     * Performance issues use PerformanceIssue and
     * therefore are also not duplicated here.
     */
    if (allFindings.length > 0) {
      await prisma.finding.createMany({
        data:
          allFindings,
      });
    }

    /* -------------------------------------------------------------------- */
    /* AI Code Review                                                        */
    /* -------------------------------------------------------------------- */

    await runAIReviewLayer(
      analysisId,
      codeReviewFindings,
      extracted.files,
    );

    /* -------------------------------------------------------------------- */
    /* Complete analysis                                                     */
    /* -------------------------------------------------------------------- */

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

          architecture:
            architecture.metrics
              .architectureHealth,

          performance:
            performance.metrics
              .performanceHealth,

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
        enrichedDependencyResult.summary,

      performance,
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
          message.slice(
            0,
            2000,
          ),
      },
    });

    throw error;
  }
}