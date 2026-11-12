import { createHmac, timingSafeEqual } from "node:crypto";

const GITHUB_WEBHOOK_SECRET =
  process.env.GITHUB_WEBHOOK_SECRET;

export function verifyGitHubWebhookSignature(
  payload: Buffer,
  signature: string | undefined,
) {
  if (!GITHUB_WEBHOOK_SECRET) {
    throw new Error(
      "GITHUB_WEBHOOK_SECRET is not configured.",
    );
  }

  if (!signature) {
    return false;
  }

  const expectedSignature =
    `sha256=${createHmac(
      "sha256",
      GITHUB_WEBHOOK_SECRET,
    )
      .update(payload)
      .digest("hex")}`;

  const expected = Buffer.from(
    expectedSignature,
    "utf8",
  );

  const received = Buffer.from(
    signature,
    "utf8",
  );

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(
    expected,
    received,
  );
}

export type GitHubWebhookEvent =
  | "pull_request"
  | "push"
  | "ping"
  | "workflow_run"
  | "check_run"
  | string;

export function parseGitHubWebhookPayload(
  payload: Buffer,
) {
  return JSON.parse(
    payload.toString("utf8"),
  ) as Record<string, any>;
}
