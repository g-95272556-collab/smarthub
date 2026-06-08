import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const skillDir = path.resolve(
  "C:\\Users\\SK KIANDONGO PDT2\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.601.10930\\skills\\presentations"
);

const workspace = path.join(root, "outputs", "xbasmarthub-training-deck");
const slidesDir = path.join(workspace, "slides");
const previewDir = path.join(workspace, "preview");
const layoutDir = path.join(workspace, "layout");
const outputDir = path.join(root, "deliverables");
const outputPptx = path.join(outputDir, "slaid-taklimat-xbasmarthub-sk-kiandongo.pptx");
const manifestPath = path.join(workspace, "artifact-build-manifest.json");
const contactSheetPath = path.join(previewDir, "contact-sheet.png");
const buildScript = path.join(skillDir, "scripts", "build_artifact_deck.mjs");
const logoPath = path.join(root, "assets", "sk-kiandongo-logo.png").replace(/\\/g, "\\\\");

const themeModule = `
export const COLORS = {
  navy: "#1B2F55",
  blue: "#3A78C2",
  gold: "#D6AD26",
  ink: "#203040",
  muted: "#5F6C84",
  paper: "#F6F8FC",
  white: "#FFFFFF",
  paleBlue: "#EAF1FB",
  paleGold: "#FFF7DD",
  paleGreen: "#E8F7ED",
  paleRed: "#FDEDEE",
  border: "#D8E1EE"
};

export function fullBleed(ctx, slide, color) {
  return ctx.addShape(slide, { x: 0, y: 0, w: 1280, h: 720, fill: color, line: ctx.line("transparent", 0) });
}

export function topBar(ctx, slide, kicker, title, subtitle, opts = {}) {
  const titleColor = opts.titleColor || COLORS.navy;
  const subtitleColor = opts.subtitleColor || COLORS.muted;
  ctx.addText(slide, {
    x: 72, y: 54, w: 260, h: 24,
    text: kicker.toUpperCase(),
    fontSize: 14, bold: true, color: COLORS.blue, face: ctx.fonts.body
  });
  ctx.addText(slide, {
    x: 72, y: 82, w: 980, h: 54,
    text: title,
    fontSize: 28, bold: true, color: titleColor, face: ctx.fonts.title
  });
  if (subtitle) {
    ctx.addText(slide, {
      x: 72, y: 138, w: 980, h: 38,
      text: subtitle,
      fontSize: 16, color: subtitleColor, face: ctx.fonts.body
    });
  }
}

export function footer(ctx, slide, page) {
  ctx.addText(slide, {
    x: 72, y: 684, w: 420, h: 18,
    text: "SmartSchoolHub / xbasmarthub / SK Kiandongo",
    fontSize: 10, color: COLORS.muted
  });
  ctx.addText(slide, {
    x: 1160, y: 684, w: 48, h: 18,
    text: String(page), fontSize: 10, bold: true, color: COLORS.muted, align: "right"
  });
}

export function card(ctx, slide, x, y, w, h, title, body, options = {}) {
  ctx.addShape(slide, {
    x, y, w, h,
    fill: options.fill || COLORS.white,
    line: ctx.line(options.border || COLORS.border, 1.5)
  });
  ctx.addText(slide, {
    x: x + 18, y: y + 16, w: w - 36, h: 28,
    text: title, fontSize: 18, bold: true, color: options.titleColor || COLORS.navy
  });
  ctx.addText(slide, {
    x: x + 18, y: y + 50, w: w - 36, h: h - 62,
    text: body, fontSize: options.bodySize || 15, color: COLORS.ink
  });
}

export function bulletLines(ctx, slide, x, y, width, items, options = {}) {
  items.forEach((item, index) => {
    ctx.addShape(slide, {
      x, y: y + index * (options.gap || 54), w: 16, h: 16,
      fill: options.dotColor || COLORS.gold, line: ctx.line("transparent", 0)
    });
    ctx.addText(slide, {
      x: x + 26, y: y - 4 + index * (options.gap || 54), w: width - 26, h: 34,
      text: item, fontSize: options.size || 18, color: options.color || COLORS.ink
    });
  });
}
`;

const slides = [
  {
    file: "slide-01.mjs",
    code: `
import { COLORS, fullBleed, footer } from "./theme.mjs";
export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  ctx.addShape(slide, { x: 0, y: 0, w: 1280, h: 172, fill: COLORS.navy, line: ctx.line("transparent", 0) });
  await ctx.addImage(slide, { path: "${logoPath}", x: 76, y: 42, w: 118, h: 118, fit: "contain", alt: "Logo SK Kiandongo" });
  ctx.addText(slide, { x: 224, y: 54, w: 870, h: 44, text: "Taklimat Penggunaan Webapp XBasSmartHub", fontSize: 30, bold: true, color: COLORS.white, face: ctx.fonts.title });
  ctx.addText(slide, { x: 224, y: 102, w: 720, h: 24, text: "Panduan ringkas untuk guru-guru SK Kiandongo", fontSize: 16, color: "#D9E7FF" });
  ctx.addShape(slide, { x: 72, y: 236, w: 548, h: 292, fill: COLORS.white, line: ctx.line(COLORS.border, 1.5) });
  ctx.addText(slide, { x: 98, y: 266, w: 500, h: 34, text: "Apa yang akan dipelajari", fontSize: 20, bold: true, color: COLORS.navy });
  const items = [
    "Cara log masuk dan memasang aplikasi",
    "Aliran penggunaan harian guru",
    "Modul Kehadiran Guru, OPR dan laporan",
    "Tips penggunaan semasa di sekolah"
  ];
  items.forEach((item, index) => {
    ctx.addShape(slide, { x: 100, y: 320 + index * 46, w: 14, h: 14, fill: COLORS.gold, line: ctx.line("transparent", 0) });
    ctx.addText(slide, { x: 126, y: 312 + index * 46, w: 440, h: 28, text: item, fontSize: 17, color: COLORS.ink });
  });
  ctx.addShape(slide, { x: 668, y: 236, w: 538, h: 292, fill: COLORS.paleBlue, line: ctx.line(COLORS.blue, 2) });
  ctx.addText(slide, { x: 700, y: 270, w: 478, h: 34, text: "Nilai utama webapp ini", fontSize: 20, bold: true, color: COLORS.navy });
  ctx.addText(slide, { x: 700, y: 320, w: 478, h: 164, text: "Satu platform untuk urusan harian guru: kehadiran, laporan, OPR, takwim dan pelaporan kokurikulum. Fokus utama ialah mengurangkan kerja berulang dan mempercepat dokumentasi sekolah.", fontSize: 20, color: COLORS.ink });
  footer(ctx, slide, 1);
  return slide;
}
`,
  },
  {
    file: "slide-02.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.white);
  topBar(ctx, slide, "Agenda", "Aliran taklimat yang dicadangkan", "Gunakan urutan ini semasa pembentangan supaya guru nampak aliran kerja sebenar.");
  const blocks = [
    ["1. Mula", "Pengenalan ringkas, login Google dan pemasangan aplikasi pada telefon."],
    ["2. Aliran harian", "Tunjuk apa guru buat pada awal pagi, semasa bertugas dan selepas aktiviti."],
    ["3. Modul utama", "Demonstrasi Kehadiran Guru, OPR, Laporan Guru Bertugas dan Pelaporan Kokum."],
    ["4. Sokongan", "Terangkan modul takwim, peranan admin dan langkah apabila berlaku masalah."],
  ];
  blocks.forEach((block, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    card(ctx, slide, 72 + col * 570, 220 + row * 180, 538, 148, block[0], block[1], { fill: col === 0 ? COLORS.paper : COLORS.paleBlue });
  });
  footer(ctx, slide, 2);
  return slide;
}
`,
  },
  {
    file: "slide-03.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, bulletLines } from "./theme.mjs";
export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  topBar(ctx, slide, "Manfaat", "Kenapa guru perlu menggunakan xbasmarthub?", "Tekankan manfaat praktikal, bukan sekadar ciri sistem.");
  ctx.addShape(slide, { x: 72, y: 214, w: 506, h: 390, fill: COLORS.white, line: ctx.line(COLORS.border, 1.5) });
  ctx.addText(slide, { x: 96, y: 244, w: 440, h: 36, text: "Kelebihan kepada guru", fontSize: 21, bold: true, color: COLORS.navy });
  bulletLines(ctx, slide, 98, 304, 442, [
    "Lebih cepat merekod kehadiran dan laporan sekolah",
    "Semua modul utama berada dalam satu webapp",
    "Mudah dibuka melalui telefon atau komputer",
    "Menyokong dokumentasi rasmi sekolah dengan lebih tersusun"
  ], { gap: 62, size: 18 });
  ctx.addShape(slide, { x: 624, y: 214, w: 582, h: 390, fill: COLORS.navy, line: ctx.line("transparent", 0) });
  ctx.addText(slide, { x: 656, y: 248, w: 520, h: 30, text: "Mesej utama kepada guru", fontSize: 18, bold: true, color: "#DCE9FF" });
  ctx.addText(slide, { x: 656, y: 300, w: 500, h: 220, text: "Tujuan webapp ini bukan menambah beban kerja, tetapi memudahkan urusan sedia ada. Semasa taklimat, tunjuk satu demi satu aliran sebenar yang guru gunakan mengikut masa kerja mereka: pagi, semasa aktiviti, selepas program dan semasa tugasan mingguan.", fontSize: 24, color: COLORS.white });
  footer(ctx, slide, 3);
  return slide;
}
`,
  },
  {
    file: "slide-04.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.white);
  topBar(ctx, slide, "Mula", "Cara bermula: log masuk dan pasang aplikasi", "Langkah ini sesuai ditunjukkan secara live terus pada telefon atau pelayar web.");
  const steps = [
    ["Buka pautan rasmi", "Buka webapp xbasmarthub menggunakan telefon atau komputer."],
    ["Log masuk Google", "Gunakan akaun Google yang telah didaftarkan dalam sistem."],
    ["Benarkan lokasi", "Akses lokasi diperlukan untuk fungsi kehadiran berasaskan GPS."],
    ["Pasang aplikasi", "Tekan butang Pasang Aplikasi jika mahu akses seperti aplikasi sebenar."]
  ];
  steps.forEach((step, idx) => {
    const y = 212 + idx * 108;
    ctx.addShape(slide, { x: 80, y, w: 72, h: 72, fill: COLORS.gold, line: ctx.line("transparent", 0) });
    ctx.addText(slide, { x: 104, y: y + 20, w: 24, h: 24, text: String(idx + 1), fontSize: 22, bold: true, color: COLORS.navy, align: "center" });
    card(ctx, slide, 176, y - 4, 590, 80, step[0], step[1], { fill: idx % 2 === 0 ? COLORS.paper : COLORS.paleBlue });
  });
  ctx.addShape(slide, { x: 820, y: 212, w: 384, h: 400, fill: COLORS.paleGold, line: ctx.line(COLORS.gold, 1.5) });
  ctx.addText(slide, { x: 848, y: 246, w: 320, h: 30, text: "Tip semasa demo", fontSize: 19, bold: true, color: COLORS.navy });
  ctx.addText(slide, { x: 848, y: 298, w: 316, h: 252, text: "Tunjuk perbezaan antara buka melalui pelayar biasa dan aplikasi yang telah dipasang. Terangkan bahawa pemasangan memudahkan capaian, tetapi semua modul masih boleh dibuka melalui pautan web yang sama.", fontSize: 19, color: COLORS.ink });
  footer(ctx, slide, 4);
  return slide;
}
`,
  },
  {
    file: "slide-05.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer } from "./theme.mjs";
export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  topBar(ctx, slide, "Aliran Harian", "Rutin penggunaan guru dari pagi hingga tamat tugasan", "Slide ini membantu guru faham bila hendak menggunakan modul tertentu.");
  const steps = [
    ["Sebelum 8.00 pagi", "Buka Kehadiran Guru, semak GPS dan daftar hadir."],
    ["Semasa sesi persekolahan", "Semak takwim atau maklumat berkaitan aktiviti semasa."],
    ["Selepas program/aktiviti", "Buka OPR untuk rekod laporan dan lampiran gambar."],
    ["Semasa minggu bertugas", "Lengkapkan Laporan Guru Bertugas mengikut pemerhatian."],
    ["Semasa aktiviti kokum", "Kemaskini modul Pelaporan Kokum dan status kehadiran murid."]
  ];
  steps.forEach((step, idx) => {
    const x = 84 + idx * 228;
    ctx.addShape(slide, { x, y: 280, w: 188, h: 178, fill: idx % 2 === 0 ? COLORS.white : COLORS.paleBlue, line: ctx.line(COLORS.border, 1.5) });
    ctx.addShape(slide, { x: x + 58, y: 228, w: 72, h: 72, fill: COLORS.navy, line: ctx.line("transparent", 0) });
    ctx.addText(slide, { x: x + 82, y: 248, w: 24, h: 24, text: String(idx + 1), fontSize: 22, bold: true, color: COLORS.white, align: "center" });
    ctx.addText(slide, { x: x + 16, y: 318, w: 156, h: 40, text: step[0], fontSize: 16, bold: true, color: COLORS.navy, align: "center" });
    ctx.addText(slide, { x: x + 16, y: 366, w: 156, h: 72, text: step[1], fontSize: 14, color: COLORS.ink, align: "center" });
  });
  footer(ctx, slide, 5);
  return slide;
}
`,
  },
  {
    file: "slide-06.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.white);
  topBar(ctx, slide, "Kehadiran", "Cara menggunakan modul Kehadiran Guru", "Fokus pada aliran semak GPS, daftar hadir, semak status dan punch out.");
  card(ctx, slide, 72, 216, 420, 330, "Aliran semasa daftar hadir", "1. Buka modul Kehadiran Guru\\n2. Tekan Semak GPS jika perlu\\n3. Tekan Daftar Hadir Sekarang\\n4. Sahkan rekod berjaya dipaparkan\\n5. Gunakan Punch-Out apabila tiba masanya", { fill: COLORS.paleBlue });
  card(ctx, slide, 530, 216, 320, 152, "Jika GPS bermasalah", "Benarkan lokasi, semak internet dan muat semula modul sebelum cuba semula.", { fill: COLORS.paleGold });
  card(ctx, slide, 530, 394, 320, 152, "Jika masih tidak berjaya", "Maklum kepada pentadbir supaya rekod manual boleh dibuat oleh admin mengikut keperluan.", { fill: COLORS.paleRed });
  card(ctx, slide, 882, 216, 324, 330, "Butang penting dalam modul", "Segar Sekarang\\nRekod Manual Admin\\nDaftar Keluar Manual\\nDaftar Manual\\nSemak GPS", { fill: COLORS.paper });
  footer(ctx, slide, 6);
  return slide;
}
`,
  },
  {
    file: "slide-07.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  topBar(ctx, slide, "OPR", "Modul OPR digunakan selepas aktiviti atau program sekolah", "Tunjuk satu contoh sebenar supaya guru nampak hasil akhir dan bukannya hanya borang input.");
  card(ctx, slide, 72, 220, 360, 292, "Maklumat yang perlu diisi", "Nama program\\nTarikh dan tempat\\nBilangan peserta\\nObjektif\\nAktiviti dijalankan\\nKekuatan / kejayaan\\nKelemahan / cadangan", { fill: COLORS.white });
  card(ctx, slide, 460, 220, 356, 292, "Lampiran gambar", "Guru perlu menambah gambar yang jelas dan relevan mengikut keperluan sekolah. Jelaskan semasa taklimat bahawa gambar membantu memudahkan cetakan laporan OPR.", { fill: COLORS.paleBlue });
  card(ctx, slide, 844, 220, 362, 292, "Output akhir", "Selepas semua maklumat lengkap, guru boleh cetak atau eksport laporan OPR untuk simpanan dan dokumentasi rasmi sekolah.", { fill: COLORS.paleGold });
  footer(ctx, slide, 7);
  return slide;
}
`,
  },
  {
    file: "slide-08.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.white);
  topBar(ctx, slide, "Laporan", "Dua modul yang kerap melibatkan dokumentasi: Guru Bertugas dan Kokum", "Terangkan fungsi kedua-duanya secara ringkas supaya guru nampak perbezaan penggunaan.");
  card(ctx, slide, 72, 224, 548, 320, "Laporan Guru Bertugas", "Digunakan semasa minggu bertugas untuk merekod pemerhatian seperti disiplin, kebersihan, cuaca, aktiviti dan rumusan harian/mingguan. Gunakan bahasa formal dan ringkas.", { fill: COLORS.paleBlue });
  card(ctx, slide, 660, 224, 548, 320, "Pelaporan Kokum", "Digunakan untuk aktiviti kokurikulum: kehadiran, unit terlibat, ringkasan aktiviti, pencapaian dan status tindakan susulan. Sesuai untuk guru penasihat dan penyelaras.", { fill: COLORS.paper });
  footer(ctx, slide, 8);
  return slide;
}
`,
  },
  {
    file: "slide-09.mjs",
    code: `
import { COLORS, fullBleed, topBar, footer, card, bulletLines } from "./theme.mjs";
export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  topBar(ctx, slide, "Akses & Sokongan", "Peranan guru dan pentadbir dalam webapp ini", "Penting supaya guru tahu fungsi mana yang digunakan sendiri dan mana yang perlu dibantu admin.");
  card(ctx, slide, 72, 220, 420, 302, "Guru", "Fokus kepada modul yang menyokong kerja harian: Kehadiran Guru, OPR, Laporan Guru Bertugas, Pelaporan Kokum, Takwim dan lain-lain yang dibenarkan.", { fill: COLORS.white });
  card(ctx, slide, 528, 220, 324, 302, "Pentadbir", "Menyelia konfigurasi, notifikasi, data operasi, akses pengguna dan rekod manual jika diperlukan.", { fill: COLORS.paleBlue });
  ctx.addShape(slide, { x: 886, y: 220, w: 320, h: 302, fill: COLORS.white, line: ctx.line(COLORS.border, 1.5) });
  ctx.addText(slide, { x: 910, y: 246, w: 266, h: 30, text: "Tips semasa berlaku isu", fontSize: 18, bold: true, color: COLORS.navy });
  bulletLines(ctx, slide, 912, 296, 250, [
    "Muat semula modul",
    "Semak sambungan internet",
    "Benarkan akses lokasi",
    "Maklum kepada admin jika perlu"
  ], { gap: 50, size: 16 });
  footer(ctx, slide, 9);
  return slide;
}
`,
  },
  {
    file: "slide-10.mjs",
    code: `
import { COLORS, fullBleed, footer } from "./theme.mjs";
export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.navy);
  ctx.addText(slide, { x: 84, y: 122, w: 540, h: 28, text: "Penutup", fontSize: 16, bold: true, color: "#A7C8FF" });
  ctx.addText(slide, { x: 84, y: 164, w: 820, h: 60, text: "Gunakan xbasmarthub secara konsisten supaya rekod sekolah lebih cepat, kemas dan seragam.", fontSize: 32, bold: true, color: COLORS.white, face: ctx.fonts.title });
  ctx.addText(slide, { x: 84, y: 266, w: 642, h: 150, text: "Cadangan penutup semasa taklimat:\\n• Ingatkan guru modul utama yang mereka perlu guna.\\n• Tunjuk sekali lagi aliran kehadiran.\\n• Buka ruang soal jawab dan demonstrasi live jika perlu.", fontSize: 22, color: "#E7EEFF" });
  ctx.addShape(slide, { x: 790, y: 198, w: 380, h: 284, fill: "#27467A", line: ctx.line("#4F77B8", 1.5) });
  ctx.addText(slide, { x: 824, y: 248, w: 308, h: 44, text: "Sesi Soal Jawab", fontSize: 28, bold: true, color: COLORS.gold, align: "center" });
  ctx.addText(slide, { x: 824, y: 320, w: 308, h: 88, text: "Buka soalan berkaitan login, kehadiran, OPR, laporan dan akses guru.", fontSize: 20, color: COLORS.white, align: "center" });
  footer(ctx, slide, 10);
  return slide;
}
`,
  },
];

async function writeSlides() {
  await fs.mkdir(slidesDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(slidesDir, "theme.mjs"), themeModule, "utf8");
  for (const slide of slides) {
    await fs.writeFile(path.join(slidesDir, slide.file), slide.code.trimStart(), "utf8");
  }
}

async function main() {
  await writeSlides();
  const nodePath = "C:\\Users\\SK KIANDONGO PDT2\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";
  const pythonPath = "C:\\Users\\SK KIANDONGO PDT2\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
  const env = { ...process.env, HOME: "C:\\Users\\SK KIANDONGO PDT2", PYTHON: pythonPath };
  const result = spawnSync(
    nodePath,
    [
      buildScript,
      "--workspace", workspace,
      "--slides-dir", slidesDir,
      "--out", outputPptx,
      "--preview-dir", previewDir,
      "--layout-dir", layoutDir,
      "--contact-sheet", contactSheetPath,
      "--manifest", manifestPath,
      "--slide-count", String(slides.length),
    ],
    { cwd: root, env, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Gagal membina deck").trim());
  }
  process.stdout.write(result.stdout);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
