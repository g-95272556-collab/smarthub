# Apps Script Setup

Folder `apps-script/` disediakan untuk deploy melalui `clasp`.

## Langkah sekali sahaja

1. Salin `.clasp.json.example` menjadi `.clasp.json`.
2. Gantikan nilai `scriptId` dengan Apps Script Project ID sebenar.
3. Jalankan `npm install`.
4. Jalankan `npx clasp login`.

## Aliran kerja biasa

1. `npm run apps:sync`
2. `npm run apps:push`
3. `npm run apps:deploy`

`apps:sync` akan menyalin kandungan `SmartSchoolHub_AppsScript_Clean.gs` ke `apps-script/Code.gs` supaya sumber backend tempatan kekal satu fail utama sahaja.
