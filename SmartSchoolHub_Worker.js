// ============================================================
// SMART SCHOOL HUB v2.0 — Cloudflare Worker
// SK Kiandongo — Token Protection Layer
// ============================================================

const DEFAULT_GOOGLE_CLIENT_ID = "553204925712-p975t8hnehd4vfhs3igf4ba9c63edf0f.apps.googleusercontent.com";
const WORKER_BUILD_ID = "authfix-verify-session-20260429-2232";
const DEFAULT_ADMIN_EMAILS = [
  "g-69272581@moe-dl.edu.my",
  "g-95272556@moe-dl.edu.my",
  "g-03272560@moe-dl.edu.my",
  "g-87272555@moe-dl.edu.my"
];
const ADMIN_ROLES = [
  "guru besar",
  "penolong kanan hem",
  "penolong kanan kokurikulum",
  "penolong kanan pentadbiran"
];
const STUDENT_CLASSES = ["1 NILAM","2 INTAN","3 KRISTAL","4 MUTIARA","5 DELIMA","6 BAIDURI"];
const DEFAULT_GROUP_WA_KELAS = {
  "1 NILAM": "120363408263111964@g.us",
  "2 INTAN": "120363307119469701@g.us",
  "3 KRISTAL": "120363158710638763@g.us",
  "4 MUTIARA": "120363047423182758@g.us",
  "5 DELIMA": "120363040172356242@g.us",
  "6 BAIDURI": "60195327614-1585453088@g.us"
};
const DEFAULT_KOKUM_PROGRAM_OPTIONS = {
  "UNIT BERUNIFORM": [
    "Kadet Remaja Sekolah (KRS)",
    "Pengakap"
  ],
  "KELAB DAN PERSATUAN": [
    "Kelab STEM",
    "Kelab Seni Muzik"
  ],
  "SUKAN DAN PERMAINAN": [
    "Bola Tampar",
    "Catur",
    "Sepak Takraw",
    "Memanah",
    "Olahraga"
  ]
};
const TEACHER_READABLE_SHEETS = [
  "GURU",
  "MURID",
  "KEHADIRAN_GURU",
  "KEHADIRAN_MURID",
  "LAPORAN_BERTUGAS",
  "LAPORAN_KOKUM",
  "BIRTHDAY_LOG",
  "HARI_LAHIR"
];
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_KEYS_CACHE = {
  expiresAt: 0,
  keys: new Map()
};
const RATE_LIMIT_CACHE = new Map();
const RATE_LIMIT_RULES = {
  apiRead: { limit: 180, windowMs: 60 * 1000 },
  apiWrite: { limit: 60, windowMs: 60 * 1000 },
  apiSensitive: { limit: 20, windowMs: 60 * 1000 },
  ai: { limit: 12, windowMs: 60 * 1000 },
  token: { limit: 20, windowMs: 60 * 1000 }
};
const SENSITIVE_ACTIONS = new Set([
  "setConfig",
  "appendRow",
  "appendRows",
  "replaceSheet",
  "updateSheet",
  "batchUpdate",
  "setupAllSheets",
  "storeLetterFile",
  "verifySession"
]);
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: https://lh3.googleusercontent.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://xbasmarthub.netlify.app https://smartschoolhub-skkiandongo.g-95272556.workers.dev https://smartschoolhub-google-oauth.g-95272556.workers.dev https://api.open-meteo.com https://api.waktusolat.app https://accounts.google.com https://api.telegram.org https://api.fonnte.com https://docs.google.com https://generativelanguage.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com https://*.googleusercontent.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), microphone=(), camera=()"
};
const DEFAULT_ALLOWED_CORS_ORIGINS = [
  "https://xbasmarthub.netlify.app",
  "https://smartschoolhub-skkiandongo.g-95272556.workers.dev"
];
const LOCAL_DEV_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
const DUTY_SCHEDULE_2026 = [
  { isnin: "2026-01-12", guru: "BETTY BINTI JIM", telefon: "01124135966", pembantu: "FAZILAH BINTI ALI", telefonPembantu: "0134461416" },
  { isnin: "2026-01-19", guru: "FAZILAH BINTI ALI", telefon: "0134461416", pembantu: "OKTOVYANTI KOH", telefonPembantu: "0138665663" },
  { isnin: "2026-01-26", guru: "OKTOVYANTI KOH", telefon: "0138665663", pembantu: "STENLEY DOMINIC", telefonPembantu: "01135988995" },
  { isnin: "2026-02-02", guru: "STENLEY DOMINIC", telefon: "01135988995", pembantu: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefonPembantu: "01121792758" },
  { isnin: "2026-02-09", guru: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefon: "01121792758", pembantu: "TAIMAH BINTI ILOK", telefonPembantu: "01123607380" },
  { isnin: "2026-02-16", guru: "TAIMAH BINTI ILOK", telefon: "01123607380", pembantu: "ALOHA BINTI IBIN", telefonPembantu: "0135560671" },
  { isnin: "2026-02-23", guru: "ALOHA BINTI IBIN", telefon: "0135560671", pembantu: "JIDA MINSES", telefonPembantu: "01126605349" },
  { isnin: "2026-03-02", guru: "JIDA MINSES", telefon: "01126605349", pembantu: "BETTY BINTI JIM", telefonPembantu: "01124135966" },
  { isnin: "2026-03-09", guru: "BETTY BINTI JIM", telefon: "01124135966", pembantu: "FAZILAH BINTI ALI", telefonPembantu: "0134461416" },
  { isnin: "2026-03-16", guru: "FAZILAH BINTI ALI", telefon: "0134461416", pembantu: "OKTOVYANTI KOH", telefonPembantu: "0138665663" },
  { isnin: "2026-03-30", guru: "OKTOVYANTI KOH", telefon: "0138665663", pembantu: "STENLEY DOMINIC", telefonPembantu: "01135988995" },
  { isnin: "2026-04-06", guru: "STENLEY DOMINIC", telefon: "01135988995", pembantu: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefonPembantu: "01121792758" },
  { isnin: "2026-04-13", guru: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefon: "01121792758", pembantu: "TAIMAH BINTI ILOK", telefonPembantu: "01123607380" },
  { isnin: "2026-04-20", guru: "TAIMAH BINTI ILOK", telefon: "01123607380", pembantu: "ALOHA BINTI IBIN", telefonPembantu: "0135560671" },
  { isnin: "2026-04-27", guru: "ALOHA BINTI IBIN", telefon: "0135560671", pembantu: "JIDA MINSES", telefonPembantu: "01126605349" },
  { isnin: "2026-05-04", guru: "JIDA MINSES", telefon: "01126605349", pembantu: "BETTY BINTI JIM", telefonPembantu: "01124135966" },
  { isnin: "2026-05-11", guru: "BETTY BINTI JIM", telefon: "01124135966", pembantu: "FAZILAH BINTI ALI", telefonPembantu: "0134461416" },
  { isnin: "2026-05-18", guru: "FAZILAH BINTI ALI", telefon: "0134461416", pembantu: "OKTOVYANTI KOH", telefonPembantu: "0138665663" },
  { isnin: "2026-06-08", guru: "OKTOVYANTI KOH", telefon: "0138665663", pembantu: "STENLEY DOMINIC", telefonPembantu: "01135988995" },
  { isnin: "2026-06-15", guru: "STENLEY DOMINIC", telefon: "01135988995", pembantu: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefonPembantu: "01121792758" },
  { isnin: "2026-06-22", guru: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefon: "01121792758", pembantu: "TAIMAH BINTI ILOK", telefonPembantu: "01123607380" },
  { isnin: "2026-06-29", guru: "TAIMAH BINTI ILOK", telefon: "01123607380", pembantu: "ALOHA BINTI IBIN", telefonPembantu: "0135560671" },
  { isnin: "2026-07-06", guru: "ALOHA BINTI IBIN", telefon: "0135560671", pembantu: "JIDA MINSES", telefonPembantu: "01126605349" },
  { isnin: "2026-07-13", guru: "JIDA MINSES", telefon: "01126605349", pembantu: "BETTY BINTI JIM", telefonPembantu: "01124135966" },
  { isnin: "2026-07-20", guru: "BETTY BINTI JIM", telefon: "01124135966", pembantu: "FAZILAH BINTI ALI", telefonPembantu: "0134461416" },
  { isnin: "2026-07-27", guru: "FAZILAH BINTI ALI", telefon: "0134461416", pembantu: "OKTOVYANTI KOH", telefonPembantu: "0138665663" },
  { isnin: "2026-08-03", guru: "OKTOVYANTI KOH", telefon: "0138665663", pembantu: "STENLEY DOMINIC", telefonPembantu: "01135988995" },
  { isnin: "2026-08-10", guru: "STENLEY DOMINIC", telefon: "01135988995", pembantu: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefonPembantu: "01121792758" },
  { isnin: "2026-08-17", guru: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefon: "01121792758", pembantu: "TAIMAH BINTI ILOK", telefonPembantu: "01123607380" },
  { isnin: "2026-08-24", guru: "TAIMAH BINTI ILOK", telefon: "01123607380", pembantu: "ALOHA BINTI IBIN", telefonPembantu: "0135560671" },
  { isnin: "2026-09-07", guru: "ALOHA BINTI IBIN", telefon: "0135560671", pembantu: "JIDA MINSES", telefonPembantu: "01126605349" },
  { isnin: "2026-09-14", guru: "JIDA MINSES", telefon: "01126605349", pembantu: "BETTY BINTI JIM", telefonPembantu: "01124135966" },
  { isnin: "2026-09-21", guru: "BETTY BINTI JIM", telefon: "01124135966", pembantu: "FAZILAH BINTI ALI", telefonPembantu: "0134461416" },
  { isnin: "2026-09-28", guru: "FAZILAH BINTI ALI", telefon: "0134461416", pembantu: "OKTOVYANTI KOH", telefonPembantu: "0138665663" },
  { isnin: "2026-10-05", guru: "OKTOVYANTI KOH", telefon: "0138665663", pembantu: "STENLEY DOMINIC", telefonPembantu: "01135988995" },
  { isnin: "2026-10-12", guru: "STENLEY DOMINIC", telefon: "01135988995", pembantu: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefonPembantu: "01121792758" },
  { isnin: "2026-10-19", guru: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF", telefon: "01121792758", pembantu: "TAIMAH BINTI ILOK", telefonPembantu: "01123607380" },
  { isnin: "2026-10-26", guru: "TAIMAH BINTI ILOK", telefon: "01123607380", pembantu: "ALOHA BINTI IBIN", telefonPembantu: "0135560671" },
  { isnin: "2026-11-02", guru: "ALOHA BINTI IBIN", telefon: "0135560671", pembantu: "JIDA MINSES", telefonPembantu: "01126605349" },
  { isnin: "2026-11-09", guru: "JIDA MINSES", telefon: "01126605349", pembantu: "BETTY BINTI JIM", telefonPembantu: "01124135966" },
  { isnin: "2026-11-16", guru: "BETTY BINTI JIM", telefon: "01124135966", pembantu: "FAZILAH BINTI ALI", telefonPembantu: "0134461416" },
  { isnin: "2026-11-23", guru: "FAZILAH BINTI ALI", telefon: "0134461416", pembantu: "OKTOVYANTI KOH", telefonPembantu: "0138665663" },
  { isnin: "2026-11-30", guru: "OKTOVYANTI KOH", telefon: "0138665663", pembantu: "STENLEY DOMINIC", telefonPembantu: "01135988995" }
];

const GOOGLE_TOKEN_CACHE = new Map();
let GURU_SHEET_CACHE = { rows: null, expiresAt: 0, backendMode: "" };
let GOOGLE_SHEETS_TOKEN_CACHE = { accessToken: "", expiresAt: 0 };
let D1_SCHEMA_READY = false;
const DIRECT_SHEETS = {
  GURU: "GURU",
  MURID: "MURID",
  KEHADIRAN_GURU: "KEHADIRAN_GURU",
  KEHADIRAN_MURID: "KEHADIRAN_MURID",
  LAPORAN_BERTUGAS: "LAPORAN_BERTUGAS",
  LAPORAN_KOKUM: "LAPORAN_KOKUM",
  BIRTHDAY_LOG: "BIRTHDAY_LOG",
  HARILAHIR: "HARILAHIR",
  HARI_LAHIR: "HARILAHIR",
  CONFIG: "CONFIG"
};
const DIRECT_HEADERS = {
  GURU: ["Nama","Emel","Jawatan","Kelas","Telefon","Status","WhatsApp","Tarikh Lahir","Catatan","Kokum Unit Beruniform","Kokum Kelab Dan Persatuan","Kokum Sukan Dan Permainan","Dikemaskini","Oleh"],
  MURID: ["Nama","Kelas","Jantina","Tarikh Lahir","Telefon Wali","Nama Wali","No. IC","Status","Catatan","Kokum Unit Beruniform","Kokum Kelab Dan Persatuan","Kokum Sukan Dan Permainan","Dikemaskini","Oleh"],
  KEHADIRAN_GURU: ["ID","TARIKH","EMAIL_GURU","NAMA_GURU","MASA_DAFTAR","STATUS","LATITUD","LONGITUD","JARAK_METER","DALAM_GEOFENCE","MOCK_LOCATION","DEVELOPER_MODE","ACCURACY_GPS","GPS_SPOOFING_FLAG","JENIS_CUTI","CATATAN","IP_ADDRESS","USER_AGENT"],
  KEHADIRAN_MURID: ["ID","TARIKH","KELAS","NAMA_MURID","JANTINA","STATUS","TELEFON_WALI","GURU_EMAIL","GURU_NAMA","CATATAN","DIKEMASKINI","OLEH"],
  LAPORAN_BERTUGAS: ["Minggu","Guru Bertugas","Jawatan","Aktiviti Isnin","Aktiviti Selasa","Aktiviti Rabu","Aktiviti Khamis","Aktiviti Jumaat","% Kehadiran","RMT Penerima","RMT Catatan","Disiplin Kes","Disiplin Jenis","Disiplin Butiran","Kebersihan","Catatan Kebersihan","Kelas Terbersih","Catatan Anugerah","Rumusan AI","Dikemaskini","Oleh"],
  LAPORAN_KOKUM: ["Tarikh","Hari","Nama Guru","Email Guru","Kategori","Unit Beruniform/Kelab dan Persatuan/Sukan dan Permainan","Masa","Tempat","Tajuk / Fokus","Objektif","Butiran Aktiviti","Bil Lelaki","Bil Perempuan","Bil Hadir","Bil Tidak Hadir","Penglibatan Murid","Pencapaian / Hasil","Isu / Kekangan","Tindakan Susulan","Catatan Tambahan","Dikemaskini","Oleh"],
  BIRTHDAY_LOG: ["Masa","Jenis","Penerima","Status","Mesej"],
  HARILAHIR: ["Nama","Peranan","Kelas","Tarikh Lahir","Telefon"],
  CONFIG: ["Kunci","Nilai"]
};

function getBackendConfigDefaults() {
  return {
    WORKER_SECRET: "",
    ADMIN_EMAIL: "",
    ADMIN_EMAILS_JSON: JSON.stringify(DEFAULT_ADMIN_EMAILS),
    SCHOOL_LAT: "5.3055655",
    SCHOOL_LNG: "116.9633906",
    SCHOOL_RADIUS: "200",
    FONNTE_TOKEN: "",
    FONNTE_GROUP: "",
    GROUP_WA_KELAS_JSON: JSON.stringify(DEFAULT_GROUP_WA_KELAS),
    JADUAL_BERTUGAS_JSON: JSON.stringify(DUTY_SCHEDULE_2026),
    KOKUM_PROGRAM_OPTIONS_JSON: JSON.stringify(DEFAULT_KOKUM_PROGRAM_OPTIONS),
    TELEGRAM_BOT: "",
    TELEGRAM_CHAT: "",
    TELEGRAM_TOPIC: "",
    DEEPSEEK_API_KEY: "",
    OPENAI_API_KEY: "",
    NOTIF_AUTO_ENABLED: "true",
    HL_NOTIF_ENABLED: "true",
    ATTENDANCE_GURU_NOTIF_ENABLED: "true",
    ATTENDANCE_GURU_REMINDER_TIME: "07:45",
    ATTENDANCE_MURID_NOTIF_ENABLED: "true",
    ATTENDANCE_MURID_CUTOFF_TIME: "09:00",
    ATTENDANCE_MURID_NOTIFY_GUARDIAN: "true",
    ATTENDANCE_MURID_NOTIFY_CLASS_GROUP: "true",
    ATTENDANCE_MURID_NOTIFY_TELEGRAM: "true",
    ATTENDANCE_GURU_ADMIN_TEMPLATE: "Peringatan Kehadiran Guru\n\nGuru berikut belum mendaftar kehadiran pada {TARIKH}:\n\n{SENARAI}\n\nSila daftar segera.\n\n_{SEKOLAH}_",
    ATTENDANCE_GURU_PERSONAL_TEMPLATE: "Peringatan\n\nCikgu {NAMA}, anda belum mendaftar kehadiran hari ini ({TARIKH}). Sila daftar segera.\n\n_{SEKOLAH}_",
    ATTENDANCE_MURID_GUARDIAN_TEMPLATE: "Makluman Kehadiran\n\nSelamat sejahtera,\n\nAnak jagaan tuan/puan, {NAMA} dari kelas {KELAS}, direkodkan {STATUS} pada {TARIKH}.\n\nSila hubungi pihak sekolah jika ada pertanyaan.\n\n_{SEKOLAH}_",
    ATTENDANCE_MURID_SUMMARY_TEMPLATE: "Makluman Kehadiran Murid\n\nTarikh: {TARIKH}\nKelas: {KELAS}\nBilangan: {BILANGAN}\n\n{SENARAI}\n\n_{SEKOLAH}_",
    ATTENDANCE_MURID_CLASS_GROUP_TEMPLATE: "Makluman Kehadiran - {KELAS}\n\nMurid tidak hadir pada {TARIKH}:\n\n{SENARAI}\n\n_{SEKOLAH}_",
    ATTENDANCE_NOTIF_NOTE: ""
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);

    // Handle OPTIONS preflight — mesti return 204
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withSecurityHeaders(corsHeaders) });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/_headers") {
        return new Response("Not found", {
          status: 404,
          headers: withSecurityHeaders({ "Content-Type": "text/plain; charset=utf-8" })
        });
      }

      if (path === "/api" || path.startsWith("/api/")) {
        return await handleAPI(request, env, corsHeaders);
      }
      if (path === "/ai/image") {
        enforceRateLimit(request, "ai", RATE_LIMIT_RULES.ai);
        return await handleAIImage(request, env, corsHeaders);
      }
      if (path === "/ai/gemini") {
        enforceRateLimit(request, "ai", RATE_LIMIT_RULES.ai);
        return await handleAIGemini(request, env, corsHeaders);
      }
      if (path === "/ai" || path.startsWith("/ai/")) {
        enforceRateLimit(request, "ai", RATE_LIMIT_RULES.ai);
        return await handleAI(request, env, corsHeaders);
      }
      if (path === "/token") {
        enforceRateLimit(request, "token", RATE_LIMIT_RULES.token);
        return await generateTokenEndpoint(request, env, corsHeaders);
      }
      if (path.startsWith("/letter/")) {
        return await handleLetterFile(request, env, corsHeaders, path);
      }

      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        return withSecurityHeaders(await env.ASSETS.fetch(request));
      }

      return jsonResp({ success: false, error: "Laluan tidak dijumpai" }, 404, corsHeaders);
    } catch (err) {
      return jsonResp(
        { success: false, error: err.message || "Ralat dalaman Worker", code: err.code || "WORKER_ERROR" },
        err.status || 500,
        corsHeaders
      );
    }
  }
};

async function generateTokenEndpoint(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${env.WORKER_SECRET}`) {
    return jsonResp({ success: false, error: "Tidak dibenarkan" }, 401, corsHeaders);
  }
  const token = await generateDailyToken(env.WORKER_SECRET);
  return jsonResp({ success: true, token }, 200, corsHeaders);
}

function buildCorsHeaders(request, env) {
  const origin = String(request.headers.get("Origin") || "").trim();
  const configuredOrigins = String(env.ALLOWED_CORS_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...DEFAULT_ALLOWED_CORS_ORIGINS, ...configuredOrigins]);
  const allowOrigin = origin && (allowedOrigins.has(origin) || LOCAL_DEV_ORIGIN_RE.test(origin))
    ? origin
    : DEFAULT_ALLOWED_CORS_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

async function generateDailyToken(secret) {
  if (!secret) throw new Error("WORKER_SECRET not configured");
  const mytDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const yyyy = mytDate.getFullYear();
  const mm   = String(mytDate.getMonth() + 1).padStart(2, "0");
  const dd   = String(mytDate.getDate()).padStart(2, "0");
  const data = new TextEncoder().encode(`${yyyy}${mm}${dd}${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function handleAPI(request, env, corsHeaders) {
  if (!env.WORKER_SECRET) {
    return jsonResp({ success: false, error: "WORKER_SECRET tidak dikonfigurasi" }, 500, corsHeaders);
  }

  let body;
  if (request.method === "POST") {
    body = await request.json();
  } else {
    body = Object.fromEntries(new URL(request.url).searchParams);
  }

  enforceRateLimit(
    request,
    "api:" + String(body.action || "unknown"),
    SENSITIVE_ACTIONS.has(String(body.action || "")) ? RATE_LIMIT_RULES.apiSensitive :
      request.method === "POST" ? RATE_LIMIT_RULES.apiWrite : RATE_LIMIT_RULES.apiRead
  );
  if (SENSITIVE_ACTIONS.has(String(body.action || ""))) {
    logWorkerEvent("sensitive_api_request", {
      action: String(body.action || "unknown"),
      client: maskClientIdentifier(getClientIdentifier(request))
    });
  }

  if (body.action === "ping") {
    return jsonResp({
      success: true,
      worker: "ok",
      backendMode: getBackendMode(env),
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  }

  const workerToken = await generateDailyToken(env.WORKER_SECRET);

  // ── Service Account bypass: untuk Apps Script / sistem dalaman ──
  // Guna action "serviceReadSheet" dengan serviceToken = daily token
  if (body.action === "serviceReadSheet") {
    if (!body.serviceToken || body.serviceToken !== workerToken) {
      return jsonResp({ success: false, error: "Service token tidak sah", code: "AUTH_REQUIRED" }, 401, corsHeaders);
    }
    const sheetKey = String(body.sheetKey || "").trim();
    if (!sheetKey) return jsonResp({ success: false, error: "sheetKey diperlukan" }, 400, corsHeaders);
    try {
      const rows = shouldUseCloudflareD1(env)
        ? await d1ReadSheetRows(env, sheetKey)
        : await readBackendSheetRows(env, sheetKey, workerToken);
      return jsonResp({ success: true, rows }, 200, corsHeaders);
    } catch (e) {
      return jsonResp({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  if (needsAuthenticatedRequest(body)) {
    try {
      const actor = await verifyGoogleIdentity(body.auth || {}, env);
      await authorizeRequest(body, actor, env, workerToken);
      body.requestUser = actor;
    } catch (err) {
      return jsonResp(
        { success: false, error: err.message || "Akses tidak dibenarkan", code: err.code || "AUTH_REQUIRED" },
        err.status || 403,
        corsHeaders
      );
    }
  }

  validateSheetMutationPayload(body);

  delete body.auth;
  body.token = workerToken;

  if (body.action === "verifySession") {
    try {
      return jsonResp({ success: true, actor: await buildVerifiedSessionActor(body.requestUser, env, workerToken) }, 200, corsHeaders);
    } catch (err) {
      const configuredAdminEmails = await getConfiguredAdminEmails(env, workerToken);
      const debugAuth = {
        receivedEmail: String(body.requestUser && body.requestUser.email || "").trim().toLowerCase(),
        receivedName: String(body.requestUser && body.requestUser.name || "").trim(),
        receivedSub: String(body.requestUser && body.requestUser.sub || "").trim(),
        adminMatchedByDefaultList: isSystemAdminActor(body.requestUser, null),
        adminMatchedByConfiguredList: isSystemAdminActor(body.requestUser, null, configuredAdminEmails)
      };
      return jsonResp(
        { success: false, error: err.message || "Akses tidak dibenarkan", code: err.code || "AUTH_FORBIDDEN", debugAuth },
        err.status || 403,
        corsHeaders
      );
    }
  }

  if (body.action === "getDiagnostics") {
    const diagnostics = await getBackendDiagnostics(env);
    return jsonResp({
      success: true,
      ...diagnostics,
      hasWorkerSecret: Boolean(env.WORKER_SECRET),
      buildId: WORKER_BUILD_ID,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  }

  if (body.action === "getKokumAttendanceSummary") {
    try {
      return jsonResp({ success: true, summary: await buildKokumAttendanceSummary(env, body, workerToken) }, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "Gagal memuat ringkasan kehadiran kokum." }, err.status || 500, corsHeaders);
    }
  }

  if (body.action === "storeLetterFile") {
    try {
      if (!env.DB) return jsonResp({ success: false, error: "D1 tidak dikonfigurasi" }, 500, corsHeaders);
      const base64 = String(body.data || "");
      const mimeType = String(body.mimeType || "image/jpeg");
      const filename = String(body.filename || "surat.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
      if (!base64 || base64.length < 100) return jsonResp({ success: false, error: "Data fail kosong" }, 400, corsHeaders);
      if (base64.length > 3000000) return jsonResp({ success: false, error: "Fail terlalu besar (max ~2MB)" }, 400, corsHeaders);
      const id = crypto.randomUUID().replace(/-/g, "");
      const now = Math.floor(Date.now() / 1000);
      const expires = now + 86400; // 24 jam
      await env.DB.prepare("DELETE FROM letter_cache WHERE expires_at < ?").bind(now).run();
      await env.DB.prepare("INSERT INTO letter_cache (id, data, mime_type, filename, created_at, expires_at) VALUES (?,?,?,?,?,?)")
        .bind(id, base64, mimeType, filename, now, expires).run();
      const workerBase = new URL(request.url).origin;
      return jsonResp({ success: true, url: workerBase + "/letter/" + id + "/" + filename, id }, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "Gagal simpan fail" }, 500, corsHeaders);
    }
  }

  // ── getMurid: Senarai murid mengikut kelas untuk cetakan lembaran kerja ──
  if (body.action === "getMurid") {
    try {
      const kelas = String(body.kelas || "").trim();
      if (!kelas) return jsonResp({ success: false, error: "Parameter kelas diperlukan." }, 400, corsHeaders);
      const rows = await readBackendSheetRows(env, "MURID", workerToken);
      const murid = rows
        .filter(row => {
          const kelasRow = String(Array.isArray(row) ? (row[1] || "") : "").trim();
          return kelasRow.toLowerCase() === kelas.toLowerCase();
        })
        .map(row => String(Array.isArray(row) ? (row[0] || "") : "").trim())
        .filter(n => n.length > 0);
      return jsonResp({ success: true, murid, kelas, jumlah: murid.length }, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "Gagal mendapatkan senarai murid." }, 500, corsHeaders);
    }
  }

  // ── saveAiUsage: simpan penggunaan AI harian ke D1 (satu baris per email per hari) ──
  if (body.action === "saveAiUsage") {
    try {
      if (!env.DB) return jsonResp({ success: false, error: "D1 tidak dikonfigurasi" }, 500, corsHeaders);
      await ensureD1Schema(env);
      const email = String(body.email || (body.requestUser && body.requestUser.email) || "").trim().toLowerCase();
      const date = String(body.date || "").trim();
      if (!email || !date) return jsonResp({ success: false, error: "email dan date diperlukan" }, 400, corsHeaders);
      await env.DB.prepare(`
        INSERT INTO ai_usage_log
          (email, date, gemini_images, gemini_texts, gemini_limit_hits,
           deepseek_texts, deepseek_errors, deepseek_last_status, deepseek_last_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(email, date) DO UPDATE SET
          gemini_images      = excluded.gemini_images,
          gemini_texts       = excluded.gemini_texts,
          gemini_limit_hits  = excluded.gemini_limit_hits,
          deepseek_texts     = excluded.deepseek_texts,
          deepseek_errors    = excluded.deepseek_errors,
          deepseek_last_status = excluded.deepseek_last_status,
          deepseek_last_at   = excluded.deepseek_last_at,
          updated_at         = CURRENT_TIMESTAMP
      `).bind(
        email, date,
        parseInt(body.geminiImages || 0, 10),
        parseInt(body.geminiTexts || 0, 10),
        parseInt(body.geminiLimitHits || 0, 10),
        parseInt(body.deepseekTexts || 0, 10),
        parseInt(body.deepseekErrors || 0, 10),
        String(body.deepseekLastStatus || ""),
        String(body.deepseekLastAt || "")
      ).run();
      return jsonResp({ success: true }, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "Gagal simpan AI usage." }, 500, corsHeaders);
    }
  }

  // ── getAiUsage: baca penggunaan AI ──
  // Guru biasa: dapat rekod sendiri sahaja
  // Admin: dapat semua guru untuk tarikh yang diminta
  if (body.action === "getAiUsage") {
    try {
      if (!env.DB) return jsonResp({ success: false, error: "D1 tidak dikonfigurasi" }, 500, corsHeaders);
      await ensureD1Schema(env);
      const date = String(body.date || "").trim();
      if (!date) return jsonResp({ success: false, error: "date diperlukan" }, 400, corsHeaders);
      const reqEmail = String((body.requestUser && body.requestUser.email) || "").trim().toLowerCase();
      const isAdmin = DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(reqEmail);
      let rows;
      if (isAdmin && body.allUsers) {
        // Admin: semua guru untuk tarikh ini
        const result = await env.DB.prepare(
          "SELECT email, date, gemini_images, gemini_texts, gemini_limit_hits, deepseek_texts, deepseek_errors, deepseek_last_status, deepseek_last_at, updated_at FROM ai_usage_log WHERE date = ? ORDER BY email ASC"
        ).bind(date).all();
        rows = result.results || [];
      } else {
        // Guru biasa: rekod sendiri sahaja
        const result = await env.DB.prepare(
          "SELECT email, date, gemini_images, gemini_texts, gemini_limit_hits, deepseek_texts, deepseek_errors, deepseek_last_status, deepseek_last_at, updated_at FROM ai_usage_log WHERE email = ? AND date = ?"
        ).bind(reqEmail, date).all();
        rows = result.results || [];
      }
      return jsonResp({ success: true, rows, date, isAdmin }, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "Gagal baca AI usage." }, 500, corsHeaders);
    }
  }

  if (shouldUseCloudflareD1(env)) {
    try {
      const data = await handleD1Action(body, env, workerToken);
      const finalData = await maybeFilterReadSheetResponse(body, data, env, workerToken);
      return jsonResp(finalData, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "D1 backend gagal." }, err.status || 500, corsHeaders);
    }
  }

  if (shouldUseGoogleSheets(env)) {
    try {
      const data = await handleGoogleSheetsAction(body, env);
      const finalData = await maybeFilterReadSheetResponse(body, data, env, workerToken);
      return jsonResp(finalData, 200, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message || "Google Sheets backend gagal." }, err.status || 500, corsHeaders);
    }
  }

  return jsonResp({ success: false, error: "Tiada backend data dikonfigurasi." }, 500, corsHeaders);
}

function shouldUseGoogleSheets(env) {
  return Boolean(
    String(env.GOOGLE_SHEETS_BACKEND || "").trim() === "1" &&
    String(env.GOOGLE_SHEETS_SPREADSHEET_ID || "").trim() &&
    String(env.GOOGLE_API_CLIENT_ID || "").trim() &&
    String(env.GOOGLE_API_CLIENT_SECRET || "").trim() &&
    String(env.GOOGLE_API_REFRESH_TOKEN || "").trim()
  );
}

function shouldUseCloudflareD1(env) {
  return Boolean(
    String(env.CLOUDFLARE_D1_BACKEND || "").trim() === "1" &&
    env.DB
  );
}

function getBackendMode(env) {
  if (shouldUseCloudflareD1(env)) return "cloudflare-d1";
  if (shouldUseGoogleSheets(env)) return "google-sheets";
  return "none";
}

async function readBackendSheetRows(env, sheetKey, workerToken) {
  if (shouldUseCloudflareD1(env)) {
    return d1ReadSheetRows(env, sheetKey);
  }
  if (shouldUseGoogleSheets(env)) {
    return googleReadSheetRows(env, sheetKey);
  }
  throw new Error("Tiada backend data aktif untuk pembacaan sheet.");
}

function parseKokumAllowedYears(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item, index, arr) => item > 0 && arr.indexOf(item) === index);
}

function getClassYearFromLabel(kelas) {
  const match = String(kelas || "").trim().match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

function normalizeKokumMembershipToken(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[()]/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKokumMembershipColumnIndex(category) {
  const normalized = normalizeText(category);
  if (normalized === "unit beruniform") return 9;
  if (normalized === "kelab dan persatuan") return 10;
  if (normalized === "sukan dan permainan") return 11;
  return -1;
}

function getKokumMembershipAliases(unit) {
  const normalized = normalizeKokumMembershipToken(unit);
  if (!normalized) return [];
  if (
    normalized === "KADET REMAJA SEKOLAH KRS" ||
    normalized === "KRS" ||
    normalized === "TKRS" ||
    normalized === "TUNAS KADET REMAJA SEKOLAH"
  ) {
    return ["KADET REMAJA SEKOLAH KRS", "KRS", "TKRS", "TUNAS KADET REMAJA SEKOLAH"];
  }
  return [normalized];
}

function matchesSelectedKokumMembership(rawMembership, unit) {
  const aliases = getKokumMembershipAliases(unit);
  if (!aliases.length) return false;
  const memberships = String(rawMembership || "")
    .split(/[;,]+/)
    .map((item) => normalizeKokumMembershipToken(item))
    .filter(Boolean);
  return memberships.some((item) => aliases.includes(item));
}

function isPresentKokumAttendanceStatus(status) {
  const normalized = normalizeText(status);
  return normalized === "hadir" || normalized === "lewat";
}

async function buildKokumAttendanceSummary(env, body, workerToken) {
  const tarikh = String(body && body.tarikh || "").trim();
  const kategori = String(body && body.kategori || "").trim();
  const unit = String(body && body.unit || "").trim();
  const allowedYears = parseKokumAllowedYears(body && body.allowedYears);
  if (!tarikh) throw makeHttpError(400, "Tarikh kokum diperlukan.", "KOKUM_DATE_REQUIRED");
  if (!kategori) throw makeHttpError(400, "Kategori kokum diperlukan.", "KOKUM_CATEGORY_REQUIRED");
  if (!unit) throw makeHttpError(400, "Unit kokum diperlukan.", "KOKUM_UNIT_REQUIRED");
  if (!allowedYears.length) {
    return { bilLelaki: 0, bilPerempuan: 0, bilHadir: 0, bilTidakHadir: 0, jumlahMurid: 0 };
  }

  const membershipIndex = getKokumMembershipColumnIndex(kategori);
  if (membershipIndex < 0) {
    throw makeHttpError(400, "Kategori kokum tidak sah.", "KOKUM_CATEGORY_INVALID");
  }

  const [muridRows, hadirRows] = await Promise.all([
    readBackendSheetRows(env, DIRECT_SHEETS.MURID, workerToken),
    readBackendSheetRows(env, DIRECT_SHEETS.KEHADIRAN_MURID, workerToken)
  ]);

  const enrolledMap = new Map();
  for (let i = 1; i < muridRows.length; i++) {
    const row = muridRows[i] || [];
    const nama = String(row[0] || "").trim();
    const kelas = String(row[1] || "").trim();
    if (!nama || !kelas) continue;
    if (!allowedYears.includes(getClassYearFromLabel(kelas))) continue;
    if (!matchesSelectedKokumMembership(row[membershipIndex], unit)) continue;
    const key = `${kelas}|${nama}`.toUpperCase();
    enrolledMap.set(key, {
      nama,
      kelas,
      jantina: String(row[2] || "").trim()
    });
  }

  const latestAttendanceMap = new Map();
  for (let i = 1; i < hadirRows.length; i++) {
    const row = hadirRows[i] || [];
    const rowTarikh = String(row[1] || "").trim();
    const kelas = String(row[2] || "").trim();
    const nama = String(row[3] || "").trim();
    if (!rowTarikh || rowTarikh !== tarikh || !kelas || !nama) continue;
    if (!allowedYears.includes(getClassYearFromLabel(kelas))) continue;
    const key = `${kelas}|${nama}`.toUpperCase();
    if (!enrolledMap.has(key)) continue;
    latestAttendanceMap.set(key, {
      status: String(row[5] || "").trim()
    });
  }

  let bilLelaki = 0;
  let bilPerempuan = 0;
  let bilHadir = 0;
  let bilTidakHadir = 0;

  for (const [key, murid] of enrolledMap.entries()) {
    const jantina = normalizeText(murid.jantina);
    if (jantina.includes("lelaki")) bilLelaki += 1;
    else if (jantina.includes("perempuan")) bilPerempuan += 1;
    const attendance = latestAttendanceMap.get(key);
    if (attendance && isPresentKokumAttendanceStatus(attendance.status)) bilHadir += 1;
    else bilTidakHadir += 1;
  }

  return {
    bilLelaki,
    bilPerempuan,
    bilHadir,
    bilTidakHadir,
    jumlahMurid: enrolledMap.size,
    kategori,
    unit,
    tarikh
  };
}

async function getBackendDiagnostics(env) {
  const diagnostics = {
    backendMode: getBackendMode(env),
    cloudflareD1Configured: String(env.CLOUDFLARE_D1_BACKEND || "").trim() === "1",
    cloudflareD1Ready: false,
    cloudflareD1Error: "",
    cloudflareD1Summary: null,
    googleSheetsConfigured: shouldUseGoogleSheets(env),
    googleSheetsReady: false,
    googleSheetsError: "",
    googleSheetsBindings: {
      spreadsheetId: Boolean(String(env.GOOGLE_SHEETS_SPREADSHEET_ID || "").trim()),
      clientId: Boolean(String(env.GOOGLE_API_CLIENT_ID || "").trim()),
      clientSecret: Boolean(String(env.GOOGLE_API_CLIENT_SECRET || "").trim()),
      refreshToken: Boolean(String(env.GOOGLE_API_REFRESH_TOKEN || "").trim())
    }
  };
  if (shouldUseCloudflareD1(env)) {
    try {
      await d1ReadSheetRows(env, DIRECT_SHEETS.CONFIG);
      diagnostics.cloudflareD1Ready = true;
      diagnostics.cloudflareD1Summary = await getD1CapacitySummary(env);
    } catch (err) {
      diagnostics.cloudflareD1Error = err.message || String(err);
    }
  }
  if (!shouldUseGoogleSheets(env)) {
    return diagnostics;
  }
  try {
    await googleReadSheetRows(env, DIRECT_SHEETS.CONFIG, null, false);
    diagnostics.googleSheetsReady = true;
  } catch (err) {
    diagnostics.googleSheetsError = err.message || String(err);
  }
  return diagnostics;
}

async function handleGoogleSheetsAction(body, env) {
  switch (body.action) {
    case "getConfig":
      var gCfg = await googleGetConfig(env);
      if (env.GEMINI_API_KEY) gCfg.GEMINI_API_KEY = env.GEMINI_API_KEY;
      if (env.OPENAI_API_KEY) gCfg.OPENAI_API_KEY = env.OPENAI_API_KEY;
      return { success: true, config: gCfg };
    case "setConfig":
      await googleSetConfig(env, body.config || {});
      if (body.config && Object.keys(body.config || {}).some((key) => String(key || "").trim())) {
        invalidateGuruSheetCache();
      }
      return { success: true };
    case "setupAllSheets":
      await googleSetupAllSheets(env);
      invalidateGuruSheetCache();
      return { success: true, message: "Sheets dan CONFIG siap." };
    case "readSheet":
      return { success: true, rows: await googleReadSheetRows(env, body.sheetKey) };
    case "appendRow":
      await googleAppendRows(env, body.sheetKey, [body.row || []]);
      if (normalizeSheetKey(body.sheetKey) === DIRECT_SHEETS.GURU) invalidateGuruSheetCache();
      return { success: true };
    case "appendRows":
      await googleAppendRows(env, body.sheetKey, body.rows || []);
      if (normalizeSheetKey(body.sheetKey) === DIRECT_SHEETS.GURU) invalidateGuruSheetCache();
      return { success: true };
    case "replaceSheet":
      await googleReplaceSheet(env, body.sheetKey, body.rows || []);
      if (normalizeSheetKey(body.sheetKey) === DIRECT_SHEETS.GURU) invalidateGuruSheetCache();
      return { success: true };
    default:
      return { success: false, error: "Aksi tidak sah" };
  }
}

async function handleD1Action(body, env) {
  switch (body.action) {
    case "getConfig":
      var d1Cfg = await d1GetConfig(env, body.token);
      if (env.GEMINI_API_KEY) d1Cfg.GEMINI_API_KEY = env.GEMINI_API_KEY;
      if (env.OPENAI_API_KEY) d1Cfg.OPENAI_API_KEY = env.OPENAI_API_KEY;
      return { success: true, config: d1Cfg };
    case "getSummary":
      return { success: true, summary: await d1GetSummary(env) };
    case "setConfig":
      await d1SetConfig(env, body.config || {});
      if (body.config && Object.keys(body.config || {}).some((key) => String(key || "").trim())) {
        invalidateGuruSheetCache();
      }
      return { success: true };
    case "setupAllSheets":
      await d1SetupAllSheets(env);
      invalidateGuruSheetCache();
      return { success: true, message: "D1 dan CONFIG siap." };
    case "readSheet":
      return { success: true, rows: await d1ReadSheetRows(env, body.sheetKey) };
    case "appendRow":
      await d1AppendRows(env, body.sheetKey, [body.row || []]);
      if (normalizeSheetKey(body.sheetKey) === DIRECT_SHEETS.GURU) invalidateGuruSheetCache();
      return { success: true };
    case "appendRows":
      await d1AppendRows(env, body.sheetKey, body.rows || []);
      if (normalizeSheetKey(body.sheetKey) === DIRECT_SHEETS.GURU) invalidateGuruSheetCache();
      return { success: true };
    case "replaceSheet":
      await d1ReplaceSheet(env, body.sheetKey, body.rows || []);
      if (normalizeSheetKey(body.sheetKey) === DIRECT_SHEETS.GURU) invalidateGuruSheetCache();
      return { success: true };
    case "clearSheet":
      await d1ClearSheet(env, body.sheetKey);
      invalidateGuruSheetCache();
      return { success: true };
    case "clearAllData":
      await d1ClearAllData(env);
      invalidateGuruSheetCache();
      return { success: true };
    default:
      return { success: false, error: "Aksi tidak sah" };
  }
}

function invalidateGuruSheetCache() {
  GURU_SHEET_CACHE = { rows: null, expiresAt: 0, backendMode: "" };
}

async function ensureD1Schema(env) {
  if (D1_SCHEMA_READY) return;
  if (!env.DB) {
    throw new Error("D1 binding DB tidak tersedia.");
  }
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS sheet_rows (
      sheet_name TEXT NOT NULL,
      row_index INTEGER NOT NULL,
      row_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (sheet_name, row_index)
    )
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_sheet_rows_sheet_name_row_index
    ON sheet_rows(sheet_name, row_index)
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS letter_cache (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ai_usage_log (
      email TEXT NOT NULL,
      date TEXT NOT NULL,
      gemini_images INTEGER DEFAULT 0,
      gemini_texts INTEGER DEFAULT 0,
      gemini_limit_hits INTEGER DEFAULT 0,
      deepseek_texts INTEGER DEFAULT 0,
      deepseek_errors INTEGER DEFAULT 0,
      deepseek_last_status TEXT DEFAULT '',
      deepseek_last_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (email, date)
    )
  `).run();
  D1_SCHEMA_READY = true;
}

function d1RowToJson(row) {
  return JSON.stringify(Array.isArray(row) ? row : []);
}

function d1ParseRowJson(rowJson) {
  if (!rowJson) return [];
  try {
    const parsed = JSON.parse(rowJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

async function d1ReadSheetRows(env, sheetKey) {
  const sheetName = normalizeSheetKey(sheetKey);
  if (!sheetName) return [];
  await ensureD1Schema(env);
  const result = await env.DB.prepare(
    "SELECT row_json FROM sheet_rows WHERE sheet_name = ? ORDER BY row_index ASC"
  ).bind(sheetName).all();
  return Array.isArray(result.results) ? result.results.map((item) => d1ParseRowJson(item.row_json)) : [];
}

async function d1ClearSheet(env, sheetKey) {
  const sheetName = normalizeSheetKey(sheetKey);
  if (!sheetName) return;
  await ensureD1Schema(env);
  await env.DB.prepare("DELETE FROM sheet_rows WHERE sheet_name = ?").bind(sheetName).run();
}

async function d1ClearAllData(env) {
  await ensureD1Schema(env);
  await env.DB.prepare("DELETE FROM sheet_rows").run();
}

async function d1UpdateSheetValues(env, sheetKey, rows) {
  const sheetName = normalizeSheetKey(sheetKey);
  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row)) : [];
  if (!sheetName || !safeRows.length) return;
  await ensureD1Schema(env);
  const statements = safeRows.map((row, idx) =>
    env.DB.prepare(
      "INSERT INTO sheet_rows (sheet_name, row_index, row_json, updated_at) VALUES (?, ?, ?, ?)"
    ).bind(sheetName, idx, d1RowToJson(row), getMalaysiaDateTimeString())
  );
  await env.DB.batch(statements);
}

async function d1AppendRows(env, sheetKey, rows) {
  const sheetName = normalizeSheetKey(sheetKey);
  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row) && row.length) : [];
  if (!sheetName || !safeRows.length) return;
  await ensureD1Schema(env);
  const lastRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(row_index), -1) AS max_index FROM sheet_rows WHERE sheet_name = ?"
  ).bind(sheetName).first();
  let nextIndex = Number(lastRow && lastRow.max_index != null ? lastRow.max_index : -1) + 1;
  const statements = safeRows.map((row) =>
    env.DB.prepare(
      "INSERT INTO sheet_rows (sheet_name, row_index, row_json, updated_at) VALUES (?, ?, ?, ?)"
    ).bind(sheetName, nextIndex++, d1RowToJson(row), getMalaysiaDateTimeString())
  );
  await env.DB.batch(statements);
}

async function d1ReplaceSheet(env, sheetKey, rows) {
  const sheetName = normalizeSheetKey(sheetKey);
  if (!sheetName) return;
  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row)) : [];
  await d1ClearSheet(env, sheetName);
  if (safeRows.length) {
    await d1UpdateSheetValues(env, sheetName, safeRows);
  }
}

async function d1EnsureHeaderRow(env, sheetName, header) {
  const rows = await d1ReadSheetRows(env, sheetName);
  if (!rows.length) {
    await d1UpdateSheetValues(env, sheetName, [header]);
  }
}

async function d1GetConfig(env, workerToken = "") {
  const rows = await d1ReadSheetRows(env, DIRECT_SHEETS.CONFIG);
  const out = { ...getBackendConfigDefaults() };
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i]?.[0] || "").trim();
    if (key) out[key] = String(rows[i]?.[1] || "");
  }
  return out;
}

async function d1SetConfig(env, configObj) {
  const existing = await d1GetConfig(env);
  const merged = { ...existing };
  for (const [key, value] of Object.entries(configObj || {})) {
    merged[String(key || "").trim()] = String(value == null ? "" : value);
  }
  const rows = [DIRECT_HEADERS.CONFIG];
  Object.keys(merged).forEach((key) => {
    if (key) rows.push([key, merged[key]]);
  });
  await d1ReplaceSheet(env, DIRECT_SHEETS.CONFIG, rows);
}

async function d1EnsureConfigDefaults(env, defaults) {
  const current = await d1GetConfig(env);
  const missing = {};
  for (const [key, value] of Object.entries(defaults || {})) {
    if (!(key in current)) {
      missing[key] = value;
    }
  }
  if (Object.keys(missing).length) {
    await d1SetConfig(env, missing);
  }
}

async function d1SetupAllSheets(env) {
  await ensureD1Schema(env);
  const sheetNames = Array.from(new Set(Object.values(DIRECT_SHEETS).map(normalizeSheetKey).filter(Boolean)));
  for (const [key, header] of Object.entries(DIRECT_HEADERS)) {
    const sheetName = normalizeSheetKey(key);
    await d1EnsureHeaderRow(env, sheetName, header);
  }
  for (const sheetName of sheetNames) {
    await d1ReadSheetRows(env, sheetName);
  }
  await d1EnsureConfigDefaults(env, getBackendConfigDefaults());
}

async function getD1CapacitySummary(env) {
  const summary = await d1GetSummary(env);
  const sheets = Array.isArray(summary && summary.sheets) ? summary.sheets : [];
  const sizeBytes = Number(summary && summary.sizeBytes) || 0;
  const totalRecords = sheets.reduce((sum, item) => {
    const count = Number(item && item.data_count);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
  const largestSheet = sheets.slice().sort((a, b) => {
    const countA = Number(a && a.data_count);
    const countB = Number(b && b.data_count);
    return (Number.isFinite(countB) ? countB : 0) - (Number.isFinite(countA) ? countA : 0);
  })[0] || null;
  return {
    sizeBytes,
    sheetCount: sheets.length,
    totalRecords,
    largestSheet: largestSheet ? {
      sheet_name: largestSheet.sheet_name || "",
      data_count: Number(largestSheet.data_count) || 0
    } : null,
    checkedAt: new Date().toISOString()
  };
}

async function d1GetSummary(env) {
  await ensureD1Schema(env);
  const result = await env.DB.prepare(`
    SELECT sheet_name, CASE WHEN COUNT(*) > 0 THEN COUNT(*) - 1 ELSE 0 END AS data_count
    FROM sheet_rows
    GROUP BY sheet_name
    ORDER BY sheet_name ASC
  `).all();
  
  let sizeBytes = 0;
  try {
    // Estimate size since D1 restricts PRAGMA page_count
    const sizeRes = await env.DB.prepare(`
      SELECT SUM(
        LENGTH(CAST(sheet_name AS BLOB)) + 
        LENGTH(CAST(row_json AS BLOB)) + 
        LENGTH(CAST(updated_at AS BLOB)) + 8
      ) as total_bytes 
      FROM sheet_rows
    `).first();
    sizeBytes = sizeRes && sizeRes.total_bytes ? parseInt(sizeRes.total_bytes, 10) : 0;
    // Add 20% overhead for SQLite B-Tree structure and indexes
    sizeBytes = Math.floor(sizeBytes * 1.2);
  } catch (err) {
    console.error("D1 size error:", err);
  }
  
  return {
    sheets: Array.isArray(result.results) ? result.results : [],
    sizeBytes: sizeBytes
  };
}

async function getGoogleSheetsAccessToken(env) {
  if (
    GOOGLE_SHEETS_TOKEN_CACHE.accessToken &&
    GOOGLE_SHEETS_TOKEN_CACHE.expiresAt > Date.now() + 60000
  ) {
    return GOOGLE_SHEETS_TOKEN_CACHE.accessToken;
  }

  const form = new URLSearchParams();
  form.set("client_id", String(env.GOOGLE_API_CLIENT_ID || "").trim());
  form.set("client_secret", String(env.GOOGLE_API_CLIENT_SECRET || "").trim());
  form.set("refresh_token", String(env.GOOGLE_API_REFRESH_TOKEN || "").trim());
  form.set("grant_type", "refresh_token");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Gagal dapatkan token Google Sheets.");
  }

  GOOGLE_SHEETS_TOKEN_CACHE = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000)
  };
  return GOOGLE_SHEETS_TOKEN_CACHE.accessToken;
}

async function googleApiFetch(env, path, init = {}) {
  const token = await getGoogleSheetsAccessToken(env);
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_SPREADSHEET_ID}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body
  });

  if (response.status === 204) {
    return {};
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : {};
  if (!response.ok) {
    const message = data?.error?.message || `Google Sheets API error (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return { raw: text };
  }
}

function quoteSheetName(sheetName) {
  return `'${String(sheetName || "").replace(/'/g, "''")}'`;
}

function buildSheetRange(sheetName, a1 = "A:ZZ") {
  return `${quoteSheetName(sheetName)}!${a1}`;
}

function normalizeSheetKey(sheetKey) {
  const key = String(sheetKey || "").trim();
  return DIRECT_SHEETS[key] || key;
}

async function googleGetSpreadsheetMeta(env) {
  return googleApiFetch(env, "?fields=sheets.properties");
}

async function googleEnsureSheetsExist(env, sheetNames) {
  const wanted = Array.from(new Set((sheetNames || []).map(normalizeSheetKey).filter(Boolean)));
  if (!wanted.length) return;

  const meta = await googleGetSpreadsheetMeta(env);
  const existing = new Set(((meta.sheets || []).map((sheet) => sheet?.properties?.title)).filter(Boolean));
  const requests = wanted
    .filter((name) => !existing.has(name))
    .map((title) => ({ addSheet: { properties: { title } } }));

  if (!requests.length) return;
  await googleApiFetch(env, ":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests })
  });
}

async function googleReadSheetRows(env, sheetKey, ctx = null, ensureExists = true) {
  const sheetName = normalizeSheetKey(sheetKey);
  if (!sheetName) return [];
  if (ctx && ctx.readCache && ctx.readCache.has(sheetName)) {
    return ctx.readCache.get(sheetName);
  }
  if (ensureExists) {
    await googleEnsureSheetsExist(env, [sheetName]);
  }
  const data = await googleApiFetch(
    env,
    `/values/${encodeURIComponent(buildSheetRange(sheetName))}?majorDimension=ROWS`
  );
  const rows = Array.isArray(data.values) ? data.values : [];
  if (ctx && ctx.readCache) {
    ctx.readCache.set(sheetName, rows);
  }
  return rows;
}

async function googleClearSheet(env, sheetKey) {
  const sheetName = normalizeSheetKey(sheetKey);
  await googleEnsureSheetsExist(env, [sheetName]);
  await googleApiFetch(env, `/values/${encodeURIComponent(buildSheetRange(sheetName))}:clear`, {
    method: "POST",
    body: "{}"
  });
}

async function googleUpdateSheetValues(env, sheetKey, rows) {
  const sheetName = normalizeSheetKey(sheetKey);
  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row)) : [];
  if (!safeRows.length) return;
  const width = safeRows.reduce((maxCols, row) => Math.max(maxCols, row.length || 0), 0);
  const paddedRows = safeRows.map((row) => padDirectRow(row, width));
  const endColumn = columnToLetters(width);
  const range = buildSheetRange(sheetName, `A1:${endColumn}${paddedRows.length}`);
  await googleApiFetch(
    env,
    `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: paddedRows
      })
    }
  );
}

async function googleAppendRows(env, sheetKey, rows) {
  const sheetName = normalizeSheetKey(sheetKey);
  const ctx = { readCache: new Map() };
  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row) && row.length) : [];
  if (!safeRows.length) return;
  await googleEnsureSheetsExist(env, [sheetName]);
  await googleEnsureHeader(env, sheetName, ctx);

  const normalizedRows = [];
  for (const row of safeRows) {
    if (sheetName === DIRECT_SHEETS.KEHADIRAN_GURU) {
      normalizedRows.push(await normalizeDirectKehadiranGuruRow(env, row, ctx));
      continue;
    }
    if (sheetName === DIRECT_SHEETS.KEHADIRAN_MURID) {
      normalizedRows.push(await normalizeDirectKehadiranMuridRow(env, row, ctx));
      continue;
    }
    normalizedRows.push(row);
  }

  const width = normalizedRows.reduce((maxCols, row) => Math.max(maxCols, row.length || 0), 0);
  const values = normalizedRows.map((row) => padDirectRow(row, width));
  await googleApiFetch(
    env,
    `/values/${encodeURIComponent(buildSheetRange(sheetName, "A1"))}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values })
    }
  );
}

async function googleReplaceSheet(env, sheetKey, rows) {
  const sheetName = normalizeSheetKey(sheetKey);
  await googleEnsureSheetsExist(env, [sheetName]);
  await googleClearSheet(env, sheetName);

  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row)) : [];
  if (safeRows.length) {
    await googleUpdateSheetValues(env, sheetName, safeRows);
    return;
  }

  const header = DIRECT_HEADERS[sheetKey] || DIRECT_HEADERS[getDirectKeyByValue(DIRECT_SHEETS, sheetName)];
  if (header) {
    await googleUpdateSheetValues(env, sheetName, [header]);
  }
}

async function googleSetupAllSheets(env) {
  const sheetNames = Object.values(DIRECT_SHEETS);
  await googleEnsureSheetsExist(env, sheetNames);
  for (const [key, header] of Object.entries(DIRECT_HEADERS)) {
    const sheetName = normalizeSheetKey(key);
    await googleEnsureHeaderRow(env, sheetName, header);
  }
  await ensureGoogleConfigDefaults(env, getBackendConfigDefaults());
}

async function googleEnsureHeaderRow(env, sheetName, header) {
  const rows = await googleReadSheetRows(env, sheetName);
  if (!rows.length) {
    await googleUpdateSheetValues(env, sheetName, [header]);
    return;
  }
  const endColumn = columnToLetters(header.length);
  const range = buildSheetRange(sheetName, `A1:${endColumn}1`);
  await googleApiFetch(
    env,
    `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: [header]
      })
    }
  );
}

async function googleGetConfig(env) {
  const rows = await googleReadSheetRows(env, DIRECT_SHEETS.CONFIG);
  const out = { ...getBackendConfigDefaults() };
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i]?.[0] || "").trim();
    if (key) out[key] = String(rows[i]?.[1] || "");
  }
  return out;
}

async function googleSetConfig(env, configObj) {
  await googleEnsureSheetsExist(env, [DIRECT_SHEETS.CONFIG]);
  const existing = await googleGetConfig(env);
  const merged = { ...existing };
  for (const [key, value] of Object.entries(configObj || {})) {
    merged[String(key || "").trim()] = String(value == null ? "" : value);
  }
  const rows = [DIRECT_HEADERS.CONFIG];
  Object.keys(merged).forEach((key) => {
    if (key) rows.push([key, merged[key]]);
  });
  await googleReplaceSheet(env, DIRECT_SHEETS.CONFIG, rows);
}

async function ensureGoogleConfigDefaults(env, defaults) {
  const current = await googleGetConfig(env);
  const missing = {};
  for (const [key, value] of Object.entries(defaults || {})) {
    if (!(key in current)) {
      missing[key] = value;
    }
  }
  if (Object.keys(missing).length) {
    await googleSetConfig(env, missing);
  }
}

async function googleEnsureHeader(env, sheetName, ctx = null) {
  const rows = await googleReadSheetRows(env, sheetName, ctx);
  if (rows.length) return;
  const header = DIRECT_HEADERS[getDirectKeyByValue(DIRECT_SHEETS, sheetName)];
  if (!header) return;
  await googleUpdateSheetValues(env, sheetName, [header]);
  if (ctx && ctx.readCache) {
    ctx.readCache.set(sheetName, [header]);
  }
}

async function normalizeDirectKehadiranGuruRow(env, rowValues, ctx) {
  const row = Array.isArray(rowValues) ? rowValues.slice() : [];
  if (row.length >= DIRECT_HEADERS.KEHADIRAN_GURU.length) {
    return padDirectRow(row, DIRECT_HEADERS.KEHADIRAN_GURU.length);
  }
  const nama = directString(row[0]);
  const tarikh = directString(row[1]);
  const status = directString(row[2]);
  const masa = directString(row[3]);
  const catatan = directString(row[4]);
  const email = directString(row[5]);
  const gps = splitDirectGps(directString(row[6]));

  return [
    crypto.randomUUID(),
    tarikh,
    email,
    nama,
    masa,
    status,
    gps.lat,
    gps.lng,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    catatan,
    "",
    ""
  ];
}

async function normalizeDirectKehadiranMuridRow(env, rowValues, ctx) {
  const row = Array.isArray(rowValues) ? rowValues.slice() : [];
  if (row.length >= DIRECT_HEADERS.KEHADIRAN_MURID.length) {
    return padDirectRow(row, DIRECT_HEADERS.KEHADIRAN_MURID.length);
  }
  const nama = directString(row[0]);
  const kelas = directString(row[1]);
  const tarikh = directString(row[2]);
  const status = directString(row[3]);
  const telefonWali = directString(row[4]);
  const catatan = directString(row[5]);
  const guruEmail = directString(row[6]);
  const guruNama = await directFindGuruNameByEmail(env, guruEmail, ctx);
  const murid = await directFindMuridMeta(env, nama, kelas, ctx);

  return [
    crypto.randomUUID(),
    tarikh,
    kelas,
    nama,
    murid.jantina,
    status,
    telefonWali || murid.telefonWali,
    guruEmail,
    guruNama,
    catatan,
    getMalaysiaDateTimeString(),
    guruEmail
  ];
}

async function directFindGuruNameByEmail(env, email, ctx) {
  const target = directString(email).toLowerCase();
  if (!target) return "";
  const rows = await googleReadSheetRows(env, DIRECT_SHEETS.GURU, ctx);
  for (let i = 1; i < rows.length; i++) {
    if (directString(rows[i]?.[1]).toLowerCase() === target) {
      return directString(rows[i]?.[0]);
    }
  }
  return "";
}

async function directFindMuridMeta(env, nama, kelas, ctx) {
  const targetNama = directString(nama).toLowerCase();
  const targetKelas = directString(kelas).toLowerCase();
  if (!targetNama) {
    return { jantina: "", telefonWali: "" };
  }
  const rows = await googleReadSheetRows(env, DIRECT_SHEETS.MURID, ctx);
  for (let i = 1; i < rows.length; i++) {
    const rowNama = directString(rows[i]?.[0]).toLowerCase();
    const rowKelas = directString(rows[i]?.[1]).toLowerCase();
    if (rowNama === targetNama && (!targetKelas || rowKelas === targetKelas)) {
      return {
        jantina: directString(rows[i]?.[2]),
        telefonWali: directString(rows[i]?.[4])
      };
    }
  }
  return { jantina: "", telefonWali: "" };
}

function directString(value) {
  return String(value == null ? "" : value).trim();
}

function splitDirectGps(gpsRaw) {
  if (!gpsRaw) return { lat: "", lng: "" };
  const parts = String(gpsRaw).split(",");
  return { lat: directString(parts[0]), lng: directString(parts[1]) };
}

function padDirectRow(row, targetLength) {
  const out = Array.isArray(row) ? row.slice(0, targetLength) : [];
  while (out.length < targetLength) out.push("");
  return out;
}

function getMalaysiaDateTimeString() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date()).replace(" ", " ");
}

function columnToLetters(columnNumber) {
  let number = Number(columnNumber || 0);
  let letters = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    number = Math.floor((number - 1) / 26);
  }
  return letters || "A";
}

async function authorizeAIRequest(body, env) {
  if (!env.WORKER_SECRET) {
    throw makeHttpError(500, "WORKER_SECRET tidak dikonfigurasi", "WORKER_SECRET_MISSING");
  }
  const actor = await verifyGoogleIdentity(body && body.auth, env);
  const workerToken = await generateDailyToken(env.WORKER_SECRET);
  await authorizeTeacherRead(body || {}, actor, env, workerToken);
  return actor;
}

function validateAIPrompt(prompt, maxLength) {
  const text = String(prompt || "").trim();
  if (!text) return { success: false, error: "Prompt diperlukan", code: "MISSING_PROMPT" };
  if (text.length > maxLength) {
    return { success: false, error: `Prompt terlalu panjang (maksimum ${maxLength} aksara).`, code: "PROMPT_TOO_LONG" };
  }
  return null;
}

function getDirectKeyByValue(obj, value) {
  return Object.keys(obj).find((key) => obj[key] === value);
}

async function handleAI(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return jsonResp({ success: false, error: "POST sahaja" }, 405, corsHeaders);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResp({ success: false, error: "JSON tidak sah" }, 400, corsHeaders); }
  try {
    await authorizeAIRequest(body, env);
  } catch (err) {
    return jsonResp({ success: false, error: err.message || "Akses AI tidak dibenarkan", code: err.code || "AUTH_REQUIRED" }, err.status || 401, corsHeaders);
  }

  if (!env.DEEPSEEK_API_KEY) {
    return jsonResp({ success: false, error: "deepseek_key_missing", message: "DEEPSEEK_API_KEY belum dikonfigurasi dalam Worker secrets." }, 503, corsHeaders);
  }

  const { prompt, type } = body;
  const promptValidation = validateAIPrompt(prompt, 12000);
  if (promptValidation) return jsonResp(promptValidation, 400, corsHeaders);

  const systemPrompts = {
    opr: `Anda adalah pembantu penulisan laporan program sekolah dalam Bahasa Malaysia. Tulis laporan OPR yang formal. Format: Tajuk, Objektif, Aktiviti, Hasil, Cabaran, Cadangan.`,
    laporan_bertugas: `Anda ialah pembantu penulisan laporan guru bertugas mingguan sekolah dalam Bahasa Malaysia formal. Tugas utama anda ialah menghasilkan rumusan mingguan yang padat, profesional, tepat berdasarkan butiran yang diberi, tanpa mereka fakta baharu.`,
    lembaran_kerja: `Anda adalah pakar pendidikan sekolah rendah Malaysia yang mahir dalam DSKP KPM. Jana lembaran kerja (worksheet) yang berkualiti, tepat dan sesuai dengan aras tahun murid yang dinyatakan.

WAJIB: Patuhi format terkini KPM untuk PBD (Pentaksiran Bilik Darjah) dan UASA (Ujian Akhir Sesi Akademik).

PERATURAN FORMAT (WAJIB IKUT):
- Gunakan TEKS BIASA sahaja. JANGAN guna markdown (*bold*, #heading, **text**, dll)
- Label bahagian: BAHAGIAN A, BAHAGIAN B, BAHAGIAN C, BAHAGIAN D
- Nombor soalan berturutan dalam setiap bahagian: 1. 2. 3. ...
- Aneka pilihan: gunakan A. B. C. D. (4 pilihan)
- Isi tempat kosong: gunakan garis bawah panjang ________________
- Baris kosong antara setiap soalan
- Akhiri dengan SKEMA PEMARKAHAN (semua jawapan untuk semua bahagian)

PERATURAN TOPIK:
- Jika dinyatakan lebih daripada satu topik, agihkan soalan secara seimbang merentasi semua topik tersebut

PERATURAN SOALAN BERGAMBAR (WAJIB IKUT):
- Jika soalan memerlukan gambar, tulis placeholder: [GAMBAR: deskripsi ringkas gambar yang diperlukan]
- Contoh: [GAMBAR: Rajah pokok dengan 5 dahan dan 3 buah pada setiap dahan]
- PENTING: Jika arahan menyatakan bilangan TEPAT soalan bergambar, WAJIB patuhi — jangan lebih, jangan kurang
- Bilangan soalan bergambar yang dinyatakan dalam ARAHAN FORMAT atau ARAHAN KHAS adalah MUTLAK

PERATURAN ARAS & KPM:
- PBD: Fokus pada penguasaan Standard Kandungan dan Standard Pembelajaran. Soalan mestilah pelbagai aras bagi membolehkan guru menilai Tahap Penguasaan (TP).
- UASA: Ikuti format instrumen pentaksiran KPM yang merangkumi soalan Objektif (Bahagian A) dan Subjektif/Struktur (Bahagian B/C).
- Aras soalan ikut Taksonomi Bloom (LOTS & HOTS).
- Kandungan WAJIB selari dengan DSKP standard kandungan yang dinyatakan
- Bahasa soalan mestilah sesuai dengan tahap murid`,
    default: `Anda adalah pembantu sekolah SK Kiandongo yang menulis dalam Bahasa Malaysia formal.`,
  };

  const maxTokensMap = { lembaran_kerja: 6000 };
  const maxTokens = maxTokensMap[type] || 1500;

  try {
    const aiResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompts[type] || systemPrompts.default },
          { role: "user", content: String(prompt) },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();

    // Detect insufficient balance
    if (aiData?.error?.code === "insufficient_balance") {
      return jsonResp({ success: false, error: "kredit_habis" }, 402, corsHeaders);
    }

    if (aiData.choices?.[0]?.message?.content) {
      return jsonResp({ success: true, content: aiData.choices[0].message.content }, 200, corsHeaders);
    }

    throw new Error("Respons AI tidak sah");
  } catch (err) {
    return jsonResp({ success: false, error: "AI error: " + err.message }, 500, corsHeaders);
  }
}

async function handleAIImage(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return jsonResp({ success: false, error: "POST sahaja" }, 405, corsHeaders);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResp({ success: false, error: "JSON tidak sah" }, 400, corsHeaders); }
  try {
    await authorizeAIRequest(body, env);
  } catch (err) {
    return jsonResp({ success: false, error: err.message || "Akses AI tidak dibenarkan", code: err.code || "AUTH_REQUIRED" }, err.status || 401, corsHeaders);
  }

  if (!env.GEMINI_API_KEY) {
    return jsonResp({ success: false, error: "gemini_key_missing", message: "GEMINI_API_KEY belum dikonfigurasi dalam Worker secrets." }, 503, corsHeaders);
  }

  const { prompt } = body;
  const promptValidation = validateAIPrompt(prompt, 1200);
  if (promptValidation) return jsonResp(promptValidation, 400, corsHeaders);

  // Build safe educational prompt for Gemini Image Generation
  const safePrompt = `Educational illustration for Malaysian primary school worksheet. ` +
    `Subject: ${String(prompt).slice(0, 800)}. ` +
    `Style: clean black and white line art, child-friendly, white background, simple textbook diagram style.`;

  const model = "gemini-3.1-flash-image-preview";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  try {
    const aiResp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: safePrompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      }),
    });

    const aiData = await aiResp.json();

    if (aiData?.error) {
      const msg = aiData.error.message || JSON.stringify(aiData.error);
      return jsonResp({ success: false, error: "gemini_image_error", message: msg }, 400, corsHeaders);
    }

    const part = aiData?.candidates?.[0]?.content?.parts?.[0];
    if (!part || !part.inlineData) throw new Error("Tiada data imej dihasilkan oleh Gemini");

    const mime = part.inlineData.mimeType || "image/png";
    const b64 = part.inlineData.data;

    return jsonResp({ success: true, image: `data:${mime};base64,${b64}` }, 200, corsHeaders);
  } catch (err) {
    return jsonResp({ success: false, error: "image_error", message: err.message }, 500, corsHeaders);
  }
}

async function handleAIGemini(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return jsonResp({ success: false, error: "POST sahaja" }, 405, corsHeaders);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResp({ success: false, error: "JSON tidak sah" }, 400, corsHeaders); }
  try {
    await authorizeAIRequest(body, env);
  } catch (err) {
    return jsonResp({ success: false, error: err.message || "Akses AI tidak dibenarkan", code: err.code || "AUTH_REQUIRED" }, err.status || 401, corsHeaders);
  }

  if (!env.GEMINI_API_KEY) {
    return jsonResp({ success: false, error: "gemini_key_missing", message: "GEMINI_API_KEY belum dikonfigurasi dalam Worker secrets." }, 503, corsHeaders);
  }

  const { prompt, type, withImage } = body;
  const promptValidation = validateAIPrompt(prompt, 16000);
  if (promptValidation) return jsonResp(promptValidation, 400, corsHeaders);

  const systemPromptLK = `Anda adalah pakar pendidikan sekolah rendah Malaysia yang mahir dalam DSKP KPM. Jana lembaran kerja (worksheet) yang berkualiti, tepat dan sesuai dengan aras tahun murid yang dinyatakan.

WAJIB: Patuhi format terkini KPM untuk PBD (Pentaksiran Bilik Darjah) dan UASA (Ujian Akhir Sesi Akademik).

PERATURAN FORMAT (WAJIB IKUT):
- JANGAN sertakan maklumat pengepala (header), tajuk sekolah, ruangan nama/tarikh/markah murid, atau sebarang elemen muka depan. Maklumat ini akan dijana oleh sistem secara automatik. Mulakan terus dengan soalan.
- Gunakan TEKS BIASA sahaja. JANGAN guna markdown (*bold*, #heading, **text**, dll)
- Label bahagian: BAHAGIAN A, BAHAGIAN B, BAHAGIAN C, BAHAGIAN D
- Nombor soalan berturutan dalam setiap bahagian: 1. 2. 3. ...
- Aneka pilihan: gunakan A. B. C. D. (4 pilihan)
- Isi tempat kosong: gunakan garis bawah panjang ________________
- Soalan subjektif/struktur/esei: WAJIB sediakan ruang jawapan kosong (garis putus-putus atau beberapa baris kosong) di bawah soalan untuk murid menulis jawapan.
- Baris kosong antara setiap soalan
- Akhiri dengan SKEMA PEMARKAHAN (semua jawapan untuk semua bahagian)

PERATURAN SOALAN BERGAMBAR:
- Jika soalan memerlukan gambar atau rajah, HASILKAN imej tersebut secara terus (native image generation) sejurus selepas teks soalan berkenaan.
- JANGAN gunakan placeholder [GAMBAR:]. Hasilkan imej sebenar.
- Pastikan imej adalah relevan dengan kandungan soalan tersebut.
- Imej WAJIB hitam putih (black and white line art) sahaja. TIADA warna langsung.
- Imej mesti KECIL dan SEDERHANA — lebar tidak melebihi 380 piksel, tinggi tidak melebihi 280 piksel.
- Resolusi RENDAH — cukup jelas untuk cetakan A4, tiada butiran halus yang tidak perlu.
- Gaya: diagram textbook ringkas, bersih, garisan tebal, latar belakang putih tulen.
- Hadkan kepada 1-2 imej per lembaran kerja sahaja.

PERATURAN TOPIK:
- Jika dinyatakan lebih daripada satu topik, agihkan soalan secara seimbang
- Kandungan WAJIB selari dengan DSKP standard kandungan yang dinyatakan

PERATURAN ARAS & KPM (WAJIB):
- PBD Berterusan / PDPC: Fokus pada penguasaan Standard Kandungan. Jana campuran soalan Objektif dan Subjektif (jumlah sekitar 15 soalan).
- UASA (Ujian Akhir Sesi Akademik): Jana soalan mengikut struktur subjek:
  * SAINS: Bahagian A (10 MCQ), Bahagian B (2 Struktur), Bahagian C (4 Struktur/Esei).
  * MATEMATIK: Bahagian A (20 Objektif/Subjektif Pendek), Bahagian B (5 Penyelesaian Masalah).
  * SEJARAH: Bahagian A (20 MCQ), Bahagian B (4 Struktur), Bahagian C (2 Esei).
  * BAHASA MELAYU: Bahagian A (Objektif), Bahagian B (Pemahaman/Tatabahasa), Bahagian C (Penulisan Pendek), Bahagian D (Penulisan Karangan).
  * BAHASA INGGERIS: Part 1-4 (Reading), Part 5-7 (Writing).
- Aras soalan ikut Taksonomi Bloom (LOTS & HOTS).
- Bahasa soalan mestilah sesuai dengan tahap murid`;

  const model = "gemini-3.1-flash-image-preview";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const reqBody = {
    systemInstruction: { parts: [{ text: systemPromptLK }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7
    }
  };

  try {
    const aiResp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    const aiData = await aiResp.json();

    if (aiData?.error) {
      const msg = aiData.error.message || JSON.stringify(aiData.error);
      const code = aiData.error.code || 0;
      if (code === 429) return jsonResp({ success: false, error: "gemini_limit", message: "Kuota Gemini API dicapai. Cuba sebentar lagi." }, 429, corsHeaders);
      if (code === 403) return jsonResp({ success: false, error: "gemini_key_invalid", message: "GEMINI_API_KEY tidak sah atau tiada akses." }, 403, corsHeaders);
      return jsonResp({ success: false, error: "gemini_error", message: msg }, 400, corsHeaders);
    }

    const candidates = aiData?.candidates?.[0]?.content?.parts || [];
    let htmlContent = "";
    let imageCount = 0;

    candidates.forEach((p) => {
      if (p.text) {
        // Tukar baris baru kepada <br> untuk paparan HTML
        htmlContent += escapeHtml(p.text).replace(/\n/g, "<br>");
      }
      if (p.inlineData) {
        imageCount++;
        const src = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
        htmlContent += `<div class="lk-inline-image" style="margin:10px 0;text-align:center;page-break-inside:avoid;break-inside:avoid;">` +
          `<img src="${src}" alt="Rajah ${imageCount}" style="max-width:60%;max-height:65mm;width:auto;height:auto;display:block;margin:0 auto;border:1pt solid #333;padding:3px;filter:grayscale(100%) contrast(1.2);">` +
          `<small style="color:#444;font-style:italic;display:block;margin-top:3px;font-size:8.5pt;">Rajah ${imageCount}</small>` +
          `</div>`;
      }
    });

    if (!htmlContent) throw new Error("Tiada kandungan dihasilkan oleh Gemini");

    return jsonResp({ success: true, content: htmlContent, images: [], isHtml: true }, 200, corsHeaders);
  } catch (err) {
    return jsonResp({ success: false, error: "gemini_error", message: err.message }, 500, corsHeaders);
  }
}

function jsonResp(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withSecurityHeaders({ ...corsHeaders, "Content-Type": "application/json" }),
  });
}

function withSecurityHeaders(responseOrHeaders) {
  if (responseOrHeaders instanceof Response) {
    const headers = new Headers(responseOrHeaders.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    return new Response(responseOrHeaders.body, {
      status: responseOrHeaders.status,
      statusText: responseOrHeaders.statusText,
      headers
    });
  }

  const headers = new Headers(responseOrHeaders || {});
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return headers;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function enforceRateLimit(request, bucket, rule) {
  const client = getClientIdentifier(request);
  const key = `${bucket}:${client}`;
  const now = Date.now();
  const current = RATE_LIMIT_CACHE.get(key);

  cleanupRateLimitCache(now);
  if (!current || current.resetAt <= now) {
    RATE_LIMIT_CACHE.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  current.count += 1;
  if (current.count > rule.limit) {
    logWorkerEvent("rate_limited", {
      bucket,
      client: maskClientIdentifier(client)
    });
    throw makeHttpError(429, "Terlalu banyak permintaan. Cuba sebentar lagi.", "RATE_LIMITED");
  }
}

function getClientIdentifier(request) {
  return String(
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  ).split(",")[0].trim() || "unknown";
}

function cleanupRateLimitCache(now) {
  if (RATE_LIMIT_CACHE.size < 1000) return;
  for (const [key, value] of RATE_LIMIT_CACHE.entries()) {
    if (!value || value.resetAt <= now) RATE_LIMIT_CACHE.delete(key);
  }
}

function logWorkerEvent(event, details = {}) {
  try {
    console.log(JSON.stringify({
      event,
      ...details,
      buildId: WORKER_BUILD_ID,
      timestamp: new Date().toISOString()
    }));
  } catch {
    // Logging must never break request handling.
  }
}

function maskClientIdentifier(value) {
  const text = String(value || "unknown");
  if (text === "unknown") return text;
  return text.length <= 6 ? "***" : `${text.slice(0, 3)}...${text.slice(-3)}`;
}

function needsAuthenticatedRequest(body) {
  if (!body) return false;
  if (body.action === "verifySession") return true;
  if (body.action === "getDiagnostics") return true;
  if (body.action === "readSheet") return true;
  if (body.action === "getMurid") return true;
  if (body.action === "storeLetterFile") return true;
  if (body.action === "getKokumAttendanceSummary") return true;
  if (body.action === "getSummary" || body.action === "clearSheet" || body.action === "clearAllData") return true;
  if (body.action === "appendRow" && (body.sheetKey === "KEHADIRAN_MURID" || body.sheetKey === "KEHADIRAN_GURU")) return true;
  if (body.action === "appendRows" && (body.sheetKey === "KEHADIRAN_MURID" || body.sheetKey === "KEHADIRAN_GURU")) return true;
  if (body.action === "replaceSheet") return true;
  if (body.action === "getConfig" || body.action === "setConfig" || body.action === "setupAllSheets") return true;
  if ((body.action === "appendRow" || body.action === "appendRows") && body.sheetKey !== "KEHADIRAN_MURID" && body.sheetKey !== "KEHADIRAN_GURU") return true;
  if (body.action === "saveAiUsage" || body.action === "getAiUsage") return true;
  return false;
}

function validateSheetMutationPayload(body) {
  if (!body || !["appendRow", "appendRows", "replaceSheet"].includes(body.action)) return;

  const sheetName = normalizeSheetKey(body.sheetKey);
  if (!sheetName) {
    throw makeHttpError(400, "sheetKey diperlukan untuk operasi simpanan.", "MISSING_SHEET_KEY");
  }

  if (body.action === "appendRow") {
    validateSheetRows(sheetName, [body.row], false);
    return;
  }

  if (body.action === "appendRows") {
    validateSheetRows(sheetName, body.rows, false);
    return;
  }

  if (body.action === "replaceSheet") {
    validateSheetRows(sheetName, body.rows, true);
  }
}

function validateSheetRows(sheetName, rows, allowHeaderRow) {
  if (!Array.isArray(rows) || !rows.length) {
    throw makeHttpError(400, "Baris data diperlukan.", "INVALID_ROWS");
  }

  const header = DIRECT_HEADERS[sheetName] || DIRECT_HEADERS[getDirectKeyByValue(DIRECT_SHEETS, sheetName)] || null;
  const maxCells = header ? header.length + 8 : 80;
  const dataRows = allowHeaderRow ? getValidationRows(rows, sheetName) : rows;
  if (!dataRows.length && !allowHeaderRow) {
    throw makeHttpError(400, "Baris data kosong.", "INVALID_ROWS");
  }

  rows.forEach((row, index) => {
    if (!Array.isArray(row)) {
      throw makeHttpError(400, `Baris ${index + 1} bukan array data yang sah.`, "INVALID_ROW");
    }
    if (!row.length) {
      throw makeHttpError(400, `Baris ${index + 1} kosong.`, "INVALID_ROW");
    }
    if (row.length > maxCells) {
      throw makeHttpError(400, `Baris ${index + 1} mempunyai terlalu banyak lajur.`, "INVALID_ROW_WIDTH");
    }
    row.forEach((cell, cellIndex) => validateSheetCell(cell, index, cellIndex));
  });
}

function validateSheetCell(cell, rowIndex, cellIndex) {
  if (cell == null) return;
  const type = typeof cell;
  if (type !== "string" && type !== "number" && type !== "boolean") {
    throw makeHttpError(400, `Nilai baris ${rowIndex + 1}, lajur ${cellIndex + 1} tidak sah.`, "INVALID_CELL");
  }
  if (String(cell).length > 10000) {
    throw makeHttpError(400, `Nilai baris ${rowIndex + 1}, lajur ${cellIndex + 1} terlalu panjang.`, "CELL_TOO_LONG");
  }
}

async function authorizeRequest(body, actor, env, workerToken) {
  if (body.action === "readSheet") {
    const sheetKey = String(body.sheetKey || "").trim();
    if (sheetKey === "CONFIG" || !TEACHER_READABLE_SHEETS.includes(sheetKey)) {
      return authorizeAdminRequest(body, actor, env, workerToken);
    }
    return authorizeTeacherRead(body, actor, env, workerToken);
  }
  if (body.action === "getKokumAttendanceSummary") {
    return authorizeTeacherRead(body, actor, env, workerToken);
  }
  if (body.action === "getDiagnostics") {
    return authorizeAdminRequest(body, actor, env, workerToken);
  }
  if (body.action === "getMurid") {
    return authorizeClassScopedRead(body, actor, env, workerToken);
  }
  if (body.action === "storeLetterFile") {
    return authorizeTeacherRead(body, actor, env, workerToken);
  }
  if (body.action === "getSummary" || body.action === "clearSheet" || body.action === "clearAllData") {
    return authorizeAdminRequest(body, actor, env, workerToken);
  }
  if (body.action === "appendRow" && body.sheetKey === "KEHADIRAN_MURID") {
    return authorizeStudentAttendanceWrite(body, actor, env, workerToken);
  }
  if (body.action === "appendRows" && body.sheetKey === "KEHADIRAN_MURID") {
    return authorizeStudentAttendanceBatchWrite(body, actor, env, workerToken);
  }
  if (body.action === "appendRow" && body.sheetKey === "KEHADIRAN_GURU") {
    return authorizeTeacherAttendanceWrite(body, actor, env, workerToken);
  }
  if (body.action === "appendRows" && body.sheetKey === "KEHADIRAN_GURU") {
    return authorizeTeacherAttendanceBatchWrite(body, actor, env, workerToken);
  }
  if (body.action === "appendRow" && body.sheetKey === "LAPORAN_KOKUM") {
    return authorizeTeacherKokumWrite(body, actor, env, workerToken);
  }
  if (body.action === "appendRows" && body.sheetKey === "LAPORAN_KOKUM") {
    return authorizeTeacherKokumBatchWrite(body, actor, env, workerToken);
  }
  if (body.action === "appendRow" && body.sheetKey === "LAPORAN_BERTUGAS") {
    await authorizeAdminRequest(body, actor, env, workerToken);
    return ensureDutyReportNotDuplicate(env, workerToken, body.row || []);
  }
  if (body.action === "appendRow" && body.sheetKey === "GURU") {
    await authorizeAdminRequest(body, actor, env, workerToken);
    return ensureGuruDataNotDuplicate(env, workerToken, body.row || []);
  }
  if (body.action === "appendRow" && body.sheetKey === "MURID") {
    await authorizeAdminRequest(body, actor, env, workerToken);
    return ensureMuridDataNotDuplicate(env, workerToken, body.row || []);
  }
  if (body.action === "appendRows" && body.sheetKey === "GURU") {
    await authorizeAdminRequest(body, actor, env, workerToken);
    ensureUniqueRows(body.rows || [], parseGuruDuplicateMeta, sameGuruDuplicate, "Data guru duplicate dikesan dalam simpanan semasa.", "DUPLICATE_GURU");
    for (const row of body.rows || []) {
      await ensureGuruDataNotDuplicate(env, workerToken, row);
    }
    return;
  }
  if (body.action === "appendRows" && body.sheetKey === "MURID") {
    await authorizeAdminRequest(body, actor, env, workerToken);
    ensureUniqueRows(body.rows || [], parseMuridDuplicateMeta, sameMuridDuplicate, "Data murid duplicate dikesan dalam simpanan semasa.", "DUPLICATE_MURID");
    for (const row of body.rows || []) {
      await ensureMuridDataNotDuplicate(env, workerToken, row);
    }
    return;
  }
  if (body.action === "replaceSheet") {
    await authorizeAdminRequest(body, actor, env, workerToken);
    validateReplaceSheetNoDuplicates(body);
    return;
  }
  return authorizeAdminRequest(body, actor, env, workerToken);
}

function makeHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeClassList(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "-" || raw === "—") return [];
  const upper = raw.toUpperCase();
  const matched = STUDENT_CLASSES.filter((kelas) => upper.includes(kelas));
  if (matched.length) return matched;
  return raw
    .split(/[;,/|]/)
    .map((item) => String(item || "").trim())
    .filter((item) => item && item !== "-" && item !== "—");
}

function getMalaysiaNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
}

function formatYMD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentMondayYMD() {
  const now = getMalaysiaNow();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return formatYMD(now);
}

function isIsoDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function isPunchOutStatusText(status) {
  const normalized = normalizeText(status);
  return normalized === "punch out" || normalized === "punch-out";
}

function sameIdentityByEmailOrName(a, b) {
  if (!a || !b) return false;
  if (a.email && b.email) return a.email === b.email;
  return Boolean(a.nama && b.nama && a.nama === b.nama);
}

function parseTeacherAttendanceDuplicateMeta(row) {
  if (!Array.isArray(row)) return null;
  const directFormat = isIsoDateString(row[1]) && String(row[2] || "").includes("@");
  const tarikh = directString(directFormat ? row[1] : row[1]);
  const email = normalizeText(directFormat ? row[2] : row[5]);
  const nama = normalizeText(directFormat ? row[3] : row[0]);
  const status = directString(directFormat ? row[5] : row[2]);
  if (!tarikh || (!email && !nama)) return null;
  return {
    tarikh,
    email,
    nama,
    type: isPunchOutStatusText(status) ? "punchout" : "checkin"
  };
}

function parseStudentAttendanceDuplicateMeta(row) {
  if (!Array.isArray(row)) return null;
  const directFormat = isIsoDateString(row[1]);
  const tarikh = directString(directFormat ? row[1] : row[2]);
  const kelas = normalizeText(directFormat ? row[2] : row[1]);
  const nama = normalizeText(directFormat ? row[3] : row[0]);
  if (!tarikh || !kelas || !nama) return null;
  return { tarikh, kelas, nama };
}

function parseKokumDuplicateMeta(row) {
  if (!Array.isArray(row)) return null;
  const tarikh = directString(row[0]);
  const kategori = normalizeText(row[4]);
  const unit = normalizeText(row[5]);
  if (!tarikh || !kategori || !unit) return null;
  return { tarikh, kategori, unit };
}

function parseDutyReportDuplicateMeta(row) {
  if (!Array.isArray(row)) return null;
  const monday = [row[2], row[0], row[1], row[3], row[4]]
    .map((value) => directString(value))
    .find((value) => isIsoDateString(value));
  if (!monday) return null;
  return { isnin: monday };
}

function parseGuruDuplicateMeta(row) {
  if (!Array.isArray(row)) return null;
  const nama = normalizeText(row[0]);
  const emel = normalizeText(row[1]);
  if (!nama && !emel) return null;
  return { nama, emel };
}

function parseMuridDuplicateMeta(row) {
  if (!Array.isArray(row)) return null;
  const nama = normalizeText(row[0]);
  const kelas = normalizeText(row[1]);
  const noIc = normalizeText(row[6]);
  if (!nama && !noIc) return null;
  return { nama, kelas, noIc };
}

function sameTeacherAttendanceDuplicate(a, b) {
  return Boolean(a && b && a.tarikh === b.tarikh && a.type === b.type && sameIdentityByEmailOrName(a, b));
}

function sameStudentAttendanceDuplicate(a, b) {
  return Boolean(a && b && a.tarikh === b.tarikh && a.kelas === b.kelas && a.nama === b.nama);
}

function sameKokumDuplicate(a, b) {
  return Boolean(a && b && a.tarikh === b.tarikh && a.kategori === b.kategori && a.unit === b.unit);
}

function sameDutyReportDuplicate(a, b) {
  return Boolean(a && b && a.isnin === b.isnin);
}

function sameGuruDuplicate(a, b) {
  if (!a || !b) return false;
  if (a.emel && b.emel && a.emel === b.emel) return true;
  return Boolean(a.nama && b.nama && a.nama === b.nama);
}

function sameMuridDuplicate(a, b) {
  if (!a || !b) return false;
  if (a.noIc && b.noIc && a.noIc === b.noIc) return true;
  return Boolean(a.nama && b.nama && a.kelas && b.kelas && a.nama === b.nama && a.kelas === b.kelas);
}

function getValidationRows(rows, sheetKey) {
  const safeRows = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row) && row.length) : [];
  const header = DIRECT_HEADERS[String(sheetKey || "").trim()];
  if (!safeRows.length) return [];
  if (!header || !Array.isArray(safeRows[0])) return safeRows;
  const firstRow = safeRows[0];
  const matchesHeader = header.every((cell, index) => normalizeText(firstRow[index]) === normalizeText(cell));
  return matchesHeader ? safeRows.slice(1) : safeRows;
}

function ensureUniqueRows(rows, parseFn, sameFn, errorMessage, errorCode) {
  const seen = [];
  for (const row of rows) {
    const meta = parseFn(row);
    if (!meta) continue;
    if (seen.some((existing) => sameFn(existing, meta))) {
      throw makeHttpError(409, errorMessage, errorCode);
    }
    seen.push(meta);
  }
}

function validateReplaceSheetNoDuplicates(body) {
  const sheetKey = normalizeSheetKey(body && body.sheetKey);
  const rows = getValidationRows(body && body.rows, sheetKey);
  if (!rows.length) return;
  if (sheetKey === DIRECT_SHEETS.GURU) {
    ensureUniqueRows(rows, parseGuruDuplicateMeta, sameGuruDuplicate, "Sheet GURU mengandungi rekod duplicate.", "DUPLICATE_GURU");
    return;
  }
  if (sheetKey === DIRECT_SHEETS.MURID) {
    ensureUniqueRows(rows, parseMuridDuplicateMeta, sameMuridDuplicate, "Sheet MURID mengandungi rekod duplicate.", "DUPLICATE_MURID");
    return;
  }
  if (sheetKey === DIRECT_SHEETS.KEHADIRAN_GURU) {
    ensureUniqueRows(rows, parseTeacherAttendanceDuplicateMeta, sameTeacherAttendanceDuplicate, "Sheet kehadiran guru mengandungi rekod duplicate.", "DUPLICATE_KEHADIRAN_GURU");
    return;
  }
  if (sheetKey === DIRECT_SHEETS.KEHADIRAN_MURID) {
    ensureUniqueRows(rows, parseStudentAttendanceDuplicateMeta, sameStudentAttendanceDuplicate, "Sheet kehadiran murid mengandungi rekod duplicate.", "DUPLICATE_KEHADIRAN_MURID");
    return;
  }
  if (sheetKey === DIRECT_SHEETS.LAPORAN_KOKUM) {
    ensureUniqueRows(rows, parseKokumDuplicateMeta, sameKokumDuplicate, "Sheet laporan kokum mengandungi rekod duplicate.", "DUPLICATE_LAPORAN_KOKUM");
    return;
  }
  if (sheetKey === DIRECT_SHEETS.LAPORAN_BERTUGAS) {
    ensureUniqueRows(rows, parseDutyReportDuplicateMeta, sameDutyReportDuplicate, "Sheet laporan bertugas mengandungi rekod duplicate.", "DUPLICATE_LAPORAN_BERTUGAS");
  }
}

async function ensureTeacherAttendanceNotDuplicate(env, workerToken, row) {
  const target = parseTeacherAttendanceDuplicateMeta(row);
  if (!target) return;
  const rows = await readBackendSheetRows(env, DIRECT_SHEETS.KEHADIRAN_GURU, workerToken);
  const existing = getValidationRows(rows, DIRECT_SHEETS.KEHADIRAN_GURU).map(parseTeacherAttendanceDuplicateMeta).filter(Boolean);
  if (existing.some((item) => sameTeacherAttendanceDuplicate(item, target))) {
    throw makeHttpError(409, target.type === "punchout" ? "Punch-out guru sudah wujud untuk tarikh ini." : "Kehadiran guru sudah wujud untuk tarikh ini.", "DUPLICATE_KEHADIRAN_GURU");
  }
}

async function ensureStudentAttendanceNotDuplicate(env, workerToken, row) {
  const target = parseStudentAttendanceDuplicateMeta(row);
  if (!target) return;
  const rows = await readBackendSheetRows(env, DIRECT_SHEETS.KEHADIRAN_MURID, workerToken);
  const existing = getValidationRows(rows, DIRECT_SHEETS.KEHADIRAN_MURID).map(parseStudentAttendanceDuplicateMeta).filter(Boolean);
  if (existing.some((item) => sameStudentAttendanceDuplicate(item, target))) {
    throw makeHttpError(409, "Kehadiran murid sudah wujud untuk nama, kelas, dan tarikh ini.", "DUPLICATE_KEHADIRAN_MURID");
  }
}

async function ensureKokumReportNotDuplicate(env, workerToken, row) {
  const target = parseKokumDuplicateMeta(row);
  if (!target) return;
  const rows = await readBackendSheetRows(env, DIRECT_SHEETS.LAPORAN_KOKUM, workerToken);
  const existing = getValidationRows(rows, DIRECT_SHEETS.LAPORAN_KOKUM).map(parseKokumDuplicateMeta).filter(Boolean);
  if (existing.some((item) => sameKokumDuplicate(item, target))) {
    throw makeHttpError(409, "Laporan kokum untuk kategori dan program ini sudah wujud pada tarikh tersebut.", "DUPLICATE_LAPORAN_KOKUM");
  }
}

async function ensureDutyReportNotDuplicate(env, workerToken, row) {
  const target = parseDutyReportDuplicateMeta(row);
  if (!target) return;
  const rows = await readBackendSheetRows(env, DIRECT_SHEETS.LAPORAN_BERTUGAS, workerToken);
  const existing = getValidationRows(rows, DIRECT_SHEETS.LAPORAN_BERTUGAS).map(parseDutyReportDuplicateMeta).filter(Boolean);
  if (existing.some((item) => sameDutyReportDuplicate(item, target))) {
    throw makeHttpError(409, "Laporan guru bertugas untuk minggu ini sudah wujud.", "DUPLICATE_LAPORAN_BERTUGAS");
  }
}

async function ensureGuruDataNotDuplicate(env, workerToken, row) {
  const target = parseGuruDuplicateMeta(row);
  if (!target) return;
  const rows = await readBackendSheetRows(env, DIRECT_SHEETS.GURU, workerToken);
  const existing = getValidationRows(rows, DIRECT_SHEETS.GURU).map(parseGuruDuplicateMeta).filter(Boolean);
  if (existing.some((item) => sameGuruDuplicate(item, target))) {
    throw makeHttpError(409, "Rekod guru duplicate dikesan.", "DUPLICATE_GURU");
  }
}

async function ensureMuridDataNotDuplicate(env, workerToken, row) {
  const target = parseMuridDuplicateMeta(row);
  if (!target) return;
  const rows = await readBackendSheetRows(env, DIRECT_SHEETS.MURID, workerToken);
  const existing = getValidationRows(rows, DIRECT_SHEETS.MURID).map(parseMuridDuplicateMeta).filter(Boolean);
  if (existing.some((item) => sameMuridDuplicate(item, target))) {
    throw makeHttpError(409, "Rekod murid duplicate dikesan.", "DUPLICATE_MURID");
  }
}

function getCurrentDutyEntry() {
  const monday = getCurrentMondayYMD();
  return DUTY_SCHEDULE_2026.find((entry) => entry.isnin === monday) || null;
}

function getAllowedGoogleClientIds(env) {
  const configured = String(env.GOOGLE_CLIENT_IDS || env.GOOGLE_CLIENT_ID || env.GOOGLE_OAUTH_CLIENT_IDS || env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  if (!configured) return [DEFAULT_GOOGLE_CLIENT_ID];
  return configured.split(",").map((item) => item.trim()).filter(Boolean);
}

function getAllowedGoogleIssuers() {
  return ["accounts.google.com", "https://accounts.google.com"];
}

function getAllowedGoogleEmailDomains(env) {
  const configured = String(env.GOOGLE_ALLOWED_EMAIL_DOMAINS || "").trim();
  if (!configured) return ["moe-dl.edu.my"];
  return configured.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function isAllowedGoogleEmailDomain(email, env) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || normalized.indexOf("@") === -1) return false;
  const domain = normalized.split("@")[1];
  return getAllowedGoogleEmailDomains(env).includes(domain);
}

async function getGoogleVerificationKeys() {
  if (GOOGLE_KEYS_CACHE.expiresAt > Date.now() && GOOGLE_KEYS_CACHE.keys.size) {
    return GOOGLE_KEYS_CACHE.keys;
  }

  const response = await fetch(GOOGLE_JWKS_URL, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw makeHttpError(502, "Gagal memuat kunci Google untuk verifikasi.", "AUTH_UPSTREAM_ERROR");
  }

  const data = await response.json();
  const keys = new Map();
  for (const key of Array.isArray(data && data.keys) ? data.keys : []) {
    if (!key || !key.kid) continue;
    keys.set(String(key.kid).trim(), key);
  }
  if (!keys.size) {
    throw makeHttpError(502, "Tiada kunci Google diterima untuk verifikasi.", "AUTH_UPSTREAM_ERROR");
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
    throw makeHttpError(400, "Format token Google tidak sah.", "AUTH_REQUIRED");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecodeToText(headerPart));
    payload = JSON.parse(base64UrlDecodeToText(payloadPart));
  } catch {
    throw makeHttpError(400, "Token Google tidak dapat dibaca.", "AUTH_REQUIRED");
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

async function verifyGoogleIdentity(auth, env) {
  const idToken = String((auth && auth.idToken) || "").trim();
  if (!idToken) {
    throw makeHttpError(401, "Sesi keselamatan tamat. Sila log masuk semula.", "AUTH_REQUIRED");
  }

  const cached = GOOGLE_TOKEN_CACHE.get(idToken);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.actor;
  }

  const jwt = parseJwt(idToken);
  if (jwt.header.alg !== "RS256") {
    throw makeHttpError(401, "Algoritma token Google tidak disokong.", "AUTH_REQUIRED");
  }

  const keys = await getGoogleVerificationKeys();
  const jwk = keys.get(String(jwt.header.kid || "").trim());
  if (!jwk) {
    throw makeHttpError(401, "Kunci verifikasi Google tidak ditemui.", "AUTH_REQUIRED");
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
    throw makeHttpError(401, "Tandatangan token Google tidak sah.", "AUTH_REQUIRED");
  }

  const data = jwt.payload || {};
  if (!getAllowedGoogleClientIds(env).includes(String(data.aud || "").trim())) {
    throw makeHttpError(403, "Client Google tidak dibenarkan.", "AUTH_FORBIDDEN");
  }
  if (!getAllowedGoogleIssuers().includes(String(data.iss || "").trim())) {
    throw makeHttpError(403, "Penerbit token Google tidak sah.", "AUTH_FORBIDDEN");
  }
  const now = Math.floor(Date.now() / 1000);
  const nbf = Number(data.nbf || 0);
  if (nbf && nbf > now + 60) {
    throw makeHttpError(401, "Token Google belum aktif.", "AUTH_REQUIRED");
  }
  if (!(data.email_verified === true || data.email_verified === "true")) {
    throw makeHttpError(403, "Email Google belum disahkan.", "AUTH_FORBIDDEN");
  }

  const expiresAt = Number(data.exp || 0) * 1000;
  if (!expiresAt || expiresAt <= Date.now()) {
    throw makeHttpError(401, "Sesi log masuk tamat. Sila log masuk semula.", "AUTH_REQUIRED");
  }

  const actor = {
    email: String(data.email || (auth && auth.email) || "").trim().toLowerCase(),
    name: String(data.name || (auth && auth.name) || "").trim(),
    sub: String(data.sub || (auth && auth.sub) || "").trim()
  };
  if (!actor.email) {
    throw makeHttpError(403, "Email pengguna tidak dapat disahkan.", "AUTH_FORBIDDEN");
  }
  if (!isAllowedGoogleEmailDomain(actor.email, env)) {
    throw makeHttpError(403, "Akaun Google di luar domain sekolah tidak dibenarkan.", "AUTH_FORBIDDEN");
  }

  GOOGLE_TOKEN_CACHE.set(idToken, { actor, expiresAt });
  return actor;
}

async function buildVerifiedSessionActor(actor, env, workerToken) {
  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  const adminEmails = await getConfiguredAdminEmails(env, workerToken);
  const isAdmin = isSystemAdminActor(actor, guru, adminEmails);
  if (!guru && !isAdmin) {
    throw makeHttpError(403, "Akaun ini tiada dalam senarai guru atau pentadbir sistem.", "AUTH_FORBIDDEN");
  }
  return {
    email: String(actor.email || "").trim().toLowerCase(),
    name: String((guru && guru.nama) || actor.name || actor.email || "").trim(),
    sub: String(actor.sub || "").trim(),
    picture: "",
    role: isAdmin ? "admin" : "teacher",
    jawatan: String((guru && guru.jawatan) || "").trim(),
    kelas: String((guru && guru.kelas) || "").trim()
  };
}

async function authorizeStudentAttendanceWrite(body, actor, env, workerToken) {
  if (!Array.isArray(body.row)) {
    throw makeHttpError(400, "Data kehadiran murid tidak sah.", "INVALID_ROW");
  }

  const kelas = String(body.row[1] || "").trim();
  if (!kelas) {
    throw makeHttpError(400, "Kelas murid diperlukan.", "MISSING_CLASS");
  }

  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  const adminEmails = await getConfiguredAdminEmails(env, workerToken);
  if (!guru && !isSystemAdminActor(actor, null, adminEmails)) {
    throw makeHttpError(403, "Akaun ini tiada dalam senarai guru.", "TEACHER_NOT_FOUND");
  }

  if (!isSystemAdminActor(actor, guru, adminEmails) && !isTeacherAllowedAllClasses(guru) && !isCurrentDutyTeacher(guru)) {
    const allowedClasses = normalizeClassList(guru.kelas);
    if (!allowedClasses.length) {
      throw makeHttpError(403, "Tiada kelas ditetapkan untuk akaun ini.", "NO_ASSIGNED_CLASS");
    }
    if (!allowedClasses.includes(kelas)) {
      throw makeHttpError(403, "Anda hanya dibenarkan mengisi kehadiran kelas sendiri.", "CLASS_FORBIDDEN");
    }
  }

  body.row[6] = actor.email;
  if (!body.skipDuplicateCheck) {
    await ensureStudentAttendanceNotDuplicate(env, workerToken, body.row);
  }
}

async function authorizeStudentAttendanceBatchWrite(body, actor, env, workerToken) {
  if (!Array.isArray(body.rows) || !body.rows.length) {
    throw makeHttpError(400, "Data kehadiran murid tidak sah.", "INVALID_ROWS");
  }
  ensureUniqueRows(body.rows, parseStudentAttendanceDuplicateMeta, sameStudentAttendanceDuplicate, "Data kehadiran murid duplicate dikesan dalam simpanan semasa.", "DUPLICATE_KEHADIRAN_MURID");
  for (const row of body.rows) {
    await authorizeStudentAttendanceWrite({ row, skipDuplicateCheck: true }, actor, env, workerToken);
  }
  const existingRows = await readBackendSheetRows(env, DIRECT_SHEETS.KEHADIRAN_MURID, workerToken);
  const existingMeta = getValidationRows(existingRows, DIRECT_SHEETS.KEHADIRAN_MURID).map(parseStudentAttendanceDuplicateMeta).filter(Boolean);
  for (const row of body.rows) {
    const target = parseStudentAttendanceDuplicateMeta(row);
    if (target && existingMeta.some((item) => sameStudentAttendanceDuplicate(item, target))) {
      throw makeHttpError(409, "Kehadiran murid sudah wujud untuk nama, kelas, dan tarikh ini.", "DUPLICATE_KEHADIRAN_MURID");
    }
  }
}

async function authorizeTeacherAttendanceWrite(body, actor, env, workerToken) {
  if (!Array.isArray(body.row)) {
    throw makeHttpError(400, "Data kehadiran guru tidak sah.", "INVALID_ROW");
  }
  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  if (!guru) {
    throw makeHttpError(403, "Akaun ini tiada dalam senarai guru.", "TEACHER_NOT_FOUND");
  }
  body.row[0] = String(guru.nama || actor.name || actor.email || "").trim();
  body.row[5] = actor.email;
  if (!body.skipDuplicateCheck) {
    await ensureTeacherAttendanceNotDuplicate(env, workerToken, body.row);
  }
}

async function authorizeTeacherAttendanceBatchWrite(body, actor, env, workerToken) {
  if (!Array.isArray(body.rows) || !body.rows.length) {
    throw makeHttpError(400, "Data kehadiran guru tidak sah.", "INVALID_ROWS");
  }
  ensureUniqueRows(body.rows, parseTeacherAttendanceDuplicateMeta, sameTeacherAttendanceDuplicate, "Data kehadiran guru duplicate dikesan dalam simpanan semasa.", "DUPLICATE_KEHADIRAN_GURU");
  for (const row of body.rows) {
    await authorizeTeacherAttendanceWrite({ row, skipDuplicateCheck: true }, actor, env, workerToken);
  }
  const existingRows = await readBackendSheetRows(env, DIRECT_SHEETS.KEHADIRAN_GURU, workerToken);
  const existingMeta = getValidationRows(existingRows, DIRECT_SHEETS.KEHADIRAN_GURU).map(parseTeacherAttendanceDuplicateMeta).filter(Boolean);
  for (const row of body.rows) {
    const target = parseTeacherAttendanceDuplicateMeta(row);
    if (target && existingMeta.some((item) => sameTeacherAttendanceDuplicate(item, target))) {
      throw makeHttpError(409, target.type === "punchout" ? "Punch-out guru sudah wujud untuk tarikh ini." : "Kehadiran guru sudah wujud untuk tarikh ini.", "DUPLICATE_KEHADIRAN_GURU");
    }
  }
}

async function authorizeTeacherKokumWrite(body, actor, env, workerToken) {
  if (!Array.isArray(body.row)) {
    throw makeHttpError(400, "Data laporan kokum tidak sah.", "INVALID_ROW");
  }
  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  if (!guru) {
    throw makeHttpError(403, "Akaun ini tiada dalam senarai guru.", "TEACHER_NOT_FOUND");
  }
  body.row[2] = String(guru.nama || actor.name || actor.email || "").trim();
  body.row[3] = String(guru.emel || actor.email || "").trim();
  body.row[21] = String(actor.email || "").trim();
  if (!body.skipDuplicateCheck) {
    await ensureKokumReportNotDuplicate(env, workerToken, body.row);
  }
}

async function authorizeTeacherKokumBatchWrite(body, actor, env, workerToken) {
  if (!Array.isArray(body.rows) || !body.rows.length) {
    throw makeHttpError(400, "Data laporan kokum tidak sah.", "INVALID_ROWS");
  }
  ensureUniqueRows(body.rows, parseKokumDuplicateMeta, sameKokumDuplicate, "Data laporan kokum duplicate dikesan dalam simpanan semasa.", "DUPLICATE_LAPORAN_KOKUM");
  for (const row of body.rows) {
    await authorizeTeacherKokumWrite({ row, skipDuplicateCheck: true }, actor, env, workerToken);
  }
  const existingRows = await readBackendSheetRows(env, DIRECT_SHEETS.LAPORAN_KOKUM, workerToken);
  const existingMeta = getValidationRows(existingRows, DIRECT_SHEETS.LAPORAN_KOKUM).map(parseKokumDuplicateMeta).filter(Boolean);
  for (const row of body.rows) {
    const target = parseKokumDuplicateMeta(row);
    if (target && existingMeta.some((item) => sameKokumDuplicate(item, target))) {
      throw makeHttpError(409, "Laporan kokum untuk kategori dan program ini sudah wujud pada tarikh tersebut.", "DUPLICATE_LAPORAN_KOKUM");
    }
  }
}

async function authorizeTeacherRead(body, actor, env, workerToken) {
  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  const adminEmails = await getConfiguredAdminEmails(env, workerToken);
  if (!guru && !isSystemAdminActor(actor, null, adminEmails)) {
    throw makeHttpError(403, "Akaun ini tiada dalam senarai guru.", "TEACHER_NOT_FOUND");
  }
}

async function authorizeClassScopedRead(body, actor, env, workerToken) {
  const kelas = String(body.kelas || "").trim();
  if (!kelas) {
    throw makeHttpError(400, "Kelas diperlukan untuk tindakan ini.", "MISSING_CLASS");
  }

  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  const adminEmails = await getConfiguredAdminEmails(env, workerToken);
  if (!guru && !isSystemAdminActor(actor, null, adminEmails)) {
    throw makeHttpError(403, "Akaun ini tiada dalam senarai guru.", "TEACHER_NOT_FOUND");
  }

  if (!isSystemAdminActor(actor, guru, adminEmails) && !isTeacherAllowedAllClasses(guru) && !isCurrentDutyTeacher(guru)) {
    const allowedClasses = normalizeClassList(guru.kelas);
    if (!allowedClasses.length) {
      throw makeHttpError(403, "Tiada kelas ditetapkan untuk akaun ini.", "NO_ASSIGNED_CLASS");
    }
    if (!allowedClasses.includes(kelas)) {
      throw makeHttpError(403, "Anda hanya dibenarkan membaca data kelas sendiri.", "CLASS_FORBIDDEN");
    }
  }
}

async function authorizeAdminRequest(body, actor, env, workerToken) {
  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  const adminEmails = await getConfiguredAdminEmails(env, workerToken);
  const isAdmin = isSystemAdminActor(actor, guru, adminEmails);
  if (!isAdmin) {
    throw makeHttpError(403, "Akses pentadbir diperlukan untuk tindakan ini.", "ADMIN_REQUIRED");
  }
}

async function maybeFilterReadSheetResponse(body, data, env, workerToken) {
  if (!body || body.action !== "readSheet" || !data || !data.success || !Array.isArray(data.rows) || !body.requestUser) {
    return data;
  }
  data.rows = await filterReadSheetRowsForActor(env, body.sheetKey, data.rows, body.requestUser, workerToken);
  return data;
}

async function filterReadSheetRowsForActor(env, sheetKey, rows, actor, workerToken) {
  const sheetName = normalizeSheetKey(sheetKey);
  if (!sheetName || !Array.isArray(rows) || !rows.length) return rows;
  if (sheetName === DIRECT_SHEETS.CONFIG) return rows;

  const guruRows = await getGuruSheetRows(env, workerToken);
  const guru = findGuruByIdentity(guruRows, actor, true);
  const adminEmails = await getConfiguredAdminEmails(env, workerToken);
  if (isSystemAdminActor(actor, guru, adminEmails)) return rows;
  if (!guru) return rows;
  if (isTeacherAllowedAllClasses(guru) || isCurrentDutyTeacher(guru)) {
    return rows;
  }

  if (sheetName === DIRECT_SHEETS.GURU) {
    const targetEmail = normalizeText(actor && actor.email);
    const targetName = normalizeText(actor && actor.name);
    const filteredGuruRows = rows.filter((row, idx) => {
      if (idx === 0) return true;
      const rowEmail = normalizeText(row && row[1]);
      const rowName = normalizeText(row && row[0]);
      return (targetEmail && rowEmail === targetEmail) || (targetName && rowName === targetName);
    });
    return filteredGuruRows.length ? filteredGuruRows : rows.slice(0, 1);
  }

  if (sheetName === DIRECT_SHEETS.MURID) {
    const allowedClasses = normalizeClassList(guru.kelas);
    if (!allowedClasses.length) return rows.slice(0, 1);
    const allowed = new Set(allowedClasses.map(normalizeText));
    const filteredMuridRows = rows.filter((row, idx) => {
      if (idx === 0) return true;
      return allowed.has(normalizeText(row && row[1]));
    });
    return filteredMuridRows.length ? filteredMuridRows : rows.slice(0, 1);
  }

  return rows;
}
async function getConfiguredAdminEmails(env, workerToken) {
  const emails = new Set(DEFAULT_ADMIN_EMAILS.map(normalizeAdminEmail).filter(Boolean));
  try {
    const config = shouldUseCloudflareD1(env)
      ? await d1GetConfig(env, workerToken)
      : await googleGetConfig(env);
    collectAdminEmailsFromConfig(config, emails);
  } catch {
    // Keep login usable with the embedded admin bootstrap list if CONFIG is unavailable.
  }
  return Array.from(emails);
}

function collectAdminEmailsFromConfig(config, emails) {
  const primaryEmail = normalizeAdminEmail(config && config.ADMIN_EMAIL);
  if (primaryEmail) emails.add(primaryEmail);

  const rawJson = String((config && config.ADMIN_EMAILS_JSON) || "").trim();
  if (!rawJson) return;
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      parsed.map(normalizeAdminEmail).filter(Boolean).forEach((email) => emails.add(email));
    }
  } catch {
    rawJson.split(",").map(normalizeAdminEmail).filter(Boolean).forEach((email) => emails.add(email));
  }
}

function normalizeAdminEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isSystemAdminActor(actor, guru, adminEmails = DEFAULT_ADMIN_EMAILS) {
  const email = normalizeAdminEmail(actor && actor.email);
  return adminEmails.map(normalizeAdminEmail).includes(email) || Boolean(guru && isTeacherAllowedAllClasses(guru));
}

function isTeacherAllowedAllClasses(guru) {
  return ADMIN_ROLES.includes(normalizeText(guru.jawatan));
}

function isCurrentDutyTeacher(guru) {
  const entry = getCurrentDutyEntry();
  if (!entry) return false;
  const guruName = normalizeText(guru.nama);
  const guruPhone = normalizePhone(guru.telefon);
  if ([entry.guru, entry.pembantu].some((nama) => normalizeText(nama) === guruName)) return true;
  if (!guruPhone) return false;
  return [entry.telefon, entry.telefonPembantu].some((telefon) => normalizePhone(telefon) === guruPhone);
}

async function getGuruSheetRows(env, workerToken) {
  const currentBackendMode = getBackendMode(env);
  if (
    GURU_SHEET_CACHE.rows &&
    GURU_SHEET_CACHE.expiresAt > Date.now() &&
    GURU_SHEET_CACHE.backendMode === currentBackendMode
  ) {
    return GURU_SHEET_CACHE.rows;
  }

  if (shouldUseCloudflareD1(env)) {
    const rows = await d1ReadSheetRows(env, DIRECT_SHEETS.GURU);
    GURU_SHEET_CACHE = {
      rows: Array.isArray(rows) ? rows : [],
      expiresAt: Date.now() + 60000,
      backendMode: currentBackendMode
    };
    return GURU_SHEET_CACHE.rows;
  }

  if (shouldUseGoogleSheets(env)) {
    try {
      const rows = await googleReadSheetRows(env, DIRECT_SHEETS.GURU);
      GURU_SHEET_CACHE = {
        rows: Array.isArray(rows) ? rows : [],
        expiresAt: Date.now() + 60000,
        backendMode: currentBackendMode
      };
      return GURU_SHEET_CACHE.rows;
    } catch (err) {
      throw err;
    }
  }
  throw new Error("Backend data guru tidak dikonfigurasi.");
}

function buildGuruRecord(row) {
  return {
    nama: String(row[0] || "").trim(),
    emel: String(row[1] || "").trim(),
    jawatan: String(row[2] || "").trim(),
    kelas: String(row[3] || "").trim(),
    telefon: String(row[4] || "").trim(),
    status: String(row[5] || "").trim(),
    kokumUnitBeruniform: String(row[9] || "").trim(),
    kokumKelabDanPersatuan: String(row[10] || "").trim(),
    kokumSukanDanPermainan: String(row[11] || "").trim()
  };
}

function findGuruByIdentity(rows, actor, allowNameFallback) {
  const targetEmail = normalizeText(actor && actor.email);
  const targetName = normalizeText(actor && actor.name);
  if (!targetEmail && !targetName) return null;
  const nameMatches = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const record = buildGuruRecord(row);
    if (targetEmail && normalizeText(record.emel) === targetEmail) return record;
    if (allowNameFallback && targetName && normalizeText(record.nama) === targetName) nameMatches.push(record);
  }
  return allowNameFallback && nameMatches.length === 1 ? nameMatches[0] : null;
}

async function handleLetterFile(request, env, corsHeaders, path) {
  if (!env.DB) return new Response("D1 tidak dikonfigurasi", { status: 500 });
  const parts = path.split("/").filter(Boolean); // ["letter", "{id}", "{filename}"]
  const id = parts[1] || "";
  if (!id || id.length < 10) return new Response("ID tidak sah", { status: 400 });
  try {
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB.prepare("SELECT data, mime_type, filename FROM letter_cache WHERE id = ? AND expires_at > ?")
      .bind(id, now).first();
    if (!row) return new Response("Fail tidak dijumpai atau sudah tamat tempoh", { status: 404 });
    const binary = Uint8Array.from(atob(row.data), c => c.charCodeAt(0));
    return new Response(binary, {
      status: 200,
      headers: {
        "Content-Type": row.mime_type,
        "Content-Disposition": 'inline; filename="' + row.filename + '"',
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders
      }
    });
  } catch (err) {
    return new Response("Ralat: " + err.message, { status: 500 });
  }
}
