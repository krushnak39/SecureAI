import { prisma } from "../lib/prisma.js";
import {
  searchCode,
  type CodeSearchResult,
} from "./code-search.service.js";

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434/api/chat";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b";

const OLLAMA_CHAT_TIMEOUT_MS = 90_000;

const MAX_SEARCH_RESULTS = 4;
const MAX_CONTEXT_CHARS = 8_000;
const MAX_HISTORY_MESSAGES = 4;
const MAX_HISTORY_CHARS = 4_000;
const MAX_CHARS_PER_RESULT = 2_000;

export interface CodebaseChatRequest {
  projectId: string;
  userId: string;
  message: string;
  sessionId?: string;
}

export interface CodebaseChatCitation {
  index: number;
  filePath: string;
  symbolName: string | null;
  startLine: number | null;
  endLine: number | null;
  similarity: number;
}

export interface CodebaseChatResponse {
  sessionId: string;
  answer: string;
  citations: CodebaseChatCitation[];
}

interface OllamaChatResponse {
  message?: {
    role?: string;
    content?: string;
  };
}

function truncate(
  value: string,
  maxLength: number,
): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n...[truncated]`;
}

function buildCodeContext(
  results: CodeSearchResult[],
): string {
  let totalLength = 0;
  const sections: string[] = [];

  for (
    let index = 0;
    index < results.length;
    index += 1
  ) {
    const result = results[index];

    const location =
      result.symbolName
        ? `${result.filePath}:${result.symbolName}`
        : result.filePath;

    const lines =
      result.startLine !== null
        ? `Lines ${result.startLine}-${result.endLine ?? result.startLine}`
        : "Line information unavailable";

    const section = `
[${index + 1}]
File: ${location}
${lines}
Similarity: ${result.similarity.toFixed(3)}

Code:
${truncate(
  result.content,
  MAX_CHARS_PER_RESULT,
)}
`.trim();

    if (
      totalLength + section.length >
      MAX_CONTEXT_CHARS
    ) {
      break;
    }

    sections.push(section);
    totalLength += section.length;
  }

  return sections.join("\n\n");
}

async function generateChatAnswer(
  message: string,
  history: Array<{
    role: string;
    content: string;
  }>,
  codeContext: string,
): Promise<string> {
  const systemPrompt = `
You are SecureAI Codebase Chat, an AI assistant that answers questions
about a software repository.

Rules:
- Answer using the supplied repository context whenever possible.
- Do not invent files, functions, classes, APIs, dependencies, or behavior.
- If the supplied context is insufficient, clearly say that the available
  code context is insufficient to determine the answer.
- Prefer concrete references to files, symbols, and line ranges.
- When referring to retrieved context, use citation markers like [1], [2].
- Only use citation numbers that actually exist in the supplied context.
- Explain technical concepts clearly and concisely.
- You may make reasonable conclusions from the supplied code, but distinguish
  direct evidence from inference.
`.trim();

  const historyText =
    history.length > 0
      ? history
          .map(
            (item) =>
              `${item.role.toUpperCase()}: ${truncate(
                item.content,
                1200,
              )}`,
          )
          .join("\n\n")
      : "No previous conversation.";

  const userPrompt = `
Previous conversation:
${truncate(
  historyText,
  MAX_HISTORY_CHARS,
)}

Repository code context:
${codeContext || "No relevant code context was found."}

Current user question:
${message}

Answer the question using the repository context above.
Be concise and technically precise.
Include [1], [2], etc. when making claims supported by retrieved code.
`.trim();

  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, OLLAMA_CHAT_TIMEOUT_MS);

  try {
    const response = await fetch(
      OLLAMA_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          keep_alive: "10m",
          options: {
            temperature: 0,
            num_predict: 350,
            num_ctx: 4096,
          },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Ollama chat request failed (${response.status}): ${errorText}`,
      );
    }

    const data =
      (await response.json()) as OllamaChatResponse;

    const answer =
      data.message?.content?.trim();

    if (!answer) {
      throw new Error(
        "Ollama returned an empty codebase chat response.",
      );
    }

    return answer;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        `Ollama codebase chat timed out after ${OLLAMA_CHAT_TIMEOUT_MS / 1000}s`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildCitations(
  results: CodeSearchResult[],
): CodebaseChatCitation[] {
  return results.map(
    (result, index) => ({
      index: index + 1,
      filePath: result.filePath,
      symbolName: result.symbolName,
      startLine: result.startLine,
      endLine: result.endLine,
      similarity: result.similarity,
    }),
  );
}

export async function runCodebaseChat(
  request: CodebaseChatRequest,
): Promise<CodebaseChatResponse> {
  const normalizedMessage =
    request.message.trim();

  if (!normalizedMessage) {
    throw new Error(
      "Chat message cannot be empty.",
    );
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id: request.projectId,
        ownerId: request.userId,
      },
      include: {
        repositories: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

  if (!project) {
    throw new Error(
      "Project not found.",
    );
  }

  const repository =
    project.repositories[0];

  if (!repository) {
    throw new Error(
      "No repository connected to this project.",
    );
  }

  let session;

  if (request.sessionId) {
    session =
      await prisma.chatSession.findFirst({
        where: {
          id: request.sessionId,
          userId: request.userId,
          repositoryId: repository.id,
        },
      });

    if (!session) {
      throw new Error(
        "Chat session not found.",
      );
    }
  } else {
    session =
      await prisma.chatSession.create({
        data: {
          userId: request.userId,
          repositoryId: repository.id,
          title: normalizedMessage.slice(
            0,
            80,
          ),
        },
      });
  }

  const previousMessages =
    await prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_HISTORY_MESSAGES,
      select: {
        role: true,
        content: true,
      },
    });

  const history =
    previousMessages.reverse();

  const searchResults =
    await searchCode(
      repository.id,
      normalizedMessage,
      {
        topK: MAX_SEARCH_RESULTS,
        minSimilarity: 0.35,
      },
    );

  const codeContext =
    buildCodeContext(searchResults);

  const answer =
    await generateChatAnswer(
      normalizedMessage,
      history,
      codeContext,
    );

  const citations =
    buildCitations(searchResults);

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "USER",
      content: normalizedMessage,
    },
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: answer,
      citations: JSON.parse(
        JSON.stringify(citations),
      ),
    },
  });

  return {
    sessionId: session.id,
    answer,
    citations,
  };
}