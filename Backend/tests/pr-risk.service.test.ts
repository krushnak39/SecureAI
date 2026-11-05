
import { describe, it, expect } from "vitest";
import {
  calculatePRRisk,
  type PRRiskInput,
} from "../src/services/pr-risk.service.js";
import type { CodeReviewFinding } from "../src/services/code-review.service.js";
import type { SecurityFinding } from "../src/services/security-scanner.service.js";

function createCodeFinding(
  severity: string,
): CodeReviewFinding {
  return {
    severity: severity as CodeReviewFinding["severity"],
    category: "BUG" as CodeReviewFinding["category"],
    title: "Test finding",
    description: "Test description",
    impact: "Test impact",
    recommendation: "Test recommendation",
    filePath: "src/test.ts",
    lineStart: 1,
    lineEnd: 2,
    functionName: null,
    rule: "TEST_RULE",
    scanner: "test",
    evidence: "Test evidence",
    confidence: 1,
  };
}

function createSecurityFinding(
  severity: string,
): SecurityFinding {
  return {
    severity: severity as SecurityFinding["severity"],
    title: "Test security finding",
    description: "Test description",
    impact: "Test impact",
    recommendation: "Test recommendation",
    filePath: "src/test.ts",
    lineStart: 1,
    lineEnd: 2,
    rule: "TEST_SECURITY_RULE",
    scanner: "test",
    evidence: "Test evidence",
    confidence: 1,
  };
}

function createInput(
  overrides: Partial<PRRiskInput> = {},
): PRRiskInput {
  return {
    codeReviewFindings: [],
    securityFindings: [],
    changedFiles: 1,
    changedLines: 100,
    ...overrides,
  };
}

describe("calculatePRRisk", () => {
  it("returns LOW risk and READY for a clean PR", () => {
    const result = calculatePRRisk(createInput());

    expect(result).toMatchObject({
      riskScore: 0,
      riskLevel: "LOW",
      mergeReadiness: "READY",
    });
    expect(result.reasons).toContain(
      "No significant risk factors detected.",
    );
  });

  it.each([
    ["CRITICAL", 40],
    ["HIGH", 25],
    ["MEDIUM", 12],
    ["LOW", 5],
    ["INFO", 0],
  ])("applies the correct %s severity weight", (severity, expectedScore) => {
    const result = calculatePRRisk(
      createInput({
        securityFindings: [
          createSecurityFinding(severity),
        ],
      }),
    );

    expect(result.riskScore).toBe(expectedScore);
  });

  it.each([
    { score: 25, level: "MEDIUM", severities: ["HIGH"] },
    { score: 49, level: "MEDIUM", severities: ["HIGH", "MEDIUM", "MEDIUM"] },
    { score: 50, level: "HIGH", severities: ["HIGH", "HIGH"] },
    { score: 74, level: "HIGH", severities: ["HIGH", "HIGH", "MEDIUM", "MEDIUM"] },
    { score: 75, level: "CRITICAL", severities: ["HIGH", "HIGH", "HIGH"] },
  ] as const)(
    "classifies exact score $score as $level",
    ({ score, level, severities }) => {
      const result = calculatePRRisk(
        createInput({
          securityFindings: severities.map(createSecurityFinding),
          changedLines: 0,
          changedFiles: 1,
        }),
      );

      expect(result.riskScore).toBe(score);
      expect(result.riskLevel).toBe(level);
    },
  );

  it("adds 10 points for more than 500 changed lines", () => {
    const result = calculatePRRisk(
      createInput({ changedLines: 501 }),
    );

    expect(result.riskScore).toBe(10);
    expect(result.reasons).toContain(
      "Large pull request with more than 500 changed lines.",
    );
  });

  it("does not add the line penalty at exactly 500 lines", () => {
    const result = calculatePRRisk(
      createInput({ changedLines: 500 }),
    );

    expect(result.riskScore).toBe(0);
  });

  it("adds 5 points for more than 10 changed files", () => {
    const result = calculatePRRisk(
      createInput({ changedFiles: 11 }),
    );

    expect(result.riskScore).toBe(5);
    expect(result.reasons).toContain(
      "Pull request changes more than 10 files.",
    );
  });

  it("does not add the file penalty at exactly 10 files", () => {
    const result = calculatePRRisk(
      createInput({ changedFiles: 10 }),
    );

    expect(result.riskScore).toBe(0);
  });

  it("blocks merging when a critical security finding exists", () => {
    const result = calculatePRRisk(
      createInput({
        securityFindings: [
          createSecurityFinding("CRITICAL"),
        ],
      }),
    );

    expect(result.mergeReadiness).toBe("BLOCKED");
  });

  it("blocks merging when a critical code finding exists", () => {
    const result = calculatePRRisk(
      createInput({
        codeReviewFindings: [
          createCodeFinding("CRITICAL"),
        ],
      }),
    );

    expect(result.mergeReadiness).toBe("BLOCKED");
  });

  it("requires review for a HIGH-risk PR", () => {
    const result = calculatePRRisk(
      createInput({
        securityFindings: [
          createSecurityFinding("HIGH"),
          createSecurityFinding("HIGH"),
        ],
      }),
    );

    expect(result.riskLevel).toBe("HIGH");
    expect(result.mergeReadiness).toBe("REVIEW_REQUIRED");
  });

  it("caps the risk score at 100", () => {
    const result = calculatePRRisk(
      createInput({
        securityFindings: Array.from(
          { length: 10 },
          () => createSecurityFinding("CRITICAL"),
        ),
      }),
    );

    expect(result.riskScore).toBe(100);
    expect(result.riskLevel).toBe("CRITICAL");
    expect(result.mergeReadiness).toBe("BLOCKED");
  });

  it("includes reasons for critical security findings", () => {
    const result = calculatePRRisk(
      createInput({
        securityFindings: [
          createSecurityFinding("CRITICAL"),
        ],
      }),
    );

    expect(result.reasons).toContain(
      "1 critical security finding detected.",
    );
  });
});
