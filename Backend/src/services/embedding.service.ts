const OLLAMA_EMBEDDING_URL =
  process.env.OLLAMA_EMBEDDING_URL ||
  "http://localhost:11434/api/embeddings";

const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL ||
  "nomic-embed-text";

const EMBEDDING_TIMEOUT_MS = 30_000;

const EXPECTED_EMBEDDING_DIMENSION = 768;

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

interface OllamaEmbeddingResponse {
  embedding?: unknown;
}

export async function generateEmbedding(
  text: string,
): Promise<EmbeddingResult> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error(
      "Cannot generate an embedding for empty text",
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, EMBEDDING_TIMEOUT_MS);

  try {
    const response = await fetch(
      OLLAMA_EMBEDDING_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_EMBEDDING_MODEL,
          prompt: normalizedText,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama embedding request failed (${response.status}): ${errorText}`,
      );
    }

    const data =
      (await response.json()) as OllamaEmbeddingResponse;

    if (!Array.isArray(data.embedding)) {
      throw new Error(
        "Ollama embedding response did not contain a valid embedding array",
      );
    }

    const embedding = data.embedding.filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isFinite(value),
    );

    if (
      embedding.length !==
      EXPECTED_EMBEDDING_DIMENSION
    ) {
      throw new Error(
        `Unexpected embedding dimension: expected ${EXPECTED_EMBEDDING_DIMENSION}, received ${embedding.length}`,
      );
    }

    return {
      embedding,
      model: OLLAMA_EMBEDDING_MODEL,
      dimensions: embedding.length,
    };
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        `Ollama embedding request timed out after ${EMBEDDING_TIMEOUT_MS / 1000}s`,
      );
    }

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        `Ollama embedding request timed out after ${EMBEDDING_TIMEOUT_MS / 1000}s`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}