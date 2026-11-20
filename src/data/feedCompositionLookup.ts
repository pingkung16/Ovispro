/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeedIngredient, IngredientCategory } from '../types/sheep';

export interface ResolvedIngredientData extends Omit<FeedIngredient, 'id'> {
  sourceLabel: string;
  matchedFromDatabase: boolean;
  isValidForSheep: boolean;
  rejectionReason?: string;
}

export interface FeedValidationResult {
  isValid: boolean;
  reasonTh?: string;
  blockedCategory?:
    | 'empty_or_invalid'
    | 'human_junk_food'
    | 'beverages'
    | 'meat_animal'
    | 'other_animal_feed'
    | 'toxic_to_sheep'
    | 'unrecognized';
}

interface FeedCatalogEntry {
  keywords: string[];
  nameEn: string;
  category: IngredientCategory;
  dryMatter: number;
  crudeProtein: number;
  tdn: number;
  calcium: number;
  phosphorus: number;
  pricePerKg: number;
  isRoughage: boolean;
  description: string;
}

/**
 * ฐานข้อมูลอ้างอิงคุณค่าทางโภชนะของวัตถุดิบอาหารสัตว์เคี้ยวเอื้อง (กรมปศุสัตว์ & NRC)
 * ใช้คำนวณสัดส่วน % DM, % CP, % TDN, % Ca, % P และจัดหมวดหมู่ให้อัตโนมัติเมื่อพิมพ์ชื่อวัตถุดิบ
 */
const THAI_FEED_COMPOSITION_DB: FeedCatalogEntry[] = [
  // --- หญ้าสดและพืชอาหารสัตว์ ---
  {
    keywords: ['เนเปียร์ปากช่อง', 'ปากช่อง 1', 'ปากช่อง1', 'napier pakchong'],
    nameEn: 'Napier Pakchong 1 Fresh Grass',
    category: 'roughage_fresh',
    dryMatter: 18.5,
    crudeProtein: 10.5,
    tdn: 56.0,
    calcium: 0.40,
    phosphorus: 0.25,
    pricePerKg: 1.3,
    isRoughage: true,
    description: 'หญ้าเนเปียร์พันธุ์ปากช่อง 1 ให้ผลผลิตสูง โปรตีนดีเมื่อตัดที่อายุ 40-45 วัน',
  },
  {
    keywords: ['เนเปียร์', 'napier'],
    nameEn: 'Napier Grass Fresh',
    category: 'roughage_fresh',
    dryMatter: 18.0,
    crudeProtein: 9.5,
    tdn: 54.0,
    calcium: 0.38,
    phosphorus: 0.24,
    pricePerKg: 1.2,
    isRoughage: true,
    description: 'อาหารหยาบหลักสำหรับแกะ มีความน่ากินสูง ควรตัดสับให้ชิ้นพอดีคำ',
  },
  {
    keywords: ['แพงโกล่า', 'pangola'],
    nameEn: 'Pangola Grass Fresh',
    category: 'roughage_fresh',
    dryMatter: 23.0,
    crudeProtein: 9.0,
    tdn: 55.0,
    calcium: 0.36,
    phosphorus: 0.22,
    pricePerKg: 2.0,
    isRoughage: true,
    description: 'หญ้าลำต้นเล็กนุ่ม แกะชอบแทะเล็มและเคี้ยวเอื้องได้ดีมาก',
  },
  {
    keywords: ['รูซี่', 'ruzi'],
    nameEn: 'Ruzi Grass Fresh',
    category: 'roughage_fresh',
    dryMatter: 22.0,
    crudeProtein: 8.5,
    tdn: 53.0,
    calcium: 0.34,
    phosphorus: 0.21,
    pricePerKg: 1.5,
    isRoughage: true,
    description: 'หญ้ารูซี่ทนแล้ง ใบอ่อนนุ่ม เหมาะสำหรับปล่อยแทะเล็มหรือตัดสด',
  },
  {
    keywords: ['กินนีสีม่วง', 'กินนี', 'guinea', 'mombasa', 'มอมบาซา'],
    nameEn: 'Purple Guinea Grass Fresh',
    category: 'roughage_fresh',
    dryMatter: 21.0,
    crudeProtein: 9.8,
    tdn: 54.5,
    calcium: 0.42,
    phosphorus: 0.23,
    pricePerKg: 1.4,
    isRoughage: true,
    description: 'หญ้ากินนีสีม่วง กอโปร่ง ใบดก ย่อยได้ง่ายกว่าหญ้าทรงสูงทั่วไป',
  },
  {
    keywords: ['หญ้าขน', 'para grass', 'paragrass'],
    nameEn: 'Para Grass Fresh',
    category: 'roughage_fresh',
    dryMatter: 20.0,
    crudeProtein: 9.2,
    tdn: 52.0,
    calcium: 0.35,
    phosphorus: 0.20,
    pricePerKg: 1.2,
    isRoughage: true,
    description: 'หญ้าขนสด เติบโตไวในที่ลุ่มชื้น ให้เยื่อใยดี',
  },
  {
    keywords: ['หญ้าหวาน', 'อิสราเอล'],
    nameEn: 'Sweet Napier / Dwarf Napier',
    category: 'roughage_fresh',
    dryMatter: 17.5,
    crudeProtein: 11.2,
    tdn: 57.0,
    calcium: 0.42,
    phosphorus: 0.26,
    pricePerKg: 1.6,
    isRoughage: true,
    description: 'หญ้าหวานลำต้นเตี้ย น้ำตาลสะสมสูง ใบนุ่ม ไร้ขนระคายปากแกะ',
  },
  {
    keywords: ['อะตราตัม', 'atratum', 'ซิกแนล', 'signal'],
    nameEn: 'Atratum / Signal Grass Fresh',
    category: 'roughage_fresh',
    dryMatter: 22.5,
    crudeProtein: 8.2,
    tdn: 52.5,
    calcium: 0.32,
    phosphorus: 0.20,
    pricePerKg: 1.3,
    isRoughage: true,
    description: 'หญ้าทนน้ำขังหรือดินทราย ให้เยื่อใยหยาบช่วยการทำงานของกระเพาะรูเมน',
  },
  {
    keywords: ['ต้นข้าวโพดสด', 'ข้าวโพดสด'],
    nameEn: 'Fresh Corn Forage',
    category: 'roughage_fresh',
    dryMatter: 24.0,
    crudeProtein: 8.0,
    tdn: 61.0,
    calcium: 0.28,
    phosphorus: 0.21,
    pricePerKg: 1.5,
    isRoughage: true,
    description: 'ต้นข้าวโพดสดให้พลังงานจากแป้งในฝักอ่อนและเยื่อใยสมดุล',
  },
  {
    keywords: ['ยอดอ้อย', 'sugarcane top'],
    nameEn: 'Sugarcane Tops Fresh',
    category: 'roughage_fresh',
    dryMatter: 26.0,
    crudeProtein: 6.2,
    tdn: 50.0,
    calcium: 0.30,
    phosphorus: 0.16,
    pricePerKg: 1.0,
    isRoughage: true,
    description: 'ยอดอ้อยสดมีน้ำตาลและเยื่อใยสูง ควรสับละเอียดและเสริมโปรตีนร่วมด้วย',
  },
  {
    keywords: ['ใบหม่อน', 'mulberry'],
    nameEn: 'Mulberry Leaves',
    category: 'roughage_fresh',
    dryMatter: 26.0,
    crudeProtein: 19.5,
    tdn: 66.0,
    calcium: 1.85,
    phosphorus: 0.28,
    pricePerKg: 2.5,
    isRoughage: true,
    description: 'ใบหม่อนสดโปรตีนสูงและย่อยได้ง่าย ช่วยกระตุ้นน้ำนมและการเจริญเติบโต',
  },

  // --- หญ้าแห้งและฟาง ---
  {
    keywords: ['แพงโกล่าแห้ง', 'หญ้าแห้ง'],
    nameEn: 'Pangola / Grass Hay',
    category: 'roughage_dry',
    dryMatter: 88.0,
    crudeProtein: 8.5,
    tdn: 52.0,
    calcium: 0.35,
    phosphorus: 0.22,
    pricePerKg: 4.8,
    isRoughage: true,
    description: 'หญ้าแห้งสะอาด ปลอดเชื้อรา ช่วยกระตุ้นการเคี้ยวเอื้องและลดปัญหาท้องอืด',
  },
  {
    keywords: ['ฟางหมักยูเรีย', 'ฟางปรุงแต่ง', 'urea treated straw'],
    nameEn: 'Urea-Treated Rice Straw',
    category: 'roughage_dry',
    dryMatter: 85.0,
    crudeProtein: 7.5,
    tdn: 48.0,
    calcium: 0.28,
    phosphorus: 0.12,
    pricePerKg: 3.2,
    isRoughage: true,
    description: 'ฟางข้าวหมักยูเรียช่วยเพิ่มโปรตีนและการย่อยได้ของเยื่อใยในหน้าแล้ง',
  },
  {
    keywords: ['ฟางข้าว', 'ฟาง', 'rice straw', 'straw'],
    nameEn: 'Rice Straw (Dry)',
    category: 'roughage_dry',
    dryMatter: 89.0,
    crudeProtein: 4.0,
    tdn: 42.0,
    calcium: 0.25,
    phosphorus: 0.09,
    pricePerKg: 2.2,
    isRoughage: true,
    description: 'เยื่อใยสูง พลังงานและโปรตีนต่ำ ใช้เป็นแหล่งใยอาหารเสริมร่วมกับอาหารข้น',
  },

  // --- พืชหมัก ---
  {
    keywords: ['ข้าวโพดหมัก', 'corn silage'],
    nameEn: 'Corn Silage',
    category: 'roughage_silage',
    dryMatter: 30.0,
    crudeProtein: 8.2,
    tdn: 66.0,
    calcium: 0.28,
    phosphorus: 0.22,
    pricePerKg: 2.2,
    isRoughage: true,
    description: 'ข้าวโพดหมักทั้งต้นและฝัก พลังงานสูงมาก เหมาะกับแม่ให้นมและแกะขุน/รุ่น',
  },
  {
    keywords: ['หญ้าหมัก', 'ไซเลจ', 'silage'],
    nameEn: 'Grass Silage',
    category: 'roughage_silage',
    dryMatter: 25.0,
    crudeProtein: 8.8,
    tdn: 55.0,
    calcium: 0.36,
    phosphorus: 0.22,
    pricePerKg: 1.8,
    isRoughage: true,
    description: 'หญ้าหมักถนอมอาหารไว้ใช้หน้าแล้ง กลิ่นหอมเปรี้ยวอ่อนๆ ความน่ากินสูง',
  },

  // --- อาหารให้โปรตีน ---
  {
    keywords: ['กากถั่วเหลือง', 'soybean meal', 'sbm'],
    nameEn: 'Soybean Meal (44% CP)',
    category: 'concentrate_protein',
    dryMatter: 89.0,
    crudeProtein: 44.0,
    tdn: 81.0,
    calcium: 0.32,
    phosphorus: 0.65,
    pricePerKg: 18.5,
    isRoughage: false,
    description: 'แหล่งโปรตีนคุณภาพสูงสุดและกรดอะมิโนเมไทโอนีนสร้างเคราตินเส้นใยขน',
  },
  {
    keywords: ['กากถั่วลิสง', 'peanut meal'],
    nameEn: 'Peanut Meal',
    category: 'concentrate_protein',
    dryMatter: 90.0,
    crudeProtein: 42.0,
    tdn: 77.0,
    calcium: 0.22,
    phosphorus: 0.56,
    pricePerKg: 15.0,
    isRoughage: false,
    description: 'โปรตีนสูงมาก ความน่ากินดี ต้องเก็บรักษาในที่แห้งป้องกันอะฟลาทอกซิน',
  },
  {
    keywords: ['กากเนื้อในเมล็ดปาล์ม', 'กากเมล็ดปาล์ม', 'pkc', 'palm kernel'],
    nameEn: 'Palm Kernel Cake (PKC)',
    category: 'concentrate_protein',
    dryMatter: 90.0,
    crudeProtein: 16.5,
    tdn: 74.0,
    calcium: 0.28,
    phosphorus: 0.55,
    pricePerKg: 7.5,
    isRoughage: false,
    description: 'โปรตีนปานกลางและเยื่อใยย่อยง่าย แนะนำคุมไม่เกิน 15-20% ในแกะ (ระวังทองแดงสะสม)',
  },
  {
    keywords: ['กากมะพร้าว', 'copra meal', 'coconut meal'],
    nameEn: 'Copra / Coconut Meal',
    category: 'concentrate_protein',
    dryMatter: 90.0,
    crudeProtein: 21.0,
    tdn: 76.0,
    calcium: 0.20,
    phosphorus: 0.60,
    pricePerKg: 9.5,
    isRoughage: false,
    description: 'โปรตีนและพลังงานสมดุล มีกลิ่นหอมชวนกิน ใช้ผสมในสูตรอาหารข้นได้ 10-20%',
  },
  {
    keywords: ['กากเบียร์แห้ง', 'dried brewer'],
    nameEn: "Dried Brewer's Grains",
    category: 'concentrate_protein',
    dryMatter: 90.0,
    crudeProtein: 26.0,
    tdn: 70.0,
    calcium: 0.30,
    phosphorus: 0.55,
    pricePerKg: 9.0,
    isRoughage: false,
    description: 'กากเบียร์อบแห้ง โปรตีนบายพาสสูง เก็บรักษาง่าย เหมาะกับแม่แกะให้นม',
  },
  {
    keywords: ['กากเบียร์', 'brewer'],
    nameEn: "Wet Brewer's Grains",
    category: 'byproduct',
    dryMatter: 24.0,
    crudeProtein: 25.0,
    tdn: 68.0,
    calcium: 0.30,
    phosphorus: 0.52,
    pricePerKg: 2.2,
    isRoughage: false,
    description: 'กากเบียร์เปียก โปรตีนบายพาสสูง กระตุ้นน้ำนมดี ควรใช้ให้หมดภายใน 3-5 วัน',
  },
  {
    keywords: ['ใบกระถินแห้ง', 'กระถินป่น', 'กระถินแห้ง'],
    nameEn: 'Dried Leucaena Leaf Meal',
    category: 'byproduct',
    dryMatter: 89.0,
    crudeProtein: 23.0,
    tdn: 59.0,
    calcium: 1.45,
    phosphorus: 0.24,
    pricePerKg: 6.5,
    isRoughage: true,
    description: 'ใบกระถินแห้งโปรตีนสูงมากและแคลเซียมดี จำกัดไม่เกิน 30-40% ของสูตร (สารมิโมซีน)',
  },
  {
    keywords: ['กระถิน', 'leucaena'],
    nameEn: 'Fresh Leucaena Leaves',
    category: 'byproduct',
    dryMatter: 30.0,
    crudeProtein: 22.0,
    tdn: 60.0,
    calcium: 1.40,
    phosphorus: 0.22,
    pricePerKg: 2.5,
    isRoughage: true,
    description: 'ใบกระถินสดเสริมโปรตีนธรรมชาติและแคลเซียม จำกัดไม่เกิน 50% เพื่อลดสารมิโมซีน',
  },
  {
    keywords: ['แหนแดง', 'azolla'],
    nameEn: 'Fresh Azolla (Water Fern)',
    category: 'concentrate_protein',
    dryMatter: 8.5,
    crudeProtein: 24.0,
    tdn: 55.0,
    calcium: 1.10,
    phosphorus: 0.45,
    pricePerKg: 1.5,
    isRoughage: false,
    description: 'แหนแดงสดโปรตีนสูงมากในรูปวัตถุแห้ง นิยมผึ่งหมาดผสมรำข้าวให้แกะกิน',
  },
  {
    keywords: ['ถั่วคาวาลเคด', 'คาวาลเคด', 'cavalcade', 'ถั่วฮามาต้า', 'ฮามาต้า', 'สไตโล', 'stylo'],
    nameEn: 'Tropical Legume Hay (Cavalcade / Hamata)',
    category: 'roughage_dry',
    dryMatter: 88.0,
    crudeProtein: 14.5,
    tdn: 58.0,
    calcium: 1.15,
    phosphorus: 0.24,
    pricePerKg: 6.5,
    isRoughage: true,
    description: 'พืชตระกูลถั่วอาหารสัตว์ ให้โปรตีนและแคลเซียมสูงกว่าหญ้าทั่วไปอย่างชัดเจน',
  },
  {
    keywords: ['กากเต้าหู้', 'กากถั่วเหลืองเปียก', 'okara'],
    nameEn: 'Soybean Curd Residue (Okara)',
    category: 'byproduct',
    dryMatter: 18.0,
    crudeProtein: 24.0,
    tdn: 76.0,
    calcium: 0.35,
    phosphorus: 0.42,
    pricePerKg: 2.0,
    isRoughage: false,
    description: 'กากเต้าหู้สด ความชื้นสูง โปรตีนย่อยง่าย ผสมร่วมกับอาหารแห้งได้ดี',
  },
  {
    keywords: ['กากถั่วเขียว', 'เปลือกถั่วเขียว'],
    nameEn: 'Mungbean Hulls / Byproduct',
    category: 'concentrate_protein',
    dryMatter: 89.0,
    crudeProtein: 18.5,
    tdn: 64.0,
    calcium: 0.45,
    phosphorus: 0.32,
    pricePerKg: 6.8,
    isRoughage: false,
    description: 'ผลพลอยได้จากถั่วเขียว ให้โปรตีนปานกลางค่อนข้างสูงและเยื่อใยดี',
  },
  {
    keywords: ['ใบมันสำปะหลัง', 'ใบมัน'],
    nameEn: 'Cassava Leaf Hay',
    category: 'concentrate_protein',
    dryMatter: 89.0,
    crudeProtein: 22.5,
    tdn: 62.0,
    calcium: 1.25,
    phosphorus: 0.28,
    pricePerKg: 5.5,
    isRoughage: true,
    description: 'ใบมันสำปะหลังตากแห้ง/อัดเม็ด โปรตีนสูง ต้องตากแห้งสนิทเพื่อสลายไซยาไนด์',
  },
  {
    keywords: ['ยูเรีย', 'urea'],
    nameEn: 'Feed-Grade Urea (NPN)',
    category: 'concentrate_protein',
    dryMatter: 99.0,
    crudeProtein: 281.0,
    tdn: 0.0,
    calcium: 0.0,
    phosphorus: 0.0,
    pricePerKg: 18.0,
    isRoughage: false,
    description: 'แหล่งไนโตรเจนที่ไม่ใช่โปรตีน (NPN) ต้องจำกัดไม่เกิน 1% ของอาหารข้นและผสมให้เข้ากันสนิท',
  },

  // --- อาหารให้พลังงาน ---
  {
    keywords: ['ข้าวโพดบด', 'เมล็ดข้าวโพด', 'ข้าวโพดเม็ด', 'corn grain', 'ground corn'],
    nameEn: 'Ground Corn (Yellow)',
    category: 'concentrate_energy',
    dryMatter: 88.0,
    crudeProtein: 8.8,
    tdn: 88.0,
    calcium: 0.03,
    phosphorus: 0.28,
    pricePerKg: 11.2,
    isRoughage: false,
    description: 'แหล่งพลังงานหลักที่มีค่า TDN สูงที่สุด นิยมบดหยาบผสมอาหารข้น',
  },
  {
    keywords: ['ปลายข้าว', 'broken rice'],
    nameEn: 'Broken Rice',
    category: 'concentrate_energy',
    dryMatter: 89.0,
    crudeProtein: 8.2,
    tdn: 87.0,
    calcium: 0.04,
    phosphorus: 0.16,
    pricePerKg: 12.5,
    isRoughage: false,
    description: 'แป้งย่อยง่ายและให้พลังงานสูง ระวังอย่าให้มากเกินไปเพื่อป้องกันภาวะกรดในกระเพาะ',
  },
  {
    keywords: ['รำละเอียด', 'รำอ่อน', 'fine rice bran'],
    nameEn: 'Fine Rice Bran',
    category: 'concentrate_energy',
    dryMatter: 90.0,
    crudeProtein: 13.0,
    tdn: 74.0,
    calcium: 0.08,
    phosphorus: 1.45,
    pricePerKg: 9.5,
    isRoughage: false,
    description: 'รำข้าวละเอียดมีฟอสฟอรัสสูงมาก ต้องปรับแคลเซียมให้ Ca:P ≥ 2:1 เพื่อกันนิ่วในแกะตัวผู้',
  },
  {
    keywords: ['รำหยาบ', 'รำข้าว', 'rice bran'],
    nameEn: 'Rice Bran',
    category: 'concentrate_energy',
    dryMatter: 90.0,
    crudeProtein: 11.5,
    tdn: 68.0,
    calcium: 0.08,
    phosphorus: 1.25,
    pricePerKg: 8.2,
    isRoughage: false,
    description: 'รำข้าวผสมแกลบบางส่วน ฟอสฟอรัสสูง ต้องเสริมหินปูน/แคลเซียมควบคู่เสมอ',
  },
  {
    keywords: ['มันเส้น', 'มันสำปะหลังเส้น', 'cassava chip'],
    nameEn: 'Cassava Chips (Dried)',
    category: 'concentrate_energy',
    dryMatter: 88.0,
    crudeProtein: 2.5,
    tdn: 82.0,
    calcium: 0.15,
    phosphorus: 0.09,
    pricePerKg: 7.8,
    isRoughage: false,
    description: 'แหล่งพลังงานราคาประหยัด โปรตีนต่ำ ต้องใช้มันตากแห้งสนิทและเสริมกากถั่วเหลืองคู่กัน',
  },
  {
    keywords: ['กากมันแห้ง', 'cassava pulp dried'],
    nameEn: 'Dried Cassava Pulp',
    category: 'byproduct',
    dryMatter: 88.0,
    crudeProtein: 2.2,
    tdn: 68.0,
    calcium: 0.25,
    phosphorus: 0.07,
    pricePerKg: 5.5,
    isRoughage: false,
    description: 'กากมันสำปะหลังแห้ง เก็บได้นาน ให้พลังงานและเยื่อใยย่อยง่าย',
  },
  {
    keywords: ['กากมัน', 'cassava pulp'],
    nameEn: 'Fresh Cassava Pulp',
    category: 'byproduct',
    dryMatter: 22.0,
    crudeProtein: 2.1,
    tdn: 66.0,
    calcium: 0.24,
    phosphorus: 0.06,
    pricePerKg: 1.3,
    isRoughage: false,
    description: 'กากมันสำปะหลังสด ราคาถูก ช่วยลดต้นทุนอาหารพลังงาน ควรเสริมโปรตีนร่วมด้วย',
  },
  {
    keywords: ['กากน้ำตาล', 'molasses'],
    nameEn: 'Cane Molasses',
    category: 'concentrate_energy',
    dryMatter: 75.0,
    crudeProtein: 4.0,
    tdn: 72.0,
    calcium: 0.85,
    phosphorus: 0.08,
    pricePerKg: 6.5,
    isRoughage: false,
    description: 'เพิ่มความน่ากิน ลดฝุ่นในอาหารผสม และกระตุ้นจุลินทรีย์ในกระเพาะรูเมน',
  },
  {
    keywords: ['เปลือกสับปะรด', 'กากสับปะรด', 'pineapple'],
    nameEn: 'Pineapple Peel / Byproduct',
    category: 'byproduct',
    dryMatter: 14.0,
    crudeProtein: 5.8,
    tdn: 67.0,
    calcium: 0.28,
    phosphorus: 0.12,
    pricePerKg: 1.1,
    isRoughage: true,
    description: 'เปลือกสับปะรดความชื้นสูง มีน้ำตาลและเยื่อใยย่อยง่าย ความน่ากินดี',
  },
  {
    keywords: ['เปลือกถั่วเหลือง', 'soy hull', 'soyhull'],
    nameEn: 'Soybean Hulls',
    category: 'concentrate_energy',
    dryMatter: 90.0,
    crudeProtein: 12.0,
    tdn: 77.0,
    calcium: 0.52,
    phosphorus: 0.18,
    pricePerKg: 8.5,
    isRoughage: false,
    description: 'เยื่อใยย่อยได้สูงมาก (Digestible Fiber) ปลอดภัยต่อกระเพาะรูเมนของแกะ',
  },
  {
    keywords: ['กากปาล์ม', 'ทะลายปาล์ม', 'เส้นใยปาล์ม'],
    nameEn: 'Oil Palm Frond / Fiber Byproduct',
    category: 'byproduct',
    dryMatter: 85.0,
    crudeProtein: 5.5,
    tdn: 50.0,
    calcium: 0.35,
    phosphorus: 0.12,
    pricePerKg: 2.8,
    isRoughage: true,
    description: 'เยื่อใยจากปาล์มน้ำมัน เหมาะใช้เสริมสัดส่วนอาหารหยาบในพื้นที่ภาคใต้',
  },
  {
    keywords: ['ข้าวฟ่าง', 'sorghum'],
    nameEn: 'Sorghum Grain',
    category: 'concentrate_energy',
    dryMatter: 89.0,
    crudeProtein: 10.2,
    tdn: 83.0,
    calcium: 0.04,
    phosphorus: 0.30,
    pricePerKg: 10.5,
    isRoughage: false,
    description: 'เมล็ดข้าวฟ่างบด พลังงานสูงใกล้เคียงข้าวโพด ใช้ทดแทนในสูตรอาหารข้นได้',
  },

  // --- วิตามินและแร่ธาตุ ---
  {
    keywords: ['ไดแคลเซียม', 'dicalcium', 'dcp'],
    nameEn: 'Dicalcium Phosphate (DCP)',
    category: 'mineral_supplement',
    dryMatter: 98.0,
    crudeProtein: 0.0,
    tdn: 0.0,
    calcium: 22.0,
    phosphorus: 18.0,
    pricePerKg: 25.0,
    isRoughage: false,
    description: 'แร่ธาตุเสริมแคลเซียมและฟอสฟอรัสเพื่อบำรุงกระดูกและน้ำนม',
  },
  {
    keywords: ['หินปูน', 'แคลเซียมคาร์บอเนต', 'limestone', 'เปลือกหอย'],
    nameEn: 'Ground Limestone (CaCO3)',
    category: 'mineral_supplement',
    dryMatter: 99.0,
    crudeProtein: 0.0,
    tdn: 0.0,
    calcium: 36.0,
    phosphorus: 0.0,
    pricePerKg: 6.0,
    isRoughage: false,
    description: 'เสริมแคลเซียมบริสุทธิ์เพื่อปรับสัดส่วน Ca:P ให้ ≥ 2:1 ป้องกันโรคนิ่วในแกะตัวผู้',
  },
  {
    keywords: ['พรีมิกซ์', 'แร่ธาตุ', 'วิตามิน', 'premix', 'vitamin', 'mineral', 'กำมะถัน', 'sulfur'],
    nameEn: 'Sheep Vitamin & Mineral Premix (Copper-Free)',
    category: 'mineral_supplement',
    dryMatter: 96.0,
    crudeProtein: 0.0,
    tdn: 0.0,
    calcium: 14.0,
    phosphorus: 6.0,
    pricePerKg: 45.0,
    isRoughage: false,
    description: 'พรีมิกซ์วิตามินและแร่ธาตุรวมเฉพาะแกะ (ไม่มีทองแดงเจือปน) เสริมกำมะถันสร้างเส้นใยขน',
  },
  {
    keywords: ['เกลือแกง', 'เกลือแร่', 'เกลือ', 'salt'],
    nameEn: 'Iodized Salt / Mineral Lick',
    category: 'mineral_supplement',
    dryMatter: 99.0,
    crudeProtein: 0.0,
    tdn: 0.0,
    calcium: 0.5,
    phosphorus: 0.0,
    pricePerKg: 8.0,
    isRoughage: false,
    description: 'เสริมโซเดียมและคลอไรด์ กระตุ้นการดื่มน้ำและการกินได้ (ผสม 0.5% ในอาหารข้น)',
  },
];

const HUMAN_JUNK_AND_COOKED_FOOD_KEYWORDS = [
  'โดนัท',
  'donut',
  'doughnut',
  'พิซซ่า',
  'pizza',
  'เบอร์เกอร์',
  'แฮมเบอร์เกอร์',
  'burger',
  'เฟรนช์ฟราย',
  'french fries',
  'เค้ก',
  'คัพเค้ก',
  'cake',
  'คุกกี้',
  'cookie',
  'บราวนี่',
  'brownie',
  'ช็อกโกแลต',
  'chocolate',
  'ไอศกรีม',
  'ไอติม',
  'ice cream',
  'ขนมปัง',
  'bread',
  'ครัวซอง',
  'croissant',
  'แซนด์วิช',
  'sandwich',
  'พาย',
  'วาฟเฟิล',
  'waffle',
  'แพนเค้ก',
  'pancake',
  'ขนม',
  'snack',
  'ลูกอม',
  'candy',
  'เยลลี่',
  'หมากฝรั่ง',
  'ป๊อปคอร์น',
  'ข้าวโพดคั่ว',
  'popcorn',
  'มันฝรั่งทอด',
  'เลย์',
  'บะหมี่',
  'มาม่า',
  'ก๋วยเตี๋ยว',
  'สปาเก็ตตี้',
  'พาสต้า',
  'pasta',
  'ข้าวผัด',
  'ข้าวมันไก่',
  'ข้าวหมูแดง',
  'ข้าวเหนียวมะม่วง',
  'ซูชิ',
  'sushi',
  'ราเมน',
  'ramen',
  'ส้มตำ',
  'ชาบู',
  'หมูกระทะ',
  'หมูปิ้ง',
  'ไก่ทอด',
  'ลูกชิ้น',
  'ไส้กรอก',
  'ฮอทดอก',
  'hotdog',
  'แฮม',
  'เบคอน',
  'bacon',
  'ชีส',
  'cheese',
  'เนย',
  'butter',
  'มายองเนส',
  'ซอสมะเขือเทศ',
  'ซีอิ๊ว',
  'น้ำปลา',
  'กะปิ',
  'ปลาร้า',
  'น้ำพริก',
  'ต้มยำ',
  'ผัดไทย',
  'ก๋วยจั๊บ',
  'โจ๊ก',
  'น้ำตาลทราย',
  'นมข้น',
  'วิปครีม',
];

const BEVERAGE_AND_ALCOHOL_KEYWORDS = [
  'กาแฟ',
  'coffee',
  'เอสเปรสโซ',
  'ลาเต้',
  'คาปูชิโน',
  'ชาเขียว',
  'ชาไทย',
  'ชาเย็น',
  'ชานม',
  'ชาไข่มุก',
  'bubble tea',
  'โกโก้',
  'cocoa',
  'น้ำอัดลม',
  'โค้ก',
  'coke',
  'เป๊ปซี่',
  'pepsi',
  'สไปรท์',
  'แฟนต้า',
  'โซดา',
  'soda',
  'ชูกำลัง',
  'กระทิงแดง',
  'เอ็มร้อย',
  'm-150',
  'เหล้า',
  'สุรา',
  'ไวน์',
  'wine',
  'วิสกี้',
  'whisky',
  'วอดก้า',
  'แอลกอฮอล์',
  'alcohol',
  'น้ำผลไม้',
  'น้ำหวาน',
  'สมูทตี้',
  'smoothie',
];

const MEAT_AND_SEAFOOD_KEYWORDS = [
  'เนื้อหมู',
  'เนื้อวัว',
  'เนื้อไก่',
  'เนื้อเป็ด',
  'เนื้อแกะ',
  'หมูกรอบ',
  'หมูสับ',
  'หมูสามชั้น',
  'คอหมู',
  'ไก่ย่าง',
  'ไก่ต้ม',
  'เป็ดย่าง',
  'กุ้ง',
  'ปูอัด',
  'ปลาหมึก',
  'หอยแครง',
  'หอยนางรม',
  'หอยแมลงภู่',
  'ปลาทู',
  'ปลาดุก',
  'ปลาแซลมอน',
  'ซาซิมิ',
  'ไข่เจียว',
  'ไข่ดาว',
  'ไข่ต้ม',
  'ไข่ลวก',
  'meat',
  'pork',
  'beef',
  'chicken',
  'seafood',
  'shrimp',
  'sausage',
];

const OTHER_ANIMAL_FEED_KEYWORDS = [
  'อาหารสุกร',
  'อาหารหมู',
  'อาหารวัว',
  'อาหารโค',
  'อาหารไก่',
  'อาหารเป็ด',
  'อาหารปลา',
  'อาหารกุ้ง',
  'อาหารหมา',
  'อาหารสุนัข',
  'อาหารแมว',
  'อาหารนก',
  'อาหารกระต่าย',
  'pig feed',
  'swine feed',
  'cattle feed',
  'poultry feed',
  'dog food',
  'cat food',
];

const TOXIC_OR_NON_FEED_KEYWORDS = [
  'หอมหัวใหญ่',
  'หัวหอม',
  'ต้นหอม',
  'หอมแดง',
  'กระเทียม',
  'onion',
  'garlic',
  'อะโวคาโด',
  'avocado',
  'องุ่น',
  'ลูกเกด',
  'แมคคาเดเมีย',
  'มันฝรั่งดิบ',
  'เปลือกมันฝรั่ง',
  'ต้นมันฝรั่ง',
  'พริก',
  'chili',
  'ยาฆ่าแมลง',
  'ปุ๋ยเคมี',
  'สารเคมี',
  'พลาสติก',
  'โฟม',
  'เชื้อรา',
  'ขึ้นรา',
  'ของบูด',
  'ใบเสร็จ',
  'ใบขับขี่',
  'ใบสั่ง',
  'ใบปลิว',
  'ต้นทุน',
  'รถยนต์',
  'มอเตอร์ไซค์',
  'โทรศัพท์',
  'คีย์บอร์ด',
  'รองเท้า',
];

const RECOGNIZED_RUMINANT_FEED_KEYWORDS = [
  // หยาบ / หญ้า / พืชอาหารสัตว์
  'หญ้า',
  'ฟาง',
  'ไซเลจ',
  'หมัก',
  'ใบ',
  'เถา',
  'ยอด',
  'ต้น',
  'แฝก',
  'อัลฟัลฟา',
  'โคลเวอร์',
  'สไตโล',
  'คาวาลเคด',
  'ฮามาต้า',
  'กระถิน',
  'โสน',
  'ทองหลาง',
  'ปอเทือง',
  'แหนแดง',
  'จอก',
  'ผักตบ',
  'ผักบุ้ง',
  'grass',
  'hay',
  'straw',
  'silage',
  'forage',
  'alfalfa',
  'clover',
  'stylo',
  'leaf',
  'leaves',
  // ธัญพืช / โปรตีน / พลังงาน / ผลพลอยได้เกษตร
  'ข้าวโพด',
  'รำ',
  'ปลายข้าว',
  'แกลบ',
  'ข้าวฟ่าง',
  'ข้าวสาลี',
  'ข้าวบาร์เลย์',
  'ข้าวโอ๊ต',
  'มันเส้น',
  'มันสำปะหลัง',
  'หัวมัน',
  'เปลือกมัน',
  'กาก',
  'ชาน',
  'เปลือก',
  'ซัง',
  'ถั่ว',
  'งา',
  'ทานตะวัน',
  'ฝ้าย',
  'ปาล์ม',
  'ยีสต์',
  'โมลาส',
  'ผลพลอยได้',
  'อาหารข้น',
  'อาหารหยาบ',
  'อาหารเม็ดแกะ',
  'ทีเอ็มอาร์',
  'tmr',
  'corn',
  'maize',
  'sorghum',
  'oats',
  'barley',
  'wheat',
  'bran',
  'rice',
  'cassava',
  'molasses',
  'soy',
  'soybean',
  'peanut',
  'copra',
  'palm',
  'cottonseed',
  'sunflower',
  'yeast',
  'urea',
  'hull',
  'pulp',
  'meal',
  'brewer',
  // วิตามิน / แร่ธาตุ
  'พรีมิกซ์',
  'วิตามิน',
  'แร่ธาตุ',
  'เกลือ',
  'แคลเซียม',
  'ฟอสฟอรัส',
  'ฟอสเฟต',
  'ไดแคลเซียม',
  'หินปูน',
  'เปลือกหอย',
  'กำมะถัน',
  'ซีลีเนียม',
  'สังกะสี',
  'ไบคาร์บอเนต',
  'โพรไบโอติก',
  'premix',
  'vitamin',
  'mineral',
  'salt',
  'calcium',
  'dcp',
  'limestone',
  'sulfur',
  'bicarbonate',
  'probiotic',
];

/**
 * คัดกรองชื่อวัตถุดิบอาหารสัตว์อย่างเข้มงวด ป้องกันการเพิ่มอาหารคน ขนม ฟาสต์ฟู้ด เนื้อสัตว์ หรือสิ่งที่เป็นพิษต่อแกะ
 */
export function validateSheepFeedIngredient(rawName: string): FeedValidationResult {
  const cleaned = rawName.trim();
  const lower = cleaned.toLowerCase();

  if (!cleaned || cleaned.length < 2) {
    return {
      isValid: false,
      blockedCategory: 'empty_or_invalid',
      reasonTh: 'กรุณาระบุชื่อวัตถุดิบอาหารแกะอย่างน้อย 2 ตัวอักษร',
    };
  }

  // ป้องกันการพิมพ์ตัวเลขล้วนหรืออักขระพิเศษล้วน
  if (/^[\d\s.,+\-*/!?@#$%^&()_=[\]{}|\\:;"'<>~`]+$/.test(cleaned)) {
    return {
      isValid: false,
      blockedCategory: 'empty_or_invalid',
      reasonTh: 'ชื่อวัตถุดิบไม่ถูกต้อง กรุณาระบุเป็นชื่อพืชอาหารสัตว์ ธัญพืช หรือแร่ธาตุสำหรับแกะ',
    };
  }

  // 1. ตรวจอาหารคน เบเกอรี่ ขนม และฟาสต์ฟู้ด (ตรวจก่อนคำอนุญาต เพื่อไม่ให้ "เค้กมะพร้าว" หรือ "โดนัทถั่ว" หลุดรอด)
  if (HUMAN_JUNK_AND_COOKED_FOOD_KEYWORDS.some(kw => lower.includes(kw))) {
    return {
      isValid: false,
      blockedCategory: 'human_junk_food',
      reasonTh: `"${cleaned}" เป็นขนม เบเกอรี่ ฟาสต์ฟู้ด หรืออาหารคน ไม่ใช่วัตถุดิบสำหรับแกะ (เสี่ยงท้องอืดและกรดในกระเพาะรูเมน)`,
    };
  }

  // 2. ตรวจเครื่องดื่ม คาเฟอีน และแอลกอฮอล์ (ยกเว้น "กากเบียร์" / "brewer" ซึ่งเป็นผลพลอยได้ที่แกะกินได้จริง)
  const isBrewerGrain = lower.includes('กากเบียร์') || lower.includes('brewer');
  const isAlcoholicBeer =
    !isBrewerGrain && (lower.includes('เบียร์') || /\bbeer\b/.test(lower));
  if (
    isAlcoholicBeer ||
    BEVERAGE_AND_ALCOHOL_KEYWORDS.some(kw => lower.includes(kw))
  ) {
    return {
      isValid: false,
      blockedCategory: 'beverages',
      reasonTh: `"${cleaned}" เป็นเครื่องดื่ม คาเฟอีน หรือแอลกอฮอล์ แกะไม่สามารถบริโภคได้ (หากต้องการเพิ่มกากจากการผลิตเบียร์ ให้ระบุว่า "กากเบียร์เปียกสด" หรือ "กากเบียร์แห้ง")`,
    };
  }

  // 3. ตรวจเนื้อสัตว์และอาหารทะเล (ยกเว้น "เปลือกหอย" ที่เป็นแคลเซียม)
  if (MEAT_AND_SEAFOOD_KEYWORDS.some(kw => lower.includes(kw))) {
    return {
      isValid: false,
      blockedCategory: 'meat_animal',
      reasonTh: `"${cleaned}" เป็นเนื้อสัตว์หรืออาหารทะเล แกะเป็นสัตว์เคี้ยวเอื้องกินพืช ไม่สามารถใช้อาหารกลุ่มนี้ได้`,
    };
  }

  // 4. ตรวจอาหารสัตว์ชนิดอื่น (โดยเฉพาะอาหารสุกร/วัว/สัตว์ปีกที่มักมีทองแดงสูงเกินระดับปลอดภัยของแกะ)
  if (OTHER_ANIMAL_FEED_KEYWORDS.some(kw => lower.includes(kw))) {
    return {
      isValid: false,
      blockedCategory: 'other_animal_feed',
      reasonTh: `"${cleaned}" เป็นอาหารสำหรับสัตว์ชนิดอื่น ห้ามนำมาให้แกะ (เสี่ยงพิษทองแดงสะสมในตับของแกะ)`,
    };
  }

  // 5. ตรวจพืชพิษและสิ่งปนเปื้อนที่ไม่ใช่อาหารสัตว์
  if (TOXIC_OR_NON_FEED_KEYWORDS.some(kw => lower.includes(kw))) {
    return {
      isValid: false,
      blockedCategory: 'toxic_to_sheep',
      reasonTh: `"${cleaned}" จัดเป็นพืชพิษหรือสิ่งที่ไม่ใช่วัตถุดิบอาหารสัตว์ ไม่ปลอดภัยต่อแกะ`,
    };
  }

  // 6. ต้องตรงกับฐานข้อมูลกรมปศุสัตว์/NRC หรือมีคำสำคัญในกลุ่มวัตถุดิบอาหารสัตว์เคี้ยวเอื้องจริงเท่านั้น
  const matchesDb = THAI_FEED_COMPOSITION_DB.some(entry =>
    entry.keywords.some(kw => lower.includes(kw.toLowerCase()))
  );
  const matchesFeedKeyword = RECOGNIZED_RUMINANT_FEED_KEYWORDS.some(kw =>
    lower.includes(kw.toLowerCase())
  );

  if (!matchesDb && !matchesFeedKeyword) {
    return {
      isValid: false,
      blockedCategory: 'unrecognized',
      reasonTh: `"${cleaned}" ไม่ใช่วัตถุดิบอาหารแกะที่รู้จัก กรุณาระบุชื่อพืชอาหารสัตว์ ธัญพืช ผลพลอยได้เกษตร หรือแร่ธาตุที่แกะกินได้จริง (เช่น หญ้ารูซี่, ฟางข้าว, ใบหม่อน, กากถั่วเหลือง, ข้าวโพดบด)`,
    };
  }

  return { isValid: true };
}

/**
 * คำนวณคุณค่าสารอาหาร (% DM, % CP, % TDN, % Ca, % P) และจัดหมวดหมู่อัตโนมัติจากชื่อวัตถุดิบ
 */
export function resolveIngredientFromName(rawName: string): ResolvedIngredientData {
  const cleaned = rawName.trim();
  const lower = cleaned.toLowerCase();
  const validation = validateSheepFeedIngredient(cleaned);

  if (!validation.isValid) {
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Not Valid Sheep Feed)`,
      category: 'byproduct',
      dryMatter: 0,
      crudeProtein: 0,
      tdn: 0,
      calcium: 0,
      phosphorus: 0,
      pricePerKg: 0,
      isRoughage: false,
      description: validation.reasonTh || 'ไม่สามารถใช้เป็นวัตถุดิบอาหารแกะได้',
      sourceLabel: 'ไม่ผ่านเกณฑ์คัดกรองวัตถุดิบอาหารแกะ',
      matchedFromDatabase: false,
      isValidForSheep: false,
      rejectionReason: validation.reasonTh,
    };
  }

  // 1. ค้นหาจากฐานข้อมูลมาตรฐานกรมปศุสัตว์ / NRC (เรียงคำค้นที่จำเพาะกว่าไว้ด้านบนแล้ว)
  for (const entry of THAI_FEED_COMPOSITION_DB) {
    if (entry.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return {
        nameTh: cleaned,
        nameEn: entry.nameEn,
        category: entry.category,
        dryMatter: entry.dryMatter,
        crudeProtein: entry.crudeProtein,
        tdn: entry.tdn,
        calcium: entry.calcium,
        phosphorus: entry.phosphorus,
        pricePerKg: entry.pricePerKg,
        isRoughage: entry.isRoughage,
        description: entry.description,
        sourceLabel: 'อ้างอิงค่ามาตรฐานกรมปศุสัตว์ / NRC',
        matchedFromDatabase: true,
        isValidForSheep: true,
      };
    }
  }

  // 2. กรณีเป็นวัตถุดิบใหม่ไม่อยู่ในรายการหลัก -> ประมาณการ % สารอาหารจากลักษณะคำเรียกของวัตถุดิบ
  if (
    lower.includes('วิตามิน') ||
    lower.includes('แร่') ||
    lower.includes('เกลือ') ||
    lower.includes('พรีมิกซ์') ||
    lower.includes('แคลเซียม') ||
    lower.includes('ฟอสฟอรัส') ||
    lower.includes('ฟอสเฟต') ||
    lower.includes('กำมะถัน') ||
    lower.includes('vitamin') ||
    lower.includes('mineral') ||
    lower.includes('premix')
  ) {
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Vitamin & Mineral Supplement)`,
      category: 'mineral_supplement',
      dryMatter: 96.0,
      crudeProtein: 0.0,
      tdn: 0.0,
      calcium: 14.0,
      phosphorus: 6.0,
      pricePerKg: 35.0,
      isRoughage: false,
      description: 'ประมาณการกลุ่มวิตามินและแร่ธาตุเสริมสำหรับแกะ (ตรวจสอบให้ปลอดทองแดงก่อนใช้)',
      sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มวิตามินและแร่ธาตุ)',
      matchedFromDatabase: false,
      isValidForSheep: true,
    };
  }

  if (
    lower.includes('ถั่ว') ||
    lower.includes('กระถิน') ||
    lower.includes('ยีสต์') ||
    lower.includes('โปรตีน') ||
    lower.includes('protein') ||
    lower.includes('soy') ||
    lower.includes('meal')
  ) {
    const isFreshLeaf = lower.includes('สด') || lower.includes('ใบ');
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Protein Source)`,
      category: 'concentrate_protein',
      dryMatter: isFreshLeaf ? 28.0 : 89.0,
      crudeProtein: isFreshLeaf ? 19.0 : 28.0,
      tdn: isFreshLeaf ? 60.0 : 75.0,
      calcium: isFreshLeaf ? 1.1 : 0.32,
      phosphorus: isFreshLeaf ? 0.25 : 0.58,
      pricePerKg: isFreshLeaf ? 2.5 : 13.0,
      isRoughage: isFreshLeaf,
      description: 'ประมาณการกลุ่มอาหารให้โปรตีนสำหรับสร้างกล้ามเนื้อ น้ำนม และเส้นใยขน',
      sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มอาหารให้โปรตีน)',
      matchedFromDatabase: false,
      isValidForSheep: true,
    };
  }

  if (lower.includes('หมัก') || lower.includes('ไซเลจ') || lower.includes('silage')) {
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Silage)`,
      category: 'roughage_silage',
      dryMatter: 26.0,
      crudeProtein: 8.5,
      tdn: 56.0,
      calcium: 0.34,
      phosphorus: 0.21,
      pricePerKg: 1.9,
      isRoughage: true,
      description: 'ประมาณการกลุ่มพืชหมักไซเลจ ให้เยื่อใยและพลังงานย่อยได้ปานกลาง',
      sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มพืชหมัก)',
      matchedFromDatabase: false,
      isValidForSheep: true,
    };
  }

  if (lower.includes('แห้ง') || lower.includes('ฟาง') || lower.includes('เปลือกแห้ง') || lower.includes('hay')) {
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Dry Roughage)`,
      category: 'roughage_dry',
      dryMatter: 88.0,
      crudeProtein: 7.5,
      tdn: 50.0,
      calcium: 0.32,
      phosphorus: 0.18,
      pricePerKg: 4.0,
      isRoughage: true,
      description: 'ประมาณการกลุ่มอาหารหยาบแห้ง เก็บได้นานและกระตุ้นการเคี้ยวเอื้อง',
      sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มหญ้า/ฟางแห้ง)',
      matchedFromDatabase: false,
      isValidForSheep: true,
    };
  }

  if (
    lower.includes('หญ้า') ||
    lower.includes('ใบ') ||
    lower.includes('ต้น') ||
    lower.includes('ยอด') ||
    lower.includes('ผัก') ||
    lower.includes('เถา') ||
    lower.includes('grass')
  ) {
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Fresh Forage)`,
      category: 'roughage_fresh',
      dryMatter: 20.0,
      crudeProtein: 9.0,
      tdn: 54.0,
      calcium: 0.36,
      phosphorus: 0.22,
      pricePerKg: 1.4,
      isRoughage: true,
      description: 'ประมาณการกลุ่มพืชอาหารสัตว์สด ให้เยื่อใยและพลังงานพื้นฐานสำหรับแกะ',
      sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มอาหารหยาบสด)',
      matchedFromDatabase: false,
      isValidForSheep: true,
    };
  }

  if (
    lower.includes('กาก') ||
    lower.includes('เปลือก') ||
    lower.includes('ชาน') ||
    lower.includes('ผลพลอย')
  ) {
    const isDry = lower.includes('แห้ง') || lower.includes('อบ') || lower.includes('อัดเม็ด');
    return {
      nameTh: cleaned,
      nameEn: `${cleaned} (Agri-Byproduct)`,
      category: 'byproduct',
      dryMatter: isDry ? 88.0 : 24.0,
      crudeProtein: 7.0,
      tdn: 64.0,
      calcium: 0.28,
      phosphorus: 0.16,
      pricePerKg: isDry ? 5.2 : 1.5,
      isRoughage: false,
      description: 'ประมาณการกลุ่มผลพลอยได้เกษตรให้พลังงาน ช่วยลดต้นทุนค่าอาหารในฟาร์ม',
      sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มผลพลอยได้เกษตร)',
      matchedFromDatabase: false,
      isValidForSheep: true,
    };
  }

  // ค่าเริ่มต้นเฉพาะกลุ่มธัญพืช/อาหารข้น/หัวมันที่ผ่านการคัดกรองแล้ว
  return {
    nameTh: cleaned,
    nameEn: `${cleaned} (Energy Feed)`,
    category: 'concentrate_energy',
    dryMatter: 88.0,
    crudeProtein: 9.5,
    tdn: 76.0,
    calcium: 0.12,
    phosphorus: 0.30,
    pricePerKg: 8.5,
    isRoughage: false,
    description: 'ประมาณการกลุ่มวัตถุดิบอาหารข้นให้พลังงาน สามารถปรับแก้ % โภชนะหรือราคาได้ภายหลัง',
    sourceLabel: 'ประมาณการอัตโนมัติ (กลุ่มอาหารให้พลังงาน)',
    matchedFromDatabase: false,
    isValidForSheep: true,
  };
}

export const QUICK_INGREDIENT_SUGGESTIONS = [
  'หญ้ารูซี่สด',
  'หญ้าหวานอิสราเอล',
  'ข้าวโพดหมัก',
  'กากเนื้อในเมล็ดปาล์ม (PKC)',
  'กากมะพร้าว',
  'ใบหม่อนสด',
  'แหนแดงสด',
  'เปลือกถั่วเหลือง',
  'ปลายข้าว',
  'เกลือแกงเสริมไอโอดีน',
];
