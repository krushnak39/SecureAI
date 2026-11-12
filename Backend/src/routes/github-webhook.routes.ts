import { Router } from "express";
import {
  parseGitHubWebhookPayload,
  verifyGitHubWebhookSignature,
} from "../services/github-webhook.service.js";
import {
  processGitHubPullRequestWebhook,
} from "../services/github-webhook-processor.service.js";

const router = Router();

router.post(
  "/github",
  async (req, res) => {
    try {
      const signature =
        req.header("X-Hub-Signature-256");

      const payload =
        Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(
              JSON.stringify(req.body),
              "utf8",
            );

      const valid =
        verifyGitHubWebhookSignature(
          payload,
          signature,
        );

      if (!valid) {
        res.status(401).json({
          success: false,
          message:
            "Invalid GitHub webhook signature.",
        });
        return;
      }

      const event =
        req.header("X-GitHub-Event") ??
        "unknown";

      const deliveryId =
        req.header("X-GitHub-Delivery");

      const data =
        parseGitHubWebhookPayload(
          payload,
        );

      console.log(
        `[GitHub Webhook] ${event}`,
        {
          deliveryId,
          repository:
            data.repository?.full_name,
          action: data.action,
        },
      );

      if (
        event === "pull_request" &&
        [
          "opened",
          "synchronize",
          "reopened",
        ].includes(data.action)
      ) {
        const result =
          await processGitHubPullRequestWebhook(
            data,
          );

        res.status(200).json({
          success: true,
          event,
          deliveryId,
          result,
        });
        return;
      }

      res.status(200).json({
        success: true,
        event,
        deliveryId,
      });
    } catch (error) {
      console.error(
        "GitHub webhook error:",
        error,
      );

      res.status(400).json({
        success: false,
        message:
          "Invalid webhook payload.",
      });
    }
  },
);

export default router;