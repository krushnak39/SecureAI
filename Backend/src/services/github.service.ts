import { createSign } from "node:crypto";

import { prisma } from "../lib/prisma.js";
import { getGitHubConfig } from "../config/github.js";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GitHubInstallation {
  id: number;
  app_id: number;
  app_slug?: string;
  account: {
    login: string;
    id: number;
    avatar_url: string;
  };
  repository_selection: "all" | "selected";
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  language: string | null;
  private: boolean;
  description: string | null;
  owner: {
    login: string;
  };
}

interface GitHubRepositoryListResponse {
  total_count: number;
  repositories: GitHubRepository[];
}

async function githubRequest<T>(
  endpoint: string,
  accessToken?: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${GITHUB_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version":
          GITHUB_API_VERSION,
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
        ...(options.headers ?? {}),
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "GitHub API request failed";

    throw new Error(
      `GitHub API ${response.status}: ${message}`,
    );
  }

  return data as T;
}

export function buildGitHubInstallationUrl(
  state: string,
) {
  const { appSlug } = getGitHubConfig();

  const url = new URL(
    `https://github.com/apps/${appSlug}/installations/new`,
  );

  url.searchParams.set("state", state);

  return url.toString();
}

export function createGitHubAppJwt() {
  const { clientId, privateKey } =
    getGitHubConfig();

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: clientId,
  };

  const encodedHeader =
    Buffer.from(
      JSON.stringify({
        alg: "RS256",
        typ: "JWT",
      }),
    )
      .toString("base64url");

  const encodedPayload =
    Buffer.from(
      JSON.stringify(payload),
    ).toString("base64url");

  const unsignedToken =
    `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(privateKey)
    .toString("base64url");

  return `${unsignedToken}.${signature}`;
}

export async function getInstallationAccessToken(
  installationId: number,
) {
  const jwt = createGitHubAppJwt();

  const response =
    await githubRequest<{
      token: string;
      expires_at: string;
      permissions: Record<string, string>;
      repositories?: Array<{
        id: number;
        full_name: string;
      }>;
    }>(
      `/app/installations/${installationId}/access_tokens`,
      undefined,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    );

  return response;
}

export async function exchangeCodeForUserToken(
  code: string,
) {
  const {
    clientId,
    clientSecret,
  } = getGitHubConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: params,
    },
  );

  const data =
    (await response.json()) as GitHubTokenResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Unable to obtain GitHub access token",
    );
  }

  return data;
}

export async function refreshGitHubUserToken(
  refreshToken: string,
) {
  const {
    clientId,
    clientSecret,
  } = getGitHubConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: params,
    },
  );

  const data =
    (await response.json()) as GitHubTokenResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Unable to refresh GitHub access token",
    );
  }

  return data;
}

export async function getAuthenticatedGitHubUser(
  accessToken: string,
) {
  return githubRequest<GitHubUser>(
    "/user",
    accessToken,
  );
}

async function getUserInstallations(
  accessToken: string,
) {
  const installations: GitHubInstallation[] =
    [];

  let page = 1;

  while (true) {
    const response =
      await githubRequest<{
        total_count: number;
        installations: GitHubInstallation[];
      }>(
        `/user/installations?per_page=100&page=${page}`,
        accessToken,
      );

    installations.push(
      ...response.installations,
    );

    if (
      response.installations.length < 100
    ) {
      break;
    }

    page += 1;
  }

  return installations;
}

export async function findSecureAIInstallation(
  accessToken: string,
) {
  const { appId } = getGitHubConfig();

  const installations =
    await getUserInstallations(
      accessToken,
    );

  return (
    installations.find(
      (installation) =>
        String(installation.app_id) ===
        String(appId),
    ) ?? null
  );
}

export async function listGitHubRepositories(
  accessToken: string,
  installationId: number,
) {
  const repositories: GitHubRepository[] =
    [];

  let page = 1;

  while (true) {
    const response =
      await githubRequest<GitHubRepositoryListResponse>(
        `/user/installations/${installationId}/repositories?per_page=100&page=${page}`,
        accessToken,
      );

    repositories.push(
      ...response.repositories,
    );

    if (
      response.repositories.length < 100
    ) {
      break;
    }

    page += 1;
  }

  return repositories;
}

export async function getValidGitHubAccount(
  userId: string,
) {
  const account =
    await prisma.account.findFirst({
      where: {
        userId,
        provider: "GITHUB",
      },
    });

  if (!account) {
    return null;
  }

  if (
    !account.accessToken
  ) {
    return null;
  }

  const shouldRefresh =
    account.expiresAt &&
    account.expiresAt.getTime() <=
      Date.now() + 60_000;

  if (
    shouldRefresh &&
    account.refreshToken
  ) {
    const refreshed =
      await refreshGitHubUserToken(
        account.refreshToken,
      );

    const expiresAt =
      refreshed.expires_in
        ? new Date(
            Date.now() +
              refreshed.expires_in *
                1000,
          )
        : null;

    const updated =
      await prisma.account.update({
        where: {
          id: account.id,
        },
        data: {
          accessToken:
            refreshed.access_token,
          refreshToken:
            refreshed.refresh_token ??
            account.refreshToken,
          expiresAt,
        },
      });

    return updated;
  }

  if (
    account.expiresAt &&
    account.expiresAt.getTime() <=
      Date.now()
  ) {
    throw new Error(
      "GitHub authorization has expired. Please reconnect GitHub.",
    );
  }

  return account;
}