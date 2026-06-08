import { COLORS, fullBleed, footer } from "./theme.mjs";
export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.navy);
  ctx.addText(slide, { x: 84, y: 122, w: 540, h: 28, text: "Penutup", fontSize: 16, bold: true, color: "#A7C8FF" });
  ctx.addText(slide, { x: 84, y: 164, w: 820, h: 60, text: "Gunakan xbasmarthub secara konsisten supaya rekod sekolah lebih cepat, kemas dan seragam.", fontSize: 32, bold: true, color: COLORS.white, face: ctx.fonts.title });
  ctx.addText(slide, { x: 84, y: 266, w: 642, h: 150, text: "Cadangan penutup semasa taklimat:\n• Ingatkan guru modul utama yang mereka perlu guna.\n• Tunjuk sekali lagi aliran kehadiran.\n• Buka ruang soal jawab dan demonstrasi live jika perlu.", fontSize: 22, color: "#E7EEFF" });
  ctx.addShape(slide, { x: 790, y: 198, w: 380, h: 284, fill: "#27467A", line: ctx.line("#4F77B8", 1.5) });
  ctx.addText(slide, { x: 824, y: 248, w: 308, h: 44, text: "Sesi Soal Jawab", fontSize: 28, bold: true, color: COLORS.gold, align: "center" });
  ctx.addText(slide, { x: 824, y: 320, w: 308, h: 88, text: "Buka soalan berkaitan login, kehadiran, OPR, laporan dan akses guru.", fontSize: 20, color: COLORS.white, align: "center" });
  footer(ctx, slide, 10);
  return slide;
}
