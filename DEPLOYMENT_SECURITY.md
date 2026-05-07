# SmartSchoolHub Deployment & Secret Checklist

## Prinsip Ringkas

- Public config boleh dilihat browser. Jangan letak secret di `runtime-config.js`, `index.html`, atau `app.js`.
- Secret production mesti disimpan di Cloudflare Worker secrets, Netlify environment variables, Google Apps Script properties, atau backend config yang dilindungi.
- Fail `.env`, `.env.*`, dan `env.js` ialah fail tempatan dan sudah diabaikan oleh Git.

## Public Config

Nilai berikut boleh berada dalam `runtime-config.js` kerana ia perlu dibaca frontend:

- `workerUrl`
- `googleAuthUrl`
- `googleClientId`
- `launchDate`

Contoh:

```js
window.SMARTSCHOOLHUB_RUNTIME_CONFIG = Object.assign({
  workerUrl: 'https://example.workers.dev',
  googleAuthUrl: 'https://oauth.example.workers.dev',
  googleClientId: 'google-client-id.apps.googleusercontent.com',
  launchDate: '2026-06-08'
}, window.SMARTSCHOOLHUB_RUNTIME_CONFIG || {});
```

## Cloudflare Worker Utama

Fail config:

- `wrangler.toml`

Rahsia yang perlu diset sebagai Worker secrets:

```powershell
npx wrangler secret put WORKER_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put GOOGLE_API_CLIENT_SECRET
npx wrangler secret put GOOGLE_API_REFRESH_TOKEN
```

Config bukan rahsia yang boleh berada dalam `[vars]`:

- `GOOGLE_API_CLIENT_ID`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_BACKEND`
- `CLOUDFLARE_D1_BACKEND`
- `APPS_SCRIPT_URL`

Nota:

- `GOOGLE_SHEETS_SPREADSHEET_ID` bukan secret cryptographic, tetapi ia tetap operational identifier. Jangan jadikan repo public tanpa menilai risiko akses/data.
- Jangan commit `wrangler secret` output, token API Cloudflare, atau fail local state `.wrangler/`.

## Google OAuth Worker

Fail config:

- `wrangler.google-oauth.toml`

Config public/operational:

- `GOOGLE_CLIENT_ID` atau `GOOGLE_CLIENT_IDS`
- `GOOGLE_ALLOWED_EMAIL_DOMAINS`
- `ALLOWED_ORIGINS`

Semak:

- `ALLOWED_ORIGINS` patut diisi untuk production supaya CORS tidak terlalu longgar.
- Domain email sekolah perlu kekal ketat, contohnya `moe-dl.edu.my`.

## Netlify

Fail config:

- `netlify.toml`

Environment variables Netlify yang relevan:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_IDS`
- `GOOGLE_ALLOWED_EMAIL_DOMAINS`
- `ALLOWED_ORIGINS`

Semak:

- CSP dalam `netlify.toml` perlu dikemas kini jika endpoint baru ditambah.
- Jangan letak token Telegram/Fonnte/Gemini dalam Netlify public build vars jika ia akan dibundle ke frontend.

## Apps Script

Fail tempatan:

- `.clasp.json`

Peraturan:

- `.clasp.json` sudah ignored dan tidak boleh commit.
- `apps-script/Code.gs` ialah hasil sync dan sudah ignored.
- Simpan `scriptId` sebenar hanya dalam `.clasp.json` tempatan.

Aliran:

```powershell
npm run apps:sync
npm run apps:push
npm run apps:deploy
```

## Token Notifikasi

Token berikut tidak boleh berada dalam source code:

- `TELEGRAM_BOT`
- `FONNTE_TOKEN`
- mana-mana token WhatsApp/API gateway

Cadangan operasi:

- Simpan di backend config/platform secret.
- Dalam UI, paparkan masked value sahaja selepas disimpan.
- Rotate token jika pernah tersalin ke commit history, chat, screenshot, atau public log.

## Verifikasi Sebelum Push

Jalankan sekurang-kurangnya:

```powershell
npm ci
npm audit --json
npm run build:web
npm run build:android
npx cap doctor
node --check app.js
node --check SmartSchoolHub_Worker.js
node --check workers\google-oauth-core.mjs
node --check netlify\functions\google-oauth.mjs
git diff --check
```

Semak Git:

```powershell
git status --short
git diff --cached --check
```

Pastikan tiada:

- `.env`
- `.clasp.json`
- `.wrangler/`
- `www/`
- `android/app/src/main/assets/`
- patch/screenshot/render sementara
- token sebenar dalam diff
