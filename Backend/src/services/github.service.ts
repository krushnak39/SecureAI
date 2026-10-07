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
              Authorization:
                `Bearer ${accessToken}`,
            }
          : {}),
        ...(options.headers ?? {}),
      },
    },
  );

  const data =
    await response.json().catch(() => null);

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
  const { appSlug } =
    getGitHubConfig();

  const url = new URL(
    `https://github.com/apps/${appSlug}/installations/new`,
  );

  url.searchParams.set(
    "state",
    state,
  );

  return url.toString();
}

export function createGitHubAppJwt() {
  const { appId, privateKey } =
    getGitHubConfig();

  const now =
    Math.floor(Date.now() / 1000);

  const payload = {
    iat: now - 60,
    exp: now + 8 * 60,
    iss: appId,
  };

  const encodedHeader =
    Buffer.from(
      JSON.stringify({
        alg: "RS256",
        typ: "JWT",
      }),
    ).toString("base64url");

  const encodedPayload =
    Buffer.from(
      JSON.stringify(payload),
    ).toString("base64url");

  const unsignedToken =
    `${encodedHeader}.${encodedPayload}`;

  const signer =
    createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature =
    signer
      .sign(privateKey)
      .toString("base64url");

  return `${unsignedToken}.${signature}`;
}

export async function getInstallationAccessToken(
  installationId: number,
  repositoryIds?: number[],
) {
  const jwt =
    createGitHubAppJwt();

  const body =
    repositoryIds &&
    repositoryIds.length > 0
      ? JSON.stringify({
          repository_ids:
            repositoryIds,
        })
      : undefined;

  return githubRequest<{
    token: string;
    expires_at: string;
    permissions: Record<
      string,
      string
    >;
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
        Authorization:
          `Bearer ${jwt}`,
        ...(body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
      body,
    },
  );
}

export async function getGitHubBranchCommit(
  accessToken: string,
  fullName: string,
  branch: string,
) {
  const encodedBranch =
    encodeURIComponent(branch);

  return githubRequest<{
    name: string;
    commit: {
      sha: string;
      url: string;
    };
  }>(
    `/repos/${fullName}/branches/${encodedBranch}`,
    accessToken,
  );
}

export async function downloadGitHubRepositoryArchive(
  accessToken: string,
  fullName: string,
  branch: string,
) {
  const encodedBranch =
    encodeURIComponent(branch);

  const response =
    await fetch(
      `${GITHUB_API_URL}/repos/${fullName}/zipball/${encodedBranch}`,
      {
        headers: {
          Accept:
            "application/vnd.github+json",
          Authorization:
            `Bearer ${accessToken}`,
          "X-GitHub-Api-Version":
            GITHUB_API_VERSION,
        },
        redirect: "manual",
      },
    );

  const location =
    response.headers.get(
      "location",
    );

  if (
    response.status >= 300 &&
    response.status < 400 &&
    location
  ) {
    const archiveResponse =
      await fetch(location);

    if (!archiveResponse.ok) {
      throw new Error(
        `Unable to download repository archive: ${archiveResponse.status}`,
      );
    }

    return Buffer.from(
      await archiveResponse.arrayBuffer(),
    );
  }

  if (!response.ok) {
    const data =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      typeof data?.message ===
        "string"
        ? data.message
        : `Unable to download repository archive: ${response.status}`,
    );
  }

  return Buffer.from(
    await response.arrayBuffer(),
  );
}

export async function exchangeCodeForUserToken(
  code: string,
) {
  const {
    clientId,
    clientSecret,
  } = getGitHubConfig();

  const params =
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    });

  const response =
    await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept:
            "application/json",
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

  const params =
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type:
        "refresh_token",
      refresh_token:
        refreshToken,
    });

  const response =
    await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept:
            "application/json",
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

/**
 * Lists repositories accessible to the
 * authenticated GitHub user.
 *
 * This uses the GitHub OAuth user token.
 * It does NOT require GitHub App
 * installation permissions.
 */
export async function getGitHubUserRepositories(
  accessToken: string,
) {
  const repositories: GitHubRepository[] =
    [];

  let page = 1;

  while (true) {
    const response =
      await githubRequest<
        GitHubRepository[]
      >(
        `/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100&page=${page}&sort=updated`,
        accessToken,
      );

    repositories.push(
      ...response,
    );

    if (
      response.length < 100
    ) {
      break;
    }

    page += 1;
  }

  return repositories;
}

/**
 * Finds the SecureAI GitHub App
 * installation for a specific repository.
 *
 * This is authenticated as the GitHub App
 * using an App JWT, so it does not depend
 * on /user/installations.
 */
export async function getRepositoryInstallation(
  fullName: string,
) {
  const jwt =
    createGitHubAppJwt();

  const encodedFullName =
    fullName
      .split("/")
      .map(
        (part) =>
          encodeURIComponent(part),
      )
      .join("/");

  return githubRequest<GitHubInstallation>(
    `/repos/${encodedFullName}/installation`,
    undefined,
    {
      headers: {
        Authorization:
          `Bearer ${jwt}`,
      },
    },
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
      await githubRequest<{
        total_count: number;
        repositories: GitHubRepository[];
      }>(
        `/user/installations/${installationId}/repositories?per_page=100&page=${page}`,
        accessToken,
      );

    repositories.push(
      ...response.repositories,
    );

    if (
      response.repositories.length <
      100
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

  if (!account.accessToken) {
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
    try {
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

      return await prisma.account.update({
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
    } catch {
      throw new Error(
        "GitHub authorization has expired. Please reconnect GitHub.",
      );
    }
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
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url?: string;
  } | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  state: "open" | "closed";
  merged_at: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url?: string;
}

export interface GitHubWorkflowRun {
  id: number;
  workflow_id: number;
  name: string;
  display_title?: string;
  status:
    | "queued"
    | "in_progress"
    | "completed"
    | string;
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null
    | string;
  head_branch: string | null;
  head_sha: string;
  run_number: number;
  created_at: string;
  run_started_at: string | null;
  updated_at: string;
  html_url: string;
  actor: {
    login: string;
  } | null;
}

export interface GitHubCheckRun {
  id: number;
  name: string;
  status:
    | "queued"
    | "in_progress"
    | "completed"
    | string;
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null
    | string;
  html_url: string;
  started_at: string | null;
  completed_at: string | null;
}

export async function listGitHubPullRequests(
  accessToken: string,
  fullName: string,
) {
  return githubRequest<GitHubPullRequest[]>(
    `/repos/${fullName}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
    accessToken,
  );

}

export interface GitHubPullRequestFile {
  sha: string;
  filename: string;
  status:
    | "added"
    | "modified"
    | "deleted"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export async function getGitHubFileContent(
  accessToken: string,
  fullName: string,
  filePath: string,
  ref: string,
) {
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await githubRequest<{
    content?: string;
    encoding?: string;
    path?: string;
  }>(
    `/repos/${fullName}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    accessToken,
  );

  if (!response.content) {
    return null;
  }

  if (response.encoding === "base64") {
    return Buffer.from(
      response.content.replace(/\s/g, ""),
      "base64",
    ).toString("utf8");
  }

  return response.content;
}

export async function listGitHubPullRequestFiles(
  accessToken: string,
  fullName: string,
  pullNumber: number,
) {
  return githubRequest<GitHubPullRequestFile[]>(
    `/repos/${fullName}/pulls/${pullNumber}/files?per_page=100`,
    accessToken,
  );
}

export async function listGitHubWorkflows(
  accessToken: string,
  fullName: string,
) {
  const response = await githubRequest<{
    total_count: number;
    workflows: GitHubWorkflow[];
  }>(
    `/repos/${fullName}/actions/workflows?per_page=100`,
    accessToken,
  );

  return response.workflows;
}

export async function listGitHubWorkflowRuns(
  accessToken: string,
  fullName: string,
) {
  const response = await githubRequest<{
    total_count: number;
    workflow_runs: GitHubWorkflowRun[];
  }>(
    `/repos/${fullName}/actions/runs?per_page=50`,
    accessToken,
  );

  return response.workflow_runs;
}

export async function listGitHubCheckRuns(
  accessToken: string,
  fullName: string,
  commitSha: string,
) {
  const response = await githubRequest<{
    total_count: number;
    check_runs: GitHubCheckRun[];
  }>(
    `/repos/${fullName}/commits/${encodeURIComponent(
      commitSha,
    )}/check-runs?per_page=100`,
    accessToken,
  );

  return response.check_runs;
}

export async function dispatchGitHubWorkflow(
  accessToken: string,
  fullName: string,
  workflowId: string | number,
  branch: string,
) {
  const encodedWorkflowId =
    encodeURIComponent(String(workflowId));

  return githubRequest<unknown>(
    `/repos/${fullName}/actions/workflows/${encodedWorkflowId}/dispatches`,
    accessToken,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: branch,
      }),
    },
  );
}