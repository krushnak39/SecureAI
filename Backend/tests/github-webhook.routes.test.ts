
import express from "express";
import request from "supertest";
import { createHmac } from "node:crypto";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { processWebhookMock } = vi.hoisted(() => ({
  processWebhookMock: vi.fn(),
}));

vi.mock(
  "../src/services/github-webhook-processor.service.js",
  () => ({
    processGitHubPullRequestWebhook: processWebhookMock,
  }),
);

describe("GitHub Webhook HTTP Route", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.stubEnv(
      "GITHUB_WEBHOOK_SECRET",
      "test-webhook-secret",
    );

    const routerModule = await import(
      "../src/routes/github-webhook.routes.js"
    );

    app = express();
    app.use(express.raw({ type: "application/json" }));
    app.use(routerModule.default);
  });

  function createPayload(data: object) {
    return Buffer.from(JSON.stringify(data));
  }

  function createSignature(payload: Buffer) {
    return `sha256=${createHmac(
      "sha256",
      "test-webhook-secret",
    )
      .update(payload)
      .digest("hex")}`;
  }

  function createPullRequestPayload(action: string) {
    return {
      action,
      number: 42,
      repository: {
        full_name: "owner/repository",
      },
      pull_request: {
        number: 42,
        head: {
          sha: "abc123",
        },
      },
    };
  }

async function sendWebhook(
  payload: Buffer,
  event = "pull_request",
  signature = createSignature(payload),
) {
  return request(app)
    .post("/github")
    .set("Content-Type", "application/json")
    .set("X-GitHub-Event", event)
    .set("X-GitHub-Delivery", "test-delivery-123")
    .set("X-Hub-Signature-256", signature)
    .send(payload.toString("utf8"));
}

  it("processes a valid opened pull request", async () => {
    const payload = createPayload(
      createPullRequestPayload("opened"),
    );

    processWebhookMock.mockResolvedValue({
      handled: true,
      analysisId: "analysis-123",
    });

    const response = await sendWebhook(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.event).toBe("pull_request");
    expect(response.body.deliveryId).toBe(
      "test-delivery-123",
    );

    expect(processWebhookMock).toHaveBeenCalledTimes(1);
    expect(processWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "opened",
        number: 42,
      }),
    );
  });

  it.each(["synchronize", "reopened"])(
    "processes a pull request with action %s",
    async (action) => {
      const payload = createPayload(
        createPullRequestPayload(action),
      );

      processWebhookMock.mockResolvedValue({
        handled: true,
      });

      const response = await sendWebhook(payload);

      expect(response.status).toBe(200);
      expect(processWebhookMock).toHaveBeenCalledTimes(1);
    },
  );

  it("does not process a closed pull request", async () => {
    const payload = createPayload(
      createPullRequestPayload("closed"),
    );

    const response = await sendWebhook(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("does not process non-pull-request events", async () => {
    const payload = createPayload({
      action: "created",
      zen: "Keep it logically awesome.",
    });

    const response = await sendWebhook(payload, "ping");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.event).toBe("ping");
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid webhook signature", async () => {
    const payload = createPayload(
      createPullRequestPayload("opened"),
    );

    const response = await sendWebhook(
      payload,
      "pull_request",
      "sha256=invalid",
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("rejects a request with a missing signature", async () => {
    const payload = createPayload(
      createPullRequestPayload("opened"),
    );

    const response = await request(app)
      .post("/github")
      .set("Content-Type", "application/json")
      .set("X-GitHub-Event", "pull_request")
      .send(payload);

    expect(response.status).toBe(401);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON with a valid signature", async () => {
    const payload = Buffer.from('{"action":');

    const response = await sendWebhook(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("returns 400 when pull request processing throws", async () => {
    const payload = createPayload(
      createPullRequestPayload("opened"),
    );

    processWebhookMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await sendWebhook(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(processWebhookMock).toHaveBeenCalledTimes(1);
  });
});
