/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FeedIngredient,
  NutrientRequirement,
  Pen,
  RationIngredientItem,
  Sheep,
  SheepStage,
} from '../types/sheep';

export interface WoolNutritionReason {
  key: 'soundness' | 'gfw' | 'staple' | 'handle' | 'crimp';
  severity: 'action' | 'tip' | 'good';
  titleTh: string;
  detailTh: string;
  effectTh: string;
}

export interface WoolNutritionAdjustment {
  sampleCount: number;
  hasPenSideData: boolean;
  hasAdjustments: boolean;
  cpDeltaPct: number;
  tdnDeltaPct: number;
  roughageMinPctDelta: number;
  summaryHeadlineTh: string;
  reasons: WoolNutritionReason[];
  metrics: {
    avgGfwKg: number | null;
    avgBodyGfwKg: number | null;
    avgSkirtingsKg: number | null;
    avgStapleCm: number | null;
    weakBaseOrMidCount: number;
    weakTipCount: number;
    dryHarshCount: number;
    denseCrimpCount: number;
  };
}

/**
 * วิเคราะห์พารามิเตอร์ขนแกะที่วัดเองหน้าคอก 4 ด้าน เพื่อแปลเป็นคำแนะนำปรับสูตรอาหารแบบเข้าใจง่าย
 */
export function analyzeWoolNutritionAdjustments(
  sheepInput: Sheep | Sheep[]
): WoolNutritionAdjustment {
  const list = Array.isArray(sheepInput) ? sheepInput : [sheepInput];
  if (list.length === 0) {
    return {
      sampleCount: 0,
      hasPenSideData: false,
      hasAdjustments: false,
      cpDeltaPct: 0,
      tdnDeltaPct: 0,
      roughageMinPctDelta: 0,
      summaryHeadlineTh: 'ยังไม่มีข้อมูลแกะในคอกสำหรับประเมินผลขน',
      reasons: [],
      metrics: {
        avgGfwKg: null,
        avgBodyGfwKg: null,
        avgSkirtingsKg: null,
        avgStapleCm: null,
        weakBaseOrMidCount: 0,
        weakTipCount: 0,
        dryHarshCount: 0,
        denseCrimpCount: 0,
      },
    };
  }

  const gfwValues: number[] = [];
  const bodyGfwValues: number[] = [];
  const skirtingsValues: number[] = [];
  const stapleValues: number[] = [];

  let weakBaseOrMidCount = 0;
  let weakTipCount = 0;
  let strongCount = 0;
  let dryHarshCount = 0;
  let denseCrimpCount = 0;
  let penSideFieldCount = 0;

  for (const s of list) {
    const hasSplitGfw = s.gfwBodyKg != null || s.gfwSkirtingsKg != null;
    if (hasSplitGfw) {
      penSideFieldCount++;
      const body = Number(s.gfwBodyKg ?? 0);
      const skirt = Number(s.gfwSkirtingsKg ?? 0);
      if (s.gfwBodyKg != null) bodyGfwValues.push(body);
      if (s.gfwSkirtingsKg != null) skirtingsValues.push(skirt);
      const total = body + skirt;
      if (total > 0) gfwValues.push(total);
    } else if (s.fleeceYieldKg != null && s.fleeceYieldKg > 0) {
      gfwValues.push(Number(s.fleeceYieldKg));
    }

    if (s.woolStapleLengthCm != null && s.woolStapleLengthCm > 0) {
      stapleValues.push(Number(s.woolStapleLengthCm));
    }

    if (s.woolSoundness) {
      penSideFieldCount++;
      if (s.woolSoundness === 'weak_base' || s.woolSoundness === 'weak_mid') {
        weakBaseOrMidCount++;
      } else if (s.woolSoundness === 'weak_tip') {
        weakTipCount++;
      } else if (s.woolSoundness === 'strong') {
        strongCount++;
      }
    }

    if (s.woolHandle) {
      penSideFieldCount++;
      if (s.woolHandle === 'dry_harsh') dryHarshCount++;
    }

    if (s.woolCrimpStyle) {
      penSideFieldCount++;
      if (s.woolCrimpStyle === 'dense') denseCrimpCount++;
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length > 0 ? Number((arr.reduce((sum, v) => sum + v, 0) / arr.length).toFixed(2)) : null;

  const avgGfwKg = avg(gfwValues);
  const avgBodyGfwKg = avg(bodyGfwValues);
  const avgSkirtingsKg = avg(skirtingsValues);
  const avgStapleCm = avg(stapleValues);

  let rawCpDelta = 0;
  let rawTdnDelta = 0;
  const rawRoughageDelta = 0;
  const reasons: WoolNutritionReason[] = [];

  // 1. ความแข็งแรงเบื้องต้น (Soundness / Hand-break test)
  if (weakBaseOrMidCount > 0) {
    const ratio = weakBaseOrMidCount / list.length;
    const isMajor = list.length === 1 || ratio >= 0.25;
    const cpAdd = isMajor ? 1.0 : 0.5;
    const tdnAdd = isMajor ? 2.0 : 1.0;
    rawCpDelta += cpAdd;
    rawTdnDelta += tdnAdd;
    reasons.push({
      key: 'soundness',
      severity: 'action',
      titleTh:
        list.length === 1
          ? 'ขนขาดง่ายช่วงโคน/กลางเส้น'
          : `พบขนขาดง่ายช่วงโคน/กลาง ${weakBaseOrMidCount} ตัว`,
      detailTh:
        'ช่อขนเปราะขาดกลาง/โคนมักเกิดจากแกะขาดโปรตีน-พลังงานเฉียบพลันหรือขาดแร่ธาตุกำมะถัน/สังกะสี',
      effectTh: `เพิ่ม +${cpAdd.toFixed(1)}% CP และ +${tdnAdd.toFixed(1)}% TDN + เสริมพรีมิกซ์กำมะถัน`,
    });
  } else if (weakTipCount > 0) {
    reasons.push({
      key: 'soundness',
      severity: 'tip',
      titleTh: 'ปลายเส้นขนกรอบแดดเล็กน้อย',
      detailTh: 'ช่วงโคนและกลางเส้นยังเหนียวปกติ ปลายขนเปราะเกิดจากแดดจัดหรือฝนชะล้าง',
      effectTh: 'คงสูตรอาหารเดิมได้ แต่ควรจัดร่มเงาในคอกเพิ่ม',
    });
  } else if (strongCount > 0) {
    reasons.push({
      key: 'soundness',
      severity: 'good',
      titleTh: 'ความแข็งแรงขนดี (ไม่ขาดง่าย)',
      detailTh: 'เส้นใยขนสร้างเคราตินสม่ำเสมอตลอดความยาวช่อขน',
      effectTh: 'โภชนาการโปรตีนปัจจุบันเพียงพอแล้ว',
    });
  }

  // 2. น้ำหนักขนดิบ (Greasy Fleece Weight - GFW)
  if (avgGfwKg != null && avgGfwKg >= 5.5) {
    rawCpDelta += 0.5;
    reasons.push({
      key: 'gfw',
      severity: 'action',
      titleTh: `ขนดกน้ำหนักดิบรวมสูง (${avgGfwKg.toFixed(1)} กก./ปี)`,
      detailTh: 'แกะที่ให้ปริมาณขนมากต้องดึงโปรตีนและกรดอะมิโนที่มีกำมะถันไปสร้างเส้นใยสูงกว่าปกติ',
      effectTh: 'เพิ่ม +0.5% CP เพื่อไม่ให้แม่แกะผอมโทรมหลังตัดขน',
    });
  }
  if (avgBodyGfwKg != null && avgSkirtingsKg != null && avgBodyGfwKg + avgSkirtingsKg > 0) {
    const skirtRatio = avgSkirtingsKg / (avgBodyGfwKg + avgSkirtingsKg);
    if (skirtRatio >= 0.3) {
      reasons.push({
        key: 'gfw',
        severity: 'tip',
        titleTh: `สัดส่วนเศษขนชายท้อง/ขาสูง (${Math.round(skirtRatio * 100)}%)`,
        detailTh: 'เศษขนเปื้อนเยอะทำให้ขนลำตัวเสียราคา ควรคัดแยกถุงตอนตัดและปูพื้นคอกให้แห้ง',
        effectTh: 'แยกชั่งขายเฉพาะขนลำตัวเพื่อทำราคาสูงขึ้น',
      });
    }
  }

  // 3. ความยาวช่อขน (Staple Length)
  if (avgStapleCm != null && avgStapleCm < 7.0) {
    rawTdnDelta += 1.5;
    const cpExtra = weakBaseOrMidCount === 0 ? 0.5 : 0;
    rawCpDelta += cpExtra;
    reasons.push({
      key: 'staple',
      severity: 'action',
      titleTh: `ความยาวช่อขนสั้น (${avgStapleCm.toFixed(1)} ซม. / ${(avgStapleCm * 10).toFixed(0)} มม.)`,
      detailTh: 'ช่อขนยาวช้ากว่าเกณฑ์ 7 ซม. มักสัมพันธ์กับพลังงานและโปรตีนไม่พอเร่งการยืดตัวของเส้นใย',
      effectTh:
        cpExtra > 0
          ? 'เพิ่ม +1.5% TDN และ +0.5% CP เร่งการเติบโตช่อขน'
          : 'เพิ่ม +1.5% TDN ช่วยให้เส้นใยยืดยาวไวขึ้น',
    });
  } else if (avgStapleCm != null && avgStapleCm >= 9.0) {
    reasons.push({
      key: 'staple',
      severity: 'good',
      titleTh: `ช่อขนยาวสวย (${avgStapleCm.toFixed(1)} ซม. / ${(avgStapleCm * 10).toFixed(0)} มม.)`,
      detailTh: 'ความยาวตามธรรมชาติได้มาตรฐานเส้นใยปั่นด้ายคุณภาพสูง',
      effectTh: 'รักษาสมดุลอาหารพลังงาน-โปรตีนชุดนี้ต่อเนื่อง',
    });
  }

  // 4. ความนุ่มและลอนขน (Crimp & Handle)
  if (dryHarshCount > 0) {
    const ratio = dryHarshCount / list.length;
    const tdnAdd = list.length === 1 || ratio >= 0.25 ? 1.5 : 1.0;
    rawTdnDelta += tdnAdd;
    reasons.push({
      key: 'handle',
      severity: 'action',
      titleTh:
        list.length === 1
          ? 'ขนแห้งสาก ไขขน (Lanolin) น้อย'
          : `พบขนแห้งสากไขขนน้อย ${dryHarshCount} ตัว`,
      detailTh: 'ไขขนช่วยเคลือบเส้นใยให้นุ่มลื่นและกันน้ำ หากแห้งหยาบมักเกิดจากพลังงาน/ไขมันดีในอาหารต่ำ',
      effectTh: `เพิ่มพลังงาน +${tdnAdd.toFixed(1)}% TDN (เช่น รำข้าว/ข้าวโพด) เพิ่มไขขนธรรมชาติ`,
    });
  }

  if (denseCrimpCount > 0) {
    reasons.push({
      key: 'crimp',
      severity: 'good',
      titleTh:
        list.length === 1
          ? 'ลอนคลื่นถี่สม่ำเสมอ (เส้นใยละเอียด)'
          : `แกะลอนขนถี่สม่ำเสมอ ${denseCrimpCount} ตัว`,
      detailTh: 'ลอนขนถี่บอกถึงความละเอียดของเส้นใย ต้องให้อาหารสม่ำเสมอทุกวันเพื่อไม่ให้ลอนขนคอดกิ่ว',
      effectTh: 'ห้ามปล่อยให้ขาดอาหารช่วงใดช่วงหนึ่ง',
    });
  }

  // Safety physiological caps
  const cpDeltaPct = Math.min(2.0, Number(rawCpDelta.toFixed(1)));
  const tdnDeltaPct = Math.min(4.0, Number(rawTdnDelta.toFixed(1)));
  const roughageMinPctDelta = Math.min(10, Math.round(rawRoughageDelta));
  const hasAdjustments = cpDeltaPct > 0 || tdnDeltaPct > 0 || roughageMinPctDelta > 0;

  let summaryHeadlineTh = 'คุณภาพขนอยู่ในเกณฑ์ดี ใช้เกณฑ์โภชนาการมาตรฐาน NRC ได้เลย';
  if (hasAdjustments) {
    const parts: string[] = [];
    if (cpDeltaPct > 0) parts.push(`โปรตีน +${cpDeltaPct}% CP`);
    if (tdnDeltaPct > 0) parts.push(`พลังงาน +${tdnDeltaPct}% TDN`);
    if (roughageMinPctDelta > 0) parts.push(`หญ้าหยาบ +${roughageMinPctDelta}%`);
    summaryHeadlineTh = `แนะนำปรับเป้าสูตรอาหาร: ${parts.join(' · ')}`;
  }

  return {
    sampleCount: list.length,
    hasPenSideData: penSideFieldCount > 0 || stapleValues.length > 0 || gfwValues.length > 0,
    hasAdjustments,
    cpDeltaPct,
    tdnDeltaPct,
    roughageMinPctDelta,
    summaryHeadlineTh,
    reasons,
    metrics: {
      avgGfwKg,
      avgBodyGfwKg,
      avgSkirtingsKg,
      avgStapleCm,
      weakBaseOrMidCount,
      weakTipCount,
      dryHarshCount,
      denseCrimpCount,
    },
  };
}

/**
 * คำนวณความต้องการโภชนาการของแกะตามน้ำหนักตัว ระยะการผลิต และเป้าหมายการเจริญเติบโต (NRC Sheep Standards & DLD Thailand)
 */
export function calculateSheepNutrientRequirement(
  weightKg: number,
  stage: SheepStage,
  adgTargetGrams: number = 150,
  woolAdjustment?: WoolNutritionAdjustment | null
): NutrientRequirement {
  const safeWeight = Math.max(3, Math.min(120, weightKg));

  let dmiPercentBw = 2.5;
  let cpPercent = 10.0;
  let tdnPercent = 55.0;
  let caPercent = 0.35;
  let pPercent = 0.22;
  let targetRcRatio = '70:30';

  switch (stage) {
    case 'wool_lamb':
      // ลูกแกะเล็ก (0-3 เดือน / ดูดนมและเสริมอาหารเลียราง)
      dmiPercentBw = 4.2;
      cpPercent = 17.0;
      tdnPercent = 72.0;
      caPercent = 0.65;
      pPercent = 0.38;
      targetRcRatio = '35:65';
      break;

    case 'wool_weaning':
      // ลูกแกะหย่านม (3-6 เดือน)
      dmiPercentBw = 4.0;
      cpPercent = 15.0;
      tdnPercent = 68.0;
      caPercent = 0.55;
      pPercent = 0.32;
      targetRcRatio = '45:55';
      break;

    case 'wool_maintenance':
    default:
      // แกะขนตัวเต็มวัย / บำรุงรักษาเส้นใยขน (Maintenance & Wool Growth)
      dmiPercentBw = 2.4;
      cpPercent = 10.5; // เสริมโปรตีนเพื่อสังเคราะห์เคราตินในเส้นใย
      tdnPercent = 58.0;
      caPercent = 0.35;
      pPercent = 0.22;
      targetRcRatio = '75:25';
      break;

    case 'wool_growing':
      // แกะรุ่นขน / พัฒนาโครงร่างและต่อมสร้างเส้นขน (6-15 เดือน)
      dmiPercentBw = 3.4;
      cpPercent = 13.5;
      tdnPercent = 64.0;
      caPercent = 0.50;
      pPercent = 0.28;
      targetRcRatio = '55:45';
      break;

    case 'wool_gestation':
      // แม่แกะขนอุ้มท้อง (รวมทุกระยะ)
      dmiPercentBw = 3.2;
      cpPercent = 12.5;
      tdnPercent = 64.0;
      caPercent = 0.48;
      pPercent = 0.30;
      targetRcRatio = '60:40';
      break;

    case 'wool_lactation':
      // แม่แกะขนระยะให้นมลูกแกะขน
      dmiPercentBw = 4.2;
      cpPercent = 15.0;
      tdnPercent = 68.0;
      caPercent = 0.60;
      pPercent = 0.36;
      targetRcRatio = '45:55';
      break;

    case 'wool_ram':
      // พ่อพันธุ์แกะขน บำรุงสมบูรณ์พันธุ์และต่อมรากขน
      dmiPercentBw = 2.8;
      cpPercent = 12.0;
      tdnPercent = 62.0;
      caPercent = 0.40;
      pPercent = 0.25;
      targetRcRatio = '70:30';
      break;
  }

  if (woolAdjustment && woolAdjustment.hasAdjustments) {
    cpPercent = Number(Math.min(19.0, cpPercent + woolAdjustment.cpDeltaPct).toFixed(1));
    tdnPercent = Number(Math.min(76.0, tdnPercent + woolAdjustment.tdnDeltaPct).toFixed(1));
    if (woolAdjustment.roughageMinPctDelta > 0) {
      const [rStr] = targetRcRatio.split(':');
      const baseR = Number(rStr) || 60;
      const nextR = Math.min(80, baseR + woolAdjustment.roughageMinPctDelta);
      targetRcRatio = `${nextR}:${100 - nextR}`;
    }
  }

  const dmiKgMid = (safeWeight * dmiPercentBw) / 100;
  const dmiKgMin = Number((dmiKgMid * 0.9).toFixed(2));
  const dmiKgMax = Number((dmiKgMid * 1.1).toFixed(2));

  // คำนวณเป็นกรัมต่อวัน
  const cpGrams = Number(((dmiKgMid * cpPercent) / 100 * 1000).toFixed(0));
  const tdnGrams = Number(((dmiKgMid * tdnPercent) / 100 * 1000).toFixed(0));

  return {
    dmiKgMin,
    dmiKgMax,
    dmiPercentBw,
    cpPercent,
    cpGrams,
    tdnPercent,
    tdnGrams,
    calciumPercent: caPercent,
    phosphorusPercent: pPercent,
    targetRcRatio,
  };
}

export interface CalculatedRationStats {
  totalAsFedKg: number;
  totalDmKg: number;
  calculatedCpPercent: number; // % CP บนฐานวัตถุแห้ง DM
  calculatedTdnPercent: number;// % TDN บนฐาน DM
  calculatedCaPercent: number; // % Ca บนฐาน DM
  calculatedPPercent: number;  // % P บนฐาน DM
  caPRatio: number;            // อัตราส่วน Ca : P
  roughagePercent: number;     // สัดส่วนอาหารหยาบ (% DM)
  concentratePercent: number;  // สัดส่วนอาหารข้น (% DM)
  costPerKgMix: number;        // ต้นทุนบาท/กก. อาหารสด
  costPerHeadPerDay: number;   // ต้นทุนบาท/ตัว/วัน
  dmiAdequacyPct: number;      // % เทียบกับเป้าหมาย DMI
  cpAdequacyPct: number;       // % เทียบกับเป้าหมาย CP
  tdnAdequacyPct: number;      // % เทียบกับเป้าหมาย TDN
}

/**
 * คำนวณคุณค่าทางโภชนาการ ต้นทุน และปริมาณสารอาหารจากส่วนผสมในสูตร
 */
export function calculateRationNutrition(
  items: RationIngredientItem[],
  ingredientsMap: Map<string, FeedIngredient>,
  targetRequirement?: NutrientRequirement,
  baseAsFedKg: number = 3.0
): CalculatedRationStats {
  // คำนวณสัดส่วน % ให้รวมเป็น 100%
  const totalRawPercent = items.reduce((sum, item) => sum + (item.percentInMix || 0), 0);
  const normalizedItems = items.map(item => ({
    ...item,
    normPercent: totalRawPercent > 0 ? (item.percentInMix / totalRawPercent) * 100 : 0
  }));

  let totalDmWeighted = 0;
  let totalCpWeight = 0;
  let totalTdnWeight = 0;
  let totalCaWeight = 0;
  let totalPWeight = 0;
  let totalRoughageDm = 0;
  let totalConcentrateDm = 0;
  let costPerKgMix = 0;

  normalizedItems.forEach(item => {
    const ing = ingredientsMap.get(item.ingredientId);
    if (!ing) return;

    const fraction = item.normPercent / 100;
    // ปริมาณวัตถุแห้งที่ได้จากวัตถุดิบนี้ (บนฐาน As-fed 1 กก.)
    const dmContribution = fraction * (ing.dryMatter / 100);
    totalDmWeighted += dmContribution;

    // สะสมสารอาหาร (บนฐาน DM)
    totalCpWeight += dmContribution * ing.crudeProtein;
    totalTdnWeight += dmContribution * ing.tdn;
    totalCaWeight += dmContribution * ing.calcium;
    totalPWeight += dmContribution * ing.phosphorus;

    if (ing.isRoughage) {
      totalRoughageDm += dmContribution;
    } else {
      totalConcentrateDm += dmContribution;
    }

    // ต้นทุนต่อ กก. อาหารสด
    costPerKgMix += fraction * ing.pricePerKg;
  });

  const avgDmPercent = totalDmWeighted * 100;
  const calculatedCpPercent = totalDmWeighted > 0 ? totalCpWeight / totalDmWeighted : 0;
  const calculatedTdnPercent = totalDmWeighted > 0 ? totalTdnWeight / totalDmWeighted : 0;
  const calculatedCaPercent = totalDmWeighted > 0 ? totalCaWeight / totalDmWeighted : 0;
  const calculatedPPercent = totalDmWeighted > 0 ? totalPWeight / totalDmWeighted : 0;

  const totalDmWeightAll = totalRoughageDm + totalConcentrateDm;
  const roughagePercent = totalDmWeightAll > 0 ? (totalRoughageDm / totalDmWeightAll) * 100 : 0;
  const concentratePercent = 100 - roughagePercent;

  const caPRatio = calculatedPPercent > 0 ? calculatedCaPercent / calculatedPPercent : 2.0;

  // คำนวณปริมาณที่ต้องให้เป็นอาหารสด (กก./วัน) เพื่อให้ได้ DMI ตามที่แกะต้องการ
  const targetDmiKg = targetRequirement 
    ? (targetRequirement.dmiKgMin + targetRequirement.dmiKgMax) / 2
    : baseAsFedKg * 0.4;

  const requiredAsFedKg = avgDmPercent > 0 ? (targetDmiKg / (avgDmPercent / 100)) : baseAsFedKg;
  const finalAsFedKg = Number(requiredAsFedKg.toFixed(2));
  const finalDmKg = Number(((finalAsFedKg * avgDmPercent) / 100).toFixed(2));

  const costPerHeadPerDay = Number((finalAsFedKg * costPerKgMix).toFixed(2));

  const cpAdequacyPct = targetRequirement && targetRequirement.cpPercent > 0
    ? Number(((calculatedCpPercent / targetRequirement.cpPercent) * 100).toFixed(1))
    : 100;

  const tdnAdequacyPct = targetRequirement && targetRequirement.tdnPercent > 0
    ? Number(((calculatedTdnPercent / targetRequirement.tdnPercent) * 100).toFixed(1))
    : 100;

  const dmiAdequacyPct = targetRequirement && targetRequirement.dmiKgMin > 0
    ? Number(((finalDmKg / ((targetRequirement.dmiKgMin + targetRequirement.dmiKgMax) / 2)) * 100).toFixed(1))
    : 100;

  return {
    totalAsFedKg: finalAsFedKg,
    totalDmKg: finalDmKg,
    calculatedCpPercent: Number(calculatedCpPercent.toFixed(2)),
    calculatedTdnPercent: Number(calculatedTdnPercent.toFixed(2)),
    calculatedCaPercent: Number(calculatedCaPercent.toFixed(3)),
    calculatedPPercent: Number(calculatedPPercent.toFixed(3)),
    caPRatio: Number(caPRatio.toFixed(2)),
    roughagePercent: Number(roughagePercent.toFixed(1)),
    concentratePercent: Number(concentratePercent.toFixed(1)),
    costPerKgMix: Number(costPerKgMix.toFixed(2)),
    costPerHeadPerDay,
    dmiAdequacyPct,
    cpAdequacyPct,
    tdnAdequacyPct,
  };
}

/**
 * คำนวณสูตรอาหารแบบ Pearson Square Solver (จับคู่ 2 กลุ่มวัตถุดิบเพื่อให้ได้ % โปรตีนเป้าหมาย)
 */
export function solvePearsonSquare(
  cp1: number, // % โปรตีนของวัตถุดิบ 1 (เช่น อาหารหยาบ หญ้าแพงโกล่า 8%)
  cp2: number, // % โปรตีนของวัตถุดิบ 2 (เช่น อาหารข้นผสม 18%)
  targetCp: number // % โปรตีนเป้าหมาย (เช่น 14%)
): { part1: number; part2: number; percent1: number; percent2: number; isValid: boolean } {
  // targetCp ต้องอยู่ระหว่าง cp1 และ cp2
  const minCp = Math.min(cp1, cp2);
  const maxCp = Math.max(cp1, cp2);

  if (targetCp <= minCp || targetCp >= maxCp) {
    return {
      part1: 50,
      part2: 50,
      percent1: 50,
      percent2: 50,
      isValid: false
    };
  }

  const part1 = Math.abs(cp2 - targetCp);
  const part2 = Math.abs(cp1 - targetCp);
  const totalParts = part1 + part2;

  const percent1 = Number(((part1 / totalParts) * 100).toFixed(1));
  const percent2 = Number((100 - percent1).toFixed(1));

  return {
    part1,
    part2,
    percent1,
    percent2,
    isValid: true
  };
}

export interface PearsonSquareAsFedResult {
  part1: number;
  part2: number;
  dmPercent1: number;
  dmPercent2: number;
  asFedPercent1: number;
  asFedPercent2: number;
  resultingCpPercent: number;
  isValid: boolean;
}

/**
 * คำนวณ Pearson Square บนฐานวัตถุแห้ง (% DM) แล้วแปลงเป็นสัดส่วนอาหารสด (% As-Fed)
 * เพื่อให้เมื่อนำไปชั่งผสมจริงและแสดงผลด้วย calculateRationNutrition แล้วได้ % โปรตีนตรงกับเป้าหมาย
 */
export function solvePearsonSquareAsFed(
  cp1: number,
  dm1: number,
  cp2: number,
  dm2: number,
  targetCp: number
): PearsonSquareAsFedResult {
  const dmRes = solvePearsonSquare(cp1, cp2, targetCp);
  if (!dmRes.isValid) {
    return {
      part1: 50,
      part2: 50,
      dmPercent1: 50,
      dmPercent2: 50,
      asFedPercent1: 50,
      asFedPercent2: 50,
      resultingCpPercent: 0,
      isValid: false,
    };
  }

  const totalParts = dmRes.part1 + dmRes.part2;
  const dmFrac1 = totalParts > 0 ? dmRes.part1 / totalParts : 0.5;
  const dmFrac2 = totalParts > 0 ? dmRes.part2 / totalParts : 0.5;
  const dmPercent1 = Number((dmFrac1 * 100).toFixed(1));
  const dmPercent2 = Number((100 - dmPercent1).toFixed(1));

  const safeDm1 = Math.max(1, dm1) / 100;
  const safeDm2 = Math.max(1, dm2) / 100;

  const asFedWeight1 = dmFrac1 / safeDm1;
  const asFedWeight2 = dmFrac2 / safeDm2;
  const totalAsFedWeight = asFedWeight1 + asFedWeight2;

  const asFedPercent1 =
    totalAsFedWeight > 0 ? Number(((asFedWeight1 / totalAsFedWeight) * 100).toFixed(1)) : 50;
  const asFedPercent2 = Number((100 - asFedPercent1).toFixed(1));

  const dmContrib1 = (asFedPercent1 / 100) * safeDm1;
  const dmContrib2 = (asFedPercent2 / 100) * safeDm2;
  const totalDm = dmContrib1 + dmContrib2;
  const resultingCpPercent =
    totalDm > 0 ? Number(((dmContrib1 * cp1 + dmContrib2 * cp2) / totalDm).toFixed(2)) : 0;

  return {
    part1: dmRes.part1,
    part2: dmRes.part2,
    dmPercent1,
    dmPercent2,
    asFedPercent1,
    asFedPercent2,
    resultingCpPercent,
    isValid: true,
  };
}

/**
 * ประสานข้อมูลคอกแกะให้ตรงกับจำนวนตัว น้ำหนักเฉลี่ย และ ADG จริงจากทะเบียนแกะทุกหน้า
 */
export function computeLivePens(pensTemplate: Pen[], sheepList: Sheep[]): Pen[] {
  return pensTemplate.map(pen => {
    const inPen = sheepList.filter(s => s.penId === pen.id);
    const avgWeight =
      inPen.length > 0
        ? Number((inPen.reduce((sum, s) => sum + (s.weightKg || 0), 0) / inPen.length).toFixed(1))
        : pen.averageWeightKg;
    const avgAdg =
      inPen.length > 0
        ? Math.round(
            inPen.reduce((sum, s) => sum + (s.currentAdgGrams || 0), 0) / inPen.length
          )
        : pen.averageAdgGrams;

    return {
      ...pen,
      sheepCount: inPen.length,
      averageWeightKg: avgWeight,
      averageAdgGrams: avgAdg,
    };
  });
}

/**
 * หาวัย/ระยะการผลิตและสายพันธุ์หลักของแกะในคอกนั้นๆ จากข้อมูลจริง
 */
export function getPenDominantStageAndBreed(
  penId: string,
  sheepList: Sheep[]
): { stage: SheepStage; breed: string } {
  const defaultStageByPen: Record<string, SheepStage> = {
    'pen-a': 'wool_maintenance',
    'pen-b': 'wool_growing',
    'pen-c': 'wool_ram',
    'pen-d': 'wool_lactation',
  };

  const inPen = sheepList.filter(s => s.penId === penId);
  if (inPen.length === 0) {
    return {
      stage: defaultStageByPen[penId] || 'wool_maintenance',
      breed: 'เมอริโน (Merino)',
    };
  }

  const stageCounts = new Map<SheepStage, number>();
  const breedCounts = new Map<string, number>();

  for (const s of inPen) {
    stageCounts.set(s.stage, (stageCounts.get(s.stage) || 0) + 1);
    breedCounts.set(s.breed, (breedCounts.get(s.breed) || 0) + 1);
  }

  let topStage: SheepStage = defaultStageByPen[penId] || inPen[0].stage;
  let topStageCount = -1;
  stageCounts.forEach((count, st) => {
    if (count > topStageCount) {
      topStageCount = count;
      topStage = st;
    }
  });

  let topBreed = inPen[0].breed;
  let topBreedCount = -1;
  breedCounts.forEach((count, br) => {
    if (count > topBreedCount) {
      topBreedCount = count;
      topBreed = br;
    }
  });

  return { stage: topStage, breed: topBreed };
}

/**
 * คำนวณสัดส่วน (%) ของวัตถุดิบที่ฟาร์มเลือก/เพิ่มไว้ในสูตรให้อัตโนมัติครบ 100.0%
 * โดยอิงเป้าหมาย % โปรตีน (CP), พลังงาน (TDN) และสมดุลอาหารหยาบ:ข้น ตามระยะแกะขน
 */
export function autoFormulateRationFromIngredients(
  selectedIngredients: FeedIngredient[],
  targetRequirement: NutrientRequirement
): RationIngredientItem[] {
  // Deduplicate keeping order
  const uniqueIngredients: FeedIngredient[] = [];
  const seen = new Set<string>();
  for (const ing of selectedIngredients) {
    if (!seen.has(ing.id)) {
      seen.add(ing.id);
      uniqueIngredients.push(ing);
    }
  }

  if (uniqueIngredients.length === 0) return [];
  if (uniqueIngredients.length === 1) {
    return [{ ingredientId: uniqueIngredients[0].id, percentInMix: 100 }];
  }

  const ingredientsMap = new Map<string, FeedIngredient>();
  uniqueIngredients.forEach(i => ingredientsMap.set(i.id, i));

  const targetRoughageMatch = targetRequirement.targetRcRatio.match(/^(\d+)/);
  const targetRoughageDmPct = targetRoughageMatch ? Number(targetRoughageMatch[1]) : 60;

  // Separate fixed-cap supplements (minerals / molasses) vs main feeds (roughages + concentrates)
  const fixedCaps = new Map<string, number>();
  const mainFeeds: FeedIngredient[] = [];

  for (const ing of uniqueIngredients) {
    if (ing.category === 'mineral_supplement') {
      fixedCaps.set(ing.id, Math.min(ing.maxInclusionPct ?? 2.0, 2.0));
    } else if (!ing.isRoughage && ing.maxInclusionPct !== undefined && ing.maxInclusionPct <= 8) {
      fixedCaps.set(ing.id, Math.min(ing.maxInclusionPct, 4.0));
    } else {
      mainFeeds.push(ing);
    }
  }

  // If user only picked minerals/supplements, distribute equally to 100%
  if (mainFeeds.length === 0) {
    const base = Number((100 / uniqueIngredients.length).toFixed(1));
    const items = uniqueIngredients.map(i => ({ ingredientId: i.id, percentInMix: base }));
    const diff = Number((100 - items.reduce((s, x) => s + x.percentInMix, 0)).toFixed(1));
    items[0].percentInMix = Number((items[0].percentInMix + diff).toFixed(1));
    return items;
  }

  // Scale down fixed supplements if total exceeds 10%
  const rawFixedSum = Array.from(fixedCaps.values()).reduce((s, v) => s + v, 0);
  if (rawFixedSum > 10) {
    const scale = 8 / rawFixedSum;
    fixedCaps.forEach((v, k) => fixedCaps.set(k, Number((v * scale).toFixed(1))));
  }

  const fixedSum = Array.from(fixedCaps.values()).reduce((s, v) => s + v, 0);
  const remainingPct = Math.max(10, 100 - fixedSum);

  const hasRoughage = mainFeeds.some(i => i.isRoughage);
  const hasConcentrate = mainFeeds.some(i => !i.isRoughage);

  const roughages = mainFeeds.filter(i => i.isRoughage);
  const concentrates = mainFeeds.filter(i => !i.isRoughage);

  // Initialize weights inside mainFeeds with a reasonable roughage/concentrate bias
  const weights = mainFeeds.map(ing => {
    if (hasRoughage && hasConcentrate) {
      return ing.isRoughage
        ? (targetRoughageDmPct / 100) / roughages.length
        : ((100 - targetRoughageDmPct) / 100) / concentrates.length;
    }
    return 1 / mainFeeds.length;
  });

  const minSharePerMain = Math.min(0.05, 0.45 / mainFeeds.length);

  const evaluateObjective = (w: number[]): number => {
    const wSum = w.reduce((s, x) => s + x, 0) || 1;
    const candidateItems: RationIngredientItem[] = uniqueIngredients.map(ing => {
      if (fixedCaps.has(ing.id)) {
        return { ingredientId: ing.id, percentInMix: fixedCaps.get(ing.id)! };
      }
      const mIdx = mainFeeds.findIndex(m => m.id === ing.id);
      return {
        ingredientId: ing.id,
        percentInMix: (w[mIdx] / wSum) * remainingPct,
      };
    });

    const stats = calculateRationNutrition(candidateItems, ingredientsMap, targetRequirement);
    const cpDiff = stats.calculatedCpPercent - targetRequirement.cpPercent;
    const tdnDiff = stats.calculatedTdnPercent - targetRequirement.tdnPercent;
    const rcDiff =
      hasRoughage && hasConcentrate ? (stats.roughagePercent - targetRoughageDmPct) / 10 : 0;

    const rcWeight = targetRoughageDmPct >= 68 ? 5.0 : 3.0;
    let penalty = cpDiff * cpDiff * 16 + tdnDiff * tdnDiff * 2.5 + rcDiff * rcDiff * rcWeight;

    // Penalize low roughage if roughage exists (protect rumen health >= 35% DM)
    if (hasRoughage && stats.roughagePercent < 35) {
      penalty += (35 - stats.roughagePercent) * 4;
    }

    // Respect optional maxInclusionPct on main feeds
    mainFeeds.forEach((ing, idx) => {
      const pct = (w[idx] / wSum) * remainingPct;
      if (ing.maxInclusionPct && pct > ing.maxInclusionPct) {
        penalty += (pct - ing.maxInclusionPct) * 10;
      }
    });

    // Slight cost-efficiency tie-breaker
    penalty += stats.costPerKgMix * 0.03;
    return penalty;
  };

  if (mainFeeds.length > 1) {
    let bestScore = evaluateObjective(weights);
    const steps = [0.24, 0.12, 0.06, 0.03, 0.015, 0.007];
    for (const step of steps) {
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < mainFeeds.length; i++) {
          for (const dir of [1, -1]) {
            const candidate = [...weights];
            candidate[i] = Math.max(minSharePerMain, candidate[i] + dir * step);
            const score = evaluateObjective(candidate);
            if (score < bestScore) {
              weights[i] = candidate[i];
              bestScore = score;
            }
          }
        }
      }
    }
  }

  const finalWSum = weights.reduce((s, x) => s + x, 0) || 1;
  const resultItems: RationIngredientItem[] = uniqueIngredients.map(ing => {
    if (fixedCaps.has(ing.id)) {
      return {
        ingredientId: ing.id,
        percentInMix: Number(fixedCaps.get(ing.id)!.toFixed(1)),
      };
    }
    const mIdx = mainFeeds.findIndex(m => m.id === ing.id);
    const rawPct = (weights[mIdx] / finalWSum) * remainingPct;
    const rounded = Math.max(1.0, Math.round(rawPct * 2) / 2);
    return {
      ingredientId: ing.id,
      percentInMix: rounded,
    };
  });

  // Adjust the largest main feed item so total sum equals 100.0% cleanly
  const currentSum = resultItems.reduce((s, x) => s + x.percentInMix, 0);
  const diff = Number((100 - currentSum).toFixed(1));
  if (Math.abs(diff) > 0) {
    let largestIdx = 0;
    let largestVal = -1;
    resultItems.forEach((item, idx) => {
      if (!fixedCaps.has(item.ingredientId) && item.percentInMix > largestVal) {
        largestVal = item.percentInMix;
        largestIdx = idx;
      }
    });
    resultItems[largestIdx].percentInMix = Number(
      Math.max(1, resultItems[largestIdx].percentInMix + diff).toFixed(1)
    );
  }

  return resultItems;
}

