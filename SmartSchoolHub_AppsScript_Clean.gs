// ============================================================
// SMART SCHOOL HUB v2.0
// Clean Google Apps Script backend
// Fokus: setup baru dari kosong untuk dashboard & kehadiran
// ============================================================

const SCHOOL = {
  lat: 5.3055655,
  lng: 116.9633906,
  radius: 200
};

const SPREADSHEET_ID = "1NizJvSD9tL9XjX1PnqtFlVUUVKnGpnLGQjraGKos6Vk";

const SHEETS = {
  GURU: "GURU",
  MURID: "MURID",
  KEHADIRAN_GURU: "KEHADIRAN_GURU",
  KEHADIRAN_MURID: "KEHADIRAN_MURID",
  LAPORAN_BERTUGAS: "LAPORAN_BERTUGAS",
  BIRTHDAY_LOG: "BIRTHDAY_LOG",
  HARILAHIR: "HARILAHIR",
  CONFIG: "CONFIG"
};

const HEADERS = {
  GURU: ["Nama","Emel","Jawatan","Kelas","Telefon","Status","WhatsApp","Tarikh Lahir","Catatan","Dikemaskini","Oleh"],
  MURID: ["Nama","Kelas","Jantina","Tarikh Lahir","Telefon Wali","Nama Wali","No. IC","Status","Catatan","Dikemaskini","Oleh"],
  KEHADIRAN_GURU: ["ID","TARIKH","EMAIL_GURU","NAMA_GURU","MASA_DAFTAR","STATUS","LATITUD","LONGITUD","JARAK_METER","DALAM_GEOFENCE","MOCK_LOCATION","DEVELOPER_MODE","ACCURACY_GPS","GPS_SPOOFING_FLAG","JENIS_CUTI","CATATAN","IP_ADDRESS","USER_AGENT"],
  KEHADIRAN_MURID: ["ID","TARIKH","KELAS","NAMA_MURID","JANTINA","STATUS","TELEFON_WALI","GURU_EMAIL","GURU_NAMA","CATATAN","DIKEMASKINI","OLEH"],
  LAPORAN_BERTUGAS: ["Minggu","Guru Bertugas","Jawatan","Aktiviti Isnin","Aktiviti Selasa","Aktiviti Rabu","Aktiviti Khamis","Aktiviti Jumaat","% Kehadiran","RMT Penerima","RMT Catatan","Disiplin Kes","Disiplin Jenis","Disiplin Butiran","Kebersihan","Catatan Kebersihan","Kelas Terbersih","Catatan Anugerah","Rumusan AI","Dikemaskini","Oleh"],
  BIRTHDAY_LOG: ["Masa","Jenis","Penerima","Status","Mesej"],
  HARILAHIR: ["Nama","Peranan","Kelas","Tarikh Lahir","Telefon"],
  CONFIG: ["Kunci","Nilai"]
};

// Cache untuk data statik
const CACHE_DURATION = 600; // 10 minit dalam saat
const cache = CacheService.getScriptCache();

function getCachedSheetData(sheetKey) {
  const cacheKey = 'sheet_' + sheetKey;
  let data = cache.get(cacheKey);
  if (data) {
    return JSON.parse(data);
  }
  const rows = readSheetRows(sheetKey);
  cache.put(cacheKey, JSON.stringify(rows), CACHE_DURATION);
  return rows;
}

function doGet() {
  return ContentService
    .createTextOutput("Smart School Hub backend OK")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (data.action === "ping") return jsonResponse(pingPayload());

    if (!hasConfigSecret()) {
      return handleBootstrapAction(data);
    }

    if (!verifyToken(data.token)) {
      return jsonResponse({ success: false, error: "Token tidak sah" }, 401);
    }

    switch (data.action) {
      case "getConfig":
        return jsonResponse({ success: true, config: getConfig() });
      case "setConfig":
        setConfig(data.config || {});
        return jsonResponse({ success: true });
      case "setupAllSheets":
        return setupAllSheets();
      case "readSheet":
        return jsonResponse({ success: true, rows: readSheetRows(data.sheetKey) });
      case "appendRow":
        appendRow(data.sheetKey, data.row || []);
        return jsonResponse({ success: true });
      case "appendRows":
        appendRows(data.sheetKey, data.rows || []);
        return jsonResponse({ success: true });
      case "replaceSheet":
        replaceSheet(data.sheetKey, data.rows || []);
        return jsonResponse({ success: true });
      default:
        return jsonResponse({ success: false, error: "Aksi tidak sah" }, 400);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) }, 500);
  }
}

function handleBootstrapAction(data) {
  switch (data.action) {
    case "setupAllSheets":
      return setupAllSheets();
    case "getConfig":
      return jsonResponse({ success: true, config: getConfig() });
    case "setConfig":
      setConfig(data.config || {});
      return jsonResponse({ success: true });
    case "readSheet":
      return jsonResponse({ success: true, rows: readSheetRows(data.sheetKey) });
    default:
      return jsonResponse({
        success: false,
        error: "Bootstrap hanya benarkan setupAllSheets, getConfig, setConfig, readSheet, ping"
      }, 403);
  }
}

function pingPayload() {
  const cfg = getConfig();
  const ss = getSpreadsheet_();
  return {
    success: true,
    service: "apps-script",
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    hasWorkerSecret: Boolean(cfg.WORKER_SECRET || cfg.WORKER_TOKEN),
    timestamp: new Date().toISOString()
  };
}

function setupAllSheets() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function(key) {
    const sheet = getOrCreateSheet_(SHEETS[key]);
    const header = HEADERS[key];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    } else {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }
    styleHeader_(sheet, header.length);
    autosize_(sheet, header.length);
  });

  const defaults = [
    ["WORKER_SECRET", ""],
    ["ADMIN_EMAIL", ""],
    ["SCHOOL_LAT", SCHOOL.lat],
    ["SCHOOL_LNG", SCHOOL.lng],
    ["SCHOOL_RADIUS", SCHOOL.radius],
    ["FONNTE_TOKEN", ""],
    ["FONNTE_GROUP", ""],
    ["TELEGRAM_BOT", ""],
    ["TELEGRAM_CHAT", ""],
    ["TELEGRAM_TOPIC", ""],
    ["DEEPSEEK_API_KEY", ""],
    ["ATTENDANCE_GURU_NOTIF_ENABLED", "true"],
    ["ATTENDANCE_GURU_REMINDER_TIME", "07:45"],
    ["ATTENDANCE_MURID_NOTIF_ENABLED", "true"],
    ["ATTENDANCE_MURID_CUTOFF_TIME", "09:00"],
    ["ATTENDANCE_MURID_NOTIFY_GUARDIAN", "true"],
    ["ATTENDANCE_MURID_NOTIFY_CLASS_GROUP", "true"],
    ["ATTENDANCE_MURID_NOTIFY_TELEGRAM", "true"],
    ["ATTENDANCE_GURU_ADMIN_TEMPLATE", "Peringatan Kehadiran Guru\n\nGuru berikut belum mendaftar kehadiran pada {TARIKH}:\n\n{SENARAI}\n\nSila daftar segera.\n\n_{SEKOLAH}_"],
    ["ATTENDANCE_GURU_PERSONAL_TEMPLATE", "Peringatan\n\nCikgu {NAMA}, anda belum mendaftar kehadiran hari ini ({TARIKH}). Sila daftar segera.\n\n_{SEKOLAH}_"],
    ["ATTENDANCE_MURID_GUARDIAN_TEMPLATE", "Makluman Kehadiran\n\nSelamat sejahtera,\n\nAnak jagaan tuan/puan, {NAMA} dari kelas {KELAS}, direkodkan {STATUS} pada {TARIKH}.\n\nSila hubungi pihak sekolah jika ada pertanyaan.\n\n_{SEKOLAH}_"],
    ["ATTENDANCE_MURID_SUMMARY_TEMPLATE", "Makluman Kehadiran Murid\n\nTarikh: {TARIKH}\nKelas: {KELAS}\nBilangan: {BILANGAN}\n\n{SENARAI}\n\n_{SEKOLAH}_"],
    ["ATTENDANCE_MURID_CLASS_GROUP_TEMPLATE", "Makluman Kehadiran - {KELAS}\n\nMurid tidak hadir pada {TARIKH}:\n\n{SENARAI}\n\n_{SEKOLAH}_"],
    ["ATTENDANCE_NOTIF_NOTE", ""]
  ];
  ensureConfigDefaults_(defaults);
  return jsonResponse({ success: true, message: "Sheets dan CONFIG siap." });
}

function getConfig() {
  const sheet = getOrCreateSheet_(SHEETS.CONFIG);
  if (sheet.getLastRow() < 2) return {};
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
  const out = {};
  rows.forEach(function(row) {
    const key = String(row[0] || "").trim();
    if (key) out[key] = row[1];
  });
  return out;
}

function setConfig(configObj) {
  const sheet = getOrCreateSheet_(SHEETS.CONFIG);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.CONFIG.length).setValues([HEADERS.CONFIG]);
    styleHeader_(sheet, HEADERS.CONFIG.length);
  }

  const existing = sheet.getLastRow() >= 2
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues()
    : [];
  const rowMap = {};
  existing.forEach(function(row, i) {
    if (row[0]) rowMap[String(row[0]).trim()] = i + 2;
  });

  Object.keys(configObj || {}).forEach(function(key) {
    const value = configObj[key];
    if (rowMap[key]) {
      sheet.getRange(rowMap[key], 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  });
}

function readSheetRows(sheetKey) {
  const sheet = getOrCreateSheet_(resolveSheetName_(sheetKey));
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) return [];
  return sheet.getDataRange().getDisplayValues();
}

function appendRow(sheetKey, rowValues) {
  const resolvedKey = resolveSheetName_(sheetKey);
  const sheet = getOrCreateSheet_(resolvedKey);
  ensureHeaderForSheet_(sheet, resolvedKey);

  if (resolvedKey === SHEETS.KEHADIRAN_GURU) {
    sheet.appendRow(normalizeKehadiranGuruRow_(rowValues));
    return;
  }

  if (resolvedKey === SHEETS.KEHADIRAN_MURID) {
    sheet.appendRow(normalizeKehadiranMuridRow_(rowValues));
    return;
  }

  sheet.appendRow(rowValues);
}

function appendRows(sheetKey, rows) {
  const resolvedKey = resolveSheetName_(sheetKey);
  const sheet = getOrCreateSheet_(resolvedKey);
  ensureHeaderForSheet_(sheet, resolvedKey);
  const safeRows = Array.isArray(rows) ? rows.filter(function(row) { return Array.isArray(row) && row.length; }) : [];
  if (!safeRows.length) return;

  const normalizedRows = safeRows.map(function(row) {
    if (resolvedKey === SHEETS.KEHADIRAN_GURU) return normalizeKehadiranGuruRow_(row);
    if (resolvedKey === SHEETS.KEHADIRAN_MURID) return normalizeKehadiranMuridRow_(row);
    return row;
  });
  const width = normalizedRows.reduce(function(maxCols, row) {
    return Math.max(maxCols, Array.isArray(row) ? row.length : 0);
  }, 0);
  const paddedRows = normalizedRows.map(function(row) {
    return padRow_(row, width);
  });
  const startRow = Math.max(sheet.getLastRow(), 1) + 1;
  sheet.getRange(startRow, 1, paddedRows.length, width).setValues(paddedRows);
  SpreadsheetApp.flush(); // Paksa save data
}

function replaceSheet(sheetKey, rows) {
  const resolvedKey = resolveSheetName_(sheetKey);
  const sheet = getOrCreateSheet_(resolvedKey);
  const header = HEADERS[sheetKey] || HEADERS[getKeyByValue_(SHEETS, resolvedKey)];

  sheet.clearContents();
  if (rows && rows.length) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  } else if (header) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }

  if (sheet.getLastColumn() > 0) {
    styleHeader_(sheet, sheet.getLastColumn());
    autosize_(sheet, sheet.getLastColumn());
  }
}

function normalizeKehadiranGuruRow_(rowValues) {
  const row = Array.isArray(rowValues) ? rowValues.slice() : [];
  if (row.length >= HEADERS.KEHADIRAN_GURU.length) {
    return padRow_(row, HEADERS.KEHADIRAN_GURU.length);
  }

  const nama = string_(row[0]);
  const tarikh = string_(row[1]);
  const status = string_(row[2]);
  const masa = string_(row[3]);
  const catatan = string_(row[4]);
  const email = string_(row[5]);
  const gps = splitGps_(string_(row[6]));

  return [
    Utilities.getUuid(),
    tarikh,
    email,
    nama,
    masa,
    status,
    gps.lat,
    gps.lng,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    catatan,
    "",
    ""
  ];
}

function normalizeKehadiranMuridRow_(rowValues) {
  const row = Array.isArray(rowValues) ? rowValues.slice() : [];
  if (row.length >= HEADERS.KEHADIRAN_MURID.length) {
    return padRow_(row, HEADERS.KEHADIRAN_MURID.length);
  }

  const nama = string_(row[0]);
  const kelas = string_(row[1]);
  const tarikh = string_(row[2]);
  const status = string_(row[3]);
  const telefonWali = string_(row[4]);
  const catatan = string_(row[5]);
  const guruEmail = string_(row[6]);
  const guruNama = findGuruNameByEmail_(guruEmail);
  const murid = findMuridMeta_(nama, kelas);
  const now = Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd HH:mm:ss");

  return [
    Utilities.getUuid(),
    tarikh,
    kelas,
    nama,
    murid.jantina,
    status,
    telefonWali || murid.telefonWali,
    guruEmail,
    guruNama,
    catatan,
    now,
    guruEmail
  ];
}

function findGuruNameByEmail_(email) {
  const target = string_(email).toLowerCase();
  if (!target) return "";
  const rows = getCachedSheetData("GURU");
  for (var i = 1; i < rows.length; i++) {
    if (string_(rows[i][1]).toLowerCase() === target) return string_(rows[i][0]);
  }
  return "";
}

function findMuridMeta_(nama, kelas) {
  const targetNama = string_(nama).toLowerCase();
  const targetKelas = string_(kelas).toLowerCase();
  if (!targetNama) return { jantina: "", telefonWali: "" };
  const rows = getCachedSheetData("MURID");
  for (var i = 1; i < rows.length; i++) {
    const rowNama = string_(rows[i][0]).toLowerCase();
    const rowKelas = string_(rows[i][1]).toLowerCase();
    if (rowNama === targetNama && (!targetKelas || rowKelas === targetKelas)) {
      return {
        jantina: string_(rows[i][2]),
        telefonWali: string_(rows[i][4])
      };
    }
  }
  return { jantina: "", telefonWali: "" };
}

function verifyToken(token) {
  const cfg = getConfig();
  const secret = cfg.WORKER_SECRET || cfg.WORKER_TOKEN;
  if (!secret || !token) return false;
  return token === generateDailyToken_(secret);
}

function hasConfigSecret() {
  const cfg = getConfig();
  return Boolean(cfg.WORKER_SECRET || cfg.WORKER_TOKEN);
}

function generateDailyToken_(secret) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const payload = yyyy + mm + dd + secret;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(digest);
}

function jsonResponse(payload, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ status: statusCode || 200 }, payload)))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureConfigDefaults_(defaults) {
  const config = getConfig();
  const missing = {};
  defaults.forEach(function(pair) {
    if (!(pair[0] in config)) missing[pair[0]] = pair[1];
  });
  if (Object.keys(missing).length) setConfig(missing);
}

function ensureHeaderForSheet_(sheet, resolvedName) {
  if (sheet.getLastRow() > 0) return;
  const key = getKeyByValue_(SHEETS, resolvedName);
  const header = HEADERS[key];
  if (header) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    styleHeader_(sheet, header.length);
    autosize_(sheet, header.length);
  }
}

function resolveSheetName_(sheetKey) {
  return SHEETS[sheetKey] || sheetKey;
}

function getOrCreateSheet_(name) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function styleHeader_(sheet, numCols) {
  sheet.getRange(1, 1, 1, numCols)
    .setFontWeight("bold")
    .setBackground("#0F172A")
    .setFontColor("#FACC15");
}

function autosize_(sheet, numCols) {
  for (var i = 1; i <= numCols; i++) {
    sheet.autoResizeColumn(i);
  }
}

function splitGps_(gpsRaw) {
  if (!gpsRaw) return { lat: "", lng: "" };
  const parts = String(gpsRaw).split(",");
  return { lat: string_(parts[0]), lng: string_(parts[1]) };
}

function padRow_(row, targetLength) {
  const out = Array.isArray(row) ? row.slice(0, targetLength) : [];
  while (out.length < targetLength) out.push("");
  return out;
}

function string_(value) {
  return String(value == null ? "" : value).trim();
}

function getKeyByValue_(obj, value) {
  return Object.keys(obj).find(function(key) { return obj[key] === value; });
}
