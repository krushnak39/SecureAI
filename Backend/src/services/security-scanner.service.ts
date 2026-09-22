import type {
  AnalyzableRepositoryFile,
} from "./repository-analyzer.service.js";

type SecuritySeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO";

export interface SecurityFinding {
  severity: SecuritySeverity;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  rule: string;
  scanner: string;
  evidence: string;
  confidence: number;
}

export interface SecurityScanResult {
  findings: SecurityFinding[];
  securityScore: number;
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

const SCANNER_NAME =
  "secureai-security-scanner";

const CODE_LANGUAGES = new Set([
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C#",
  "Go",
  "Rust",
  "C",
  "C/C++",
  "C++",
  "Shell",
  "SQL",
  "Dockerfile",
  "Makefile",
]);

function createFinding(
  input: Omit<
    SecurityFinding,
    "scanner"
  >,
): SecurityFinding {
  return {
    ...input,
    scanner: SCANNER_NAME,
  };
}

function getLineNumber(
  content: string,
  index: number,
) {
  return (
    content.slice(0, index).split("\n")
      .length
  );
}

function getEvidence(
  line: string,
) {
  const normalized =
    line.trim();

  if (normalized.length <= 500) {
    return normalized;
  }

  return `${normalized.slice(0, 497)}...`;
}

function addFinding(
  findings: SecurityFinding[],
  finding: SecurityFinding,
) {
  const duplicate =
    findings.some(
      (existing) =>
        existing.rule === finding.rule &&
        existing.filePath ===
          finding.filePath &&
        existing.lineStart ===
          finding.lineStart,
    );

  if (!duplicate) {
    findings.push(finding);
  }
}

function scanHardcodedApiKeys(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  const patterns = [
    /\b(?:api[_-]?key|access[_-]?key|client[_-]?secret)\b\s*[:=]\s*["'`]([A-Za-z0-9_\-]{16,})["'`]/gi,
    /\bsk-[A-Za-z0-9_-]{16,}\b/g,
    /\bAIza[0-9A-Za-z_-]{20,}\b/g,
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  ];

  for (const pattern of patterns) {
    for (const match of file.content.matchAll(
      pattern,
    )) {
      const index =
        match.index ?? 0;

      const lineStart =
        getLineNumber(
          file.content,
          index,
        );

      const line =
        file.content.split(/\r\n|\r|\n/)[
          lineStart - 1
        ] ?? "";

      addFinding(
        findings,
        createFinding({
          severity: "HIGH",
          title:
            "Hardcoded API key detected",
          description:
            "A credential-like API key appears to be embedded directly in source code.",
          impact:
            "If this credential is valid, an attacker who obtains the repository may be able to access the associated service or consume resources.",
          recommendation:
            "Move the credential to an environment variable or secret manager and rotate the exposed credential.",
          filePath: file.path,
          lineStart,
          lineEnd: lineStart,
          rule: "SEC001",
          evidence:
            getEvidence(line),
          confidence: 92,
        }),
      );
    }
  }
}

function scanHardcodedSecrets(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  const pattern =
    /\b(?:password|passwd|secret|token|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*["'`]([^"'`]{6,})["'`]/gi;

  for (const match of file.content.matchAll(
    pattern,
  )) {
    const index =
      match.index ?? 0;

    const lineStart =
      getLineNumber(
        file.content,
        index,
      );

    const line =
      file.content.split(/\r\n|\r|\n/)[
        lineStart - 1
      ] ?? "";

    const value =
      match[1]?.trim().toLowerCase();

    if (
      !value ||
      [
        "password",
        "secret",
        "token",
        "changeme",
        "example",
        "test",
        "your_password",
        "your-secret",
        "your-token",
      ].includes(value)
    ) {
      continue;
    }

    addFinding(
      findings,
      createFinding({
        severity: "HIGH",
        title:
          "Hardcoded secret detected",
        description:
          "A password, secret, token, or authentication credential appears to be hardcoded in source code.",
        impact:
          "Hardcoded credentials can be exposed through source control, logs, builds, or repository access.",
        recommendation:
          "Store the credential in environment variables or a dedicated secret manager and rotate it if it has been committed.",
        filePath: file.path,
        lineStart,
        lineEnd: lineStart,
        rule: "SEC002",
        evidence:
          getEvidence(line),
        confidence: 88,
      }),
    );
  }
}

function scanPrivateKeys(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  const pattern =
    /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g;

  for (const match of file.content.matchAll(
    pattern,
  )) {
    const index =
      match.index ?? 0;

    const lineStart =
      getLineNumber(
        file.content,
        index,
      );

    addFinding(
      findings,
      createFinding({
        severity: "CRITICAL",
        title:
          "Private key detected",
        description:
          "A private cryptographic key appears to be stored inside the repository.",
        impact:
          "An exposed private key may allow unauthorized access to systems, services, certificates, or encrypted data.",
        recommendation:
          "Remove the private key from source control, rotate or revoke it immediately, and store future keys in a secure secret manager.",
        filePath: file.path,
        lineStart,
        lineEnd: lineStart,
        rule: "SEC003",
        evidence:
          "-----BEGIN PRIVATE KEY-----",
        confidence: 99,
      }),
    );
  }
}

function scanSqlInjection(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  if (
    !CODE_LANGUAGES.has(
      file.language,
    )
  ) {
    return;
  }

  const patterns = [
    /(?:SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,120}\+\s*[A-Za-z_$][\w$]*/gi,
    /(?:SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,120}\$\{[^}]+\}/gi,
    /(?:query|execute|raw)\s*\(\s*[`'"][^`'"]*(?:SELECT|INSERT|UPDATE|DELETE)[^`'"]*(?:\$\{|["']\s*\+)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of file.content.matchAll(
      pattern,
    )) {
      const index =
        match.index ?? 0;

      const lineStart =
        getLineNumber(
          file.content,
          index,
        );

      const line =
        file.content.split(/\r\n|\r|\n/)[
          lineStart - 1
        ] ?? "";

      addFinding(
        findings,
        createFinding({
          severity: "HIGH",
          title:
            "Potential SQL injection risk",
          description:
            "A SQL statement appears to be constructed using string concatenation or interpolation with a dynamic value.",
          impact:
            "Untrusted input may alter the intended SQL query and potentially expose, modify, or delete database data.",
          recommendation:
            "Use parameterized queries, prepared statements, or the ORM's safe query APIs instead of constructing SQL with dynamic strings.",
          filePath: file.path,
          lineStart,
          lineEnd: lineStart,
          rule: "SEC004",
          evidence:
            getEvidence(line),
          confidence: 84,
        }),
      );
    }
  }
}

function scanDangerousEval(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  if (
    !CODE_LANGUAGES.has(
      file.language,
    )
  ) {
    return;
  }

  const pattern =
    /\beval\s*\(/g;

  for (const match of file.content.matchAll(
    pattern,
  )) {
    const index =
      match.index ?? 0;

    const lineStart =
      getLineNumber(
        file.content,
        index,
      );

    const line =
      file.content.split(/\r\n|\r|\n/)[
        lineStart - 1
      ] ?? "";

    addFinding(
      findings,
      createFinding({
        severity: "HIGH",
        title:
          "Dangerous eval() usage",
        description:
          "The code executes a dynamically supplied expression using eval().",
        impact:
          "If attacker-controlled data reaches eval(), arbitrary code execution may become possible.",
        recommendation:
          "Avoid eval() and use explicit parsing, safe APIs, or structured data handling instead.",
        filePath: file.path,
        lineStart,
        lineEnd: lineStart,
        rule: "SEC005",
        evidence:
          getEvidence(line),
        confidence: 96,
      }),
    );
  }
}

function scanCommandInjection(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  if (
    !CODE_LANGUAGES.has(
      file.language,
    )
  ) {
    return;
  }

  const pattern =
    /\b(?:exec|execSync|execFile|spawn|spawnSync)\s*\(\s*(?:`[^`]*\$\{[^}]+\}|["'][^"']*["']\s*\+|[^,\n]*\+)\s*/g;

  for (const match of file.content.matchAll(
    pattern,
  )) {
    const index =
      match.index ?? 0;

    const lineStart =
      getLineNumber(
        file.content,
        index,
      );

    const line =
      file.content.split(/\r\n|\r|\n/)[
        lineStart - 1
      ] ?? "";

    addFinding(
      findings,
      createFinding({
        severity: "HIGH",
        title:
          "Potential command injection risk",
        description:
          "A system command appears to be constructed using a dynamic value.",
        impact:
          "If attacker-controlled input reaches the command, arbitrary operating-system commands may be executed.",
        recommendation:
          "Avoid shell command construction with untrusted input. Prefer safe process APIs with fixed arguments and strict input validation.",
        filePath: file.path,
        lineStart,
        lineEnd: lineStart,
        rule: "SEC006",
        evidence:
          getEvidence(line),
        confidence: 82,
      }),
    );
  }
}

function scanInsecureHttp(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  const pattern =
    /http:\/\/(?!localhost(?::\d+)?(?:\/|$)|127\.0\.0\.1(?::\d+)?(?:\/|$)|0\.0\.0\.0(?::\d+)?(?:\/|$))/gi;

  for (const match of file.content.matchAll(
    pattern,
  )) {
    const index =
      match.index ?? 0;

    const lineStart =
      getLineNumber(
        file.content,
        index,
      );

    const line =
      file.content.split(/\r\n|\r|\n/)[
        lineStart - 1
      ] ?? "";

    addFinding(
      findings,
      createFinding({
        severity: "MEDIUM",
        title:
          "Insecure HTTP connection",
        description:
          "The code contains a non-local HTTP URL that does not provide transport encryption.",
        impact:
          "Data transmitted over plain HTTP may be intercepted or modified in transit.",
        recommendation:
          "Use HTTPS for external services and production endpoints.",
        filePath: file.path,
        lineStart,
        lineEnd: lineStart,
        rule: "SEC007",
        evidence:
          getEvidence(line),
        confidence: 91,
      }),
    );
  }
}

function scanWeakCrypto(
  file: AnalyzableRepositoryFile,
  findings: SecurityFinding[],
) {
  const patterns = [
    /\b(?:md5|sha1)\s*\(/gi,
    /\bcreateHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/gi,
    /\b(?:DES|RC4)\b/gi,
  ];

  for (const pattern of patterns) {
    for (const match of file.content.matchAll(
      pattern,
    )) {
      const index =
        match.index ?? 0;

      const lineStart =
        getLineNumber(
          file.content,
          index,
        );

      const line =
        file.content.split(/\r\n|\r|\n/)[
          lineStart - 1
        ] ?? "";

      addFinding(
        findings,
        createFinding({
          severity: "MEDIUM",
          title:
            "Weak cryptographic algorithm",
          description:
            "The code appears to use a cryptographic algorithm that is considered weak for modern security-sensitive applications.",
          impact:
            "Weak cryptographic algorithms can reduce resistance against collision, brute-force, or cryptanalytic attacks.",
          recommendation:
            "Use modern algorithms such as SHA-256/SHA-3 for hashing or AES-GCM/ChaCha20-Poly1305 for encryption where appropriate.",
          filePath: file.path,
          lineStart,
          lineEnd: lineStart,
          rule: "SEC008",
          evidence:
            getEvidence(line),
          confidence: 90,
        }),
      );
    }
  }
}

function calculateSecurityScore(
  findings: SecurityFinding[],
) {
  let score = 100;

  for (const finding of findings) {
    switch (finding.severity) {
      case "CRITICAL":
        score -= 30;
        break;

      case "HIGH":
        score -= 15;
        break;

      case "MEDIUM":
        score -= 7;
        break;

      case "LOW":
        score -= 3;
        break;

      case "INFO":
        break;
    }
  }

  return Math.max(
    0,
    Math.min(100, score),
  );
}

export function scanRepositorySecurity(
  files: AnalyzableRepositoryFile[],
): SecurityScanResult {
  const findings: SecurityFinding[] =
    [];

  for (const file of files) {
    scanHardcodedApiKeys(
      file,
      findings,
    );

    scanHardcodedSecrets(
      file,
      findings,
    );

    scanPrivateKeys(
      file,
      findings,
    );

    scanSqlInjection(
      file,
      findings,
    );

    scanDangerousEval(
      file,
      findings,
    );

    scanCommandInjection(
      file,
      findings,
    );

    scanInsecureHttp(
      file,
      findings,
    );

    scanWeakCrypto(
      file,
      findings,
    );
  }

  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of findings) {
    counts[
      finding.severity.toLowerCase() as keyof typeof counts
    ] += 1;
  }

  return {
    findings,
    securityScore:
      calculateSecurityScore(
        findings,
      ),
    counts,
  };
}
