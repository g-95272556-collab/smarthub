/**
 * SIMULASI PENUH: Login & Akses Modul untuk semua guru dalam DB
 * Meniru logik Worker & app.js dengan tepat
 */

// ── Data dari D1 (GURU sheet) ─────────────────────────
const GURU_DATA = [
  // row_index 0 = header, skip
  { idx: 1,  nama: "JIMMY PATRICK GANTOR",                      emel: "g-69272581@moe-dl.edu.my",   jawatan: "Guru Besar",                  kelas: "",          status: "Aktif" },
  { idx: 2,  nama: "JEMSAN BIN SAKUNDING",                      emel: "g-03272560@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "",          status: "Aktif" },
  { idx: 3,  nama: "ALOHA BINTI IBIN",                          emel: "g-80272554@moe-dl.edu.my",   jawatan: "Guru Pemulihan",               kelas: "3 KRISTAL", status: "Aktif" },
  { idx: 4,  nama: "AMRI IZZAD BIN TAHIR",                      emel: "g-87272555@moe-dl.edu.my",   jawatan: "Penolong Kanan Kokum",         kelas: "",          status: "Aktif" },
  { idx: 5,  nama: "ANDREW BIN JUSTINE",                        emel: "g-95272556@moe-dl.edu.my",   jawatan: "Penolong Kanan Pentadbiran",   kelas: "",          status: "Aktif" },
  { idx: 6,  nama: "BETTY BINTI JIM",                            emel: "g-34564753@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "4 MUTIARA", status: "Aktif" },
  { idx: 7,  nama: "OKTOVYANTI KOH",                            emel: "g-32510899@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "",          status: "Aktif" },
  { idx: 8,  nama: "STENLEY DOMINIC",                           emel: "g-09563222@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "6 BAIDURI", status: "Aktif" },
  { idx: 9,  nama: "MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF",   emel: "g-27568716@moe-dl.edu.my",   jawatan: "Guru Agama",                   kelas: "",          status: "Aktif" },
  { idx: 10, nama: "TAIMAH BINTI ILOK",                         emel: "g-56272514@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "2 INTAN",   status: "Aktif" },
  { idx: 11, nama: "JIDA MINSES",                               emel: "jidaminses@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "5 DELIMA",  status: "Aktif" },
  { idx: 12, nama: "FAZILAH BINTI ALI",                         emel: "g-36272623@moe-dl.edu.my",   jawatan: "Guru Akademik Biasa",          kelas: "1 NILAM",   status: "Aktif" },
  { idx: 13, nama: "JOHNABON SARINDOH",                         emel: "legfixwhy@send4.uk",          jawatan: "Pembantu Operasi",             kelas: "",          status: "Aktif" },
];

// ── Logik Worker ──────────────────────────────────────
const ALLOWED_DOMAINS = ["moe-dl.edu.my"];
const DEFAULT_ADMIN_EMAILS = [
  "g-69272581@moe-dl.edu.my",
  "g-95272556@moe-dl.edu.my",
  "g-03272560@moe-dl.edu.my",
  "g-87272555@moe-dl.edu.my",
];
const CONFIG_ADMIN_EMAILS = [
  "xba2238@moe.edu.my",
  "g-95272556@moe-dl.edu.my",
];
const ALL_ADMIN_EMAILS = [...new Set([...DEFAULT_ADMIN_EMAILS, ...CONFIG_ADMIN_EMAILS])].map(e => e.toLowerCase());

const ADMIN_ROLES_WORKER = ["guru besar", "penolong kanan hem", "penolong kanan kokurikulum", "penolong kanan kokum", "penolong kanan pentadbiran"];
const JAWATAN_PENTADBIR_FRONTEND = ['guru besar','penolong kanan pentadbiran','penolong kanan hem','penolong kanan kokurikulum','penolong kanan kokum'];
const STUDENT_CLASSES = ["1 NILAM","2 INTAN","3 KRISTAL","4 MUTIARA","5 DELIMA","6 BAIDURI"];
const MODUL_TEKNIKAL_RESTRICTED = ['data-guru','data-murid'];
const MODUL_PENGURUSAN_RESTRICTED = ['konfigurasi','notifikasi','hari-lahir'];

function normalizeText(v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, ' '); }

function isAllowedDomain(email) {
  const domain = String(email || '').trim().toLowerCase().split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
}

function isAdminByEmail(email) {
  return ALL_ADMIN_EMAILS.includes(email.toLowerCase());
}

function isAdminByJawatan_Worker(jawatan) {
  return ADMIN_ROLES_WORKER.includes(normalizeText(jawatan));
}

function isJawatanPentadbir_Frontend(jawatan) {
  const j = normalizeText(jawatan);
  return JAWATAN_PENTADBIR_FRONTEND.some(p => j.includes(p));
}

// ── SIMULASI ──────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
console.log('║            SIMULASI PENUH: LOGIN & AKSES MODUL — SEMUA GURU                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════════╝\n');

const issues = [];

for (const guru of GURU_DATA) {
  const email = guru.emel.toLowerCase();
  const jawatan = guru.jawatan;
  const kelas = guru.kelas;

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📌 #${guru.idx} ${guru.nama}`);
  console.log(`   Emel: ${email} | Jawatan: ${jawatan} | Kelas: ${kelas || '(tiada)'}`);
  console.log(`${'─'.repeat(80)}`);

  // ── LANGKAH 1: Semakan Domain ────────────────────
  let domainOk = isAllowedDomain(email);
  const isRegisteredInDB = GURU_DATA.some(g => g.emel.toLowerCase() === email);
  if (!domainOk && isRegisteredInDB) {
    console.log(`  [B3] Domain check: ⚠️ BUKAN DOMAIN UTAMA, tetapi dibenarkan kerana berdaftar dalam DB GURU!`);
    domainOk = true;
  } else {
    console.log(`  [B3] Domain check: ${domainOk ? '✅ LULUS' : '❌ GAGAL'} (${email.split('@')[1]})`);
  }
  if (!domainOk) {
    console.log(`  ⛔ LOGIN DITOLAK — "Akaun Google di luar domain sekolah tidak dibenarkan."`);
    issues.push({
      guru: guru.nama,
      masalah: `Domain @${email.split('@')[1]} TIDAK dibenarkan — hanya @moe-dl.edu.my`,
      kesan: 'TIDAK BOLEH LOGIN langsung',
      cadangan: `Tukar emel kepada @moe-dl.edu.my`
    });
    continue;
  }

  // ── LANGKAH 2: Cari dalam DB GURU ────────────────
  const foundInDB = true; // Already iterating from DB
  console.log(`  [B4] findGuruByIdentity: ✅ Dijumpai dalam DB GURU (row ${guru.idx})`);

  // ── LANGKAH 3: Semakan Admin (Worker) ────────────
  const adminByEmail = isAdminByEmail(email);
  const adminByJawatan_W = isAdminByJawatan_Worker(jawatan);
  const isSystemAdmin = adminByEmail || adminByJawatan_W;
  console.log(`  [B4] isSystemAdminActor:`);
  console.log(`       - Emel dalam senarai admin: ${adminByEmail ? '✅ YA' : '— tidak'}`);
  console.log(`       - Jawatan "${normalizeText(jawatan)}" dalam ADMIN_ROLES: ${adminByJawatan_W ? '✅ YA' : '— tidak'}`);
  console.log(`       → Admin (Worker): ${isSystemAdmin ? '✅ YA' : '— TIDAK (teacher)'}`);

  // ── LANGKAH 4: Peranan dikembalikan ──────────────
  const roleReturned = isSystemAdmin ? 'admin' : 'teacher';
  console.log(`  [B4] buildVerifiedSessionActor → role: "${roleReturned}", jawatan: "${jawatan}"`);

  // ── LANGKAH 5: Frontend isPentadbir ──────────────
  const adminByFrontendRole = roleReturned === 'admin';
  const adminByFrontendJawatan = isJawatanPentadbir_Frontend(jawatan);
  const isPentadbir = adminByFrontendRole || adminByEmail || adminByFrontendJawatan;
  console.log(`  [F3] isPentadbir():`);
  console.log(`       - role='admin': ${adminByFrontendRole ? '✅' : '—'}`);
  console.log(`       - emel admin: ${adminByEmail ? '✅' : '—'}`);
  console.log(`       - jawatan pentadbir (frontend): ${adminByFrontendJawatan ? '✅' : '—'}`);
  console.log(`       → Pentadbir: ${isPentadbir ? '✅ YA' : '— TIDAK (guru biasa)'}`);

  // ── LANGKAH 5b: Frontend isPengurusanSekolah ─────
  const roleText = normalizeText(roleReturned + ' ' + jawatan);
  const isPengurusanSekolah = roleText.includes('guru besar') || roleText.includes('penolong kanan');
  console.log(`  [F3] isPengurusanSekolah(): ${isPengurusanSekolah ? '✅ YA' : '— TIDAK'}`);

  // ── LANGKAH 6: Akses Modul ──────────────────────
  console.log(`  [F5] Akses Modul:`);
  const modulSemua = [
    'dashboard', 'kehadiran-guru', 'kehadiran-murid', 'laporan-bertugas',
    'takwim', 'kokum', 'surat-rasmi', 'ai-pembantu',
    'data-guru', 'data-murid',
    'konfigurasi', 'notifikasi', 'hari-lahir',
    'amaran-kehadiran'
  ];

  for (const mod of modulSemua) {
    let canAccess = true;
    let reason = 'terbuka';
    if (MODUL_TEKNIKAL_RESTRICTED.includes(mod)) {
      canAccess = isPentadbir;
      reason = canAccess ? 'pentadbir' : '⛔ MODUL_TEKNIKAL — pentadbir sahaja';
    } else if (MODUL_PENGURUSAN_RESTRICTED.includes(mod)) {
      canAccess = isPentadbir || isPengurusanSekolah;
      reason = canAccess ? 'pentadbir/pengurusan' : '⛔ MODUL_PENGURUSAN — pentadbir sahaja';
    }
    const icon = canAccess ? '✅' : '❌';
    console.log(`       ${icon} ${mod.padEnd(22)} ${reason}`);
  }

  // ── LANGKAH 7: Isu khas ─────────────────────────
  // Jawatan "Penolong Kanan Kokum" vs ADMIN_ROLES "penolong kanan kokurikulum"
  if (normalizeText(jawatan) === 'penolong kanan kokum') {
    const matchWorker = ADMIN_ROLES_WORKER.includes('penolong kanan kokum');
    if (!matchWorker) {
      console.log(`\n  ⚠️  ISU: Jawatan "Penolong Kanan Kokum" ≠ ADMIN_ROLES "penolong kanan kokurikulum"`);
      console.log(`     → Worker: isTeacherAllowedAllClasses = FALSE — TIDAK layak akses semua kelas`);
      const matchFrontend = JAWATAN_PENTADBIR_FRONTEND.some(p => normalizeText(jawatan).includes(p));
      console.log(`     → Frontend: isJawatanPentadbir = ${matchFrontend ? 'TRUE (match "penolong kanan kokum")' : 'FALSE'}`);
      if (!matchWorker) {
        issues.push({
          guru: guru.nama,
          masalah: `Jawatan "Penolong Kanan Kokum" TIDAK sepadan dengan ADMIN_ROLES Worker ["penolong kanan kokurikulum"]`,
          kesan: 'Worker menganggap BUKAN admin untuk akses kelas — tetapi frontend anggap pentadbir',
          cadangan: `Tukar jawatan dalam DB kepada "Penolong Kanan Kokurikulum" ATAU tambah "penolong kanan kokum" dalam ADMIN_ROLES Worker`
        });
      }
    }
  }

  // Guru tanpa kelas
  if (!kelas && !isSystemAdmin && !adminByJawatan_W) {
    issues.push({
      guru: guru.nama,
      masalah: `Jawatan "${jawatan}" tanpa kelas — bukan pentadbir/admin`,
      kesan: 'Boleh login, tapi TIDAK boleh akses kehadiran murid kelas tertentu (NO_ASSIGNED_CLASS)',
      cadangan: 'Tetapkan guru kelas atau ubah jawatan kepada yang sesuai'
    });
  }
}

// ── RINGKASAN ISU ─────────────────────────────────────
console.log(`\n\n${'═'.repeat(80)}`);
console.log('📋 RINGKASAN ISU YANG DIKESAN');
console.log(`${'═'.repeat(80)}\n`);

if (!issues.length) {
  console.log('✅ Tiada isu dikesan — semua guru boleh login dan akses modul dengan betul.');
} else {
  issues.forEach((isu, i) => {
    console.log(`❌ ISU #${i+1}: ${isu.guru}`);
    console.log(`   Masalah:   ${isu.masalah}`);
    console.log(`   Kesan:     ${isu.kesan}`);
    console.log(`   Cadangan:  ${isu.cadangan}\n`);
  });
}
