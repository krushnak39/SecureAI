
import { describe, it, expect } from "vitest";
import { scanRepositorySecurity } from "../src/services/security-scanner.service.js";
import type { AnalyzableRepositoryFile } from "../src/services/repository-analyzer.service.js";

function createFile(
  content: string,
  path = "src/test.ts",
  language = "TypeScript",
): AnalyzableRepositoryFile {
  return {
    path,
    language,
    content,
    lines: content.split(/\r\n|\r|\n/).length,
  };
}

describe("scanRepositorySecurity", () => {
  it("returns no findings and a score of 100 for clean code", () => {
    const result = scanRepositorySecurity([
      createFile("const age: number = 20;"),
    ]);

    expect(result.findings).toHaveLength(0);
    expect(result.securityScore).toBe(100);
    expect(result.counts).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    });
  });

  it("detects a hardcoded API key", () => {
    const result = scanRepositorySecurity([
      createFile('const key = "sk-abcdefghijklmnop";'),
    ]);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: "HIGH",
      rule: "SEC001",
      filePath: "src/test.ts",
      lineStart: 1,
      lineEnd: 1,
    });
  });

  it("detects a hardcoded secret", () => {
    const result = scanRepositorySecurity([
      createFile('const password = "supersecret123";'),
    ]);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: "HIGH",
      rule: "SEC002",
      lineStart: 1,
    });
  });

  it("detects a private key", () => {
    const result = scanRepositorySecurity([
      createFile(
        "-----BEGIN PRIVATE KEY-----\nfake-key-data",
        "keys/private.pem",
      ),
    ]);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: "CRITICAL",
      rule: "SEC003",
      filePath: "keys/private.pem",
      lineStart: 1,
    });
  });

  it("detects potential SQL injection", () => {
    const result = scanRepositorySecurity([
      createFile(
        'const query = "SELECT * FROM users WHERE id = " + userId;',
      ),
    ]);

    expect(
      result.findings.some((finding) => finding.rule === "SEC004"),
    ).toBe(true);
  });

  it("detects dangerous eval usage", () => {
    const result = scanRepositorySecurity([
      createFile("const result = eval(userInput);"),
    ]);

    expect(
      result.findings.some((finding) => finding.rule === "SEC005"),
    ).toBe(true);
  });

  it("detects potential command injection", () => {
    const result = scanRepositorySecurity([
      createFile('exec("ls " + userInput);'),
    ]);

    expect(
      result.findings.some((finding) => finding.rule === "SEC006"),
    ).toBe(true);
  });

  it("detects insecure external HTTP URLs", () => {
    const result = scanRepositorySecurity([
      createFile('const url = "http://example.com/api";'),
    ]);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: "MEDIUM",
      rule: "SEC007",
      lineStart: 1,
    });
  });

  it("does not flag localhost HTTP URLs", () => {
    const result = scanRepositorySecurity([
      createFile('const url = "http://localhost:3000/api";'),
    ]);

    expect(
      result.findings.some((finding) => finding.rule === "SEC007"),
    ).toBe(false);
  });

  it("detects weak cryptographic algorithms", () => {
    const result = scanRepositorySecurity([
      createFile('const hash = createHash("md5");'),
    ]);

    expect(
      result.findings.some((finding) => finding.rule === "SEC008"),
    ).toBe(true);
  });

  it("calculates the security score based on finding severity", () => {
    const result = scanRepositorySecurity([
      createFile('const url = "http://example.com";'),
    ]);

    expect(result.securityScore).toBe(93);
    expect(result.counts.medium).toBe(1);
  });

  it("sets the scanner name and includes evidence in findings", () => {
    const result = scanRepositorySecurity([
      createFile('const url = "http://example.com";'),
    ]);

    expect(result.findings[0].scanner).toBe(
      "secureai-security-scanner",
    );
    expect(result.findings[0].evidence).toContain(
      "http://example.com",
    );
    expect(result.findings[0].confidence).toBeGreaterThan(0);
  });

  it("reports correct line numbers for findings", () => {
    const result = scanRepositorySecurity([
      createFile(
        "const safe = true;\nconst url = 'http://example.com';",
      ),
    ]);

    expect(result.findings[0].lineStart).toBe(2);
    expect(result.findings[0].lineEnd).toBe(2);
  });

  it("does not report the same rule twice on the same line", () => {
    const result = scanRepositorySecurity([
      createFile(
        'const first = "sk-abcdefghijklmnop"; const second = "sk-qrstuvwxyzabcdef";',
      ),
    ]);

    const apiKeyFindings = result.findings.filter(
      (finding) => finding.rule === "SEC001",
    );

    expect(apiKeyFindings).toHaveLength(1);
  });

  it("scans multiple files in one call", () => {
    const result = scanRepositorySecurity([
      createFile('const url = "http://example.com";', "src/api.ts"),
      createFile('const password = "supersecret123";', "src/auth.ts"),
    ]);

    expect(result.findings).toHaveLength(2);
    expect(result.findings.map((finding) => finding.filePath)).toContain(
      "src/api.ts",
    );
    expect(result.findings.map((finding) => finding.filePath)).toContain(
      "src/auth.ts",
    );
  });
});
