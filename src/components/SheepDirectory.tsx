/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Calculator,
  Edit3,
  Trash2,
  Scale,
  Scissors,
  Activity,
  HeartPulse,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Leaf,
  FileText,
  Heart,
} from 'lucide-react';
import { Sheep, SheepStage, FormulatedRation, Pen } from '../types/sheep';
import { INITIAL_PENS } from '../data/initialData';
import { getBreedPhoto } from '../data/breedPhotos';
import onlysheepsCupidLogo from '../assets/images/onlysheeps_cupid_logo_1794824689407.jpg';

interface SheepDirectoryProps {
  farmName?: string;
  pens?: Pen[];
  sheepList: Sheep[];
  rations: FormulatedRation[];
  onAddSheep: (sheep: Omit<Sheep, 'id'>) => void;
  onUpdateSheep: (sheep: Sheep) => void;
  onDeleteSheep: (id: string) => void;
  onAddPen?: (penData: {
    code: string;
    name: string;
    ageRange: string;
    averageWeightKg: number;
    dailyFeedKg: number;
    averageAdgGrams: number;
    purpose: string;
    notes?: string;
  }) => Pen;
  onDeletePen?: (penId: string) => void;
  onSelectSheepForFormulation: (sheep: Sheep) => void;
  onOpenOnlysheeps?: () => void;
  initialAddBreed?: string | null;
  initialOpenAddModal?: boolean;
}

const FARM_BREEDS = [
  { value: 'เมอริโน (Merino)', label: 'เมอริโน (Merino) - ขนละเอียดพิเศษ' },
  { value: 'แฮมป์เชียร์ (Hampshire)', label: 'แฮมป์เชียร์ (Hampshire) - ขนปานกลาง โตเร็ว' },
  { value: 'ดอร์เซท (Dorset)', label: 'ดอร์เซท (Dorset) - ขนขาวสะอาด ผสมได้ตลอดปี' },
];

const VACCINE_OPTIONS = [
  'วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD)',
  'วัคซีนป้องกันโรคแท้งติดต่อ',
  'วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD) + โรคแท้งติดต่อ',
];

const DEWORM_OPTIONS = [
  'Ivermectin (ไอเวอร์เมกติน 1%)',
  'Albendazole (อัลเบนดาโซล)',
];

/**
 * ข้อความแบบคลิกเพื่อขยายดูทั้งหมดเมื่อข้อความยาวเกินพื้นที่ (จาก ... เป็นข้อความเต็ม)
 */
const ExpandableText: React.FC<{
  text: string;
  threshold?: number;
  className?: string;
  alignRight?: boolean;
  stopCardPropagation?: boolean;
}> = ({
  text,
  threshold = 22,
  className = '',
  alignRight = false,
  stopCardPropagation = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  // รีเซ็ตสถานะเมื่อข้อความเปลี่ยน (เช่น เปลี่ยนดูแกะตัวอื่น)
  useEffect(() => {
    setExpanded(false);
  }, [text]);

  if (!text || text.length <= threshold) {
    return <span className={`${className} ${alignRight ? 'text-right' : ''}`}>{text}</span>;
  }

  return (
    <button
      type="button"
      onClick={e => {
        if (stopCardPropagation) e.stopPropagation();
        setExpanded(prev => !prev);
      }}
      title={expanded ? 'คลิกเพื่อย่อข้อความ' : 'คลิกเพื่ออ่านข้อความทั้งหมด'}
      className={`group/exp inline-flex items-start gap-1 max-w-full cursor-pointer transition-colors ${
        alignRight ? 'justify-end text-right' : 'justify-start text-left'
      }`}
    >
      <span
        className={`${className} ${
          expanded
            ? 'whitespace-normal break-words leading-relaxed'
            : 'truncate underline decoration-dotted decoration-[#9C6B3F]/60 underline-offset-2'
        }`}
      >
        {text}
      </span>
      <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-[#9C6B3F] group-hover/exp:text-[#1E3F2B] pt-0.5">
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </button>
  );
};

const normalizeBreedOption = (breedName?: string): string => {
  if (!breedName) return 'เมอริโน (Merino)';
  if (breedName.includes('แฮมป์เชียร์') || breedName.toLowerCase().includes('hampshire')) {
    return 'แฮมป์เชียร์ (Hampshire)';
  }
  if (breedName.includes('ดอร์เซท') || breedName.toLowerCase().includes('dorset')) {
    return 'ดอร์เซท (Dorset)';
  }
  return 'เมอริโน (Merino)';
};

const normalizeVaccineOption = (v?: string): string => {
  if (!v) return VACCINE_OPTIONS[0];
  const hasFmd = v.includes('FMD') || v.includes('ปาก');
  const hasBru = v.includes('แท้งติดต่อ');
  if (hasFmd && hasBru) return VACCINE_OPTIONS[2];
  if (hasBru) return VACCINE_OPTIONS[1];
  return VACCINE_OPTIONS[0];
};

const normalizeDewormOption = (d?: string): string => {
  if (!d) return DEWORM_OPTIONS[0];
  if (d.toLowerCase().includes('albendazole') || d.includes('อัลเบนดาโซล')) {
    return DEWORM_OPTIONS[1];
  }
  return DEWORM_OPTIONS[0];
};

export const SheepDirectory: React.FC<SheepDirectoryProps> = ({
  farmName = 'ฟาร์มของเรา',
  pens: propPens,
  sheepList,
  rations = [],
  onAddSheep,
  onUpdateSheep,
  onDeleteSheep,
  onAddPen,
  onDeletePen,
  onSelectSheepForFormulation,
  onOpenOnlysheeps,
  initialAddBreed,
  initialOpenAddModal,
}) => {
  const [selectedPenId, setSelectedPenId] = useState<string>('pen-a');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'pen' | 'all'>('pen');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAddModal || false);
  const [isAddPenModalOpen, setIsAddPenModalOpen] = useState(false);
  const [editingSheep, setEditingSheep] = useState<Sheep | null>(null);
  const [viewingDetailSheep, setViewingDetailSheep] = useState<Sheep | null>(null);

  // Add Pen Modal states
  const [penCodeInput, setPenCodeInput] = useState('');
  const [penNameInput, setPenNameInput] = useState('');
  const [penAgeRangeInput, setPenAgeRangeInput] = useState('3 - 12 เดือน');
  const [penAvgWeightInput, setPenAvgWeightInput] = useState<number>(38);
  const [penPurposeInput, setPenPurposeInput] = useState('');

  // Form states - General
  const [formEarTag, setFormEarTag] = useState('');
  const [formName, setFormName] = useState('');
  const [formBreed, setFormBreed] = useState(normalizeBreedOption(initialAddBreed || undefined));
  const [formBloodPct, setFormBloodPct] = useState('เมอริโน 100% สายเลือดแท้');
  const [formGender, setFormGender] = useState<'male' | 'female'>('female');
  const [formBirthDate, setFormBirthDate] = useState('2025-02-15');
  const [formAgeMonths, setFormAgeMonths] = useState(18);
  const [formWeightKg, setFormWeightKg] = useState(62.0);
  const [formCurrentAdg, setFormCurrentAdg] = useState(175);
  const [formStage, setFormStage] = useState<SheepStage>('wool_maintenance');
  const [formBcs, setFormBcs] = useState(3.5);
  const [formPenId, setFormPenId] = useState('pen-a');
  const [formHealthStatus, setFormHealthStatus] = useState<'healthy' | 'monitoring' | 'sick' | 'pregnant'>('healthy');
  const [formNotes, setFormNotes] = useState('');

  // Form states - Pedigree
  const [formSireId, setFormSireId] = useState('');
  const [formSireName, setFormSireName] = useState('');
  const [formSireBreed, setFormSireBreed] = useState('');
  const [formDamId, setFormDamId] = useState('');
  const [formDamName, setFormDamName] = useState('');
  const [formDamBreed, setFormDamBreed] = useState('');

  // Form states - Health & Prevention (FMD / แท้งติดต่อ, Ivermectin / Albendazole)
  const [formVaccineName, setFormVaccineName] = useState(VACCINE_OPTIONS[0]);
  const [formVaccineLastDate, setFormVaccineLastDate] = useState('2026-09-15');
  const [formDewormName, setFormDewormName] = useState(DEWORM_OPTIONS[0]);
  const [formDewormLastDate, setFormDewormLastDate] = useState('2026-08-20');
  const [formHoofTrimLastDate, setFormHoofTrimLastDate] = useState('2026-10-01');

  // Form states - Wool Specific Attributes
  const [formWoolGrade, setFormWoolGrade] = useState('ซูเปอร์ไฟน์ (< 18.5 µm)');
  const [formWoolMicron, setFormWoolMicron] = useState<number>(18.5);
  const [formWoolStapleLengthCm, setFormWoolStapleLengthCm] = useState<number>(10.5);
  const [formFleeceYieldKg, setFormFleeceYieldKg] = useState<number>(6.2);
  const [formLastShearingDate, setFormLastShearingDate] = useState<string>('2026-03-01');
  const [formWoolColor, setFormWoolColor] = useState<string>('ขาวนวลสะอาด');

  const pens = propPens && propPens.length > 0 ? propPens : INITIAL_PENS;
  const rationsMap = useMemo(() => {
    const map = new Map<string, FormulatedRation>();
    rations.forEach(r => map.set(r.id, r));
    return map;
  }, [rations]);

  useEffect(() => {
    if (pens.length > 0 && !pens.some(p => p.id === selectedPenId)) {
      setSelectedPenId(pens[0].id);
    }
  }, [pens, selectedPenId]);

  const currentPen = useMemo(() => {
    return pens.find(p => p.id === selectedPenId) || pens[0];
  }, [pens, selectedPenId]);

  const handleOpenAddPenModal = () => {
    const nextLetter = String.fromCharCode(65 + (pens.length % 26));
    const suggestedCode = `คอก ${nextLetter}`;
    setPenCodeInput(suggestedCode);
    setPenNameInput(`${suggestedCode} - แยกเลี้ยงเฉพาะกลุ่ม`);
    setPenAgeRangeInput('ทุกช่วงอายุ');
    setPenAvgWeightInput(45);
    setPenPurposeInput('จัดการโภชนาการและสุขภาพแกะขนตามกลุ่มเป้าหมาย');
    setIsAddPenModalOpen(true);
  };

  const handleSaveNewPen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddPen || !penCodeInput.trim()) return;
    const created = onAddPen({
      code: penCodeInput.trim(),
      name: penNameInput.trim() || penCodeInput.trim(),
      ageRange: penAgeRangeInput.trim() || 'ทุกช่วงอายุ',
      averageWeightKg: Number(penAvgWeightInput) || 45,
      dailyFeedKg: Number((((Number(penAvgWeightInput) || 45) * 0.035)).toFixed(1)),
      averageAdgGrams: 175,
      purpose: penPurposeInput.trim() || 'จัดการฝูงแกะตามกลุ่มเป้าหมายของฟาร์ม',
    });
    setSelectedPenId(created.id);
    setViewMode('pen');
    setIsAddPenModalOpen(false);
  };

  const displayedSheep = useMemo(() => {
    return sheepList.filter(s => {
      const matchSearch =
        s.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sireName && s.sireName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.damName && s.damName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;
      if (viewMode === 'all') return true;
      return s.penId === selectedPenId;
    });
  }, [sheepList, searchTerm, selectedPenId, viewMode]);

  const penStats = useMemo(() => {
    const penSheep = sheepList.filter(s => s.penId === selectedPenId);
    const count = penSheep.length;
    if (count === 0) {
      return {
        count: 0,
        avgWeight: currentPen.averageWeightKg,
        avgAdg: currentPen.averageAdgGrams,
        dailyFeed: currentPen.dailyFeedKg,
        ageRange: currentPen.ageRange,
      };
    }
    const avgWeight = Number((penSheep.reduce((sum, s) => sum + s.weightKg, 0) / count).toFixed(1));
    const avgAdg = Math.round(penSheep.reduce((sum, s) => sum + (s.currentAdgGrams || 170), 0) / count);
    const dailyFeed = Number((avgWeight * 0.038).toFixed(1));
    return {
      count,
      avgWeight,
      avgAdg,
      dailyFeed,
      ageRange: currentPen.ageRange,
    };
  }, [sheepList, selectedPenId, currentPen]);

  const handleAutoCalcBlood = (sBreed: string, dBreed: string) => {
    if (!sBreed && !dBreed) return;
    if (sBreed && !dBreed) {
      setFormBloodPct(`${sBreed} 100%`);
    } else if (sBreed === dBreed) {
      setFormBloodPct(`${sBreed} 100% สายเลือดแท้`);
    } else {
      setFormBloodPct(`${sBreed} 50% + ${dBreed} 50% (ลูกผสมสองสาย)`);
    }
  };

  const resetForm = () => {
    const nextNum = sheepList.length + 1;
    const defaultBreed = normalizeBreedOption(initialAddBreed || undefined);
    setFormEarTag(`SH-${String(nextNum).padStart(3, '0')}`);
    setFormName('');
    setFormBreed(defaultBreed);
    setFormBloodPct(`${defaultBreed} 100% สายเลือดแท้`);
    setFormGender('female');
    setFormBirthDate('2025-02-15');
    setFormAgeMonths(18);
    setFormWeightKg(62.0);
    setFormCurrentAdg(175);
    setFormStage('wool_maintenance');
    setFormBcs(3.5);
    setFormPenId(selectedPenId || 'pen-a');
    setFormHealthStatus('healthy');
    setFormNotes('');

    setFormSireId('');
    setFormSireName('');
    setFormSireBreed('');
    setFormDamId('');
    setFormDamName('');
    setFormDamBreed('');

    setFormVaccineName(VACCINE_OPTIONS[0]);
    setFormVaccineLastDate('2026-09-15');
    setFormDewormName(DEWORM_OPTIONS[0]);
    setFormDewormLastDate('2026-08-20');
    setFormHoofTrimLastDate('2026-10-01');

    setFormWoolGrade('ซูเปอร์ไฟน์ (< 18.5 µm)');
    setFormWoolMicron(18.5);
    setFormWoolStapleLengthCm(10.5);
    setFormFleeceYieldKg(6.2);
    setFormLastShearingDate('2026-03-01');
    setFormWoolColor('ขาวนวลสะอาด');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (sheep: Sheep) => {
    setEditingSheep(sheep);
    setFormEarTag(sheep.earTag);
    setFormName(sheep.name);
    setFormBreed(normalizeBreedOption(sheep.breed));
    setFormBloodPct(sheep.bloodPercentage || `${sheep.breed} 100%`);
    setFormGender(sheep.gender);
    setFormBirthDate(sheep.birthDate);
    setFormAgeMonths(sheep.ageMonths);
    setFormWeightKg(sheep.weightKg);
    setFormCurrentAdg(sheep.currentAdgGrams || 175);
    setFormStage(sheep.stage);
    setFormBcs(sheep.bcs);
    setFormPenId(sheep.penId || 'pen-a');
    setFormHealthStatus(sheep.healthStatus);
    setFormNotes(sheep.notes || '');

    setFormSireId(sheep.sireId || '');
    setFormSireName(sheep.sireName || '');
    setFormSireBreed(sheep.sireBreed || '');
    setFormDamId(sheep.damId || '');
    setFormDamName(sheep.damName || '');
    setFormDamBreed(sheep.damBreed || '');

    setFormVaccineName(normalizeVaccineOption(sheep.vaccineName));
    setFormVaccineLastDate(sheep.vaccineLastDate || '2026-09-15');
    setFormDewormName(normalizeDewormOption(sheep.dewormName));
    setFormDewormLastDate(sheep.dewormLastDate || '2026-08-20');
    setFormHoofTrimLastDate(sheep.hoofTrimLastDate || '2026-10-01');

    setFormWoolGrade(sheep.woolGrade || 'ไฟน์วูลละเอียด (19–21 µm)');
    setFormWoolMicron(sheep.woolMicron || 19.5);
    setFormWoolStapleLengthCm(sheep.woolStapleLengthCm || 10.5);
    setFormFleeceYieldKg(sheep.fleeceYieldKg ?? 6.0);
    setFormLastShearingDate(sheep.lastShearingDate || '2026-03-01');
    setFormWoolColor(sheep.woolColor || 'ขาวนวล');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEarTag.trim()) return;

    const matchedPen = pens.find(p => p.id === formPenId) || pens[0];

    onAddSheep({
      earTag: formEarTag.trim(),
      name: formName.trim() || `แกะขน ${formEarTag.trim()}`,
      breed: formBreed,
      bloodPercentage: formBloodPct.trim() || `${formBreed} 100%`,
      gender: formGender,
      birthDate: formBirthDate,
      ageMonths: Number(formAgeMonths),
      weightKg: Number(formWeightKg),
      currentAdgGrams: Number(formCurrentAdg),
      adgExplanation: `ADG +${formCurrentAdg} กรัม/วัน: น้ำหนักเติบโตสม่ำเสมอ ร่างกายแข็งแรง สร้างเส้นใยขนได้ตามเกณฑ์มาตรฐาน`,
      stage: formStage,
      bcs: Number(formBcs),
      penId: formPenId,
      pen: matchedPen.code,
      healthStatus: formHealthStatus,
      notes: formNotes,
      photoUrl: getBreedPhoto(formBreed),

      sireId: formSireId.trim() || undefined,
      sireName: formSireName.trim() || undefined,
      sireBreed: formSireBreed.trim() || undefined,
      damId: formDamId.trim() || undefined,
      damName: formDamName.trim() || undefined,
      damBreed: formDamBreed.trim() || undefined,

      vaccineName: formVaccineName,
      vaccineLastDate: formVaccineLastDate || undefined,
      dewormName: formDewormName,
      dewormLastDate: formDewormLastDate || undefined,
      hoofTrimLastDate: formHoofTrimLastDate || undefined,

      woolGrade: formWoolGrade,
      woolMicron: Number(formWoolMicron) || undefined,
      woolStapleLengthCm: Number(formWoolStapleLengthCm) || undefined,
      fleeceYieldKg: Number(formFleeceYieldKg) ?? undefined,
      lastShearingDate: formLastShearingDate || undefined,
      woolColor: formWoolColor || undefined,
      crimpPerInch: 10,
      fleeceQualityRating: 5,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSheep || !formEarTag.trim()) return;

    const matchedPen = pens.find(p => p.id === formPenId) || pens[0];

    onUpdateSheep({
      ...editingSheep,
      earTag: formEarTag.trim(),
      name: formName.trim() || `แกะขน ${formEarTag.trim()}`,
      breed: formBreed,
      bloodPercentage: formBloodPct.trim() || `${formBreed} 100%`,
      gender: formGender,
      birthDate: formBirthDate,
      ageMonths: Number(formAgeMonths),
      weightKg: Number(formWeightKg),
      currentAdgGrams: Number(formCurrentAdg),
      adgExplanation: `ADG +${formCurrentAdg} กรัม/วัน: น้ำหนักเติบโตสม่ำเสมอ ร่างกายแข็งแรง สร้างเส้นใยขนได้ตามเกณฑ์มาตรฐาน`,
      stage: formStage,
      bcs: Number(formBcs),
      penId: formPenId,
      pen: matchedPen.code,
      healthStatus: formHealthStatus,
      notes: formNotes,
      photoUrl: getBreedPhoto(formBreed),

      sireId: formSireId.trim() || undefined,
      sireName: formSireName.trim() || undefined,
      sireBreed: formSireBreed.trim() || undefined,
      damId: formDamId.trim() || undefined,
      damName: formDamName.trim() || undefined,
      damBreed: formDamBreed.trim() || undefined,

      vaccineName: formVaccineName,
      vaccineLastDate: formVaccineLastDate || undefined,
      dewormName: formDewormName,
      dewormLastDate: formDewormLastDate || undefined,
      hoofTrimLastDate: formHoofTrimLastDate || undefined,

      woolGrade: formWoolGrade,
      woolMicron: Number(formWoolMicron) || undefined,
      woolStapleLengthCm: Number(formWoolStapleLengthCm) || undefined,
      fleeceYieldKg: Number(formFleeceYieldKg) ?? undefined,
      lastShearingDate: formLastShearingDate || undefined,
      woolColor: formWoolColor || undefined,
    });

    setEditingSheep(null);
  };

  return (
    <div className="space-y-10">
      {/* Section 1: Boutique Pen Selector Header & 4 Pens */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[#E5DEC9]">
          <div>
            <p className="text-xs text-[#6E4826] font-semibold tracking-wide flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#2E6B47]" />
              <span>
                1. ทะเบียนฝูงแกะส่วนตัวของ {farmName} · 3 สายพันธุ์หลัก (Merino · Hampshire · Dorset)
              </span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] tracking-tight mt-1">
              ระบบจัดการคอกและทะเบียนแกะขน ({sheepList.length} ตัว)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenOnlysheeps && (
              <button
                type="button"
                onClick={onOpenOnlysheeps}
                className="tactile-pink-btn bg-gradient-to-r from-[#DB2777] via-[#EC4899] to-[#F43F5E] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 border border-[#FBCFE8]"
                title="เข้าสู่หน้า Onlysheeps ปัดหาคู่แกะข้ามฟาร์ม 🐑😘💘"
              >
                <span className="w-7 h-7 rounded-full overflow-hidden border-2 border-white bg-[#FFF0F6] shrink-0">
                  <img
                    src={onlysheepsCupidLogo}
                    alt="Onlysheeps Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </span>
                <Heart className="w-3.5 h-3.5 fill-current text-[#FDE047] shrink-0" />
                <span>Onlysheeps 🐑😘</span>
              </button>
            )}

            <button
              onClick={() => setViewMode(viewMode === 'all' ? 'pen' : 'all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'all'
                  ? 'bg-[#4A321F] text-[#FAF6EE] border-[#4A321F]'
                  : 'bg-[#FFFDF9] text-[#5C5346] border-[#DFCBB3] hover:border-[#9C6B3F] hover:text-[#1E3F2B]'
              }`}
            >
              {viewMode === 'all' ? 'กลับไปดูรายคอก' : `ดูแกะทั้งหมดในฟาร์ม (${sheepList.length} ตัว)`}
            </button>

            {onAddPen && (
              <button
                type="button"
                onClick={handleOpenAddPenModal}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[#1E3F2B] bg-[#EDF4EF] hover:bg-[#DFECE3] text-[#1E3F2B] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มคอกใหม่</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="tactile-cta-btn bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>ลงทะเบียนแกะขนใหม่</span>
            </button>
          </div>
        </div>

        {/* Pen Selector Cards (Supports unlimited custom pens) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pens.map(pen => {
            const isSelected = selectedPenId === pen.id && viewMode !== 'all';
            const countInPen = sheepList.filter(s => s.penId === pen.id).length;
            const canDeletePen = Boolean(onDeletePen && pens.length > 1 && countInPen === 0);

            return (
              <div key={pen.id} className="relative group/pen">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPenId(pen.id);
                    setViewMode('pen');
                  }}
                  className={`w-full h-full p-5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E3F2B] border-[#4A321F] text-[#FAF6EE] shadow-md shadow-[#1E3F2B]/15'
                      : 'bg-[#FFFDF9] border-[#E5DEC9] hover:border-[#8B5E34] text-[#24201B]'
                  }`}
                >
                  <div className={`flex items-baseline justify-between mb-1.5 ${canDeletePen ? 'pr-7' : ''}`}>
                    <span className={`text-lg font-semibold ${isSelected ? 'text-[#FAF6EE]' : 'text-[#1E3F2B]'}`}>
                      {pen.code}
                    </span>
                    <span
                      className={`text-xs font-mono font-medium ${
                        isSelected ? 'text-[#DFCBB3]' : 'text-[#9C6B3F]'
                      }`}
                    >
                      {countInPen} ตัว
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm font-medium line-clamp-1 ${isSelected ? 'text-[#EFE6D5]' : 'text-[#5C5346]'}`}>
                    {pen.name.replace(/^(คอก [A-Z0-9]+ - )/, '')}
                  </p>
                  <div
                    className={`flex items-center gap-2 mt-3 pt-2.5 border-t text-xs ${
                      isSelected ? 'border-[#FAF6EE]/15 text-[#D5E0D7]' : 'border-[#EAE2D0] text-[#7D7061]'
                    }`}
                  >
                    <span>อายุ {pen.ageRange}</span>
                    <span aria-hidden="true">·</span>
                    <span>นน. ~{pen.averageWeightKg} กก.</span>
                  </div>
                </button>

                {canDeletePen && (
                  <button
                    type="button"
                    aria-label={`ลบ${pen.code}`}
                    title="ลบคอกที่ไม่มีแกะ"
                    onClick={() => {
                      if (selectedPenId === pen.id) {
                        const fallback = pens.find(p => p.id !== pen.id);
                        if (fallback) setSelectedPenId(fallback.id);
                      }
                      onDeletePen?.(pen.id);
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-[#DFCBB3] hover:text-white hover:bg-white/15'
                        : 'text-[#8C7F6E] hover:text-[#A63D2E] hover:bg-[#FBEEEC]'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {onAddPen && (
            <button
              type="button"
              onClick={handleOpenAddPenModal}
              className="p-5 rounded-2xl border-2 border-dashed border-[#CBB69B] hover:border-[#1E3F2B] bg-[#FAF6EE]/70 hover:bg-[#EDF4EF] text-[#5C5346] hover:text-[#1E3F2B] transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[124px]"
            >
              <span className="w-9 h-9 rounded-full bg-[#FFFDF9] border border-[#DFCBB3] flex items-center justify-center text-[#1E3F2B]">
                <Plus className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold">+ เพิ่มคอกใหม่</span>
              <span className="text-[11px] text-[#8C7F6E]">สร้างคอกเพิ่มไม่จำกัดจำนวน</span>
            </button>
          )}
        </div>
      </section>

      {/* Section 2: Pen Overview Metrics */}
      {viewMode === 'pen' && (
        <section className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-[#EAE2D0]">
            <h2 className="text-lg font-semibold text-[#1E3F2B]">
              ข้อมูลภาพรวม {currentPen.code} — {currentPen.name}
            </h2>
            <span className="text-xs sm:text-sm text-[#6E4826] font-medium">
              {currentPen.purpose}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE2D0] text-center">
            <div className="py-3 px-4">
              <span className="text-xs text-[#6E6254] block">① ช่วงอายุ</span>
              <strong className="text-[#24201B] text-base sm:text-lg font-semibold mt-1 block">
                {penStats.ageRange}
              </strong>
              <span className="text-[11px] text-[#8C7F6E] block mt-0.5">เฉลี่ยของฝูงในคอก</span>
            </div>

            <div className="py-3 px-4">
              <span className="text-xs text-[#6E6254] block">② จำนวนตัว</span>
              <strong className="text-[#1E3F2B] text-xl font-semibold font-mono mt-1 block">
                {penStats.count} <span className="text-xs font-normal text-[#6E6254]">ตัว</span>
              </strong>
              <span className="text-[11px] text-[#8C7F6E] block mt-0.5">ประชากรปัจจุบัน</span>
            </div>

            <div className="py-3 px-4">
              <span className="text-xs text-[#6E6254] block">③ น้ำหนักเฉลี่ย</span>
              <strong className="text-[#24201B] text-xl font-semibold font-mono mt-1 block">
                {penStats.avgWeight} <span className="text-xs font-normal text-[#6E6254]">กก.</span>
              </strong>
              <span className="text-[11px] text-[#8C7F6E] block mt-0.5">ชั่งล่าสุด</span>
            </div>

            <div className="py-3 px-4">
              <span className="text-xs text-[#6E6254] block">④ ปริมาณอาหาร</span>
              <strong className="text-[#2E6B47] text-xl font-semibold font-mono mt-1 block">
                {penStats.dailyFeed} <span className="text-xs font-normal text-[#6E6254]">กก./ตัว/วัน</span>
              </strong>
              <span className="text-[11px] text-[#8C7F6E] block mt-0.5">หญ้า + อาหารข้น</span>
            </div>

            <div className="py-3 px-4 col-span-2 sm:col-span-1">
              <span className="text-xs text-[#6E6254] block">⑤ ADG เฉลี่ย</span>
              <strong className="text-[#9C6B3F] text-xl font-semibold font-mono mt-1 block">
                +{penStats.avgAdg} <span className="text-xs font-normal text-[#6E6254]">ก./วัน</span>
              </strong>
              <span className="text-[11px] text-[#8C7F6E] block mt-0.5">อัตราโตต่อวัน</span>
            </div>
          </div>

          <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] flex items-start gap-3 text-xs sm:text-sm text-[#5C5346]">
            <Info className="w-4 h-4 text-[#9C6B3F] shrink-0 mt-1" />
            <div>
              <strong className="text-[#1E3F2B] font-semibold">คำอธิบาย ADG สำหรับเกษตรกร:</strong>
              <span className="ml-1.5 leading-relaxed">
                ADG (Average Daily Gain) คือ <strong className="text-[#24201B]">อัตราการเจริญเติบโตต่อน้ำหนักตัวต่อวัน</strong> แกะขนที่ได้รับโภชนาการสมบูรณ์จะมี ADG เหมาะสม ไม่ผอมและไม่อ้วนเกินไป ทำให้ต่อมรากขนสร้างโปรตีนเคราตินสม่ำเสมอ เส้นขนแข็งแรง ไม่ขาดเปราะ
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Lookbook Grid of Sheep in Pen */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Scissors className="w-4 h-4 text-[#9C6B3F]" />
            <h3 className="text-lg font-semibold text-[#1E3F2B]">
              {viewMode === 'all'
                ? `แกะขนทั้งหมดในฟาร์ม (${displayedSheep.length} ตัว)`
                : `รูปแกะแต่ละตัวใน ${currentPen.code} และรหัสแกะ (${displayedSheep.length} ตัว)`}
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8C7F6E] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเบอร์หู, ชื่อ, สายพันธุ์..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-xs sm:text-sm text-[#24201B] placeholder:text-[#9A8E7D] focus:outline-none focus:border-[#1E3F2B]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {displayedSheep.map(sheep => {
            const isMale = sheep.gender === 'male';

            return (
              <div
                key={sheep.id}
                onClick={() => setViewingDetailSheep(sheep)}
                className="bg-[#FFFDF9] rounded-2xl border border-[#DFCBB3] hover:border-[#4A321F] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4A321F]/10 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full bg-[#F3ECE0] overflow-hidden">
                    <img
                      src={sheep.photoUrl || getBreedPhoto(sheep.breed)}
                      alt={sheep.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
                    <span
                      className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-xs ${
                        isMale
                          ? 'bg-[#1E3F2B]/90 text-[#FAF6EE]'
                          : 'bg-[#FFFDF9]/95 text-[#6E4826]'
                      }`}
                    >
                      {isMale ? '♂ เพศผู้' : '♀ เพศเมีย'}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#8C7F6E] font-medium">
                        <span className="font-mono font-semibold text-[#9C6B3F]">{sheep.earTag}</span>
                        <span>{sheep.pen}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-[#1E3F2B] mt-1">
                        {sheep.name}
                      </h4>
                      <p className="text-xs text-[#6E6254]">
                        {sheep.breed}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#EAE2D0] space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#7D7061] shrink-0">เกรดขน</span>
                        <div className="min-w-0 flex-1 flex justify-end">
                          <ExpandableText
                            text={sheep.woolGrade || 'ไฟน์วูลละเอียด'}
                            threshold={22}
                            alignRight
                            stopCardPropagation
                            className="text-[#24201B] font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#7D7061] shrink-0">สายเลือด</span>
                        <div className="min-w-0 flex-1 flex justify-end">
                          <ExpandableText
                            text={sheep.bloodPercentage || `${sheep.breed} 100%`}
                            threshold={24}
                            alignRight
                            stopCardPropagation
                            className="text-[#5C5346] font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#7D7061] shrink-0">พ่อพันธุ์</span>
                        <div className="min-w-0 flex-1 flex justify-end">
                          <ExpandableText
                            text={sheep.sireName || sheep.sireId || 'ไม่ระบุ'}
                            threshold={22}
                            alignRight
                            stopCardPropagation
                            className="text-[#5C5346]"
                          />
                        </div>
                      </div>

                      {sheep.assignedRationId && rationsMap.get(sheep.assignedRationId) && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[#7D7061] shrink-0">สูตรอาหาร</span>
                          <div className="min-w-0 flex-1 flex justify-end">
                            <ExpandableText
                              text={rationsMap.get(sheep.assignedRationId)!.name}
                              threshold={22}
                              alignRight
                              stopCardPropagation
                              className="text-[#2E6B47] font-semibold"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#EAE2D0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#5C5346]">
                        <Scale className="w-3.5 h-3.5 text-[#8C7F6E]" />
                        <span>น้ำหนัก</span>
                        <strong className="text-[#24201B] font-mono font-semibold">{sheep.weightKg} กก.</strong>
                      </div>
                      <div>
                        <span className="text-[#7D7061] mr-1">ADG</span>
                        <strong className="text-[#1E3F2B] font-mono font-semibold">
                          +{sheep.currentAdgGrams || 170} ก./วัน
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-3.5 bg-[#FAF6EE]/70 border-t border-[#EAE2D0] flex items-center justify-between text-xs text-[#1E3F2B] font-medium">
                  <span>กดเพื่อดูข้อมูลเต็มรายตัว</span>
                  <span className="text-[#9C6B3F] group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Individual Sheep Card Modal (Click any '...' field to expand completely!) */}
      {viewingDetailSheep && (
        <div className="fixed inset-0 bg-[#24201B]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-2xl w-full border-2 border-[#4A321F]/40 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#24201B]">
            <div className="bg-[#FAF6EE] px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs bg-[#1E3F2B] text-[#FAF6EE] px-2.5 py-1 rounded-lg font-mono font-semibold">
                  {viewingDetailSheep.earTag}
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-[#1E3F2B]">
                  ข้อมูลแกะขนรายตัว (แตะข้อความที่มี ... เพื่อขยายดูทั้งหมด)
                </h3>
              </div>
              <button
                onClick={() => setViewingDetailSheep(null)}
                className="text-[#6E6254] hover:text-[#1E3F2B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Top Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start pb-6 border-b border-[#EAE2D0]">
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div className="relative w-full aspect-square max-w-[210px] rounded-2xl overflow-hidden border-2 border-[#4A321F]/40 bg-[#F3ECE0]">
                    <img
                      src={viewingDetailSheep.photoUrl || getBreedPhoto(viewingDetailSheep.breed)}
                      alt={viewingDetailSheep.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-[#FFFDF9]/95 px-2.5 py-1 rounded-lg border border-[#E5DEC9] flex items-center gap-1 font-semibold text-xs text-[#1E3F2B]">
                      <span>{viewingDetailSheep.gender === 'male' ? '♂' : '♀'}</span>
                      <span>{viewingDetailSheep.gender === 'male' ? 'เพศผู้' : 'เพศเมีย'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#9C6B3F] font-semibold mt-2.5">
                    รหัสเบอร์หู: {viewingDetailSheep.earTag}
                  </span>
                </div>

                <div className="sm:col-span-7 space-y-4">
                  <div>
                    <span className="text-xs text-[#9C6B3F] font-semibold block">
                      {viewingDetailSheep.pen}
                    </span>
                    <h2 className="text-2xl font-semibold text-[#1E3F2B] mt-0.5">
                      {viewingDetailSheep.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6254] mt-0.5">
                      {viewingDetailSheep.breed} · อายุ {viewingDetailSheep.ageMonths} เดือน
                    </p>
                  </div>

                  <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-2.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[#7D7061] shrink-0">สัดส่วนเลือด:</span>
                      <div className="min-w-0 flex-1 flex justify-end">
                        <ExpandableText
                          text={viewingDetailSheep.bloodPercentage || `${viewingDetailSheep.breed} 100%`}
                          threshold={24}
                          alignRight
                          className="text-[#1E3F2B] font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-[#7D7061] shrink-0">วันเกิด:</span>
                      <span className="font-mono text-[#24201B]">{viewingDetailSheep.birthDate}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[#7D7061] shrink-0">พ่อพันธุ์ (Sire):</span>
                      <div className="min-w-0 flex-1 flex justify-end">
                        <ExpandableText
                          text={viewingDetailSheep.sireName || viewingDetailSheep.sireId || 'ไม่มีข้อมูล'}
                          threshold={22}
                          alignRight
                          className="text-[#24201B]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[#7D7061] shrink-0">แม่พันธุ์ (Dam):</span>
                      <div className="min-w-0 flex-1 flex justify-end">
                        <ExpandableText
                          text={viewingDetailSheep.damName || viewingDetailSheep.damId || 'ไม่มีข้อมูล'}
                          threshold={22}
                          alignRight
                          className="text-[#24201B]"
                        />
                      </div>
                    </div>

                    {viewingDetailSheep.assignedRationId &&
                      rationsMap.get(viewingDetailSheep.assignedRationId) && (
                        <div className="flex justify-between items-start gap-2 pt-2 border-t border-[#EAE2D0]">
                          <span className="text-[#7D7061] shrink-0">สูตรอาหารประจำตัว:</span>
                          <div className="min-w-0 flex-1 flex justify-end">
                            <ExpandableText
                              text={`${
                                rationsMap.get(viewingDetailSheep.assignedRationId)!.name
                              } (${rationsMap
                                .get(viewingDetailSheep.assignedRationId)!
                                .totalAsFedKg.toFixed(2)} กก./วัน · ${rationsMap
                                .get(viewingDetailSheep.assignedRationId)!
                                .costPerHeadPerDay.toFixed(1)} ฿)`}
                              threshold={26}
                              alignRight
                              className="text-[#2E6B47] font-semibold"
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Section 1: สุขภาพแกะ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#2E6B47]" />
                  <h4 className="text-sm font-semibold text-[#1E3F2B]">
                    สุขภาพแกะและการป้องกันโรค
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE2D0] bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] text-xs">
                  <div className="p-3.5 min-w-0">
                    <span className="text-[11px] text-[#7D7061] block">วัคซีนป้องกันโรค</span>
                    <div className="mt-1">
                      <ExpandableText
                        text={normalizeVaccineOption(viewingDetailSheep.vaccineName)}
                        threshold={20}
                        className="text-[#2E6B47] font-semibold"
                      />
                    </div>
                    <span className="text-[11px] text-[#6E6254] font-mono mt-1 block">
                      ฉีดล่าสุด: {viewingDetailSheep.vaccineLastDate || '2026-09-15'}
                    </span>
                  </div>

                  <div className="p-3.5 min-w-0">
                    <span className="text-[11px] text-[#7D7061] block">การถ่ายพยาธิ</span>
                    <div className="mt-1">
                      <ExpandableText
                        text={normalizeDewormOption(viewingDetailSheep.dewormName)}
                        threshold={20}
                        className="text-[#1E3F2B] font-semibold"
                      />
                    </div>
                    <span className="text-[11px] text-[#6E6254] font-mono mt-1 block">
                      ถ่ายล่าสุด: {viewingDetailSheep.dewormLastDate || '2026-08-20'}
                    </span>
                  </div>

                  <div className="p-3.5 min-w-0">
                    <span className="text-[11px] text-[#7D7061] block">การตัดแต่งกีบ</span>
                    <strong className="text-[#9C6B3F] block mt-1 font-semibold">
                      กีบสะอาด แข็งแรง
                    </strong>
                    <span className="text-[11px] text-[#6E6254] font-mono mt-1 block">
                      ตัดแต่งล่าสุด: {viewingDetailSheep.hoofTrimLastDate || '2026-10-01'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: ผลิตภัณฑ์ที่ได้จากแกะ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#9C6B3F]" />
                  <h4 className="text-sm font-semibold text-[#1E3F2B]">
                    ผลิตภัณฑ์ที่ได้จากแกะ (ขนแกะและเส้นใย)
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE2D0] bg-[#FAF6EE] rounded-xl border border-[#EAE2D0] text-center text-xs">
                  <div className="p-3.5 min-w-0">
                    <span className="text-[11px] text-[#7D7061] block">เกรดขน</span>
                    <div className="mt-1 flex justify-center">
                      <ExpandableText
                        text={viewingDetailSheep.woolGrade || 'ไฟน์วูลละเอียด'}
                        threshold={16}
                        className="text-[#9C6B3F] font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7D7061] block">ขนาดเส้นใยขน</span>
                    <strong className="text-[#1E3F2B] font-mono text-base font-semibold block mt-0.5">
                      {viewingDetailSheep.woolMicron ? `${viewingDetailSheep.woolMicron} µm` : '-'}
                    </strong>
                    <span className="text-[10px] text-[#8C7F6E]">ไมครอน</span>
                  </div>

                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7D7061] block">ความยาวเส้นใยขน</span>
                    <strong className="text-[#24201B] font-mono text-base font-semibold block mt-0.5">
                      {viewingDetailSheep.woolStapleLengthCm ? `${viewingDetailSheep.woolStapleLengthCm} ซม.` : '-'}
                    </strong>
                    <span className="text-[10px] text-[#8C7F6E]">Staple Length</span>
                  </div>

                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7D7061] block">ปริมาณขนตัด/ปี</span>
                    <strong className="text-[#24201B] font-mono text-base font-semibold block mt-0.5">
                      {viewingDetailSheep.fleeceYieldKg ? `${viewingDetailSheep.fleeceYieldKg} กก.` : '-'}
                    </strong>
                    <span className="text-[10px] text-[#8C7F6E]">ผลผลิตประจำปี</span>
                  </div>
                </div>
              </div>

              {/* Section 3: ADG & Notes */}
              <div className="bg-[#EDF3EE] rounded-xl p-4 border border-[#C5D6C9] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#1E3F2B]" />
                    <h4 className="text-sm font-semibold text-[#1E3F2B]">
                      ADG (อัตราการเจริญเติบโตต่อวัน)
                    </h4>
                  </div>
                  <span className="font-mono font-semibold text-[#1E3F2B] text-base">
                    +{viewingDetailSheep.currentAdgGrams || 175} กรัม/วัน
                  </span>
                </div>
                <div className="text-[#3C5343] leading-relaxed">
                  <ExpandableText
                    text={
                      viewingDetailSheep.adgExplanation ||
                      `น้ำหนักเพิ่มเฉลี่ยวันละ ${viewingDetailSheep.currentAdgGrams || 175} กรัม สุขภาพสมบูรณ์ สังเคราะห์เส้นใยขนได้ตามเกณฑ์มาตรฐานแกะขน`
                    }
                    threshold={48}
                    className="text-[#3C5343]"
                  />
                </div>
              </div>

              {viewingDetailSheep.notes && (
                <div className="bg-[#FAF6EE] rounded-xl p-4 border border-[#EAE2D0] space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-[#6E4826] font-semibold">
                    <FileText className="w-4 h-4 text-[#9C6B3F]" />
                    <span>หมายเหตุเพิ่มเติมประจำตัวแกะ</span>
                  </div>
                  <ExpandableText
                    text={viewingDetailSheep.notes}
                    threshold={52}
                    className="text-[#5C5346]"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-[#FAF6EE] px-6 py-4 border-t border-[#E5DEC9] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const s = viewingDetailSheep;
                    setViewingDetailSheep(null);
                    handleOpenEditModal(s);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#DFCBB3] bg-[#FFFDF9] hover:bg-[#F3ECE0] text-[#5C5346] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูล</span>
                </button>
                <button
                  onClick={() => {
                    const id = viewingDetailSheep.id;
                    setViewingDetailSheep(null);
                    onDeleteSheep(id);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#EAC6C0] bg-[#FBEEEC] text-[#A63D2E] hover:bg-[#F7DFDB] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const s = viewingDetailSheep;
                  setViewingDetailSheep(null);
                  onSelectSheepForFormulation(s);
                }}
                className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Calculator className="w-4 h-4" />
                <span>คำนวณสูตรอาหารสำหรับแกะตัวนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Sheep Modal */}
      {(isAddModalOpen || editingSheep) && (
        <div className="fixed inset-0 bg-[#24201B]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-2xl w-full border border-[#DFCBB3] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#24201B]">
            <div className="bg-[#FAF6EE] px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#9C6B3F]" />
                <span>{editingSheep ? 'แก้ไขข้อมูลแกะขน' : 'ลงทะเบียนแกะขนใหม่เข้าคอก'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSheep(null);
                }}
                className="text-[#6E6254] hover:text-[#1E3F2B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingSheep ? handleSaveEdit : handleSaveAdd} className="p-6 overflow-y-auto space-y-6">
              {/* Part 1 */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#9C6B3F] block">
                  หมวดที่ 1: คอกที่สังกัดและข้อมูลพื้นฐาน
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] text-xs">
                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">คอกที่สังกัด *</label>
                    <select
                      value={formPenId}
                      onChange={e => setFormPenId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#1E3F2B] font-semibold"
                    >
                      {pens.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">รหัสเบอร์หู *</label>
                    <input
                      type="text"
                      required
                      value={formEarTag}
                      onChange={e => setFormEarTag(e.target.value)}
                      placeholder="เช่น SH-043"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#9C6B3F] font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ชื่อเรียกแกะขน</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="เช่น แก้วใจ"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#24201B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">
                      สายพันธุ์แกะขนในฟาร์ม (3 สายพันธุ์หลัก) *
                    </label>
                    <select
                      value={formBreed}
                      onChange={e => {
                        setFormBreed(e.target.value);
                        handleAutoCalcBlood(e.target.value, formDamBreed || e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#24201B] font-medium"
                    >
                      {FARM_BREEDS.map(b => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">เพศ *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormGender('male')}
                        className={`py-2 text-xs rounded-lg border font-semibold transition cursor-pointer ${
                          formGender === 'male'
                            ? 'bg-[#1E3F2B] text-[#FAF6EE] border-[#1E3F2B]'
                            : 'bg-[#FFFDF9] border-[#DFCBB3] text-[#6E6254]'
                        }`}
                      >
                        ♂ เพศผู้
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormGender('female')}
                        className={`py-2 text-xs rounded-lg border font-semibold transition cursor-pointer ${
                          formGender === 'female'
                            ? 'bg-[#9C6B3F] text-[#FAF6EE] border-[#9C6B3F]'
                            : 'bg-[#FFFDF9] border-[#DFCBB3] text-[#6E6254]'
                        }`}
                      >
                        ♀ เพศเมีย
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ระยะการผลิตแกะขน *</label>
                    <select
                      value={formStage}
                      onChange={e => setFormStage(e.target.value as SheepStage)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#1E3F2B] font-medium"
                    >
                      <option value="wool_lamb">ลูกแกะเล็ก (0–3 เดือน / ดูดนม-เลียราง)</option>
                      <option value="wool_weaning">ลูกแกะหย่านม (3–6 เดือน)</option>
                      <option value="wool_growing">แกะรุ่นขน / พัฒนาต่อมสร้างขน</option>
                      <option value="wool_maintenance">แกะขนโตเต็มวัย / บำรุงรักษาเส้นใย</option>
                      <option value="wool_gestation">แม่แกะขนอุ้มท้อง (รวมทุกระยะ)</option>
                      <option value="wool_lactation">แม่แกะขนระยะให้นมลูก</option>
                      <option value="wool_ram">พ่อพันธุ์แกะขนสมบูรณ์พันธุ์</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Part 2: Pedigree */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#1E3F2B] block">
                  หมวดที่ 2: สายพันธุ์พ่อแม่ & คำนวณ % เลือด (Pedigree)
                </span>
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#FFFDF9] p-3 rounded-lg border border-[#EAE2D0] space-y-2">
                      <span className="text-[#1E3F2B] font-semibold block text-xs">♂ พ่อพันธุ์ (Sire)</span>
                      <input
                        type="text"
                        placeholder="รหัส/ชื่อพ่อพันธุ์ เช่น SH-001"
                        value={formSireName}
                        onChange={e => setFormSireName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded text-xs text-[#24201B]"
                      />
                      <input
                        type="text"
                        placeholder="สายพันธุ์พ่อ เช่น เมอริโน (Merino)"
                        value={formSireBreed}
                        onChange={e => {
                          setFormSireBreed(e.target.value);
                          handleAutoCalcBlood(e.target.value, formDamBreed);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded text-xs text-[#5C5346]"
                      />
                    </div>

                    <div className="bg-[#FFFDF9] p-3 rounded-lg border border-[#EAE2D0] space-y-2">
                      <span className="text-[#9C6B3F] font-semibold block text-xs">♀ แม่พันธุ์ (Dam)</span>
                      <input
                        type="text"
                        placeholder="รหัส/ชื่อแม่พันธุ์ เช่น SH-010"
                        value={formDamName}
                        onChange={e => setFormDamName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded text-xs text-[#24201B]"
                      />
                      <input
                        type="text"
                        placeholder="สายพันธุ์แม่ เช่น ดอร์เซท (Dorset)"
                        value={formDamBreed}
                        onChange={e => {
                          setFormDamBreed(e.target.value);
                          handleAutoCalcBlood(formSireBreed, e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded text-xs text-[#5C5346]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">
                      สัดส่วนเลือดที่คำนวณ (% เลือด หรือกรอกเองได้)
                    </label>
                    <input
                      type="text"
                      value={formBloodPct}
                      onChange={e => setFormBloodPct(e.target.value)}
                      placeholder="เช่น เมอริโน 100% หรือ เมอริโน 50% + ดอร์เซท 50%"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#1E3F2B] font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Part 3: Health (Strictly FMD/แท้งติดต่อ & Ivermectin/Albendazole) */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#2E6B47] block">
                  หมวดที่ 3: สุขภาพแกะและการป้องกันโรค (มาตรฐานฟาร์ม)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] text-xs">
                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">วัคซีนล่าสุด *</label>
                    <select
                      value={formVaccineName}
                      onChange={e => setFormVaccineName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFDF9] border border-[#DFCBB3] rounded text-[#24201B] font-medium"
                    >
                      {VACCINE_OPTIONS.map(v => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="block text-[#7D7061] text-[10px] mt-1.5 mb-0.5">ฉีดล่าสุดเมื่อ</label>
                    <input
                      type="date"
                      value={formVaccineLastDate}
                      onChange={e => setFormVaccineLastDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFDF9] border border-[#DFCBB3] rounded font-mono text-[#5C5346]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ยาถ่ายพยาธิล่าสุด *</label>
                    <select
                      value={formDewormName}
                      onChange={e => setFormDewormName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFDF9] border border-[#DFCBB3] rounded text-[#24201B] font-medium"
                    >
                      {DEWORM_OPTIONS.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <label className="block text-[#7D7061] text-[10px] mt-1.5 mb-0.5">ถ่ายล่าสุดเมื่อ</label>
                    <input
                      type="date"
                      value={formDewormLastDate}
                      onChange={e => setFormDewormLastDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFDF9] border border-[#DFCBB3] rounded font-mono text-[#5C5346]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ตัดแต่งกีบ</label>
                    <label className="block text-[#7D7061] text-[10px] mb-0.5">ตัดแต่งล่าสุดเมื่อ</label>
                    <input
                      type="date"
                      value={formHoofTrimLastDate}
                      onChange={e => setFormHoofTrimLastDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFDF9] border border-[#DFCBB3] rounded font-mono text-[#5C5346]"
                    />
                  </div>
                </div>
              </div>

              {/* Part 4: Wool */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#9C6B3F] block">
                  หมวดที่ 4: ข้อมูลผลิตภัณฑ์ขนแกะ
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] text-xs">
                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">เกรดขน</label>
                    <input
                      type="text"
                      value={formWoolGrade}
                      onChange={e => setFormWoolGrade(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFDF9] border border-[#DFCBB3] rounded text-[#24201B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ขนาดไมครอน (µm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formWoolMicron}
                      onChange={e => setFormWoolMicron(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFDF9] border border-[#DFCBB3] rounded text-[#1E3F2B] font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ความยาวขน (ซม.)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formWoolStapleLengthCm}
                      onChange={e => setFormWoolStapleLengthCm(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFDF9] border border-[#DFCBB3] rounded text-[#24201B] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ขนตัด/ปี (กก.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formFleeceYieldKg}
                      onChange={e => setFormFleeceYieldKg(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#FFFDF9] border border-[#DFCBB3] rounded text-[#24201B] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Part 5: Weight & ADG */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#1E3F2B] block">
                  หมวดที่ 5: น้ำหนักตัว ADG และหมายเหตุ
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] text-xs">
                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">น้ำหนักปัจจุบัน (กก.) *</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formWeightKg}
                      onChange={e => setFormWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#24201B] font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-semibold mb-1">ADG อัตราเติบโต (กรัม/วัน) *</label>
                    <input
                      type="number"
                      step="10"
                      required
                      value={formCurrentAdg}
                      onChange={e => setFormCurrentAdg(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#1E3F2B] font-mono font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#5C5346] font-semibold mb-1">หมายเหตุเพิ่มเติม</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="บันทึกลักษณะเด่น สุขภาพ หรือการผสมพันธุ์เพิ่มเติม..."
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-lg text-[#24201B]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5DEC9] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSheep(null);
                  }}
                  className="px-4 py-2 text-xs text-[#6E6254] hover:text-[#1E3F2B] rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  {editingSheep ? 'บันทึกการแก้ไข' : 'บันทึกลงทะเบียนแกะขน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Pen Modal */}
      {isAddPenModalOpen && (
        <div className="fixed inset-0 bg-[#24201B]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-lg w-full border border-[#DFCBB3] shadow-2xl overflow-hidden text-[#24201B]">
            <div className="bg-[#FAF6EE] px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#9C6B3F]" />
                <span>เพิ่มคอกเลี้ยงแกะใหม่</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPenModalOpen(false)}
                className="text-[#6E6254] hover:text-[#1E3F2B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
                aria-label="ปิดหน้าต่างเพิ่มคอก"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPen} className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                    ชื่อสั้น / รหัสคอก *
                  </label>
                  <input
                    type="text"
                    required
                    value={penCodeInput}
                    onChange={e => setPenCodeInput(e.target.value)}
                    placeholder="เช่น คอก E, คอกอนุบาล 1"
                    className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-semibold focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                    ช่วงอายุแกะในคอก
                  </label>
                  <input
                    type="text"
                    value={penAgeRangeInput}
                    onChange={e => setPenAgeRangeInput(e.target.value)}
                    placeholder="เช่น 3 - 6 เดือน"
                    className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                  ชื่อเต็ม / คำอธิบายคอก *
                </label>
                <input
                  type="text"
                  required
                  value={penNameInput}
                  onChange={e => setPenNameInput(e.target.value)}
                  placeholder="เช่น คอก E - ลูกแกะหย่านมและขุนรุ่นเล็ก"
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                    น้ำหนักเฉลี่ยตั้งต้น (กก.)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="150"
                    step="0.5"
                    value={penAvgWeightInput}
                    onChange={e => setPenAvgWeightInput(parseFloat(e.target.value) || 40)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl font-mono font-semibold text-[#1E3F2B] focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                    วัตถุประสงค์ของคอกนี้
                  </label>
                  <input
                    type="text"
                    value={penPurposeInput}
                    onChange={e => setPenPurposeInput(e.target.value)}
                    placeholder="เช่น แยกดูแลลูกแกะหย่านม หรือขุนแม่พันธุ์เตรียมผสม"
                    className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5DEC9] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddPenModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#6E6254] hover:text-[#1E3F2B] rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  บันทึกสร้างคอกใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
