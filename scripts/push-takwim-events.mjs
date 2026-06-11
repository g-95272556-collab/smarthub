import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = "https://xbasmarthub.netlify.app";
const dbConfigUrl = `${SITE_URL}/.netlify/functions/db-config`;

try {
  console.log("Membaca fail takwim-sekolah-2026-06-09.json...");
  const filePath = resolve("takwim-sekolah-2026-06-09.json");
  const rawEvents = readFileSync(filePath, "utf-8");
  const events = JSON.parse(rawEvents);

  console.log(`Mengesan ${events.length} acara takwim.`);

  console.log("Memuat naik takwim ke Netlify Blobs (key: TAKWIM_EVENTS)...");
  const uploadResponse = await fetch(dbConfigUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: "TAKWIM_EVENTS",
      value: JSON.stringify(events),
    }),
  });

  const uploadResult = await uploadResponse.json();
  if (!uploadResponse.ok || !uploadResult.success) {
    throw new Error(uploadResult.error || `Upload gagal dengan status ${uploadResponse.status}`);
  }

  console.log("Berjaya memuat naik ke Netlify Blobs.");

  console.log("Menyelaras Blob ke pangkalan data D1...");
  const syncResponse = await fetch(`${dbConfigUrl}?sync=d1`, {
    method: "POST",
  });

  const syncResult = await syncResponse.json();
  if (!syncResponse.ok || !syncResult.success) {
    throw new Error(syncResult.error || `Penyelarasan D1 gagal dengan status ${syncResponse.status}`);
  }

  console.log("Berjaya! Takwim telah dimuat naik ke Netlify Blobs dan disegerakkan ke D1.");
} catch (error) {
  console.error("Ralat berlaku:", error.message);
  process.exit(1);
}
