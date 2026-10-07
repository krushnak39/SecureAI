import type {
  Request,
  Response,
} from "express";

import {
  runCodebaseChat,
} from "../services/codebase-chat.service.js";

type ChatParams = {
  projectId: string;
};

type ChatBody = {
  message?: string;
  sessionId?: string;
};

export async function sendChatMessage(
  req: Request<
    ChatParams,
    unknown,
    ChatBody
  >,
  res: Response,
) {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  const message =
    req.body.message?.trim();

  if (!message) {
    res.status(400).json({
      success: false,
      message: "Chat message is required.",
    });

    return;
  }

  try {
    const result =
      await runCodebaseChat({
        projectId:
          req.params.projectId,
        userId,
        message,
        sessionId:
          req.body.sessionId,
      });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Codebase chat failed.";

    if (
      errorMessage ===
      "Project not found."
    ) {
      res.status(404).json({
        success: false,
        message: errorMessage,
      });

      return;
    }

    if (
      errorMessage ===
      "No repository connected to this project."
    ) {
      res.status(400).json({
        success: false,
        message: errorMessage,
      });

      return;
    }

    if (
      errorMessage ===
      "Chat session not found."
    ) {
      res.status(404).json({
        success: false,
        message: errorMessage,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}