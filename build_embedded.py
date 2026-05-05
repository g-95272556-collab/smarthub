"""
build_embedded.py - Finalisasi DSKP Database untuk SmartSchoolHub
1. Baca dskp_database.json
2. Tambah PI hardcode (semua tahun)
3. Cuba ekstrak BI-6 dan RBT-6 yang tertinggal
4. Output: dskp_embedded.js (var LK_DSKP_EMBEDDED = {...})
Jalankan: python build_embedded.py
"""
import os, re, json, sys

try:
    import pdfplumber
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber

BASE = os.path.dirname(os.path.abspath(__file__))
JSON_IN  = os.path.join(BASE, "dskp_database.json")
JS_OUT   = os.path.join(BASE, "dskp_embedded.js")
DSKP_ROOT = r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR"

# ─── PI HARDCODE (DSKP KSSR Semakan 2017) ────────────────────────────────────
PI_DATA = {
  "PI-1": [
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.1 Membaca al-Quran","sk":"Membaca surah-surah pilihan dengan betul dari segi makhraj dan sifat huruf"},
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.2 Hafazan","sk":"Menghafaz surah al-Fatihah, al-Ikhlas, al-Falaq, an-Nas dan al-Kafirun"},
    {"tema":"Ulum Al-Quran","tajuk":"2.1 Pengenalan al-Quran","sk":"Mengenal al-Quran sebagai kitab suci umat Islam"},
    {"tema":"Ulum Al-Quran","tajuk":"2.2 Huruf Hijaiyah","sk":"Mengenal dan menyebut huruf Hijaiyah dengan betul"},
    {"tema":"Aqidah","tajuk":"3.1 Rukun Iman","sk":"Menyatakan Rukun Iman yang enam dengan betul"},
    {"tema":"Aqidah","tajuk":"3.2 Mengenal Allah S.W.T.","sk":"Menyatakan sifat-sifat wajib Allah S.W.T."},
    {"tema":"Ibadah","tajuk":"4.1 Bersuci","sk":"Mengetahui cara bersuci daripada hadas kecil dan hadas besar"},
    {"tema":"Ibadah","tajuk":"4.2 Solat","sk":"Mengetahui cara mendirikan solat fardu dengan betul"},
    {"tema":"Ibadah","tajuk":"4.3 Rukun Islam","sk":"Menyatakan Rukun Islam yang lima dengan betul"},
    {"tema":"Sirah Rasulullah S.A.W.","tajuk":"5.1 Kelahiran Rasulullah","sk":"Menceritakan kelahiran Rasulullah S.A.W. dan keluarga baginda"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.1 Adab terhadap Allah","sk":"Mengamalkan adab terhadap Allah S.W.T."},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.2 Adab terhadap ibu bapa dan guru","sk":"Mengamalkan adab terhadap ibu bapa, guru dan orang yang lebih tua"},
    {"tema":"Jawi","tajuk":"7.1 Huruf Jawi","sk":"Mengenal dan menulis huruf Jawi dengan betul"},
  ],
  "PI-2": [
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.1 Membaca al-Quran","sk":"Membaca surah pilihan dengan makhraj dan sifat huruf yang betul"},
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.2 Hafazan","sk":"Menghafaz surah al-Asr, al-Fil, Quraish, al-Maun dan al-Kauthar"},
    {"tema":"Ulum Al-Quran","tajuk":"2.1 Ilmu Tajwid Asas","sk":"Mengenal hukum Nun Sakinah dan Tanwin"},
    {"tema":"Aqidah","tajuk":"3.1 Sifat-sifat Allah","sk":"Menyatakan dan menghuraikan sifat Wajib, Mustahil dan Harus bagi Allah"},
    {"tema":"Aqidah","tajuk":"3.2 Malaikat Allah","sk":"Menyatakan nama-nama malaikat dan tugasnya"},
    {"tema":"Ibadah","tajuk":"4.1 Solat Fardu","sk":"Mempraktikkan cara solat fardu dengan betul termasuk syarat sah"},
    {"tema":"Ibadah","tajuk":"4.2 Puasa","sk":"Mengetahui syarat dan rukun puasa Ramadan"},
    {"tema":"Sirah Rasulullah S.A.W.","tajuk":"5.1 Kerasulan Muhammad","sk":"Menceritakan pengisytiharan kerasulan Nabi Muhammad S.A.W."},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.1 Sifat Mahmudah","sk":"Mengamalkan sifat-sifat mahmudah: jujur, amanah, sabar"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.2 Adab harian","sk":"Mengamalkan adab dalam kehidupan harian berlandaskan ajaran Islam"},
    {"tema":"Jawi","tajuk":"7.1 Membaca dan menulis Jawi","sk":"Membaca dan menulis perkataan serta ayat mudah dalam tulisan Jawi"},
  ],
  "PI-3": [
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.1 Bacaan bertajwid","sk":"Membaca al-Quran dengan hukum tajwid yang betul"},
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.2 Hafazan","sk":"Menghafaz surah al-Bayyinah, al-Qadr, al-Alaq, at-Tin dan as-Syarh"},
    {"tema":"Ulum Al-Quran","tajuk":"2.1 Hukum Mim Sakinah","sk":"Mengenal dan menerapkan hukum Mim Sakinah dalam bacaan"},
    {"tema":"Aqidah","tajuk":"3.1 Kitab-kitab Allah","sk":"Menyatakan nama kitab-kitab Allah dan penerimanya"},
    {"tema":"Aqidah","tajuk":"3.2 Nabi dan Rasul","sk":"Menyatakan nama-nama Nabi dan Rasul yang wajib diketahui"},
    {"tema":"Ibadah","tajuk":"4.1 Zakat","sk":"Mengetahui jenis-jenis zakat dan syarat wajib zakat"},
    {"tema":"Ibadah","tajuk":"4.2 Solat sunat","sk":"Mengetahui jenis-jenis solat sunat dan cara pelaksanaannya"},
    {"tema":"Sirah Rasulullah S.A.W.","tajuk":"5.1 Perjuangan awal Islam","sk":"Menceritakan perjuangan awal Islam di Makkah"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.1 Sifat Mazmumah","sk":"Mengenal sifat-sifat mazmumah dan cara menghindarinya"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.2 Tolong-menolong","sk":"Mengamalkan nilai tolong-menolong dalam kehidupan"},
    {"tema":"Jawi","tajuk":"7.1 Teks Jawi","sk":"Membaca dan menulis teks pendek dalam tulisan Jawi"},
  ],
  "PI-4": [
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.1 Bacaan bertajwid","sk":"Membaca al-Quran dengan hukum Mad Asli dan Mad Far'i"},
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.2 Hafazan","sk":"Menghafaz surah adh-Dhuha, al-Lail, as-Syams, al-Balad dan al-Fajr"},
    {"tema":"Ulum Al-Quran","tajuk":"2.1 Hukum Mad","sk":"Mengenal dan menerapkan hukum Mad dalam bacaan al-Quran"},
    {"tema":"Aqidah","tajuk":"3.1 Hari Akhirat","sk":"Menyatakan perkara-perkara yang berlaku pada Hari Akhirat"},
    {"tema":"Aqidah","tajuk":"3.2 Qada dan Qadar","sk":"Memahami konsep Qada dan Qadar Allah S.W.T."},
    {"tema":"Ibadah","tajuk":"4.1 Haji dan Umrah","sk":"Mengetahui rukun, wajib dan syarat haji serta umrah"},
    {"tema":"Ibadah","tajuk":"4.2 Makanan dan Minuman","sk":"Mengetahui hukum makanan dan minuman dalam Islam"},
    {"tema":"Sirah Rasulullah S.A.W.","tajuk":"5.1 Hijrah ke Madinah","sk":"Menceritakan peristiwa hijrah Rasulullah S.A.W. ke Madinah"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.1 Adab bermasyarakat","sk":"Mengamalkan adab bermasyarakat mengikut ajaran Islam"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.2 Tanggungjawab terhadap alam","sk":"Mengamalkan tanggungjawab menjaga alam sekitar sebagai khalifah"},
    {"tema":"Jawi","tajuk":"7.1 Karangan Jawi","sk":"Menulis karangan pendek dalam tulisan Jawi dengan betul"},
  ],
  "PI-5": [
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.1 Bacaan bertajwid","sk":"Membaca al-Quran dengan hukum Waqaf dan Ibtida' yang betul"},
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.2 Hafazan","sk":"Menghafaz surah al-Ghasyiyah, al-Ala, at-Tariq, al-Buruj dan al-Insyiqaq"},
    {"tema":"Ulum Al-Quran","tajuk":"2.1 Waqaf dan Ibtida'","sk":"Mengenal tanda-tanda Waqaf dan mengaplikasikannya dalam bacaan"},
    {"tema":"Aqidah","tajuk":"3.1 Iman kepada Rasul","sk":"Menghuraikan sifat-sifat Rasul dan mukjizat mereka"},
    {"tema":"Aqidah","tajuk":"3.2 Iman kepada Kitab","sk":"Menghuraikan kitab-kitab suci Allah dan kandungannya"},
    {"tema":"Ibadah","tajuk":"4.1 Munakahat","sk":"Mengetahui asas-asas perkahwinan dalam Islam"},
    {"tema":"Ibadah","tajuk":"4.2 Amalan sunat harian","sk":"Mengamalkan amalan-amalan sunat harian dalam kehidupan"},
    {"tema":"Sirah Rasulullah S.A.W.","tajuk":"5.1 Pembinaan masyarakat Islam","sk":"Menceritakan usaha Rasulullah S.A.W. membina masyarakat Islam di Madinah"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.1 Adab dalam pelajaran","sk":"Mengamalkan adab menuntut ilmu dalam kehidupan"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.2 Sifat sabar dan syukur","sk":"Mengamalkan sifat sabar dan syukur dalam kehidupan harian"},
    {"tema":"Jawi","tajuk":"7.1 Petikan Jawi","sk":"Membaca dan memahami petikan teks Jawi"},
  ],
  "PI-6": [
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.1 Bacaan bertajwid","sk":"Membaca al-Quran dengan lancar dan bertajwid"},
    {"tema":"Tilawah Al-Quran dan Hafazan","tajuk":"1.2 Hafazan","sk":"Menghafaz surah al-Mutaffifin, al-Infitar, at-Takwir dan Abasa"},
    {"tema":"Ulum Al-Quran","tajuk":"2.1 Sebab Nuzul","sk":"Mengetahui sebab-sebab penurunan ayat-ayat al-Quran"},
    {"tema":"Aqidah","tajuk":"3.1 Iman kepada Hari Akhirat","sk":"Menghuraikan perkara-perkara yang berlaku sebelum dan selepas Hari Kiamat"},
    {"tema":"Aqidah","tajuk":"3.2 Iman kepada Qada dan Qadar","sk":"Menghuraikan hikmah beriman kepada Qada dan Qadar Allah"},
    {"tema":"Ibadah","tajuk":"4.1 Ibadah Korban","sk":"Mengetahui hukum, syarat dan cara pelaksanaan ibadah korban"},
    {"tema":"Ibadah","tajuk":"4.2 Pengurusan Jenazah","sk":"Mengetahui fardu kifayah dalam pengurusan jenazah"},
    {"tema":"Sirah Rasulullah S.A.W.","tajuk":"5.1 Kejayaan Islam","sk":"Menceritakan kejayaan dan sumbangan tamadun Islam kepada dunia"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.1 Akhlak mulia","sk":"Mengamalkan akhlak mulia sebagai warganegara yang bertanggungjawab"},
    {"tema":"Adab dan Akhlak Islamiah","tajuk":"6.2 Adab siber","sk":"Mengamalkan adab penggunaan media sosial mengikut perspektif Islam"},
    {"tema":"Jawi","tajuk":"7.1 Penulisan Jawi","sk":"Menulis esei pendek dalam tulisan Jawi dengan bahasa yang betul"},
  ],
}

# ─── EXTRAK BI-6 dan RBT-6 yang tertinggal ───────────────────────────────────
MISSING_FILES = {
    "BI-6": {
        "path": r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 6\1.-DSKP-KSSR-Semakan-2017-Bahasa-Inggeris-Tahun-6-SJK_ISBN.pdf",
        "start": 36, "subjek": "BI"
    },
    "RBT-6": {
        "path": r"C:\Users\SK KIANDONGO PDT2\Downloads\Documents\DSKP KSSR\Tahun 6\DSKP KSSR (Semakan 2017) Reka Bentuk dan Teknologi Tahun 6.pdf",
        "start": 31, "subjek": "RBT"
    },
}

def quick_extract(pdf_path, start_page, subjek):
    """Extract SK dari PDF dengan pendekatan teks mudah."""
    results = []
    tema = ""
    tajuk = ""
    sks = []

    BI_SKILLS  = ['LISTENING AND SPEAKING','READING','WRITING','LANGUAGE ARTS']
    RBT_TEMAS  = ['REKA BENTUK DAN PENGHASILAN PROJEK','TEKNOLOGI',
                  'PERTANIAN DAN BIOTEKNOLOGI','KEUSAHAWANAN',
                  'REKA BENTUK','BINAAN','TEKNOLOGI PERTANIAN']

    try:
        with pdfplumber.open(pdf_path) as pdf:
            total = len(pdf.pages)
            p0 = max(0, start_page - 1 - 4)

            for pnum in range(p0, total):
                text = pdf.pages[pnum].extract_text() or ''
                for line in text.split('\n'):
                    line = line.strip()
                    if not line or len(line) < 3: continue
                    u = line.upper()

                    # Skip noise
                    if re.match(r'^(KSSR|STANDARD KANDUNGAN|STANDARD PEMBELAJARAN|STANDARD PRESTASI|CATATAN|TAHAP)', u): continue
                    if re.match(r'^[1-6]\s+[A-Z]', line) and not re.match(r'^\d+\.\d+', line): continue

                    # TEMA
                    if subjek == 'BI':
                        for s in BI_SKILLS:
                            if s in u:
                                if tajuk and sks: results.append({'tema':tema,'tajuk':tajuk,'sk':' | '.join(sks)})
                                tema = s; tajuk = ''; sks = []; break
                    elif subjek == 'RBT':
                        for t in RBT_TEMAS:
                            if u == t:
                                if tajuk and sks: results.append({'tema':tema,'tajuk':tajuk,'sk':' | '.join(sks)})
                                tema = t; tajuk = ''; sks = []; break
                        m = re.match(r'^(BAHAGIAN|BIDANG|TEMA)\s+\d+\s*[:：]?\s*(.+)', line, re.I)
                        if m:
                            if tajuk and sks: results.append({'tema':tema,'tajuk':tajuk,'sk':' | '.join(sks)})
                            tema = m.group(2).strip(); tajuk = ''; sks = []; continue

                    # TAJUK (X.0 format)
                    m = re.match(r'^(\d+)\.0\s+(.+)', line)
                    if m and tema:
                        if tajuk and sks: results.append({'tema':tema,'tajuk':tajuk,'sk':' | '.join(sks)})
                        tajuk = f"{m.group(1)}.0 {m.group(2).strip()}"; sks = []; continue

                    # SK (X.X format, not X.X.X)
                    m = re.match(r'^(\d+\.\d+)\s+(.+)', line)
                    if m and m.group(1).count('.') == 1 and tema:
                        sk_text = re.split(r'\s+\d+\.\d+\.\d+', m.group(2))[0].strip()
                        if len(sk_text) > 5 and sk_text not in sks:
                            sks.append(f"{m.group(1)} {sk_text}")

            if tajuk and tema and sks:
                results.append({'tema':tema,'tajuk':tajuk,'sk':' | '.join(sks)})

    except Exception as e:
        print(f"  ERROR {subjek}: {e}")

    # Dedup
    seen, unique = set(), []
    for r in results:
        k = (r['tema'][:40], r['tajuk'][:40])
        if k not in seen: seen.add(k); unique.append(r)
    return unique

# ─── MAIN ────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "="*55)
    print("Build DSKP Embedded Database")
    print("="*55)

    # Load JSON
    if not os.path.exists(JSON_IN):
        print(f"ERROR: {JSON_IN} tidak jumpa.")
        return
    with open(JSON_IN, 'r', encoding='utf-8') as f:
        db = json.load(f)
    print(f"JSON dimuatkan: {len(db)} kunci")

    # Add PI hardcode
    for key, records in PI_DATA.items():
        db[key] = records
        print(f"  PI tambah: {key} ({len(records)} rekod)")

    # Extract missing BI-6 and RBT-6
    for key, info in MISSING_FILES.items():
        if key in db and len(db[key]) >= 5:
            print(f"  {key} sudah ada ({len(db[key])} rekod), skip.")
            continue
        if not os.path.exists(info['path']):
            print(f"  {key}: fail tidak jumpa, skip.")
            continue
        print(f"  Mengekstrak {key}...")
        recs = quick_extract(info['path'], info['start'], info['subjek'])
        if recs:
            db[key] = recs
            print(f"    → {len(recs)} rekod")
        else:
            print(f"    ⚠ Tiada data untuk {key}")

    # Build JS output
    total = sum(len(v) for v in db.values())
    print(f"\nJumlah rekod: {total} daripada {len(db)} kunci")

    js_lines = [
        '// DSKP KSSR Embedded Database - SmartSchoolHub',
        f'// {len(db)} subject-year keys, {total} records',
        '// Auto-generated - do not edit manually',
        'var LK_DSKP_EMBEDDED = ' + json.dumps(db, ensure_ascii=False, separators=(',',':')) + ';'
    ]

    with open(JS_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_lines))

    print(f"\nOutput: {JS_OUT}")
    print("\nRingkasan akhir:")
    for k in sorted(db.keys()):
        flag = '✓' if len(db[k]) >= 5 else '⚠'
        print(f"  {flag} {k}: {len(db[k])} rekod")
    print("\nDone! Kongsikan dskp_embedded.js kepada Claude.")

if __name__ == '__main__':
    main()
