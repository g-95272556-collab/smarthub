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
