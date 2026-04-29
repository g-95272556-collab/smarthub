const DEFAULT_GOOGLE_CLIENT_ID = "553204925712-p975t8hnehd4vfhs3igf4ba9c63edf0f.apps.googleusercontent.com";
const DEFAULT_ALLOWED_EMAIL_DOMAINS = ["moe-dl.edu.my"];
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const GOOGLE_KEYS_CACHE = {
  expiresAt: 0,
  keys: new Map()
};

export async function handleGoogleOAuthRequest(request, env = {}, options = {}) {
  const url = new URL(request.url);
  const corsHeaders = buildCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (matchesRoute(url.pathname, options.basePath || "/auth/google", "/health")) {
      return jsonResponse({
        success: true,
        service: "google-oauth",
        platform: options.platform || "generic",
        basePath: normalizeBasePath(options.basePath || "/auth/google"),
        timestamp: new Date().toISOString(),
        allowedOriginsConfigured: getAllowedOrigins(env).length > 0,
        allowedClientIds: getAllowedGoogleClientIds(env),
        allowedEmailDomains: getAllowedGoogleEmailDomains(env)
      }, 200, corsHeaders);
    }

    if (matchesRoute(url.pathname, options.basePath || "/auth/google", "/config")) {
      return jsonResponse({
        success: true,
        config: {
          basePath: normalizeBasePath(options.basePath || "/auth/google"),
          clientIds: getAllowedGoogleClientIds(env),
          allowedEmailDomains: getAllowedGoogleEmailDomains(env)
        }
      }, 200, corsHeaders);
    }

    if (matchesRoute(url.pathname, options.basePath || "/auth/google", "") || matchesRoute(url.pathname, options.basePath || "/auth/google", "/verify")) {
      if (request.method !== "POST") {
        return jsonResponse({ success: false, error: "Gunakan POST untuk verifikasi Google OAuth." }, 405, corsHeaders);
      }
      const payload = await readJsonBody(request);
      const actor = await verifyGoogleCredential(payload, env);
      return jsonResponse({
        success: true,
        actor,
        verifiedAt: new Date().toISOString()
      }, 200, corsHeaders);
    }

    return jsonResponse({ success: false, error: "Laluan OAuth tidak dijumpai." }, 404, corsHeaders);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : "Ralat dalaman OAuth."
    }, error && error.status ? error.status : 500, corsHeaders);
  }
}

export async function verifyGoogleCredential(payload, env = {}) {
  const credential = String(
    (payload && (payload.credential || payload.idToken || payload.token)) || ""
  ).trim();
  if (!credential) {
    throw httpError(400, "Token Google tidak diterima.");
  }

  const jwt = parseJwt(credential);
  if (jwt.header.alg !== "RS256") {
    throw httpError(401, "Algoritma token Google tidak disokong.");
  }

  const keys = await getGoogleVerificationKeys();
  const jwk = keys.get(String(jwt.header.kid || "").trim());
  if (!jwk) {
    throw httpError(401, "Kunci verifikasi Google tidak ditemui.");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    jwt.signatureBytes,
    new TextEncoder().encode(jwt.signingInput)
  );
  if (!verified) {
    throw httpError(401, "Tandatangan token Google tidak sah.");
  }

  const claims = jwt.payload || {};
  const now = Math.floor(Date.now() / 1000);
  if (!GOOGLE_ISSUERS.has(String(claims.iss || "").trim())) {
    throw httpError(403, "Penerbit token Google tidak sah.");
  }

  const audience = String(claims.aud || "").trim();
  if (!getAllowedGoogleClientIds(env).includes(audience)) {
    throw httpError(403, "Client ID Google tidak dibenarkan.");
  }

  const exp = Number(claims.exp || 0);
  if (!exp || exp <= now) {
    throw httpError(401, "Sesi Google telah tamat.");
  }

  const nbf = Number(claims.nbf || 0);
  if (nbf && nbf > now + 60) {
    throw httpError(401, "Token Google belum aktif.");
  }

  if (!(claims.email_verified === true || claims.email_verified === "true")) {
    throw httpError(403, "Email Google belum disahkan.");
  }

  const email = String(claims.email || "").trim().toLowerCase();
  if (!email) {
    throw httpError(403, "Email pengguna tidak ditemui dalam token Google.");
  }

  const allowedDomains = getAllowedGoogleEmailDomains(env);
  if (allowedDomains.length && !isAllowedEmailDomain(email, allowedDomains)) {
    throw httpError(403, "Domain email Google tidak dibenarkan.");
  }

  return {
    email,
    name: String(claims.name || "").trim(),
    picture: String(claims.picture || "").trim(),
    sub: String(claims.sub || "").trim(),
    hd: String(claims.hd || "").trim(),
    aud: audience,
    iss: String(claims.iss || "").trim()
  };
}

async function getGoogleVerificationKeys() {
  if (GOOGLE_KEYS_CACHE.expiresAt > Date.now() && GOOGLE_KEYS_CACHE.keys.size) {
    return GOOGLE_KEYS_CACHE.keys;
  }

  const response = await fetch(GOOGLE_JWKS_URL, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw httpError(502, "Gagal memuat kunci Google untuk verifikasi.");
  }

  const data = await response.json();
  const keys = new Map();
  for (const key of Array.isArray(data && data.keys) ? data.keys : []) {
    if (!key || !key.kid) continue;
    keys.set(String(key.kid).trim(), key);
  }
  if (!keys.size) {
    throw httpError(502, "Tiada kunci Google diterima untuk verifikasi.");
  }

  GOOGLE_KEYS_CACHE.keys = keys;
  GOOGLE_KEYS_CACHE.expiresAt = Date.now() + getMaxAgeMs(response.headers.get("cache-control"));
  return GOOGLE_KEYS_CACHE.keys;
}

function getMaxAgeMs(cacheControl) {
  const match = String(cacheControl || "").match(/max-age=(\d+)/i);
  const seconds = match ? Number(match[1]) : 3600;
  return Math.max(60, seconds) * 1000;
}

function parseJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw httpError(400, "Format token Google tidak sah.");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecodeToText(headerPart));
    payload = JSON.parse(base64UrlDecodeToText(payloadPart));
  } catch {
    throw httpError(400, "Token Google tidak dapat dibaca.");
  }

  return {
    header,
    payload,
    signingInput: `${headerPart}.${payloadPart}`,
    signatureBytes: base64UrlDecodeToBytes(signaturePart)
  };
}

function base64UrlDecodeToText(value) {
  const normalized = normalizeBase64(value);
  return decodeURIComponent(
    Array.from(atob(normalized))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
}

function base64UrlDecodeToBytes(value) {
  const normalized = normalizeBase64(value);
  const decoded = atob(normalized);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

function normalizeBase64(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
}

function getAllowedGoogleClientIds(env) {
  const configured = firstNonEmpty(
    env.GOOGLE_CLIENT_IDS,
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_IDS,
    env.GOOGLE_OAUTH_CLIENT_ID
  );
  if (!configured) return [DEFAULT_GOOGLE_CLIENT_ID];
  const list = splitCsv(configured);
  return list.length ? list : [DEFAULT_GOOGLE_CLIENT_ID];
}

function getAllowedGoogleEmailDomains(env) {
  const configured = firstNonEmpty(
    env.GOOGLE_ALLOWED_EMAIL_DOMAINS,
    env.GOOGLE_ALLOWED_DOMAIN,
    env.GOOGLE_WORKSPACE_DOMAIN
  );
  const list = configured ? splitCsv(configured).map((item) => item.toLowerCase()) : [];
  return list.length ? list : DEFAULT_ALLOWED_EMAIL_DOMAINS.slice();
}

function getAllowedOrigins(env) {
  return splitCsv(firstNonEmpty(env.ALLOWED_ORIGINS, env.GOOGLE_ALLOWED_ORIGINS, env.CORS_ALLOWED_ORIGINS) || "");
}

function isAllowedEmailDomain(email, allowedDomains) {
  const domain = String(email || "").split("@")[1] || "";
  return allowedDomains.includes(domain.toLowerCase());
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = !allowedOrigins.length
    ? "*"
    : allowedOrigins.includes(origin)
      ? origin
      : "null";
  const headers = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8"
  };
  if (allowedOrigins.length) {
    headers.Vary = "Origin";
  };
  return headers;
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function normalizeBasePath(value) {
  const raw = String(value || "").trim() || "/auth/google";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

function matchesRoute(pathname, basePath, extraPath) {
  const normalizedBase = normalizeBasePath(basePath);
  const normalizedExtra = extraPath ? `/${String(extraPath).replace(/^\/+/, "")}` : "";
  const target = `${normalizedBase}${normalizedExtra}`.replace(/\/+$/, "") || "/";
  const current = String(pathname || "").replace(/\/+$/, "") || "/";
  return current === target;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw httpError(400, "Body JSON tidak sah.");
  }
}

function jsonResponse(payload, status, headers) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
