import { handleGoogleOAuthRequest } from "../../workers/google-oauth-core.mjs";

export default async (request) => {
  const normalizedRequest = normalizeNetlifyFunctionRequest(request);
  return handleGoogleOAuthRequest(normalizedRequest, readNetlifyEnv(), {
    platform: "netlify",
    basePath: "/auth/google"
  });
};

function readNetlifyEnv() {
  const names = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_IDS",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_IDS",
    "GOOGLE_ALLOWED_EMAIL_DOMAINS",
    "GOOGLE_ALLOWED_DOMAIN",
    "GOOGLE_WORKSPACE_DOMAIN",
    "ALLOWED_ORIGINS",
    "GOOGLE_ALLOWED_ORIGINS",
    "CORS_ALLOWED_ORIGINS"
  ];
  const env = {};
  for (const name of names) {
    try {
      const value = globalThis.Netlify && Netlify.env ? Netlify.env.get(name) : "";
      if (value) env[name] = value;
    } catch {
      // Netlify env helper is unavailable outside the function runtime.
    }
  }
  return env;
}

function normalizeNetlifyFunctionRequest(request) {
  const url = new URL(request.url);
  const functionBasePath = "/.netlify/functions/google-oauth";
  if (!url.pathname.startsWith(functionBasePath)) return request;

  const suffix = url.pathname.slice(functionBasePath.length);
  url.pathname = "/auth/google" + (suffix || "");
  return new Request(url.toString(), request);
}
