/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FarmLog, Pen, Sheep } from '../types/sheep';

export interface ActivitySheepFilterOptions {
  penId: string;
  searchTerm: string;
  onlyFemales?: boolean;
  pens?: Pen[];
}

/**
 * กรองรายชื่อแกะสำหรับหน้าบันทึกกิจกรรม โดยระบุคอกก่อน แล้วค้นหาด้วยชื่อ เบอร์หู หรือสายพันธุ์
 */
export function filterSheepForActivity(
  sheepList: Sheep[],
  options: ActivitySheepFilterOptions
): Sheep[] {
  const { penId, searchTerm, onlyFemales = false, pens = [] } = options;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const targetPen = penId && penId !== 'all' ? pens.find(p => p.id === penId) : undefined;

  return sheepList.filter(sheep => {
    if (onlyFemales && sheep.gender !== 'female') {
      return false;
    }

    if (penId && penId !== 'all') {
      const matchById = sheep.penId === penId;
      const matchByCode = targetPen ? sheep.pen === targetPen.code : false;
      const matchByRawCode = sheep.pen === penId;
      if (!matchById && !matchByCode && !matchByRawCode) {
        return false;
      }
    }

    if (normalizedSearch) {
      const matchEarTag = sheep.earTag.toLowerCase().includes(normalizedSearch);
      const matchName = sheep.name.toLowerCase().includes(normalizedSearch);
      const matchBreed = sheep.breed.toLowerCase().includes(normalizedSearch);
      if (!matchEarTag && !matchName && !matchBreed) {
        return false;
      }
    }

    return true;
  });
}

/**
 * หาข้อมูลคอกที่สอดคล้องกับแกะที่เลือกหรือตัวกรองคอกปัจจุบัน
 */
export function resolvePenForActivity(
  pens: Pen[],
  penFilterId: string,
  selectedSheep?: Sheep
): Pen | undefined {
  if (selectedSheep) {
    const sheepPen = pens.find(
      p => p.id === selectedSheep.penId || p.code === selectedSheep.pen
    );
    if (sheepPen) return sheepPen;
  }
  if (penFilterId && penFilterId !== 'all') {
    return pens.find(p => p.id === penFilterId);
  }
  return undefined;
}

export interface ActivitySyncOptions {
  assignedRationId?: string;
  markPregnantOnBreeding?: boolean;
  previousLogs?: FarmLog[];
}

function daysBetweenDates(earlier: string, later: string): number {
  const t1 = Date.parse(earlier);
  const t2 = Date.parse(later);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

function matchesLogTargetSheep(sheep: Sheep, log: Omit<FarmLog, 'id'> | FarmLog): boolean {
  if (log.sheepId && sheep.id === log.sheepId) return true;
  if (log.sheepEarTag && sheep.earTag.toLowerCase() === log.sheepEarTag.toLowerCase()) return true;
  if (
    log.type === 'lambing' &&
    log.damEarTag &&
    (log.damEarTag.toLowerCase().includes(sheep.earTag.toLowerCase()) ||
      log.damEarTag.toLowerCase().includes(sheep.name.toLowerCase()))
  ) {
    return true;
  }
  return false;
}

/**
 * ซิงค์ข้อมูลที่บันทึกจากหน้ากิจกรรม (ชั่งน้ำหนัก, ตัดขน/น้ำหนักขน, ให้อาหาร, วัคซีน/พยาธิ, ผสมพันธุ์, คลอด)
 * ไปอัปเดตข้อมูลแกะรายตัวในทะเบียนฟาร์มโดยอัตโนมัติ
 */
export function applyActivityLogToSheepList(
  sheepList: Sheep[],
  log: Omit<FarmLog, 'id'> | FarmLog,
  options: ActivitySyncOptions = {}
): Sheep[] {
  const { assignedRationId, markPregnantOnBreeding = true, previousLogs = [] } = options;

  return sheepList.map(sheep => {
    // 1. กิจกรรมให้อาหารรายคอก -> อัปเดตสูตรอาหารประจำตัวให้แกะในคอกนั้น
    if (log.type === 'feeding') {
      const rationId = assignedRationId || log.feedRationId;
      if (
        rationId &&
        log.penId &&
        (sheep.penId === log.penId || (log.penName && sheep.pen === log.penName))
      ) {
        return {
          ...sheep,
          assignedRationId: rationId,
        };
      }
      return sheep;
    }

    if (!matchesLogTargetSheep(sheep, log)) {
      return sheep;
    }

    // 2. ชั่งน้ำหนักตัว (+ อัปเดต ADG อัตโนมัติหากมีประวัติชั่งครั้งก่อน + ซิงค์น้ำหนักขนหากระบุควบคู่)
    if (log.type === 'weight') {
      let nextAdg = sheep.currentAdgGrams;
      let nextAdgExp = sheep.adgExplanation;

      if (log.weightKg != null && log.weightKg > 0) {
        const prevWeightLog = previousLogs.find(
          l =>
            l.type === 'weight' &&
            l.weightKg != null &&
            l.weightKg > 0 &&
            (l.sheepId === sheep.id || l.sheepEarTag === sheep.earTag) &&
            l.date < log.date
        );
        if (prevWeightLog && prevWeightLog.weightKg != null) {
          const days = daysBetweenDates(prevWeightLog.date, log.date);
          if (days >= 1 && days <= 365) {
            const computedAdg = Math.round(((log.weightKg - prevWeightLog.weightKg) * 1000) / days);
            if (computedAdg >= -200 && computedAdg <= 600) {
              nextAdg = computedAdg;
              nextAdgExp = `คำนวณ ADG จากประวัติชั่งล่าสุด (${prevWeightLog.weightKg} → ${log.weightKg} กก. ใน ${days} วัน): ${computedAdg >= 0 ? '+' : ''}${computedAdg} กรัม/วัน`;
            }
          }
        }
      }

      const woolTotal =
        log.woolWeightKg != null && log.woolWeightKg > 0
          ? Number(log.woolWeightKg)
          : sheep.fleeceYieldKg;

      return {
        ...sheep,
        weightKg: log.weightKg != null && log.weightKg > 0 ? Number(log.weightKg) : sheep.weightKg,
        currentAdgGrams: nextAdg,
        adgExplanation: nextAdgExp,
        fleeceYieldKg: woolTotal,
      };
    }

    // 3. ตัดขนและชั่งน้ำหนักขน (กก.) -> อัปเดตค่าน้ำหนักขนและคุณภาพขนบนตัวแกะทันที
    if (log.type === 'shearing') {
      const hasSplit = log.woolBodyKg != null || log.woolSkirtingsKg != null;
      const bodyKg = log.woolBodyKg != null ? Number(log.woolBodyKg) : sheep.gfwBodyKg;
      const skirtKg = log.woolSkirtingsKg != null ? Number(log.woolSkirtingsKg) : sheep.gfwSkirtingsKg;
      const computedTotal =
        log.woolWeightKg != null && log.woolWeightKg > 0
          ? Number(Number(log.woolWeightKg).toFixed(2))
          : hasSplit
          ? Number(((log.woolBodyKg ?? 0) + (log.woolSkirtingsKg ?? 0)).toFixed(2))
          : sheep.fleeceYieldKg;

      const nextCrimpStyle = log.woolCrimpStyle || sheep.woolCrimpStyle;
      return {
        ...sheep,
        fleeceYieldKg: computedTotal,
        gfwBodyKg: bodyKg,
        gfwSkirtingsKg: skirtKg,
        woolStapleLengthCm:
          log.woolStapleLengthCm != null && log.woolStapleLengthCm > 0
            ? Number(log.woolStapleLengthCm)
            : sheep.woolStapleLengthCm,
        woolMicron:
          log.woolMicron != null && log.woolMicron > 0
            ? Number(log.woolMicron)
            : sheep.woolMicron,
        woolGrade: log.woolGrade?.trim() || sheep.woolGrade,
        woolSoundness: log.woolSoundness || sheep.woolSoundness,
        woolCrimpStyle: nextCrimpStyle,
        woolHandle: log.woolHandle || sheep.woolHandle,
        crimpPerInch:
          nextCrimpStyle === 'dense'
            ? 14
            : nextCrimpStyle === 'medium'
            ? 10
            : nextCrimpStyle === 'loose'
            ? 6
            : sheep.crimpPerInch,
        lastShearingDate: log.date || sheep.lastShearingDate,
      };
    }

    // 4. ฉีดวัคซีน + ถ่ายพยาธิ + ตัดแต่งกีบ -> อัปเดตประวัติสุขภาพในทะเบียนแกะ
    if (log.type === 'health_vaccine') {
      const medName = (log.vaccineOrMedicineName || '').trim();
      const lowerMed = medName.toLowerCase();
      const subType =
        log.healthSubType ||
        (lowerMed.includes('กีบ') || lowerMed.includes('hoof')
          ? 'hoof'
          : (lowerMed.includes('วัคซีน') || lowerMed.includes('fmd') || lowerMed.includes('แท้ง')) &&
            (lowerMed.includes('พยาธิ') || lowerMed.includes('ivermectin') || lowerMed.includes('albendazole'))
          ? 'both'
          : lowerMed.includes('พยาธิ') || lowerMed.includes('ivermectin') || lowerMed.includes('albendazole')
          ? 'deworm'
          : 'vaccine');

      const nextSheep: Sheep = { ...sheep };
      if (subType === 'vaccine' || subType === 'both') {
        if (medName) nextSheep.vaccineName = medName;
        nextSheep.vaccineLastDate = log.date;
      }
      if (subType === 'deworm' || subType === 'both') {
        if (medName) nextSheep.dewormName = medName;
        nextSheep.dewormLastDate = log.date;
      }
      if (subType === 'hoof') {
        nextSheep.hoofTrimLastDate = log.date;
      }
      if (log.healthStatusAfter) {
        nextSheep.healthStatus = log.healthStatusAfter;
      }
      if (log.notes || log.treatmentDose) {
        const extra = [medName, log.treatmentDose, log.notes].filter(Boolean).join(' · ');
        nextSheep.healthNotes = `${log.date}: ${extra}`;
      }
      return nextSheep;
    }

    // 5. การผสมพันธุ์ -> อัปเดตสถานะแม่พันธุ์เป็นอุ้มท้อง/รอตรวจท้องและบันทึกพ่อพันธุ์ล่าสุด
    if (log.type === 'breeding') {
      const breedingSummary = `ผสมวันที่ ${log.matingDate || log.date} กับ ${log.sireBreedAndTag || '-'}`;
      const mergedNotes = sheep.notes
        ? sheep.notes.includes(breedingSummary)
          ? sheep.notes
          : `${breedingSummary} | ${sheep.notes}`
        : breedingSummary;

      return {
        ...sheep,
        healthStatus: markPregnantOnBreeding ? 'pregnant' : sheep.healthStatus,
        stage: markPregnantOnBreeding ? 'wool_gestation' : sheep.stage,
        notes: mergedNotes,
      };
    }

    // 6. การคลอด -> อัปเดตระยะการผลิตแม่แกะเป็นระยะให้นมลูก + สถิติคลอด
    if (log.type === 'lambing') {
      const lambSummary = `คลอดล่าสุด ${log.date}: ${log.lambCount || 1} ตัว (${log.lambGenders || '-'})`;
      return {
        ...sheep,
        stage: 'wool_lactation',
        healthStatus: 'healthy',
        lambingRatePct: log.lambCount
          ? `คลอดล่าสุด ${log.lambCount} ตัว · ${log.lambSurvivalRate || '100%'}`
          : sheep.lambingRatePct,
        notes: sheep.notes
          ? sheep.notes.includes(lambSummary)
            ? sheep.notes
            : `${lambSummary} | ${sheep.notes}`
          : lambSummary,
      };
    }

    return sheep;
  });
}

