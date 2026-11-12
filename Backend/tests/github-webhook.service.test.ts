
import { createHmac } from "node:crypto";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

describe("GitHub Webhook Service", () => {
  let service: typeof import("../src/services/github-webhook.service.js");

  beforeEach(async () => {
    vi.resetModules();

    vi.stubEnv(
      "GITHUB_WEBHOOK_SECRET",
      "test-webhook-secret",
    );

    service = await import(
      "../src/services/github-webhook.service.js"
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function generateSignature(payload: Buffer) {
    return `sha256=${createHmac(
      "sha256",
      "test-webhook-secret",
    )
      .update(payload)
      .digest("hex")}`;
  }

  describe("verifyGitHubWebhookSignature", () => {
    it("accepts a valid GitHub webhook signature", () => {
      const payload = Buffer.from(
        JSON.stringify({
          action: "opened",
          number: 10,
        }),
      );

      const signature =
        generateSignature(payload);

      expect(
        service.verifyGitHubWebhookSignature(
          payload,
          signature,
        ),
      ).toBe(true);
    });

    it("rejects an invalid signature", () => {
      const payload = Buffer.from(
        '{"action":"opened"}',
      );

      expect(
        service.verifyGitHubWebhookSignature(
          payload,
          "sha256=invalid-signature",
        ),
      ).toBe(false);
    });

    it("rejects a missing signature", () => {
      const payload = Buffer.from(
        '{"action":"opened"}',
      );

      expect(
        service.verifyGitHubWebhookSignature(
          payload,
          undefined,
        ),
      ).toBe(false);
    });

    it("rejects a signature generated for a different payload", () => {
      const originalPayload = Buffer.from(
        '{"action":"opened"}',
      );

      const modifiedPayload = Buffer.from(
        '{"action":"synchronize"}',
      );

      const signature =
        generateSignature(originalPayload);

      expect(
        service.verifyGitHubWebhookSignature(
          modifiedPayload,
          signature,
        ),
      ).toBe(false);
    });

    it("throws when the webhook secret is not configured", async () => {
      vi.unstubAllEnvs();
      vi.stubEnv(
        "GITHUB_WEBHOOK_SECRET",
        "",
      );

      vi.resetModules();

      const serviceWithoutSecret =
        await import(
          "../src/services/github-webhook.service.js"
        );

      expect(() =>
        serviceWithoutSecret.verifyGitHubWebhookSignature(
          Buffer.from("{}"),
          "sha256=anything",
        ),
      ).toThrow(
        "GITHUB_WEBHOOK_SECRET is not configured.",
      );
    });
  });

  describe("parseGitHubWebhookPayload", () => {
    it("parses a valid JSON webhook payload", () => {
      const payload = Buffer.from(
        JSON.stringify({
          action: "opened",
          number: 42,
          repository: {
            full_name: "owner/repository",
          },
        }),
      );

      const result =
        service.parseGitHubWebhookPayload(
          payload,
        );

      expect(result.action).toBe("opened");
      expect(result.number).toBe(42);
      expect(result.repository.full_name).toBe(
        "owner/repository",
      );
    });

    it("throws when the payload contains invalid JSON", () => {
      const payload = Buffer.from(
        '{"action":',
      );

      expect(() =>
        service.parseGitHubWebhookPayload(
          payload,
        ),
      ).toThrow();
    });
  });
});
