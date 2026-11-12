import type {
  CodeReviewFinding,
} from "./code-review.service.js";

import type {
  SecurityFinding,
} from "./security-scanner.service.js";

export type PRRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type PRMergeReadiness =
  | "READY"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

export interface PRRiskInput {
  codeReviewFindings: CodeReviewFinding[];
  securityFindings: SecurityFinding[];
  changedFiles: number;
  changedLines: number;
}

export interface PRRiskResult {
  riskScore: number;
  riskLevel: PRRiskLevel;
  mergeReadiness: PRMergeReadiness;
  reasons: string[];
}

function getRiskWeight(
  severity: string,
): number {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return 40;

    case "HIGH":
      return 25;

    case "MEDIUM":
      return 12;

    case "LOW":
      return 5;

    case "INFO":
      return 0;

    default:
      return 0;
  }
}

export function calculatePRRisk(
  input: PRRiskInput,
): PRRiskResult {
  let score = 0;
  const reasons: string[] = [];

  const criticalSecurity =
    input.securityFindings.filter(
      (finding) =>
        finding.severity.toUpperCase() ===
        "CRITICAL",
    ).length;

  const highSecurity =
    input.securityFindings.filter(
      (finding) =>
        finding.severity.toUpperCase() ===
        "HIGH",
    ).length;

  const criticalCode =
    input.codeReviewFindings.filter(
      (finding) =>
        finding.severity.toUpperCase() ===
        "CRITICAL",
    ).length;

  const highCode =
    input.codeReviewFindings.filter(
      (finding) =>
        finding.severity.toUpperCase() ===
        "HIGH",
    ).length;

  for (const finding of input.securityFindings) {
    score += getRiskWeight(
      finding.severity,
    );
  }

  for (const finding of input.codeReviewFindings) {
    score += getRiskWeight(
      finding.severity,
    );
  }

  if (input.changedLines > 500) {
    score += 10;
    reasons.push(
      "Large pull request with more than 500 changed lines.",
    );
  }

  if (input.changedFiles > 10) {
    score += 5;
    reasons.push(
      "Pull request changes more than 10 files.",
    );
  }

  if (criticalSecurity > 0) {
    reasons.push(
      `${criticalSecurity} critical security finding${criticalSecurity > 1 ? "s" : ""} detected.`,
    );
  }

  if (highSecurity > 0) {
    reasons.push(
      `${highSecurity} high-severity security finding${highSecurity > 1 ? "s" : ""} detected.`,
    );
  }

  if (criticalCode > 0) {
    reasons.push(
      `${criticalCode} critical code-quality finding${criticalCode > 1 ? "s" : ""} detected.`,
    );
  }

  if (highCode > 0) {
    reasons.push(
      `${highCode} high-severity code-review finding${highCode > 1 ? "s" : ""} detected.`,
    );
  }

  score = Math.min(
    Math.max(score, 0),
    100,
  );

  let riskLevel: PRRiskLevel;

  if (score >= 75) {
    riskLevel = "CRITICAL";
  } else if (score >= 50) {
    riskLevel = "HIGH";
  } else if (score >= 25) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  let mergeReadiness: PRMergeReadiness;

  if (
    criticalSecurity > 0 ||
    criticalCode > 0 ||
    riskLevel === "CRITICAL"
  ) {
    mergeReadiness = "BLOCKED";
  } else if (
    riskLevel === "HIGH" ||
    riskLevel === "MEDIUM"
  ) {
    mergeReadiness = "REVIEW_REQUIRED";
  } else {
    mergeReadiness = "READY";
  }

  if (reasons.length === 0) {
    reasons.push(
      "No significant risk factors detected.",
    );
  }

  return {
    riskScore: score,
    riskLevel,
    mergeReadiness,
    reasons,
  };
}