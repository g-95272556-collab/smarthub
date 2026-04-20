// ============================================================
// SMART SCHOOL HUB v2.0 — Cloudflare Worker
// SK Kiandongo — Token Protection Layer
// ============================================================

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // Benarkan semua origin (atau hadkan kepada GitHub Pages sahaja)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    // Handle OPTIONS preflight — mesti return 204
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/api" || path.startsWith("/api/")) {
        return await handleAPI(request, env, corsHeaders);
      }
      if (path === "/ai" || path.startsWith("/ai/")) {
        return await handleAI(request, env, corsHeaders);
      }
      if (path === "/token") {
        return await generateTokenEndpoint(request, env, corsHeaders);
      }

      return jsonResp({ success: false, error: "Laluan tidak dijumpai" }, 404, corsHeaders);
    } catch (err) {
      return jsonResp({ success: false, error: err.message }, 500, corsHeaders);
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

  if (body.action === "ping") {
    return jsonResp({
      success: true,
      worker: "ok",
      appsScriptUrl: env.APPS_SCRIPT_URL || "",
      appsScriptConfigured: Boolean(env.APPS_SCRIPT_URL),
      hasWorkerSecret: Boolean(env.WORKER_SECRET),
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  }

  body.token = await generateDailyToken(env.WORKER_SECRET);

  const response = await fetch(env.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "follow",
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleAI(request, env, corsHeaders) {
  if (request.method !== "POST") {
    return jsonResp({ success: false, error: "POST sahaja" }, 405, corsHeaders);
  }

  const { prompt, type } = await request.json();
  if (!prompt) {
    return jsonResp({ success: false, error: "Prompt diperlukan" }, 400, corsHeaders);
  }

  const systemPrompts = {
    opr: `Anda adalah pembantu penulisan laporan program sekolah dalam Bahasa Malaysia. Tulis laporan OPR yang formal. Format: Tajuk, Objektif, Aktiviti, Hasil, Cabaran, Cadangan.`,
    default: `Anda adalah pembantu sekolah SK Kiandongo yang menulis dalam Bahasa Malaysia formal.`,
  };

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
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
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

function jsonResp(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
