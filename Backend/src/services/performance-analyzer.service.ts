import type { AnalyzableRepositoryFile } from "./repository-analyzer.service.js";

export type PerformanceSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO";

export interface PerformanceIssueResult {
  severity: PerformanceSeverity;
  category: string;

  title: string;
  description: string;

  impact: string;
  recommendation: string;

  filePath: string | null;
  line: number | null;

  metric: string | null;
  currentValue: number | null;
  expectedValue: number | null;

  evidence: string;
}

export interface PerformanceAnalysisResult {
  issues: PerformanceIssueResult[];

  metrics: {
    performanceHealth: number;
    issueCount: number;

    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;

    filesWithIssues: number;
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getLineNumber(
  content: string,
  index: number,
): number {
  return (
    content.slice(0, index).split(/\r?\n/).length
  );
}

function getLineAt(
  lines: string[],
  lineNumber: number,
): string {
  return lines[lineNumber - 1]?.trim() || "";
}

function isSourceFile(
  file: AnalyzableRepositoryFile,
): boolean {
  return /\.(ts|tsx|js|jsx|py|java|kt|go|php|rb)$/i.test(
    file.path,
  );
}

function isDatabaseOperation(
  line: string,
): boolean {
  return (
    /prisma\.[a-zA-Z0-9_]+\.(findMany|findFirst|findUnique|findUniqueOrThrow|findFirstOrThrow|create|createMany|update|updateMany|delete|deleteMany|upsert|count|aggregate|groupBy)\s*\(/.test(
      line,
    ) ||
    /\.(query|execute|find|findOne|findMany|insert|update|delete|save|create)\s*\(/.test(
      line,
    )
  );
}

function isNetworkOperation(
  line: string,
): boolean {
  return (
    /\b(fetch|axios\.(get|post|put|patch|delete|request)|http\.(get|request)|https\.(get|request))\s*\(/.test(
      line,
    )
  );
}

function isSyncFileOperation(
  line: string,
): boolean {
  return /\b(readFileSync|writeFileSync|appendFileSync|existsSync|mkdirSync|readdirSync|statSync|unlinkSync|renameSync|copyFileSync)\s*\(/.test(
    line,
  );
}
function isLoopStart(
  line: string,
): boolean {
  return (
    /\bfor\s*\(/.test(line) ||
    /\bfor\s+.+\s+of\s+/.test(line) ||
    /\bfor\s+.+\s+in\s+/.test(line) ||
    /\bwhile\s*\(/.test(line)
  );
}

function addIssue(
  issues: PerformanceIssueResult[],
  issue: PerformanceIssueResult,
) {
  issues.push(issue);
}

/* -------------------------------------------------------------------------- */
/* Analyzer                                                                   */
/* -------------------------------------------------------------------------- */

export function analyzeRepositoryPerformance(
  files: AnalyzableRepositoryFile[],
): PerformanceAnalysisResult {
  const issues: PerformanceIssueResult[] = [];

  const filesWithIssues = new Set<string>();

  for (const file of files) {
    if (!isSourceFile(file)) {
      continue;
    }

    const lines = file.content.split(/\r?\n/);

    /*
     * ----------------------------------------------------------------------
     * Await inside loops
     * ----------------------------------------------------------------------
     */

    let loopDepth = 0;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const trimmed = line.trim();

      if (isLoopStart(trimmed)) {
        loopDepth++;
      }

      if (
        loopDepth > 0 &&
        /\bawait\s+/.test(trimmed)
      ) {
        const lineNumber = index + 1;

        addIssue(
          issues,
          {
            severity: "MEDIUM",

            category:
              "ASYNC_PERFORMANCE",

            title:
              "Await inside loop may serialize operations",

            description:
              "An awaited asynchronous operation was detected inside a loop. Each iteration may wait for the previous operation to complete.",

            impact:
              "Sequential asynchronous work can significantly increase total execution time when iterations are independent.",

            recommendation:
              "If the operations are independent, consider collecting promises and using Promise.all() or another bounded-concurrency strategy.",

            filePath:
              file.path,

            line:
              lineNumber,

            metric:
              "Sequential async operations",

            currentValue:
              1,

            expectedValue:
              0,

            evidence:
              `${lineNumber}: ${trimmed}`,
          },
        );

        filesWithIssues.add(file.path);
      }

      /*
       * Basic brace tracking.
       *
       * This intentionally remains conservative. It is not
       * intended to replace a full AST parser.
       */

      const opens =
        (line.match(/{/g) || []).length;

      const closes =
        (line.match(/}/g) || []).length;

      loopDepth += opens - closes;

      if (loopDepth < 0) {
        loopDepth = 0;
      }
    }

    /*
     * ----------------------------------------------------------------------
     * Database calls inside loops
     * ----------------------------------------------------------------------
     */

    loopDepth = 0;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const trimmed = line.trim();

      if (isLoopStart(trimmed)) {
        loopDepth++;
      }

      if (
        loopDepth > 0 &&
        isDatabaseOperation(trimmed)
      ) {
        const lineNumber = index + 1;

        addIssue(
          issues,
          {
            severity: "HIGH",

            category:
              "DATABASE_PERFORMANCE",

            title:
              "Database operation inside loop",

            description:
              "A database operation appears inside a loop. This can create repeated database queries for each iteration.",

            impact:
              "Repeated database round trips can cause high latency and may produce an N+1 query pattern.",

            recommendation:
              "Consider batching the operation, using a single query, preloading related data, or restructuring the operation to avoid one database request per iteration.",

            filePath:
              file.path,

            line:
              lineNumber,

            metric:
              "Database operations inside loop",

            currentValue:
              1,

            expectedValue:
              0,

            evidence:
              `${lineNumber}: ${trimmed}`,
          },
        );

        filesWithIssues.add(file.path);
      }

      const opens =
        (line.match(/{/g) || []).length;

      const closes =
        (line.match(/}/g) || []).length;

      loopDepth += opens - closes;

      if (loopDepth < 0) {
        loopDepth = 0;
      }
    }

    /*
     * ----------------------------------------------------------------------
     * Network calls inside loops
     * ----------------------------------------------------------------------
     */

    loopDepth = 0;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const trimmed = line.trim();

      if (isLoopStart(trimmed)) {
        loopDepth++;
      }

      if (
        loopDepth > 0 &&
        isNetworkOperation(trimmed)
      ) {
        const lineNumber = index + 1;

        addIssue(
          issues,
          {
            severity: "HIGH",

            category:
              "NETWORK_PERFORMANCE",

            title:
              "Network request inside loop",

            description:
              "A network request was detected inside a loop. This can result in multiple sequential or concurrent remote requests.",

            impact:
              "Repeated network requests can increase latency, consume external resources, and potentially trigger rate limits.",

            recommendation:
              "Batch requests where possible, move invariant requests outside the loop, or use controlled concurrency when requests are independent.",

            filePath:
              file.path,

            line:
              lineNumber,

            metric:
              "Network operations inside loop",

            currentValue:
              1,

            expectedValue:
              0,

            evidence:
              `${lineNumber}: ${trimmed}`,
          },
        );

        filesWithIssues.add(file.path);
      }

      const opens =
        (line.match(/{/g) || []).length;

      const closes =
        (line.match(/}/g) || []).length;

      loopDepth += opens - closes;

      if (loopDepth < 0) {
        loopDepth = 0;
      }
    }

    /*
     * ----------------------------------------------------------------------
     * Synchronous filesystem operations
     * ----------------------------------------------------------------------
     */

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!isSyncFileOperation(trimmed)) {
        continue;
      }

      const lineNumber = index + 1;

      addIssue(
        issues,
        {
          severity: "MEDIUM",

          category:
            "IO_PERFORMANCE",

          title:
            "Synchronous filesystem operation",

          description:
            "A synchronous filesystem API was detected. Synchronous I/O can block the Node.js event loop.",

          impact:
            "Blocking filesystem operations can reduce server responsiveness when executed on request or other latency-sensitive paths.",

          recommendation:
            "Prefer asynchronous filesystem APIs such as fs.promises where practical, especially inside server request handlers.",

          filePath:
            file.path,

          line:
            lineNumber,

          metric:
            "Synchronous filesystem operations",

          currentValue:
            1,

          expectedValue:
            0,

          evidence:
            `${lineNumber}: ${trimmed}`,
        },
      );

      filesWithIssues.add(file.path);
    }

    /*
     * ----------------------------------------------------------------------
     * Nested loops
     * ----------------------------------------------------------------------
     */

    for (let outerIndex = 0; outerIndex < lines.length; outerIndex++) {
      const outerLine =
        lines[outerIndex].trim();

      if (!isLoopStart(outerLine)) {
        continue;
      }

      for (
        let innerIndex = outerIndex + 1;
        innerIndex <
        Math.min(
          lines.length,
          outerIndex + 50,
        );
        innerIndex++
      ) {
        const innerLine =
          lines[innerIndex].trim();

        if (!isLoopStart(innerLine)) {
          continue;
        }

        const lineNumber =
          innerIndex + 1;

        addIssue(
          issues,
          {
            severity: "MEDIUM",

            category:
              "ALGORITHM_PERFORMANCE",

            title:
              "Nested loop may cause quadratic work",

            description:
              "A loop was detected inside the scope of another loop. Depending on the data and operations involved, this can result in O(n²) or greater work.",

            impact:
              "Execution time can grow rapidly as the input size increases.",

            recommendation:
              "Check whether the inner loop can be replaced with a Map, Set, indexed lookup, precomputed structure, or another more efficient algorithm.",

            filePath:
              file.path,

            line:
              lineNumber,

            metric:
              "Nested loop depth",

            currentValue:
              2,

            expectedValue:
              1,

            evidence:
              `${lineNumber}: ${innerLine}`,
          },
        );

        filesWithIssues.add(file.path);

        break;
      }
    }
  }

  /*
   * Remove exact duplicate findings.
   */

  const uniqueIssues = Array.from(
    new Map(
      issues.map(
        (issue) => [
          [
            issue.filePath,
            issue.line,
            issue.category,
            issue.title,
          ].join(":"),
          issue,
        ],
      ),
    ).values(),
  );

  const highSeverityCount =
    uniqueIssues.filter(
      (issue) =>
        issue.severity === "HIGH" ||
        issue.severity === "CRITICAL",
    ).length;

  const mediumSeverityCount =
    uniqueIssues.filter(
      (issue) =>
        issue.severity === "MEDIUM",
    ).length;

  const lowSeverityCount =
    uniqueIssues.filter(
      (issue) =>
        issue.severity === "LOW",
    ).length;

  /*
   * Start from a healthy score and apply
   * deterministic penalties.
   */

  let performanceHealth = 100;

  for (const issue of uniqueIssues) {
    switch (issue.severity) {
      case "CRITICAL":
        performanceHealth -= 20;
        break;

      case "HIGH":
        performanceHealth -= 12;
        break;

      case "MEDIUM":
        performanceHealth -= 6;
        break;

      case "LOW":
        performanceHealth -= 2;
        break;
    }
  }

  performanceHealth = Math.max(
    0,
    Math.min(100, performanceHealth),
  );

  return {
    issues: uniqueIssues,

    metrics: {
      performanceHealth,

      issueCount:
        uniqueIssues.length,

      highSeverityCount,

      mediumSeverityCount,

      lowSeverityCount,

      filesWithIssues:
        filesWithIssues.size,
    },
  };
}