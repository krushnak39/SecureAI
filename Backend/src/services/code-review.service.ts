import type {
  AnalyzableRepositoryFile,
} from "./repository-analyzer.service.js";

export type CodeReviewSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type CodeReviewCategory =
  | "CODE_QUALITY"
  | "PERFORMANCE"
  | "MAINTAINABILITY";

export interface CodeReviewFinding {
  severity: CodeReviewSeverity;
  category: CodeReviewCategory;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  functionName: string | null;
  rule: string;
  scanner: string;
  evidence: string;
  confidence: number;
}

function createFinding(
  input: CodeReviewFinding,
): CodeReviewFinding {
  return input;
}

/**
 * Detect the function/method declaration that starts on a JavaScript
 * or TypeScript line.
 */
function detectJavaScriptFunctionName(
  line: string,
): string | null {
  const trimmed = line.trim();

  const functionDeclaration =
    trimmed.match(
      /^(?:export\s+default\s+|export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)\s*\(/,
    );

  if (functionDeclaration?.[1]) {
    return functionDeclaration[1];
  }

  const arrowFunction =
    trimmed.match(
      /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/,
    );

  if (arrowFunction?.[1]) {
    return arrowFunction[1];
  }

  const classMethod =
    trimmed.match(
      /^(?:public\s+|private\s+|protected\s+|static\s+|async\s+|readonly\s+)*([A-Za-z0-9_$]+)\s*\([^;]*\)\s*(?::\s*[^{]+)?\s*\{/,
    );

  if (
    classMethod?.[1] &&
    ![
      "if",
      "for",
      "while",
      "switch",
      "catch",
      "function",
    ].includes(classMethod[1])
  ) {
    return classMethod[1];
  }

  return null;
}

/**
 * Detect a Python function definition.
 */
function detectPythonFunctionName(
  line: string,
): string | null {
  const match = line
    .trim()
    .match(
      /^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/,
    );

  return match?.[1] ?? null;
}

function reviewJavaScriptLikeFile(
  file: AnalyzableRepositoryFile,
): CodeReviewFinding[] {
  const findings: CodeReviewFinding[] = [];

  const lines = file.content.split(
    /\r\n|\r|\n/,
  );

  /**
   * Function stack allows us to associate findings with
   * the nearest currently active function.
   */
  const functionStack: Array<{
    name: string;
    startLine: number;
    depth: number;
  }> = [];

  let braceDepth = 0;

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineNumber = index + 1;

    /*
     * Detect function declarations before processing
     * the current line's braces.
     */
    const detectedFunction =
      detectJavaScriptFunctionName(line);

    const functionStartDepth =
      braceDepth;

    if (detectedFunction) {
      functionStack.push({
        name: detectedFunction,
        startLine: lineNumber,
        depth:
          functionStartDepth + 1,
      });
    }

    const currentFunction =
      functionStack.length > 0
        ? functionStack[
            functionStack.length - 1
          ].name
        : null;

    /*
     * Explicit any
     */
    if (
      /\b(any)\b/.test(trimmed) &&
      (
        trimmed.includes(": any") ||
        trimmed.includes("<any>") ||
        trimmed.includes("as any")
      )
    ) {
      findings.push(
        createFinding({
          severity: "MEDIUM",
          category: "CODE_QUALITY",
          title:
            "Explicit any type reduces type safety.",
          description:
            "The code explicitly uses the any type, which disables useful TypeScript type checking for this value.",
          impact:
            "Type errors may remain undetected until runtime and can make future refactoring less reliable.",
          recommendation:
            "Replace any with a specific type, interface, union, or unknown where appropriate.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName: currentFunction,
          rule: "typescript/no-explicit-any",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.96,
        }),
      );
    }

    /*
     * console.log
     */
    if (
      /\bconsole\.log\s*\(/.test(
        trimmed,
      )
    ) {
      findings.push(
        createFinding({
          severity: "LOW",
          category: "MAINTAINABILITY",
          title:
            "Console logging found in application code.",
          description:
            "A console.log statement is present in the source code.",
          impact:
            "Debug logging can create noisy production logs and may accidentally expose implementation details.",
          recommendation:
            "Use the application's structured logging mechanism or remove temporary debug logging before production.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName: currentFunction,
          rule: "javascript/no-console-log",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.94,
        }),
      );
    }

    /*
     * eval()
     */
    if (
      /\beval\s*\(/.test(trimmed)
    ) {
      findings.push(
        createFinding({
          severity: "HIGH",
          category: "CODE_QUALITY",
          title:
            "Dynamic eval() usage detected.",
          description:
            "The code executes a dynamically evaluated expression using eval().",
          impact:
            "Dynamic evaluation makes code harder to reason about and can introduce serious security and maintainability risks when input is not fully trusted.",
          recommendation:
            "Replace eval() with explicit logic or a safer parser/API designed for the required operation.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName: currentFunction,
          rule: "javascript/no-eval",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.99,
        }),
      );
    }

    /*
     * TODO / FIXME
     */
    if (
      /\b(TODO|FIXME)\b/i.test(
        trimmed,
      )
    ) {
      findings.push(
        createFinding({
          severity: "LOW",
          category: "MAINTAINABILITY",
          title:
            "Unresolved TODO or FIXME found.",
          description:
            "The source contains a TODO or FIXME marker indicating unfinished or deferred work.",
          impact:
            "Deferred work can remain unnoticed and may increase maintenance risk over time.",
          recommendation:
            "Resolve the task or convert it into a tracked issue with clear ownership and scope.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName: currentFunction,
          rule: "general/no-unresolved-todo",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.91,
        }),
      );
    }

    /*
     * Update brace depth.
     */
    for (const character of line) {
      if (character === "{") {
        braceDepth += 1;
      }

      if (character === "}") {
        braceDepth -= 1;
      }
    }

    /*
     * Check whether the current function has ended.
     */
    while (
      functionStack.length > 0 &&
      braceDepth <
        functionStack[
          functionStack.length - 1
        ].depth
    ) {
      const functionInfo =
        functionStack.pop();

      if (!functionInfo) {
        break;
      }

      const functionLength =
        lineNumber -
        functionInfo.startLine +
        1;

      if (functionLength > 80) {
        findings.push(
          createFinding({
            severity: "MEDIUM",
            category: "MAINTAINABILITY",
            title:
              "Large function detected.",
            description:
              `Function ${functionInfo.name} spans approximately ${functionLength} lines.`,
            impact:
              "Large functions are harder to understand, test, debug, and modify safely.",
            recommendation:
              "Consider extracting cohesive pieces of logic into smaller functions with clear responsibilities.",
            filePath: file.path,
            lineStart:
              functionInfo.startLine,
            lineEnd: lineNumber,
            functionName:
              functionInfo.name,
            rule: "general/max-function-length",
            scanner:
              "SecureAI Code Review",
            evidence:
              `${functionInfo.name} spans approximately ${functionLength} lines.`,
            confidence: 0.84,
          }),
        );
      }
    }
  }

  return findings;
}

function reviewPythonFile(
  file: AnalyzableRepositoryFile,
): CodeReviewFinding[] {
  const findings: CodeReviewFinding[] = [];

  const lines = file.content.split(
    /\r\n|\r|\n/,
  );

  let currentFunction: {
    name: string;
    indentation: number;
  } | null = null;

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineNumber = index + 1;

    const detectedFunction =
      detectPythonFunctionName(line);

    if (detectedFunction) {
      currentFunction = {
        name: detectedFunction,
        indentation:
          line.length -
          line.trimStart().length,
      };
    } else if (
      trimmed.length > 0 &&
      currentFunction
    ) {
      const indentation =
        line.length -
        line.trimStart().length;

      if (
        indentation <=
          currentFunction.indentation &&
        !trimmed.startsWith("#")
      ) {
        currentFunction = null;
      }
    }

    const functionName =
      currentFunction?.name ?? null;

    /*
     * eval()
     */
    if (
      /\beval\s*\(/.test(trimmed)
    ) {
      findings.push(
        createFinding({
          severity: "HIGH",
          category: "CODE_QUALITY",
          title:
            "Dynamic eval() usage detected.",
          description:
            "The Python code uses eval() to execute a dynamically constructed expression.",
          impact:
            "Dynamic evaluation can introduce security risks and makes the code harder to reason about.",
          recommendation:
            "Replace eval() with explicit logic or a safe parser for the required input format.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName,
          rule: "python/no-eval",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.99,
        }),
      );
    }

    /*
     * print()
     */
    if (
      /\bprint\s*\(/.test(trimmed)
    ) {
      findings.push(
        createFinding({
          severity: "LOW",
          category: "MAINTAINABILITY",
          title:
            "Print statement found in application code.",
          description:
            "The Python source contains a print statement that may represent debugging or unstructured logging.",
          impact:
            "Direct printing can create noisy production output and makes centralized log management harder.",
          recommendation:
            "Use the application's logging framework for operational messages and remove temporary debug output.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName,
          rule: "python/no-print",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.88,
        }),
      );
    }

    /*
     * TODO / FIXME
     */
    if (
      /\b(TODO|FIXME)\b/i.test(
        trimmed,
      )
    ) {
      findings.push(
        createFinding({
          severity: "LOW",
          category: "MAINTAINABILITY",
          title:
            "Unresolved TODO or FIXME found.",
          description:
            "The source contains a TODO or FIXME marker.",
          impact:
            "Deferred work can remain unnoticed and increase maintenance risk.",
          recommendation:
            "Resolve the task or track it explicitly as an issue.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName,
          rule: "general/no-unresolved-todo",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.91,
        }),
      );
    }
  }

  return findings;
}

function reviewGenericFile(
  file: AnalyzableRepositoryFile,
): CodeReviewFinding[] {
  const findings: CodeReviewFinding[] = [];

  const lines = file.content.split(
    /\r\n|\r|\n/,
  );

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line = lines[index];
    const trimmed = line.trim();
    const lineNumber = index + 1;

    if (
      /\b(TODO|FIXME)\b/i.test(
        trimmed,
      )
    ) {
      findings.push(
        createFinding({
          severity: "LOW",
          category: "MAINTAINABILITY",
          title:
            "Unresolved TODO or FIXME found.",
          description:
            "The source contains a TODO or FIXME marker.",
          impact:
            "Deferred work can remain unnoticed and increase maintenance risk.",
          recommendation:
            "Resolve the task or track it explicitly as an issue.",
          filePath: file.path,
          lineStart: lineNumber,
          lineEnd: lineNumber,
          functionName: null,
          rule: "general/no-unresolved-todo",
          scanner: "SecureAI Code Review",
          evidence: trimmed.slice(0, 500),
          confidence: 0.91,
        }),
      );
    }
  }

  return findings;
}

export function reviewRepositoryCode(
  files: AnalyzableRepositoryFile[],
): CodeReviewFinding[] {
  const findings: CodeReviewFinding[] = [];

  for (const file of files) {
    if (
      file.language === "TypeScript" ||
      file.language === "JavaScript"
    ) {
      findings.push(
        ...reviewJavaScriptLikeFile(
          file,
        ),
      );

      continue;
    }

    if (
      file.language === "Python"
    ) {
      findings.push(
        ...reviewPythonFile(file),
      );

      continue;
    }

    findings.push(
      ...reviewGenericFile(file),
    );
  }

  return findings;
}