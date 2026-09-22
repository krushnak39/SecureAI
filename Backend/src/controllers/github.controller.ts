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
  getAuthenticatedGitHubUser,
  getGitHubUserRepositories,
  getRepositoryInstallation,
  getValidGitHubAccount,
} from "../services/github.service.js";

import {
  connectGitHubRepositorySchema,
} from "../utils/github.validation.js";

import { getGitHubConfig } from "../config/github.js";

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

  res.redirect(
    installationUrl,
  );
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

    /*
     * Do not call /user/installations here.
     *
     * The OAuth token is used only to
     * authenticate the GitHub user.
     *
     * Repository/App access is checked
     * later through the GitHub App itself.
     */

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

    res.status(200).json({
      success: true,
      connected: true,
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

    if (!account?.accessToken) {
      res.status(400).json({
        success: false,
        message:
          "GitHub is not connected",
      });

      return;
    }

    const repositories =
      await getGitHubUserRepositories(
        account.accessToken,
      );

    const { appId } =
      getGitHubConfig();

    const accessibleRepositories =
      [];

    for (const repository of repositories) {
      try {
        const installation =
          await getRepositoryInstallation(
            repository.full_name,
          );

        if (
          String(
            installation.app_id,
          ) !== String(appId)
        ) {
          continue;
        }

        accessibleRepositories.push(
          repository,
        );
      } catch {
        /*
         * SecureAI GitHub App is not
         * installed for this repository.
         */
      }
    }

    res.status(200).json({
      success: true,
      repositories:
        accessibleRepositories.map(
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

    if (!account?.accessToken) {
      res.status(400).json({
        success: false,
        message:
          "GitHub is not connected",
      });

      return;
    }

    /*
     * Get the user's repositories using
     * the GitHub OAuth token.
     *
     * We do NOT use /user/installations.
     */
    const repositories =
      await getGitHubUserRepositories(
        account.accessToken,
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
          "Repository was not found in your accessible GitHub repositories",
      });

      return;
    }

    /*
     * Verify that the SecureAI GitHub App
     * is actually installed for this
     * repository.
     */
    let installation;

    try {
      installation =
        await getRepositoryInstallation(
          repository.full_name,
        );
    } catch {
      res.status(403).json({
        success: false,
        message:
          "SecureAI GitHub App is not installed or does not have access to this repository",
      });

      return;
    }

    const { appId } =
      getGitHubConfig();

    if (
      String(installation.app_id) !==
      String(appId)
    ) {
      res.status(403).json({
        success: false,
        message:
          "This repository is not connected to the SecureAI GitHub App",
      });

      return;
    }

    const connectedRepository =
      await connectRepository(
        req.params.projectId,
        userId,
        {
          name:
            repository.name,
          fullName:
            repository.full_name,
          url:
            repository.html_url,
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