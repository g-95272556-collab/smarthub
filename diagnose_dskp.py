"""
DSKP Diagnostic - Semak sama ada PDF ada teks atau imej scan
Jalankan: python diagnose_dskp.py
"""
import os, sys

try:
    import pdfplumber
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber

# Uji satu fail dari setiap tahun
TEST_FILES = [
    (r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 1\34 DSKP KSSR Semakan Matematik Tahun 1.pdf", "Math-1", 46),
    (r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 1\08  DSKP KSSR Tahun 1 Sains 06122016.pdf", "Sains-1", 40),
    (r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 4\DSKP KSSR SEMAKAN 2017 MATEMATIK TAHUN 4.pdf", "Math-4", 46),
    (r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 4\DSKP SEJARAH TAHUN 4 SEMAKAN 2017.pdf", "Sejarah-4", 39),
    (r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 5\012_DSKP_KSSR_Semakan_2017_Sains_Thn5 print.pdf", "Sains-5", 54),
]

print("\n" + "="*60)
print("DSKP PDF Diagnostic")
print("="*60)

for fpath, label, start_page in TEST_FILES:
    if not os.path.exists(fpath):
        print(f"\n[{label}] FAIL TIDAK JUMPA: {fpath}")
        continue

    print(f"\n{'─'*50}")
    print(f"[{label}] Halaman mula: {start_page}")
    print(f"Fail: {os.path.basename(fpath)}")

    try:
        with pdfplumber.open(fpath) as pdf:
            total = len(pdf.pages)
            print(f"Jumlah halaman PDF: {total}")

            # Semak 3 halaman: start-1, start, start+1
            for offset in [-1, 0, 1, 2]:
                pnum = start_page - 1 + offset  # 0-based
                if pnum < 0 or pnum >= total:
                    continue

                page = pdf.pages[pnum]
                text = page.extract_text() or ''
                words = page.extract_words()

                print(f"\n  -- Halaman PDF {pnum+1} (idx {pnum}) --")
                print(f"  Bilangan perkataan: {len(words)}")

                if text:
                    # Print 500 aksara pertama
                    preview = text[:500].replace('\n', ' | ')
                    print(f"  TEKS: {preview}")
                else:
                    print(f"  TIADA TEKS (mungkin imej scan)")

                # Semak table
                try:
                    tables = page.extract_tables()
                    print(f"  Bilangan jadual: {len(tables)}")
                    if tables:
                        for ti, t in enumerate(tables[:2]):
                            print(f"  Jadual {ti+1}: {len(t)} baris, {len(t[0]) if t else 0} lajur")
                            if t and t[0]:
                                row0 = [str(c or '')[:30] for c in t[0]]
                                print(f"    Baris 1: {row0}")
                except Exception as te:
                    print(f"  Ralat jadual: {te}")

    except Exception as e:
        print(f"  ERROR: {e}")

print("\n" + "="*60)
print("Salin output di atas dan kongsikan kepada Claude.")
print("="*60)
