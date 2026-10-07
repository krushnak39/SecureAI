import { prisma } from "../lib/prisma.js";
import { generateEmbedding } from "./embedding.service.js";

const DEFAULT_EMBEDDING_CONCURRENCY = 2;
const MAX_EMBEDDING_CONCURRENCY = 4;

interface EmbeddableCodeChunk {
  id: string;
  filePath: string;
  symbolName: string | null;
  content: string;
}

export interface CodeEmbeddingResult {
  eligible: number;
  embedded: number;
  failed: number;
}

function getEmbeddingConcurrency(): number {
  const configured = Number.parseInt(
    process.env.EMBEDDING_CONCURRENCY ||
      String(DEFAULT_EMBEDDING_CONCURRENCY),
    10,
  );

  if (!Number.isFinite(configured)) {
    return DEFAULT_EMBEDDING_CONCURRENCY;
  }

  return Math.min(
    Math.max(configured, 1),
    MAX_EMBEDDING_CONCURRENCY,
  );
}

/**
 * Generate and persist embeddings for all embedding-eligible
 * CodeChunk rows belonging to a repository.
 *
 * Embedding failures are isolated per chunk so that an Ollama
 * failure does not fail the entire repository analysis.
 */
export async function embedRepositoryCodeChunks(
  repositoryId: string,
): Promise<CodeEmbeddingResult> {
  const rows = await prisma.codeChunk.findMany({
    where: {
      repositoryId,
    },
    select: {
      id: true,
      filePath: true,
      symbolName: true,
      content: true,
      metadata: true,
    },
  });

  const chunks: EmbeddableCodeChunk[] =
    rows
      .filter((row) => {
        if (
          !row.metadata ||
          typeof row.metadata !== "object" ||
          Array.isArray(row.metadata)
        ) {
          return false;
        }

        return (
          (row.metadata as Record<string, unknown>)
            .embeddingEligible === true
        );
      })
      .map((row) => ({
        id: row.id,
        filePath: row.filePath,
        symbolName: row.symbolName,
        content: row.content,
      }));

  const result: CodeEmbeddingResult = {
    eligible: chunks.length,
    embedded: 0,
    failed: 0,
  };

  if (chunks.length === 0) {
    console.log(
      "[SecureAI Embeddings] No embedding-eligible code chunks found.",
    );

    return result;
  }

  const concurrency =
    getEmbeddingConcurrency();

  console.log(
    `[SecureAI Embeddings] Generating embeddings for ${chunks.length} chunks with concurrency=${concurrency}...`,
  );

  let nextIndex = 0;

  async function worker(
    workerId: number,
  ): Promise<void> {
    while (true) {
      const index = nextIndex;

      if (index >= chunks.length) {
        return;
      }

      nextIndex += 1;

      const chunk = chunks[index];

      try {
        console.log(
          `[SecureAI Embeddings] Worker ${workerId} processing ${index + 1}/${chunks.length}: ${chunk.filePath}${chunk.symbolName ? `:${chunk.symbolName}` : ""}`,
        );

        const embeddingResult =
          await generateEmbedding(
            chunk.content,
          );

        const embeddingLiteral =
          `[${embeddingResult.embedding.join(",")}]`;

        await prisma.$executeRaw`
          UPDATE "CodeChunk"
          SET "embedding" =
            ${embeddingLiteral}::vector
          WHERE "id" = ${chunk.id}
        `;

        result.embedded += 1;

        console.log(
          `[SecureAI Embeddings] Embedded ${index + 1}/${chunks.length} | ${chunk.filePath}${chunk.symbolName ? `:${chunk.symbolName}` : ""} | dimensions=${embeddingResult.dimensions}`,
        );
      } catch (error) {
        result.failed += 1;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          `[SecureAI Embeddings] Failed ${index + 1}/${chunks.length} for ${chunk.filePath}${chunk.symbolName ? `:${chunk.symbolName}` : ""}: ${message}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrency,
          chunks.length,
        ),
      },
      (_, index) => worker(index + 1),
    ),
  );

  console.log(
    `[SecureAI Embeddings] Completed: ${result.embedded}/${result.eligible} embedded, ${result.failed} failed.`,
  );

  return result;
}