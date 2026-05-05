"""
DSKP KSSR Extractor v4 - SmartSchoolHub
Pendekatan: text-based parsing dengan pola khusus setiap subjek.
Jalankan: python extract_dskp.py
Output: dskp_database.json
"""
import os, re, json, sys

try:
    import pdfplumber
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber

# ─── KONFIGURASI ─────────────────────────────────────────────────────────────
DSKP_ROOT   = r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR"
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dskp_database.json")

PAGE_STARTS = {
    'BM-1':39,  'BI-1':39,   'Math-1':46, 'Sains-1':40,
    'PI-1':30,  'Moral-1':35,'PJ-1':40,   'Seni-1':31, 'Muzik-1':31,'BKD-1':41,
    'BM-2':41,  'BI-2':39,   'Math-2':46, 'Sains-2':49,
    'PI-2':29,  'Moral-2':38,'PJ-2':58,   'Seni-2':31, 'Muzik-2':31,'BKD-2':39,
    'BM-3':41,  'BI-3':36,   'Math-3':46, 'Sains-3':38,
    'PI-3':32,  'Moral-3':38,'PJ-3':42,   'Seni-3':31, 'Muzik-3':31,'BKD-3':39,
    'BM-4':43,  'BI-4':36,   'Math-4':46, 'Sains-4':54,'Sejarah-4':39,'RBT-4':32,
    'PI-4':31,  'Moral-4':35,'PJ-4':44,   'Seni-4':31, 'Muzik-4':31, 'BKD-4':41,
    'BM-5':41,  'BI-5':36,   'Math-5':44, 'Sains-5':54,'Sejarah-5':40,'RBT-5':31,
    'PI-5':31,  'Moral-5':36,'PJ-5':44,   'Seni-5':29, 'Muzik-5':31, 'BKD-5':39,
    'BM-6':40,  'BI-6':36,   'Math-6':44, 'Sains-6':54,'Sejarah-6':39,'RBT-6':31,
    'PI-6':36,  'Moral-6':36,'PJ-6':44,   'Seni-6':31, 'Muzik-6':31, 'BKD-6':42,
}
PAGE_BUFFER = 4

# Subjek yang perlu buffer lebih besar
PAGE_BUFFER_EXTRA = {'RBT-4': 6, 'PI-1': 6, 'PI-2': 6, 'PI-3': 6,
                     'Moral-1': 5, 'Moral-2': 5, 'Moral-3': 5}

# ─── MAP NAMA FAIL ────────────────────────────────────────────────────────────
def map_subjek(filename):
    f = filename.lower()
    if 'bahasa melayu' in f or '_bm_' in f or ' bm ' in f or f.startswith('dskp bm'): return 'BM'
    if 'bahasa inggeris' in f or 'english' in f or '_bi_' in f or ' bi ' in f:         return 'BI'
    if 'matematik' in f or 'mathematics' in f:             return 'Math'
    if 'sains' in f and 'pend' not in f:                   return 'Sains'
    if 'sejarah' in f:                                     return 'Sejarah'
    if 'reka bentuk' in f or ' rbt' in f or '_rbt' in f:  return 'RBT'
    if 'pendidikan islam' in f or ('islam' in f and 'pend' in f): return 'PI'
    if 'moral' in f:                                       return 'Moral'
    if 'jasmani' in f or 'kesihatan' in f:                 return 'PJ'
    if 'seni visual' in f or 'psv' in f or ('seni' in f and 'visual' in f): return 'Seni'
    if 'muzik' in f or 'musik' in f:                       return 'Muzik'
    if 'kadazan' in f or 'bkd' in f:                       return 'BKD'
    return None

def map_tahun(folder):
    m = re.search(r'(\d)', folder)
    return m.group(1) if m else None

# ─── POLA TEMA PER SUBJEK ─────────────────────────────────────────────────────
MATH_BIDANG = {
    'NOMBOR DAN OPERASI', 'SUKATAN DAN GEOMETRI',
    'STATISTIK DAN KEBARANGKALIAN', 'PENGUKURAN DAN GEOMETRI',
    'ALGEBRA',
}
SAINS_TEMA = {
    'INKUIRI DALAM SAINS', 'HIDUPAN', 'JIRIM', 'TENAGA',
    'BUMI DAN ANGKASA', 'BUMI DAN ALAM SEMESTA', 'TEKNOLOGI DALAM SAINS',
    'ALAM FIZIKAL', 'ALAM HIDUP', 'SAINS HAYAT', 'SAINS FIZIKAL',
    'BUMI', 'ANGKASA',
}
BM_MODUL = [
    'MENDENGAR DAN BERTUTUR', 'MEMBACA', 'MENULIS',
    'TATABAHASA', 'SENI BAHASA',
]
BI_SKILL = [
    'LISTENING AND SPEAKING', 'READING', 'WRITING', 'LANGUAGE ARTS',
    'LISTENING', 'SPEAKING', 'GRAMMAR',
]
PI_TEMA = {
    'TILAWAH AL-QURAN', 'ULUM SYARIYYAH', 'ADAB DAN AKHLAK ISLAMIAH',
    'SIRAH', 'JAWI', 'AQIDAH', 'IBADAH', 'ADAB', 'AKHLAK',
    'AL-QURAN', 'TILAWAH', "SIRAH RASULULLAH S.A.W",
    'TILAWAH AL-QURAN DAN HAFAZAN', 'ULUM AL-QURAN',
}
PJ_TEMA = {
    'KEMAHIRAN MOTOR DAN PERGERAKAN', 'KESUKANAN', 'KECERGASAN',
    'PERMAINAN', 'PENDIDIKAN KESIHATAN', 'KESELAMATAN',
    'KEMAHIRAN ASAS', 'SUKAN', 'SENAMAN',
}
RBT_TEMA = {
    'REKA BENTUK DAN PENGHASILAN PROJEK', 'TEKNOLOGI',
    'PERTANIAN DAN BIOTEKNOLOGI', 'KEUSAHAWANAN',
    'REKA BENTUK', 'PENGHASILAN', 'BINAAN',
    'TEKNOLOGI PERTANIAN', 'TEKNOLOGI RUMAH TANGGA',
}
MORAL_NILAI = {
    'BAIK HATI','BERTANGGUNGJAWAB','BERTERIMA KASIH','BERDIKARI',
    'BERANI','BERHEMAH TINGGI','BERHORMAT-HORMAT','KEADILAN',
    'KASIH SAYANG','KEBERANIAN','KEJUJURAN','KEBEBASAN',
    'KERAJINAN','KESEDERHANAAN','KERJASAMA','KESETIAAN',
    'RASIONAL','SEMANGAT BERMASYARAKAT','BAIK HATI',
    'NILAI MURNI',
}

# ─── NOISE LINES TO SKIP ──────────────────────────────────────────────────────
SKIP_RE = [
    re.compile(r'^KSSR\s+\w+\s+TAHUN\s+\d', re.I),
    re.compile(r'^STANDARD KANDUNGAN\s+STANDARD', re.I),
    re.compile(r'^STANDARD KANDUNGAN\s*$', re.I),
    re.compile(r'^STANDARD PEMBELAJARAN', re.I),
    re.compile(r'^STANDARD PRESTASI', re.I),
    re.compile(r'^TAHAP PENGUASAAN', re.I),
    re.compile(r'^TAFSIRAN\s*$', re.I),
    re.compile(r'^CATATAN\s*$', re.I),
    re.compile(r'^Murid boleh:?\s*$', re.I),
    re.compile(r'^Cadangan [Aa]ktiviti', re.I),
    re.compile(r'^PAK 21', re.I),
    re.compile(r'^PANEL PENGGUBAL', re.I),
    re.compile(r'^ISBN', re.I),
    re.compile(r'^\d{3}-\d{3}'),        # ISBN number
    re.compile(r'^Objektif\s*$', re.I),
    re.compile(r'^Objektif:?\s*$', re.I),
    re.compile(r'^Membolehkan murid', re.I),
    re.compile(r'^KANDUNGAN\s*$', re.I),
    re.compile(r'^PENGUASAAN\s*$', re.I),
    re.compile(r'^\d+\s*$'),            # lone page numbers
]

def should_skip(line):
    line = line.strip()
    if not line or len(line) < 3:
        return True
    for r in SKIP_RE:
        if r.match(line):
            return True
    # Skip TP descriptions: "1 Menyatakan..." (single digit + text, not SK format)
    if re.match(r'^[1-6]\s+[A-Z]', line) and not re.match(r'^\d+\.\d+', line):
        return True
    return False

def extract_tema_from_header(line, subjek):
    """Cari nama tema/modul yang tersembunyi dalam baris header KSSR."""
    u = line.upper()
    if subjek == 'BM':
        for mod in BM_MODUL:
            if mod in u:
                return mod
    elif subjek == 'BI':
        for sk in BI_SKILL:
            if sk in u:
                return sk
    return None

# ─── DETECT TEMA ─────────────────────────────────────────────────────────────
def get_tema(line, subjek):
    u = line.strip().upper()
    raw = line.strip()

    if subjek == 'Math':
        if u in MATH_BIDANG: return raw
        m = re.match(r'^BIDANG PEMBELAJARAN:\s*(.+)', raw, re.I)
        if m and m.group(1).strip().upper() in MATH_BIDANG:
            return m.group(1).strip()

    elif subjek == 'Sains':
        m = re.match(r'^TEMA\s*\d*\s*[:：]?\s*(.+)', raw, re.I)
        if m: return m.group(1).strip()
        if u in SAINS_TEMA: return raw

    elif subjek == 'BM':
        # Direct match (case-insensitive)
        for mod in BM_MODUL:
            if u == mod: return mod
        # "MODUL 1: MENDENGAR DAN BERTUTUR"
        m = re.match(r'^MODUL\s+\d+\s*[:：]?\s*(.+)', raw, re.I)
        if m:
            for mod in BM_MODUL:
                if mod in m.group(1).upper(): return mod

    elif subjek == 'BI':
        for sk in BI_SKILL:
            if u == sk: return sk
        m = re.match(r'^(MODUL|MODULE|UNIT|SKILL)\s+\d+\s*[:：]?\s*(.+)', raw, re.I)
        if m:
            for sk in BI_SKILL:
                if sk in m.group(2).upper(): return sk

    elif subjek == 'PI':
        if u in PI_TEMA: return raw
        # Bahagian/Bidang numbered
        m = re.match(r'^(BAHAGIAN|BIDANG|TEMA)\s+\d+\s*[:：]?\s*(.+)', raw, re.I)
        if m: return m.group(2).strip()
        # PI topics in Malay even if Arabic content
        m = re.match(r'^(TILAWAH|ULUM|IBADAH|ADAB|AKHLAK|SIRAH|AQIDAH|JAWI)\b(.+)?', raw, re.I)
        if m: return raw

    elif subjek == 'Moral':
        # "NILAI 1 BAIK HATI" or "NILAI 1: BAIK HATI"
        m = re.match(r'^NILAI\s+(\d+)\s*[:：]?\s*(.+)', raw, re.I)
        if m: return f"Nilai {m.group(1)}: {m.group(2).strip()}"
        # Just "NILAI X" alone (name on next line)
        m = re.match(r'^NILAI\s+(\d+)\s*$', raw, re.I)
        if m: return f"Nilai {m.group(1)}"
        # Exact nilai name
        if u in MORAL_NILAI: return raw
        # Any caps-heavy moral value name
        if re.match(r'^NILAI[\s\-]', raw, re.I) and len(raw) > 6: return raw
        # "BAIK HATI", "BERTANGGUNGJAWAB" etc as standalone all-caps
        if (raw == u and 5 < len(u) < 50 and re.match(r'^[A-Z ]+$', u) and
                not re.match(r'^\d', u) and 'STANDARD' not in u and
                'KANDUNGAN' not in u):
            return raw

    elif subjek == 'PJ':
        if u in PJ_TEMA: return raw
        m = re.match(r'^(TAJUK|TEMA|BAHAGIAN)\s*\d*\s*[:：]?\s*(.+)', raw, re.I)
        if m and len(m.group(2)) > 5: return m.group(2).strip()

    elif subjek == 'RBT':
        if u in RBT_TEMA: return raw
        m = re.match(r'^(BAHAGIAN|BIDANG|TEMA|TAJUK)\s+\d+\s*[:：]?\s*(.+)', raw, re.I)
        if m: return m.group(2).strip()
        # "REKA BENTUK..." any line starting with it
        if re.match(r'^REKA BENTUK', raw, re.I): return raw

    elif subjek == 'Sejarah':
        # "BAB 1: MARI BELAJAR SEJARAH" or "TAJUK 1: NAME"
        m = re.match(r'^(BAB|TAJUK)\s+\d+\s*[:：]\s*(.+)', raw, re.I)
        if m: return m.group(2).strip()
        # All-caps section divider
        if (raw == u and 10 < len(u) < 80 and
                re.match(r'^[A-Z ]+$', u) and not re.match(r'^\d', u)):
            return raw

    elif subjek in ('Seni', 'Muzik', 'BKD'):
        if (raw == u and len(u) > 10 and
                re.match(r'^[A-Z ]+$', u) and
                not re.match(r'^\d', u)):
            return raw

    return None

# ─── DETECT TAJUK ────────────────────────────────────────────────────────────
def get_tajuk(line, subjek):
    raw = line.strip()

    # X.0 format: "1.0 NOMBOR BULAT HINGGA 100"
    m = re.match(r'^(\d+)\.0\s+(.+)', raw)
    if m:
        return f"{m.group(1)}.0 {m.group(2).strip()}"

    # "TAJUK 1: NAME" or "TAJUK 1 NAME"
    m = re.match(r'^TAJUK\s+\d+\s*[:：]?\s*(.+)', raw, re.I)
    if m and m.group(1).strip():
        return m.group(1).strip()

    # "TAJUK: NAME" (Sains format, next line from keyword)
    m = re.match(r'^TAJUK\s*[:：]\s*(.+)', raw, re.I)
    if m and m.group(1).strip():
        return m.group(1).strip()

    # Sejarah BAB: "BAB 1: NAME"
    if subjek == 'Sejarah':
        m = re.match(r'^BAB\s+\d+\s*[:：]?\s*(.+)', raw, re.I)
        if m: return m.group(1).strip()

    return None

# ─── EXTRACT SK FROM LINE ─────────────────────────────────────────────────────
def get_sk(line, subjek):
    raw = line.strip()

    # Must match X.X pattern
    m = re.match(r'^(\d+\.\d+)\s+(.+)', raw)
    if not m:
        return None

    sk_num = m.group(1)
    sk_rest = m.group(2).strip()

    # Reject X.X.X (that's SP level)
    # sk_num like "1.1" is OK, "1.1.1" would have been caught if it started "1.1.1"
    # But sk_num="1.1" is fine. Check sk_num doesn't have 3 parts
    if sk_num.count('.') > 1:
        return None

    # Remove everything from first X.X.X onwards (SP contamination)
    sk_rest = re.split(r'\s+\d+\.\d+\.\d+', sk_rest)[0]

    # Remove trailing "Murid boleh:", TP level numbers, PAK21 noise
    sk_rest = re.sub(r'\s+Murid boleh:.*$', '', sk_rest, flags=re.I)
    sk_rest = re.sub(r'\s+\d+\s+PAK.*$', '', sk_rest)
    sk_rest = re.sub(r'\s+\d+\s*$', '', sk_rest)      # trailing lone digit
    sk_rest = re.sub(r'\s+Cadangan.*$', '', sk_rest, flags=re.I)

    sk_rest = sk_rest.strip().rstrip('.')

    # Must be meaningful
    if len(sk_rest) < 3:
        return None

    return f"{sk_num} {sk_rest}"

# ─── FLUSH / SAVE HELPERS ─────────────────────────────────────────────────────
def flush(results, tema, tajuk, sks):
    if tema and tajuk and sks:
        results.append({
            'tema':  tema,
            'tajuk': tajuk,
            'sk':    ' | '.join(sks)
        })
    elif tema and sks and not tajuk:
        # No tajuk detected — use first SK as tajuk label
        results.append({
            'tema':  tema,
            'tajuk': sks[0][:70] if sks else '',
            'sk':    ' | '.join(sks)
        })

# ─── MAIN PAGE PARSER ────────────────────────────────────────────────────────
def parse_pages(pdf_path, subjek, tahun, start_page_1based):
    results = []
    tema = ''
    tajuk = ''
    sks = []

    buf = PAGE_BUFFER_EXTRA.get(f"{subjek}-{tahun}", PAGE_BUFFER)
    p0 = max(0, start_page_1based - 1 - buf)

    # PI: PDF mungkin RTL (halaman bermula dari kanan)
    # Cuba kedua-dua arah: normal dan terbalik
    pi_rtl_mode = (subjek == 'PI')

    next_is_tema  = False  # Flag: baris seterusnya = tema
    next_is_tajuk = False  # Flag: baris seterusnya = tajuk

    try:
        with pdfplumber.open(pdf_path) as pdf:
            total = len(pdf.pages)

            # PI RTL: jika tiada data selepas cuba normal, cuba dari hujung
            page_range = range(p0, total)
            if pi_rtl_mode:
                # Cuba halaman dari kedua hujung serentak
                p0_rtl = max(0, total - start_page_1based - buf)
                page_range = list(range(p0, total)) + list(range(p0_rtl, total))
                page_range = sorted(set(page_range))

            for pnum in page_range:
                page  = pdf.pages[pnum]
                text  = page.extract_text() or ''
                lines = [l.strip() for l in text.split('\n')]

                for line in lines:
                    if not line:
                        continue

                    # ── Handle "next line = tema/tajuk" flags ──────────────
                    if next_is_tema:
                        next_is_tema = False
                        if line and not should_skip(line):
                            flush(results, tema, tajuk, sks)
                            tema = line.strip()
                            tajuk = ''
                            sks = []
                            continue

                    if next_is_tajuk:
                        next_is_tajuk = False
                        if line and not should_skip(line):
                            tj = get_tajuk(line, subjek) or line.strip()
                            flush(results, tema, tajuk, sks)
                            tajuk = tj
                            sks = []
                            continue

                    # ── Cari modul tersembunyi dalam header KSSR (BM/BI) ──
                    if re.match(r'^KSSR', line, re.I):
                        hidden = extract_tema_from_header(line, subjek)
                        if hidden:
                            flush(results, tema, tajuk, sks)
                            tema  = hidden
                            tajuk = ''
                            sks   = []
                        continue   # tetap skip baris header

                    if should_skip(line):
                        continue

                    # ── "TEMA" keyword alone → next line is tema ──────────
                    if re.match(r'^TEMA\s*$', line, re.I):
                        next_is_tema = True
                        continue

                    # ── "TAJUK:" keyword alone → next line is tajuk ───────
                    if re.match(r'^TAJUK\s*:?\s*$', line, re.I):
                        next_is_tajuk = True
                        continue

                    # ── "BIDANG PEMBELAJARAN:" alone → next line is tema ──
                    if re.match(r'^BIDANG PEMBELAJARAN\s*:?\s*$', line, re.I):
                        if subjek == 'Math':
                            next_is_tema = True
                        continue

                    # ── Try TEMA ──────────────────────────────────────────
                    t = get_tema(line, subjek)
                    if t:
                        flush(results, tema, tajuk, sks)
                        tema  = t
                        tajuk = ''
                        sks   = []
                        continue

                    # ── Try TAJUK ─────────────────────────────────────────
                    tj = get_tajuk(line, subjek)
                    if tj and tema:
                        flush(results, tema, tajuk, sks)
                        tajuk = tj
                        sks   = []
                        continue

                    # ── Try SK ────────────────────────────────────────────
                    sk = get_sk(line, subjek)
                    if sk:
                        # Fallback tema untuk subjek tanpa header tema eksplisit
                        if not tema:
                            if subjek == 'PI':    tema = 'Pendidikan Islam'
                            elif subjek == 'Moral': tema = 'Nilai Murni'
                            elif subjek == 'BM':  tema = 'Bahasa Melayu'
                            elif subjek == 'BI':  tema = 'English'
                        if tema and sk not in sks:
                            sks.append(sk)
                        continue

    except Exception as e:
        print(f"    ERROR: {e}", flush=True)

    # Save last entry
    flush(results, tema, tajuk, sks)

    # Deduplicate by (tema, tajuk)
    seen, unique = set(), []
    for r in results:
        key = (r['tema'][:50], r['tajuk'][:50])
        if key not in seen and r['tajuk']:
            seen.add(key)
            unique.append(r)

    return unique

# ─── MAIN ────────────────────────────────────────────────────────────────────
def map_subjek_from_path(fname):  # alias
    return map_subjek(fname)

def main():
    database, summary, missed = {}, {}, []

    print(f"\n{'='*60}")
    print("DSKP Extractor v4 — SmartSchoolHub")
    print(f"{'='*60}\n")

    if not os.path.exists(DSKP_ROOT):
        print(f"ERROR: Folder tidak jumpa:\n  {DSKP_ROOT}")
        return

    for folder in sorted(os.listdir(DSKP_ROOT)):
        fp = os.path.join(DSKP_ROOT, folder)
        if not os.path.isdir(fp): continue
        tahun = map_tahun(folder)
        if not tahun: continue
        print(f"\n── {folder} ──")

        for fname in sorted(os.listdir(fp)):
            if not fname.lower().endswith('.pdf'): continue
            subjek = map_subjek(fname)
            if not subjek:
                print(f"  [SKIP] {fname}")
                continue

            key   = f"{subjek}-{tahun}"
            sp    = PAGE_STARTS.get(key, 30)
            recs  = parse_pages(os.path.join(fp, fname), subjek, tahun, sp)

            status = f"{len(recs)} rekod" if recs else "⚠ TIADA"
            print(f"  [{key}] halaman ~{sp} → {status}", flush=True)

            if recs:
                database[key] = recs
                summary[key]  = len(recs)
            else:
                missed.append(key)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"OUTPUT: {OUTPUT_FILE}")
    print(f"\nRINGKASAN ({len(summary)} subjek-tahun):")
    for k in sorted(summary):
        flag = '✓' if summary[k] >= 5 else '⚠ SIKIT'
        print(f"  {k}: {summary[k]} rekod {flag}")
    print(f"\nJUMLAH: {sum(summary.values())} rekod")
    if missed:
        print(f"\nTIADA DATA: {', '.join(sorted(missed))}")
    print("\nDone! Kongsikan dskp_database.json kepada Claude.")

if __name__ == '__main__':
    main()
