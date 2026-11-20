/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Scale,
  Utensils,
  HeartPulse,
  Baby,
  Trash2,
  Calendar,
  X,
  Dna,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import {
  FarmLog,
  FarmActivityType,
  FormulatedRation,
  Pen,
  Sheep,
  WoolSoundness,
  WoolCrimpStyle,
  WoolHandle,
} from '../types/sheep';
import { INITIAL_PENS } from '../data/initialData';
import { filterSheepForActivity, resolvePenForActivity } from '../utils/activityHelpers';

interface FarmLogsProps {
  logs: FarmLog[];
  sheepList: Sheep[];
  pens?: Pen[];
  rations?: FormulatedRation[];
  onAddLog: (
    log: Omit<FarmLog, 'id'>,
    syncMeta?: {
      sheepId?: string;
      newWeight?: number;
      assignedRationId?: string;
      markPregnantOnBreeding?: boolean;
    }
  ) => void;
  onDeleteLog: (id: string) => void;
}

export const FarmLogs: React.FC<FarmLogsProps> = ({
  logs,
  sheepList,
  pens: propPens,
  rations,
  onAddLog,
  onDeleteLog,
}) => {
  const pens = propPens && propPens.length > 0 ? propPens : INITIAL_PENS;
  const [searchTerm, setSearchTerm] = useState('');
  const [penFilter, setPenFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('08:00 น.');
  const [formType, setFormType] = useState<FarmActivityType>('weight');
  const [formPenFilter, setFormPenFilter] = useState<string>('all');
  const [formSheepSearch, setFormSheepSearch] = useState<string>('');
  const [formSheepId, setFormSheepId] = useState(sheepList[0]?.id || '');
  const [formPenId, setFormPenId] = useState(pens[0]?.id || 'pen-a');
  const [formRecordedBy, setFormRecordedBy] = useState('ผู้จัดการฟาร์ม');
  const [formNotes, setFormNotes] = useState('');

  const [formWeightKg, setFormWeightKg] = useState<number>(65.0);
  const [formWoolWeightKg, setFormWoolWeightKg] = useState<string>('');
  const [formWoolBodyKg, setFormWoolBodyKg] = useState<string>('');
  const [formWoolSkirtingsKg, setFormWoolSkirtingsKg] = useState<string>('');
  const [formWoolStapleCm, setFormWoolStapleCm] = useState<string>('');
  const [formWoolMicron, setFormWoolMicron] = useState<string>('');
  const [formWoolSoundness, setFormWoolSoundness] = useState<WoolSoundness | ''>('');
  const [formWoolCrimpStyle, setFormWoolCrimpStyle] = useState<WoolCrimpStyle | ''>('');
  const [formWoolHandle, setFormWoolHandle] = useState<WoolHandle | ''>('');

  const [formSelectedRationId, setFormSelectedRationId] = useState<string>('');
  const [formFeedRationName, setFormFeedRationName] = useState('สูตรบำรุงเส้นใยขนและเคราติน (Wool Keratin Maintenance)');
  const [formFeedAmountKg, setFormFeedAmountKg] = useState<number>(25.0);

  const [formHealthSubType, setFormHealthSubType] = useState<'vaccine' | 'deworm' | 'both' | 'hoof'>('both');
  const [formHealthStatusAfter, setFormHealthStatusAfter] = useState<'' | 'healthy' | 'monitoring' | 'sick'>('');
  const [formVaccineOrMed, setFormVaccineOrMed] = useState('วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD) + Ivermectin 1%');
  const [formDose, setFormDose] = useState('2 มล. ใต้ผิวหนัง');
  const [formAdministrator, setFormAdministrator] = useState('น.สพ. กิตติ');

  const [formEstrusDate, setFormEstrusDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMatingDate, setFormMatingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSireBreedAndTag, setFormSireBreedAndTag] = useState('SH-001 ทองเมฆ (เมอริโน 100% สายขนละเอียดพิเศษ)');
  const [formMarkPregnantOnBreeding, setFormMarkPregnantOnBreeding] = useState<boolean>(true);

  const [formDamEarTag, setFormDamEarTag] = useState(sheepList.find(s => s.gender === 'female')?.earTag || 'SH-003');
  const [formLambCount, setFormLambCount] = useState<number>(2);
  const [formLambGenders, setFormLambGenders] = useState('เพศผู้ 1 ตัว, เพศเมีย 1 ตัว');
  const [formLambSurvival, setFormLambSurvival] = useState('100% (รอดทั้งหมด)');

  const sheepCountByPen = useMemo(() => {
    const map = new Map<string, number>();
    pens.forEach(p => {
      const count = sheepList.filter(s => s.penId === p.id || s.pen === p.code).length;
      map.set(p.id, count);
    });
    return map;
  }, [pens, sheepList]);

  const selectableSheep = useMemo(() => {
    return filterSheepForActivity(sheepList, {
      penId: formPenFilter,
      searchTerm: formSheepSearch,
      onlyFemales: formType === 'breeding' || formType === 'lambing',
      pens,
    });
  }, [sheepList, formPenFilter, formSheepSearch, formType, pens]);

  useEffect(() => {
    if (!isAddModalOpen || formType === 'feeding') return;
    if (selectableSheep.length === 0) {
      if (formType !== 'lambing') {
        setFormSheepId('');
      }
      return;
    }
    const stillValid = selectableSheep.some(s => s.id === formSheepId);
    if (!stillValid) {
      const first = selectableSheep[0];
      setFormSheepId(first.id);
      setFormWeightKg(first.weightKg);
      if (formType === 'lambing') {
        setFormDamEarTag(`${first.earTag} ${first.name}`);
      }
    }
  }, [isAddModalOpen, formType, selectableSheep, formSheepId]);

  const filteredLogs = useMemo(() => {
    const selectedFilterPen = penFilter !== 'all' ? pens.find(p => p.id === penFilter) : undefined;
    return logs.filter(log => {
      const matchSearch =
        (log.sheepEarTag && log.sheepEarTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.title && log.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.penName && log.penName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPen =
        penFilter === 'all' ||
        log.penId === penFilter ||
        (selectedFilterPen ? log.penName === selectedFilterPen.code : false);

      const matchType = typeFilter === 'all' || log.type === typeFilter;
      return matchSearch && matchPen && matchType;
    });
  }, [logs, searchTerm, penFilter, typeFilter, pens]);

  const selectedSheepObj = useMemo(
    () => sheepList.find(s => s.id === formSheepId),
    [sheepList, formSheepId]
  );

  const handleOpenAdd = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('08:00 น.');
    setFormType('weight');
    setFormPenFilter('all');
    setFormSheepSearch('');
    const firstSheep = sheepList[0];
    setFormSheepId(firstSheep?.id || '');
    setFormPenId(pens[0]?.id || 'pen-a');
    setFormWeightKg(firstSheep?.weightKg || 65.0);
    setFormWoolWeightKg('');
    setFormWoolBodyKg('');
    setFormWoolSkirtingsKg('');
    setFormWoolStapleCm('');
    setFormWoolMicron('');
    setFormWoolSoundness('');
    setFormWoolCrimpStyle('');
    setFormWoolHandle('');
    setFormHealthSubType('both');
    setFormHealthStatusAfter('');
    setFormMarkPregnantOnBreeding(true);

    const firstFemale = sheepList.find(s => s.gender === 'female');
    if (firstFemale) {
      setFormDamEarTag(`${firstFemale.earTag} ${firstFemale.name}`);
    }
    if (rations && rations.length > 0) {
      const defaultPen = pens[0];
      const defaultRation = rations[0];
      setFormSelectedRationId(defaultRation.id);
      setFormFeedRationName(defaultRation.name);
      if (defaultPen && defaultPen.sheepCount > 0) {
        setFormFeedAmountKg(Number((defaultRation.totalAsFedKg * defaultPen.sheepCount).toFixed(1)));
      }
    } else {
      setFormSelectedRationId('');
    }
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sheep = sheepList.find(s => s.id === formSheepId);
    if (
      (formType === 'weight' ||
        formType === 'shearing' ||
        formType === 'health_vaccine' ||
        formType === 'breeding') &&
      !sheep
    ) {
      return;
    }

    const parsedBody = formWoolBodyKg.trim() !== '' ? parseFloat(formWoolBodyKg) : NaN;
    const parsedSkirt = formWoolSkirtingsKg.trim() !== '' ? parseFloat(formWoolSkirtingsKg) : NaN;
    const parsedWoolDirect = formWoolWeightKg.trim() !== '' ? parseFloat(formWoolWeightKg) : NaN;
    const bodyKg = !Number.isNaN(parsedBody) && parsedBody > 0 ? Number(parsedBody.toFixed(2)) : undefined;
    const skirtKg =
      !Number.isNaN(parsedSkirt) && parsedSkirt >= 0 && formWoolSkirtingsKg.trim() !== ''
        ? Number(parsedSkirt.toFixed(2))
        : undefined;
    const totalWoolKg =
      bodyKg != null || skirtKg != null
        ? Number(((bodyKg ?? 0) + (skirtKg ?? 0)).toFixed(2))
        : !Number.isNaN(parsedWoolDirect) && parsedWoolDirect > 0
        ? Number(parsedWoolDirect.toFixed(2))
        : undefined;

    if (formType === 'shearing' && (!totalWoolKg || totalWoolKg <= 0)) {
      return;
    }

    const damSheep =
      formType === 'lambing'
        ? sheep ||
          sheepList.find(
            s =>
              formDamEarTag.toLowerCase().includes(s.earTag.toLowerCase()) ||
              formDamEarTag.toLowerCase().includes(s.name.toLowerCase())
          )
        : undefined;

    const pen =
      formType === 'feeding'
        ? pens.find(p => p.id === formPenId)
        : resolvePenForActivity(pens, formPenFilter, formType === 'lambing' ? damSheep : sheep);

    let title = 'บันทึกกิจกรรมฟาร์ม';
    if (formType === 'weight') {
      title = `ชั่งน้ำหนัก ${sheep ? `${sheep.earTag} ${sheep.name}` : ''} (${formWeightKg} กก.)`;
    } else if (formType === 'shearing') {
      title = `ตัดขน/ชั่งน้ำหนักขน ${sheep ? `${sheep.earTag} ${sheep.name}` : ''} (${totalWoolKg} กก.)`;
    } else if (formType === 'feeding') {
      title = `ให้อาหาร ${pen ? pen.code : ''}: ${formFeedRationName}`;
    } else if (formType === 'health_vaccine') {
      title = `ดูแลสุขภาพ ${sheep ? sheep.earTag : ''}: ${formVaccineOrMed}`;
    } else if (formType === 'breeding') {
      title = `ผสมพันธุ์แม่แกะ ${sheep ? sheep.earTag : ''} กับ ${formSireBreedAndTag}`;
    } else if (formType === 'lambing') {
      title = `บันทึกการคลอดแม่แกะ ${formDamEarTag} (ได้ลูก ${formLambCount} ตัว)`;
    }

    const activeSheep = formType === 'lambing' ? damSheep : formType === 'feeding' ? undefined : sheep;
    const parsedStaple = formWoolStapleCm.trim() !== '' ? parseFloat(formWoolStapleCm) : NaN;
    const parsedMicron = formWoolMicron.trim() !== '' ? parseFloat(formWoolMicron) : NaN;
    const matchedRation =
      formType === 'feeding'
        ? rations?.find(r => r.id === formSelectedRationId || r.name === formFeedRationName)
        : undefined;

    onAddLog(
      {
        date: formDate,
        time: formTime,
        type: formType,
        sheepId: activeSheep?.id,
        sheepEarTag: activeSheep?.earTag,
        penId: pen?.id,
        penName: pen?.code,
        title,
        recordedBy: formRecordedBy,
        weightKg: formType === 'weight' ? formWeightKg : undefined,
        woolWeightKg:
          formType === 'shearing' || formType === 'weight' ? totalWoolKg : undefined,
        woolBodyKg: formType === 'shearing' ? bodyKg : undefined,
        woolSkirtingsKg: formType === 'shearing' ? skirtKg : undefined,
        woolStapleLengthCm:
          formType === 'shearing' && !Number.isNaN(parsedStaple) && parsedStaple > 0
            ? Number(parsedStaple.toFixed(1))
            : undefined,
        woolMicron:
          formType === 'shearing' && !Number.isNaN(parsedMicron) && parsedMicron > 0
            ? Number(parsedMicron.toFixed(1))
            : undefined,
        woolSoundness: formType === 'shearing' && formWoolSoundness ? formWoolSoundness : undefined,
        woolCrimpStyle: formType === 'shearing' && formWoolCrimpStyle ? formWoolCrimpStyle : undefined,
        woolHandle: formType === 'shearing' && formWoolHandle ? formWoolHandle : undefined,
        feedRationId: formType === 'feeding' ? matchedRation?.id : undefined,
        feedRationName: formType === 'feeding' ? formFeedRationName : undefined,
        feedAmountKg: formType === 'feeding' ? formFeedAmountKg : undefined,
        healthSubType: formType === 'health_vaccine' ? formHealthSubType : undefined,
        healthStatusAfter:
          formType === 'health_vaccine' && formHealthStatusAfter ? formHealthStatusAfter : undefined,
        vaccineOrMedicineName: formType === 'health_vaccine' ? formVaccineOrMed : undefined,
        treatmentDose: formType === 'health_vaccine' ? formDose : undefined,
        administratorName: formType === 'health_vaccine' ? formAdministrator : undefined,
        estrusStartDate: formType === 'breeding' ? formEstrusDate : undefined,
        matingDate: formType === 'breeding' ? formMatingDate : undefined,
        sireBreedAndTag: formType === 'breeding' ? formSireBreedAndTag : undefined,
        damEarTag: formType === 'lambing' ? formDamEarTag : undefined,
        lambCount: formType === 'lambing' ? formLambCount : undefined,
        lambGenders: formType === 'lambing' ? formLambGenders : undefined,
        lambSurvivalRate: formType === 'lambing' ? formLambSurvival : undefined,
        notes: formNotes,
      },
      {
        sheepId: activeSheep?.id,
        newWeight: formType === 'weight' && formWeightKg > 0 ? formWeightKg : undefined,
        assignedRationId: formType === 'feeding' ? matchedRation?.id : undefined,
        markPregnantOnBreeding: formType === 'breeding' ? formMarkPregnantOnBreeding : undefined,
      }
    );

    setIsAddModalOpen(false);
  };

  const getActivityBadge = (type: FarmActivityType) => {
    switch (type) {
      case 'weight':
        return { label: '1. ชั่งน้ำหนัก', icon: Scale, color: 'text-[#1E3F2B] bg-[#EDF4EF] border-[#C5DEC9]' };
      case 'feeding':
        return { label: '2. การให้อาหาร', icon: Utensils, color: 'text-[#9C6B3F] bg-[#F9F2E4] border-[#E5D3B3]' };
      case 'health_vaccine':
        return { label: '3. ฉีดวัคซีน + ถ่ายพยาธิ', icon: HeartPulse, color: 'text-[#2E6B47] bg-[#F0F4E8] border-[#CEDBB8]' };
      case 'breeding':
        return { label: '4. การผสมพันธุ์', icon: Dna, color: 'text-[#6E4826] bg-[#F6EFE6] border-[#DFCBB3]' };
      case 'lambing':
        return { label: '5. การคลอด', icon: Baby, color: 'text-[#8A3B2D] bg-[#FCEFED] border-[#E8C5C0]' };
      case 'shearing':
        return { label: '6. ตัดขน / น้ำหนักขน (กก.)', icon: Scissors, color: 'text-[#4A321F] bg-[#EFE6D5] border-[#CBB69B]' };
      default:
        return { label: type, icon: Calendar, color: 'text-[#5C5346] bg-[#FAF6EE] border-[#E5DEC9]' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Filter Controls */}
      <div className="bg-[#FFFDF9] p-6 sm:p-8 rounded-2xl border border-[#E5DEC9] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#9C6B3F] font-medium tracking-wide">
              Ovispro Activity Record · บันทึกกิจกรรมฟาร์ม 6 หมวดหลัก (ซิงค์เข้าทะเบียนแกะอัตโนมัติ)
            </p>
            <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] tracking-tight">
                บันทึกกิจกรรมฟาร์ม 6 หมวดหลัก (Daily Farm Activities)
              </h2>
              <span className="text-xs font-mono font-semibold text-[#9C6B3F]">
                {filteredLogs.length} รายการ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6E6254] mt-1.5">
              บันทึกชั่งน้ำหนัก, ตัดขน/ชั่งน้ำหนักขน (กก.), ให้อาหาร, ฉีดวัคซีน+ถ่ายพยาธิ, ผสมพันธุ์, และการคลอด — อัปเดตข้อมูลแกะในหน้าคอกให้อัตโนมัติ ไม่ต้องกรอกซ้ำ
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มบันทึกกิจกรรมใหม่</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-5 border-t border-[#EAE2D0]">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[#8C7F6E] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหา เบอร์หูแกะ, รายการกิจกรรม, คอก, ผู้บันทึก..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] placeholder:text-[#8C7F6E] focus:outline-none focus:border-[#1E3F2B]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={penFilter}
              onChange={e => setPenFilter(e.target.value)}
              aria-label="กรองตามคอก"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium focus:outline-none focus:border-[#1E3F2B] cursor-pointer"
            >
              <option value="all">ทุกคอก (ทั้งหมด)</option>
              {pens.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              aria-label="กรองตามประเภทกิจกรรม"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium focus:outline-none focus:border-[#1E3F2B] cursor-pointer"
            >
              <option value="all">ทุกกิจกรรม (ทั้งหมด 6 หมวด)</option>
              <option value="weight">1. ชั่งน้ำหนัก (Weight tracking)</option>
              <option value="shearing">6. ตัดขน / ชั่งน้ำหนักขน (กก.)</option>
              <option value="feeding">2. การให้อาหาร (Feeding)</option>
              <option value="health_vaccine">3. ฉีดวัคซีน + ถ่ายพยาธิ</option>
              <option value="breeding">4. การผสมพันธุ์ (Breeding)</option>
              <option value="lambing">5. การคลอด (Lambing)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Timeline List */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5DEC9] overflow-hidden divide-y divide-[#EAE2D0]">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6E6254]">
            ไม่พบบันทึกกิจกรรมที่ตรงกับคำค้นหา หรือยังไม่มีบันทึกในหมวดหมู่นี้
          </div>
        ) : (
          filteredLogs.map(log => {
            const badge = getActivityBadge(log.type);
            const Icon = badge.icon;

            return (
              <div key={log.id} className="p-5 hover:bg-[#FAF6EE]/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`font-medium px-2.5 py-0.5 rounded-lg border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {log.sheepEarTag && (
                        <>
                          <span className="font-mono font-semibold text-[#1E3F2B]">
                            {log.sheepEarTag}
                          </span>
                        </>
                      )}
                      {log.penName && (
                        <>
                          <span className="text-[#8C7F6E]" aria-hidden="true">·</span>
                          <span className="text-[#6E6254]">{log.penName}</span>
                        </>
                      )}
                    </div>

                    <h4 className="font-semibold text-[#24201B] text-sm sm:text-base">
                      {log.title}
                    </h4>

                    {log.type === 'weight' && log.weightKg && (
                      <p className="text-[#5C5346] text-xs sm:text-sm">
                        น้ำหนักตัวชั่งได้: <strong className="font-mono text-[#1E3F2B]">{log.weightKg} กก.</strong>
                        {log.woolWeightKg != null && log.woolWeightKg > 0 && (
                          <>
                            {' '}· น้ำหนักขน: <strong className="font-mono text-[#9C6B3F]">{log.woolWeightKg} กก.</strong>
                          </>
                        )}
                      </p>
                    )}

                    {log.type === 'shearing' && (
                      <p className="text-[#5C5346] text-xs sm:text-sm">
                        น้ำหนักขนที่ตัดได้:{' '}
                        <strong className="font-mono text-[#4A321F]">{log.woolWeightKg ?? '-'} กก.</strong>
                        {log.woolBodyKg != null && (
                          <span> (ลำตัว {log.woolBodyKg} กก. · ชายท้อง/ขา {log.woolSkirtingsKg ?? 0} กก.)</span>
                        )}
                        {log.woolStapleLengthCm != null && (
                          <span> · ช่อขน {log.woolStapleLengthCm} ซม.</span>
                        )}
                        {log.woolMicron != null && <span> · {log.woolMicron} µm</span>}
                      </p>
                    )}

                    {log.type === 'feeding' && (
                      <p className="text-[#5C5346] text-xs sm:text-sm">
                        สูตรอาหาร: <strong className="text-[#24201B]">{log.feedRationName}</strong> · ปริมาณ: <strong className="font-mono text-[#9C6B3F]">{log.feedAmountKg} กก.</strong>
                      </p>
                    )}

                    {log.type === 'health_vaccine' && (
                      <p className="text-[#5C5346] text-xs sm:text-sm">
                        ชนิดยา/วัคซีน: <strong className="text-[#2E6B47]">{log.vaccineOrMedicineName}</strong> {log.administratorName && `· ผู้ฉีด: ${log.administratorName}`}
                      </p>
                    )}

                    {log.type === 'breeding' && (
                      <p className="text-[#5C5346] text-xs sm:text-sm">
                        ติดสัด: {log.estrusStartDate} · วันที่ผสม: {log.matingDate} · พ่อพันธุ์: <strong className="text-[#6E4826]">{log.sireBreedAndTag}</strong>
                      </p>
                    )}

                    {log.type === 'lambing' && (
                      <p className="text-[#5C5346] text-xs sm:text-sm">
                        แม่แกะ: <strong className="text-[#24201B]">{log.damEarTag}</strong> · ลูกแกะ: <strong className="text-[#8A3B2D]">{log.lambCount} ตัว</strong> ({log.lambGenders}) · อัตราการรอด: {log.lambSurvivalRate}
                      </p>
                    )}

                    {log.notes && (
                      <p className="text-xs text-[#6E6254]">
                        หมายเหตุ: {log.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#EAE2D0]">
                  <span className="font-mono text-[#5C5346] text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8C7F6E]" />
                    <span>{log.date} {log.time ? `· ${log.time}` : ''}</span>
                  </span>
                  <span className="text-[11px] text-[#8C7F6E]">
                    บันทึกโดย {log.recordedBy}
                  </span>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1.5 text-[#8C7F6E] hover:text-[#A63D2E] hover:bg-[#FCEFED] rounded-lg cursor-pointer transition-colors"
                    title="ลบบันทึก"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add New Activity */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1B1712]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-lg w-full border border-[#DFCBB3] shadow-xl p-6 sm:p-7 space-y-5 text-[#24201B] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#EAE2D0]">
              <div>
                <h3 className="text-lg font-semibold text-[#1E3F2B] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#9C6B3F]" />
                  <span>บันทึกกิจกรรมฟาร์ม</span>
                </h3>
                <p className="text-xs text-[#6E6254] mt-0.5">เลือกประเภทกิจกรรมและกรอกข้อมูล</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5C5346] font-medium mb-1">หมวดหมู่กิจกรรม *</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as FarmActivityType)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-semibold focus:outline-none focus:border-[#1E3F2B]"
                >
                  <option value="weight">1. ชั่งน้ำหนักตัว (Weight)</option>
                  <option value="shearing">6. ตัดขนและชั่งน้ำหนักขน (กิโลกรัม)</option>
                  <option value="feeding">2. การให้อาหาร (Feeding)</option>
                  <option value="health_vaccine">3. การฉีดวัคซีน + ถ่ายพยาธิ + ตัดกีบ</option>
                  <option value="breeding">4. การผสมพันธุ์ (Breeding)</option>
                  <option value="lambing">5. การคลอด (Lambing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5C5346] font-medium mb-1">วันที่เก็บข้อมูล *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] font-mono focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>
                <div>
                  <label className="block text-[#5C5346] font-medium mb-1">เวลาที่เก็บข้อมูล</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    placeholder="เช่น 08:30 น."
                    className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>
              </div>

              {formType !== 'feeding' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#DFCBB3] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#1E3F2B]">
                      ขั้นตอนที่ 1: ระบุคอกและค้นหาแกะ {formType === 'breeding' || formType === 'lambing' ? '(แม่พันธุ์เพศเมีย)' : ''}
                    </span>
                    <span className={`text-[11px] font-mono font-semibold ${selectableSheep.length > 0 ? 'text-[#2E6B47]' : 'text-[#A63D2E]'}`}>
                      พบ {selectableSheep.length} ตัว
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">ระบุคอก *</label>
                      <select
                        value={formPenFilter}
                        onChange={e => {
                          const nextPen = e.target.value;
                          setFormPenFilter(nextPen);
                          if (nextPen !== 'all') setFormPenId(nextPen);
                        }}
                        aria-label="ระบุคอกที่ต้องการบันทึก"
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium focus:outline-none focus:border-[#1E3F2B]"
                      >
                        <option value="all">ทุกคอก ({sheepList.length} ตัว)</option>
                        {pens.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} · {p.name} ({sheepCountByPen.get(p.id) ?? p.sheepCount} ตัว)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">ค้นหาชื่อ / เบอร์หูแกะ</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#8C7F6E] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={formSheepSearch}
                          onChange={e => setFormSheepSearch(e.target.value)}
                          placeholder="พิมพ์ชื่อ หรือเบอร์หู..."
                          className="w-full pl-8 pr-7 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] placeholder:text-[#8C7F6E] focus:outline-none focus:border-[#1E3F2B]"
                        />
                        {formSheepSearch && (
                          <button
                            type="button"
                            onClick={() => setFormSheepSearch('')}
                            className="absolute right-2 top-2 text-[#8C7F6E] hover:text-[#24201B] cursor-pointer"
                            title="ล้างคำค้นหา"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formType === 'weight' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ตัวที่เก็บข้อมูล *</label>
                    <select
                      value={formSheepId}
                      onChange={e => {
                        const nextId = e.target.value;
                        setFormSheepId(nextId);
                        const picked = sheepList.find(s => s.id === nextId);
                        if (picked) setFormWeightKg(picked.weightKg);
                      }}
                      required
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {selectableSheep.length === 0 ? (
                        <option value="">-- ไม่พบแกะในคอก/คำค้นหานี้ --</option>
                      ) : (
                        selectableSheep.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.earTag} - {s.name} ({s.pen} · เดิม {s.weightKg} กก.)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {selectedSheepObj && (
                    <div className="text-[11px] bg-[#EDF4EF] border border-[#C5DEC9] text-[#1E3F2B] px-3 py-2 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B47] shrink-0" />
                      <span>
                        ซิงค์อัตโนมัติ: น้ำหนักเดิม <strong>{selectedSheepObj.weightKg} กก.</strong> → เมื่อบันทึกจะอัปเดตน้ำหนักและคำนวณ ADG ในทะเบียนทันที
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">น้ำหนักตัวที่ชั่งได้ (กก.) *</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={formWeightKg}
                        onChange={e => setFormWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">
                        น้ำหนักขนที่ชั่งควบคู่ (กก. · ไม่บังคับ)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="เว้นว่างได้"
                        value={formWoolWeightKg}
                        onChange={e => setFormWoolWeightKg(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#9C6B3F] font-mono font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formType === 'shearing' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#DFCBB3] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ตัวที่ตัดขน / ชั่งน้ำหนักขน *</label>
                    <select
                      value={formSheepId}
                      onChange={e => setFormSheepId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {selectableSheep.length === 0 ? (
                        <option value="">-- ไม่พบแกะในคอก/คำค้นหานี้ --</option>
                      ) : (
                        selectableSheep.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.earTag} - {s.name} ({s.pen}
                            {s.fleeceYieldKg ? ` · ขนเดิม ${s.fleeceYieldKg} กก.` : ''})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="text-[11px] bg-[#EDF4EF] border border-[#C5DEC9] text-[#1E3F2B] px-3 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B47] shrink-0" />
                    <span>
                      ซิงค์อัตโนมัติ: ค่าน้ำหนักขน คุณภาพขน และวันที่ตัดขนล่าสุดจะไปอัปเดตในการ์ดแกะและค่าเฉลี่ยคอกทันที
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[#5C5346] font-semibold mb-1">น้ำหนักขนรวม (กก.) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        placeholder="เช่น 5.4"
                        value={formWoolWeightKg}
                        onChange={e => setFormWoolWeightKg(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#4A321F] font-mono font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ขนลำตัว (กก. · ถ้าแยก)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="ไม่บังคับ"
                        value={formWoolBodyKg}
                        onChange={e => {
                          const val = e.target.value;
                          setFormWoolBodyKg(val);
                          const b = parseFloat(val) || 0;
                          const s = parseFloat(formWoolSkirtingsKg) || 0;
                          if (b + s > 0) setFormWoolWeightKg(String(Number((b + s).toFixed(2))));
                        }}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ชายท้อง/ขา (กก.)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="ไม่บังคับ"
                        value={formWoolSkirtingsKg}
                        onChange={e => {
                          const val = e.target.value;
                          setFormWoolSkirtingsKg(val);
                          const b = parseFloat(formWoolBodyKg) || 0;
                          const s = parseFloat(val) || 0;
                          if (b + s > 0) setFormWoolWeightKg(String(Number((b + s).toFixed(2))));
                        }}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ความยาวช่อขน (ซม. · ไม่บังคับ)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="เช่น 9.5"
                        value={formWoolStapleCm}
                        onChange={e => setFormWoolStapleCm(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ไมครอน µm (ถ้าวัดได้)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="เช่น 18.5"
                        value={formWoolMicron}
                        onChange={e => setFormWoolMicron(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ความแข็งแรงขน</label>
                      <select
                        value={formWoolSoundness}
                        onChange={e => setFormWoolSoundness(e.target.value as WoolSoundness | '')}
                        className="w-full px-2.5 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                      >
                        <option value="">ไม่ระบุ</option>
                        <option value="strong">เหนียวดี ไม่ขาด</option>
                        <option value="weak_base">ขาดช่วงโคน</option>
                        <option value="weak_mid">ขาดช่วงกลาง</option>
                        <option value="weak_tip">ขาดช่วงปลาย</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ความถี่ลอนขน</label>
                      <select
                        value={formWoolCrimpStyle}
                        onChange={e => setFormWoolCrimpStyle(e.target.value as WoolCrimpStyle | '')}
                        className="w-full px-2.5 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                      >
                        <option value="">ไม่ระบุ</option>
                        <option value="dense">ลอนถี่สม่ำเสมอ</option>
                        <option value="medium">ลอนปานกลาง</option>
                        <option value="loose">ลอนห่าง/ไม่ชัด</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#6E6254] font-medium mb-1">ความนุ่มไขขน</label>
                      <select
                        value={formWoolHandle}
                        onChange={e => setFormWoolHandle(e.target.value as WoolHandle | '')}
                        className="w-full px-2.5 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                      >
                        <option value="">ไม่ระบุ</option>
                        <option value="soft_greasy">นุ่มลื่น ไขขนดี</option>
                        <option value="normal">ปกติ</option>
                        <option value="dry_harsh">แห้งสาก/ไขน้อย</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formType === 'feeding' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">คอกที่เก็บข้อมูล *</label>
                    <select
                      value={formPenId}
                      onChange={e => {
                        const nextPenId = e.target.value;
                        setFormPenId(nextPenId);
                        setFormPenFilter(nextPenId);
                        const nextPen = pens.find(p => p.id === nextPenId);
                        const matchedRation = rations?.find(
                          r => r.id === formSelectedRationId || r.name === formFeedRationName
                        );
                        if (nextPen && matchedRation && nextPen.sheepCount > 0) {
                          setFormFeedAmountKg(
                            Number((matchedRation.totalAsFedKg * nextPen.sheepCount).toFixed(1))
                          );
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {pens.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.code} · {p.name} ({sheepCountByPen.get(p.id) ?? p.sheepCount} ตัว)
                        </option>
                      ))}
                    </select>
                  </div>

                  {rations && rations.length > 0 && (
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">
                        เลือกจากสูตรอาหารในฟาร์ม (ซิงค์เข้าทะเบียนแกะในคอกทันที)
                      </label>
                      <select
                        value={formSelectedRationId || '__custom__'}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setFormSelectedRationId('');
                            return;
                          }
                          const picked = rations.find(r => r.id === e.target.value);
                          if (picked) {
                            setFormSelectedRationId(picked.id);
                            setFormFeedRationName(picked.name);
                            const currentPen = pens.find(p => p.id === formPenId);
                            const headCount = currentPen ? Math.max(1, currentPen.sheepCount) : 1;
                            setFormFeedAmountKg(Number((picked.totalAsFedKg * headCount).toFixed(1)));
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium"
                      >
                        {rations.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} (CP {r.calculatedCpPercent}% · {r.totalAsFedKg.toFixed(2)} กก./ตัว/วัน)
                          </option>
                        ))}
                        <option value="__custom__">กำหนดชื่อสูตรเองด้านล่าง...</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">สูตรอาหารที่ให้ *</label>
                    <input
                      type="text"
                      required
                      value={formFeedRationName}
                      onChange={e => setFormFeedRationName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ปริมาณที่ให้รวมทั้งคอก (กก.) *</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formFeedAmountKg}
                      onChange={e => setFormFeedAmountKg(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#9C6B3F] font-mono font-semibold"
                    />
                  </div>
                </div>
              )}

              {formType === 'health_vaccine' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ตัวที่เก็บข้อมูล *</label>
                    <select
                      value={formSheepId}
                      onChange={e => setFormSheepId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {selectableSheep.length === 0 ? (
                        <option value="">-- ไม่พบแกะในคอก/คำค้นหานี้ --</option>
                      ) : (
                        selectableSheep.map(s => (
                          <option key={s.id} value={s.id}>{s.earTag} - {s.name} ({s.pen} · {s.breed})</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">ประเภทการดูแลสุขภาพ *</label>
                      <select
                        value={formHealthSubType}
                        onChange={e => {
                          const sub = e.target.value as 'vaccine' | 'deworm' | 'both' | 'hoof';
                          setFormHealthSubType(sub);
                          if (sub === 'vaccine') {
                            setFormVaccineOrMed('วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD)');
                          } else if (sub === 'deworm') {
                            setFormVaccineOrMed('Ivermectin (ไอเวอร์เมกติน 1%)');
                          } else if (sub === 'hoof') {
                            setFormVaccineOrMed('ตัดแต่งกีบและตรวจสุขภาพเท้า');
                          } else {
                            setFormVaccineOrMed('วัคซีนป้องกันโรคปากและเท้าเปื่อย (FMD) + Ivermectin 1%');
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium"
                      >
                        <option value="both">ฉีดวัคซีน + ถ่ายพยาธิ</option>
                        <option value="vaccine">ฉีดวัคซีน</option>
                        <option value="deworm">ถ่ายพยาธิ</option>
                        <option value="hoof">ตัดแต่งกีบ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">อัปเดตสถานะสุขภาพแกะ</label>
                      <select
                        value={formHealthStatusAfter}
                        onChange={e =>
                          setFormHealthStatusAfter(
                            e.target.value as '' | 'healthy' | 'monitoring' | 'sick'
                          )
                        }
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                      >
                        <option value="">คงสถานะเดิมในทะเบียน</option>
                        <option value="healthy">แข็งแรงปกติ (healthy)</option>
                        <option value="monitoring">เฝ้าระวัง (monitoring)</option>
                        <option value="sick">ป่วย/รักษาตัว (sick)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ชนิดวัคซีน/ยา หรือกิจกรรม *</label>
                    <input
                      type="text"
                      required
                      value={formVaccineOrMed}
                      onChange={e => setFormVaccineOrMed(e.target.value)}
                      placeholder="เช่น วัคซีนปากและเท้าเปื่อย (FMD), ยาถ่ายพยาธิไอเวอร์เมกติน"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">ปริมาณโดส</label>
                      <input
                        type="text"
                        value={formDose}
                        onChange={e => setFormDose(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">ผู้ฉีด *</label>
                      <input
                        type="text"
                        value={formAdministrator}
                        onChange={e => setFormAdministrator(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formType === 'breeding' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ตัวแม่ที่เก็บข้อมูล *</label>
                    <select
                      value={formSheepId}
                      onChange={e => setFormSheepId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {selectableSheep.length === 0 ? (
                        <option value="">-- ไม่พบแม่พันธุ์เพศเมียในคอก/คำค้นหานี้ --</option>
                      ) : (
                        selectableSheep.map(s => (
                          <option key={s.id} value={s.id}>{s.earTag} - {s.name} ({s.pen} · {s.breed})</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">เริ่มมีอาการติดสัด</label>
                      <input
                        type="date"
                        value={formEstrusDate}
                        onChange={e => setFormEstrusDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">วันที่ผสม *</label>
                      <input
                        type="date"
                        value={formMatingDate}
                        onChange={e => setFormMatingDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">พันธุ์และรหัสพ่อพันธุ์ที่นำมาผสม *</label>
                    <input
                      type="text"
                      required
                      value={formSireBreedAndTag}
                      onChange={e => setFormSireBreedAndTag(e.target.value)}
                      placeholder="เช่น SH-001 ทองเมฆ (เมอริโน 100%)"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-[#1E3F2B] font-medium cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formMarkPregnantOnBreeding}
                      onChange={e => setFormMarkPregnantOnBreeding(e.target.checked)}
                      className="rounded border-[#DFCBB3] accent-[#1E3F2B]"
                    />
                    <span>อัปเดตสถานะแม่แกะเป็น &quot;อุ้มท้อง (pregnant)&quot; ในทะเบียนแกะทันที</span>
                  </label>
                </div>
              )}

              {formType === 'lambing' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  {selectableSheep.length > 0 && (
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">เลือกตัวแม่ที่คลอดจากคอก</label>
                      <select
                        value={formSheepId}
                        onChange={e => {
                          const id = e.target.value;
                          setFormSheepId(id);
                          const picked = selectableSheep.find(s => s.id === id);
                          if (picked) {
                            setFormDamEarTag(`${picked.earTag} ${picked.name}`);
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                      >
                        {selectableSheep.map(s => (
                          <option key={s.id} value={s.id}>{s.earTag} - {s.name} ({s.pen})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">รหัส / ชื่อตัวแม่ที่คลอด *</label>
                    <input
                      type="text"
                      required
                      value={formDamEarTag}
                      onChange={e => setFormDamEarTag(e.target.value)}
                      placeholder="เช่น SH-003 เพชรลดา"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">จำนวนลูกแกะ (ตัว) *</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        required
                        value={formLambCount}
                        onChange={e => setFormLambCount(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">อัตราการรอด</label>
                      <input
                        type="text"
                        value={formLambSurvival}
                        onChange={e => setFormLambSurvival(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#2E6B47] font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">เพศลูกแกะ</label>
                    <input
                      type="text"
                      value={formLambGenders}
                      onChange={e => setFormLambGenders(e.target.value)}
                      placeholder="เช่น เพศผู้ 1 ตัว, เพศเมีย 1 ตัว"
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#5C5346] font-medium mb-1">ผู้บันทึกข้อมูล *</label>
                <input
                  type="text"
                  required
                  value={formRecordedBy}
                  onChange={e => setFormRecordedBy(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B]"
                />
              </div>

              <div>
                <label className="block text-[#5C5346] font-medium mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="เช่น สภาพร่างกายหลังคลอดปกติ, อาการติดสัดชัดเจน..."
                  className="w-full px-3.5 py-2 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] placeholder:text-[#8C7F6E]"
                />
              </div>

              <div className="pt-3 border-t border-[#EAE2D0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#6E6254] hover:text-[#24201B] hover:bg-[#F3ECE0] rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] font-semibold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
