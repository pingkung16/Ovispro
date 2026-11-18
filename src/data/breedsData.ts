/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SheepBreedInfo } from '../types/sheep';
import { HAMPSHIRE_PHOTO } from './breedPhotos';

/**
 * อันดับสายพันธุ์แกะขนที่แอปพลิเคชันแนะนำสำหรับฟาร์มในประเทศไทย (เฉพาะแกะขนล้วน 11 สายพันธุ์)
 * อ้างอิงข้อมูลพันธุ์และค่ามาตรฐานจาก Oklahoma State University (OSU), SheepUSA,
 * NZ Sheep, Livestock Conservancy และข้อมูลการส่งเสริมพันธุ์ของกรมปศุสัตว์ / โครงการหลวง (ประเทศไทย)
 */
export const SHEEP_BREEDS: SheepBreedInfo[] = [
  {
    id: 'breed-corriedale',
    rank: 1,
    isTopRecommended: true,
    recommendationReason:
      'อันดับ 1 แนะนำสูงสุดสำหรับประเทศไทย: กรมปศุสัตว์และโครงการหลวงนำเข้ามาส่งเสริมบนพื้นที่สูงและภาคเหนือได้ผลดีเยี่ยม ให้ขนปานกลางนุ่มฟูปริมาณสูงถึง 4.5–7.7 กก./ปี ควบคู่กับความทนทานต่อสภาพแวดล้อมไทย',
    nameTh: 'คอร์ริเดล (Corriedale)',
    nameEn: 'Corriedale Dual-Purpose Wool Sheep',
    origin: 'ประเทศนิวซีแลนด์และออสเตรเลีย (พัฒนาจาก Lincoln ram x Merino ewe)',
    type: 'medium_wool',
    categoryGroup: 'wool',
    typeLabel: 'อันดับ 1 แนะนำในไทย · แกะขนกึ่งเนื้อกึ่งขนที่สมดุลที่สุด',
    woolGrade: 'มีเดียมวูลนุ่มแน่น สม่ำเสมอ (24.5 – 31.5 ไมครอน, ยาว 9–15 ซม.)',
    fleeceWeightKg: '4.5 – 7.7 กก./ปี (ผลผลิตขนสะอาด 50–60%)',
    adultRamWeightKg: '95 – 125 กก.',
    adultEweWeightKg: '65 – 85 กก.',
    averageAdgGrams: '200 – 270 กรัม/วัน',
    weaningWeightKg: '24 – 29 กก. (ที่ 90 วัน)',
    twinningRatePct: '120 – 150%',
    photoUrl: '/assets/breeds/corriedale_3917.jpg',
    highlightFeatures: [
      'ผสานขนละเอียดนุ่มจากเมอริโนเข้ากับโครงร่างใหญ่และขนยาวจากลินคอล์นอย่างลงตัว',
      'เป็นสายพันธุ์หลักที่มูลนิธิโครงการหลวง (เช่น ศูนย์ฯ ห้วยฮ่อม จ.แม่ฮ่องสอน) ใช้ผลิตขนแกะทอมือ',
      'ใบหน้าสีขาว จมูกดำ ไร้เขา ขนขาวดกคลุมสม่ำเสมอตลอดลำตัว',
      'สัญชาตญาณความเป็นแม่สูง เลี้ยงลูกเก่ง อายุการให้ผลผลิตยืนยาว',
    ],
    climateAdaptation:
      'ปรับตัวกับอากาศภาคเหนือและพื้นที่สูงที่มีลมเย็นสลับร้อนกลางวันได้ดี ทนแล้งและหากินในแปลงหญ้าไทยได้เก่ง',
    feedingStrategy:
      'ใช้อาหารหยาบคุณภาพดี (หญ้าแพงโกล่า/เนเปียร์) ร่วมกับอาหารข้นโปรตีน 12–14% ช่วงให้นมและแกะรุ่น',
    suitabilityForThaiFarms:
      'เหมาะที่สุดสำหรับฟาร์มแกะขนเชิงพาณิชย์ในไทยที่ต้องการทั้งปริมาณขนสม่ำเสมอสำหรับงานสิ่งทอและลูกแกะที่โตแข็งแรง',
    colorTheme: 'from-emerald-900 via-green-950 to-slate-950',
  },
  {
    id: 'breed-dorset',
    rank: 2,
    isTopRecommended: true,
    recommendationReason:
      'อันดับ 2 แนะนำในไทย: กรมปศุสัตว์นำเข้ามาเลี้ยงปรับปรุงพันธุ์ในไทยตั้งแต่ปี พ.ศ. 2522 จุดเด่นเหนือใครคือผสมพันธุ์ได้ตลอดทั้งปีไม่ขึ้นกับช่วงแสงในเขตร้อน และให้ขนสีขาวบริสุทธิ์ไร้เส้นใยสีดำเจือปน',
    nameTh: 'ดอร์เซท (Dorset)',
    nameEn: 'Dorset Horn & Polled Wool Sheep',
    origin: 'ประเทศอังกฤษ (มณฑลดอร์เซตและซัมเมอร์เซต)',
    type: 'medium_wool',
    categoryGroup: 'wool',
    typeLabel: 'อันดับ 2 แนะนำในไทย · ขนขาวสะอาด ผสมพันธุ์ได้ตลอดปี',
    woolGrade: 'มีเดียมวูลสีขาวบริสุทธิ์ ไร้เส้นขนสีดำ (26.0 – 33.0 ไมครอน, ยาว 7–11 ซม.)',
    fleeceWeightKg: '2.0 – 4.5 กก./ปี (ผลผลิตขนสะอาด 50–60%)',
    adultRamWeightKg: '95 – 125 กก.',
    adultEweWeightKg: '65 – 85 กก.',
    averageAdgGrams: '230 – 300 กรัม/วัน',
    weaningWeightKg: '25 – 31 กก. (ที่ 90 วัน)',
    twinningRatePct: '130 – 170%',
    photoUrl: '/assets/breeds/dorset.jpg',
    highlightFeatures: [
      'ผสมพันธุ์นอกฤดูกาลได้ดีเยี่ยม (Out-of-season breeder) ให้ผลผลิตลูกแกะได้ตลอด 12 เดือนในไทย',
      'ขนสีขาวสะอาด ไม่มีเส้นใยสีดำปน เหมาะอย่างยิ่งสำหรับย้อมสีธรรมชาติและสิ่งทอสีอ่อน',
      'มีประวัติปรับตัวและเพาะขยายพันธุ์ในไทยมายาวนานโดยกรมปศุสัตว์',
      'แม่แกะน้ำนมดก เลี้ยงลูกเก่ง ร้อยละการให้ลูก/คอกสูงถึง 130–170%',
    ],
    climateAdaptation:
      'ปรับตัวในโรงเรือนโปร่งอากาศถ่ายเทของไทยได้ดี ควรตัดขนก่อนเข้าฤดูร้อนเพื่อลดความเครียดจากความร้อน',
    feedingStrategy:
      'ตอบสนองต่ออาหารข้นและแร่ธาตุได้ดีมาก ในช่วงแม่แกะอุ้มท้องท้าย-ให้นมลูกควรให้โปรตีน 13–15% CP',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มแกะขนในไทยที่ต้องการความต่อเนื่องในการผลิตฝูงตลอดปี ขนขาวย้อมสีง่าย และลูกแกะโตเร็ว',
    colorTheme: 'from-amber-900 via-stone-900 to-slate-950',
  },
  {
    id: 'breed-merino',
    rank: 3,
    isTopRecommended: true,
    recommendationReason:
      'อันดับ 3 แนะนำในไทย: ราชาแห่งแกะขนละเอียดที่สุดในโลก (15–24.5 ไมครอน) ให้ราคาขายเส้นใยขนดิบและเส้นด้ายสูงที่สุด กรมปศุสัตว์และโครงการหลวงใช้สายเลือดเมอริโนพัฒนาคุณภาพความนุ่มของขนแกะในไทย',
    nameTh: 'เมอริโน (Merino)',
    nameEn: 'Merino Fine Wool Sheep',
    origin: 'ประเทศสเปน / พัฒนาสายพันธุ์หลักในออสเตรเลียและแอฟริกาใต้',
    type: 'fine_wool',
    categoryGroup: 'wool',
    typeLabel: 'อันดับ 3 แนะนำในไทย · ขนละเอียดที่สุดในโลก มูลค่าเส้นใยสูงสุด',
    woolGrade: 'ซูเปอร์ไฟน์ – ไฟน์วูล (15.0 – 24.5 ไมครอน, ลอนคลื่น 10–14 คลื่น/นิ้ว)',
    fleeceWeightKg: '4.5 – 10.0 กก./ปี (แม่พันธุ์เฉลี่ย 4.5–6.5 กก., พ่อพันธุ์คัดพิเศษถึง 10 กก.)',
    adultRamWeightKg: '80 – 110 กก.',
    adultEweWeightKg: '55 – 75 กก.',
    averageAdgGrams: '160 – 220 กรัม/วัน',
    weaningWeightKg: '20 – 25 กก. (ที่ 90 วัน)',
    twinningRatePct: '110 – 130%',
    photoUrl: '/assets/breeds/merino_3912.jpg',
    highlightFeatures: [
      'เส้นใยขนละเอียด นุ่ม ไม่ระคายผิว และเหนียวทนทานที่สุดในบรรดาแกะขนทั้งหมด',
      'ผิวหนังมีรอยพับย่น (Skin folds) ช่วยเพิ่มพื้นที่ผิวในการผลิตขนต่อตัวได้สูงมาก',
      'มีน้ำมันขนธรรมชาติ (Lanolin) สูง ช่วยเคลือบเส้นใยให้เงางามและกันความชื้น',
      'มูลค่าขนต่อกิโลกรัมสูงที่สุด เหมาะทำเครื่องนุ่งห่มเกรดพรีเมียมและผลิตภัณฑ์ลาโนลิน',
    ],
    climateAdaptation:
      'ไม่ชอบพื้นที่ชื้นแฉะ ในประเทศไทยควรเลี้ยงในโรงเรือนคอกไม้ยกพื้น แห้งสะอาด อากาศถ่ายเทสะดวก หรือพื้นที่ดอนอากาศเย็น',
    feedingStrategy:
      'ต้องการโปรตีนและกรดอะมิโนที่มีกำมะถัน (Methionine & Cysteine) 10.5–14% CP ตามระยะวัยเพื่อสร้างเคราตินเส้นขน',
    suitabilityForThaiFarms:
      'เหมาะมากสำหรับฟาร์มแกะขนเกรดพรีเมียม แบรนด์สิ่งทอทำมือมูลค่าสูง และเกษตรกรที่เน้นรายได้หลักจากเส้นใยขนคุณภาพสูง',
    colorTheme: 'from-blue-900 via-indigo-950 to-slate-950',
  },
  {
    id: 'breed-rambouillet',
    rank: 4,
    isTopRecommended: false,
    recommendationReason:
      'ขนละเอียดระดับ 18.5–24.5 ไมครอนใกล้เคียงเมอริโน แต่โครงสร้างร่างกายใหญ่และทนแดดร้อนแห้งในแปลงหญ้าได้ดีกว่า',
    nameTh: 'แรมบูเยต์ (Rambouillet)',
    nameEn: 'Rambouillet (French Merino)',
    origin: 'ประเทศฝรั่งเศส (คัดเลือกจาก Spanish Merino)',
    type: 'fine_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนละเอียดโครงสร้างใหญ่ ทนแดดได้ดี (French Merino)',
    woolGrade: 'ไฟน์วูลสม่ำเสมอ (18.5 – 24.5 ไมครอน, ยาว 5–10 ซม.)',
    fleeceWeightKg: '3.6 – 8.1 กก./ปี (ผลผลิตขนสะอาด 35–55%)',
    adultRamWeightKg: '100 – 135 กก.',
    adultEweWeightKg: '65 – 90 กก.',
    averageAdgGrams: '200 – 270 กรัม/วัน',
    weaningWeightKg: '24 – 30 กก. (ที่ 90 วัน)',
    twinningRatePct: '110 – 140%',
    photoUrl: '/assets/breeds/rambouillet.jpg',
    highlightFeatures: [
      'ขนาดลำตัวใหญ่กว่าเมอริโน โครงกระดูกแข็งแรง ทนต่อสภาพทุ่งหญ้าร้อนแห้งได้ดี',
      'ให้ขนละเอียดคุณภาพพรีเมียมที่นำไปปั่นด้ายละเอียดได้ทันที',
      'สัญชาตญาณการรวมฝูง (Flocking instinct) สูง เลี้ยงคุมฝูงในแปลงง่าย',
    ],
    climateAdaptation:
      'ทนความร้อนแห้งและความผันผวนของอุณหภูมิกลางวัน-กลางคืนในไทยได้ดีกว่าเมอริโนดั้งเดิม',
    feedingStrategy:
      'ต้องการอาหารหยาบสัดส่วน 65–70% ร่วมกับอาหารข้นเสริมพลังงานและแร่ธาตุกำมะถัน',
    suitabilityForThaiFarms:
      'เหมาะสำหรับใช้เป็นพ่อพันธุ์ผสมปรับขนาดโครงสร้างฝูงแกะขนละเอียดในฟาร์มภาคกลาง-ภาคอีสานที่อากาศค่อนข้างร้อน',
    colorTheme: 'from-sky-900 via-blue-950 to-slate-950',
  },
  {
    id: 'breed-columbia',
    rank: 5,
    isTopRecommended: false,
    recommendationReason:
      'ให้ผลผลิตขนปริมาณมาก (4.5–7.3 กก./ปี) ความละเอียดปานกลางใช้งานง่าย เหมาะกับการเลี้ยงในแปลงหญ้ากว้าง',
    nameTh: 'โคลัมเบีย (Columbia)',
    nameEn: 'Columbia Wool Sheep',
    origin: 'ประเทศสหรัฐอเมริกา (USDA: Lincoln ram x Rambouillet ewe)',
    type: 'medium_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนปานกลางโครงสร้างใหญ่ (USDA Dual-Purpose Wool)',
    woolGrade: 'มีเดียมวูลหนาแน่น สม่ำเสมอ (22.0 – 31.0 ไมครอน)',
    fleeceWeightKg: '4.5 – 7.3 กก./ปี (ผลผลิตขนสะอาด 45–55%)',
    adultRamWeightKg: '115 – 145 กก.',
    adultEweWeightKg: '75 – 100 กก.',
    averageAdgGrams: '220 – 290 กรัม/วัน',
    weaningWeightKg: '25 – 32 กก. (ที่ 90 วัน)',
    twinningRatePct: '130 – 160%',
    photoUrl: '/assets/breeds/columbia.webp',
    highlightFeatures: [
      'พัฒนาโดยกระทรวงเกษตรสหรัฐฯ เพื่อให้ทนทานต่อทุ่งหญ้ากว้างและให้ขนปริมาณมาก',
      'ลำตัวใหญ่โต แข็งแรง หน้าขาว ไร้เขา ดูแลจัดการง่าย',
      'ความยาวเส้นขนดีเหมาะสำหรับงานปั่นเส้นด้ายทอผ้าห่มและเสื้อกันหนาว',
    ],
    climateAdaptation:
      'ทนทานต่อสภาพอากาศแปรปรวนได้ดี ต้องการร่มเงาและน้ำดื่มสะอาดเพียงพอในฤดูร้อน',
    feedingStrategy:
      'กินอาหารหยาบปริมาณมากได้มีประสิทธิภาพ ปรับตัวกับระบบปล่อยแปลงแทะเล็มได้ดี',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มที่มีแปลงหญ้ากว้างขวาง ต้องการแกะโครงสร้างใหญ่ที่ให้ผลผลิตขนปริมาณมากต่อตัว',
    colorTheme: 'from-blue-900 via-indigo-900 to-slate-950',
  },
  {
    id: 'breed-hampshire',
    rank: 6,
    isTopRecommended: false,
    recommendationReason:
      'โตเร็วที่สุดในกลุ่มแกะขน (ADG 250–330 กรัม/วัน) ให้ลูกดก 140–180% และมีขนปานกลางคลุมหนาแน่นสม่ำเสมอ',
    nameTh: 'แฮมป์เชียร์ (Hampshire Down)',
    nameEn: 'Hampshire Down Wool Sheep',
    origin: 'ประเทศอังกฤษ (มณฑลแฮมป์เชียร์)',
    type: 'medium_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนปานกลางโครงสร้างกำยำ โตเร็ว ลูกดก (Fast-Growing Down Wool)',
    woolGrade: 'มีเดียม-ดาวน์วูลหนาแน่น สีขาวครีม (25.0 – 33.0 ไมครอน, ยาว 5–9 ซม.)',
    fleeceWeightKg: '2.7 – 4.5 กก./ปี (ขนหนาแน่นปานกลาง)',
    adultRamWeightKg: '110 – 135 กก.',
    adultEweWeightKg: '75 – 95 กก.',
    averageAdgGrams: '250 – 330 กรัม/วัน',
    weaningWeightKg: '27 – 34 กก. (ที่ 90 วัน)',
    twinningRatePct: '140 – 180%',
    photoUrl: HAMPSHIRE_PHOTO,
    highlightFeatures: [
      'เอกลักษณ์เด่น: ใบหน้า หู และปลายขาสีน้ำตาลเข้มเกือบดำตัดกับขนลำตัวสีขาวหนาฟู',
      'อัตราการเจริญเติบโต (ADG) สูงมาก ลูกแกะแข็งแรงและหย่านมเร็ว',
      'ร้อยละการให้ลูก/คอกสูงถึง 140–180% แม่แกะดูแลลูกเก่ง',
      'ขนมีความยืดหยุ่น (Elasticity) สูง นิยมใช้ทำผ้าสักหลาด ผ้าห่ม และพรมขนสัตว์',
    ],
    climateAdaptation:
      'ต้องมีหลังคากันแดดและพัดลมระบายอากาศในช่วงอากาศร้อนชื้น ควรตัดขนปีละ 1–2 ครั้งเพื่อความสบายตัว',
    feedingStrategy:
      'เป็นแกะโตเร็ว ต้องการโปรตีน 14–16% CP ในช่วงแกะรุ่นและแม่ให้นม เพื่อรองรับโครงสร้างและน้ำนม',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มที่ต้องการแกะขนที่เลี้ยงโตไว รูปลักษณ์โดดเด่นดึงดูดนักท่องเที่ยว และขยายฝูงได้รวดเร็ว',
    colorTheme: 'from-stone-800 via-amber-950 to-slate-950',
  },
  {
    id: 'breed-romney',
    rank: 7,
    isTopRecommended: false,
    recommendationReason:
      'เด่นที่สุดเรื่องความทนต่อความชื้น ฝนชุก และโรคกีบเน่า เหมาะกับภูมิอากาศมรสุมหรือภาคใต้/ภาคตะวันออกของไทย',
    nameTh: 'รอมนีย์ (Romney Marsh)',
    nameEn: 'Romney Longwool Sheep',
    origin: 'ประเทศอังกฤษ (ที่ลุ่มชื้นแฉะมณฑลเคนต์) / แพร่หลายมากในนิวซีแลนด์',
    type: 'long_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนยาวทนความชื้นสูง ต้านโรคกีบเน่าดีเยี่ยม',
    woolGrade: 'ลองวูลกึ่งเงางาม ละเอียดสุดในกลุ่มขนยาว (31.0 – 38.0 ไมครอน)',
    fleeceWeightKg: '3.6 – 5.4 กก./ปี (ผลผลิตขนสะอาดสูง 60–70%)',
    adultRamWeightKg: '100 – 125 กก.',
    adultEweWeightKg: '68 – 88 กก.',
    averageAdgGrams: '200 – 270 กรัม/วัน',
    weaningWeightKg: '25 – 30 กก. (ที่ 90 วัน)',
    twinningRatePct: '140 – 170%',
    photoUrl: '/assets/breeds/romney.jpg',
    highlightFeatures: [
      'ทนทานต่อโรคกีบเน่า (Foot-rot resistance) และความชื้นสูงกว่าแกะขนพันธุ์อื่นอย่างชัดเจน',
      'เป็นสายพันธุ์แกะหลักที่มีประชากรมากที่สุดในประเทศนิวซีแลนด์',
      'เส้นใยขนยาวนุ่ม เงาวาว และต้านทานพยาธิทางเดินอาหารได้ค่อนข้างดี',
    ],
    climateAdaptation:
      'เหมาะที่สุดสำหรับพื้นที่ในประเทศไทยที่มีฝนตกชุกหรือมีความชื้นสัมพัทธ์สูง',
    feedingStrategy:
      'แทะเล็มหญ้าสดได้ดีมาก เสริมแร่ธาตุสังกะสีและทองแดงในระดับปลอดภัยต่อแกะเพื่อบำรุงความแข็งแรงของกีบและขน',
    suitabilityForThaiFarms:
      'แนะนำสำหรับฟาร์มแกะขนในภาคใต้ ภาคตะวันออก หรือพื้นที่ที่มีฤดูฝนยาวนาน',
    colorTheme: 'from-blue-900 to-indigo-950',
  },
  {
    id: 'breed-debouillet',
    rank: 8,
    isTopRecommended: false,
    recommendationReason:
      'ขนละเอียดคุณภาพดีและทนแดดทนแล้งสูงมาก เหมาะกับพื้นที่แห้งแล้งหรือแปลงหญ้าคุณภาพปานกลาง',
    nameTh: 'เดอบูเยต์ (Debouillet)',
    nameEn: 'Debouillet Arid Fine Wool',
    origin: 'รัฐนิวเม็กซิโก สหรัฐอเมริกา (Delaine-Merino x Rambouillet)',
    type: 'fine_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนละเอียดทนแล้งและแดดจัด (Arid Fine Wool)',
    woolGrade: 'ไฟน์วูลยาวและเหนียวทนทาน (18.0 – 23.5 ไมครอน)',
    fleeceWeightKg: '4.3 – 8.1 กก./ปี (ผลผลิตขนสะอาด 35–55%)',
    adultRamWeightKg: '90 – 115 กก.',
    adultEweWeightKg: '57 – 75 กก.',
    averageAdgGrams: '175 – 230 กรัม/วัน',
    weaningWeightKg: '22 – 27 กก. (ที่ 90 วัน)',
    twinningRatePct: '120 – 140%',
    photoUrl: '/assets/breeds/debouillet.webp',
    highlightFeatures: [
      'คัดเลือกพันธุ์เพื่อทุ่งหญ้าแห้งแล้งโดยเฉพาะ เดินหากินเก่งและอึดทน',
      'คลอดลูกเองตามธรรมชาติได้ง่าย ไม่ต้องช่วยคลอดบ่อย',
      'ให้ขนละเอียดยาวและสม่ำเสมอแม้ใช้อาหารหยาบแห้ง',
    ],
    climateAdaptation:
      'ทนความร้อนและแดดจ้าได้ดีมาก เหมาะกับภาคตะวันออกเฉียงเหนือในช่วงฤดูแล้ง',
    feedingStrategy:
      'ใช้ประโยชน์จากหญ้าแห้งและฟางหมักได้ดี ควรมีแร่ธาตุก้อนเลียและน้ำสะอาดให้ตลอดวัน',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มในเขตแห้งแล้งที่ต้องการสายพันธุ์ขนละเอียดซึ่งดูแลง่ายและลดต้นทุนอาหารข้น',
    colorTheme: 'from-blue-950 via-slate-900 to-zinc-950',
  },
  {
    id: 'breed-lincoln',
    rank: 9,
    isTopRecommended: false,
    recommendationReason:
      'ขนยาวเป็นลอนเงางามที่สุดในโลก (20–35 ซม.) น้ำหนักขนดิบสูงถึง 5.5–9+ กก./ปี เหมาะกับงานทอพรมและท่องเที่ยวเชิงเกษตร',
    nameTh: 'ลินคอล์น (Lincoln Longwool)',
    nameEn: 'Lincoln Longwool Sheep',
    origin: 'ประเทศอังกฤษ (มณฑลลินคอล์นเชียร์)',
    type: 'long_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนยาวเป็นลอนเงาวาวที่สุดในโลก (World Longest Lustre Wool)',
    woolGrade: 'ลองวูลลอนคลื่นขนาดใหญ่ เงาวาว (33.5 – 41.0 ไมครอน, ยาว 20–35 ซม.)',
    fleeceWeightKg: '5.5 – 9.0 กก./ปี (ผลผลิตขนสะอาดสูง 50–62%)',
    adultRamWeightKg: '115 – 150 กก.',
    adultEweWeightKg: '80 – 110 กก.',
    averageAdgGrams: '210 – 280 กรัม/วัน',
    weaningWeightKg: '25 – 32 กก. (ที่ 90 วัน)',
    twinningRatePct: '125 – 150%',
    photoUrl: '/assets/breeds/lincoln_3913.jpg',
    highlightFeatures: [
      'เส้นขนยาวที่สุดในบรรดาแกะทั้งหมด และมีความเงาสะท้อนแสงเป็นเอกลักษณ์',
      'รูปร่างใหญ่สง่างาม มีปอยขนหยิกลงมาปรกหน้าผากสวยงาม',
      'เป็นบรรพบุรุษสำคัญในการสร้างสายพันธุ์ Corriedale และ Columbia',
    ],
    climateAdaptation:
      'ในไทยต้องดูแลเรื่องความสะอาดของขนที่ยาวและจัดพื้นที่ร่มเย็นไม่อับชื้นเพื่อป้องกันขนจับก้อน',
    feedingStrategy:
      'ต้องการปริมาณวัตถุแห้ง (DMI) สูงตามขนาดตัว ควรตัดขนทุก 6–8 เดือนในเขตร้อนเพื่อป้องกันความร้อนสะสม',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มท่องเที่ยวเชิงเกษตร งานอนุรักษ์พันธุ์ และผู้แปรรูปพรมหรือผ้าทอมือเส้นใยยาวพิเศษ',
    colorTheme: 'from-blue-950 via-sky-950 to-slate-950',
  },
  {
    id: 'breed-cotswold',
    rank: 10,
    isTopRecommended: false,
    recommendationReason:
      'โดดเด่นด้วยขนหยิกเป็นลอนหลอดเหมือนแผงคอสิงโต เชื่องเข้ากับคนง่าย ดึงดูดสายตาในฟาร์มเชิงท่องเที่ยวและงานคราฟต์',
    nameTh: 'คอตส์โวลด์ (Cotswold)',
    nameEn: 'Cotswold Longwool (The Cotswold Lion)',
    origin: 'เทือกเขาคอตส์โวลด์ ประเทศอังกฤษ',
    type: 'long_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนลอนหลอดเงางาม นิสัยเชื่องสุภาพ (The Cotswold Lion)',
    woolGrade: 'ลองวูลหยิกลอนหลอดคล้ายไหม (32.0 – 42.0 ไมครอน, ยาว 20–30 ซม.)',
    fleeceWeightKg: '4.0 – 7.0 กก./ปี (ผลผลิตขนสะอาดประมาณ 60%)',
    adultRamWeightKg: '110 – 135 กก.',
    adultEweWeightKg: '75 – 100 กก.',
    averageAdgGrams: '200 – 260 กรัม/วัน',
    weaningWeightKg: '24 – 30 กก. (ที่ 90 วัน)',
    twinningRatePct: '100 – 150%',
    photoUrl: '/assets/breeds/cotswold_3916.jpg',
    highlightFeatures: [
      'ขนยาวหยิกเป็นเกลียวหลอด (Ringlets) คลุมหน้าผากและรอบลำตัวเป็นเอกลักษณ์',
      'นิสัยอ่อนโยน สุภาพ และเชื่องมาก เหมาะกับฟาร์มเปิดให้ความรู้',
      'เส้นขนเงางามดุจเส้นไหม เหมาะสำหรับงานปั่นด้ายทำมือ (Handspinning)',
    ],
    climateAdaptation:
      'ชอบพื้นที่แห้งสะอาดไม่แฉะโคลน และต้องการโรงเรือนระบายอากาศดีเป็นพิเศษในฤดูร้อน',
    feedingStrategy:
      'เน้นหญ้าแห้งคุณภาพดีและแร่ธาตุสังกะสี-กำมะถันเพื่อคงความเงางามของลอนขน',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มท่องเที่ยวเชิงเกษตร รีสอร์ตบนดอย และกลุ่มงานฝีมือปั่นด้ายขนแกะ',
    colorTheme: 'from-indigo-900 via-blue-950 to-slate-900',
  },
  {
    id: 'breed-askanian',
    rank: 11,
    isTopRecommended: false,
    recommendationReason:
      'พันธุ์แกะขนละเอียดโครงสร้างใหญ่ที่พัฒนาในเขตหนาวแห้ง ให้ขนหนักมากในพ่อพันธุ์ แต่ต้องจัดการโรงเรือนคลายร้อนในไทยอย่างเข้มข้น',
    nameTh: 'แอสคาเนียน (Askanian Fine Wool)',
    nameEn: 'Askanian Fine Wool Sheep',
    origin: 'สถาบัน Askania-Nova ประเทศยูเครน (พัฒนาจาก Merino x Rambouillet)',
    type: 'fine_wool',
    categoryGroup: 'wool',
    typeLabel: 'แกะขนละเอียดโครงสร้างยักษ์จากเขตหนาว (High-Fleece Fine Wool)',
    woolGrade: 'ไฟน์วูลหนาแน่นสม่ำเสมอ (20.0 – 24.0 ไมครอน, ยาว 8–10 ซม.)',
    fleeceWeightKg: '5.0 – 10.5 กก./ปี (แม่พันธุ์ 3.5–6 กก., พ่อพันธุ์คัดพิเศษ 10–11 กก.)',
    adultRamWeightKg: '110 – 140 กก.',
    adultEweWeightKg: '65 – 85 กก.',
    averageAdgGrams: '210 – 280 กรัม/วัน',
    weaningWeightKg: '24 – 31 กก. (ที่ 90 วัน)',
    twinningRatePct: '120 – 150%',
    photoUrl: '/assets/breeds/askanian_3915.jpg',
    highlightFeatures: [
      'เป็นแกะขนละเอียดที่มีขนาดตัวใหญ่และให้น้ำหนักขนต่อตัวสูงมาก',
      'พ่อพันธุ์มีเขาเกลียวใหญ่สง่างามและรอยพับรอบคอชัดเจน',
      'เส้นใยสีขาวครีมสม่ำเสมอ ทนต่อสภาพลมหนาวและทุ่งราบได้ดี',
    ],
    climateAdaptation:
      'ปรับตัวเด่นในเขตอากาศหนาวเย็น ในประเทศไทยจำเป็นต้องเลี้ยงบนพื้นที่สูงอากาศเย็นหรือโรงเรือนติดพัดลมระบายอากาศและตัดขนสม่ำเสมอ',
    feedingStrategy:
      'ต้องการโปรตีนและพลังงานสูงเพื่อรองรับทั้งโครงสร้างร่างกายขนาดใหญ่และการสร้างเส้นขนปริมาณมาก',
    suitabilityForThaiFarms:
      'เหมาะสำหรับฟาร์มบนยอดดอยภาคเหนือที่มีอากาศเย็นตลอดปี หรือใช้เพื่อการศึกษาเทียบสายพันธุ์ขนละเอียด',
    colorTheme: 'from-blue-900 via-slate-900 to-indigo-950',
  },
];
