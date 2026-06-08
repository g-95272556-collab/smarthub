import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.paper);
  topBar(ctx, slide, "OPR", "Modul OPR digunakan selepas aktiviti atau program sekolah", "Tunjuk satu contoh sebenar supaya guru nampak hasil akhir dan bukannya hanya borang input.");
  card(ctx, slide, 72, 220, 360, 292, "Maklumat yang perlu diisi", "Nama program\nTarikh dan tempat\nBilangan peserta\nObjektif\nAktiviti dijalankan\nKekuatan / kejayaan\nKelemahan / cadangan", { fill: COLORS.white });
  card(ctx, slide, 460, 220, 356, 292, "Lampiran gambar", "Guru perlu menambah gambar yang jelas dan relevan mengikut keperluan sekolah. Jelaskan semasa taklimat bahawa gambar membantu memudahkan cetakan laporan OPR.", { fill: COLORS.paleBlue });
  card(ctx, slide, 844, 220, 362, 292, "Output akhir", "Selepas semua maklumat lengkap, guru boleh cetak atau eksport laporan OPR untuk simpanan dan dokumentasi rasmi sekolah.", { fill: COLORS.paleGold });
  footer(ctx, slide, 7);
  return slide;
}
