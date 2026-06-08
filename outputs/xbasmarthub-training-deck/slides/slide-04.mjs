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
