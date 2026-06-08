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
