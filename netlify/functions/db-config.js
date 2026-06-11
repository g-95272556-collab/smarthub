const { getStore } = require("@netlify/blobs");

const STORE_NAME = "smarthub-config";
const BLOB_KEY = "config";
const FORCED_ADMIN_EMAILS = ["once2502@gmail.com"];

const ALLOWED_EXACT_KEYS = new Set([
  "ADMIN_EMAILS_JSON",
  "FONNTE_TOKEN",
  "FONNTE_GROUP",
  "FONNTE_TEST_GROUP",
  "FONNTE_PIBG_GROUP",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_AUTH_URL",
  "GROUP_WA_KELAS_JSON",
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "OPENAI_API_KEY",
  "HL_NOTIF_ENABLED",
  "JADUAL_BERTUGAS_JSON",
  "KOKUM_PROGRAM_OPTIONS_JSON",
  "LAUNCH_DATE",
  "NOTIF_AUTO_ENABLED",
  "SENARAI_KELAS_JSON",
  "TAKWIM_EVENTS",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TELEGRAM_TOPIC_ID",
  "WORKER_URL"
]);

const ALLOWED_PREFIXES = [
  "ATTENDANCE_",
  "DUTY_NOTIF_",
  "TAKWIM_GURU_NOTIF_"
];

const ALLOWED_SUFFIXES = [
  "_JSON",
  "_TEMPLATE",
  "_NOTE",
  "_TIME",
  "_ENABLED",
  "_TARGET",
  "_TARGET_MODE",
  "_GROUP"
];

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(payload)
  };
}

function getStoreHandle() {
  const opts = {
    name: STORE_NAME,
    consistency: "strong"
  };
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (siteId && token) {
    opts.siteID = siteId;
    opts.token = token;
  }
  return getStore(opts);
}

function normalizeConfigObject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (!isAllowedKey(key)) continue;
    output[key] = value;
  }
  return output;
}

function isAllowedKey(key) {
  const name = String(key || "").trim();
  if (!name) return false;
  if (ALLOWED_EXACT_KEYS.has(name)) return true;
  if (ALLOWED_PREFIXES.some((prefix) => name.startsWith(prefix))) return true;
  if (ALLOWED_SUFFIXES.some((suffix) => name.endsWith(suffix))) return true;
  return false;
}

function normalizeEmailList(input) {
  const items = Array.isArray(input) ? input : [];
  const seen = new Set();
  return items
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function applyForcedAdminEmails(config) {
  const base = config && typeof config === "object" && !Array.isArray(config) ? { ...config } : {};
  const currentAdmins = (() => {
    try {
      return JSON.parse(String(base.ADMIN_EMAILS_JSON || "[]"));
    } catch (_error) {
      return [];
    }
  })();
  const mergedAdmins = normalizeEmailList([].concat(currentAdmins, FORCED_ADMIN_EMAILS));
  base.ADMIN_EMAILS_JSON = JSON.stringify(mergedAdmins);
  return base;
}

async function readConfig() {
  const store = getStoreHandle();
  const raw = await store.get(BLOB_KEY, { type: "json" });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return applyForcedAdminEmails({});
  return applyForcedAdminEmails(raw);
}

async function writeConfig(nextConfig) {
  const store = getStoreHandle();
  await store.setJSON(BLOB_KEY, applyForcedAdminEmails(nextConfig));
}

async function syncBlobToD1(config) {
  const workerUrl = String(process.env.WORKER_URL || "").trim();
  if (!workerUrl) {
    return { success: false, error: "WORKER_URL belum diset." };
  }

  let targetUrl = workerUrl;
  if (!targetUrl.endsWith("/api") && !targetUrl.endsWith("/api/")) {
    targetUrl = targetUrl.replace(/\/$/, "") + "/api";
  }

  const workerSecret = String(process.env.WORKER_SECRET || "").trim();
  const adminSecret = String(process.env.ADMIN_WORKER_SECRET || "").trim();

  const headers = { "Content-Type": "application/json" };
  if (workerSecret) headers["X-Worker-Secret"] = workerSecret;
  if (adminSecret) headers["X-Admin-Secret"] = adminSecret;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "setConfig",
      config
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || !payload || payload.success !== true) {
    return {
      success: false,
      error: (payload && payload.error) || ("Sync ke D1 gagal dengan status " + response.status)
    };
  }

  return { success: true, count: Object.keys(config || {}).length };
}

function parseRequestBody(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (_error) {
    return null;
  }
}

exports.handler = async function handler(event) {
  try {
    const method = String(event.httpMethod || "GET").toUpperCase();
    const query = event.queryStringParameters || {};

    if (method === "GET") {
      const config = await readConfig();
      const key = String(query.key || "").trim();
      if (key) {
        if (!isAllowedKey(key)) {
          return json(400, { success: false, error: "Unknown key" });
        }
        return json(200, { success: true, key, value: config[key] ?? null });
      }
      return json(200, { success: true, config });
    }

    if (method !== "POST") {
      return json(405, { success: false, error: "Method not allowed" });
    }

    if (String(query.sync || "").trim().toLowerCase() === "d1") {
      const config = await readConfig();
      const result = await syncBlobToD1(config);
      return json(result.success ? 200 : 500, result);
    }

    const parsed = parseRequestBody(event.body);
    if (!parsed) {
      return json(400, { success: false, error: "Invalid JSON body" });
    }

    let update = {};
    if (parsed.config && typeof parsed.config === "object" && !Array.isArray(parsed.config)) {
      update = normalizeConfigObject(parsed.config);
    } else if (parsed.key) {
      const key = String(parsed.key || "").trim();
      if (!isAllowedKey(key)) {
        return json(400, { success: false, error: "Unknown key" });
      }
      update[key] = parsed.value;
    }

    if (!Object.keys(update).length) {
      return json(400, { success: false, error: "No data" });
    }

    const current = await readConfig();
    const nextConfig = { ...current, ...update };
    await writeConfig(nextConfig);

    return json(200, {
      success: true,
      updatedKeys: Object.keys(update),
      count: Object.keys(update).length,
      config: nextConfig
    });
  } catch (error) {
    return json(500, {
      success: false,
      error: error && error.message ? error.message : "Unknown server error"
    });
  }
};
