import { prisma } from "./src/lib/prisma.js";
import {
  extractAnalyzableRepositoryFiles,
} from "./src/services/repository-analyzer.service.js";
import {
  understandRepositoryCode,
} from "./src/services/code-understanding.service.js";
import {
  embedRepositoryCodeChunks,
} from "./src/services/code-embedding.service.js";
import {
  CodeChunkLanguage,
} from "./src/generated/prisma/enums.js";
import fs from "node:fs";
import path from "node:path";

const REPOSITORY_ID = "cmua0wk890001aotxd1kzs733";
const REPOSITORY_ROOT = "C:\\Projects\\SecureAI";

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "vendor",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  "generated",
]);

const ignoredFiles = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "poetry.lock",
  "composer.lock",
  "go.sum",
]);

const extensions = new Map<string, string>([
  [".ts", "TypeScript"],
  [".tsx", "TypeScript"],
  [".mts", "TypeScript"],
  [".cts", "TypeScript"],
  [".js", "JavaScript"],
  [".jsx", "JavaScript"],
  [".mjs", "JavaScript"],
  [".cjs", "JavaScript"],
  [".py", "Python"],
  [".java", "Java"],
  [".cs", "C#"],
  [".go", "Go"],
  [".rs", "Rust"],
  [".sql", "SQL"],
  [".html", "HTML"],
  [".htm", "HTML"],
  [".css", "CSS"],
  [".scss", "CSS"],
  [".sass", "CSS"],
  [".json", "JSON"],
  [".yml", "YAML"],
  [".yaml", "YAML"],
  [".md", "Markdown"],
  [".mdx", "Markdown"],
  [".c", "C"],
  [".h", "C/C++"],
  [".cpp", "C++"],
  [".cc", "C++"],
  [".cxx", "C++"],
  [".hpp", "C++"],
  [".sh", "Shell"],
  [".bash", "Shell"],
]);

function getLanguage(filePath: string): string | null {
  const lower = filePath.toLowerCase();
  const baseName = path.basename(lower);

  if (baseName === "dockerfile") {
    return "Dockerfile";
  }

  if (baseName === "makefile") {
    return "Makefile";
  }

  if (lower.endsWith("requirements.txt")) {
    return "TEXT";
  }

  if (lower.endsWith("pom.xml")) {
    return "XML";
  }

  return extensions.get(path.extname(lower)) ?? null;
}

function isIgnored(relativePath: string): boolean {
  const parts = relativePath.split(path.sep);

  if (
    parts.some((part) =>
      ignoredDirectories.has(part.toLowerCase()),
    )
  ) {
    return true;
  }

  return ignoredFiles.has(
    parts.at(-1)?.toLowerCase() ?? "",
  );
}

function looksBinary(buffer: Buffer): boolean {
  const sampleLength = Math.min(buffer.length, 8000);

  for (let i = 0; i < sampleLength; i += 1) {
    if (buffer[i] === 0) {
      return true;
    }
  }

  return false;
}

function collectFiles(
  directory: string,
): Array<{
  path: string;
  language: string;
  content: string;
  lines: number;
}> {
  const result: Array<{
    path: string;
    language: string;
    content: string;
    lines: number;
  }> = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const absolutePath =
      path.join(directory, entry.name);

    const relativePath =
      path.relative(
        REPOSITORY_ROOT,
        absolutePath,
      );

    if (isIgnored(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      result.push(
        ...collectFiles(absolutePath),
      );
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const language =
      getLanguage(relativePath);

    if (!language) {
      continue;
    }

    const buffer =
      fs.readFileSync(absolutePath);

    if (buffer.length > 5 * 1024 * 1024) {
      continue;
    }

    if (looksBinary(buffer)) {
      continue;
    }

    const content =
      buffer.toString("utf8");

    const normalizedPath =
      relativePath
        .split(path.sep)
        .join("/");

    result.push({
      path: normalizedPath,
      language,
      content,
      lines: content
        ? content.split(/\r\n|\r|\n/).length
        : 0,
    });
  }

  return result;
}

function mapLanguage(
  language: string,
): CodeChunkLanguage {
  switch (language.trim().toLowerCase()) {
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

try {
  console.log(
    `[RAG Test] Reading local repository: ${REPOSITORY_ROOT}`,
  );

  if (!fs.existsSync(REPOSITORY_ROOT)) {
    throw new Error(
      `Repository directory not found: ${REPOSITORY_ROOT}`,
    );
  }

  const files =
    collectFiles(REPOSITORY_ROOT);

  console.log(
    `[RAG Test] Local analyzable files: ${files.length}`,
  );

  if (files.length === 0) {
    throw new Error(
      "No analyzable source files were found.",
    );
  }

  console.log(
    "[RAG Test] Running Code Understanding Engine...",
  );

  const understanding =
    understandRepositoryCode(files);

  console.log(
    `[RAG Test] Files analyzed: ${understanding.summary.filesAnalyzed}`,
  );

  console.log(
    `[RAG Test] Symbols detected: ${understanding.summary.symbolsDetected}`,
  );

  console.log(
    `[RAG Test] Chunks created: ${understanding.summary.chunksCreated}`,
  );

  const embeddingEligible =
    understanding.chunks.filter(
      (chunk) => chunk.embeddingEligible,
    ).length;

  console.log(
    `[RAG Test] Embedding-eligible chunks: ${embeddingEligible}`,
  );

  await prisma.codeChunk.deleteMany({
    where: {
      repositoryId: REPOSITORY_ID,
    },
  });

  await prisma.codeChunk.createMany({
    data: understanding.chunks.map(
      (chunk) => ({
        repositoryId:
          REPOSITORY_ID,

        filePath:
          chunk.filePath,

        symbolName:
          chunk.symbolName,

        startLine:
          chunk.startLine,

        endLine:
          chunk.endLine,

        language:
          mapLanguage(
            chunk.language,
          ),

        content:
          chunk.content,

        tokenCount:
          chunk.tokenCount,

        hash:
          chunk.hash,

        metadata:
          JSON.parse(
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

  console.log(
    `[RAG Test] Persisted ${understanding.chunks.length} CodeChunks.`,
  );

  console.log(
    "[RAG Test] Generating embeddings...",
  );

  const embeddingResult =
    await embedRepositoryCodeChunks(
      REPOSITORY_ID,
    );

  console.log(
    "[RAG Test] Embedding result:",
    embeddingResult,
  );

  const counts =
    await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS "totalChunks",
        COUNT("embedding")::int AS "embeddedChunks"
      FROM "CodeChunk"
      WHERE "repositoryId" = '${REPOSITORY_ID}'
    `);

  console.log(
    "[RAG Test] Final database counts:",
    counts,
  );

  console.log(
    "[RAG Test] SUCCESS — Code Understanding + embeddings completed.",
  );
} catch (error) {
  console.error(
    "[RAG Test] FAILED:",
    error,
  );

  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
