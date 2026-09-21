const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri = process.env.GITHUB_CALLBACK_URL;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error(
    "GitHub OAuth environment variables are not configured",
  );
}

export const githubOAuthConfig = {
  clientId,
  clientSecret,
  redirectUri,
};