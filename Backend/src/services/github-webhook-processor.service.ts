import { prisma } from "../lib/prisma.js";

import {
  createGitHubCheckRun,
  getGitHubFileContent,
  getInstallationAccessToken,
  getRepositoryInstallation,
  listGitHubPullRequestFiles,
} from "./github.service.js";

import {
  calculatePRRisk,
} from "./pr-risk.service.js";

import {
  reviewRepositoryCode,
} from "./code-review.service.js";

import {
  scanRepositorySecurity,
} from "./security-scanner.service.js";

import {
  getLanguage,
} from "./repository-analyzer.service.js";

interface PullRequestWebhookPayload {
  action?: string;
  number?: number;

  pull_request?: {
    number?: number;
    title?: string;

    head?: {
      ref?: string;
      sha?: string;
    };

    base?: {
      ref?: string;
    };
  };

  repository?: {
    full_name?: string;
  };
}

export async function processGitHubPullRequestWebhook(
  payload: PullRequestWebhookPayload,
) {
  const fullName =
    payload.repository?.full_name;

  const pullNumber =
    payload.pull_request?.number ??
    payload.number;

  if (!fullName) {
    return {
      handled: false,
      reason:
        "Repository full_name is missing.",
    };
  }

  if (!pullNumber) {
    return {
      handled: false,
      reason:
        "Pull request number is missing.",
    };
  }

  const repository =
    await prisma.repository.findFirst({
      where: {
        fullName,
        provider: "GITHUB",
      },
      select: {
        id: true,
        projectId: true,
        fullName: true,
      },
    });

  if (!repository) {
    return {
      handled: false,
      reason:
        "Repository is not connected to SecureAI.",
      repository: fullName,
    };
  }

  const installation =
    await getRepositoryInstallation(
      fullName,
    );

  const installationToken =
    await getInstallationAccessToken(
      installation.id,
    );

  const changedFiles =
    await listGitHubPullRequestFiles(
      installationToken.token,
      fullName,
      pullNumber,
    );

  const headSha =
    payload.pull_request?.head?.sha;

  if (!headSha) {
    return {
      handled: false,
      reason:
        "Pull request head SHA is missing.",
    };
  }

  const analyzableFiles = [];

  for (const file of changedFiles) {
    if (
      file.status === "deleted"
    ) {
      continue;
    }

    const language =
      getLanguage(file.filename);

    if (!language) {
      continue;
    }

    const content =
      await getGitHubFileContent(
        installationToken.token,
        fullName,
        file.filename,
        headSha,
      );

    if (content === null) {
      continue;
    }

    const lines =
      content.split(/\r\n|\r|\n/);

    analyzableFiles.push({
      path: file.filename,
      language,
      content,
      lines: lines.length,
    });
  }

  const codeReviewFindings =
    reviewRepositoryCode(
      analyzableFiles,
    );

  const securityScan =
    scanRepositorySecurity(
      analyzableFiles,
    );

  const changedLines =
  changedFiles.reduce(
    (total, file) =>
      total +
      file.additions +
      file.deletions,
    0,
  );

const riskAnalysis =
  calculatePRRisk({
    codeReviewFindings,
    securityFindings:
      securityScan.findings,
    changedFiles:
      changedFiles.length,
    changedLines,
  });

  const analysis =
  await prisma.analysis.create({
    data: {
      repositoryId:
        repository.id,

      pullRequestId:
        null,

      status:
        "COMPLETED",

      trigger:
        "PULL_REQUEST",

      branch:
        payload.pull_request?.head?.ref ??
        null,

      commitSha:
        headSha,

      filesAnalyzed:
        analyzableFiles.length,

      linesAnalyzed:
        analyzableFiles.reduce(
          (total, file) =>
            total + file.lines,
          0,
        ),

      riskScore:
        riskAnalysis.riskScore,

      riskLevel:
        riskAnalysis.riskLevel,

      mergeReadiness:
        riskAnalysis.mergeReadiness,

      codeQuality:
        Math.max(
          0,
          100 -
            codeReviewFindings.length * 5,
        ),

      securityScore:
        securityScan.securityScore,

      startedAt:
        new Date(),

      completedAt:
        new Date(),
    },
  });

  const checkConclusion =
  riskAnalysis.mergeReadiness ===
    "BLOCKED"
    ? "failure"
    : riskAnalysis.mergeReadiness ===
        "REVIEW_REQUIRED"
      ? "neutral"
      : "success";

await createGitHubCheckRun(
  installationToken.token,
  fullName,
  {
    name: "SecureAI PR Analysis",
    headSha,
    status: "completed",
    conclusion:
      checkConclusion,
    title:
      `Risk: ${riskAnalysis.riskLevel} • ${riskAnalysis.riskScore}/100`,
    summary:
      `Merge readiness: ${riskAnalysis.mergeReadiness}`,
    text:
      [
        `**Risk Score:** ${riskAnalysis.riskScore}/100`,
        `**Risk Level:** ${riskAnalysis.riskLevel}`,
        `**Merge Readiness:** ${riskAnalysis.mergeReadiness}`,
        `**Changed Files:** ${changedFiles.length}`,
        `**Changed Lines:** ${changedLines}`,
        "",
        "**Risk Factors:**",
        ...riskAnalysis.reasons.map(
          (reason) => `- ${reason}`,
        ),
      ].join("\n"),
  },
);

  return {
    handled: true,

    repositoryId:
      repository.id,

    projectId:
      repository.projectId,

    repository:
      repository.fullName,

    pullRequestNumber:
      pullNumber,

    action:
      payload.action ?? null,

    title:
      payload.pull_request?.title ??
      null,

    sourceBranch:
      payload.pull_request?.head?.ref ??
      null,

    targetBranch:
      payload.pull_request?.base?.ref ??
      null,

    headSha,

    changedFiles:
      changedFiles.map(
        (file) => ({
          filename:
            file.filename,

          status:
            file.status,

          additions:
            file.additions,

          deletions:
            file.deletions,

          changes:
            file.changes,

          patch:
            file.patch ?? null,

          previousFilename:
            file.previous_filename ??
            null,
        }),
      ),

    analysis: {
      analyzableFiles:
        analyzableFiles.length,

        risk: {
  score:
    riskAnalysis.riskScore,

  level:
    riskAnalysis.riskLevel,

  mergeReadiness:
    riskAnalysis.mergeReadiness,

  reasons:
    riskAnalysis.reasons,

  changedLines,
},

      codeReview: {
        findings:
          codeReviewFindings,
        totalFindings:
          codeReviewFindings.length,
      },

      security: {
        findings:
          securityScan.findings,
        securityScore:
          securityScan.securityScore,
        counts:
          securityScan.counts,
      },
    },
  };
}