import type { AnalyzableRepositoryFile } from "./repository-analyzer.service.js";

export type DependencyEcosystem =
  | "NPM"
  | "PYPI"
  | "MAVEN"
  | "OTHER";

export type DependencyType =
  | "DIRECT"
  | "TRANSITIVE";

export interface DetectedDependency {
  name: string;
  ecosystem: DependencyEcosystem;
  type: DependencyType;
  currentVersion: string;
  latestVersion: string | null;
  status: "HEALTHY";
  severity: null;
  advisoryId: null;
  advisory: null;
  description: string | null;
  impact: string | null;
  recommendation: string | null;
  files: string[];
  dependents: string[];
}

export interface DependencyAnalysisSummary {
  dependenciesFound: number;
  ecosystems: Array<{
    ecosystem: DependencyEcosystem;
    dependencies: number;
  }>;
  manifests: string[];
}

interface ParsedDependency {
  name: string;
  version: string;
  type: DependencyType;
  filePath: string;
}

function normalizeVersion(version: string): string {
  return version
    .trim()
    .replace(/^[~^<>=\s]+/, "")
    .replace(/\s+.*$/, "")
    .replace(/^[vV]/, "");
}

function parseNpmPackageJson(
  file: AnalyzableRepositoryFile,
): ParsedDependency[] {
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(file.content) as Record<string, unknown>;
  } catch {
    return [];
  }

  const dependencies: ParsedDependency[] = [];

  for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const values = parsed[section];

    if (!values || typeof values !== "object" || Array.isArray(values)) {
      continue;
    }

    for (const [name, rawVersion] of Object.entries(
      values as Record<string, unknown>,
    )) {
      if (typeof rawVersion !== "string") {
        continue;
      }

      dependencies.push({
        name,
        version: normalizeVersion(rawVersion),
        type: "DIRECT",
        filePath: file.path,
      });
    }
  }

  return dependencies;
}

function parseRequirementsTxt(
  file: AnalyzableRepositoryFile,
): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];

  for (const rawLine of file.content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (
      !line ||
      line.startsWith("#") ||
      line.startsWith("-r ") ||
      line.startsWith("--") ||
      line.startsWith("git+") ||
      line.startsWith("http://") ||
      line.startsWith("https://")
    ) {
      continue;
    }

    const match = line.match(
      /^([A-Za-z0-9_.-]+)\s*(?:(==|>=|<=|~=|>|<)\s*([A-Za-z0-9*+!._-]+))?/,
    );

    if (!match) {
      continue;
    }

    const [, name, operator, version] = match;

    dependencies.push({
      name,
      version:
        operator && version
          ? normalizeVersion(version)
          : "*",
      type: "DIRECT",
      filePath: file.path,
    });
  }

  return dependencies;
}

function parsePomXml(
  file: AnalyzableRepositoryFile,
): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];

  const dependencyBlocks = file.content.match(
    /<dependency\b[^>]*>[\s\S]*?<\/dependency>/g,
  );

  if (!dependencyBlocks) {
    return dependencies;
  }

  for (const block of dependencyBlocks) {
    const groupId = block.match(
      /<groupId>\s*([^<]+)\s*<\/groupId>/,
    )?.[1];

    const artifactId = block.match(
      /<artifactId>\s*([^<]+)\s*<\/artifactId>/,
    )?.[1];

    const version = block.match(
      /<version>\s*([^<]+)\s*<\/version>/,
    )?.[1];

    if (!groupId || !artifactId) {
      continue;
    }

    dependencies.push({
      name: `${groupId.trim()}:${artifactId.trim()}`,
      version: version?.trim() || "managed",
      type: "DIRECT",
      filePath: file.path,
    });
  }

  return dependencies;
}

function detectDependencies(
  files: AnalyzableRepositoryFile[],
): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];

  for (const file of files) {
    const fileName = file.path.split("/").pop()?.toLowerCase();

    if (fileName === "package.json") {
      dependencies.push(...parseNpmPackageJson(file));
      continue;
    }

    if (fileName === "requirements.txt") {
      dependencies.push(...parseRequirementsTxt(file));
      continue;
    }

    if (fileName === "pom.xml") {
      dependencies.push(...parsePomXml(file));
    }
  }

  return dependencies;
}

function getEcosystem(
  filePath: string,
): DependencyEcosystem {
  const fileName = filePath.split("/").pop()?.toLowerCase();

  if (fileName === "package.json") {
    return "NPM";
  }

  if (fileName === "requirements.txt") {
    return "PYPI";
  }

  if (fileName === "pom.xml") {
    return "MAVEN";
  }

  return "OTHER";
}

export function analyzeRepositoryDependencies(
  files: AnalyzableRepositoryFile[],
): {
  dependencies: DetectedDependency[];
  summary: DependencyAnalysisSummary;
} {
  const parsedDependencies = detectDependencies(files);

  const merged = new Map<string, DetectedDependency>();

  for (const dependency of parsedDependencies) {
    const ecosystem = getEcosystem(dependency.filePath);

    const key = `${ecosystem}:${dependency.name}`;

    const existing = merged.get(key);

    if (existing) {
      if (!existing.files.includes(dependency.filePath)) {
        existing.files.push(dependency.filePath);
      }

      continue;
    }

    merged.set(key, {
      name: dependency.name,
      ecosystem,
      type: dependency.type,
      currentVersion: dependency.version,
      latestVersion: null,
      status: "HEALTHY",
      severity: null,
      advisoryId: null,
      advisory: null,
      description: null,
      impact: null,
      recommendation:
        dependency.version === "*"
          ? "Pin this dependency to a specific version for reproducible builds."
          : "Dependency inventory recorded. Advisory and version intelligence will be evaluated in the next analysis layer.",
      files: [dependency.filePath],
      dependents: [],
    });
  }

  const dependencies = Array.from(merged.values());

  const ecosystemCounts = new Map<
    DependencyEcosystem,
    number
  >();

  for (const dependency of dependencies) {
    ecosystemCounts.set(
      dependency.ecosystem,
      (ecosystemCounts.get(dependency.ecosystem) ?? 0) + 1,
    );
  }

  const manifests = Array.from(
    new Set(
      parsedDependencies.map(
        (dependency) => dependency.filePath,
      ),
    ),
  );

  return {
    dependencies,
    summary: {
      dependenciesFound: dependencies.length,
      ecosystems: Array.from(
        ecosystemCounts.entries(),
      ).map(([ecosystem, count]) => ({
        ecosystem,
        dependencies: count,
      })),
      manifests,
    },
  };
}