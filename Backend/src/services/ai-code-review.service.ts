const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/chat";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

const OLLAMA_TIMEOUT_MS = 90_000;

export interface AIReviewRequest {
  filePath: string;
  language: string;
  code: string;
  finding: {
    severity: string;
    category: string;
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    lineStart: number;
    lineEnd: number;
    functionName: string | null;
    rule: string;
    evidence: string;
  };
}

export interface AIReviewResult {
  explanation: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  suggestedFix: string;
  confidence: number;
}

const AI_REVIEW_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "explanation",
    "rootCause",
    "impact",
    "recommendation",
    "suggestedFix",
    "confidence",
  ],
  properties: {
    explanation: {
      type: "string",
    },
    rootCause: {
      type: "string",
    },
    impact: {
      type: "string",
    },
    recommendation: {
      type: "string",
    },
    suggestedFix: {
      type: "string",
    },
    confidence: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
  },
};

export async function reviewFindingWithAI(
  request: AIReviewRequest,
): Promise<AIReviewResult> {
  const systemPrompt = `
You are SecureAI, a software engineering and security code reviewer.

Analyze the static finding and source context.

Rules:
- Only use facts supported by the supplied code.
- Do not automatically call a finding a vulnerability.
- Explain false positives when appropriate.
- Give practical remediation.
- Keep every answer concise.
- Confidence must be an integer from 0 to 100.
- Return only JSON matching the supplied schema.
`.trim();

  const userPrompt = `
File: ${request.filePath}
Language: ${request.language}
Function: ${request.finding.functionName || "Unknown"}

Finding:
${request.finding.title}

Severity: ${request.finding.severity}
Category: ${request.finding.category}
Rule: ${request.finding.rule}
Lines: ${request.finding.lineStart}-${request.finding.lineEnd}

Description:
${request.finding.description}

Evidence:
${request.finding.evidence}

Static impact:
${request.finding.impact}

Existing recommendation:
${request.finding.recommendation}

Source:
${request.code}
`.trim();

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,

        format: AI_REVIEW_JSON_SCHEMA,

        options: {
          temperature: 0,
          num_predict: 400,
          num_ctx: 4096,
        },

        keep_alive: "10m",

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
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama request failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as OllamaChatResponse;

    const rawText = data.message?.content?.trim();

    if (!rawText) {
      throw new Error(
        "Ollama AI review returned an empty response",
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(
        `Ollama AI review returned invalid JSON: ${rawText}`,
      );
    }

    return normalizeAIReviewResult(
      parsed,
      request.finding,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        `Ollama AI review timed out after ${OLLAMA_TIMEOUT_MS / 1000}s`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

interface OllamaChatResponse {
  message?: {
    role?: string;
    content?: string;
  };
}

function normalizeAIReviewResult(
  value: unknown,
  finding: AIReviewRequest["finding"],
): AIReviewResult {
  if (!value || typeof value !== "object") {
    throw new Error(
      "Ollama AI review returned an invalid result structure",
    );
  }

  const result = value as Record<string, unknown>;

  const confidence = normalizeConfidence(
    result.confidence,
  );

  return {
    explanation:
      getString(
        result.explanation,
      ) ||
      finding.description,

    rootCause:
      getString(
        result.rootCause,
      ) ||
      `The static analysis rule "${finding.rule}" matched this code pattern.`,

    impact:
      getString(
        result.impact,
      ) ||
      finding.impact,

    recommendation:
      getString(
        result.recommendation,
      ) ||
      finding.recommendation,

    suggestedFix:
      getString(
        result.suggestedFix,
      ) ||
      finding.recommendation,

    confidence:
      confidence ?? 70,
  };
}

function getString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeConfidence(
  value: unknown,
): number | null {
  if (typeof value === "number") {
    if (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 100
    ) {
      return value;
    }

    return null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(
      value.trim(),
      10,
    );

    if (
      Number.isInteger(parsed) &&
      parsed >= 0 &&
      parsed <= 100
    ) {
      return parsed;
    }
  }

  return null;
}