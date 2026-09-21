import { githubOAuthConfig } from "../lib/github.js";
import { googleClient } from "../lib/google.js";

import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma.js";

import { AccountProvider } from "../generated/prisma/client.js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt?: Date;
}

const SESSION_DURATION_DAYS = 7;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getSessionExpiry(): Date {
  const expiry = new Date();

  expiry.setDate(
    expiry.getDate() + SESSION_DURATION_DAYS,
  );

  return expiry;
}

/**
 * Register a new user using email/password.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Authenticate an existing email/password user.
 */
export async function authenticateUser(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Create a SecureAI application session.
 */
export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");

  const tokenHash = hashSessionToken(rawToken);

  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token: rawToken,
    expiresAt,
  };
}

/**
 * Get the SecureAI user from a session token.
 */
export async function getUserFromSessionToken(
  token: string,
) {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session.user;
}

/**
 * Delete a SecureAI session.
 */
export async function deleteSession(token: string) {
  const tokenHash = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}

/**
 * Generate Google's authorization URL.
 */
export function getGoogleAuthorizationUrl() {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: [
      "openid",
      "email",
      "profile",
    ],
  });
}

/**
 * Authenticate a user through Google OAuth.
 *
 * This:
 * 1. Exchanges the authorization code for Google tokens.
 * 2. Verifies the Google identity.
 * 3. Finds an existing Google account.
 * 4. Links Google to an existing email account when appropriate.
 * 5. Creates a new user when necessary.
 * 6. Creates the Google Account record.
 */
export async function authenticateGoogleUser(
  code: string,
) {
  const { tokens } = await googleClient.getToken(code);

  if (!tokens.id_token) {
    throw new Error(
      "Google did not return an ID token",
    );
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error(
      "Unable to read Google account information",
    );
  }

  const googleUserId = payload.sub;

  const email = payload.email
    ?.trim()
    .toLowerCase();

  const emailVerified =
    payload.email_verified === true;

  if (!googleUserId || !email) {
    throw new Error(
      "Google account did not provide the required identity information",
    );
  }

  if (!emailVerified) {
    throw new Error(
      "Your Google email address must be verified",
    );
  }

  const name =
    payload.name?.trim() ||
    email.split("@")[0];

  const avatarUrl = payload.picture ?? null;

  const existingGoogleAccount =
    await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AccountProvider.GOOGLE,
          providerAccountId: googleUserId,
        },
      },
      include: {
        user: true,
      },
    });

  if (existingGoogleAccount) {
    return {
      user: {
        id: existingGoogleAccount.user.id,
        name: existingGoogleAccount.user.name,
        email: existingGoogleAccount.user.email,
        avatarUrl:
          existingGoogleAccount.user.avatarUrl,
        createdAt:
          existingGoogleAccount.user.createdAt,
      },
      tokens,
    };
  }

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : null;

  const user = existingUser
    ? existingUser
    : await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: null,
          avatarUrl,
        },
      });

  if (
    existingUser &&
    !existingUser.avatarUrl &&
    avatarUrl
  ) {
    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        avatarUrl,
      },
    });
  }

  await prisma.account.create({
    data: {
      userId: user.id,
      provider: AccountProvider.GOOGLE,
      providerAccountId: googleUserId,
      accessToken:
        tokens.access_token ?? null,
      refreshToken:
        tokens.refresh_token ?? null,
      expiresAt,
    },
  });

  const updatedUser =
    await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

  if (!updatedUser) {
    throw new Error(
      "Unable to load the Google-authenticated user",
    );
  }

  return {
    user: updatedUser,
    tokens,
  };
}

/**
 * Generate GitHub's authorization URL.
 */
export function getGithubAuthorizationUrl() {
  const url = new URL(
    "https://github.com/login/oauth/authorize",
  );

  url.searchParams.set(
    "client_id",
    githubOAuthConfig.clientId,
  );

  url.searchParams.set(
    "redirect_uri",
    githubOAuthConfig.redirectUri,
  );

  url.searchParams.set(
    "scope",
    "read:user user:email",
  );

  return url.toString();
}

/**
 * Authenticate a user through GitHub OAuth.
 *
 * This:
 * 1. Exchanges the authorization code for a GitHub access token.
 * 2. Fetches the GitHub user.
 * 3. Fetches a verified GitHub email.
 * 4. Finds an existing GitHub account.
 * 5. Links GitHub to an existing SecureAI email account.
 * 6. Creates a new user when necessary.
 * 7. Creates the GitHub Account record.
 */
export async function authenticateGithubUser(
  code: string,
) {
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id:
          githubOAuthConfig.clientId,
        client_secret:
          githubOAuthConfig.clientSecret,
        code,
      }),
    },
  );

  if (!tokenResponse.ok) {
    throw new Error(
      "Failed to exchange GitHub authorization code",
    );
  }

  const tokenData =
    (await tokenResponse.json()) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

  if (!tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
        "GitHub did not return an access token",
    );
  }

  const accessToken =
    tokenData.access_token;

  const githubUserResponse =
    await fetch(
      "https://api.github.com/user",
      {
        headers: {
          Accept:
            "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version":
            "2022-11-28",
          "User-Agent": "SecureAI",
        },
      },
    );

  if (!githubUserResponse.ok) {
    throw new Error(
      "Failed to fetch GitHub user information",
    );
  }

  const githubUser =
    (await githubUserResponse.json()) as {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
      avatar_url: string | null;
    };

  const emailResponse =
    await fetch(
      "https://api.github.com/user/emails",
      {
        headers: {
          Accept:
            "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version":
            "2022-11-28",
          "User-Agent": "SecureAI",
        },
      },
    );

  if (!emailResponse.ok) {
    throw new Error(
      "Failed to fetch GitHub email information",
    );
  }

  const githubEmails =
    (await emailResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

  const verifiedEmail =
    githubEmails.find(
      (email) =>
        email.primary &&
        email.verified,
    ) ??
    githubEmails.find(
      (email) => email.verified,
    );

  if (!verifiedEmail) {
    throw new Error(
      "Your GitHub account must have a verified email address",
    );
  }

  const email = verifiedEmail.email
    .trim()
    .toLowerCase();

  const githubUserId =
    String(githubUser.id);

  const existingGithubAccount =
    await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider:
            AccountProvider.GITHUB,
          providerAccountId:
            githubUserId,
        },
      },
      include: {
        user: true,
      },
    });

  if (existingGithubAccount) {
    return {
      user: {
        id: existingGithubAccount.user.id,
        name: existingGithubAccount.user.name,
        email:
          existingGithubAccount.user.email,
        avatarUrl:
          existingGithubAccount.user.avatarUrl,
        createdAt:
          existingGithubAccount.user.createdAt,
      },
    };
  }

  const name =
    githubUser.name?.trim() ||
    githubUser.login;

  const avatarUrl =
    githubUser.avatar_url ?? null;

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  const user = existingUser
    ? existingUser
    : await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: null,
          avatarUrl,
        },
      });

  if (
    existingUser &&
    !existingUser.avatarUrl &&
    avatarUrl
  ) {
    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        avatarUrl,
      },
    });
  }

  await prisma.account.create({
    data: {
      userId: user.id,
      provider: AccountProvider.GITHUB,
      providerAccountId:
        githubUserId,
      accessToken,
      refreshToken: null,
      expiresAt: null,
    },
  });

  const updatedUser =
    await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

  if (!updatedUser) {
    throw new Error(
      "Unable to load the GitHub-authenticated user",
    );
  }

  return {
    user: updatedUser,
  };
}