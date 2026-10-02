import {
  generateEmbedding,
} from "./embedding.service.js";

export interface CodeSearchResult {
  id: string;
  filePath: string;
  symbolName: string | null;
  startLine: number | null;
  endLine: number | null;
  language: string;
  content: string;
  similarity: number;
}

interface CodeSearchRow {
  id: string;
  filePath: string;
  symbolName: string | null;
  startLine: number | null;
  endLine: number | null;
  language: string;
  content: string;
  similarity: number;
}

const DEFAULT_TOP_K = 8;
const MAX_TOP_K = 20;
const DEFAULT_MIN_SIMILARITY = 0.35;

export async function searchCode(
  repositoryId: string,
  query: string,
  options: {
    topK?: number;
    minSimilarity?: number;
  } = {},
): Promise<CodeSearchResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new Error(
      "Code search query cannot be empty",
    );
  }

  if (!repositoryId.trim()) {
    throw new Error(
      "Repository ID is required for code search",
    );
  }

  const topK = Math.min(
    Math.max(
      Math.floor(
        options.topK ?? DEFAULT_TOP_K,
      ),
      1,
    ),
    MAX_TOP_K,
  );

  const minSimilarity =
    options.minSimilarity ??
    DEFAULT_MIN_SIMILARITY;

  if (
    !Number.isFinite(minSimilarity) ||
    minSimilarity < 0 ||
    minSimilarity > 1
  ) {
    throw new Error(
      "Minimum similarity must be between 0 and 1",
    );
  }

  const embeddingResult =
    await generateEmbedding(normalizedQuery);

  const embeddingLiteral =
    `[${embeddingResult.embedding.join(",")}]`;

  const prisma =
    await import("../lib/prisma.js");

  const rows =
    await prisma.prisma.$queryRaw<
      CodeSearchRow[]
    >`
      SELECT
        "id",
        "filePath",
        "symbolName",
        "startLine",
        "endLine",
        "language"::text AS "language",
        "content",
        1 - (
          "embedding" <=> ${embeddingLiteral}::vector
        ) AS "similarity"
      FROM "CodeChunk"
      WHERE
        "repositoryId" = ${repositoryId}
        AND "embedding" IS NOT NULL
      ORDER BY
        "embedding" <=> ${embeddingLiteral}::vector
      LIMIT ${topK}
    `;

  return rows
    .map((row) => ({
      ...row,
      similarity: Number(row.similarity),
    }))
    .filter(
      (row) =>
        row.similarity >= minSimilarity,
    );
}