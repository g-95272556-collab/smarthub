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
