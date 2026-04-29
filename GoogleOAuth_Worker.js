import { handleGoogleOAuthRequest } from "./workers/google-oauth-core.mjs";

export default {
  async fetch(request, env) {
    return handleGoogleOAuthRequest(request, env, {
      platform: "cloudflare",
      basePath: "/auth/google"
    });
  }
};
