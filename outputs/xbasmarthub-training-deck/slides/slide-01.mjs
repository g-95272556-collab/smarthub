import { COLORS, fullBleed, footer } from "./theme.mjs";
export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  ctx.addShape(slide, { x: 0, y: 0, w: 1280, h: 172, fill: COLORS.navy, line: ctx.line("transparent", 0) });
  await ctx.addImage(slide, { path: "D:\\Pull Netlify\\assets\\sk-kiandongo-logo.png", x: 76, y: 42, w: 118, h: 118, fit: "contain", alt: "Logo SK Kiandongo" });
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
