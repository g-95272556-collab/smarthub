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
