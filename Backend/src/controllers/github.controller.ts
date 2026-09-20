import { randomBytes } from "node:crypto";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  connectRepository,
  getProject,
} from "../services/project.service.js";

import {
  buildGitHubInstallationUrl,
  exchangeCodeForUserToken,
  findSecureAIInstallation,
  getAuthenticatedGitHubUser,
  getValidGitHubAccount,
  listGitHubRepositories,
} from "../services/github.service.js";

import {
  connectGitHubRepositorySchema,
} from "../utils/github.validation.js";

import { prisma } from "../lib/prisma.js";

const GITHUB_STATE_COOKIE =
  "secureai_github_state";

type ProjectParams = {
  projectId: string;
};

function getAuthenticatedUserId(
  req: Request,
) {
  return req.userId ?? null;
}

export function connectGitHub(
  _req: Request,
  res: Response,
) {
  const state =
    randomBytes(32).toString("hex");

  res.cookie(
    GITHUB_STATE_COOKIE,
    state,
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      maxAge: 10 * 60 * 1000,
      path: "/",
    },
  );

  const installationUrl =
    buildGitHubInstallationUrl(
      state,
    );

  res.redirect(installationUrl);
}

export async function githubCallback(
  req: Request,
  res: Response,
) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      res.redirect(
        `${frontendUrl}/login`,
      );

      return;
    }

    const {
      code,
      state,
      error,
    } = req.query;

    if (error) {
      throw new Error(
        `GitHub authorization failed: ${String(error)}`,
      );
    }

    if (
      typeof code !== "string"
    ) {
      throw new Error(
        "GitHub authorization code is missing",
      );
    }

    if (
      typeof state !== "string"
    ) {
      throw new Error(
        "GitHub OAuth state is missing",
      );
    }

    const storedState =
      req.cookies?.[
        GITHUB_STATE_COOKIE
      ];

    if (
      !storedState ||
      storedState !== state
    ) {
      throw new Error(
        "Invalid GitHub OAuth state",
      );
    }

    const token =
      await exchangeCodeForUserToken(
        code,
      );

    if (
      !token.access_token
    ) {
      throw new Error(
        "GitHub access token was not returned",
      );
    }

    const githubUser =
      await getAuthenticatedGitHubUser(
        token.access_token,
      );

    const installation =
      await findSecureAIInstallation(
        token.access_token,
      );

    if (!installation) {
      throw new Error(
        "SecureAI GitHub App installation could not be found for this GitHub account",
      );
    }

    const expiresAt =
      token.expires_in
        ? new Date(
            Date.now() +
              token.expires_in *
                1000,
          )
        : null;

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "GITHUB",
          providerAccountId:
            String(githubUser.id),
        },
      },
      create: {
        userId,
        provider: "GITHUB",
        providerAccountId:
          String(githubUser.id),
        accessToken:
          token.access_token,
        refreshToken:
          token.refresh_token ??
          null,
        expiresAt,
      },
      update: {
        userId,
        accessToken:
          token.access_token,
        refreshToken:
          token.refresh_token ??
          null,
        expiresAt,
      },
    });

    res.clearCookie(
      GITHUB_STATE_COOKIE,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
      },
    );

    res.redirect(
      `${frontendUrl}/projects?github=connected`,
    );
  } catch (error) {
    console.error(
      "GitHub callback error:",
      error,
    );

    res.clearCookie(
      GITHUB_STATE_COOKIE,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
      },
    );

    res.redirect(
      `${frontendUrl}/projects?github=error`,
    );
  }
}

export async function githubStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const account =
      await getValidGitHubAccount(
        userId,
      );

    if (!account) {
      res.status(200).json({
        success: true,
        connected: false,
        githubUser: null,
      });

      return;
    }

    const githubUser =
      await getAuthenticatedGitHubUser(
        account.accessToken!,
      );

    const installation =
      await findSecureAIInstallation(
        account.accessToken!,
      );

    res.status(200).json({
      success: true,
      connected: Boolean(
        installation,
      ),
      githubUser: {
        id: githubUser.id,
        login: githubUser.login,
        avatarUrl:
          githubUser.avatar_url,
        url: githubUser.html_url,
      },
      tokenExpiresAt:
        account.expiresAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGitHubRepositories(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const account =
      await getValidGitHubAccount(
        userId,
      );

    if (!account) {
      res.status(400).json({
        success: false,
        message:
          "GitHub is not connected",
      });

      return;
    }

    const installation =
      await findSecureAIInstallation(
        account.accessToken!,
      );

    if (!installation) {
      res.status(400).json({
        success: false,
        message:
          "SecureAI GitHub App installation not found",
      });

      return;
    }

    const repositories =
      await listGitHubRepositories(
        account.accessToken!,
        installation.id,
      );

    res.status(200).json({
      success: true,
      repositories:
        repositories.map(
          (repository) => ({
            id: repository.id,
            name: repository.name,
            fullName:
              repository.full_name,
            url: repository.html_url,
            defaultBranch:
              repository.default_branch,
            language:
              repository.language,
            isPrivate:
              repository.private,
            description:
              repository.description,
            owner:
              repository.owner.login,
          }),
        ),
    });
  } catch (error) {
    next(error);
  }
}

export async function connectGitHubRepository(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const validation =
      connectGitHubRepositorySchema.safeParse(
        req.body,
      );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message:
          validation.error.issues[0]
            ?.message ??
          "Invalid repository ID",
      });

      return;
    }

    const project =
      await getProject(
        req.params.projectId,
        userId,
      );

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    if (project.repository) {
      res.status(409).json({
        success: false,
        message:
          "This project already has a repository connected",
      });

      return;
    }

    const account =
      await getValidGitHubAccount(
        userId,
      );

    if (!account) {
      res.status(400).json({
        success: false,
        message:
          "GitHub is not connected",
      });

      return;
    }

    const installation =
      await findSecureAIInstallation(
        account.accessToken!,
      );

    if (!installation) {
      res.status(400).json({
        success: false,
        message:
          "SecureAI GitHub App installation not found",
      });

      return;
    }

    const repositories =
      await listGitHubRepositories(
        account.accessToken!,
        installation.id,
      );

    const repository =
      repositories.find(
        (item) =>
          item.id ===
          validation.data.repositoryId,
      );

    if (!repository) {
      res.status(404).json({
        success: false,
        message:
          "Repository is not accessible through the connected GitHub App",
      });

      return;
    }

    const connectedRepository =
      await connectRepository(
        req.params.projectId,
        userId,
        {
          name: repository.name,
          fullName:
            repository.full_name,
          url: repository.html_url,
          externalId:
            String(repository.id),
          defaultBranch:
            repository.default_branch,
          branch:
            repository.default_branch,
          language:
            repository.language ??
            undefined,
          isPrivate:
            repository.private,
        },
      );

    if (!connectedRepository) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    res.status(201).json({
      success: true,
      message:
        "GitHub repository connected successfully",
      repository:
        connectedRepository,
    });
  } catch (error) {
    next(error);
  }
}