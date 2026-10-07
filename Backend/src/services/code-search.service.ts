import { prisma } from "../lib/prisma.js";
import { generateEmbedding } from "./embedding.service.js";

export interface CodeSearchResult {
  filePath: string;
  symbolName: string | null;
  startLine: number | null;
  endLine: number | null;
  language: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

type RetrievalIntent =
  | "ENDPOINT"
  | "AUTH"
  | "SECURITY"
  | "DATABASE"
  | "AI_RAG"
  | "DEPENDENCY"
  | "PERFORMANCE"
  | "IMPLEMENTATION"
  | "GENERAL";

interface SearchCandidate {
  filePath: string;
  symbolName: string | null;
  startLine: number | null;
  endLine: number | null;
  language: string;
  content: string;
  metadata: Record<string, unknown> | null;

  semanticSimilarity: number;
  lexicalScore: number;
  keywordScore: number;
  structuralScore: number;
  finalScore: number;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "was",
  "where",
  "what",
  "which",
  "who",
  "why",
  "with",
]);

const ENDPOINT_TERMS = [
  "endpoint",
  "route",
  "routes",
  "api",
  "http",
  "request",
  "response",
  "post",
  "get",
  "put",
  "patch",
  "delete",
  "controller",
  "router",
  "url",
  "path",
  "implemented",
];

const AUTH_TERMS = [
  "auth",
  "authentication",
  "authorization",
  "login",
  "register",
  "token",
  "jwt",
  "session",
  "oauth",
  "password",
];

const SECURITY_TERMS = [
  "security",
  "vulnerability",
  "secret",
  "injection",
  "xss",
  "csrf",
  "attack",
  "scanner",
  "semgrep",
];

const DATABASE_TERMS = [
  "database",
  "db",
  "postgres",
  "postgresql",
  "prisma",
  "query",
  "model",
  "schema",
  "repository",
];

const AI_RAG_TERMS = [
  "ai",
  "llm",
  "rag",
  "embedding",
  "embeddings",
  "vector",
  "semantic",
  "ollama",
  "chat",
  "codebase",
];

const DEPENDENCY_TERMS = [
  "dependency",
  "dependencies",
  "package",
  "npm",
  "requirements",
  "vulnerability",
  "osv",
];

const PERFORMANCE_TERMS = [
  "performance",
  "latency",
  "slow",
  "optimization",
  "memory",
  "cpu",
  "cache",
  "benchmark",
];

const IMPLEMENTATION_TERMS = [
  "implemented",
  "implementation",
  "logic",
  "function",
  "method",
  "code",
  "works",
  "handled",
];

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9_./:-]+/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(
      (term) =>
        term.length >= 2 &&
        !STOP_WORDS.has(term),
    );
}

function detectIntent(query: string): RetrievalIntent {
  const lower = query.toLowerCase();
  const tokens = tokenize(query);

  const has = (terms: string[]) =>
    terms.some(
      (term) =>
        lower.includes(term) ||
        tokens.includes(term),
    );

  if (
    has(ENDPOINT_TERMS) ||
    /\bwhere\b.*\b(endpoint|route|api)\b/i.test(query) ||
    /\b(endpoint|route|api)\b.*\bimplemented\b/i.test(query)
  ) {
    return "ENDPOINT";
  }

  if (has(AUTH_TERMS)) {
    return "AUTH";
  }

  if (has(SECURITY_TERMS)) {
    return "SECURITY";
  }

  if (has(DATABASE_TERMS)) {
    return "DATABASE";
  }

  if (has(AI_RAG_TERMS)) {
    return "AI_RAG";
  }

  if (has(DEPENDENCY_TERMS)) {
    return "DEPENDENCY";
  }

  if (has(PERFORMANCE_TERMS)) {
    return "PERFORMANCE";
  }

  if (has(IMPLEMENTATION_TERMS)) {
    return "IMPLEMENTATION";
  }

  return "GENERAL";
}

function getIntentTerms(intent: RetrievalIntent): string[] {
  switch (intent) {
    case "ENDPOINT":
      return ENDPOINT_TERMS;

    case "AUTH":
      return AUTH_TERMS;

    case "SECURITY":
      return SECURITY_TERMS;

    case "DATABASE":
      return DATABASE_TERMS;

    case "AI_RAG":
      return AI_RAG_TERMS;

    case "DEPENDENCY":
      return DEPENDENCY_TERMS;

    case "PERFORMANCE":
      return PERFORMANCE_TERMS;

    case "IMPLEMENTATION":
      return IMPLEMENTATION_TERMS;

    default:
      return [];
  }
}

function getKeywordScore(
  candidate: {
    filePath: string;
    symbolName: string | null;
    content: string;
  },
  queryTokens: string[],
  intent: RetrievalIntent,
): number {
  if (queryTokens.length === 0) {
    return 0;
  }

  const path = candidate.filePath.toLowerCase();
  const symbol = (candidate.symbolName ?? "").toLowerCase();
  const content = candidate.content.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    if (path.includes(token)) {
      score += 0.45;
    }

    if (symbol.includes(token)) {
      score += 0.35;
    }

    if (content.includes(token)) {
      score += 0.20;
    }
  }

  const intentTerms = getIntentTerms(intent);

  for (const term of intentTerms) {
    if (path.includes(term)) {
      score += 0.20;
    }

    if (symbol.includes(term)) {
      score += 0.15;
    }

    if (content.includes(term)) {
      score += 0.05;
    }
  }

  return Math.min(1, score);
}

function getStructuralScore(
  candidate: {
    filePath: string;
    symbolName: string | null;
    content: string;
  },
  query: string,
  intent: RetrievalIntent,
): number {
  const path = candidate.filePath.toLowerCase();
  const symbol = (candidate.symbolName ?? "").toLowerCase();
  const content = candidate.content.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let score = 0;

  const isRouteFile =
    path.endsWith(".routes.ts") ||
    path.endsWith(".routes.js") ||
    path.includes("/routes/");

  const isControllerFile =
    path.endsWith(".controller.ts") ||
    path.endsWith(".controller.js") ||
    path.includes("/controllers/");

  const isServiceFile =
    path.endsWith(".service.ts") ||
    path.endsWith(".service.js") ||
    path.includes("/services/");

  const isBackend =
    path.includes("/backend/") ||
    path.startsWith("backend/");

  if (isBackend) {
    score += 10;
  }

  if (intent === "ENDPOINT") {
    if (isRouteFile) {
      score += 100;
    }

    if (isControllerFile) {
      score += 78;
    }

    if (
      content.includes("router.") ||
      content.includes("router =") ||
      content.includes("express.router")
    ) {
      score += 30;
    }

    if (
      /\brouter\.(get|post|put|patch|delete|use)\s*\(/i.test(
        content,
      )
    ) {
      score += 45;
    }

    if (
      content.includes("/api/") ||
      content.includes("/:projectid") ||
      content.includes(":projectid") ||
      content.includes("projectid")
    ) {
      score += 20;
    }

    if (
      symbol.includes("controller") ||
      symbol.includes("route") ||
      symbol.includes("endpoint")
    ) {
      score += 20;
    }

    if (isServiceFile) {
      score -= 55;
    }

    if (
      path.includes("/frontend/") ||
      path.includes("\\frontend\\")
    ) {
      score -= 35;
    }

    const featureTerms = lowerQuery
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(
        (term) =>
          term.length >= 4 &&
          !STOP_WORDS.has(term) &&
          !ENDPOINT_TERMS.includes(term),
      );

    for (const term of featureTerms) {
      if (path.includes(term)) {
        score += 35;
      }

      if (symbol.includes(term)) {
        score += 25;
      }

      if (content.includes(term)) {
        score += 10;
      }
    }
  } else {
    if (isBackend) {
      score += 8;
    }

    if (isControllerFile) {
      score += 20;
    }

    if (isServiceFile) {
      score += 12;
    }

    if (
      intent === "AUTH" &&
      path.includes("auth")
    ) {
      score += 35;
    }

    if (
      intent === "SECURITY" &&
      (path.includes("security") ||
        path.includes("scanner"))
    ) {
      score += 35;
    }

    if (
      intent === "DATABASE" &&
      (path.includes("database") ||
        path.includes("prisma") ||
        path.includes("repository"))
    ) {
      score += 35;
    }

    if (
      intent === "AI_RAG" &&
      (path.includes("embedding") ||
        path.includes("rag") ||
        path.includes("chat") ||
        path.includes("ai"))
    ) {
      score += 35;
    }

    if (
      intent === "DEPENDENCY" &&
      path.includes("depend")
    ) {
      score += 35;
    }

    if (
      intent === "PERFORMANCE" &&
      path.includes("performance")
    ) {
      score += 35;
    }
  }

  return Math.max(
    0,
    Math.min(1, score / 180),
  );
}

function calculateFinalScore(
  candidate: SearchCandidate,
  intent: RetrievalIntent,
): number {
  if (intent === "ENDPOINT") {
    return (
      candidate.semanticSimilarity * 0.20 +
      candidate.lexicalScore * 0.10 +
      candidate.structuralScore * 0.55 +
      candidate.keywordScore * 0.15
    );
  }

  if (
    intent === "AUTH" ||
    intent === "SECURITY" ||
    intent === "DATABASE" ||
    intent === "AI_RAG" ||
    intent === "DEPENDENCY" ||
    intent === "PERFORMANCE"
  ) {
    return (
      candidate.semanticSimilarity * 0.40 +
      candidate.lexicalScore * 0.10 +
      candidate.structuralScore * 0.35 +
      candidate.keywordScore * 0.15
    );
  }

  if (intent === "IMPLEMENTATION") {
    return (
      candidate.semanticSimilarity * 0.50 +
      candidate.lexicalScore * 0.10 +
      candidate.structuralScore * 0.25 +
      candidate.keywordScore * 0.15
    );
  }

  return (
    candidate.semanticSimilarity * 0.60 +
    candidate.lexicalScore * 0.10 +
    candidate.structuralScore * 0.15 +
    candidate.keywordScore * 0.15
  );
}

function createCandidateKey(
  candidate: {
    filePath: string;
    symbolName: string | null;
    startLine: number | null;
    endLine: number | null;
  },
): string {
  return [
    candidate.filePath,
    candidate.symbolName ?? "",
    candidate.startLine ?? "",
    candidate.endLine ?? "",
  ].join("|");
}

function buildLexicalQuery(query: string): string {
  return tokenize(query).join(" ");
}

async function getSemanticCandidates(
  repositoryId: string,
  embedding: number[],
  limit: number,
): Promise<SearchCandidate[]> {
  const embeddingLiteral = `[${embedding.join(",")}]`;

  const rows = await prisma.$queryRaw<
    Array<{
      filePath: string;
      symbolName: string | null;
      startLine: number | null;
      endLine: number | null;
      language: string;
      content: string;
      metadata: unknown;
      similarity: number;
    }>
  >`
    SELECT
      "filePath",
      "symbolName",
      "startLine",
      "endLine",
      "language",
      "content",
      "metadata",
      1 - ("embedding" <=> ${embeddingLiteral}::vector) AS "similarity"
    FROM "CodeChunk"
    WHERE
      "repositoryId" = ${repositoryId}
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${embeddingLiteral}::vector
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    filePath: row.filePath,
    symbolName: row.symbolName,
    startLine: row.startLine,
    endLine: row.endLine,
    language: row.language,
    content: row.content,
    metadata:
      row.metadata &&
      typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    semanticSimilarity:
      Number(row.similarity) || 0,
    lexicalScore: 0,
    keywordScore: 0,
    structuralScore: 0,
    finalScore: 0,
  }));
}

async function getLexicalCandidates(
  repositoryId: string,
  query: string,
  limit: number,
): Promise<SearchCandidate[]> {
  const lexicalQuery =
    buildLexicalQuery(query);

  if (!lexicalQuery) {
    return [];
  }

  const rows = await prisma.$queryRaw<
    Array<{
      filePath: string;
      symbolName: string | null;
      startLine: number | null;
      endLine: number | null;
      language: string;
      content: string;
      metadata: unknown;
      lexicalScore: number;
    }>
  >`
    SELECT
      "filePath",
      "symbolName",
      "startLine",
      "endLine",
      "language",
      "content",
      "metadata",
      ts_rank_cd(
        to_tsvector(
          'simple',
          coalesce("filePath", '') || ' ' ||
          coalesce("symbolName", '') || ' ' ||
          coalesce("content", '')
        ),
        plainto_tsquery(
          'simple',
          ${lexicalQuery}
        )
      ) AS "lexicalScore"
    FROM "CodeChunk"
    WHERE
      "repositoryId" = ${repositoryId}
      AND to_tsvector(
        'simple',
        coalesce("filePath", '') || ' ' ||
        coalesce("symbolName", '') || ' ' ||
        coalesce("content", '')
      ) @@ plainto_tsquery(
        'simple',
        ${lexicalQuery}
      )
    ORDER BY "lexicalScore" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    filePath: row.filePath,
    symbolName: row.symbolName,
    startLine: row.startLine,
    endLine: row.endLine,
    language: row.language,
    content: row.content,
    metadata:
      row.metadata &&
      typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    semanticSimilarity: 0,
    lexicalScore: Math.min(
      1,
      Number(row.lexicalScore) || 0,
    ),
    keywordScore: 0,
    structuralScore: 0,
    finalScore: 0,
  }));
}

async function getEndpointCandidates(
  repositoryId: string,
  query: string,
  limit: number,
): Promise<SearchCandidate[]> {
  const queryTokens = tokenize(query).filter(
    (token) =>
      !ENDPOINT_TERMS.includes(token) &&
      token.length >= 3,
  );

  const rows = await prisma.$queryRaw<
    Array<{
      filePath: string;
      symbolName: string | null;
      startLine: number | null;
      endLine: number | null;
      language: string;
      content: string;
      metadata: unknown;
    }>
  >`
    SELECT
      "filePath",
      "symbolName",
      "startLine",
      "endLine",
      "language",
      "content",
      "metadata"
    FROM "CodeChunk"
    WHERE
      "repositoryId" = ${repositoryId}
      AND (
        lower("filePath") LIKE '%routes.%'
        OR lower("filePath") LIKE '%/routes/%'
        OR lower("filePath") LIKE '%controllers.%'
        OR lower("filePath") LIKE '%/controllers/%'
      )
    ORDER BY
      CASE
        WHEN lower("filePath") LIKE '%routes.%'
          THEN 0
        WHEN lower("filePath") LIKE '%/routes/%'
          THEN 0
        ELSE 1
      END,
      "filePath",
      "startLine"
    LIMIT ${limit}
  `;

  const filtered = rows.filter((row) => {
    if (queryTokens.length === 0) {
      return true;
    }

    const haystack = [
      row.filePath,
      row.symbolName ?? "",
      row.content,
    ]
      .join(" ")
      .toLowerCase();

    return queryTokens.some((token) =>
      haystack.includes(token),
    );
  });

  return filtered.map((row) => ({
    filePath: row.filePath,
    symbolName: row.symbolName,
    startLine: row.startLine,
    endLine: row.endLine,
    language: row.language,
    content: row.content,
    metadata:
      row.metadata &&
      typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    semanticSimilarity: 0,
    lexicalScore: 0,
    keywordScore: 0,
    structuralScore: 0,
    finalScore: 0,
  }));
}

export async function searchCode(
  repositoryId: string,
  query: string,
  options: {
    topK?: number;
    minSimilarity?: number;
  } = {},
): Promise<CodeSearchResult[]> {
  const topK = Math.min(
    Math.max(options.topK ?? 8, 1),
    20,
  );

  const minSimilarity =
    options.minSimilarity ?? 0.35;

  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const intent =
    detectIntent(normalizedQuery);

  const queryTokens =
    tokenize(normalizedQuery);

  const embeddingResult =
  await generateEmbedding(
    normalizedQuery,
  );

const embedding =
  embeddingResult.embedding;
  

  const [
    semanticCandidates,
    lexicalCandidates,
    endpointCandidates,
  ] = await Promise.all([
    getSemanticCandidates(
      repositoryId,
      embedding,
      40,
    ),

    getLexicalCandidates(
      repositoryId,
      normalizedQuery,
      60,
    ),

    intent === "ENDPOINT"
      ? getEndpointCandidates(
          repositoryId,
          normalizedQuery,
          80,
        )
      : Promise.resolve([]),
  ]);

  const candidates = new Map<
    string,
    SearchCandidate
  >();

  const mergeCandidate = (
    candidate: SearchCandidate,
  ) => {
    const key =
      createCandidateKey(candidate);

    const existing =
      candidates.get(key);

    if (!existing) {
      candidates.set(key, {
        ...candidate,
      });

      return;
    }

    existing.semanticSimilarity =
      Math.max(
        existing.semanticSimilarity,
        candidate.semanticSimilarity,
      );

    existing.lexicalScore =
      Math.max(
        existing.lexicalScore,
        candidate.lexicalScore,
      );
  };

  for (const candidate of semanticCandidates) {
    mergeCandidate(candidate);
  }

  for (const candidate of lexicalCandidates) {
    mergeCandidate(candidate);
  }

  for (const candidate of endpointCandidates) {
    mergeCandidate(candidate);
  }

  for (const candidate of candidates.values()) {
    candidate.keywordScore =
      getKeywordScore(
        candidate,
        queryTokens,
        intent,
      );

    candidate.structuralScore =
      getStructuralScore(
        candidate,
        normalizedQuery,
        intent,
      );

    candidate.finalScore =
      calculateFinalScore(
        candidate,
        intent,
      );
  }

  let ranked =
    [...candidates.values()].sort(
      (a, b) => {
        if (
          b.finalScore !==
          a.finalScore
        ) {
          return (
            b.finalScore -
            a.finalScore
          );
        }

        return (
          b.semanticSimilarity -
          a.semanticSimilarity
        );
      },
    );

  if (intent === "ENDPOINT") {
    ranked = ranked.filter(
      (candidate) => {
        const endpointStructural =
          candidate.structuralScore >=
          0.25;

        const semanticMatch =
          candidate.semanticSimilarity >=
          minSimilarity;

        return (
          semanticMatch ||
          endpointStructural
        );
      },
    );
  } else {
    ranked = ranked.filter(
      (candidate) =>
        candidate.semanticSimilarity >=
          minSimilarity ||
        candidate.lexicalScore > 0 ||
        candidate.keywordScore >= 0.35,
    );
  }

  /*
   * For endpoint questions, route/controller
   * candidates should be represented before
   * unrelated services.
   */
  if (intent === "ENDPOINT") {
    const endpointCandidatesRanked =
      ranked.filter((candidate) => {
        const path =
          candidate.filePath.toLowerCase();

        return (
          path.includes("/routes/") ||
          path.includes("/controllers/") ||
          path.endsWith(".routes.ts") ||
          path.endsWith(".routes.js") ||
          path.endsWith(".controller.ts") ||
          path.endsWith(".controller.js")
        );
      });

    const otherCandidates =
      ranked.filter(
        (candidate) =>
          !endpointCandidatesRanked.includes(
            candidate,
          ),
      );

    ranked = [
      ...endpointCandidatesRanked,
      ...otherCandidates,
    ];
  }

  return ranked
    .slice(0, topK)
    .map((candidate) => ({
      filePath: candidate.filePath,
      symbolName: candidate.symbolName,
      startLine: candidate.startLine,
      endLine: candidate.endLine,
      language: candidate.language,
      content: candidate.content,
      similarity:
        candidate.semanticSimilarity,
      metadata: candidate.metadata,
    }));
}