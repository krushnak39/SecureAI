
import { describe, it, expect, vi } from "vitest";
import { reviewRepositoryCode } from "../src/services/code-review.service.js";
import type { AnalyzableRepositoryFile } from "../src/services/repository-analyzer.service.js";

function createFile(
  language: string,
  content: string,
  path = "src/test.ts",
): AnalyzableRepositoryFile {
  return {
    path,
    language,
    content,
    lines: content.split(/\r\n|\r|\n/).length,
  };
}

describe("reviewRepositoryCode", () => {
  it("returns no findings for clean TypeScript code", () => {
    const findings = reviewRepositoryCode([
      createFile(
        "TypeScript",
        "const age: number = 20;\nconst name: string = 'Alex';",
      ),
    ]);

    expect(findings).toHaveLength(0);
  });

  it("detects explicit any usage", () => {
    const findings = reviewRepositoryCode([
      createFile("TypeScript", "const value: any = 10;"),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "MEDIUM",
      category: "CODE_QUALITY",
      rule: "typescript/no-explicit-any",
      lineStart: 1,
      filePath: "src/test.ts",
    });
  });

  it("detects console.log usage", () => {
    const findings = reviewRepositoryCode([
      createFile("JavaScript", "console.log('Hello');"),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "LOW",
      category: "MAINTAINABILITY",
      rule: "javascript/no-console-log",
      lineStart: 1,
    });
  });

  it("detects eval() usage in JavaScript", () => {
    const findings = reviewRepositoryCode([
      createFile("JavaScript", "eval('2 + 2');"),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "HIGH",
      rule: "javascript/no-eval",
      lineStart: 1,
    });
  });

  it("detects TODO and FIXME markers", () => {
    const findings = reviewRepositoryCode([
      createFile(
        "TypeScript",
        "// TODO: complete this feature\n// FIXME: handle this issue",
      ),
    ]);

    expect(findings).toHaveLength(2);
    expect(findings.every(
      (finding) => finding.rule === "general/no-unresolved-todo",
    )).toBe(true);
  });

  it("detects Python eval() and print()", () => {
    const findings = reviewRepositoryCode([
      createFile(
        "Python",
        "value = eval('2 + 2')\nprint(value)",
        "src/test.py",
      ),
    ]);

    expect(findings).toHaveLength(2);
    expect(findings.map((finding) => finding.rule)).toEqual([
      "python/no-eval",
      "python/no-print",
    ]);
  });

  it("detects TODO markers in generic files", () => {
    const findings = reviewRepositoryCode([
      createFile("JSON", '{ "message": "TODO: update this" }', "config.json"),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "LOW",
      rule: "general/no-unresolved-todo",
      filePath: "config.json",
      functionName: null,
    });
  });

  it("associates findings with their JavaScript function", () => {
    const findings = reviewRepositoryCode([
      createFile(
        "TypeScript",
        "function calculateTotal() {\n  console.log('Calculating');\n}",
      ),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].functionName).toBe("calculateTotal");
    expect(findings[0].lineStart).toBe(2);
  });

  it("associates Python findings with their function", () => {
    const findings = reviewRepositoryCode([
      createFile(
        "Python",
        "def calculate_total():\n    print('Calculating')",
        "src/test.py",
      ),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].functionName).toBe("calculate_total");
    expect(findings[0].lineStart).toBe(2);
  });

  it("preserves the correct file path for findings", () => {
    const findings = reviewRepositoryCode([
      createFile(
        "JavaScript",
        "console.log('Test');",
        "Backend/src/app.js",
      ),
    ]);

    expect(findings[0].filePath).toBe("Backend/src/app.js");
  });

  it("reviews multiple files in one call", () => {
    const findings = reviewRepositoryCode([
      createFile("TypeScript", "const value: any = 10;"),
      createFile("Python", "print('Hello')", "test.py"),
    ]);

    expect(findings).toHaveLength(2);
    expect(findings.map((finding) => finding.rule)).toContain(
      "typescript/no-explicit-any",
    );
    expect(findings.map((finding) => finding.rule)).toContain(
      "python/no-print",
    );
  });
});
