import { COLORS, fullBleed, topBar, footer, card } from "./theme.mjs";
export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  fullBleed(ctx, slide, COLORS.white);
  topBar(ctx, slide, "Kehadiran", "Cara menggunakan modul Kehadiran Guru", "Fokus pada aliran semak GPS, daftar hadir, semak status dan punch out.");
  card(ctx, slide, 72, 216, 420, 330, "Aliran semasa daftar hadir", "1. Buka modul Kehadiran Guru\n2. Tekan Semak GPS jika perlu\n3. Tekan Daftar Hadir Sekarang\n4. Sahkan rekod berjaya dipaparkan\n5. Gunakan Punch-Out apabila tiba masanya", { fill: COLORS.paleBlue });
  card(ctx, slide, 530, 216, 320, 152, "Jika GPS bermasalah", "Benarkan lokasi, semak internet dan muat semula modul sebelum cuba semula.", { fill: COLORS.paleGold });
  card(ctx, slide, 530, 394, 320, 152, "Jika masih tidak berjaya", "Maklum kepada pentadbir supaya rekod manual boleh dibuat oleh admin mengikut keperluan.", { fill: COLORS.paleRed });
  card(ctx, slide, 882, 216, 324, 330, "Butang penting dalam modul", "Segar Sekarang\nRekod Manual Admin\nDaftar Keluar Manual\nDaftar Manual\nSemak GPS", { fill: COLORS.paper });
  footer(ctx, slide, 6);
  return slide;
}
