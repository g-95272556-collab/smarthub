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
