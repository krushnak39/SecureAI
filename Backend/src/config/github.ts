import fs from "node:fs";
import path from "node:path";

interface GitHubConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  appSlug: string;
  callbackUrl: string;
  frontendUrl: string;
  privateKey: string;
}

export function getGitHubConfig(): GitHubConfig {
  const appId = process.env.GITHUB_APP_ID;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appSlug = process.env.GITHUB_APP_SLUG;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;
  const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

  const privateKeyPath =
    process.env.GITHUB_PRIVATE_KEY_PATH;

  if (
    !appId ||
    !clientId ||
    !clientSecret ||
    !appSlug ||
    !callbackUrl
  ) {
    throw new Error(
      "GitHub App environment variables are not fully configured",
    );
  }

  if (!privateKeyPath) {
    throw new Error(
      "GITHUB_PRIVATE_KEY_PATH is not configured",
    );
  }

  const resolvedPrivateKeyPath = path.resolve(
    process.cwd(),
    privateKeyPath,
  );

  if (!fs.existsSync(resolvedPrivateKeyPath)) {
    throw new Error(
      `GitHub private key not found at ${resolvedPrivateKeyPath}`,
    );
  }

  const privateKey = fs.readFileSync(
    resolvedPrivateKeyPath,
    "utf8",
  );

  return {
    appId,
    clientId,
    clientSecret,
    appSlug,
    callbackUrl,
    frontendUrl,
    privateKey,
  };
}