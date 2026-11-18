/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  FeedIngredient,
  FormulatedRation,
  FarmLog,
  Sheep,
  Pen,
  SheepStage,
  FarmProfile,
  OnlysheepsListing,
} from '../types/sheep.ts';
import { getBreedPhoto } from './breedPhotos.ts';

export const DEFAULT_PENS_TEMPLATE: Pen[] = [
  {
    id: 'pen-a',
    code: 'คอก A',
    name: 'คอก A - แม่พันธุ์เมอริโน แฮมป์เชียร์ และดอร์เซท',
    ageRange: '18 - 36 เดือน',
    sheepCount: 0,
    averageWeightKg: 65.0,
    dailyFeedKg: 2.3,
    averageAdgGrams: 175,
    purpose: 'บำรุงแม่พันธุ์ขนละเอียด-ปานกลาง และเตรียมความพร้อมก่อนผสมพันธุ์',
    notes: 'โรงเรือนคอกไม้ยกพื้นสูง แห้งสนิท ระบายอากาศดี มีแปลงหญ้าแพงโกล่าแทะเล็ม',
  },
  {
    id: 'pen-b',
    code: 'คอก B',
    name: 'คอก B - แกะรุ่นสร้างเส้นใยขนและโครงสร้าง',
    ageRange: '7 - 15 เดือน',
    sheepCount: 0,
    averageWeightKg: 39.5,
    dailyFeedKg: 1.8,
    averageAdgGrams: 220,
    purpose: 'พัฒนาต่อมรากขน กระดูก และกล้ามเนื้อในแกะรุ่น 3 สายพันธุ์หลัก',
    notes: 'เสริมโปรตีน 14–15% พร้อมแร่ธาตุกำมะถันเพื่อสังเคราะห์เคราตินเส้นใยขน',
  },
  {
    id: 'pen-c',
    code: 'คอก C',
    name: 'คอก C - พ่อพันธุ์หลักประจำฟาร์ม (Merino · Hampshire · Dorset)',
    ageRange: '24 - 48 เดือน',
    sheepCount: 0,
    averageWeightKg: 102.0,
    dailyFeedKg: 3.2,
    averageAdgGrams: 195,
    purpose: 'พ่อพันธุ์คุมฝูง รักษาความสมบูรณ์พันธุ์ และคัดถ่ายทอดคุณภาพเส้นใยขน',
    notes: 'คอกไม้แยกสัดส่วน ปลอดโปร่ง ป้องกันการชนกัน ให้หญ้าแห้งและแร่ธาตุสมดุล',
  },
  {
    id: 'pen-d',
    code: 'คอก D',
    name: 'คอก D - แม่แกะขนระยะอุ้มท้องและให้นมลูก',
    ageRange: '20 - 42 เดือน',
    sheepCount: 0,
    averageWeightKg: 71.0,
    dailyFeedKg: 3.4,
    averageAdgGrams: 165,
    purpose: 'ผลิตน้ำนมเข้มข้นให้ลูกแกะขน และป้องกันแม่แกะขนร่วงโทรมหลังคลอด',
    notes: 'เสริมแคลเซียมและพลังงานเข้มข้น มีคอกอบอุ่นสำหรับลูกแกะแรกเกิด',
  },
];

export const DEFAULT_INGREDIENTS_TEMPLATE: FeedIngredient[] = [
  {
    id: 'ing-1',
    nameTh: 'หญ้าเนเปียร์สดสับ (อายุ 45 วัน)',
    nameEn: 'Napier Grass Fresh Chopped',
    category: 'roughage_fresh',
    dryMatter: 18.0,
    crudeProtein: 9.5,
    tdn: 54.0,
    calcium: 0.38,
    phosphorus: 0.24,
    pricePerKg: 1.2,
    isRoughage: true,
    description: 'อาหารหยาบหลัก มีความน่ากินสูง ตัดที่อายุ 45-50 วัน',
  },
  {
    id: 'ing-2',
    nameTh: 'หญ้าแพงโกล่าแห้ง (เกรด A)',
    nameEn: 'Pangola Grass Hay (Grade A)',
    category: 'roughage_dry',
    dryMatter: 88.0,
    crudeProtein: 8.5,
    tdn: 52.0,
    calcium: 0.35,
    phosphorus: 0.22,
    pricePerKg: 4.8,
    isRoughage: true,
    description: 'หญ้าแห้งกลิ่นหอม ปลอดเชื้อรา ช่วยกระตุ้นการเคี้ยวเอื้องได้ดีเยี่ยม',
  },
  {
    id: 'ing-3',
    nameTh: 'หญ้าหมักเนเปียร์ปากช่อง 1',
    nameEn: 'Napier Pakchong 1 Silage',
    category: 'roughage_silage',
    dryMatter: 25.0,
    crudeProtein: 8.8,
    tdn: 55.0,
    calcium: 0.36,
    phosphorus: 0.23,
    pricePerKg: 2.0,
    isRoughage: true,
    description: 'พืชหมักคุณภาพดี กลิ่นหอมเปรี้ยวอ่อนๆ pH 3.8-4.2 เหมาะสำหรับช่วงแล้ง',
  },
  {
    id: 'ing-4',
    nameTh: 'หญ้ารูซี่สดแปลงแทะเล็ม',
    nameEn: 'Ruzi Grass Fresh Pasture',
    category: 'roughage_fresh',
    dryMatter: 20.0,
    crudeProtein: 8.0,
    tdn: 53.0,
    calcium: 0.32,
    phosphorus: 0.21,
    pricePerKg: 1.0,
    isRoughage: true,
    description: 'หญ้าแปลงปล่อยแทะเล็ม ใบอ่อนนุ่ม แกะชอบแทะเล็ม',
  },
  {
    id: 'ing-5',
    nameTh: 'ข้าวโพดบดละเอียด',
    nameEn: 'Ground Yellow Corn',
    category: 'concentrate_energy',
    dryMatter: 88.0,
    crudeProtein: 8.5,
    tdn: 86.0,
    calcium: 0.03,
    phosphorus: 0.28,
    pricePerKg: 12.5,
    isRoughage: false,
    description: 'แหล่งคาร์โบไฮเดรตและแป้งชั้นเยี่ยม ให้พลังงานสูงเพื่อรักษาน้ำหนักตัว',
  },
  {
    id: 'ing-6',
    nameTh: 'รำข้าวขาวละเอียด',
    nameEn: 'Fine Rice Bran',
    category: 'concentrate_energy',
    dryMatter: 89.0,
    crudeProtein: 13.0,
    tdn: 74.0,
    calcium: 0.07,
    phosphorus: 1.4,
    pricePerKg: 10.0,
    isRoughage: false,
    description: 'มีฟอสฟอรัสและไขมันดี ให้กลิ่นหอมน่ากิน กระตุ้นความอยากอาหาร',
  },
  {
    id: 'ing-7',
    nameTh: 'กากถั่วเหลืองสกัดน้ำมัน (44% CP)',
    nameEn: 'Soybean Meal (44% CP)',
    category: 'concentrate_protein',
    dryMatter: 89.0,
    crudeProtein: 44.5,
    tdn: 81.0,
    calcium: 0.32,
    phosphorus: 0.65,
    pricePerKg: 20.5,
    isRoughage: false,
    description: 'แหล่งโปรตีนและกรดอะมิโนคุณภาพสูง จำเป็นต่อการสร้างโปรตีนเคราตินในเส้นใยขน',
  },
  {
    id: 'ing-8',
    nameTh: 'มันสำปะหลังเส้นสะอาด',
    nameEn: 'Cassava Chips Cleaned',
    category: 'concentrate_energy',
    dryMatter: 87.0,
    crudeProtein: 2.5,
    tdn: 78.0,
    calcium: 0.18,
    phosphorus: 0.12,
    pricePerKg: 8.0,
    isRoughage: false,
    description: 'แหล่งพลังงานราคาประหยัด ผลิตผลในประเทศ ควรผสมร่วมกับแหล่งโปรตีน',
  },
  {
    id: 'ing-9',
    nameTh: 'กากเบียร์เปียกสด',
    nameEn: 'Wet Brewers Grain',
    category: 'byproduct',
    dryMatter: 24.0,
    crudeProtein: 26.0,
    tdn: 75.0,
    calcium: 0.28,
    phosphorus: 0.55,
    pricePerKg: 3.2,
    isRoughage: false,
    description: 'ผลพลอยได้โรงต้มเบียร์ โปรตีนไหลผ่านสูง (RUP) ช่วยเสริมน้ำนมและเส้นขน',
  },
  {
    id: 'ing-10',
    nameTh: 'ใบกระถินป่นแห้ง',
    nameEn: 'Leucaena Leaf Meal',
    category: 'byproduct',
    dryMatter: 89.0,
    crudeProtein: 22.0,
    tdn: 64.0,
    calcium: 1.1,
    phosphorus: 0.25,
    pricePerKg: 6.5,
    isRoughage: false,
    description: 'พืชตระกูลถั่ว โปรตีนและแคลเซียมสูง เป็นแหล่งอาหารธรรมชาติราคาประหยัด',
  },
  {
    id: 'ing-11',
    nameTh: 'พรีมิกซ์แร่ธาตุและกำมะถันสำหรับแกะขน (Copper-Safe)',
    nameEn: 'Wool Sheep Mineral & Sulfur Premix',
    category: 'mineral_supplement',
    dryMatter: 98.0,
    crudeProtein: 0.0,
    tdn: 0.0,
    calcium: 16.0,
    phosphorus: 8.0,
    pricePerKg: 48.0,
    maxInclusionPct: 2.0,
    isRoughage: false,
    description: 'แร่ธาตุรวม วิตามิน และกำมะถันสังเคราะห์เคราติน ควบคุมระดับทองแดงปลอดภัยต่อแกะ (< 10 ppm)',
  },
  {
    id: 'ing-12',
    nameTh: 'ไดแคลเซียมฟอสเฟต (DCP 18% P)',
    nameEn: 'Dicalcium Phosphate (DCP 18% P)',
    category: 'mineral_supplement',
    dryMatter: 99.0,
    crudeProtein: 0.0,
    tdn: 0.0,
    calcium: 21.0,
    phosphorus: 18.0,
    pricePerKg: 28.0,
    maxInclusionPct: 1.5,
    isRoughage: false,
    description: 'เสริมแคลเซียมและฟอสฟอรัส ช่วยสร้างกระดูกและโครงสร้างแกะขน',
  },
  {
    id: 'ing-13',
    nameTh: 'กากน้ำตาล (โมลาส)',
    nameEn: 'Molasses Cane',
    category: 'concentrate_energy',
    dryMatter: 75.0,
    crudeProtein: 3.5,
    tdn: 65.0,
    calcium: 0.8,
    phosphorus: 0.08,
    pricePerKg: 6.0,
    maxInclusionPct: 5.0,
    isRoughage: false,
    description: 'เพิ่มกลิ่นหอม ลดฝุ่นในอาหารข้น ช่วยจับตัวและกระตุ้นจุลินทรีย์ในกระเพาะหมัก',
  },
  {
    id: 'ing-14',
    nameTh: 'ฟางข้าวหมักยูเรีย 3% (ช่วงฤดูแล้ง)',
    nameEn: 'Urea-Treated Rice Straw (3%)',
    category: 'roughage_dry',
    dryMatter: 55.0,
    crudeProtein: 7.2,
    tdn: 48.0,
    calcium: 0.25,
    phosphorus: 0.12,
    pricePerKg: 2.8,
    isRoughage: true,
    description: 'ฟางข้าวยกระดับโปรตีนด้วยยูเรีย ช่วยลดต้นทุนในช่วงขาดแคลนหญ้าสด',
  },
];

export const DEFAULT_RATIONS_TEMPLATE: FormulatedRation[] = [
  {
    id: 'ration-wool-01',
    name: 'สูตรบำรุงเส้นใยขนและเคราติน (Wool Keratin Maintenance)',
    description: 'เน้นโปรตีนคุณภาพและกำมะถันธรรมชาติเพื่อเสริมความเงางามและความเหนียวเส้นใยขนแม่พันธุ์',
    targetStage: 'wool_maintenance',
    recommendedForWeight: 65,
    items: [
      { ingredientId: 'ing-2', percentInMix: 45 },
      { ingredientId: 'ing-1', percentInMix: 25 },
      { ingredientId: 'ing-5', percentInMix: 14 },
      { ingredientId: 'ing-7', percentInMix: 10 },
      { ingredientId: 'ing-6', percentInMix: 4 },
      { ingredientId: 'ing-11', percentInMix: 2 },
    ],
    totalAsFedKg: 2.3,
    totalDmKg: 1.55,
    calculatedCpPercent: 12.6,
    calculatedTdnPercent: 60.5,
    calculatedCaPercent: 0.56,
    calculatedPPercent: 0.35,
    roughagePercent: 70.0,
    concentratePercent: 30.0,
    costPerKgMix: 6.1,
    costPerHeadPerDay: 14.03,
    createdAt: '2026-10-15',
  },
  {
    id: 'ration-wool-02',
    name: 'สูตรแกะรุ่นสร้างต่อมรากขนและโครงสร้าง (Growing Wool Stock)',
    description: 'โปรตีน 14.8% พลังงานสมดุล ช่วยให้ต่อมรากขนพัฒนาเต็มที่ในแกะอายุ 7–15 เดือน',
    targetStage: 'wool_growing',
    recommendedForWeight: 40,
    items: [
      { ingredientId: 'ing-1', percentInMix: 40 },
      { ingredientId: 'ing-5', percentInMix: 24 },
      { ingredientId: 'ing-7', percentInMix: 20 },
      { ingredientId: 'ing-6', percentInMix: 12 },
      { ingredientId: 'ing-13', percentInMix: 2 },
      { ingredientId: 'ing-11', percentInMix: 2 },
    ],
    totalAsFedKg: 1.8,
    totalDmKg: 1.45,
    calculatedCpPercent: 14.8,
    calculatedTdnPercent: 67.5,
    calculatedCaPercent: 0.58,
    calculatedPPercent: 0.36,
    roughagePercent: 40.0,
    concentratePercent: 60.0,
    costPerKgMix: 10.5,
    costPerHeadPerDay: 18.9,
    createdAt: '2026-10-15',
  },
  {
    id: 'ration-wool-05',
    name: 'สูตรพ่อพันธุ์แกะขนสมบูรณ์พันธุ์ (Breeding Wool Ram)',
    description: 'รักษาความสมบูรณ์พันธุ์ ความหนาแน่นของรอยพับผิวหนัง และความแข็งแรงของน้ำเชื้อ',
    targetStage: 'wool_ram',
    recommendedForWeight: 105,
    items: [
      { ingredientId: 'ing-1', percentInMix: 55 },
      { ingredientId: 'ing-2', percentInMix: 20 },
      { ingredientId: 'ing-5', percentInMix: 12 },
      { ingredientId: 'ing-7', percentInMix: 8 },
      { ingredientId: 'ing-10', percentInMix: 3 },
      { ingredientId: 'ing-11', percentInMix: 2 },
    ],
    totalAsFedKg: 4.0,
    totalDmKg: 1.85,
    calculatedCpPercent: 12.2,
    calculatedTdnPercent: 62.5,
    calculatedCaPercent: 0.45,
    calculatedPPercent: 0.29,
    roughagePercent: 75.0,
    concentratePercent: 25.0,
    costPerKgMix: 5.2,
    costPerHeadPerDay: 20.8,
    createdAt: '2026-10-12',
  },
];

// รายชื่อแกะคนไทยยุคเจน Z และชื่อสมัยใหม่ (แบ่งชาย/หญิงชัดเจน ไม่ซ้ำซ้อน)
const GENZ_MALE_NAMES = [
  'อั่งเปา', 'ไบร์ท', 'พีพี', 'คิน', 'เจได', 'ฟิวส์', 'กังฟู', 'โฟร์ท', 'สกาย', 'ริว',
  'วิน', 'คอปเตอร์', 'จีโน่', 'เฟิร์ส', 'เบสท์', 'เต้ย', 'ปอนด์', 'นะโม', 'เก้า', 'กาย',
  'มิกซ์', 'ภูมิ', 'อาร์ต', 'ซัน', 'แทน', 'ต้นน้ำ', 'ข้าวปั้น', 'นนท์', 'บีม', 'แบงค์',
  'ติวเตอร์', 'กัปตัน', 'พอร์ช', 'มาร์ค', 'ภูผา', 'นิว', 'ปั้นจั่น', 'โอม', 'ไนซ์', 'เคน',
  'แม็ค', 'ชิลล์', 'ปลื้ม', 'ยูโร', 'ต้นกล้า', 'จูเนียร์', 'สตางค์', 'อชิ', 'นาวิน', 'ไทเกอร์',
  'คิว', 'ธีร์', 'เปรม', 'โอ๊ต', 'มิวสิค', 'ออฟ', 'เจเจ', 'บอส', 'ลูคัส', 'ไทม์',
  'นีโอ', 'เซ็นต์', 'พูห์', 'มาร์ติน',
];

const GENZ_FEMALE_NAMES = [
  'มินนี่', 'น้ำปั่น', 'ไอติม', 'นานา', 'ปันปัน', 'ยูจิน', 'โซดา', 'มะปราง', 'แบมแบม', 'ออมสิน',
  'พรีม', 'ฟิล์ม', 'ชาเย็น', 'โอปอล์', 'นิทาน', 'เมเปิ้ล', 'อิงฟ้า', 'ตังเม', 'โบนัส', 'ขนมผิง',
  'แพทตี้', 'พั้นช์', 'อะตอม', 'มีมี่', 'น้ำชา', 'โมจิ', 'ลูกตาล', 'พาย', 'แครอท', 'มะลิ',
  'ลิลลี่', 'เฌอปราง', 'พิมพ์', 'เบลล์', 'จินนี่', 'กีต้าร์', 'พราว', 'ใบบัว', 'ข้าวหอม', 'น้ำขิง',
  'ไข่มุก', 'เชอร์รี่', 'อันดา', 'ปลายฟ้า', 'วุ้นเส้น', 'แตงโม', 'กาแฟ', 'เฟิร์น', 'ชมพู่', 'นีน่า',
  'มายด์', 'ฟ้าใส', 'บัว', 'มุกดา', 'จีน่า', 'การ์ตูน', 'พลอย', 'ใบเฟิร์น', 'พิม', 'น้ำมนต์',
  'ไพลิน', 'องุ่น', 'ข้าวฟ่าง', 'น้ำเหนือ', 'แพม', 'เนย', 'พิกเซล', 'มาการอง', 'ลาเต้', 'มัทฉะ',
];

const BREED_CYCLE = [
  'เมอริโน (Merino)',
  'แฮมป์เชียร์ (Hampshire)',
  'ดอร์เซท (Dorset)',
];

const VACCINES = [
  'วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD) + โรคแท้งติดต่อ',
  'วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD)',
  'วัคซีนป้องกันโรคแท้งติดต่อ',
];

const DEWORMERS = [
  'Ivermectin (ไอเวอร์เมกติน 1%)',
  'Albendazole (อัลเบนดาโซล)',
];

const SIRE_GENZ_POOL = ['พี่ไททัน', 'พี่จูปิเตอร์', 'พี่ฟาโรห์', 'พี่คิงคอง', 'พี่ซีซาร์', 'พี่อาโป'];
const DAM_GENZ_POOL = ['แม่มะลิ', 'แม่พิกุล', 'แม่ไข่มุก', 'แม่ใบเตย', 'แม่ชบา', 'แม่น้ำเพชร'];

interface SeedFarmSpec {
  farmId: string;
  username: string;
  passwordPlain: string;
  farmName: string;
  ownerName: string;
  location: string;
  contact: string;
  breedFocus: string;
  tagPrefix: string;
  penCounts: { a: number; b: number; c: number; d: number };
  nameOffsetM: number;
  nameOffsetF: number;
}

const FARM_SPECS: SeedFarmSpec[] = [
  {
    farmId: 'farm-inthanon',
    username: 'inthanon',
    passwordPlain: 'int1234',
    farmName: 'ฟาร์มดอยอินทนนท์วูล',
    ownerName: 'คุณธนภัทร (พีท)',
    location: 'จ.เชียงใหม่ (อ.จอมทอง)',
    contact: 'Line: @inthanonwool · 081-924-5588',
    breedFocus: 'Merino · Dorset · Hampshire',
    tagPrefix: 'INTH',
    penCounts: { a: 9, b: 9, c: 4, d: 6 }, // 28 ตัว
    nameOffsetM: 0,
    nameOffsetF: 0,
  },
  {
    farmId: 'farm-khaoyai',
    username: 'khaoyai',
    passwordPlain: 'kho1234',
    farmName: 'เขาใหญ่เมอริโนแรนช์',
    ownerName: 'คุณกมลชนก (แป้ง)',
    location: 'จ.นครราชสีมา (ปากช่อง)',
    contact: 'Line: @khaoyairam · 089-412-7733',
    breedFocus: 'Hampshire · Merino · Dorset',
    tagPrefix: 'KY',
    penCounts: { a: 10, b: 10, c: 5, d: 7 }, // 32 ตัว
    nameOffsetM: 12,
    nameOffsetF: 14,
  },
  {
    farmId: 'farm-suanphueng',
    username: 'suanphueng',
    passwordPlain: 'sua1234',
    farmName: 'ฟาร์มวูลละมุน สวนผึ้ง',
    ownerName: 'คุณศุภกฤต (ต้นน้ำ)',
    location: 'จ.ราชบุรี (สวนผึ้ง)',
    contact: 'Line: @woollamoon · 092-558-1919',
    breedFocus: 'Merino · Dorset',
    tagPrefix: 'SP',
    penCounts: { a: 7, b: 7, c: 3, d: 5 }, // 22 ตัว
    nameOffsetM: 24,
    nameOffsetF: 28,
  },
  {
    farmId: 'farm-monjam',
    username: 'monjam',
    passwordPlain: 'mon1234',
    farmName: 'ม่อนแจ่มดอร์เซทฟาร์ม',
    ownerName: 'คุณพิมพ์ชนก (พริม)',
    location: 'จ.เชียงใหม่ (แม่ริม)',
    contact: 'Line: @monjamdorset · 086-771-2240',
    breedFocus: 'Dorset · Merino',
    tagPrefix: 'MJ',
    penCounts: { a: 6, b: 5, c: 3, d: 4 }, // 18 ตัว
    nameOffsetM: 34,
    nameOffsetF: 40,
  },
  {
    farmId: 'farm-phutubberk',
    username: 'phutubberk',
    passwordPlain: 'phu1234',
    farmName: 'ภูทับเบิกพาสเจอร์แรนช์',
    ownerName: 'คุณณัฐวุฒิ (เจได)',
    location: 'จ.เพชรบูรณ์ (หล่มเก่า)',
    contact: 'Line: @phutubberk_sheep · 087-332-9901',
    breedFocus: 'Hampshire · Dorset · Merino',
    tagPrefix: 'PTB',
    penCounts: { a: 5, b: 6, c: 3, d: 4 }, // 18 ตัว
    nameOffsetM: 42,
    nameOffsetF: 50,
  },
  {
    farmId: 'farm-ovisfarm',
    username: 'Ovisfarm',
    passwordPlain: 'Ovis1234',
    farmName: 'Ovisfarm',
    ownerName: 'เจ้าของฟาร์ม Ovisfarm',
    location: 'จ.นครปฐม (ศาลายา)',
    contact: 'Line: @ovisfarm_th',
    breedFocus: 'Merino · Hampshire · Dorset',
    tagPrefix: 'OV',
    penCounts: { a: 20, b: 18, c: 10, d: 14 }, // 62 ตัว
    nameOffsetM: 6,
    nameOffsetF: 8,
  },
];

function buildSheepForSpec(spec: SeedFarmSpec): Sheep[] {
  const result: Sheep[] = [];
  let seq = 1;
  let mIdx = spec.nameOffsetM;
  let fIdx = spec.nameOffsetF;

  const pushSheep = (
    penId: 'pen-a' | 'pen-b' | 'pen-c' | 'pen-d',
    penLabel: string,
    gender: 'male' | 'female',
    idxInPen: number
  ) => {
    const breed = BREED_CYCLE[(seq + idxInPen) % BREED_CYCLE.length];
    const name =
      gender === 'male'
        ? GENZ_MALE_NAMES[mIdx++ % GENZ_MALE_NAMES.length]
        : GENZ_FEMALE_NAMES[fIdx++ % GENZ_FEMALE_NAMES.length];
    const earTag = `${spec.tagPrefix}-${String(seq).padStart(3, '0')}`;

    const isMerino = breed.includes('เมอริโน');
    const isHampshire = breed.includes('แฮมป์เชียร์');

    let stage: SheepStage = 'wool_maintenance';
    let ageMonths = 22 + (seq % 12);
    let weightKg = isHampshire ? 72 + (seq % 7) : isMerino ? 60 + (seq % 6) : 65 + (seq % 6);
    let adg = isHampshire ? 225 : isMerino ? 175 : 195;
    let healthStatus: Sheep['healthStatus'] = 'healthy';
    let rationId = 'ration-wool-01';

    if (penId === 'pen-b') {
      stage = 'wool_growing';
      ageMonths = 8 + (seq % 7);
      weightKg = isHampshire ? 42 + (seq % 5) : 35 + (seq % 5);
      adg = isHampshire ? 255 : 215;
      rationId = 'ration-wool-02';
    } else if (penId === 'pen-c') {
      stage = 'wool_ram';
      ageMonths = 26 + (seq % 16);
      weightKg = isHampshire ? 105 + (seq % 8) : isMerino ? 90 + (seq % 6) : 96 + (seq % 7);
      adg = isHampshire ? 240 : 195;
      rationId = 'ration-wool-05';
    } else if (penId === 'pen-d') {
      stage = seq % 2 === 0 ? 'wool_lactation' : 'wool_gestation';
      healthStatus = seq % 2 === 0 ? 'healthy' : 'pregnant';
      ageMonths = 24 + (seq % 14);
      weightKg = isHampshire ? 76 + (seq % 6) : 66 + (seq % 5);
      adg = 170;
      rationId = 'ration-wool-01';
    }

    const woolMicron = isMerino
      ? Number((17.6 + ((seq % 5) * 0.3)).toFixed(1))
      : isHampshire
      ? Number((23.0 + ((seq % 5) * 0.5)).toFixed(1))
      : Number((21.8 + ((seq % 5) * 0.4)).toFixed(1));

    const fleeceYieldKg = isMerino
      ? Number((6.4 + ((seq % 4) * 0.4)).toFixed(1))
      : isHampshire
      ? Number((4.3 + ((seq % 4) * 0.3)).toFixed(1))
      : Number((4.8 + ((seq % 4) * 0.3)).toFixed(1));

    const woolGrade = isMerino
      ? `ซูเปอร์ไฟน์ (${woolMicron} µm)`
      : isHampshire
      ? `มีเดียมวูลหนานุ่ม (${woolMicron} µm)`
      : `ไฟน์-มีเดียมขาวสะอาด (${woolMicron} µm)`;

    result.push({
      id: `${spec.farmId}-sheep-${seq}`,
      earTag,
      name,
      breed,
      bloodPercentage: `${breed.split(' ')[0]} สายเลือดแท้ 100%`,
      gender,
      birthDate: `2024-0${1 + (seq % 8)}-${String(10 + (seq % 18)).padStart(2, '0')}`,
      ageMonths,
      weightKg: Number(weightKg.toFixed(1)),
      currentAdgGrams: adg,
      adgTargetGrams: adg + 10,
      adgExplanation: `ADG +${adg} กรัม/วัน เติบโตสม่ำเสมอ สร้างเส้นใยขนได้เต็มประสิทธิภาพ`,
      stage,
      bcs: penId === 'pen-c' ? 4.0 : 3.5,
      penId,
      pen: penLabel,
      healthStatus,
      assignedRationId: rationId,
      photoUrl: getBreedPhoto(breed),
      sireId: `${spec.tagPrefix}-S0${1 + (seq % 4)}`,
      sireName: SIRE_GENZ_POOL[seq % SIRE_GENZ_POOL.length],
      sireBreed: breed,
      damId: `${spec.tagPrefix}-D0${1 + (seq % 5)}`,
      damName: DAM_GENZ_POOL[seq % DAM_GENZ_POOL.length],
      damBreed: breed,
      vaccineName: VACCINES[seq % VACCINES.length],
      vaccineLastDate: '2026-09-18',
      dewormName: DEWORMERS[seq % DEWORMERS.length],
      dewormLastDate: '2026-09-02',
      hoofTrimLastDate: '2026-10-04',
      woolGrade,
      woolMicron,
      woolStapleLengthCm: isMerino ? 11.2 : 9.6,
      fleeceYieldKg,
      lastShearingDate: '2026-03-10',
      woolColor: isHampshire ? 'ขาวนวลตัดใบหูดำเสน่ห์' : 'ขาวครีมสะอาด',
      crimpPerInch: isMerino ? 14 : 10,
      fleeceQualityRating: 5,
      farmName: spec.farmName,
      farmLocation: spec.location,
      ownerContact: spec.contact,
    });

    seq += 1;
  };

  for (let i = 0; i < spec.penCounts.a; i++) pushSheep('pen-a', 'คอก A', 'female', i);
  for (let i = 0; i < spec.penCounts.b; i++)
    pushSheep('pen-b', 'คอก B', i % 2 === 0 ? 'male' : 'female', i);
  for (let i = 0; i < spec.penCounts.c; i++) pushSheep('pen-c', 'คอก C', 'male', i);
  for (let i = 0; i < spec.penCounts.d; i++) pushSheep('pen-d', 'คอก D', 'female', i);

  return result;
}

export interface SeedFarmFullRecord {
  profile: FarmProfile;
  passwordPlain: string;
  pens: Pen[];
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
}

export const SEED_FARMS: SeedFarmFullRecord[] = FARM_SPECS.map(spec => {
  const sheepList = buildSheepForSpec(spec);
  const ram = sheepList.find(s => s.penId === 'pen-c') || sheepList[0];
  const ewe = sheepList.find(s => s.penId === 'pen-a') || sheepList[1];
  const growing = sheepList.find(s => s.penId === 'pen-b') || sheepList[2];
  const dam = sheepList.find(s => s.penId === 'pen-d') || sheepList[3];

  const pens: Pen[] = DEFAULT_PENS_TEMPLATE.map(p => ({
    ...p,
    sheepCount: sheepList.filter(s => s.penId === p.id).length,
  }));

  const logs: FarmLog[] = [
    {
      id: `${spec.farmId}-log-1`,
      date: '2026-10-30',
      type: 'weight',
      sheepId: ram.id,
      sheepEarTag: `${ram.earTag} (${ram.name})`,
      penId: 'pen-c',
      penName: 'คอก C',
      title: `ชั่งน้ำหนักพ่อพันธุ์ ${ram.name} ประจำสัปดาห์`,
      weightKg: ram.weightKg,
      recordedBy: spec.ownerName,
      notes: `ร่างกายแข็งแรง เส้นขนแน่นดี ADG +${ram.currentAdgGrams} ก./วัน`,
    },
    {
      id: `${spec.farmId}-log-2`,
      date: '2026-10-29',
      time: '07:30 น.',
      type: 'feeding',
      penId: 'pen-a',
      penName: 'คอก A',
      title: 'ให้อาหารบำรุงเส้นใยและเคราตินประจำเช้า',
      feedRationName: 'สูตรบำรุงเส้นใยขนและเคราติน (Wool Keratin Maintenance)',
      feedAmountKg: Number((spec.penCounts.a * 2.3).toFixed(1)),
      recordedBy: spec.ownerName,
      notes: `ให้หญ้าแพงโกล่าแห้ง + อาหารข้นสำหรับแม่พันธุ์ ${spec.penCounts.a} ตัว`,
    },
    {
      id: `${spec.farmId}-log-3`,
      date: '2026-10-26',
      type: 'health_vaccine',
      sheepId: ewe.id,
      sheepEarTag: `${ewe.earTag} (${ewe.name})`,
      penId: 'pen-a',
      penName: 'คอก A',
      title: `ฉีดวัคซีน FMD และถ่ายพยาธิ ${ewe.name}`,
      vaccineOrMedicineName: 'FMD + โรคแท้งติดต่อ · Ivermectin 1%',
      treatmentDose: 'วัคซีน 2 มล. + Ivermectin 1.5 มล.',
      administratorName: 'สัตวแพทย์ประจำฟาร์ม',
      recordedBy: spec.ownerName,
      notes: 'ตรวจสุขภาพกีบสะอาด ไม่มีอาการไข้ พร้อมรับการผสมพันธุ์',
    },
    {
      id: `${spec.farmId}-log-4`,
      date: '2026-10-22',
      type: 'lambing',
      damEarTag: `${dam.earTag} (${dam.name})`,
      penId: 'pen-d',
      penName: 'คอก D',
      title: `บันทึกการคลอดลูกแฝดของแม่ ${dam.name}`,
      lambCount: 2,
      lambGenders: 'เพศผู้ 1 ตัว, เพศเมีย 1 ตัว',
      lambSurvivalRate: '100% (รอดแข็งแรงทั้งคู่)',
      recordedBy: spec.ownerName,
      notes: 'ลูกแกะกินนมน้ำเหลืองภายในชั่วโมงแรก สุขภาพสมบูรณ์',
    },
    {
      id: `${spec.farmId}-log-5`,
      date: '2026-10-19',
      type: 'weight',
      sheepId: growing.id,
      sheepEarTag: `${growing.earTag} (${growing.name})`,
      penId: 'pen-b',
      penName: 'คอก B',
      title: `ติดตามอัตราการเติบโตแกะรุ่น ${growing.name}`,
      weightKg: growing.weightKg,
      recordedBy: spec.ownerName,
      notes: `โครงสร้างเติบโตดี ADG +${growing.currentAdgGrams} ก./วัน`,
    },
  ];

  return {
    profile: {
      farmId: spec.farmId,
      username: spec.username,
      farmName: spec.farmName,
      ownerName: spec.ownerName,
      location: spec.location,
      contact: spec.contact,
      breedFocus: spec.breedFocus,
      isSeedFarm: true,
    },
    passwordPlain: spec.passwordPlain,
    pens,
    sheepList,
    ingredients: DEFAULT_INGREDIENTS_TEMPLATE.map(i => ({ ...i })),
    rations: DEFAULT_RATIONS_TEMPLATE.map(r => ({ ...r })),
    logs,
  };
});

// รายการแกะเด่นที่แต่ละฟาร์มจากทั้ง 6 แห่งเผยแพร่ลง Onlysheeps (ใช้ชื่อคนไทยยุคเจน Z/สมัยใหม่ ทั้งหมด ไม่มี % Match!)
const BIOS_MALE = [
  'ขนนุ่มละเอียดระดับพรีเมียม แถมนิสัยขี้อ้อนเป็นที่สุด พร้อมโอบกอดแม่พันธุ์ให้ได้ลูกขนสวยด้วยรักนะครับ 🐑😘💘',
  'หนุ่มไร้เขา ขนขาวสะอาดสะอ้านเหมือนปุยเมฆ รักเดียวใจเดียวและพร้อมจีบสาวได้ทั้ง 365 วันเลยครับ 🐑😘❤️',
  'หนุ่มเข้มสไตล์ใจดี ล่ำบึ้กแข็งแรง ปกป้องแม่พันธุ์ได้ทั้งคอก พร้อมส่งจุ้บหวานๆ ให้คนที่ปัดขวาครับ 🔥😘💘',
  'หนุ่มโรแมนติกสายชิลล์ ชอบแทะเล็มหญ้าแพงโกล่าใต้แสงจันทร์ แบ่งความนุ่มของขนให้ห่มทุกคืนนะจ๊ะ 🌙🌹🐑',
  'พ่อพันธุ์อารมณ์ดีขนหนาฟู จ่ายลูกโตไวแข็งแรง ใครปัดขวามารับรองคอกมีแต่ความรักแน่นอนครับ 💖🐑',
];

const BIOS_FEMALE = [
  'สาวหูดำหน้าคมแห่งคอกไม้ ขนหนาฟูอบอุ่น มองหาพ่อพันธุ์ขนละเอียดมาสานรักผลิตลูกสายพันธุ์ปังด้วยกันค่ะ 🌹💋',
  'สาวน้อยตัวหอมแก้มชมพู ขนยาวสลวยดุจไหมพรม ใครได้เป็นคู่ครองรับรองหัวใจเต้นแรงทุกเช้าค่ะ 💘🌷',
  'สาวน้อยสายหมอก ยิ้มหวานรักครอบครัว เลี้ยงลูกเก่งและพร้อมรับรักจากหนุ่มแกะอบอุ่นนะคะ 🐑😘🌸',
  'สาวสายหวานติดสัดสม่ำเสมอ อ่อนโยนขี้อ้อน ปัดขวาสิคะ แล้วคิวปิดจะพาเรามาเจอกันที่คอกไม้ 💘😘🌹',
  'แม่พันธุ์อารมณ์ดีขนขาวเนียน น้ำนมดกสุขภาพฟิต พร้อมสร้างครอบครัวแกะสุดคิวท์ด้วยกันค่ะ 💕🐑',
];

export const ONLYSHEEPS_INITIAL_LISTINGS: OnlysheepsListing[] = SEED_FARMS.flatMap((farmRecord, fIdx) => {
  const bestMale = farmRecord.sheepList.find(s => s.gender === 'male' && s.penId === 'pen-c');
  const bestFemale = farmRecord.sheepList.find(s => s.gender === 'female' && s.penId === 'pen-a');
  const secondMale = farmRecord.sheepList.find(
    s => s.gender === 'male' && s.id !== bestMale?.id && s.ageMonths >= 12
  );

  const chosen = [bestMale, bestFemale, secondMale].filter(Boolean) as Sheep[];
  return chosen.slice(0, fIdx < 2 ? 3 : 2).map((sheep, idx) => {
    const isMale = sheep.gender === 'male';
    return {
      ...sheep,
      listingId: `os-${farmRecord.profile.farmId}-${sheep.earTag}`,
      ownerFarmId: farmRecord.profile.farmId,
      publishedAt: '2026-10-30',
      isPartnerFarm: true,
      farmName: farmRecord.profile.farmName,
      farmLocation: farmRecord.profile.location,
      ownerContact: farmRecord.profile.contact,
      breedingHighlight: isMale
        ? `พ่อพันธุ์สายเลือดแท้ ${sheep.breed.split(' ')[0]} โครงสร้างใหญ่ น้ำเชื้อแข็งแรง ถ่ายทอดขนคุณภาพสม่ำเสมอ`
        : `แม่พันธุ์สุขภาพดี BCS ${sheep.bcs.toFixed(1)} เลี้ยงลูกเก่ง น้ำนมดก รอบติดสัดแม่นยำ`,
      lambingRatePct: isMale ? 'อัตราผสมติดรอบแรกสูง · จ่ายลูกโตไว' : 'คลอดแฝดเก่ง · อัตราการรอดลูกสูง',
      romanticBio: isMale
        ? BIOS_MALE[(fIdx + idx) % BIOS_MALE.length]
        : BIOS_FEMALE[(fIdx + idx) % BIOS_FEMALE.length],
    };
  });
});
