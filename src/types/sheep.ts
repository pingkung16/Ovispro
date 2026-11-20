/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SheepStage = 
  | 'wool_lamb'           // ลูกแกะเล็ก (0-3 เดือน / ดูดนม-เลียราง)
  | 'wool_weaning'        // ลูกแกะหย่านม (3-6 เดือน)
  | 'wool_growing'        // แกะรุ่นขน / พัฒนาโครงร่างและต่อมสร้างเส้นขน
  | 'wool_maintenance'    // แกะขนตัวเต็มวัย / บำรุงรักษาเส้นใยขน
  | 'wool_gestation'      // แม่แกะขนอุ้มท้อง (รวมทุกระยะ)
  | 'wool_lactation'      // แม่แกะขนระยะให้นมลูกแกะ
  | 'wool_ram';           // พ่อพันธุ์แกะขน บำรุงความสมบูรณ์พันธุ์

export type IngredientCategory = 
  | 'roughage_fresh'       // อาหารหยาบสด (หญ้าสด)
  | 'roughage_dry'         // อาหารหยาบแห้ง (ฟาง, หญ้าแห้ง)
  | 'roughage_silage'      // พืชหมัก (หญ้าหมัก, ข้าวโพดหมัก)
  | 'concentrate_energy'   // อาหารข้นแหล่งพลังงาน (ข้าวโพด, มันเส้น, รำ)
  | 'concentrate_protein'  // อาหารข้นแหล่งโปรตีน (กากถั่วเหลือง, กากเบียร์)
  | 'byproduct'            // ผลพลอยได้ทางการเกษตร
  | 'mineral_supplement';  // แร่ธาตุและพรีมิกซ์

export interface Pen {
  id: string;
  code: string;            // เช่น "คอก A"
  name: string;            // เช่น "คอก A - แม่พันธุ์ขนละเอียดพิเศษ"
  ageRange: string;        // ① ช่วงอายุ เช่น "18 - 36 เดือน"
  sheepCount: number;      // ② จำนวนตัว เช่น 12 ตัว
  averageWeightKg: number; // ③ น้ำหนักเฉลี่ย เช่น 62.5 กก.
  dailyFeedKg: number;     // ④ ปริมาณอาหารที่ให้ เช่น 2.3 กก./ตัว/วัน
  averageAdgGrams: number; // ⑤ ADG เช่น +180 กรัม/วัน
  purpose: string;         // วัตถุประสงค์ เช่น "ผลิตเส้นใยพรีเมียม < 19 ไมครอน"
  colorTheme?: string;
  notes?: string;
}

export type WoolSoundness = 'strong' | 'weak_base' | 'weak_mid' | 'weak_tip';
export type WoolCrimpStyle = 'dense' | 'medium' | 'loose';
export type WoolHandle = 'soft_greasy' | 'normal' | 'dry_harsh';

export interface Sheep {
  id: string;
  earTag: string;          // รหัสเบอร์หู เช่น SH-001
  name: string;            // ชื่อแกะ
  breed: string;           // สายพันธุ์แกะขน เช่น เมอริโน, ลินคอล์น, แอสคาเนียน, คอร์ริเดล, แรมบูเยต์
  bloodPercentage?: string;// สัดส่วนเลือด เช่น "เมอริโน 100%" หรือ "แรมบูเยต์ 75% + เมอริโน 25%"
  gender: 'male' | 'female';
  birthDate: string;       // YYYY-MM-DD
  ageMonths: number;
  weightKg: number;        // น้ำหนักปัจจุบัน (กก.)
  currentAdgGrams: number; // ADG จริง (อัตราการเจริญเติบโต กรัม/วัน)
  adgTargetGrams?: number; // ADG เป้าหมาย
  adgExplanation?: string; // คำอธิบายภาษาไทยเข้าใจง่ายสำหรับเกษตรกร
  stage: SheepStage;
  bcs: number;             // Body Condition Score (1.0 - 5.0)
  penId: string;           // รหัสคอกที่สังกัด เช่น "pen-a"
  pen: string;             // ชื่อคอก เช่น "คอก A"
  healthStatus: 'healthy' | 'monitoring' | 'sick' | 'pregnant';
  assignedRationId?: string;
  notes?: string;
  avatarColor?: string;
  photoUrl?: string;

  // ข้อมูลสายพันธุ์พ่อแม่ (Pedigree / Lineage)
  sireId?: string;         // รหัสเบอร์หูพ่อพันธุ์
  sireName?: string;       // ชื่อพ่อพันธุ์
  sireBreed?: string;      // สายพันธุ์พ่อ
  damId?: string;          // รหัสเบอร์หูแม่พันธุ์
  damName?: string;        // ชื่อแม่พันธุ์
  damBreed?: string;       // สายพันธุ์แม่

  // ข้อมูลสุขภาพและการป้องกันโรค (Health & Prevention)
  vaccineName?: string;    // วัคซีนล่าสุด เช่น "วัคซีนปากและเท้าเปื่อย (FMD) + เฮโมรายิก"
  vaccineLastDate?: string;// วันที่ฉีดวัคซีนล่าสุด
  dewormName?: string;     // ยาถ่ายพยาธิ เช่น "ไอเวอร์เมกติน (Ivermectin) ชนิดฉีด"
  dewormLastDate?: string; // วันที่ถ่ายพยาธิล่าสุด
  hoofTrimLastDate?: string;// วันที่ตัดแต่งกีบล่าสุด
  healthNotes?: string;

  // ผลิตภัณฑ์จากแกะ (Wool Performance & Pen-Side Evaluation)
  woolGrade?: string;      // เกรดขน เช่น 'ซูเปอร์ไฟน์ (< 19 µm)', 'ไฟน์ (19-21 µm)', 'มีเดียม (22-26 µm)', 'ลองวูล (> 26 µm)'
  woolMicron?: number;     // ขนาดเส้นใยไมครอน (µm) เช่น 18.5
  woolStapleLengthCm?: number; // ความยาวช่อขนตามธรรมชาติ (ซม. / วัดตำแหน่งกลางลำตัว Mid-side) เช่น 10.5
  fleeceYieldKg?: number;  // น้ำหนักขนดิบรวม (GFW รวม กก./ปี)
  gfwBodyKg?: number;      // น้ำหนักขนดิบส่วนลำตัว (Greasy Fleece Weight - Body กก.)
  gfwSkirtingsKg?: number; // น้ำหนักเศษขนชายท้องและขนขา (Skirtings / Belly & Legs กก.)
  woolSoundness?: WoolSoundness; // ความแข็งแรงเบื้องต้น (Hand-break test)
  woolCrimpStyle?: WoolCrimpStyle; // ความถี่และสม่ำเสมอของลอนขน (Crimp)
  woolHandle?: WoolHandle; // ความนุ่มลื่นและไขขน (Handle / Grease)
  lastShearingDate?: string; // วันที่ตัดขนล่าสุด (YYYY-MM-DD)
  woolColor?: string;      // สีขน เช่น ขาวบริสุทธิ์, ขาวนวล
  crimpPerInch?: number;   // จำนวนลอนคลื่นต่อนิ้ว เช่น 12
  fleeceQualityRating?: number; // คะแนนคุณภาพเส้นใย (1-5 ดาว)

  // ข้อมูลฟาร์มพันธมิตรและจุดขายสำหรับ Onlysheeps
  isPartnerFarm?: boolean;     // true = แกะจากฟาร์มพันธมิตรอื่น
  farmName?: string;           // ชื่อฟาร์มเจ้าของแกะ
  farmLocation?: string;       // จังหวัด / อำเภอของฟาร์ม
  ownerContact?: string;       // เบอร์โทร / Line ID ติดต่อเจ้าของฟาร์ม
  romanticBio?: string;        // คำแนะนำตัวสไตล์โรแมนติกบน Onlysheeps
  breedingHighlight?: string;  // จุดเด่นด้านการผสมพันธุ์และพันธุกรรม
  lambingRatePct?: string;     // อัตราการให้ลูกแฝด / ความสมบูรณ์พันธุ์
}

export interface FeedIngredient {
  id: string;
  nameTh: string;
  nameEn: string;
  category: IngredientCategory;
  dryMatter: number;       // % DM (วัตถุแห้ง)
  crudeProtein: number;    // % CP (โปรตีนหยาบ บนฐานวัตถุแห้ง DM basis)
  tdn: number;             // % TDN (โภชนะย่อยได้ทั้งหมด DM basis)
  calcium: number;         // % Ca (แคลเซียม)
  phosphorus: number;      // % P (ฟอสฟอรัส)
  pricePerKg: number;      // ราคาบาทต่อกิโลกรัม (สด/As-fed)
  maxInclusionPct?: number;// เพดานการใช้สูงสุดในสูตร (%) เช่น ยูเรียไม่เกิน 1%
  isRoughage: boolean;     // อาหารหยาบ หรืออาหารข้น
  description?: string;
}

export interface NutrientRequirement {
  dmiKgMin: number;        // ปริมาณกินได้วัตถุแห้งขั้นต่ำ (กก./วัน)
  dmiKgMax: number;        // ปริมาณกินได้วัตถุแห้งสูงสุด (กก./วัน)
  dmiPercentBw: number;    // % ต่อน้ำหนักตัว เช่น 2.8% - 3.5%
  cpPercent: number;       // % โปรตีนหยาบเป้าหมายในอาหารรวม (DM basis)
  cpGrams: number;         // โปรตีนหยาบที่ต้องการ (กรัม/วัน)
  tdnPercent: number;      // % TDN พลังงานเป้าหมาย
  tdnGrams: number;        // TDN ที่ต้องการ (กรัม/วัน)
  calciumPercent: number;  // % Ca เป้าหมาย
  phosphorusPercent: number;// % P เป้าหมาย
  targetRcRatio: string;   // สัดส่วนอาหารหยาบ:อาหารข้นที่แนะนำ เช่น "60:40"
}

export interface RationIngredientItem {
  ingredientId: string;
  percentInMix: number;    // สัดส่วนในสูตร (%)
  asFedKgPerHead?: number; // น้ำหนักสดที่ต้องให้ต่อตัวต่อวัน (กก.)
}

export interface FormulatedRation {
  id: string;
  name: string;
  description: string;
  targetStage: SheepStage;
  recommendedForWeight: number; // กก.
  items: RationIngredientItem[];
  // Calculated stats
  totalAsFedKg: number;    // ปริมาณสดรวม (กก./ตัว/วัน)
  totalDmKg: number;       // ปริมาณวัตถุแห้งรวม (กก./ตัว/วัน)
  calculatedCpPercent: number;
  calculatedTdnPercent: number;
  calculatedCaPercent: number;
  calculatedPPercent: number;
  roughagePercent: number; // สัดส่วนอาหารหยาบในสูตร %
  concentratePercent: number; // สัดส่วนอาหารข้นในสูตร %
  costPerKgMix: number;    // ต้นทุนต่อ กก. อาหารสด (บาท)
  costPerHeadPerDay: number;// ต้นทุนต่อตัวต่อวัน (บาท)
  createdAt: string;
}

// กิจกรรมฟาร์มหลักตามแบบบันทึกงานแกะขน
export type FarmActivityType = 
  | 'weight'          // 1. ชั่งน้ำหนัก
  | 'feeding'         // 2. การให้อาหาร
  | 'health_vaccine'  // 3. การฉีดวัคซีน + ถ่ายพยาธิ
  | 'breeding'        // 4. การผสมพันธุ์
  | 'lambing'         // 5. การคลอด
  | 'shearing';       // 6. ตัดขนและชั่งน้ำหนักขน (กก.)

export interface FarmLog {
  id: string;
  date: string;            // วันที่เก็บข้อมูล (YYYY-MM-DD)
  time?: string;           // เวลาที่ให้ (เช่น "07:30 น.")
  type: FarmActivityType;
  sheepId?: string;        // ตัวที่เก็บข้อมูล
  sheepEarTag?: string;
  penId?: string;          // คอกที่เก็บข้อมูล
  penName?: string;
  title: string;           // หัวข้อสรุปกิจกรรม
  recordedBy: string;      // ผู้บันทึก / ผู้ฉีด

  // 1. ฟิลด์ชั่งน้ำหนัก
  weightKg?: number;       // น้ำหนัก (กก.)

  // 2. ฟิลด์การให้อาหาร
  feedRationName?: string; // สูตรอาหารที่ให้
  feedAmountKg?: number;   // ปริมาณที่ให้ (กก./คอก หรือ กก./ตัว)

  // 3. ฟิลด์วัคซีน + ถ่ายพยาธิ
  vaccineOrMedicineName?: string; // ชนิดวัคซีนหรือยา
  treatmentDose?: string;         // ปริมาณโดส เช่น "2 มล. ใต้ผิวหนัง"
  administratorName?: string;     // ผู้ฉีด

  // 4. ฟิลด์การผสมพันธุ์
  estrusStartDate?: string;       // วันที่เริ่มมีอาการติดสัด
  matingDate?: string;            // วันที่ผสม
  sireBreedAndTag?: string;       // พันธุ์และรหัสพ่อพันธุ์ที่นำมาผสม

  // 5. ฟิลด์การคลอด
  damEarTag?: string;             // ตัวแม่ที่คลอด
  lambCount?: number;             // จำนวนลูกแกะที่คลอด
  lambGenders?: string;           // เพศลูกแกะ เช่น "ผู้ 1, เมีย 1"
  lambSurvivalRate?: string;      // อัตราการรอด เช่น "100% (รอดทั้งหมด)"

  // 6. ฟิลด์ตัดขน / น้ำหนักขน (กก.) & ข้อมูลซิงค์ไปยังทะเบียนแกะ
  woolWeightKg?: number;          // น้ำหนักขนรวมที่ตัดได้ (กก.)
  woolBodyKg?: number;            // น้ำหนักขนลำตัว (กก.)
  woolSkirtingsKg?: number;       // น้ำหนักเศษขนชายท้องและขา (กก.)
  woolStapleLengthCm?: number;    // ความยาวช่อขนที่วัดได้ (ซม.)
  woolMicron?: number;            // ความละเอียดเส้นใย (µm)
  woolGrade?: string;             // เกรดขน
  woolSoundness?: WoolSoundness;
  woolCrimpStyle?: WoolCrimpStyle;
  woolHandle?: WoolHandle;
  healthSubType?: 'vaccine' | 'deworm' | 'both' | 'hoof';
  healthStatusAfter?: Sheep['healthStatus'];
  feedRationId?: string;

  notes?: string;
}

export interface SheepBreedInfo {
  id: string;
  rank: number;
  isTopRecommended?: boolean;
  recommendationReason?: string;
  nameTh: string;
  nameEn: string;
  origin: string;
  type: 'fine_wool' | 'medium_wool' | 'long_wool';
  typeLabel: string;
  categoryGroup: 'wool';
  woolGrade: string;
  fleeceWeightKg: string;
  adultRamWeightKg: string;
  adultEweWeightKg: string;
  averageAdgGrams: string;
  weaningWeightKg: string;
  twinningRatePct: string; // ร้อยละการให้ลูก/คอก
  highlightFeatures: string[];
  climateAdaptation: string;
  feedingStrategy: string;
  suitabilityForThaiFarms: string;
  colorTheme: string;
  photoUrl?: string;
}

export interface CommercialEconomics {
  feedConversionRatio: number;
  costPerKgGain: number;
  liveWeightPricePerKg: number;
  dailyWeightGainKg: number;
  dailyRevenuePerHead: number;
  dailyNetMarginPerHead: number;
  monthlyNetMarginPerHead: number;
}

export interface FarmGoogleSheetConfig {
  sheetUrl?: string;
  appsScriptWebhookUrl?: string;
  lastSyncedAt?: string;
}

export interface FarmProfile {
  farmId: string;
  username: string;
  farmName: string;
  ownerName: string;
  location: string;
  contact: string;
  breedFocus: string;
  isSeedFarm?: boolean;
  googleSheetConfig?: FarmGoogleSheetConfig;
  updatedAt?: string;
}

export interface PublicFarmSummary {
  farmId: string;
  username: string;
  farmName: string;
  location: string;
  breedFocus: string;
  sheepCount: number;
}

export interface PublicPlatformOverview {
  totalFarms: number;
  totalNetworkSheep: number;
  onlysheepsCount: number;
  farmDirectory: PublicFarmSummary[];
}

export interface OnlysheepsListing extends Sheep {
  listingId: string;
  ownerFarmId: string;
  publishedAt: string;
}

export interface OnlysheepsMatchRecord {
  id: string;
  sheep: OnlysheepsListing;
  matchedAt: string;
  matchType: 'like' | 'super_kiss';
  synergyNote: string;
  scheduledNote?: string;
}

export interface LiveShareReport {
  shareId: string;
  scope: 'farm' | 'hub';
  updatedAt: string;
  farmName: string;
  ownerName: string;
  location: string;
  totalSheep: number;
  totalIngredients: number;
  totalRations: number;
  totalLogs: number;
  pens: Pen[];
  rations: FormulatedRation[];
  ingredients: FeedIngredient[];
  recentLogs: FarmLog[];
  publicOverview?: PublicPlatformOverview;
}

export interface OwnerSheetTab {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface OwnerMasterSheetData {
  ownerEmail: string;
  generatedAt: string;
  ownerSheetConfig: FarmGoogleSheetConfig;
  summary: {
    totalFarms: number;
    totalSheep: number;
    totalIngredients: number;
    totalRations: number;
    totalLogs: number;
    totalOnlysheeps: number;
  };
  tabs: OwnerSheetTab[];
}

export interface WebFormSubmission {
  id: string;
  submittedAt: string;
  farmName: string;
  recorderName: string;
  province: string;
  sheepEarTag: string;
  sheepName: string;
  breed: string;
  gender: 'male' | 'female';
  ageMonths: number;
  weightKg: number;
  woolMicron: number;
  dailyFeedKg: number;
  notes?: string;
  syncedToSheet: boolean;
}

export interface SyncStateResponse {
  changed: boolean;
  revision: number;
  globalRevision: number;
  updatedAt?: string;
  cloudSyncConfigured?: boolean;
  overview?: PublicPlatformOverview;
  onlysheepsListings?: OnlysheepsListing[];
  webFormRecords?: WebFormSubmission[];
  workspace?: {
    profile: FarmProfile;
    pens: Pen[];
    sheepList: Sheep[];
    ingredients: FeedIngredient[];
    rations: FormulatedRation[];
    logs: FarmLog[];
    matches: OnlysheepsMatchRecord[];
  };
  ownerData?: OwnerMasterSheetData;
}
