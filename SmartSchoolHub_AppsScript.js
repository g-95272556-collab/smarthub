// ============================================================
// LEGACY BACKEND REFERENCE ONLY
// JANGAN deploy fail ini sebagai backend aktif.
// Backend aktif semasa: SmartSchoolHub_AppsScript_Clean.gs
// ============================================================
// SMART SCHOOL HUB v2.0 — SK KIANDONGO
// Google Apps Script Master Backend
// Kemaskini: 18 April 2026
// Data: 122 Murid | 135 Rekod Hari Lahir
// ============================================================

const SCHOOL_LAT = 5.3055655;
const SCHOOL_LNG = 116.9633906;
const GEOFENCE_RADIUS = 200;
const SPREADSHEET_ID = "1NizJvSD9tL9XjX1PnqtFlVUUVKnGpnLGQjraGKos6Vk";

const SHEETS = {
  GURU:             "GURU",
  MURID:            "MURID",
  KEHADIRAN_GURU:   "KEHADIRAN_GURU",
  KEHADIRAN_MURID:  "KEHADIRAN_MURID",
  KELAS:            "KELAS",
  BIRTHDAY_LOG:     "BIRTHDAY_LOG",
  LAPORAN_BERTUGAS: "LAPORAN_BERTUGAS",
  CONFIG:           "CONFIG"
};

// ── Header definisi — SATU SUMBER KEBENARAN ────────────────
const HEADERS = {
  GURU:            ["Nama","Emel","Jawatan","Kelas","Telefon","Status","WhatsApp","Tarikh Lahir","Catatan","Dikemaskini","Oleh"],
  MURID:           ["Nama","Kelas","Jantina","Tarikh Lahir","Telefon Wali","Nama Wali","No. IC","Status","Catatan","Dikemaskini","Oleh"],
  KEHADIRAN_GURU:  ["ID","TARIKH","EMAIL_GURU","NAMA_GURU","MASA_DAFTAR","STATUS","LATITUD","LONGITUD","JARAK_METER","DALAM_GEOFENCE","MOCK_LOCATION","DEVELOPER_MODE","ACCURACY_GPS","GPS_SPOOFING_FLAG","JENIS_CUTI","CATATAN","IP_ADDRESS","USER_AGENT"],
  KEHADIRAN_MURID: ["ID","TARIKH","KELAS","NAMA_MURID","JANTINA","STATUS","TELEFON_WALI","GURU_EMAIL","GURU_NAMA","CATATAN","DIKEMASKINI","OLEH"],
  BIRTHDAY_LOG:    ["Masa","Jenis","Penerima","Status","Mesej"],
  LAPORAN_BERTUGAS: ["Minggu","Guru Bertugas","Jawatan","Aktiviti Isnin","Aktiviti Selasa","Aktiviti Rabu","Aktiviti Khamis","Aktiviti Jumaat","% Kehadiran","RMT Penerima","RMT Catatan","Disiplin Kes","Disiplin Jenis","Disiplin Butiran","Kebersihan","Catatan Kebersihan","Kelas Terbersih","Catatan Anugerah","Rumusan AI","Dikemaskini","Oleh"],
  CONFIG:          ["Kunci","Nilai"]
};

// ── Data Murid (IDME — 122 rekod) ─────────────────────────
const SEED_MURID = [["ADEEN ALFRED EDY","1 NILAM","Lelaki","2019/08/31","0178158048","EDY LILIP","190831121779","Aktif","MANGKAAK|KRISTIAN"],["ALIYAN HAFIEYAH BINTI MOHAMMAD HAFIZ","1 NILAM","Perempuan","2019/01/09","0138362383","MOHAMMAD HAFIZ NIPOT ABDULLAH","190109120066","Aktif","SUNGAI|ISLAM"],["ARTHUR AZELY","1 NILAM","Lelaki","2019/08/21","1119037426","AZELY BIN AIM","190821120035","Aktif","KADAZAN|KRISTIAN"],["AWENG EFIFANIA A/K MARKUS","1 NILAM","Perempuan","2019/07/10","0133760408","MARKUS A/K LANTANG","190710120024","Aktif","IBAN ATAU SEA DAYAK|KRISTIAN"],["CHRISTY CHRELL SAUL","1 NILAM","Perempuan","2019/10/13","0145570886","SAUL JANGIL","191013120760","Aktif","MANGKAAK|KRISTIAN"],["DANIEL IMMANUEL KAMAL","1 NILAM","Lelaki","2019/02/03","0135948005","KAMAL MOSUNGKOI","190203120599","Aktif","DUSUN|KRISTIAN"],["EVALIANNIE ALVIN","1 NILAM","Perempuan","2019/05/20","0136357624","ALVIN TEBAN","190520120226","Aktif","SUNGAI|KRISTIAN"],["FABIOLA NOVA NELL DANIEL","1 NILAM","Perempuan","2019/11/18","1112053559","DANIEL BIN JIPRI @ JEFFREY","191118120302","Aktif","KADAZAN|KRISTIAN"],["FEIVELL MOSE NORAMIN","1 NILAM","Lelaki","2019/03/15","0138600938","NORAMIN BIN DOMIRIN","190315120243","Aktif","DUSUN|KRISTIAN"],["FREYA SHENDDY FEDRICK","1 NILAM","Perempuan","2019/02/04","0148542861","FELISILA FELIX","190204120080","Aktif","MANGKAAK|KRISTIAN"],["JOSIEL BIN PORISEN","1 NILAM","Lelaki","2019/03/02","0135402802","PORISEN BIN SADIL","190302120711","Aktif","MANGKAAK|KRISTIAN"],["MARCHEL BIN MARRYRAH","1 NILAM","Lelaki","2019/09/08","1117564920","ECHLINAH BINTI PHILIP","190908120791","Aktif","BAJAU|KRISTIAN"],["MATIUS IVENDER KELARIN","1 NILAM","Lelaki","2019/11/11","","KELARIN BIN LAMBIK","191111121601","Aktif","DUSUN|KRISTIAN"],["MOHAMAD ADAM SHAH BIN MOHAMAD AMIRUL","1 NILAM","Lelaki","2019/01/05","0135701885","NUR JUHANAH HUMAIRAH BINTI JULIN","190105010177","Aktif","MELAYU|ISLAM"],["MOHAMMAD JASLEY SHARIN BIN JUNIER","1 NILAM","Lelaki","2019/04/26","0195327827","JUNIER BIN JULIN","190426121409","Aktif","DUSUN|ISLAM"],["NADELLA LYSSA JANU","1 NILAM","Perempuan","2019/12/23","0135524143","JANU SALLEH","191223121534","Aktif","SUNGAI|KRISTIAN"],["NELLDYEA UNEY NILLDY","1 NILAM","Perempuan","2019/01/23","0178236548","NILLDY BIN KAMIL","190123120118","Aktif","KADAZAN|KRISTIAN"],["NUR AMANDA RAFANDA BINTI MOHAMMAD REDZWAN","1 NILAM","Perempuan","2019/06/24","1120555437","MOHAMMAD REDZWAN BIN SINBAD","190624121012","Aktif","SULUK|ISLAM"],["PHILIPIRIOS PIUS","1 NILAM","Lelaki","2019/06/22","0192517670","PIUS BIN MURUSIN","190622122003","Aktif","DUSUN|KRISTIAN"],["RIKA ELLYSA MARTIN","1 NILAM","Perempuan","2019/04/12","0196711334","MARTIN BIN KIWIN","190412120464","Aktif","SUNGAI|KRISTIAN"],["STEVEZIBOY BIN USTIN","1 NILAM","Lelaki","2019/03/11","0132949164","USTIN BIN SAMBUT","190311120481","Aktif","SUNGAI|KRISTIAN"],["ACHAZIA ALENA BINTI JULIS","2 INTAN","Perempuan","2018/09/02","0137197748","JULIS BIN RAMBUN","180902121508","Aktif","DUSUN|KRISTIAN"],["AZWITA ADZMAN","2 INTAN","Perempuan","2018/10/09","0138911467","ADZMAN AKUAH","181009121446","Aktif","SUNGAI|KRISTIAN"],["CHERLLYNNA AYEN LIJOR","2 INTAN","Perempuan","2018/02/09","0138980094","LIJOR BIN JOHN","180209120988","Aktif","SUNGAI|KRISTIAN"],["CHRISNATASHA JOHNRAY","2 INTAN","Perempuan","2018/01/13","0133456157","JOHNRAY JONIS","180113120166","Aktif","MANGKAAK|KRISTIAN"],["DANNIESON WILSON","2 INTAN","Lelaki","2018/01/23","0139895031","WILSON BIN MANJONG","180123121461","Aktif","KADAZAN|KRISTIAN"],["DEALVENO JINIUS","2 INTAN","Lelaki","2018/03/23","0138547430","JINIUS TIKAN","180323121191","Aktif","DUSUN|KRISTIAN"],["ELLYSHERLYN ELJIE","2 INTAN","Perempuan","2018/02/20","0134310526","ELJIE BIN LAJUNI","180220120380","Aktif","KADAZAN|KRISTIAN"],["ELWERON BIN RONNY","2 INTAN","Lelaki","2018/05/14","0178945464","RONNY SHAM KOH","180514120095","Aktif","KADAZAN|KRISTIAN"],["FEYLA CHLOE EDY","2 INTAN","Perempuan","2018/05/17","0178158048","EDY LILIP","180517121800","Aktif","MANGKAAK|KRISTIAN"],["HILARY LEVIN JUNIOR","2 INTAN","Lelaki","2018/04/23","0178936795","JUNIOR JISTIN","180423121615","Aktif","KADAZAN|KRISTIAN"],["JAYDEN JACE JAY ROY","2 INTAN","Lelaki","2018/07/11","0148592355","SUNINAH BINTI NIKFIK","180711121329","Aktif","SUNGAI|KRISTIAN"],["MELLYYANA BINTI MINING","2 INTAN","Perempuan","2018/12/13","0192401162","MINING SALAT","181213121080","Aktif","KADAZAN|KRISTIAN"],["MUHAMMAD SYAHIR BIN KADIR","2 INTAN","Lelaki","2018/08/31","1135791989","KADIR BIN ARSHAD","180831120929","Aktif","BAJAU|ISLAM"],["NELVI VENSTAR NEESTAR","2 INTAN","Lelaki","2018/09/21","0136952216","NEESTAR BIN KAMIL","180921120607","Aktif","MANGKAAK|KRISTIAN"],["NEVIOLA ROBBIE","2 INTAN","Perempuan","2018/06/19","0137879653","ROBBIE BIN LAMBI","180619121326","Aktif","MANGKAAK|KRISTIAN"],["NEZIFANDY FEUSRAY","2 INTAN","Lelaki","2018/11/01","0178906325","FEUSRAY BIN LANTAS","181101120235","Aktif","SUNGAI|KRISTIAN"],["PEDRIK BIN INGRIK","2 INTAN","Lelaki","2018/08/22","1126702267","INGRIK BIN DINIL @ TURUAS","180822121081","Aktif","MANGKAAK|KRISTIAN"],["RAIZO ROZAINIE BIN AZIZUL","2 INTAN","Lelaki","2018/05/21","0136319403","AZIZUL BIN LAIDIN","180521121723","Aktif","KADAZAN|ISLAM"],["STEFELY JIOREL JINISLY","2 INTAN","Lelaki","2018/06/27","0197941729","JINISLY JAMES","180627121043","Aktif","KADAZAN|KRISTIAN"],["WADLEY VICTOR WENDIEADDY","2 INTAN","Lelaki","2018/07/09","0178371879","WENDIEADDY BIN YASIN","180709121311","Aktif","KADAZAN|KRISTIAN"],["ALEEZA VIONEETA JUKRRI","3 KRISTAL","Perempuan","2017/11/02","0179010841","JUKRRI REZALI","171102121548","Aktif","KADAZAN|KRISTIAN"],["ALIYAH FAIZAH BINTI ABDULLAH","3 KRISTAL","Perempuan","2017/03/22","1135791989","KADIR BIN ARSHAD","170322120710","Aktif","INDONESIA|ISLAM"],["ALVIAN ERRY BIN ALVIN","3 KRISTAL","Lelaki","2017/09/08","0136357624","ALVIN TEBAN","170908120347","Aktif","SUNGAI|KRISTIAN"],["ARIEY ARIEX BIN SAGITAN","3 KRISTAL","Lelaki","2017/11/11","0135951275","NAINA BINTI SOGITAN","171111121443","Aktif","MANGKAAK|KRISTIAN"],["CHERVELIAH QUEENNELYNIVY BINTI SILAS","3 KRISTAL","Perempuan","2017/03/17","0148727957","SILAS BIN SALIM","170317120708","Aktif","SUNGAI|KRISTIAN"],["ELROIZ ROSLI","3 KRISTAL","Lelaki","2017/11/23","1129257014","ROSLI BIN SEPUAN","171123121459","Aktif","SUNGAI|KRISTIAN"],["ELVI EVELIN LAWARANCE","3 KRISTAL","Perempuan","2017/12/11","","LAWARANCE BIN LANJANG","171211120296","Aktif","KADAZAN|KRISTIAN"],["FEBBY OANNALIN JAMATIUS","3 KRISTAL","Perempuan","2017/05/23","0134198869","JAMATIUS TINGGI","170523121488","Aktif","SUNGAI|KRISTIAN"],["FRANCY NICOLE NELL","3 KRISTAL","Perempuan","2017/07/25","1112053559","DANIEL BIN JIPRI @ JEFFREY","170725010858","Aktif","KADAZAN|KRISTIAN"],["FRENLLEY BIN PHILIP","3 KRISTAL","Lelaki","2017/01/09","0178131422","PHILIP BIN MAHIR","170109120535","Aktif","MANGKAAK|KRISTIAN"],["INDILIKA SIBINUS","3 KRISTAL","Perempuan","2017/10/19","0133379307","SIBINUS BIN MAIKA","171019121192","Aktif","DUSUN|KRISTIAN"],["JENESLY LONIM","3 KRISTAL","Lelaki","2017/03/29","0198970714","LONIM BIN WEDI @ WADAY","170329121409","Aktif","DUSUN|KRISTIAN"],["LEO ORENZO LIUNARDO","3 KRISTAL","Lelaki","2017/06/25","0199055948","LIUNARDO BIN MITINGAN","170625120013","Aktif","SUNGAI|KRISTIAN"],["MOHAMMAD AISY RAYYAN BIN MOHAMMAD REDZWAN","3 KRISTAL","Lelaki","2017/12/16","1120555437","MOHAMMAD REDZWAN BIN SINBAD","171216121407","Aktif","SULUK|ISLAM"],["MOHAMMAD JASVEE SHARIL JUNIER BIN ABDULLAH","3 KRISTAL","Lelaki","2017/09/15","0195327827","JUNIER BIN JULIN","170915121559","Aktif","DUSUN|ISLAM"],["NADDELISAH JANU","3 KRISTAL","Perempuan","2017/07/21","","","170721120566","Aktif","SUNGAI|KRISTIAN"],["RIANA NICOL RONNY","3 KRISTAL","Perempuan","2017/11/24","0197307704","RONNY BIN SOIMAN","171124120386","Aktif","DUSUN|KRISTIAN"],["SUZIAHDIRALYN USTIN","3 KRISTAL","Perempuan","2017/06/21","0132949194","UZIA USTIN","170621121414","Aktif","SUNGAI|KRISTIAN"],["ZELFIANINILVY JAIRY","3 KRISTAL","Perempuan","2017/11/24","0136048206","JAIRY BIN KUKONG","171124121848","Aktif","KADAZAN|KRISTIAN"],["AIZAVINNIE BINTI ABDULLAH","4 MUTIARA","Perempuan","2016/12/11","0136319403","AZIZUL BIN LAIDIN","161211120924","Aktif","KADAZAN|ISLAM"],["ALVERA ANGEL BINTI ANDRIAS","4 MUTIARA","Perempuan","2016/06/23","0107640503","ANDRIAS BIN TINGGI","160623120344","Aktif","SUNGAI|KRISTIAN"],["ARDYNIUS SIBINUS","4 MUTIARA","Lelaki","2016/10/29","0133379307","SIBINUS BIN MAIKA","161029121007","Aktif","MANGKAAK|KRISTIAN"],["ARMEL AISHA BINTI JUMAT","4 MUTIARA","Perempuan","2016/09/02","0199063757","LIRITA BINTI OTIT","160902120208","Aktif","MANGKAAK|KRISTIAN"],["DAVID DANIEL GIDEON","4 MUTIARA","Lelaki","2016/04/24","","","160424121029","Aktif","SUNGAI|KRISTIAN"],["FEBBY OLIVEIA JAMATIUS","4 MUTIARA","Perempuan","2016/02/09","0134198869","JAMATIUS TINGGI","160209120592","Aktif","SUNGAI|KRISTIAN"],["FEBIANCIO BIN PORISEN","4 MUTIARA","Lelaki","2016/02/27","0135402802","PORISEN BIN SADIL","160227120609","Aktif","MANGKAAK|KRISTIAN"],["FENNEYRILEN LILIP","4 MUTIARA","Perempuan","2016/05/15","0195650369","LILIP BIN SALINDOH","160515120224","Aktif","MANGKAAK|KRISTIAN"],["FIRON EDY","4 MUTIARA","Lelaki","2016/04/07","0178158048","EDY LILIP","160407121983","Aktif","MANGKAAK|KRISTIAN"],["FORGIEFAN ZED NORAMIN","4 MUTIARA","Lelaki","2016/09/02","0138600938","NORAMIN BIN DOMIRIN","160902120443","Aktif","DUSUN|KRISTIAN"],["HERISA EDWAN","4 MUTIARA","Perempuan","2016/06/15","","EDWAN BIN SUDIN","160615121638","Aktif","KADAZAN|KRISTIAN"],["JESIKANELTA BINTI KELARIN","4 MUTIARA","Perempuan","2016/01/08","","KELARIN BIN LAMBIK","160108120630","Aktif","DUSUN|KRISTIAN"],["JUITA CILLA BINTI NELSON","4 MUTIARA","Perempuan","2016/12/09","0138377790","NELSON BIN KAMIL","161209120132","Aktif","DUSUN|KRISTIAN"],["KERLYFIZLYVIAN KING","4 MUTIARA","Lelaki","2016/07/15","0139432778","KING BIN SAMBIDO","160715120405","Aktif","SUNGAI|KRISTIAN"],["KEVIN ULDIN @ KULDIN","4 MUTIARA","Lelaki","2016/05/13","","","160513120191","Aktif","KADAZAN|KRISTIAN"],["LYDIA BINTI JENIUL","4 MUTIARA","Perempuan","2016/11/13","0133813760","JENIUL BIN SALINDOH","161113120218","Aktif","MANGKAAK|KRISTIAN"],["MOHAMMAD ARSYAD ATIF BIN SHAH RAZA KHAN","4 MUTIARA","Lelaki","2016/12/05","1127748086","SUINNAH BINTI NIKFIK","161205120637","Aktif","SUNGAI|ISLAM"],["MPRISIKA PIUS","4 MUTIARA","Perempuan","2016/09/13","0192517670","PIUS BIN MURUSIN","160913121476","Aktif","DUSUN|KRISTIAN"],["NESHVITI BINTI NASIUS","4 MUTIARA","Perempuan","2016/08/04","","NASIUS BIN TIKAN","160804121354","Aktif","KADAZAN|KRISTIAN"],["NUR FAIHA AZALEA BINTI MOHAMMAD REDZWAN","4 MUTIARA","Perempuan","2016/01/27","0134461416","FAZILAH BINTI ALI","160127120230","Aktif","KEDAYAN|ISLAM"],["SELINA SUE REX","4 MUTIARA","Perempuan","2016/09/24","1123040062","HELVIANA JANIS","160924120698","Aktif","DUSUN|KRISTIAN"],["STEVELY VIOREL JINISLY","4 MUTIARA","Lelaki","2016/02/24","0197941729","JINISLY JAMES","160224121067","Aktif","KADAZAN|KRISTIAN"],["WILNEVELLA ALBERT @ JAMMY","4 MUTIARA","Perempuan","2016/03/22","1125173911","ALBERT KASMIN @ JAMMY KASUMIN","160322120412","Aktif","SUNGAI|KRISTIAN"],["ALESYAA HAFIZANIE BINTI MOHAMMAD HAFIZ","5 DELIMA","Perempuan","2015/09/14","0138362383","MOHAMMAD HAFIZ NIPOT ABDULLAH","150914120644","Aktif","SUNGAI|ISLAM"],["ALVY EVALYNCIKA AK ANNETH","5 DELIMA","Perempuan","2015/07/01","1301620794","ANNETH A/K JALAI","150701121168","Aktif","IBAN ATAU SEA DAYAK|KRISTIAN"],["ANN ALEYSIA BINTI JUKRRI","5 DELIMA","Perempuan","2015/11/02","0179010841","JUKRRI REZALI","151102120088","Aktif","KADAZAN|KRISTIAN"],["ARCHEBELLE AUGY ANDREW","5 DELIMA","Perempuan","2015/08/30","0193386910","ANDREW BIN JUSTINE","150830121674","Aktif","KADAZAN|KRISTIAN"],["CHERVELINAH EVILYN BINTI SILAS","5 DELIMA","Perempuan","2015/01/19","0148727957","SILAS BIN SALIM","150119120856","Aktif","SUNGAI|KRISTIAN"],["CHRISTCY SHANALIN SAUL","5 DELIMA","Perempuan","2015/07/07","0145570886","SAUL JANGIL","150707120190","Aktif","MANGKAAK|KRISTIAN"],["CHRISTELLA ANGEL YAKUB","5 DELIMA","Perempuan","2015/11/18","0198196107","YAKUB BIN SAMBUT","151118120066","Aktif","SUNGAI|KRISTIAN"],["DELVIN KENT DAZREN DMITRI","5 DELIMA","Lelaki","2015/02/01","0135513671","DMITRI BIN KASUMIN","150201120193","Aktif","DUSUN|KRISTIAN"],["EMYLIA JIROEL","5 DELIMA","Perempuan","2015/09/22","0128192989","JIROEL BIN KUKONG","150922120652","Aktif","KADAZAN|KRISTIAN"],["ESYCA QUEENAVIN BINTI ROSLI","5 DELIMA","Perempuan","2015/02/03","1129257014","ROSLI BIN SEPUAN","150203121456","Aktif","SUNGAI|KRISTIAN"],["FEDLLY TOIBON","5 DELIMA","Lelaki","2015/10/22","0135951275","TOIBON BIN LOLUK","151022120715","Aktif","KADAZAN|KRISTIAN"],["FIONA CHELSA NELL","5 DELIMA","Perempuan","2015/09/11","1112053559","DANIEL BIN JIPRI @ JEFFREY","150911050054","Aktif","KADAZAN|KRISTIAN"],["HERNI MITA INGRIK","5 DELIMA","Perempuan","2015/04/28","0112672267","HARNYA MITA MARIUS","150428120286","Aktif","MANGKAAK|KRISTIAN"],["JANE CLAYSHERLY JUNIOR","5 DELIMA","Perempuan","2015/06/09","0178936795","JUNIOR JISTIN","150609120090","Aktif","KADAZAN|KRISTIAN"],["MARLINAH JEOFFRY","5 DELIMA","Perempuan","2015/11/28","1114101906","JEOFFRY LIMBAS","151128121062","Aktif","KADAZAN|KRISTIAN"],["MARSHILA BINTI JUSLIM","5 DELIMA","Perempuan","2015/09/04","0134196717","JUSLIM BIN NIPOT","150904120106","Aktif","MANGKAAK|KRISTIAN"],["MELWIN BIN MINING","5 DELIMA","Lelaki","2015/09/20","0192401162","MINING SALAT","150920120309","Aktif","KADAZAN|KRISTIAN"],["NESEYEFALYNESICA NEESTAR","5 DELIMA","Perempuan","2015/09/24","0136952216","NEESTAR BIN KAMIL","150924120680","Aktif","MANGKAAK|KRISTIAN"],["QUEEN FEBIYUSRA FEUSRAY","5 DELIMA","Perempuan","2015/07/24","0178906325","FEUSRAY BIN LANTAS","150724120416","Aktif","SUNGAI|KRISTIAN"],["SHAFINA ELSA BINTI SHAHFERY","5 DELIMA","Perempuan","2015/11/09","1112063707","SHAHFERY BIN JUSILIN","151109120988","Aktif","DUSUN|ISLAM"],["YERIVA EFIFANIA A/K MARKUS","5 DELIMA","Perempuan","2015/08/28","0133760408","MARKUS A/K LANTANG","150828120576","Aktif","IBAN ATAU SEA DAYAK|KRISTIAN"],["ALFAIZAEL SHAM SAMY","6 BAIDURI","Lelaki","2014/02/05","0128193528","SAMY BIN SADIL","140205120917","Aktif","MANGKAAK|KRISTIAN"],["ALLVIONA LYNDIUSCA","6 BAIDURI","Perempuan","2014/09/24","","DIUSLA LAING","140924120876","Aktif","SUNGAI|KRISTIAN"],["ARGI NURHIDAYATI BINTI MOHD AZWAN","6 BAIDURI","Perempuan","2014/04/01","","ASCUNG BIN MAJIN","140401121394","Aktif","SUNGAI|ISLAM"],["AZVIL ADZMAN","6 BAIDURI","Lelaki","2014/03/28","0138911467","ADZMAN AKUAH","140328121805","Aktif","SUNGAI|KRISTIAN"],["BETTNY EVA BINTI JINIUS","6 BAIDURI","Perempuan","2014/06/21","0138547430","JINIUS TIKAN","140621120908","Aktif","DUSUN|KRISTIAN"],["CHRISFAEZRON JOHNRAY","6 BAIDURI","Lelaki","2014/11/21","0133456157","JOHNRAY JONIS","141121121343","Aktif","MANGKAAK|KRISTIAN"],["DAREL YEHEZKIEL KAMAL","6 BAIDURI","Lelaki","2014/07/20","0135948005","KAMAL MOSUNGKOI","140720120989","Aktif","DUSUN|KRISTIAN"],["ELISAASHLEY WENDIEADDY","6 BAIDURI","Perempuan","2014/07/22","0178371879","WENDIEADDY BIN YASIN","140722121432","Aktif","KADAZAN|KRISTIAN"],["FERNANDEZ BRANLEY JAINI","6 BAIDURI","Lelaki","2014/07/03","","RAMDOSE BIN PUROK","140703121429","Aktif","DUSUN|KRISTIAN"],["JEYRAYMOND TERRY","6 BAIDURI","Lelaki","2014/06/09","0135524143","JANU SALLEH","140609121473","Aktif","SUNGAI|KRISTIAN"],["JORDAN WAWANLEE JAMATIUS","6 BAIDURI","Lelaki","2014/12/20","0134198869","JAMATIUS TINGGI","141220121541","Aktif","SUNGAI|KRISTIAN"],["LEOVEERANDO BIN LIUNARDO","6 BAIDURI","Lelaki","2014/06/18","0199055948","LIUNARDO BIN MITINGAN","140618121619","Aktif","SUNGAI|KRISTIAN"],["MASLIALYONNA ANNA MATIUS","6 BAIDURI","Perempuan","2014/07/01","0142601028","MATIUS BIN KENG","140701121126","Aktif","SUNGAI|KRISTIAN"],["MC ELLYRINA EUNCEE MIKE","6 BAIDURI","Perempuan","2014/06/06","0148651492","MIKE BIN JASMI","140606120432","Aktif","SUNGAI|KRISTIAN"],["REKLEY ZERRON BIN ANDRIAS","6 BAIDURI","Lelaki","2014/05/17","0107640503","ANDRIAS BIN TINGGI","140517120721","Aktif","SUNGAI|KRISTIAN"],["SAFFIYAH BINTI SHAHFERY","6 BAIDURI","Perempuan","2014/11/10","1112063707","SHAHFERY BIN JUSILIN","141110121444","Aktif","DUSUN|ISLAM"],["SUZLIANAH LINA BINTI TONIS","6 BAIDURI","Perempuan","2014/07/11","0133839060","TONIS BIN RANSUS","140711120602","Aktif","KADAZAN|KRISTIAN"],["SYALVIAH TIMIUS","6 BAIDURI","Perempuan","2014/03/10","","TIMIUS TIKAN","140310121436","Aktif","MANGKAAK|KRISTIAN"]];

// ── Data Hari Lahir (Murid + Guru — 135 rekod) ────────────
const SEED_HARILAHIR = [["ADEEN ALFRED EDY","Murid","1 NILAM","2019/08/31","0178158048"],["ALIYAN HAFIEYAH BINTI MOHAMMAD HAFIZ","Murid","1 NILAM","2019/01/09","0138362383"],["ARTHUR AZELY","Murid","1 NILAM","2019/08/21","1119037426"],["AWENG EFIFANIA A/K MARKUS","Murid","1 NILAM","2019/07/10","0133760408"],["CHRISTY CHRELL SAUL","Murid","1 NILAM","2019/10/13","0145570886"],["DANIEL IMMANUEL KAMAL","Murid","1 NILAM","2019/02/03","0135948005"],["EVALIANNIE ALVIN","Murid","1 NILAM","2019/05/20","0136357624"],["FABIOLA NOVA NELL DANIEL","Murid","1 NILAM","2019/11/18","1112053559"],["FEIVELL MOSE NORAMIN","Murid","1 NILAM","2019/03/15","0138600938"],["FREYA SHENDDY FEDRICK","Murid","1 NILAM","2019/02/04","0148542861"],["JOSIEL BIN PORISEN","Murid","1 NILAM","2019/03/02","0135402802"],["MARCHEL BIN MARRYRAH","Murid","1 NILAM","2019/09/08","1117564920"],["MATIUS IVENDER KELARIN","Murid","1 NILAM","2019/11/11",""],["MOHAMAD ADAM SHAH BIN MOHAMAD AMIRUL","Murid","1 NILAM","2019/01/05","0135701885"],["MOHAMMAD JASLEY SHARIN BIN JUNIER","Murid","1 NILAM","2019/04/26","0195327827"],["NADELLA LYSSA JANU","Murid","1 NILAM","2019/12/23","0135524143"],["NELLDYEA UNEY NILLDY","Murid","1 NILAM","2019/01/23","0178236548"],["NUR AMANDA RAFANDA BINTI MOHAMMAD REDZWAN","Murid","1 NILAM","2019/06/24","1120555437"],["PHILIPIRIOS PIUS","Murid","1 NILAM","2019/06/22","0192517670"],["RIKA ELLYSA MARTIN","Murid","1 NILAM","2019/04/12","0196711334"],["STEVEZIBOY BIN USTIN","Murid","1 NILAM","2019/03/11","0132949164"],["ACHAZIA ALENA BINTI JULIS","Murid","2 INTAN","2018/09/02","0137197748"],["AZWITA ADZMAN","Murid","2 INTAN","2018/10/09","0138911467"],["CHERLLYNNA AYEN LIJOR","Murid","2 INTAN","2018/02/09","0138980094"],["CHRISNATASHA JOHNRAY","Murid","2 INTAN","2018/01/13","0133456157"],["DANNIESON WILSON","Murid","2 INTAN","2018/01/23","0139895031"],["DEALVENO JINIUS","Murid","2 INTAN","2018/03/23","0138547430"],["ELLYSHERLYN ELJIE","Murid","2 INTAN","2018/02/20","0134310526"],["ELWERON BIN RONNY","Murid","2 INTAN","2018/05/14","0178945464"],["FEYLA CHLOE EDY","Murid","2 INTAN","2018/05/17","0178158048"],["HILARY LEVIN JUNIOR","Murid","2 INTAN","2018/04/23","0178936795"],["JAYDEN JACE JAY ROY","Murid","2 INTAN","2018/07/11","0148592355"],["MELLYYANA BINTI MINING","Murid","2 INTAN","2018/12/13","0192401162"],["MUHAMMAD SYAHIR BIN KADIR","Murid","2 INTAN","2018/08/31","1135791989"],["NELVI VENSTAR NEESTAR","Murid","2 INTAN","2018/09/21","0136952216"],["NEVIOLA ROBBIE","Murid","2 INTAN","2018/06/19","0137879653"],["NEZIFANDY FEUSRAY","Murid","2 INTAN","2018/11/01","0178906325"],["PEDRIK BIN INGRIK","Murid","2 INTAN","2018/08/22","1126702267"],["RAIZO ROZAINIE BIN AZIZUL","Murid","2 INTAN","2018/05/21","0136319403"],["STEFELY JIOREL JINISLY","Murid","2 INTAN","2018/06/27","0197941729"],["WADLEY VICTOR WENDIEADDY","Murid","2 INTAN","2018/07/09","0178371879"],["ALEEZA VIONEETA JUKRRI","Murid","3 KRISTAL","2017/11/02","0179010841"],["ALIYAH FAIZAH BINTI ABDULLAH","Murid","3 KRISTAL","2017/03/22","1135791989"],["ALVIAN ERRY BIN ALVIN","Murid","3 KRISTAL","2017/09/08","0136357624"],["ARIEY ARIEX BIN SAGITAN","Murid","3 KRISTAL","2017/11/11","0135951275"],["CHERVELIAH QUEENNELYNIVY BINTI SILAS","Murid","3 KRISTAL","2017/03/17","0148727957"],["ELROIZ ROSLI","Murid","3 KRISTAL","2017/11/23","1129257014"],["ELVI EVELIN LAWARANCE","Murid","3 KRISTAL","2017/12/11",""],["FEBBY OANNALIN JAMATIUS","Murid","3 KRISTAL","2017/05/23","0134198869"],["FRANCY NICOLE NELL","Murid","3 KRISTAL","2017/07/25","1112053559"],["FRENLLEY BIN PHILIP","Murid","3 KRISTAL","2017/01/09","0178131422"],["INDILIKA SIBINUS","Murid","3 KRISTAL","2017/10/19","0133379307"],["JENESLY LONIM","Murid","3 KRISTAL","2017/03/29","0198970714"],["LEO ORENZO LIUNARDO","Murid","3 KRISTAL","2017/06/25","0199055948"],["MOHAMMAD AISY RAYYAN BIN MOHAMMAD REDZWAN","Murid","3 KRISTAL","2017/12/16","1120555437"],["MOHAMMAD JASVEE SHARIL JUNIER BIN ABDULLAH","Murid","3 KRISTAL","2017/09/15","0195327827"],["NADDELISAH JANU","Murid","3 KRISTAL","2017/07/21",""],["RIANA NICOL RONNY","Murid","3 KRISTAL","2017/11/24","0197307704"],["SUZIAHDIRALYN USTIN","Murid","3 KRISTAL","2017/06/21","0132949194"],["ZELFIANINILVY JAIRY","Murid","3 KRISTAL","2017/11/24","0136048206"],["AIZAVINNIE BINTI ABDULLAH","Murid","4 MUTIARA","2016/12/11","0136319403"],["ALVERA ANGEL BINTI ANDRIAS","Murid","4 MUTIARA","2016/06/23","0107640503"],["ARDYNIUS SIBINUS","Murid","4 MUTIARA","2016/10/29","0133379307"],["ARMEL AISHA BINTI JUMAT","Murid","4 MUTIARA","2016/09/02","0199063757"],["DAVID DANIEL GIDEON","Murid","4 MUTIARA","2016/04/24",""],["FEBBY OLIVEIA JAMATIUS","Murid","4 MUTIARA","2016/02/09","0134198869"],["FEBIANCIO BIN PORISEN","Murid","4 MUTIARA","2016/02/27","0135402802"],["FENNEYRILEN LILIP","Murid","4 MUTIARA","2016/05/15","0195650369"],["FIRON EDY","Murid","4 MUTIARA","2016/04/07","0178158048"],["FORGIEFAN ZED NORAMIN","Murid","4 MUTIARA","2016/09/02","0138600938"],["HERISA EDWAN","Murid","4 MUTIARA","2016/06/15",""],["JESIKANELTA BINTI KELARIN","Murid","4 MUTIARA","2016/01/08",""],["JUITA CILLA BINTI NELSON","Murid","4 MUTIARA","2016/12/09","0138377790"],["KERLYFIZLYVIAN KING","Murid","4 MUTIARA","2016/07/15","0139432778"],["KEVIN ULDIN @ KULDIN","Murid","4 MUTIARA","2016/05/13",""],["LYDIA BINTI JENIUL","Murid","4 MUTIARA","2016/11/13","0133813760"],["MOHAMMAD ARSYAD ATIF BIN SHAH RAZA KHAN","Murid","4 MUTIARA","2016/12/05","1127748086"],["MPRISIKA PIUS","Murid","4 MUTIARA","2016/09/13","0192517670"],["NESHVITI BINTI NASIUS","Murid","4 MUTIARA","2016/08/04",""],["NUR FAIHA AZALEA BINTI MOHAMMAD REDZWAN","Murid","4 MUTIARA","2016/01/27","0134461416"],["SELINA SUE REX","Murid","4 MUTIARA","2016/09/24","1123040062"],["STEVELY VIOREL JINISLY","Murid","4 MUTIARA","2016/02/24","0197941729"],["WILNEVELLA ALBERT @ JAMMY","Murid","4 MUTIARA","2016/03/22","1125173911"],["ALESYAA HAFIZANIE BINTI MOHAMMAD HAFIZ","Murid","5 DELIMA","2015/09/14","0138362383"],["ALVY EVALYNCIKA AK ANNETH","Murid","5 DELIMA","2015/07/01","1301620794"],["ANN ALEYSIA BINTI JUKRRI","Murid","5 DELIMA","2015/11/02","0179010841"],["ARCHEBELLE AUGY ANDREW","Murid","5 DELIMA","2015/08/30","0193386910"],["CHERVELINAH EVILYN BINTI SILAS","Murid","5 DELIMA","2015/01/19","0148727957"],["CHRISTCY SHANALIN SAUL","Murid","5 DELIMA","2015/07/07","0145570886"],["CHRISTELLA ANGEL YAKUB","Murid","5 DELIMA","2015/11/18","0198196107"],["DELVIN KENT DAZREN DMITRI","Murid","5 DELIMA","2015/02/01","0135513671"],["EMYLIA JIROEL","Murid","5 DELIMA","2015/09/22","0128192989"],["ESYCA QUEENAVIN BINTI ROSLI","Murid","5 DELIMA","2015/02/03","1129257014"],["FEDLLY TOIBON","Murid","5 DELIMA","2015/10/22","0135951275"],["FIONA CHELSA NELL","Murid","5 DELIMA","2015/09/11","1112053559"],["HERNI MITA INGRIK","Murid","5 DELIMA","2015/04/28","0112672267"],["JANE CLAYSHERLY JUNIOR","Murid","5 DELIMA","2015/06/09","0178936795"],["MARLINAH JEOFFRY","Murid","5 DELIMA","2015/11/28","1114101906"],["MARSHILA BINTI JUSLIM","Murid","5 DELIMA","2015/09/04","0134196717"],["MELWIN BIN MINING","Murid","5 DELIMA","2015/09/20","0192401162"],["NESEYEFALYNESICA NEESTAR","Murid","5 DELIMA","2015/09/24","0136952216"],["QUEEN FEBIYUSRA FEUSRAY","Murid","5 DELIMA","2015/07/24","0178906325"],["SHAFINA ELSA BINTI SHAHFERY","Murid","5 DELIMA","2015/11/09","1112063707"],["YERIVA EFIFANIA A/K MARKUS","Murid","5 DELIMA","2015/08/28","0133760408"],["ALFAIZAEL SHAM SAMY","Murid","6 BAIDURI","2014/02/05","0128193528"],["ALLVIONA LYNDIUSCA","Murid","6 BAIDURI","2014/09/24",""],["ARGI NURHIDAYATI BINTI MOHD AZWAN","Murid","6 BAIDURI","2014/04/01",""],["AZVIL ADZMAN","Murid","6 BAIDURI","2014/03/28","0138911467"],["BETTNY EVA BINTI JINIUS","Murid","6 BAIDURI","2014/06/21","0138547430"],["CHRISFAEZRON JOHNRAY","Murid","6 BAIDURI","2014/11/21","0133456157"],["DAREL YEHEZKIEL KAMAL","Murid","6 BAIDURI","2014/07/20","0135948005"],["ELISAASHLEY WENDIEADDY","Murid","6 BAIDURI","2014/07/22","0178371879"],["FERNANDEZ BRANLEY JAINI","Murid","6 BAIDURI","2014/07/03",""],["JEYRAYMOND TERRY","Murid","6 BAIDURI","2014/06/09","0135524143"],["JORDAN WAWANLEE JAMATIUS","Murid","6 BAIDURI","2014/12/20","0134198869"],["LEOVEERANDO BIN LIUNARDO","Murid","6 BAIDURI","2014/06/18","0199055948"],["MASLIALYONNA ANNA MATIUS","Murid","6 BAIDURI","2014/07/01","0142601028"],["MC ELLYRINA EUNCEE MIKE","Murid","6 BAIDURI","2014/06/06","0148651492"],["REKLEY ZERRON BIN ANDRIAS","Murid","6 BAIDURI","2014/05/17","0107640503"],["SAFFIYAH BINTI SHAHFERY","Murid","6 BAIDURI","2014/11/10","1112063707"],["SUZLIANAH LINA BINTI TONIS","Murid","6 BAIDURI","2014/07/11","0133839060"],["SYALVIAH TIMIUS","Murid","6 BAIDURI","2014/03/10",""],["JIMMY PATRICK GANTOR","Guru Besar","","27/04/1982","0195363361"],["JEMSAN BIN SAKUNDING","PK HEM","","19/08/1984","0138547430"],["ALOHA BINTI IBIN","Guru","","23/11/1989","0135560671"],["AMRI IZZAD BIN TAHIR","PK KOKUM","","29/08/1989","0105838718"],["ANDREW BIN JUSTINE","PK Pentadbiran","","05/02/1980","0193386910"],["BETTY BINTI JIM","Guru","","13/04/1998","01124135966"],["OKTOVYANTI KOH","Guru","","04/10/1996","0138665663"],["STENLEY DOMINIC","Guru","","18/09/1989","01135988995"],["MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","Guru Agama","","15/12/2001","01121792758"],["TAIMAH BINTI ILOK","Guru","","07/09/1973","01123607380"],["JIDA MINSES","Guru","","26/02/2000","01126605349"],["FAZILAH BINTI ALI","Guru","","04/04/1984","0134461416"],["JOHNABON SARINDOH","Pembantu Operasi","","08/03/1983","0148534999"]];

// ── Data Guru ─────────────────────────────────────────────
const SEED_GURU = [
  ["JIMMY PATRICK GANTOR","g-69272581@moe-dl.edu.my","Guru Besar","","60195363361","Aktif","60195363361","1982-04-27","","",""],
  ["JEMSAN BIN SAKUNDING","g-03272560@moe-dl.edu.my","PK HEM","","60138547430","Aktif","60138547430","1984-08-19","","",""],
  ["ALOHA BINTI IBIN","g-80272554@moe-dl.edu.my","Guru","3 KRISTAL","60135560671","Aktif","60135560671","1989-11-23","","",""],
  ["AMRI IZZAD BIN TAHIR","g-87272555@moe-dl.edu.my","PK Kokurikulum","","60105838718","Aktif","60105838718","1989-08-29","","",""],
  ["ANDREW BIN JUSTINE","g-95272556@moe-dl.edu.my","PK Pentadbiran","","60193386910","Aktif","60193386910","1980-02-05","","",""],
  ["BETTY BINTI JIM","g-34564753@moe-dl.edu.my","Guru","4 MUTIARA","601124135966","Aktif","601124135966","1998-04-13","","",""],
  ["OKTOVYANTI KOH","g-32510899@moe-dl.edu.my","Guru Mata Pelajaran","","60138665663","Aktif","60138665663","1996-10-04","","",""],
  ["STENLEY DOMINIC","g-09563222@moe-dl.edu.my","Guru","6 BAIDURI","601135988995","Aktif","601135988995","1989-09-18","","",""],
  ["MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","g-27568716@moe-dl.edu.my","Guru Agama","","601121792758","Aktif","601121792758","2001-12-15","","",""],
  ["TAIMAH BINTI ILOK","g-56272514@moe-dl.edu.my","Guru","2 INTAN","601123607380","Aktif","601123607380","1973-09-07","","",""],
  ["JIDA MINSES","jidaminses@moe-dl.edu.my","Guru","5 DELIMA","601126605349","Aktif","601126605349","","","",""],
  ["FAZILAH BINTI ALI","g-36272623@moe-dl.edu.my","Guru","1 NILAM","60134461416","Aktif","60134461416","","","",""],
  ["JOHNABON SARINDOH","legfixwhy@send4.uk","Pembantu Operasi","","60148534999","Aktif","60148534999","","","",""]
];

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index").setTitle("Smart School Hub v2.0");
}

// ── SETUP SEMUA SHEETS ─────────────────────────────────────
function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);
  Object.entries(HEADERS).forEach(([key, cols]) => {
    const sheet = getSheet(key);
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      applyHeaderStyle(sheet, cols.length);
    }
  });
  const configSheet = getSheet("CONFIG");
  const existing = configSheet.getDataRange().getValues().map(r => r[0]);
  const defaults = [
    ["FONNTE_TOKEN",""],["WORKER_SECRET",""],["ADMIN_EMAIL",""],
    ["SCHOOL_LAT", SCHOOL_LAT],["SCHOOL_LNG", SCHOOL_LNG],
    ["DEEPSEEK_API_KEY",""],
    ["TELEGRAM_BOT","8438571330:AAHKj7XFJK80bOgiqUNMzTVhRDjaCNNMMjc"],
    ["TELEGRAM_CHAT","-1002152935710"],["TELEGRAM_TOPIC","9391"],
    ["FONNTE_GROUP","60148608242-1434600192@g.us"]
  ];
  defaults.forEach(([k,v]) => { if (!existing.includes(k)) configSheet.appendRow([k,v]); });
  return jsonResponse({ success: true, message: "Sheets ready" });
}

// ── SEED DATA — Isi data dari IDME & BDReminder ────────────
function seedMurid() {
  const sheet = getSheet("MURID");
  sheet.clearContents();
  const header = HEADERS.MURID;
  const now = new Date().toISOString();
  const rows = [header];
  SEED_MURID.forEach(r => {
    rows.push([
      r[0]||"",  // Nama
      r[1]||"",  // Kelas
      r[2]||"",  // Jantina
      r[3]||"",  // Tarikh Lahir (DD/MM/YYYY)
      r[4]||"",  // Telefon Wali
      r[5]||"",  // Nama Wali
      r[6]||"",  // No. IC
      r[7]||"Aktif", // Status
      r[8]||"",  // Catatan
      now,       // Dikemaskini
      "SEED_IDME_2026" // Oleh
    ]);
  });
  sheet.getRange(1, 1, rows.length, header.length).setValues(rows);
  applyHeaderStyle(sheet, header.length);
  return jsonResponse({ success: true, message: "Seeded " + SEED_MURID.length + " murid" });
}

function seedGuru() {
  const sheet = getSheet("GURU");
  sheet.clearContents();
  const header = HEADERS.GURU;
  const rows = [header, ...SEED_GURU];
  sheet.getRange(1, 1, rows.length, header.length).setValues(rows);
  applyHeaderStyle(sheet, header.length);
  return jsonResponse({ success: true, message: "Seeded " + SEED_GURU.length + " guru" });
}

function seedHariLahir() {
  const sheet = getSheet("BIRTHDAY_LOG");
  // Guna sheet berasingan HARILAHIR
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hlSheet = ss.getSheetByName("HARILAHIR");
  if (!hlSheet) hlSheet = ss.insertSheet("HARILAHIR");
  hlSheet.clearContents();
  const header = ["Nama","Peranan","Kelas","Tarikh Lahir (DD/MM/YYYY)","Telefon"];
  const rows = [header, ...SEED_HARILAHIR];
  hlSheet.getRange(1, 1, rows.length, header.length).setValues(rows);
  applyHeaderStyle(hlSheet, header.length);
  return jsonResponse({ success: true, message: "Seeded " + SEED_HARILAHIR.length + " rekod hari lahir" });
}

function seedAllData() {
  seedGuru();
  seedMurid();
  seedHariLahir();
  return jsonResponse({ success: true, message: "Semua data berjaya di-seed: " + SEED_GURU.length + " guru, " + SEED_MURID.length + " murid, " + SEED_HARILAHIR.length + " hari lahir" });
}

// ── doPost ─────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "setupAllSheets" && !hasConfigSecret()) return setupAllSheets();
    if (data.action === "setConfig" && !hasConfigSecret()) { setConfig(data.config); return jsonResponse({ success: true }); }
    if (data.action === "seedAllData" && !hasConfigSecret()) return seedAllData();
    if (data.action === "seedMurid" && !hasConfigSecret()) return seedMurid();
    if (data.action === "seedGuru" && !hasConfigSecret()) return seedGuru();
    if (data.action === "seedHariLahir" && !hasConfigSecret()) return seedHariLahir();

    if (!verifyToken(data.token)) return jsonResponse({ success: false, error: "Token tidak sah" }, 401);

    switch (data.action) {
      case "getConfig":     return jsonResponse({ success: true, config: getConfig() });
      case "readSheet":     return jsonResponse({ success: true, rows: readSheetRows(data.sheetKey) });
      case "appendRow":     appendRow(data.sheetKey, data.row || []); return jsonResponse({ success: true });
      case "appendRows":    appendRows(data.sheetKey, data.rows || []); return jsonResponse({ success: true });
      case "replaceSheet":  replaceSheet(data.sheetKey, data.rows || []); return jsonResponse({ success: true });
      case "setupAllSheets": return setupAllSheets();
      case "setConfig":     setConfig(data.config); return jsonResponse({ success: true });
      case "seedAllData":   return seedAllData();
      default: return jsonResponse({ success: false, error: "Aksi tidak sah" }, 400);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── Sheet Helpers ──────────────────────────────────────────
function ensureSheets(ss) {
  const allSheets = ["GURU","MURID","KEHADIRAN_GURU","KEHADIRAN_MURID","BIRTHDAY_LOG","CONFIG","HARILAHIR","LAPORAN_BERTUGAS"];
  allSheets.forEach(name => { if (!ss.getSheetByName(name)) ss.insertSheet(name); });
}

function getSheet(nameOrKey) {
  const sheetName = SHEETS[nameOrKey] || nameOrKey;
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function applyHeaderStyle(sheet, numCols) {
  sheet.getRange(1, 1, 1, numCols)
       .setFontWeight("bold")
       .setBackground("#1A4FA0")
       .setFontColor("#FFFFFF");
}

function readSheetRows(sheetKey) {
  const sheet = getSheet(sheetKey);
  if (sheet.getLastRow() === 0) return [];
  return sheet.getDataRange().getDisplayValues();
}

function appendRow(sheetKey, rowValues) {
  const sheet = getSheet(sheetKey);
  if (sheetKey === "KEHADIRAN_GURU") {
    sheet.appendRow(normalizeKehadiranGuruRow(rowValues));
    return;
  }
  if (sheetKey === "KEHADIRAN_MURID") {
    sheet.appendRow(normalizeKehadiranMuridRow(rowValues));
    return;
  }
  getSheet(sheetKey).appendRow(rowValues);
}

function appendRows(sheetKey, rows) {
  const sheet = getSheet(sheetKey);
  const safeRows = Array.isArray(rows) ? rows.filter(function(row) { return Array.isArray(row) && row.length; }) : [];
  if (!safeRows.length) return;

  const normalizedRows = safeRows.map(function(row) {
    if (sheetKey === "KEHADIRAN_GURU") return normalizeKehadiranGuruRow(row);
    if (sheetKey === "KEHADIRAN_MURID") return normalizeKehadiranMuridRow(row);
    return row;
  });
  const width = normalizedRows.reduce(function(maxCols, row) {
    return Math.max(maxCols, Array.isArray(row) ? row.length : 0);
  }, 0);
  const paddedRows = normalizedRows.map(function(row) {
    return padRow(row, width);
  });
  const startRow = Math.max(sheet.getLastRow(), 1) + 1;
  sheet.getRange(startRow, 1, paddedRows.length, width).setValues(paddedRows);
}

function replaceSheet(sheetKey, rows) {
  const sheet = getSheet(sheetKey);
  sheet.clearContents();
  if (rows && rows.length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    applyHeaderStyle(sheet, rows[0].length);
  }
}

function normalizeKehadiranGuruRow(rowValues) {
  const row = Array.isArray(rowValues) ? rowValues.slice() : [];
  const looksExpanded = row.length >= HEADERS.KEHADIRAN_GURU.length;
  if (looksExpanded) {
    return padRow(row, HEADERS.KEHADIRAN_GURU.length);
  }

  const nama = String(row[0] || "").trim();
  const tarikh = String(row[1] || "").trim();
  const status = String(row[2] || "").trim();
  const masa = String(row[3] || "").trim();
  const catatan = String(row[4] || "").trim();
  const emel = String(row[5] || "").trim();
  const gpsRaw = String(row[6] || "").trim();
  const gps = splitGps(gpsRaw);

  return [
    Utilities.getUuid(),
    tarikh,
    emel,
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

function normalizeKehadiranMuridRow(rowValues) {
  const row = Array.isArray(rowValues) ? rowValues.slice() : [];
  const looksExpanded = row.length >= HEADERS.KEHADIRAN_MURID.length;
  if (looksExpanded) {
    return padRow(row, HEADERS.KEHADIRAN_MURID.length);
  }

  const nama = String(row[0] || "").trim();
  const kelas = String(row[1] || "").trim();
  const tarikh = String(row[2] || "").trim();
  const status = String(row[3] || "").trim();
  const telefonWali = String(row[4] || "").trim();
  const catatan = String(row[5] || "").trim();
  const guruEmail = String(row[6] || "").trim();
  const guruNama = findGuruNameByEmail(guruEmail);
  const muridMeta = findMuridMeta(nama, kelas);
  const now = Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd HH:mm:ss");

  return [
    Utilities.getUuid(),
    tarikh,
    kelas,
    nama,
    muridMeta.jantina,
    status,
    telefonWali || muridMeta.telefonWali,
    guruEmail,
    guruNama,
    catatan,
    now,
    guruEmail
  ];
}

function splitGps(gpsRaw) {
  if (!gpsRaw) return { lat: "", lng: "" };
  const parts = String(gpsRaw).split(",");
  return {
    lat: String(parts[0] || "").trim(),
    lng: String(parts[1] || "").trim()
  };
}

function padRow(row, targetLength) {
  const out = row.slice(0, targetLength);
  while (out.length < targetLength) out.push("");
  return out;
}

function findGuruNameByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return "";
  const rows = readSheetRows("GURU");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    if (String(row[1] || "").trim().toLowerCase() === normalizedEmail) {
      return String(row[0] || "").trim();
    }
  }
  return "";
}

function findMuridMeta(nama, kelas) {
  const targetNama = String(nama || "").trim().toLowerCase();
  const targetKelas = String(kelas || "").trim().toLowerCase();
  if (!targetNama) return { jantina: "", telefonWali: "" };
  const rows = readSheetRows("MURID");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const rowNama = String(row[0] || "").trim().toLowerCase();
    const rowKelas = String(row[1] || "").trim().toLowerCase();
    if (rowNama === targetNama && (!targetKelas || rowKelas === targetKelas)) {
      return {
        jantina: String(row[2] || "").trim(),
        telefonWali: String(row[4] || "").trim()
      };
    }
  }
  return { jantina: "", telefonWali: "" };
}

// ── Config ────────────────────────────────────────────────
function getConfig() {
  const sheet = getSheet(SHEETS.CONFIG);
  if (sheet.getLastRow() === 0) return {};
  return sheet.getDataRange().getValues().reduce((cfg, row) => {
    if (row[0]) cfg[row[0]] = row[1];
    return cfg;
  }, {});
}

function setConfig(configObj) {
  if (!configObj || typeof configObj !== "object") return;
  const sheet = getSheet(SHEETS.CONFIG);
  const rows = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [];
  const keyIndex = {};
  rows.forEach((row, i) => { if (row[0]) keyIndex[row[0]] = i + 1; });
  Object.entries(configObj).forEach(([key, value]) => {
    if (keyIndex[key]) sheet.getRange(keyIndex[key], 2).setValue(value);
    else sheet.appendRow([key, value]);
  });
}

function hasConfigSecret() {
  const cfg = getConfig();
  return Boolean(cfg.WORKER_SECRET || cfg.WORKER_TOKEN);
}

// ── Auth ──────────────────────────────────────────────────
function verifyToken(token) {
  const cfg = getConfig();
  const secret = cfg.WORKER_SECRET || cfg.WORKER_TOKEN;
  if (!secret || !token) return false;
  return token === generateDailyToken(secret);
}

function generateDailyToken(secret) {
  const mytDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const yyyy = mytDate.getFullYear();
  const mm   = String(mytDate.getMonth() + 1).padStart(2, "0");
  const dd   = String(mytDate.getDate()).padStart(2, "0");
  const payload = `${yyyy}${mm}${dd}${secret}`;
  const digest  = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(digest);
}

// ── Response ──────────────────────────────────────────────
function jsonResponse(payload, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ status: statusCode }, payload)))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Notifikasi Ibu Bapa ───────────────────────────────────
function notifyIbubapaTidakHadir(kelas, muridList, tarikh) {
  const config = getConfig();
  const fonnte_token = config.FONNTE_TOKEN;
  for (const murid of muridList) {
    if (!murid.whatsappGroup && !murid.telefon) continue;
    const mesej = `🔔 *Makluman Kehadiran*\n\nSelamat Sejahtera,\n\nAnak anda *${murid.nama}* (${kelas}) didapati *tidak hadir* ke sekolah pada *${tarikh}*.\n\nSila hubungi pihak sekolah jika ada sebarang pertanyaan.\n\n_SK Kiandongo_`;
    try {
      UrlFetchApp.fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { "Authorization": fonnte_token, "Content-Type": "application/json" },
        payload: JSON.stringify({ target: murid.whatsappGroup || murid.telefon, message: mesej, countryCode: "60" })
      });
    } catch (err) { console.log("Fonnte error:", err); }
  }
}
