import AdmZip from "adm-zip";

export interface RepositoryAnalysisSummary {
  filesAnalyzed: number;
  linesAnalyzed: number;
  skippedFiles: number;
  archiveBytes: number;
  languages: Array<{
    language: string;
    files: number;
    lines: number;
  }>;
}

const MAX_ARCHIVE_BYTES =
  150 * 1024 * 1024;

const MAX_FILES =
  20000;

const MAX_ANALYZABLE_FILE_BYTES =
  5 * 1024 * 1024;

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

function getLanguage(
  filePath: string,
): string | null {
  const fileName =
    filePath.split("/").pop()?.toLowerCase() ??
    "";

  const extension =
    fileName.includes(".")
      ? `.${fileName.split(".").pop()}`
      : "";

  const extensionMap: Record<
    string,
    string
  > = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".mts": "TypeScript",
    ".cts": "TypeScript",

    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",

    ".py": "Python",
    ".java": "Java",
    ".cs": "C#",
    ".go": "Go",
    ".rs": "Rust",

    ".sql": "SQL",

    ".html": "HTML",
    ".htm": "HTML",

    ".css": "CSS",
    ".scss": "CSS",
    ".sass": "CSS",

    ".json": "JSON",

    ".yml": "YAML",
    ".yaml": "YAML",

    ".md": "Markdown",
    ".mdx": "Markdown",

    ".c": "C",
    ".h": "C/C++",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".hpp": "C++",

    ".sh": "Shell",
    ".bash": "Shell",
  };

  if (extensionMap[extension]) {
    return extensionMap[extension];
  }

  if (
    fileName === "dockerfile"
  ) {
    return "Dockerfile";
  }

  if (
    fileName === "makefile"
  ) {
    return "Makefile";
  }

  return null;
}

function isIgnoredPath(
  filePath: string,
) {
  const parts = filePath
    .split("/")
    .filter(Boolean);

  if (
    parts.some((part) =>
      ignoredDirectories.has(
        part.toLowerCase(),
      ),
    )
  ) {
    return true;
  }

  const fileName =
    parts.at(-1)?.toLowerCase() ?? "";

  return ignoredFiles.has(fileName);
}

function normalizeArchivePath(
  entryName: string,
) {
  const normalized = entryName
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  const firstSlash =
    normalized.indexOf("/");

  if (firstSlash === -1) {
    return normalized;
  }

  return normalized.slice(
    firstSlash + 1,
  );
}

function isUnsafePath(
  filePath: string,
) {
  const normalized =
    filePath.replaceAll("\\", "/");

  return (
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    normalized === ".." ||
    normalized.startsWith("/")
  );
}

function countLines(
  content: string,
) {
  if (!content) {
    return 0;
  }

  const lines = content.split(
    /\r\n|\r|\n/,
  );

  if (
    content.endsWith("\n") ||
    content.endsWith("\r")
  ) {
    return Math.max(
      lines.length - 1,
      1,
    );
  }

  return lines.length;
}

function looksBinary(
  buffer: Buffer,
) {
  const sampleLength = Math.min(
    buffer.length,
    8000,
  );

  for (
    let index = 0;
    index < sampleLength;
    index += 1
  ) {
    if (buffer[index] === 0) {
      return true;
    }
  }

  return false;
}

export function analyzeRepositoryArchive(
  archiveBuffer: Buffer,
): RepositoryAnalysisSummary {
  if (
    archiveBuffer.length >
    MAX_ARCHIVE_BYTES
  ) {
    throw new Error(
      "Repository archive is too large for the current analysis limit.",
    );
  }

  const zip =
    new AdmZip(archiveBuffer);

  const entries =
    zip.getEntries();

  if (
    entries.length >
    MAX_FILES
  ) {
    throw new Error(
      "Repository contains too many files for the current analysis limit.",
    );
  }

  let filesAnalyzed = 0;
  let linesAnalyzed = 0;
  let skippedFiles = 0;

  const languageMap =
    new Map<
      string,
      { files: number; lines: number }
    >();

  for (const entry of entries) {
    if (entry.isDirectory) {
      continue;
    }

    const filePath =
      normalizeArchivePath(
        entry.entryName,
      );

    if (
      !filePath ||
      isUnsafePath(filePath) ||
      isIgnoredPath(filePath)
    ) {
      skippedFiles += 1;
      continue;
    }

    const language =
      getLanguage(filePath);

    if (!language) {
      skippedFiles += 1;
      continue;
    }

    const buffer =
      entry.getData();

    if (
      buffer.length >
      MAX_ANALYZABLE_FILE_BYTES
    ) {
      skippedFiles += 1;
      continue;
    }

    if (looksBinary(buffer)) {
      skippedFiles += 1;
      continue;
    }

    const content =
      buffer.toString("utf8");

    const lineCount =
      countLines(content);

    filesAnalyzed += 1;
    linesAnalyzed += lineCount;

    const current =
      languageMap.get(language) ?? {
        files: 0,
        lines: 0,
      };

    current.files += 1;
    current.lines += lineCount;

    languageMap.set(
      language,
      current,
    );
  }

  const languages = Array.from(
    languageMap.entries(),
  )
    .map(
      ([
        language,
        stats,
      ]) => ({
        language,
        files: stats.files,
        lines: stats.lines,
      }),
    )
    .sort(
      (a, b) =>
        b.files - a.files ||
        b.lines - a.lines,
    );

  return {
    filesAnalyzed,
    linesAnalyzed,
    skippedFiles,
    archiveBytes:
      archiveBuffer.length,
    languages,
  };
}