/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ChevronDown,
  FileText,
  Wheat,
  X,
  BookOpen,
  Leaf,
} from 'lucide-react';
import {
  FeedIngredient,
  FormulatedRation,
  Pen,
  RationIngredientItem,
  Sheep,
  SheepStage,
} from '../types/sheep';
import {
  analyzeWoolNutritionAdjustments,
  autoFormulateRationFromIngredients,
  calculateRationNutrition,
  calculateSheepNutrientRequirement,
  getPenDominantStageAndBreed,
  solvePearsonSquareAsFed,
} from '../utils/nutrition';
import {
  resolveIngredientFromName,
  QUICK_INGREDIENT_SUGGESTIONS,
} from '../data/feedCompositionLookup';

interface FeedCalculatorProps {
  pens: Pen[];
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  selectedSheepForCalc: Sheep | null;
  selectedRationToEdit?: FormulatedRation | null;
  onClearSelectedSheep: () => void;
  onClearSelectedRation?: () => void;
  onAddIngredientAndUse?: (ing: Omit<FeedIngredient, 'id'>) => FeedIngredient;
  onSaveRation: (
    ration: FormulatedRation,
    assignment?: { sheepId?: string; penId?: string }
  ) => void;
}

interface ProteinStageGuide {
  id: string;
  stageValue: SheepStage;
  titleTh: string;
  ageOrPeriod: string;
  cpRange: string;
  note: string;
}

/**
 * เกณฑ์ความต้องการโปรตีนหยาบ (% CP บนฐานวัตถุแห้ง DM) ตามช่วงวัยและระยะการผลิต
 * อ้างอิง: NRC (National Research Council - Nutrient Requirements of Small Ruminants)
 * และ Merck Veterinary Manual (Nutritional Requirements of Sheep)
 */
const NRC_PROTEIN_STAGE_GUIDES: ProteinStageGuide[] = [
  {
    id: 'lamb',
    stageValue: 'wool_lamb',
    titleTh: 'ลูกแกะเล็ก (ดูดนม / เสริมเลียราง)',
    ageOrPeriod: 'อายุ 0 – 3 เดือน (< 22 กก.)',
    cpRange: '16.0 – 18.0% CP',
    note: 'สร้างโครงสร้าง อวัยวะ และพัฒนาการรากขนระยะแรกสุดของลูกแกะ',
  },
  {
    id: 'weaning',
    stageValue: 'wool_weaning',
    titleTh: 'ลูกแกะหย่านม',
    ageOrPeriod: 'อายุ 3 – 6 เดือน (22 – 32 กก.)',
    cpRange: '14.0 – 16.0% CP',
    note: 'ช่วยลูกแกะปรับระบบกระเพาะหมักหลังหย่านม โตไวไม่ชะงัก',
  },
  {
    id: 'growing',
    stageValue: 'wool_growing',
    titleTh: 'แกะรุ่นกำลังเจริญเติบโต',
    ageOrPeriod: 'อายุ 6 – 15 เดือน (32 – 50 กก.)',
    cpRange: '12.0 – 14.0% CP',
    note: 'เสริมกรดอะมิโนที่มีกำมะถันเพื่อสร้างเส้นใยขนสม่ำเสมอ',
  },
  {
    id: 'maintenance',
    stageValue: 'wool_maintenance',
    titleTh: 'แกะขนโตเต็มวัย / บำรุงเส้นใย',
    ageOrPeriod: 'อายุ 18 เดือนขึ้นไป (Maintenance)',
    cpRange: '8.5 – 10.5% CP',
    note: 'เกณฑ์พื้นฐาน 7–9% CP; แกะขนควรให้ ~10.5% CP เพื่อรักษาคุณภาพขน',
  },
  {
    id: 'gestation',
    stageValue: 'wool_gestation',
    titleTh: 'แม่แกะอุ้มท้อง (รวมทุกระยะ)',
    ageOrPeriod: 'ตลอดช่วงตั้งท้อง (~147 วัน)',
    cpRange: '11.5 – 13.5% CP',
    note: 'บำรุงแม่พันธุ์และลูกในครรภ์ตลอดการตั้งท้อง ให้เส้นใยขนแข็งแรงไม่ขาดเปราะ',
  },
  {
    id: 'lactation',
    stageValue: 'wool_lactation',
    titleTh: 'แม่แกะระยะให้นมลูก',
    ageOrPeriod: 'หลังคลอด 1 – 8 สัปดาห์',
    cpRange: '13.5 – 16.0% CP',
    note: 'ลูกเดี่ยว 13.5–14.5% CP · ลูกแฝดต้องการสูงถึง 15–16% CP',
  },
  {
    id: 'ram',
    stageValue: 'wool_ram',
    titleTh: 'พ่อพันธุ์เตรียมผสม / คุมฝูง',
    ageOrPeriod: 'อายุ 18 – 48 เดือน',
    cpRange: '10.5 – 12.5% CP',
    note: 'บำรุงน้ำเชื้อ ความสมบูรณ์พันธุ์ และความหนาแน่นของเส้นขน',
  },
];

export const FeedCalculator: React.FC<FeedCalculatorProps> = ({
  pens,
  sheepList,
  ingredients,
  rations,
  selectedSheepForCalc,
  selectedRationToEdit,
  onClearSelectedSheep,
  onClearSelectedRation,
  onAddIngredientAndUse,
  onSaveRation,
}) => {
  const [selectedPenId, setSelectedPenId] = useState<string>('pen-a');
  const [customWeight, setCustomWeight] = useState<number>(64);
  const [customStage, setCustomStage] = useState<SheepStage>('wool_maintenance');
  const [customAdg, setCustomAdg] = useState<number>(175);
  const [customBreed, setCustomBreed] = useState<string>('เมอริโน (Merino)');
  const [penHeadCount, setPenHeadCount] = useState<number>(() => {
    const firstPen = pens.find(p => p.id === 'pen-a') || pens[0];
    return firstPen ? firstPen.sheepCount : 0;
  });

  const [activeRationId, setActiveRationId] = useState<string | null>(null);
  const [autoBalanceOnSelect, setAutoBalanceOnSelect] = useState<boolean>(true);
  const [applyWoolAdjustments, setApplyWoolAdjustments] = useState<boolean>(true);
  const [assignToPenOnSave, setAssignToPenOnSave] = useState<boolean>(true);
  const [showQuickAddIngredient, setShowQuickAddIngredient] = useState<boolean>(false);
  const [quickIngName, setQuickIngName] = useState<string>('');

  const activePen = useMemo(() => {
    if (selectedPenId === 'custom') return null;
    return pens.find(p => p.id === selectedPenId) || pens[0] || null;
  }, [selectedPenId, pens]);

  useEffect(() => {
    if (selectedSheepForCalc) {
      setSelectedPenId('custom');
      setCustomWeight(selectedSheepForCalc.weightKg);
      setCustomStage(selectedSheepForCalc.stage);
      setCustomAdg(selectedSheepForCalc.currentAdgGrams || 175);
      setCustomBreed(
        selectedSheepForCalc.breed.includes('แฮมป์เชียร์')
          ? 'แฮมป์เชียร์ (Hampshire)'
          : selectedSheepForCalc.breed.includes('ดอร์เซท')
          ? 'ดอร์เซท (Dorset)'
          : 'เมอริโน (Merino)'
      );
      setPenHeadCount(1);
    }
  }, [selectedSheepForCalc]);

  // Live sync whenever activePen or sheepList changes
  useEffect(() => {
    if (activePen && !selectedSheepForCalc) {
      setCustomWeight(activePen.averageWeightKg);
      setCustomAdg(activePen.averageAdgGrams);
      setPenHeadCount(activePen.sheepCount);
      const { stage, breed } = getPenDominantStageAndBreed(activePen.id, sheepList);
      setCustomStage(stage);
      setCustomBreed(
        breed.includes('แฮมป์เชียร์')
          ? 'แฮมป์เชียร์ (Hampshire)'
          : breed.includes('ดอร์เซท')
          ? 'ดอร์เซท (Dorset)'
          : 'เมอริโน (Merino)'
      );
    }
  }, [activePen, sheepList, selectedSheepForCalc]);

  const [rationItems, setRationItems] = useState<RationIngredientItem[]>([
    { ingredientId: 'ing-2', percentInMix: 40 },
    { ingredientId: 'ing-1', percentInMix: 30 },
    { ingredientId: 'ing-5', percentInMix: 15 },
    { ingredientId: 'ing-7', percentInMix: 10 },
    { ingredientId: 'ing-11', percentInMix: 2.5 },
    { ingredientId: 'ing-12', percentInMix: 1.5 },
    { ingredientId: 'ing-14', percentInMix: 1.0 },
  ]);

  const [rationName, setRationName] = useState('สูตรอาหารคำนวณเองประจำคอก');
  const [rationDescription, setRationDescription] = useState(
    'ปรับสัดส่วนวัตถุดิบอัตโนมัติหรือด้วยตนเองให้เหมาะกับ % โปรตีนตามช่วงวัยแกะขน'
  );
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showPearsonModal, setShowPearsonModal] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const ingredientsMap = useMemo(() => {
    const map = new Map<string, FeedIngredient>();
    ingredients.forEach(ing => map.set(ing.id, ing));
    return map;
  }, [ingredients]);

  // Filter out stale ingredient IDs if deleted in IngredientsManager
  useEffect(() => {
    setRationItems(prev => {
      const valid = prev.filter(item => ingredientsMap.has(item.ingredientId));
      return valid.length === prev.length ? prev : valid;
    });
  }, [ingredientsMap]);

  const currentWeight = customWeight;
  const currentStage = customStage;
  const currentAdg = customAdg;

  const woolTargetSheep = useMemo(() => {
    if (selectedSheepForCalc) return [selectedSheepForCalc];
    if (activePen) return sheepList.filter(s => s.penId === activePen.id);
    return [];
  }, [selectedSheepForCalc, activePen, sheepList]);

  const woolAdjustment = useMemo(() => {
    return analyzeWoolNutritionAdjustments(woolTargetSheep);
  }, [woolTargetSheep]);

  const baseTargetReq = useMemo(() => {
    return calculateSheepNutrientRequirement(currentWeight, currentStage, currentAdg);
  }, [currentWeight, currentStage, currentAdg]);

  const targetReq = useMemo(() => {
    return calculateSheepNutrientRequirement(
      currentWeight,
      currentStage,
      currentAdg,
      applyWoolAdjustments ? woolAdjustment : null
    );
  }, [currentWeight, currentStage, currentAdg, applyWoolAdjustments, woolAdjustment]);

  const totalPercentSum = useMemo(() => {
    return rationItems.reduce((sum, item) => sum + (Number(item.percentInMix) || 0), 0);
  }, [rationItems]);

  const nutritionStats = useMemo(() => {
    return calculateRationNutrition(rationItems, ingredientsMap, targetReq);
  }, [rationItems, ingredientsMap, targetReq]);

  const economics = useMemo(() => {
    const dailyDmi = nutritionStats.totalDmKg;
    const dailyFeedCost = Number(nutritionStats.costPerHeadPerDay.toFixed(2));
    const dailyPenCost = Number((dailyFeedCost * penHeadCount).toFixed(2));
    const monthlyPenCost = Number((dailyPenCost * 30).toFixed(0));

    return {
      dailyDmi,
      dailyFeedCost,
      dailyPenCost,
      monthlyPenCost,
    };
  }, [nutritionStats, penHeadCount]);

  const runAutoFormulateForList = (nextIngredientIds: string[], req = targetReq) => {
    const selectedIngs = nextIngredientIds
      .map(id => ingredientsMap.get(id))
      .filter((x): x is FeedIngredient => Boolean(x));
    if (selectedIngs.length === 0) {
      setRationItems([]);
      return;
    }
    const solved = autoFormulateRationFromIngredients(selectedIngs, req);
    setRationItems(solved);
  };

  const handleLoadSavedRation = (ration: FormulatedRation, autoRecalcForPen: boolean = false) => {
    setActiveRationId(ration.id);
    setRationName(ration.name);
    setRationDescription(ration.description);
    if (!selectedSheepForCalc && selectedPenId === 'custom') {
      setCustomStage(ration.targetStage);
      setCustomWeight(ration.recommendedForWeight);
    }

    const validItems = ration.items.filter(i => ingredientsMap.has(i.ingredientId));
    if (autoRecalcForPen && validItems.length > 0) {
      const nextReq = calculateSheepNutrientRequirement(
        currentWeight,
        selectedPenId === 'custom' ? ration.targetStage : currentStage,
        currentAdg,
        applyWoolAdjustments ? woolAdjustment : null
      );
      runAutoFormulateForList(
        validItems.map(i => i.ingredientId),
        nextReq
      );
    } else {
      setRationItems(validItems.map(i => ({ ...i })));
    }
    onClearSelectedRation?.();
  };

  // Load ration if jumped from Dashboard / AppSheet
  useEffect(() => {
    if (selectedRationToEdit) {
      handleLoadSavedRation(selectedRationToEdit, false);
    }
  }, [selectedRationToEdit]);

  const handleAutoFormulateCurrent = () => {
    const ids = rationItems.map(i => i.ingredientId);
    runAutoFormulateForList(ids, targetReq);
    setSaveSuccessMessage(
      `คำนวณสัดส่วน % อัตโนมัติครบ 100.0% จากวัตถุดิบ ${ids.length} ชนิดเรียบร้อยแล้ว!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const handleToggleIngredientInFormula = (ing: FeedIngredient) => {
    const exists = rationItems.some(i => i.ingredientId === ing.id);
    const nextIds = exists
      ? rationItems.filter(i => i.ingredientId !== ing.id).map(i => i.ingredientId)
      : [...rationItems.map(i => i.ingredientId), ing.id];

    if (autoBalanceOnSelect) {
      runAutoFormulateForList(nextIds, targetReq);
    } else if (exists) {
      setRationItems(prev => prev.filter(i => i.ingredientId !== ing.id));
    } else {
      setRationItems(prev => [...prev, { ingredientId: ing.id, percentInMix: 5 }]);
    }
  };

  const handleQuickAddNewIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickIngName.trim();
    if (!trimmed) return;

    const existing = ingredients.find(
      i => i.nameTh.trim().toLowerCase() === trimmed.toLowerCase()
    );

    let addedIng: FeedIngredient | null = existing || null;
    if (!addedIng && onAddIngredientAndUse) {
      const resolved = resolveIngredientFromName(trimmed);
      addedIng = onAddIngredientAndUse({
        nameTh: trimmed,
        nameEn: resolved.nameEn,
        category: resolved.category,
        dryMatter: resolved.dryMatter,
        crudeProtein: resolved.crudeProtein,
        tdn: resolved.tdn,
        calcium: resolved.calcium,
        phosphorus: resolved.phosphorus,
        pricePerKg: resolved.pricePerKg,
        isRoughage: resolved.isRoughage,
        description: resolved.description,
      });
    }

    if (addedIng) {
      const alreadyInRation = rationItems.some(i => i.ingredientId === addedIng!.id);
      const nextIds = alreadyInRation
        ? rationItems.map(i => i.ingredientId)
        : [...rationItems.map(i => i.ingredientId), addedIng.id];

      // Build map with newly added ingredient immediately for solver
      const tempMap = new Map(ingredientsMap);
      tempMap.set(addedIng.id, addedIng);
      const chosen = nextIds
        .map(id => tempMap.get(id))
        .filter((x): x is FeedIngredient => Boolean(x));

      if (autoBalanceOnSelect) {
        setRationItems(autoFormulateRationFromIngredients(chosen, targetReq));
      } else if (!alreadyInRation) {
        setRationItems(prev => [...prev, { ingredientId: addedIng!.id, percentInMix: 10 }]);
      }

      setQuickIngName('');
      setShowQuickAddIngredient(false);
      setSaveSuccessMessage(
        `เพิ่ม "${addedIng.nameTh}" เข้าคลังวัตถุดิบและคำนวณสัดส่วนเข้าสูตรให้อัตโนมัติแล้ว!`
      );
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }
  };

  const handleItemPercentChange = (index: number, newPct: number) => {
    setRationItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], percentInMix: Number(newPct) || 0 };
      return next;
    });
  };

  const handleItemIngredientChange = (index: number, newIngId: string) => {
    const nextItems = rationItems.map((item, i) =>
      i === index ? { ...item, ingredientId: newIngId } : item
    );
    if (autoBalanceOnSelect) {
      runAutoFormulateForList(
        nextItems.map(i => i.ingredientId),
        targetReq
      );
    } else {
      setRationItems(nextItems);
    }
  };

  const handleAddItem = () => {
    const usedIds = new Set(rationItems.map(i => i.ingredientId));
    const avail = ingredients.find(i => !usedIds.has(i.id)) || ingredients[0];
    if (!avail) return;
    if (autoBalanceOnSelect) {
      runAutoFormulateForList([...rationItems.map(i => i.ingredientId), avail.id], targetReq);
    } else {
      setRationItems(prev => [...prev, { ingredientId: avail.id, percentInMix: 5 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const next = rationItems.filter((_, i) => i !== index);
    if (autoBalanceOnSelect && next.length > 0) {
      runAutoFormulateForList(
        next.map(i => i.ingredientId),
        targetReq
      );
    } else {
      setRationItems(next);
    }
  };

  const handleNormalizePercents = () => {
    if (totalPercentSum === 0) return;
    const factor = 100 / totalPercentSum;
    const adjusted = rationItems.map(item => ({
      ...item,
      percentInMix: Number((item.percentInMix * factor).toFixed(1)),
    }));
    const diff = Number(
      (100 - adjusted.reduce((s, x) => s + x.percentInMix, 0)).toFixed(1)
    );
    if (adjusted.length > 0 && Math.abs(diff) > 0) {
      adjusted[0].percentInMix = Number((adjusted[0].percentInMix + diff).toFixed(1));
    }
    setRationItems(adjusted);
  };

  const handleSaveRation = () => {
    const newRation: FormulatedRation = {
      id: activeRationId || `ration-${Date.now()}`,
      name: rationName.trim() || 'สูตรอาหารแกะขนที่คำนวณเอง',
      description:
        rationDescription.trim() || `สูตรสำหรับ ${currentWeight} กก. ระยะ ${currentStage}`,
      targetStage: currentStage,
      recommendedForWeight: currentWeight,
      items: rationItems,
      totalAsFedKg: nutritionStats.totalAsFedKg,
      totalDmKg: nutritionStats.totalDmKg,
      calculatedCpPercent: nutritionStats.calculatedCpPercent,
      calculatedTdnPercent: nutritionStats.calculatedTdnPercent,
      calculatedCaPercent: nutritionStats.calculatedCaPercent,
      calculatedPPercent: nutritionStats.calculatedPPercent,
      roughagePercent: nutritionStats.roughagePercent,
      concentratePercent: nutritionStats.concentratePercent,
      costPerKgMix: nutritionStats.costPerKgMix,
      costPerHeadPerDay: nutritionStats.costPerHeadPerDay,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const assignment = selectedSheepForCalc
      ? { sheepId: selectedSheepForCalc.id }
      : activePen && assignToPenOnSave
      ? { penId: activePen.id }
      : undefined;

    onSaveRation(newRation, assignment);
    setActiveRationId(newRation.id);
    setSaveSuccessMessage(
      assignment?.penId
        ? `บันทึกสูตร "${newRation.name}" และซิงค์ใช้กับแกะทั้ง ${activePen?.code} (${activePen?.sheepCount} ตัว) ครบทุกหน้าแล้ว!`
        : `บันทึกสูตร "${newRation.name}" เรียบร้อยแล้ว!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  // Pearson Square Tool Modal state
  const [pearsonIng1, setPearsonIng1] = useState<string>('ing-2');
  const [pearsonIng2, setPearsonIng2] = useState<string>('ing-7');
  const [pearsonTargetCp, setPearsonTargetCp] = useState<number>(14.0);

  const pearsonResult = useMemo(() => {
    const i1 = ingredientsMap.get(pearsonIng1);
    const i2 = ingredientsMap.get(pearsonIng2);
    if (!i1 || !i2) return null;
    const res = solvePearsonSquareAsFed(
      i1.crudeProtein,
      i1.dryMatter,
      i2.crudeProtein,
      i2.dryMatter,
      pearsonTargetCp
    );
    return {
      ...res,
      ing1: i1,
      ing2: i2,
    };
  }, [pearsonIng1, pearsonIng2, pearsonTargetCp, ingredientsMap]);

  const handleApplyPearson = () => {
    if (!pearsonResult || !pearsonResult.isValid) return;
    setRationItems([
      { ingredientId: pearsonResult.ing1.id, percentInMix: pearsonResult.asFedPercent1 },
      { ingredientId: pearsonResult.ing2.id, percentInMix: pearsonResult.asFedPercent2 },
    ]);
    setShowPearsonModal(false);
    setSaveSuccessMessage(
      `นำสัดส่วน Pearson Square (${pearsonResult.asFedPercent1}% : ${pearsonResult.asFedPercent2}% นน.สด → ได้โปรตีน ${pearsonResult.resultingCpPercent}% CP) ไปใช้ในสูตรแล้ว!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Save Notification Banner */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-[#EDF4EF] border border-[#C5DEC9] text-[#1E3F2B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#2E6B47] shrink-0" />
            <span className="font-medium text-sm">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-[#2E6B47] hover:text-[#1E3F2B] text-xs font-medium underline cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Selected Sheep Context Chip (if opened from Sheep Directory) */}
      {selectedSheepForCalc && (
        <div className="p-4 rounded-2xl bg-[#F3ECE0] border border-[#DFCBB3] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-[#1E3F2B]">
            <Leaf className="w-4 h-4 text-[#2E6B47]" />
            <span>
              กำลังคำนวณเฉพาะตัวสำหรับ: <strong className="font-semibold">{selectedSheepForCalc.earTag} ({selectedSheepForCalc.name})</strong> · {selectedSheepForCalc.breed} · {selectedSheepForCalc.weightKg} กก.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClearSelectedSheep();
              setSelectedPenId('pen-a');
            }}
            className="text-xs text-[#6E4826] hover:text-[#1E3F2B] underline cursor-pointer"
          >
            กลับไปคำนวณแบบรายคอก
          </button>
        </div>
      )}

      {/* Step 1: Pen & Sheep Parameters (Custom Manual Formulation Only — Preset Dropdown Removed) */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 sm:p-8 space-y-6">
        <div className="pb-5 border-b border-[#EAE2D0]">
          <p className="text-xs text-[#6E4826] font-semibold tracking-wide flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#2E6B47]" />
            <span>3. คำนวณสูตรอาหารด้วยตนเอง · ขั้นตอนที่ 1 ตั้งค่าคอกและระยะของแกะ</span>
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1E3F2B] mt-1 tracking-tight">
            คำนวณสูตรอาหารแกะขนรายคอก (กำหนดวัตถุดิบเองตามเกณฑ์ % โปรตีน)
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6254] mt-1">
            เลือกคอก น้ำหนัก และระยะการผลิต จากนั้นเทียบเป้าหมาย % โปรตีนหยาบ (% CP) กับตารางอ้างอิงมาตรฐานด้านล่างเพื่อผสมวัตถุดิบให้เหมาะสมที่สุด
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5C5346] mb-1.5">
              เลือกคอกแกะในฟาร์ม *
            </label>
            <select
              value={selectedPenId}
              onChange={e => {
                if (selectedSheepForCalc) onClearSelectedSheep();
                setSelectedPenId(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-semibold focus:outline-none focus:border-[#1E3F2B] cursor-pointer"
            >
              {pens.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.sheepCount} ตัว)
                </option>
              ))}
              <option value="custom">กำหนดพารามิเตอร์เอง (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5346] mb-1.5">
              สายพันธุ์แกะขนในฟาร์ม *
            </label>
            <select
              value={customBreed}
              onChange={e => setCustomBreed(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl text-[#24201B] font-medium focus:outline-none focus:border-[#1E3F2B] cursor-pointer"
            >
              <option value="เมอริโน (Merino)">เมอริโน (Merino)</option>
              <option value="แฮมป์เชียร์ (Hampshire)">แฮมป์เชียร์ (Hampshire)</option>
              <option value="ดอร์เซท (Dorset)">ดอร์เซท (Dorset)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5346] mb-1.5">
              ระยะการผลิตแกะขน *
            </label>
            <select
              value={currentStage}
              onChange={e => setCustomStage(e.target.value as SheepStage)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl text-[#9C6B3F] font-semibold focus:outline-none focus:border-[#1E3F2B] cursor-pointer"
            >
              <option value="wool_lamb">ลูกแกะเล็ก (0–3 เดือน / ดูดนม-เลียราง)</option>
              <option value="wool_weaning">ลูกแกะหย่านม (3–6 เดือน)</option>
              <option value="wool_growing">แกะรุ่นขน / พัฒนาต่อมสร้างขน</option>
              <option value="wool_maintenance">แกะขนโตเต็มวัย / บำรุงรักษาเส้นใย</option>
              <option value="wool_gestation">แม่แกะขนอุ้มท้อง (รวมทุกระยะ)</option>
              <option value="wool_lactation">แม่แกะขนระยะให้นมลูกแกะ</option>
              <option value="wool_ram">พ่อพันธุ์แกะขนสมบูรณ์พันธุ์</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5346] mb-1.5">
              น้ำหนักตัวเฉลี่ย (กก.) *
            </label>
            <input
              type="number"
              step="0.5"
              min="15"
              max="150"
              value={currentWeight}
              onChange={e => setCustomWeight(parseFloat(e.target.value) || 50)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl text-[#24201B] font-mono font-semibold focus:outline-none focus:border-[#1E3F2B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5346] mb-1.5">
              จำนวนแกะในคอก (ซิงค์จากหน้า 1)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="500"
              value={penHeadCount}
              onChange={e => setPenHeadCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl text-[#24201B] font-mono font-semibold focus:outline-none focus:border-[#1E3F2B]"
            />
          </div>
        </div>

        {/* Live Cross-Page Sync Strip */}
        <div className="bg-[#EDF4EF] border border-[#C5DEC9] rounded-xl px-4 py-2.5 text-xs text-[#1E3F2B] flex flex-wrap items-center justify-between gap-2">
          <span>
            ซิงค์ข้อมูลจริงจากหน้า 1 (คอกและทะเบียนแกะ): แกะทั้งฟาร์ม{' '}
            <strong className="font-mono">{sheepList.length}</strong> ตัว
            {activePen ? (
              <>
                {' '}
                · {activePen.code} มี{' '}
                <strong className="font-mono">{activePen.sheepCount}</strong> ตัว (น้ำหนักเฉลี่ย{' '}
                <strong className="font-mono">{activePen.averageWeightKg}</strong> กก.)
              </>
            ) : null}
          </span>
          <span className="text-[#2E6B47] font-medium">
            {pens.map(p => `${p.code} (${p.sheepCount})`).join(' · ')}
          </span>
        </div>

        {/* Pen-Side Wool Evaluation -> Nutrient Target Integration Card */}
        {woolTargetSheep.length > 0 && (
          <div
            className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 text-xs ${
              woolAdjustment.hasAdjustments && applyWoolAdjustments
                ? 'bg-[#FBF4E7] border-[#DFCBB3]'
                : 'bg-[#FAF6EE] border-[#EAE2D0]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-semibold text-[#1E3F2B] text-sm">
                  <Sparkles className="w-4 h-4 text-[#9C6B3F] shrink-0" />
                  <span>
                    สรุปผลตรวจขนหน้าคอก ({selectedSheepForCalc ? `เฉพาะตัว ${selectedSheepForCalc.name}` : `เฉลี่ย ${activePen?.code || 'คอกนี้'} ${woolTargetSheep.length} ตัว`})
                  </span>
                </div>
                <p className="text-[#6E4826] font-medium">{woolAdjustment.summaryHeadlineTh}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 bg-[#FFFDF9] border border-[#DFCBB3] px-3 py-1.5 rounded-xl font-semibold text-[#1E3F2B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyWoolAdjustments}
                    onChange={e => setApplyWoolAdjustments(e.target.checked)}
                    className="accent-[#1E3F2B] cursor-pointer"
                  />
                  <span>นำผลตรวจขนมาปรับสูตรอัตโนมัติ</span>
                </label>

                {woolAdjustment.hasAdjustments && applyWoolAdjustments && (
                  <button
                    type="button"
                    onClick={handleAutoFormulateCurrent}
                    className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors"
                  >
                    ปรับสัดส่วน % ตามคำแนะนำนี้
                  </button>
                )}
              </div>
            </div>

            {/* Baseline NRC vs Adjusted Target Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FFFDF9] p-3 rounded-xl border border-[#EAE2D0]">
              <div className="flex items-center justify-between sm:block">
                <span className="text-[11px] text-[#7D7061] block">เป้าหมายโปรตีน (% CP)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <strong className="font-mono text-sm text-[#1E3F2B]">
                    {targetReq.cpPercent}%
                  </strong>
                  {applyWoolAdjustments && woolAdjustment.cpDeltaPct > 0 && (
                    <span className="text-[11px] font-mono text-[#9C6B3F] font-semibold">
                      (มาตรฐาน {baseTargetReq.cpPercent}% + {woolAdjustment.cpDeltaPct}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:block">
                <span className="text-[11px] text-[#7D7061] block">เป้าหมายพลังงาน (% TDN)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <strong className="font-mono text-sm text-[#9C6B3F]">
                    {targetReq.tdnPercent}%
                  </strong>
                  {applyWoolAdjustments && woolAdjustment.tdnDeltaPct > 0 && (
                    <span className="text-[11px] font-mono text-[#9C6B3F] font-semibold">
                      (มาตรฐาน {baseTargetReq.tdnPercent}% + {woolAdjustment.tdnDeltaPct}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:block">
                <span className="text-[11px] text-[#7D7061] block">สัดส่วน หญ้า : อาหารข้น</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <strong className="font-mono text-sm text-[#2E6B47]">
                    {targetReq.targetRcRatio}
                  </strong>
                  {applyWoolAdjustments && woolAdjustment.roughageMinPctDelta > 0 && (
                    <span className="text-[11px] font-mono text-[#2E6B47] font-semibold">
                      (+{woolAdjustment.roughageMinPctDelta}% หญ้าหยาบ)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {woolAdjustment.reasons.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {woolAdjustment.reasons.map((r, i) => (
                  <div
                    key={`${r.key}-${i}`}
                    className="bg-[#FFFDF9]/90 px-3 py-2 rounded-lg border border-[#EAE2D0] flex items-start gap-2"
                  >
                    <span
                      className={`mt-0.5 shrink-0 font-bold ${
                        r.severity === 'action'
                          ? 'text-[#A63D2E]'
                          : r.severity === 'tip'
                          ? 'text-[#9C6B3F]'
                          : 'text-[#2E6B47]'
                      }`}
                    >
                      {r.severity === 'action' ? '▲' : r.severity === 'tip' ? '•' : '✓'}
                    </span>
                    <div className="leading-snug">
                      <strong className="text-[#1E3F2B] block">{r.titleTh}</strong>
                      <span className="text-[#5C5346]">{r.effectTh}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Authoritative NRC % Protein Reference Guide by Age / Stage */}
      <section className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAE2D0]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1E3F2B]" />
            <h3 className="text-base sm:text-lg font-semibold text-[#1E3F2B]">
              เกณฑ์แนะนำ % โปรตีนหยาบ (% CP บนฐานวัตถุแห้ง) ของแกะแต่ละช่วงวัย
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs text-[#6E6254]">
            อ้างอิง: NRC Small Ruminants & Merck Veterinary Manual (คลิกเพื่อตั้งระยะเป้าหมาย)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {NRC_PROTEIN_STAGE_GUIDES.map(guide => {
            const isCurrentStage = currentStage === guide.stageValue;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setCustomStage(guide.stageValue)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrentStage
                    ? 'bg-[#EDF4EF] border-[#2E6B47] shadow-xs'
                    : 'bg-[#FAF6EE] border-[#EAE2D0] hover:border-[#B68656]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1E3F2B] leading-snug">
                      {guide.titleTh}
                    </span>
                    {isCurrentStage && (
                      <span className="text-[10px] font-semibold text-[#2E6B47] shrink-0">
                        ● ใช้อยู่
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#7D7061] block mt-0.5">
                    {guide.ageOrPeriod}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#DFCBB3]/70">
                  <span className="text-sm sm:text-base font-mono font-semibold text-[#9C6B3F] block">
                    {guide.cpRange}
                  </span>
                  <p className="text-[11px] text-[#5C5346] mt-1 leading-relaxed">
                    {guide.note}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Formulate Ingredients & Real-Time Calculation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Formula Selector + Ingredient Picker + Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE2D0]">
            <div>
              <p className="text-xs text-[#9C6B3F] font-medium tracking-wide">ขั้นตอนที่ 2</p>
              <h3 className="text-lg font-semibold text-[#1E3F2B] mt-0.5">
                เลือกวัตถุดิบที่มี (คำนวณสัดส่วน % อัตโนมัติครบ 100%)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAutoFormulateCurrent}
                className="tactile-cta-btn bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="คำนวณสัดส่วน % ของวัตถุดิบในตารางให้ตรง % โปรตีนและพลังงานเป้าหมายทันที"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
                <span>คำนวณสัดส่วน % อัตโนมัติ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPearsonModal(true)}
                className="bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#9C6B3F] border border-[#DFCBB3] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="ใช้ Pearson Square คำนวณจับคู่ 2 วัตถุดิบเพื่อให้ได้ CP เป้าหมาย"
              >
                <span>Pearson Square</span>
              </button>
            </div>
          </div>

          {/* 2A/2B: Farm Ingredients Checklist + Quick Add New Ingredient */}
          <div className="bg-[#FAF6EE] border border-[#DFCBB3] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-[#1E3F2B] block">
                  เลือก / เพิ่มวัตถุดิบที่ฟาร์มเรามี ({ingredients.length} ชนิดจากหน้า 4)
                </span>
                <span className="text-[11px] text-[#6E6254]">
                  ติ๊กเลือกวัตถุดิบที่ต้องการใช้ในสูตร หรือเพิ่มวัตถุดิบใหม่ตรงนี้ได้เลย
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1E3F2B] cursor-pointer bg-[#FFFDF9] px-2.5 py-1.5 rounded-lg border border-[#C5DEC9]">
                  <input
                    type="checkbox"
                    checked={autoBalanceOnSelect}
                    onChange={e => setAutoBalanceOnSelect(e.target.checked)}
                    className="accent-[#1E3F2B] cursor-pointer"
                  />
                  <span>คำนวณ % อัตโนมัติเมื่อเพิ่ม</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowQuickAddIngredient(prev => !prev)}
                  className="bg-[#4A321F] hover:bg-[#5E4029] text-[#FAF6EE] px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มวัตถุดิบใหม่</span>
                </button>
              </div>
            </div>

            {showQuickAddIngredient && (
              <form
                onSubmit={handleQuickAddNewIngredient}
                className="bg-[#FFFDF9] border border-[#C5DEC9] rounded-xl p-3 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={quickIngName}
                    onChange={e => setQuickIngName(e.target.value)}
                    placeholder="พิมพ์ชื่อวัตถุดิบที่มี เช่น ใบหม่อนสด, กากมะพร้าว, ฟางข้าว..."
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                  >
                    เพิ่มเข้าคลังและคำนวณสัดส่วน
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-[#6E6254]">เลือกด่วน:</span>
                  {QUICK_INGREDIENT_SUGGESTIONS.slice(0, 6).map(sample => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setQuickIngName(sample)}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#FAF6EE] hover:bg-[#EDF4EF] border border-[#DFCBB3] text-[#1E3F2B] cursor-pointer"
                    >
                      + {sample}
                    </button>
                  ))}
                </div>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {ingredients.map(ing => {
                const isSelected = rationItems.some(i => i.ingredientId === ing.id);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handleToggleIngredientInFormula(ing)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#1E3F2B] text-[#FAF6EE] border-[#1E3F2B]'
                        : 'bg-[#FFFDF9] text-[#5C5346] border-[#DFCBB3] hover:border-[#1E3F2B] hover:text-[#1E3F2B]'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{ing.nameTh}</span>
                    <span className={`font-mono text-[10px] ${isSelected ? 'text-[#DFCBB3]' : 'text-[#9C6B3F]'}`}>
                      CP {ing.crudeProtein}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formula Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="ตั้งชื่อสูตรอาหาร..."
              value={rationName}
              onChange={e => setRationName(e.target.value)}
              className="text-xs sm:text-sm font-medium px-3.5 py-2.5 bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="บันทึกหมายเหตุสูตรอาหาร..."
                value={rationDescription}
                onChange={e => setRationDescription(e.target.value)}
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-[#FAF6EE] border border-[#E5DEC9] rounded-xl text-[#5C5346] focus:outline-none focus:border-[#1E3F2B]"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-[#F3ECE0] hover:bg-[#E5DEC9] text-[#1E3F2B] border border-[#DFCBB3] px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                title="เพิ่มแถววัตถุดิบในตาราง"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>แถว</span>
              </button>
            </div>
          </div>

          {/* Ingredients Table Container */}
          <div className="rounded-xl border border-[#EAE2D0] bg-[#FAF6EE]/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#5C5346] min-w-[780px]">
                <thead className="bg-[#F3ECE0] text-[#5C5346] font-semibold border-b border-[#EAE2D0]">
                  <tr>
                    <th className="p-3 pl-4 min-w-[280px]">วัตถุดิบอาหารแกะขน</th>
                    <th className="p-3 text-center min-w-[130px] whitespace-nowrap">หมวดหมู่</th>
                    <th className="p-3 text-right whitespace-nowrap w-20">% วัตถุแห้ง</th>
                    <th className="p-3 text-right whitespace-nowrap w-20">% โปรตีน</th>
                    <th className="p-3 text-right whitespace-nowrap w-20">ราคา/กก.</th>
                    <th className="p-3 text-center w-28 whitespace-nowrap">สัดส่วน (%)</th>
                    <th className="p-3 text-right whitespace-nowrap w-24">กก./ตัว/วัน</th>
                    <th className="p-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE2D0] bg-[#FFFDF9]">
                  {rationItems.map((item, idx) => {
                    const ing = ingredientsMap.get(item.ingredientId);
                    if (!ing) return null;

                    const fraction = totalPercentSum > 0 ? item.percentInMix / totalPercentSum : 0;
                    const asFedPerHead = Number((fraction * nutritionStats.totalAsFedKg).toFixed(2));

                    return (
                      <tr key={idx} className="hover:bg-[#FAF6EE]/80 transition-colors">
                        <td className="p-2.5 pl-4 min-w-[280px]">
                          <div className="relative">
                            <select
                              value={item.ingredientId}
                              onChange={e => handleItemIngredientChange(idx, e.target.value)}
                              className="w-full text-xs bg-[#FAF6EE] hover:bg-[#F3ECE0]/60 border border-[#DFCBB3] rounded-xl pl-3 pr-8 py-2 font-medium text-[#24201B] cursor-pointer appearance-none transition-colors focus:outline-none focus:border-[#1E3F2B]"
                            >
                              {ingredients.map(ig => (
                                <option key={ig.id} value={ig.id} className="bg-[#FFFDF9] text-[#24201B]">
                                  {ig.nameTh}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-[#9C6B3F] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>

                        <td className="p-2.5 text-center min-w-[130px] whitespace-nowrap">
                          <span
                            className={`inline-block text-xs font-medium whitespace-nowrap px-2.5 py-1 rounded-lg border ${
                              ing.isRoughage
                                ? 'bg-[#EDF4EF] text-[#1E3F2B] border-[#C5DEC9]'
                                : 'bg-[#F9F2E4] text-[#9C6B3F] border-[#E5D3B3]'
                            }`}
                          >
                            {ing.isRoughage ? 'หญ้าหยาบ' : 'อาหารข้น/แร่'}
                          </span>
                        </td>

                        <td className="p-2.5 text-right font-mono text-[#5C5346] whitespace-nowrap">
                          {ing.dryMatter}%
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#1E3F2B] font-semibold whitespace-nowrap">
                          {ing.crudeProtein}%
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#6E6254] whitespace-nowrap">
                          {ing.pricePerKg.toFixed(1)} ฿
                        </td>

                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={item.percentInMix}
                              onChange={e =>
                                handleItemPercentChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 text-center text-xs font-semibold py-1.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-lg text-[#24201B] font-mono focus:outline-none focus:border-[#1E3F2B]"
                            />
                            <span className="text-[#8C7F6E] font-medium">%</span>
                          </div>
                        </td>

                        <td className="p-2.5 text-right font-mono text-[#9C6B3F] font-semibold whitespace-nowrap">
                          {asFedPerHead} กก.
                        </td>

                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-[#8C7F6E] hover:text-[#A63D2E] rounded-lg cursor-pointer transition-colors"
                            title="ลบวัตถุดิบนี้ออกจากสูตร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Percentage Status */}
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between text-xs border ${
              Math.abs(totalPercentSum - 100) < 0.1
                ? 'bg-[#EDF4EF] text-[#1E3F2B] border-[#C5DEC9]'
                : 'bg-[#F9F2E4] text-[#855828] border-[#E5D3B3]'
            }`}
          >
            <div className="flex items-center gap-2">
              {Math.abs(totalPercentSum - 100) < 0.1 ? (
                <CheckCircle2 className="w-4 h-4 text-[#2E6B47] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#9C6B3F] shrink-0" />
              )}
              <span>
                ผลรวมสัดส่วนในสูตร:{' '}
                <strong className="font-mono text-sm">{totalPercentSum.toFixed(1)}%</strong>
                {Math.abs(totalPercentSum - 100) >= 0.1 && ' (ควรปรับให้ครบ 100.0%)'}
              </span>
            </div>

            {Math.abs(totalPercentSum - 100) >= 0.1 && (
              <button
                onClick={handleNormalizePercents}
                className="bg-[#9C6B3F] hover:bg-[#825730] text-[#FAF6EE] font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                ปรับเป็น 100%
              </button>
            )}
          </div>

          {/* Roughage : Concentrate Ratio Balance Bar */}
          <div className="bg-[#FAF6EE] p-4 sm:p-5 rounded-xl border border-[#EAE2D0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#24201B] font-semibold flex items-center gap-2">
                <Wheat className="w-4 h-4 text-[#9C6B3F]" />
                <span>สมดุลอาหารหยาบ (หญ้า) ต่อ อาหารข้น:</span>
              </span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#1E3F2B] font-semibold">
                  หญ้า {nutritionStats.roughagePercent}%
                </span>
                <span className="text-[#8C7F6E]">:</span>
                <span className="text-[#9C6B3F] font-semibold">
                  อาหารข้น {nutritionStats.concentratePercent}%
                </span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-[#EAE2D0] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#1E3F2B] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, nutritionStats.roughagePercent))}%`,
                }}
              />
              <div
                className="h-full bg-[#B68656] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, nutritionStats.concentratePercent))}%`,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6254]">
              <span>เป้าหมายสมดุลแกะขน: {targetReq.targetRcRatio}</span>
              <span className="text-[#2E6B47] font-medium">
                ✓ มีเยื่อใยเพียงพอเพื่อการเคี้ยวเอื้องและการสร้างเส้นใยขน
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Nutrition Analysis & Pen Economics (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D0]">
              <h3 className="text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#9C6B3F]" />
                <span>วิเคราะห์โภชนาการสำหรับแกะขน</span>
              </h3>
              <span className="text-xs text-[#9C6B3F] font-medium">ผลลัพธ์สูตร</span>
            </div>

            {/* Protein & Energy Breakdown */}
            <div className="grid grid-cols-2 divide-x divide-[#EAE2D0] bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] py-4">
              <div className="px-4 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-[#6E6254]">
                  <span>โปรตีน (% CP)</span>
                  <span className="font-mono text-[#8C7F6E]">เป้า {targetReq.cpPercent}%</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold font-mono text-[#1E3F2B]">
                    {nutritionStats.calculatedCpPercent}%
                  </span>
                  <span className="text-xs text-[#8C7F6E]">DM</span>
                </div>
                <p
                  className={`text-xs font-medium ${
                    nutritionStats.calculatedCpPercent >= targetReq.cpPercent - 0.5
                      ? 'text-[#2E6B47]'
                      : 'text-[#A63D2E]'
                  }`}
                >
                  {nutritionStats.calculatedCpPercent >= targetReq.cpPercent - 0.5
                    ? '✓ โปรตีนเพียงพอสร้างเคราติน'
                    : '⚠ โปรตีนต่ำกว่าเกณฑ์เป้าหมาย'}
                </p>
              </div>

              <div className="px-4 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-[#6E6254]">
                  <span>พลังงาน (% TDN)</span>
                  <span className="font-mono text-[#8C7F6E]">เป้า {targetReq.tdnPercent}%</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold font-mono text-[#9C6B3F]">
                    {nutritionStats.calculatedTdnPercent}%
                  </span>
                  <span className="text-xs text-[#8C7F6E]">DM</span>
                </div>
                <p
                  className={`text-xs font-medium ${
                    nutritionStats.calculatedTdnPercent >= targetReq.tdnPercent - 2
                      ? 'text-[#2E6B47]'
                      : 'text-[#A63D2E]'
                  }`}
                >
                  {nutritionStats.calculatedTdnPercent >= targetReq.tdnPercent - 2
                    ? '✓ พลังงานเพียงพอ'
                    : '⚠ พลังงานต่ำ'}
                </p>
              </div>
            </div>

            {/* Dry Matter & Feed Intake Amount */}
            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#6E6254]">ปริมาณอาหารสดต่อตัวต่อวัน</span>
                <span className="font-semibold font-mono text-[#9C6B3F]">
                  {nutritionStats.totalAsFedKg} กก./ตัว/วัน
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E6254]">
                  ปริมาณอาหารสดทั้งคอก ({penHeadCount} ตัว)
                </span>
                <span className="font-semibold font-mono text-[#1E3F2B]">
                  {(nutritionStats.totalAsFedKg * penHeadCount).toFixed(1)} กก./คอก/วัน
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E6254]">อัตราส่วน แคลเซียม (Ca) : ฟอสฟอรัส (P)</span>
                <span className="font-semibold font-mono text-[#24201B]">
                  {nutritionStats.caPRatio} : 1
                </span>
              </div>
            </div>

            {/* Cost Summary Box */}
            <div className="bg-[#1E3F2B] text-[#FAF6EE] p-5 rounded-xl space-y-3 border-b-4 border-[#4A321F]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#D5E0D7]">ต้นทุนค่าอาหารต่อ กก. สด</span>
                <span className="text-lg font-semibold font-mono text-[#DFCBB3]">
                  {nutritionStats.costPerKgMix.toFixed(2)} บาท/กก.
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-[#FAF6EE]/15">
                <span className="text-xs text-[#D5E0D7]">ต้นทุนต่อตัวต่อวัน</span>
                <span className="text-lg font-semibold font-mono text-[#FAF6EE]">
                  {nutritionStats.costPerHeadPerDay.toFixed(2)} บาท/ตัว/วัน
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-xs text-[#EFE6D5]">
                <span>ต้นทุนค่าอาหารทั้งคอก ({penHeadCount} ตัว/เดือน)</span>
                <span className="font-mono font-semibold text-[#DFCBB3] text-sm">
                  {economics.monthlyPenCost.toLocaleString()} บาท/เดือน
                </span>
              </div>
            </div>

            {/* Sync Assignment Option */}
            {activePen && !selectedSheepForCalc && (
              <label className="flex items-start gap-2 text-xs text-[#1E3F2B] bg-[#EDF4EF] border border-[#C5DEC9] rounded-xl p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignToPenOnSave}
                  onChange={e => setAssignToPenOnSave(e.target.checked)}
                  className="mt-0.5 accent-[#1E3F2B] cursor-pointer"
                />
                <span className="leading-relaxed">
                  ผูกใช้สูตรนี้กับแกะทั้งหมดใน <strong>{activePen.code}</strong> ({activePen.sheepCount} ตัว)
                  เพื่อซิงค์ต้นทุนและบันทึกการให้อาหารไปยังหน้า 1, 5 และ 6 ทันที
                </span>
              </label>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAE2D0]">
              <button
                onClick={handleSaveRation}
                className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกและซิงค์สูตร</span>
              </button>

              <button
                onClick={() => setShowBatchModal(true)}
                className="bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#1E3F2B] border border-[#DFCBB3] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-[#9C6B3F]" />
                <span>ใบชั่งผสมประจำวัน</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pearson Square Modal */}
      {showPearsonModal && (
        <div className="fixed inset-0 bg-[#1B1712]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#DFCBB3] space-y-5 text-[#24201B]">
            <div className="flex items-start justify-between pb-3 border-b border-[#EAE2D0]">
              <div>
                <h3 className="text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#9C6B3F]" />
                  <span>คำนวณสมดุลโปรตีนด้วย Pearson Square</span>
                </h3>
                <p className="text-xs text-[#6E6254] mt-0.5">
                  จับคู่ 2 วัตถุดิบ (หญ้าหยาบ + อาหารข้น) เพื่อคำนวณสัดส่วนที่ได้ % โปรตีนเป้าหมาย
                </p>
              </div>
              <button
                onClick={() => setShowPearsonModal(false)}
                className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-[#5C5346] mb-1">
                  วัตถุดิบที่ 1 (โปรตีนต่ำ / อาหารหยาบ)
                </label>
                <select
                  value={pearsonIng1}
                  onChange={e => setPearsonIng1(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium focus:outline-none focus:border-[#1E3F2B]"
                >
                  {ingredients.map(ig => (
                    <option key={ig.id} value={ig.id}>
                      {ig.nameTh} (CP {ig.crudeProtein}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C5346] mb-1">
                  วัตถุดิบที่ 2 (โปรตีนสูง / อาหารข้น)
                </label>
                <select
                  value={pearsonIng2}
                  onChange={e => setPearsonIng2(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium focus:outline-none focus:border-[#1E3F2B]"
                >
                  {ingredients.map(ig => (
                    <option key={ig.id} value={ig.id}>
                      {ig.nameTh} (CP {ig.crudeProtein}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-medium text-[#5C5346]">
                    ระดับโปรตีนเป้าหมาย (% CP Target บนฐานวัตถุแห้ง)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPearsonTargetCp(targetReq.cpPercent)}
                    className="text-[11px] text-[#9C6B3F] hover:text-[#1E3F2B] underline cursor-pointer font-medium"
                  >
                    ใช้เป้าของระยะนี้ ({targetReq.cpPercent}%)
                  </button>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={pearsonTargetCp}
                  onChange={e => setPearsonTargetCp(parseFloat(e.target.value) || 12)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono font-semibold focus:outline-none focus:border-[#1E3F2B]"
                />
              </div>

              {pearsonResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    pearsonResult.isValid
                      ? 'bg-[#EDF4EF] border-[#C5DEC9]'
                      : 'bg-[#FCEFED] border-[#E8C5C0]'
                  }`}
                >
                  {pearsonResult.isValid ? (
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[#1E3F2B] font-semibold">
                          สัดส่วนน้ำหนักสดสำหรับชั่งผสม (As-Fed):
                        </strong>
                        <span className="text-xs font-mono font-semibold text-[#2E6B47] bg-white/80 px-2 py-0.5 rounded border border-[#C5DEC9]">
                          ได้จริง {pearsonResult.resultingCpPercent}% CP
                        </span>
                      </div>
                      <div className="flex justify-between text-[#24201B]">
                        <span>
                          {pearsonResult.ing1.nameTh}{' '}
                          <span className="text-[11px] text-[#6E6254]">
                            (DM {pearsonResult.dmPercent1}%)
                          </span>
                        </span>
                        <strong className="font-mono text-[#1E3F2B]">
                          {pearsonResult.asFedPercent1}%
                        </strong>
                      </div>
                      <div className="flex justify-between text-[#24201B]">
                        <span>
                          {pearsonResult.ing2.nameTh}{' '}
                          <span className="text-[11px] text-[#6E6254]">
                            (DM {pearsonResult.dmPercent2}%)
                          </span>
                        </span>
                        <strong className="font-mono text-[#1E3F2B]">
                          {pearsonResult.asFedPercent2}%
                        </strong>
                      </div>
                      <p className="text-[11px] text-[#3C5343] pt-1 border-t border-[#C5DEC9]/70">
                        * ระบบแปลงจากสัดส่วนวัตถุแห้ง (DM) เป็นน้ำหนักสด (As-Fed) ตามความชื้นของวัตถุดิบอัตโนมัติ เพื่อให้ค่าโปรตีนในหน้าวิเคราะห์ตรงกับ {pearsonTargetCp}% CP
                      </p>
                    </div>
                  ) : (
                    <p className="text-[#A63D2E] text-xs">
                      เป้าหมายโปรตีนต้องอยู่ระหว่างระดับโปรตีนของวัตถุดิบทั้งสองชนิด
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAE2D0]">
              <button
                onClick={() => setShowPearsonModal(false)}
                className="px-4 py-2 text-xs text-[#6E6254] hover:text-[#24201B] rounded-xl cursor-pointer"
              >
                ปิด
              </button>
              {pearsonResult?.isValid && (
                <button
                  onClick={handleApplyPearson}
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  นำสัดส่วนนี้ไปใช้ในสูตร
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Mixing Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-[#1B1712]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#DFCBB3] space-y-5 text-[#24201B] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#EAE2D0]">
              <div>
                <h3 className="text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#9C6B3F]" />
                  <span>ใบชั่งผสมอาหารประจำวันรายคอก</span>
                </h3>
                <p className="text-xs text-[#6E6254] mt-0.5">
                  สำหรับเจ้าหน้าที่ฟาร์ม/คนงานผสมอาหารประจำวันตามจำนวนแกะ {penHeadCount} ตัว
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#EAE2D0] flex justify-between items-center">
                <span>
                  คอกเป้าหมาย:{' '}
                  <strong className="text-[#1E3F2B]">
                    {activePen?.name || 'กำหนดเอง (Custom)'}
                  </strong>
                </span>
                <span>
                  จำนวน:{' '}
                  <strong className="text-[#9C6B3F] font-mono">{penHeadCount} ตัว</strong>
                </span>
              </div>

              <div className="rounded-xl border border-[#EAE2D0] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0] text-[#5C5346] font-semibold border-b border-[#EAE2D0]">
                    <tr>
                      <th className="p-3 pl-4">รายการวัตถุดิบ</th>
                      <th className="p-3 text-center">สัดส่วน</th>
                      <th className="p-3 text-right pr-4">น้ำหนักที่ต้องชั่ง (กก.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE2D0] bg-[#FFFDF9]">
                    {rationItems.map((item, idx) => {
                      const ing = ingredientsMap.get(item.ingredientId);
                      if (!ing) return null;
                      const fraction =
                        totalPercentSum > 0 ? item.percentInMix / totalPercentSum : 0;
                      const batchKg = Number(
                        (fraction * nutritionStats.totalAsFedKg * penHeadCount).toFixed(2)
                      );

                      return (
                        <tr key={idx}>
                          <td className="p-3 pl-4 text-[#24201B] font-medium">{ing.nameTh}</td>
                          <td className="p-3 text-center font-mono text-[#6E6254]">
                            {item.percentInMix}%
                          </td>
                          <td className="p-3 text-right pr-4 font-mono font-semibold text-[#9C6B3F]">
                            {batchKg} กก.
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#FAF6EE] border-t border-[#EAE2D0] font-semibold text-[#1E3F2B]">
                    <tr>
                      <td className="p-3 pl-4">รวมน้ำหนักอาหารสดทั้งสิ้น</td>
                      <td className="p-3 text-center font-mono">100%</td>
                      <td className="p-3 text-right pr-4 font-mono">
                        {(nutritionStats.totalAsFedKg * penHeadCount).toFixed(1)} กก.
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EAE2D0]">
              <button
                onClick={() => setShowBatchModal(false)}
                className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] font-semibold px-5 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
