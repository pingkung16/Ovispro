/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  FarmLog,
  FarmProfile,
  FeedIngredient,
  FormulatedRation,
  OnlysheepsListing,
  Sheep,
  WebFormSubmission,
} from '../types/sheep';

export interface SheetTabPayload {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
}

function safeCell(val: string | number | boolean | undefined | null): string | number {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'boolean') return val ? 'ใช่' : 'ไม่ใช่';
  return String(val);
}

export function buildFarmSheetTabs(data: {
  profile: FarmProfile;
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
}): SheetTabPayload[] {
  const sheepHeaders = [
    'รหัสเบอร์หู (Ear Tag)',
    'ชื่อเล่นแกะ',
    'สายพันธุ์',
    'ระดับเลือด',
    'เพศ',
    'อายุ (เดือน)',
    'น้ำหนัก (กก.)',
    'ADG ปัจจุบัน (ก./วัน)',
    'คอก',
    'ระยะการผลิต',
    'คะแนนร่างกาย (BCS)',
    'สถานะสุขภาพ',
    'ความละเอียดขน (µm)',
    'เกรดขน',
    'น้ำหนักขน/ปี (กก.)',
    'ความยาวเส้นใย (ซม.)',
    'วัคซีนล่าสุด',
    'วันที่ฉีดวัคซีน',
    'ถ่ายพยาธิล่าสุด',
    'วันที่ถ่ายพยาธิ',
    'พ่อพันธุ์ (Sire)',
    'แม่พันธุ์ (Dam)',
    'ฟาร์ม',
  ];

  const sheepRows = data.sheepList.map(s => [
    safeCell(s.earTag),
    safeCell(s.name),
    safeCell(s.breed),
    safeCell(s.bloodPercentage),
    s.gender === 'male' ? 'เพศผู้' : 'เพศเมีย',
    safeCell(s.ageMonths),
    safeCell(s.weightKg),
    safeCell(s.currentAdgGrams),
    safeCell(s.pen),
    safeCell(s.stage),
    safeCell(s.bcs),
    safeCell(s.healthStatus),
    safeCell(s.woolMicron),
    safeCell(s.woolGrade),
    safeCell(s.fleeceYieldKg),
    safeCell(s.woolStapleLengthCm),
    safeCell(s.vaccineName),
    safeCell(s.vaccineLastDate),
    safeCell(s.dewormName),
    safeCell(s.dewormLastDate),
    safeCell(s.sireName),
    safeCell(s.damName),
    safeCell(data.profile.farmName),
  ]);

  const ingredientHeaders = [
    'ชื่อวัตถุดิบ (ไทย)',
    'ชื่อวัตถุดิบ (EN)',
    'หมวดหมู่',
    'วัตถุแห้ง DM (%)',
    'โปรตีนหยาบ CP (%)',
    'พลังงาน TDN (%)',
    'แคลเซียม Ca (%)',
    'ฟอสฟอรัส P (%)',
    'ราคา (บาท/กก.)',
    'อาหารหยาบ',
    'หมายเหตุ',
  ];

  const ingredientRows = data.ingredients.map(i => [
    safeCell(i.nameTh),
    safeCell(i.nameEn),
    safeCell(i.category),
    safeCell(i.dryMatter),
    safeCell(i.crudeProtein),
    safeCell(i.tdn),
    safeCell(i.calcium),
    safeCell(i.phosphorus),
    safeCell(i.pricePerKg),
    i.isRoughage ? 'อาหารหยาบ' : 'อาหารข้น/เสริม',
    safeCell(i.description),
  ]);

  const rationHeaders = [
    'ชื่อสูตรอาหาร',
    'กลุ่มเป้าหมาย',
    'น้ำหนักเป้าหมาย (กก.)',
    'ปริมาณให้กินสด (กก./ตัว/วัน)',
    'วัตถุแห้ง DM (กก./ตัว/วัน)',
    'โปรตีน CP (%)',
    'พลังงาน TDN (%)',
    'สัดส่วนหยาบ (%)',
    'สัดส่วนข้น (%)',
    'ต้นทุน (บาท/กก.)',
    'ต้นทุน (บาท/ตัว/วัน)',
    'วันที่สร้าง',
  ];

  const rationRows = data.rations.map(r => [
    safeCell(r.name),
    safeCell(r.targetStage),
    safeCell(r.recommendedForWeight),
    safeCell(r.totalAsFedKg),
    safeCell(r.totalDmKg),
    safeCell(r.calculatedCpPercent),
    safeCell(r.calculatedTdnPercent),
    safeCell(r.roughagePercent),
    safeCell(r.concentratePercent),
    safeCell(r.costPerKgMix),
    safeCell(r.costPerHeadPerDay),
    safeCell(r.createdAt),
  ]);

  const logHeaders = [
    'วันที่',
    'ประเภทกิจกรรม',
    'คอก',
    'แกะที่เกี่ยวข้อง',
    'หัวข้อบันทึก',
    'น้ำหนักที่ชั่ง (กก.)',
    'สูตร/ปริมาณอาหาร (กก.)',
    'วัคซีน/ยา/ขนาดใช้',
    'ผู้บันทึก',
    'รายละเอียดเพิ่มเติม',
  ];

  const logRows = data.logs.map(l => [
    safeCell(l.date),
    safeCell(l.type),
    safeCell(l.penName),
    safeCell(l.sheepEarTag || l.damEarTag),
    safeCell(l.title),
    safeCell(l.weightKg),
    l.feedRationName ? `${l.feedRationName} (${l.feedAmountKg ?? '-'} กก.)` : '',
    l.vaccineOrMedicineName ? `${l.vaccineOrMedicineName} ${l.treatmentDose ?? ''}`.trim() : '',
    safeCell(l.recordedBy),
    safeCell(l.notes),
  ]);

  return [
    { sheetName: 'ทะเบียนแกะ', headers: sheepHeaders, rows: sheepRows },
    { sheetName: 'วัตถุดิบอาหาร', headers: ingredientHeaders, rows: ingredientRows },
    { sheetName: 'สูตรอาหาร', headers: rationHeaders, rows: rationRows },
    { sheetName: 'สมุดบันทึกฟาร์ม', headers: logHeaders, rows: logRows },
  ];
}

function escapeCsvCell(val: string | number): string {
  const s = String(val ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadSheetAsCsv(tab: SheetTabPayload, farmName: string): void {
  const lines = [
    tab.headers.map(escapeCsvCell).join(','),
    ...tab.rows.map(row => row.map(escapeCsvCell).join(',')),
  ];
  // UTF-8 BOM so Thai renders cleanly in Google Sheets and Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `${farmName.replace(/\s+/g, '_')}_${tab.sheetName}_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(val: string | number): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadAllSheetsAsWorkbook(tabs: SheetTabPayload[], farmName: string): void {
  const worksheetsXml = tabs
    .map(tab => {
      const headerRow = `<Row>${tab.headers
        .map(h => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
        .join('')}</Row>`;
      const dataRows = tab.rows
        .map(
          row =>
            `<Row>${row
              .map(cell => {
                const isNum = typeof cell === 'number' && Number.isFinite(cell);
                return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(cell)}</Data></Cell>`;
              })
              .join('')}</Row>`
        )
        .join('');
      return `<Worksheet ss:Name="${escapeXml(tab.sheetName.slice(0, 31))}"><Table>${headerRow}${dataRows}</Table></Worksheet>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FAF6EE"/>
   <Interior ss:Color="#1E3F2B" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;

  const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `Ovispro_${farmName.replace(/\s+/g, '_')}_GoogleSheet_${dateStr}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildTsvForGoogleSheets(tab: SheetTabPayload): string {
  const sanitizeTsv = (v: string | number) => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
  return [
    tab.headers.map(sanitizeTsv).join('\t'),
    ...tab.rows.map(r => r.map(sanitizeTsv).join('\t')),
  ].join('\n');
}

export const WEB_FORM_SHEET_NAME = 'บันทึกฟอร์มเว็บ';

export interface SheetColumnSpec {
  colIndex: number;
  columnLetter: string;
  key: string;
  header: string;
  dataType: 'String' | 'Number' | 'ISO Timestamp' | 'Enum';
  example: string;
  validationRule: string;
}

export const WEB_FORM_SHEET_COLUMNS: SheetColumnSpec[] = [
  { colIndex: 1, columnLetter: 'A', key: 'id', header: 'รหัสอ้างอิง', dataType: 'String', example: 'wf-1794995012-a8f1', validationRule: 'สร้างอัตโนมัติ (Unique PK)' },
  { colIndex: 2, columnLetter: 'B', key: 'submittedAt', header: 'วัน-เวลาบันทึก', dataType: 'ISO Timestamp', example: '2026-11-18T09:30:00Z', validationRule: 'ISO-8601 จากเซิร์ฟเวอร์' },
  { colIndex: 3, columnLetter: 'C', key: 'farmName', header: 'ชื่อฟาร์ม', dataType: 'String', example: 'ฟาร์มบ้านดอยเมอริโน', validationRule: 'จำเป็น (2–100 ตัวอักษร)' },
  { colIndex: 4, columnLetter: 'D', key: 'recorderName', header: 'ผู้บันทึก', dataType: 'String', example: 'สมชาย ใจดี', validationRule: 'จำเป็น (2–80 ตัวอักษร)' },
  { colIndex: 5, columnLetter: 'E', key: 'province', header: 'จังหวัด', dataType: 'String', example: 'เชียงใหม่', validationRule: 'จำเป็น (2–60 ตัวอักษร)' },
  { colIndex: 6, columnLetter: 'F', key: 'sheepEarTag', header: 'เบอร์หูแกะ', dataType: 'String', example: 'OV-2026-01', validationRule: 'ไม่เกิน 40 ตัวอักษร' },
  { colIndex: 7, columnLetter: 'G', key: 'sheepName', header: 'ชื่อแกะ', dataType: 'String', example: 'ขนปุย', validationRule: 'จำเป็น (1–80 ตัวอักษร)' },
  { colIndex: 8, columnLetter: 'H', key: 'breed', header: 'สายพันธุ์', dataType: 'String', example: 'เมอริโน (Merino)', validationRule: 'เลือกจาก 11 สายพันธุ์ / กรอกเอง' },
  { colIndex: 9, columnLetter: 'I', key: 'gender', header: 'เพศ', dataType: 'Enum', example: 'เพศเมีย', validationRule: 'male | female เท่านั้น' },
  { colIndex: 10, columnLetter: 'J', key: 'ageMonths', header: 'อายุ (เดือน)', dataType: 'Number', example: '18', validationRule: 'ตัวเลข 0 – 240 เดือน' },
  { colIndex: 11, columnLetter: 'K', key: 'weightKg', header: 'น้ำหนัก (กก.)', dataType: 'Number', example: '58.5', validationRule: 'ตัวเลข 1 – 250 กก.' },
  { colIndex: 12, columnLetter: 'L', key: 'woolMicron', header: 'ไมครอน (µm)', dataType: 'Number', example: '18.5', validationRule: 'ตัวเลข 10 – 60 µm' },
  { colIndex: 13, columnLetter: 'M', key: 'dailyFeedKg', header: 'อาหาร (กก./วัน)', dataType: 'Number', example: '2.1', validationRule: 'ตัวเลข 0 – 15 กก./วัน' },
  { colIndex: 14, columnLetter: 'N', key: 'notes', header: 'หมายเหตุ', dataType: 'String', example: 'ขนแน่น วัคซีน FMD ครบ', validationRule: 'ไม่เกิน 500 ตัวอักษร' },
];

export interface DatabaseTableSpec {
  tableName: string;
  primaryKey: string;
  accessScope: string;
  purpose: string;
  keyColumns: string;
}

export const DATABASE_NAME = 'Ovispro_Central_Database';

export const DATABASE_SCHEMA_SPEC: DatabaseTableSpec[] = [
  {
    tableName: 'farms',
    primaryKey: 'farmId',
    accessScope: 'Private per Farm (Auth Token)',
    purpose: 'บัญชีฟาร์มสมาชิก, ข้อมูลเจ้าของฟาร์ม, รหัสผ่านแฮช scrypt + salt',
    keyColumns: 'farmId, username, passwordHash, farmName, ownerName, location, breedFocus, updatedAt',
  },
  {
    tableName: 'pens',
    primaryKey: 'id (within farmId)',
    accessScope: 'Private per Farm',
    purpose: 'ข้อมูลคอกเลี้ยงแกะ (ค่าเริ่มต้น 4 คอก + คอกที่เกษตรกรเพิ่มเอง)',
    keyColumns: 'id, code, name, ageRange, sheepCount, averageWeightKg, dailyFeedKg, averageAdgGrams',
  },
  {
    tableName: 'sheepList',
    primaryKey: 'id / earTag',
    accessScope: 'Private per Farm',
    purpose: 'ทะเบียนประวัติแกะรายตัว น้ำหนัก ADG วัคซีน ถ่ายพยาธิ และคุณภาพเส้นขน',
    keyColumns: 'id, earTag, name, breed, gender, ageMonths, weightKg, penId, woolMicron, fleeceYieldKg',
  },
  {
    tableName: 'ingredients',
    primaryKey: 'id',
    accessScope: 'Private per Farm',
    purpose: 'คลังวัตถุดิบอาหารแกะ (%DM, %CP, %TDN, %Ca, %P, ราคา/กก.)',
    keyColumns: 'id, nameTh, category, dryMatter, crudeProtein, tdn, pricePerKg, isRoughage',
  },
  {
    tableName: 'rations',
    primaryKey: 'id',
    accessScope: 'Private per Farm',
    purpose: 'สูตรอาหารที่คำนวณตามมาตรฐาน NRC / Pearson Square และต้นทุนต่อตัวต่อวัน',
    keyColumns: 'id, name, targetStage, totalAsFedKg, calculatedCpPercent, calculatedTdnPercent, costPerHeadPerDay',
  },
  {
    tableName: 'logs',
    primaryKey: 'id',
    accessScope: 'Private per Farm',
    purpose: 'สมุดบันทึกกิจกรรมประจำวัน 5 ประเภท (ชั่งน้ำหนัก, อาหาร, วัคซีน, ผสมพันธุ์, คลอด)',
    keyColumns: 'id, date, type, sheepEarTag, penName, title, weightKg, feedAmountKg, recordedBy',
  },
  {
    tableName: 'onlysheepsListings',
    primaryKey: 'listingId',
    accessScope: 'Public Network (Delete restricted to Owner Farm)',
    purpose: 'โปรไฟล์แกะพ่อ-แม่พันธุ์บนกระดานจับคู่ Onlysheeps + tombstones',
    keyColumns: 'listingId, ownerFarmId, name, breed, gender, woolMicron, fleeceYieldKg, publishedAt',
  },
  {
    tableName: 'webFormRecords',
    primaryKey: 'id',
    accessScope: 'Web Form -> Server DB + Google Sheet (บันทึกฟอร์มเว็บ)',
    purpose: 'บันทึกข้อมูลจากแบบฟอร์มหน้าเว็บและซิงค์เข้า Google Sheet ทันทีผ่าน Apps Script',
    keyColumns: 'id, submittedAt, farmName, recorderName, province, sheepEarTag, sheepName, breed, weightKg, woolMicron, syncedToSheet',
  },
];

export function buildWebFormSheetTab(records: WebFormSubmission[]): SheetTabPayload {
  return {
    sheetName: WEB_FORM_SHEET_NAME,
    headers: WEB_FORM_SHEET_COLUMNS.map(col => col.header),
    rows: records.map(r => [
      safeCell(r.id),
      safeCell(r.submittedAt),
      safeCell(r.farmName),
      safeCell(r.recorderName),
      safeCell(r.province),
      safeCell(r.sheepEarTag),
      safeCell(r.sheepName),
      safeCell(r.breed),
      r.gender === 'male' ? 'เพศผู้' : 'เพศเมีย',
      safeCell(r.ageMonths),
      safeCell(r.weightKg),
      safeCell(r.woolMicron),
      safeCell(r.dailyFeedKg),
      safeCell(r.notes),
    ]),
  };
}

export const APPS_SCRIPT_TEMPLATE = `var CLOUD_STATE_SHEET = '_OvisproCloudState';
var FORM_SHEET_NAME = 'บันทึกฟอร์มเว็บ';
var FORM_HEADERS = ['รหัสอ้างอิง', 'วัน-เวลาบันทึก', 'ชื่อฟาร์ม', 'ผู้บันทึก', 'จังหวัด', 'เบอร์หูแกะ', 'ชื่อแกะ', 'สายพันธุ์', 'เพศ', 'อายุ (เดือน)', 'น้ำหนัก (กก.)', 'ไมครอน (µm)', 'อาหาร (กก./วัน)', 'หมายเหตุ'];
var CHUNK_SIZE = 45000;

function verifyApiKey_(providedKey) {
  var expectedKey = PropertiesService.getScriptProperties().getProperty('OVISPRO_API_KEY');
  if (!expectedKey) return true; // หากยังไม่ได้ตั้ง OVISPRO_API_KEY ใน Script Properties จะเปิดให้ใช้งานก่อน
  return String(providedKey || '') === String(expectedKey);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function readCloudState_(ss) {
  var stateSheet = ss.getSheetByName(CLOUD_STATE_SHEET);
  if (!stateSheet || stateSheet.getLastRow() < 2) {
    return { ok: true, globalRevision: 0, updatedAt: '', cloudState: null };
  }
  var lastRow = stateSheet.getLastRow();
  var rows = stateSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  rows.sort(function(a, b) { return Number(a[3] || 0) - Number(b[3] || 0); });
  var globalRevision = Number(rows[0][0] || 0);
  var updatedAt = String(rows[0][1] || '');
  var parts = [];
  for (var i = 0; i < rows.length; i++) {
    parts.push(String(rows[i][4] || ''));
  }
  var joined = parts.join('');
  return {
    ok: true,
    globalRevision: globalRevision,
    updatedAt: updatedAt,
    cloudState: joined ? JSON.parse(joined) : null
  };
}

function writeCloudState_(ss, cloudStateStr, globalRevision, updatedAt) {
  var stateSheet = ss.getSheetByName(CLOUD_STATE_SHEET);
  if (!stateSheet) {
    stateSheet = ss.insertSheet(CLOUD_STATE_SHEET);
    try { stateSheet.hideSheet(); } catch (e) {}
  } else {
    stateSheet.clearContents();
  }
  var chunks = [];
  for (var i = 0; i < cloudStateStr.length; i += CHUNK_SIZE) {
    chunks.push(cloudStateStr.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length === 0) chunks.push('{}');
  var rows = [['globalRevision', 'updatedAt', 'totalChunks', 'chunkIndex', 'chunkData']];
  for (var j = 0; j < chunks.length; j++) {
    rows.push([Number(globalRevision || 0), String(updatedAt || ''), chunks.length, j, chunks[j]]);
  }
  stateSheet.getRange(1, 1, rows.length, 5).setValues(rows);
}

function appendFormRow_(ss, record) {
  var sheet = ss.getSheetByName(FORM_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(FORM_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, FORM_HEADERS.length).setValues([FORM_HEADERS]);
    sheet.getRange(1, 1, 1, FORM_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1E3F2B')
      .setFontColor('#FAF6EE');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    String(record.id || ''),
    String(record.submittedAt || new Date().toISOString()),
    String(record.farmName || ''),
    String(record.recorderName || ''),
    String(record.province || ''),
    String(record.sheepEarTag || ''),
    String(record.sheepName || ''),
    String(record.breed || ''),
    String(record.genderLabel || (record.gender === 'male' ? 'เพศผู้' : 'เพศเมีย')),
    Number(record.ageMonths || 0),
    Number(record.weightKg || 0),
    Number(record.woolMicron || 0),
    Number(record.dailyFeedKg || 0),
    String(record.notes || '')
  ]);
}

function doGet(e) {
  try {
    var reqKey = e && e.parameter ? e.parameter.apiKey : '';
    if (!verifyApiKey_(reqKey)) {
      return jsonOut_({ ok: false, error: 'Unauthorized: Invalid API Key' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return jsonOut_(readCloudState_(ss));
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(10000);
    var payload = JSON.parse(e.postData.contents);
    if (!verifyApiKey_(payload.apiKey)) {
      return jsonOut_({ ok: false, error: 'Unauthorized: Invalid API Key' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'pull_cloud_state') {
      return jsonOut_(readCloudState_(ss));
    }

    if (payload.action === 'append_form_row' && payload.record) {
      appendFormRow_(ss, payload.record);
      return jsonOut_({ ok: true, sheetName: FORM_SHEET_NAME, recordId: payload.record.id });
    }

    var tabs = payload.tabs || [];
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var sheet = ss.getSheetByName(tab.sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(tab.sheetName);
      } else {
        sheet.clearContents();
      }
      var allRows = [tab.headers].concat(tab.rows || []);
      if (allRows.length > 0 && tab.headers.length > 0) {
        sheet.getRange(1, 1, allRows.length, tab.headers.length).setValues(allRows);
        sheet.getRange(1, 1, 1, tab.headers.length)
          .setFontWeight('bold')
          .setBackground('#1E3F2B')
          .setFontColor('#FAF6EE');
        sheet.setFrozenRows(1);
      }
    }

    if (payload.cloudState) {
      var serialized = typeof payload.cloudState === 'string'
        ? payload.cloudState
        : JSON.stringify(payload.cloudState);
      writeCloudState_(ss, serialized, payload.globalRevision || 0, payload.syncedAt || new Date().toISOString());
    }

    return jsonOut_({ ok: true, farmName: payload.farmName, updatedAt: new Date().toISOString() });
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}`;

export function buildOwnerMasterSheetTabs(
  farms: Array<{
    profile: FarmProfile;
    sheepList: Sheep[];
    ingredients: FeedIngredient[];
    rations: FormulatedRation[];
    logs: FarmLog[];
  }>,
  onlysheepsListings: OnlysheepsListing[],
  webFormRecords?: WebFormSubmission[]
): SheetTabPayload[] {
  const farmSummaryHeaders = [
    'รหัสฟาร์ม (Farm ID)',
    'ชื่อผู้ใช้ (Username)',
    'ชื่อฟาร์ม',
    'เจ้าของฟาร์ม',
    'จังหวัด/ที่ตั้ง',
    'ช่องทางติดต่อ',
    'สายพันธุ์หลัก',
    'จำนวนแกะ (ตัว)',
    'จำนวนวัตถุดิบ',
    'จำนวนสูตรอาหาร',
    'จำนวนบันทึกกิจกรรม',
    'ลิงก์ Sheet ฟาร์ม',
  ];

  const farmSummaryRows = farms.map(f => [
    safeCell(f.profile.farmId),
    safeCell(f.profile.username),
    safeCell(f.profile.farmName),
    safeCell(f.profile.ownerName),
    safeCell(f.profile.location),
    safeCell(f.profile.contact),
    safeCell(f.profile.breedFocus),
    f.sheepList.length,
    f.ingredients.length,
    f.rations.length,
    f.logs.length,
    safeCell(f.profile.googleSheetConfig?.sheetUrl || 'ยังไม่ผูก'),
  ]);

  const allSheepHeaders = [
    'ชื่อฟาร์ม',
    'เบอร์หู',
    'ชื่อเล่นแกะ',
    'สายพันธุ์',
    'เพศ',
    'อายุ (เดือน)',
    'น้ำหนัก (กก.)',
    'ADG (ก./วัน)',
    'คอก',
    'ระยะการผลิต',
    'เกรดขน (µm)',
    'ขน/ปี (กก.)',
    'สุขภาพ',
  ];

  const allSheepRows: (string | number)[][] = [];
  const allIngredientsRows: (string | number)[][] = [];
  const allRationsRows: (string | number)[][] = [];
  const allLogsRows: (string | number)[][] = [];

  for (const f of farms) {
    for (const s of f.sheepList) {
      allSheepRows.push([
        safeCell(f.profile.farmName),
        safeCell(s.earTag),
        safeCell(s.name),
        safeCell(s.breed),
        s.gender === 'male' ? 'เพศผู้' : 'เพศเมีย',
        safeCell(s.ageMonths),
        safeCell(s.weightKg),
        safeCell(s.currentAdgGrams),
        safeCell(s.pen),
        safeCell(s.stage),
        safeCell(s.woolMicron ?? s.woolGrade),
        safeCell(s.fleeceYieldKg),
        safeCell(s.healthStatus),
      ]);
    }
    for (const i of f.ingredients) {
      allIngredientsRows.push([
        safeCell(f.profile.farmName),
        safeCell(i.nameTh),
        safeCell(i.category),
        safeCell(i.dryMatter),
        safeCell(i.crudeProtein),
        safeCell(i.tdn),
        safeCell(i.pricePerKg),
        i.isRoughage ? 'อาหารหยาบ' : 'อาหารข้น/เสริม',
      ]);
    }
    for (const r of f.rations) {
      allRationsRows.push([
        safeCell(f.profile.farmName),
        safeCell(r.name),
        safeCell(r.targetStage),
        safeCell(r.recommendedForWeight),
        safeCell(r.totalAsFedKg),
        safeCell(r.calculatedCpPercent),
        safeCell(r.calculatedTdnPercent),
        safeCell(r.costPerHeadPerDay),
      ]);
    }
    for (const l of f.logs) {
      allLogsRows.push([
        safeCell(f.profile.farmName),
        safeCell(l.date),
        safeCell(l.type),
        safeCell(l.penName),
        safeCell(l.sheepEarTag || l.damEarTag),
        safeCell(l.title),
        safeCell(l.recordedBy),
        safeCell(l.notes),
      ]);
    }
  }

  const onlysheepsRows = onlysheepsListings.map(o => [
    safeCell(o.listingId),
    safeCell(o.farmName),
    safeCell(o.earTag),
    safeCell(o.name),
    safeCell(o.breed),
    o.gender === 'male' ? 'เพศผู้' : 'เพศเมีย',
    safeCell(o.ageMonths),
    safeCell(o.weightKg),
    safeCell(o.woolMicron),
    safeCell(o.fleeceYieldKg),
    safeCell(o.ownerContact),
  ]);

  const baseTabs: SheetTabPayload[] = [
    { sheetName: 'สรุปทุกฟาร์ม', headers: farmSummaryHeaders, rows: farmSummaryRows },
    { sheetName: 'ทะเบียนแกะทุกฟาร์ม', headers: allSheepHeaders, rows: allSheepRows },
    {
      sheetName: 'วัตถุดิบทุกฟาร์ม',
      headers: ['ชื่อฟาร์ม', 'วัตถุดิบ', 'หมวดหมู่', 'DM (%)', 'CP (%)', 'TDN (%)', 'ราคา (฿/กก.)', 'ประเภท'],
      rows: allIngredientsRows,
    },
    {
      sheetName: 'สูตรอาหารทุกฟาร์ม',
      headers: ['ชื่อฟาร์ม', 'ชื่อสูตร', 'ระยะเป้าหมาย', 'น้ำหนัก (กก.)', 'ให้กินสด (กก./วัน)', 'CP (%)', 'TDN (%)', 'ต้นทุน (฿/วัน)'],
      rows: allRationsRows,
    },
    {
      sheetName: 'สมุดบันทึกทุกฟาร์ม',
      headers: ['ชื่อฟาร์ม', 'วันที่', 'ประเภท', 'คอก', 'แกะ', 'กิจกรรม', 'ผู้บันทึก', 'หมายเหตุ'],
      rows: allLogsRows,
    },
    {
      sheetName: 'Onlysheeps ทั้งหมด',
      headers: ['รหัสประกาศ', 'ฟาร์ม', 'เบอร์หู', 'ชื่อแกะ', 'สายพันธุ์', 'เพศ', 'อายุ (เดือน)', 'น้ำหนัก (กก.)', 'ไมครอน (µm)', 'ขน/ปี (กก.)', 'ติดต่อ'],
      rows: onlysheepsRows,
    },
  ];

  if (Array.isArray(webFormRecords)) {
    baseTabs.push(buildWebFormSheetTab(webFormRecords));
  }

  return baseTabs;
}
