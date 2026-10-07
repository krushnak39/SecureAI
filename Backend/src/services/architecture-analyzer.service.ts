import type { AnalyzableRepositoryFile } from "./repository-analyzer.service.js";

export type ArchitectureComponentType =
  | "frontend"
  | "api"
  | "backend"
  | "database"
  | "ai"
  | "external";

export type ArchitectureHealth =
  | "healthy"
  | "warning"
  | "risk";

export type ArchitectureFindingSeverity =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export interface ArchitectureComponentResult {
  key: string;
  name: string;
  type: ArchitectureComponentType;
  technology: string;
  description: string;
  files: string[];
  health: ArchitectureHealth;
}

export interface ArchitectureRelationshipResult {
  sourceKey: string;
  targetKey: string;
  relation: string;
  metadata: {
    sourceFile?: string;
    targetFile?: string;
    importPath?: string;
    language?: string;
  };
}

export interface ArchitectureFindingResult {
  severity: ArchitectureFindingSeverity;
  title: string;
  component: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface ArchitectureAnalysisResult {
  components: ArchitectureComponentResult[];
  relationships: ArchitectureRelationshipResult[];
  findings: ArchitectureFindingResult[];
  metrics: {
    componentCount: number;
    relationshipCount: number;
    findingCount: number;
    architectureHealth: number;
    circularDependencyCount: number;
    highFanOutComponentCount: number;
  };
}

/* -------------------------------------------------------------------------- */
/* Component detection                                                        */
/* -------------------------------------------------------------------------- */

interface ComponentDefinition {
  key: string;
  name: string;
  type: ArchitectureComponentType;
  technology: string;
  description: string;
  matcher: (filePath: string) => boolean;
}

const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    key: "frontend",
    name: "Frontend Application",
    type: "frontend",
    technology: "React + TypeScript",
    description:
      "User-facing application containing pages, components, routes and frontend services.",
    matcher: (filePath) =>
      /^frontend[\\/]/i.test(filePath) ||
      /^src[\\/](pages|components|routes|hooks|services)[\\/]/i.test(
        filePath,
      ),
  },

  {
    key: "api",
    name: "Application API",
    type: "api",
    technology: "Express + TypeScript",
    description:
      "HTTP API layer containing routes, controllers and request handling.",
    matcher: (filePath) =>
      /(^|[\\/])routes[\\/]/i.test(filePath) ||
      /(^|[\\/])controllers[\\/]/i.test(filePath) ||
      /(^|[\\/])app\.ts$/i.test(filePath) ||
      /(^|[\\/])server\.ts$/i.test(filePath),
  },

  {
    key: "backend",
    name: "Backend Services",
    type: "backend",
    technology: "Node.js + TypeScript",
    description:
      "Backend business logic, orchestration and repository analysis services.",
    matcher: (filePath) =>
      /^backend[\\/]/i.test(filePath) ||
      /(^|[\\/])services[\\/]/i.test(filePath) ||
      /(^|[\\/])middleware[\\/]/i.test(filePath),
  },

  {
    key: "ai",
    name: "AI Analysis Service",
    type: "ai",
    technology: "Python + FastAPI + LLM",
    description:
      "AI and machine-learning services responsible for intelligent code analysis.",
    matcher: (filePath) =>
      /^ai-service[\\/]/i.test(filePath) ||
      /^ai[\\/]/i.test(filePath) ||
      /(^|[\\/])rag[\\/]/i.test(filePath) ||
      /(^|[\\/])embeddings?[\\/]/i.test(filePath),
  },

  {
    key: "database",
    name: "Data Layer",
    type: "database",
    technology: "PostgreSQL + Prisma + pgvector",
    description:
      "Persistent data layer containing database schemas, migrations and ORM access.",
    matcher: (filePath) =>
      /(^|[\\/])prisma[\\/]/i.test(filePath) ||
      /(^|[\\/])migrations?[\\/]/i.test(filePath) ||
      /(^|[\\/])schema\.prisma$/i.test(filePath),
  },

  {
    key: "external",
    name: "External Integrations",
    type: "external",
    technology: "External APIs",
    description:
      "Integration points with GitHub, LLM providers and other external services.",
    matcher: (filePath) =>
      /(^|[\\/])(integrations?|providers?|github)[\\/]/i.test(
        filePath,
      ),
  },
];

/* -------------------------------------------------------------------------- */
/* Import extraction                                                          */
/* -------------------------------------------------------------------------- */

interface ImportReference {
  importPath: string;
  sourceFile: string;
  language: string;
}

function extractImports(
  file: AnalyzableRepositoryFile,
): ImportReference[] {
  const imports: ImportReference[] = [];

  const content = file.content;

  if (
    file.language === "typescript" ||
    file.language === "javascript"
  ) {
    const patterns = [
      /\bimport\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
      /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(content)) !== null) {
        imports.push({
          importPath: match[1],
          sourceFile: file.path,
          language: file.language,
        });
      }
    }
  }

  if (file.language === "python") {
    const fromPattern =
      /^\s*from\s+([a-zA-Z0-9_./-]+)\s+import\s+/gm;

    const importPattern =
      /^\s*import\s+([a-zA-Z0-9_., ]+)/gm;

    let match: RegExpExecArray | null;

    while ((match = fromPattern.exec(content)) !== null) {
      imports.push({
        importPath: match[1],
        sourceFile: file.path,
        language: file.language,
      });
    }

    while ((match = importPattern.exec(content)) !== null) {
      const values = match[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      for (const value of values) {
        imports.push({
          importPath: value.split(" as ")[0],
          sourceFile: file.path,
          language: file.language,
        });
      }
    }
  }

  if (file.language === "java") {
    const pattern =
      /^\s*import\s+([a-zA-Z0-9_.]+);/gm;

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      imports.push({
        importPath: match[1],
        sourceFile: file.path,
        language: file.language,
      });
    }
  }

  return imports;
}

/* -------------------------------------------------------------------------- */
/* Component resolution                                                       */
/* -------------------------------------------------------------------------- */

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function getComponentForFile(
  filePath: string,
): ComponentDefinition | null {
  const normalized = normalizePath(filePath);

  const exactMatches = COMPONENT_DEFINITIONS.filter(
    (component) => component.matcher(normalized),
  );

  if (exactMatches.length === 0) {
    return null;
  }

  /*
   * More specific components should win over the generic backend
   * component.
   */
  const priority: Record<string, number> = {
    frontend: 100,
    database: 95,
    ai: 90,
    external: 85,
    api: 80,
    backend: 50,
  };

  return exactMatches.sort(
    (a, b) =>
      (priority[b.key] ?? 0) -
      (priority[a.key] ?? 0),
  )[0];
}

function resolveImportToFile(
  sourceFile: string,
  importPath: string,
  files: Map<string, AnalyzableRepositoryFile>,
): string | null {
  if (!importPath.startsWith(".")) {
    return null;
  }

  const source = normalizePath(sourceFile);
  const sourceDirectory = source.includes("/")
    ? source.substring(0, source.lastIndexOf("/"))
    : "";

  const rawTarget = normalizePath(
    `${sourceDirectory}/${importPath}`,
  );

  const candidates = [
    rawTarget,
    `${rawTarget}.ts`,
    `${rawTarget}.tsx`,
    `${rawTarget}.js`,
    `${rawTarget}.jsx`,
    `${rawTarget}.py`,
    `${rawTarget}.java`,
    `${rawTarget}/index.ts`,
    `${rawTarget}/index.tsx`,
    `${rawTarget}/index.js`,
    `${rawTarget}/index.jsx`,
    `${rawTarget}/__init__.py`,
  ];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizePath(candidate);

    if (files.has(normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Technology detection                                                       */
/* -------------------------------------------------------------------------- */

function detectTechnology(
  files: AnalyzableRepositoryFile[],
): string {
  const languages = new Set(
    files.map((file) => file.language.toLowerCase()),
  );

  const technologies: string[] = [];

  if (languages.has("typescript")) {
    technologies.push("TypeScript");
  }

  if (languages.has("javascript")) {
    technologies.push("JavaScript");
  }

  if (languages.has("python")) {
    technologies.push("Python");
  }

  if (languages.has("java")) {
    technologies.push("Java");
  }

  if (languages.has("sql")) {
    technologies.push("SQL");
  }

  if (languages.has("html")) {
    technologies.push("HTML");
  }

  if (languages.has("css")) {
    technologies.push("CSS");
  }

  return technologies.length > 0
    ? technologies.join(" + ")
    : "Source Code";
}

/* -------------------------------------------------------------------------- */
/* Cycle detection                                                            */
/* -------------------------------------------------------------------------- */

function detectCycles(
  components: ArchitectureComponentResult[],
  relationships: ArchitectureRelationshipResult[],
): string[][] {
  const adjacency = new Map<string, string[]>();

  for (const component of components) {
    adjacency.set(component.key, []);
  }

  for (const relationship of relationships) {
    const list = adjacency.get(
      relationship.sourceKey,
    );

    if (list) {
      list.push(relationship.targetKey);
    }
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(
    node: string,
    path: string[],
  ): void {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);

      if (cycleStart >= 0) {
        cycles.push([
          ...path.slice(cycleStart),
          node,
        ]);
      }

      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);

    for (const next of adjacency.get(node) ?? []) {
      dfs(next, [...path, node]);
    }

    recursionStack.delete(node);
  }

  for (const component of components) {
    dfs(component.key, []);
  }

  return cycles;
}

/* -------------------------------------------------------------------------- */
/* Main analyzer                                                              */
/* -------------------------------------------------------------------------- */

export function analyzeArchitecture(
  repositoryFiles: AnalyzableRepositoryFile[],
): ArchitectureAnalysisResult {
  const fileMap = new Map<string, AnalyzableRepositoryFile>();

  for (const file of repositoryFiles) {
    fileMap.set(normalizePath(file.path), file);
  }

  const componentFiles = new Map<
    string,
    AnalyzableRepositoryFile[]
  >();

  for (const file of repositoryFiles) {
    const component =
      getComponentForFile(file.path);

    if (!component) {
      continue;
    }

    const existing =
      componentFiles.get(component.key) ?? [];

    existing.push(file);

    componentFiles.set(component.key, existing);
  }

  /*
   * Only create components which actually contain source files.
   */
  const components: ArchitectureComponentResult[] =
    COMPONENT_DEFINITIONS.filter((definition) =>
      componentFiles.has(definition.key),
    ).map((definition) => {
      const files =
        componentFiles.get(definition.key) ?? [];

      return {
        key: definition.key,
        name: definition.name,
        type: definition.type,
        technology: detectTechnology(files),
        description: definition.description,
        files: files.map((file) => file.path),
        health: "healthy",
      };
    });

  const componentMap = new Map(
    components.map((component) => [
      component.key,
      component,
    ]),
  );

  const relationships: ArchitectureRelationshipResult[] =
    [];

  const relationshipKeys = new Set<string>();

  for (const file of repositoryFiles) {
    const sourceComponent =
      getComponentForFile(file.path);

    if (!sourceComponent) {
      continue;
    }

    const imports = extractImports(file);

    for (const imported of imports) {
      const resolvedFile =
        resolveImportToFile(
          file.path,
          imported.importPath,
          fileMap,
        );

      if (!resolvedFile) {
        continue;
      }

      const targetComponent =
        getComponentForFile(resolvedFile);

      if (!targetComponent) {
        continue;
      }

      if (
        sourceComponent.key ===
        targetComponent.key
      ) {
        continue;
      }

      if (!componentMap.has(targetComponent.key)) {
        continue;
      }

      const relationshipKey =
        `${sourceComponent.key}->${targetComponent.key}`;

      if (relationshipKeys.has(relationshipKey)) {
        continue;
      }

      relationshipKeys.add(relationshipKey);

      relationships.push({
        sourceKey: sourceComponent.key,
        targetKey: targetComponent.key,
        relation: "DEPENDS_ON",
        metadata: {
          sourceFile: file.path,
          targetFile: resolvedFile,
          importPath: imported.importPath,
          language: imported.language,
        },
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Fan-out / fan-in                                                        */
  /* ---------------------------------------------------------------------- */

  const outgoingCount = new Map<string, number>();
  const incomingCount = new Map<string, number>();

  for (const component of components) {
    outgoingCount.set(component.key, 0);
    incomingCount.set(component.key, 0);
  }

  for (const relationship of relationships) {
    outgoingCount.set(
      relationship.sourceKey,
      (outgoingCount.get(
        relationship.sourceKey,
      ) ?? 0) + 1,
    );

    incomingCount.set(
      relationship.targetKey,
      (incomingCount.get(
        relationship.targetKey,
      ) ?? 0) + 1,
    );
  }

  const highFanOutComponents =
    components.filter(
      (component) =>
        (outgoingCount.get(component.key) ?? 0) >= 4,
    );

  for (const component of highFanOutComponents) {
    component.health = "warning";
  }

  /* ---------------------------------------------------------------------- */
  /* Circular dependencies                                                    */
  /* ---------------------------------------------------------------------- */

  const cycles = detectCycles(
    components,
    relationships,
  );

  for (const cycle of cycles) {
    for (const key of cycle) {
      const component = componentMap.get(key);

      if (component) {
        component.health = "risk";
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Findings                                                                 */
  /* ---------------------------------------------------------------------- */

  const findings: ArchitectureFindingResult[] = [];

  for (const component of highFanOutComponents) {
    const count =
      outgoingCount.get(component.key) ?? 0;

    findings.push({
      severity:
        count >= 6 ? "HIGH" : "MEDIUM",
      title:
        "High architectural dependency fan-out",
      component: component.name,
      description:
        `${component.name} directly depends on ${count} architectural components.`,
      impact:
        "High fan-out increases coupling and makes changes to the component more likely to affect multiple parts of the system.",
      recommendation:
        "Review the component boundaries and consider introducing smaller services, adapters, or domain-specific interfaces.",
    });
  }

  if (cycles.length > 0) {
    for (const cycle of cycles.slice(0, 10)) {
      const readableCycle = cycle
        .map(
          (key) =>
            componentMap.get(key)?.name ?? key,
        )
        .join(" → ");

      findings.push({
        severity: "HIGH",
        title:
          "Circular architectural dependency detected",
        component:
          componentMap.get(cycle[0])?.name ??
          cycle[0],
        description:
          `The architecture contains a circular dependency: ${readableCycle}.`,
        impact:
          "Circular dependencies make module boundaries harder to reason about and can complicate testing, initialization and future refactoring.",
        recommendation:
          "Break the cycle by introducing a stable abstraction or moving shared responsibilities into a lower-level component.",
      });
    }
  }

  /*
   * Detect persistence coupling from the AI layer.
   */
  const aiToDatabase = relationships.some(
    (relationship) =>
      relationship.sourceKey === "ai" &&
      relationship.targetKey === "database",
  );

  if (aiToDatabase) {
    findings.push({
      severity: "MEDIUM",
      title:
        "AI service depends directly on persistence",
      component: "AI Analysis Service",
      description:
        "The AI analysis layer has a direct architectural dependency on the database layer.",
      impact:
        "Direct persistence coupling can make AI services harder to test, reuse and deploy independently.",
      recommendation:
        "Consider introducing a repository or data-access abstraction between AI processing and persistent storage.",
    });

    const aiComponent =
      componentMap.get("ai");

    if (aiComponent) {
      aiComponent.health =
        aiComponent.health === "risk"
          ? "risk"
          : "warning";
    }
  }

  /*
   * Detect frontend -> database coupling.
   */
  const frontendToDatabase =
    relationships.some(
      (relationship) =>
        relationship.sourceKey === "frontend" &&
        relationship.targetKey === "database",
    );

  if (frontendToDatabase) {
    findings.push({
      severity: "HIGH",
      title:
        "Frontend directly depends on database",
      component: "Frontend Application",
      description:
        "Frontend source code appears to directly depend on the persistence layer.",
      impact:
        "Direct database coupling can expose persistence concerns to the client and weaken application boundaries.",
      recommendation:
        "Route persistence operations through the backend API instead of accessing the database directly from frontend code.",
    });

    const frontendComponent =
      componentMap.get("frontend");

    if (frontendComponent) {
      frontendComponent.health = "risk";
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Architecture health score                                               */
  /* ---------------------------------------------------------------------- */

  let architectureHealth = 100;

  architectureHealth -=
    highFanOutComponents.length * 7;

  architectureHealth -=
    cycles.length * 15;

  architectureHealth -=
    findings.filter(
      (finding) => finding.severity === "HIGH",
    ).length * 5;

  architectureHealth -=
    findings.filter(
      (finding) => finding.severity === "MEDIUM",
    ).length * 2;

  architectureHealth = Math.max(
    0,
    Math.min(100, architectureHealth),
  );

  return {
    components,
    relationships,
    findings,
    metrics: {
      componentCount: components.length,
      relationshipCount: relationships.length,
      findingCount: findings.length,
      architectureHealth,
      circularDependencyCount: cycles.length,
      highFanOutComponentCount:
        highFanOutComponents.length,
    },
  };
}