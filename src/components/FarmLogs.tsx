/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Dna
} from 'lucide-react';
import { FarmLog, FarmActivityType, FormulatedRation, Pen, Sheep } from '../types/sheep';
import { INITIAL_PENS } from '../data/initialData';

interface FarmLogsProps {
  logs: FarmLog[];
  sheepList: Sheep[];
  pens?: Pen[];
  rations?: FormulatedRation[];
  onAddLog: (log: Omit<FarmLog, 'id'>, updateSheepWeight?: { sheepId: string; newWeight: number }) => void;
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('08:00 น.');
  const [formType, setFormType] = useState<FarmActivityType>('weight');
  const [formSheepId, setFormSheepId] = useState(sheepList[0]?.id || '');
  const [formPenId, setFormPenId] = useState('pen-a');
  const [formRecordedBy, setFormRecordedBy] = useState('ผู้จัดการฟาร์ม');
  const [formNotes, setFormNotes] = useState('');

  const [formWeightKg, setFormWeightKg] = useState<number>(65.0);
  const [formFeedRationName, setFormFeedRationName] = useState('สูตรบำรุงเส้นใยขนและเคราติน (Wool Keratin Maintenance)');
  const [formFeedAmountKg, setFormFeedAmountKg] = useState<number>(25.0);

  const [formVaccineOrMed, setFormVaccineOrMed] = useState('วัคซีนป้องกันปากเท้าเปื่อย (FMD) + ไอเวอร์เมกติน 1%');
  const [formDose, setFormDose] = useState('2 มล. ใต้ผิวหนัง');
  const [formAdministrator, setFormAdministrator] = useState('น.สพ. กิตติ');

  const [formEstrusDate, setFormEstrusDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMatingDate, setFormMatingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSireBreedAndTag, setFormSireBreedAndTag] = useState('SH-001 ทองเมฆ (เมอริโน 100% สายขนละเอียดพิเศษ)');

  const [formDamEarTag, setFormDamEarTag] = useState(sheepList.find(s => s.gender === 'female')?.earTag || 'SH-003');
  const [formLambCount, setFormLambCount] = useState<number>(2);
  const [formLambGenders, setFormLambGenders] = useState('เพศผู้ 1 ตัว, เพศเมีย 1 ตัว');
  const [formLambSurvival, setFormLambSurvival] = useState('100% (รอดทั้งหมด)');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch =
        (log.sheepEarTag && log.sheepEarTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.title && log.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.penName && log.penName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'all' || log.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, searchTerm, typeFilter]);

  const handleOpenAdd = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('08:00 น.');
    setFormType('weight');
    setFormSheepId(sheepList[0]?.id || '');
    setFormPenId(pens[0]?.id || 'pen-a');
    setFormWeightKg(65.0);
    if (rations && rations.length > 0) {
      const defaultPen = pens[0];
      const defaultRation = rations[0];
      setFormFeedRationName(defaultRation.name);
      if (defaultPen && defaultPen.sheepCount > 0) {
        setFormFeedAmountKg(Number((defaultRation.totalAsFedKg * defaultPen.sheepCount).toFixed(1)));
      }
    }
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sheep = sheepList.find(s => s.id === formSheepId);
    const pen = pens.find(p => p.id === formPenId);

    let title = 'บันทึกกิจกรรมฟาร์ม';
    let updateWeightObj: { sheepId: string; newWeight: number } | undefined;

    if (formType === 'weight') {
      title = `ชั่งน้ำหนัก ${sheep ? sheep.earTag : ''} (${formWeightKg} กก.)`;
      if (sheep && formWeightKg > 0) {
        updateWeightObj = { sheepId: sheep.id, newWeight: formWeightKg };
      }
    } else if (formType === 'feeding') {
      title = `ให้อาหาร ${pen ? pen.code : ''}: ${formFeedRationName}`;
    } else if (formType === 'health_vaccine') {
      title = `ฉีดวัคซีน/ถ่ายพยาธิ ${sheep ? sheep.earTag : ''}: ${formVaccineOrMed}`;
    } else if (formType === 'breeding') {
      title = `ผสมพันธุ์แม่แกะ ${sheep ? sheep.earTag : ''} กับ ${formSireBreedAndTag}`;
    } else if (formType === 'lambing') {
      title = `บันทึกการคลอดแม่แกะ ${formDamEarTag} (ได้ลูก ${formLambCount} ตัว)`;
    }

    onAddLog(
      {
        date: formDate,
        time: formTime,
        type: formType,
        sheepId: sheep?.id,
        sheepEarTag: sheep?.earTag,
        penId: pen?.id,
        penName: pen?.code,
        title,
        recordedBy: formRecordedBy,
        weightKg: formType === 'weight' ? formWeightKg : undefined,
        feedRationName: formType === 'feeding' ? formFeedRationName : undefined,
        feedAmountKg: formType === 'feeding' ? formFeedAmountKg : undefined,
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
      updateWeightObj
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
              Ovispro Activity Record · บันทึกกิจกรรมฟาร์ม 5 หมวดหลัก
            </p>
            <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3F2B] tracking-tight">
                บันทึกกิจกรรมฟาร์ม 5 หมวดหลัก (Daily Farm Activities)
              </h2>
              <span className="text-xs font-mono font-semibold text-[#9C6B3F]">
                {filteredLogs.length} รายการ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6E6254] mt-1.5">
              บันทึก 5 กิจกรรมตามหลักการจัดการแกะขน: ชั่งน้ำหนัก, ให้อาหาร, ฉีดวัคซีน+ถ่ายพยาธิ, การผสมพันธุ์, และการคลอด
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
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-[#8C7F6E] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหา เบอร์หูแกะ, รายการกิจกรรม, คอก, ผู้บันทึก..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] placeholder:text-[#8C7F6E] focus:outline-none focus:border-[#1E3F2B]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium focus:outline-none focus:border-[#1E3F2B] cursor-pointer"
            >
              <option value="all">ทุกกิจกรรม (ทั้งหมด 5 หมวด)</option>
              <option value="weight">1. ชั่งน้ำหนัก (Weight tracking)</option>
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
                        น้ำหนักชั่งได้: <strong className="font-mono text-[#1E3F2B]">{log.weightKg} กก.</strong>
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
                  <option value="weight">1. ชั่งน้ำหนัก (Weight)</option>
                  <option value="feeding">2. การให้อาหาร (Feeding)</option>
                  <option value="health_vaccine">3. การฉีดวัคซีน + ถ่ายพยาธิ (Health & Vaccine)</option>
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

              {formType === 'weight' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ตัวที่เก็บข้อมูล *</label>
                    <select
                      value={formSheepId}
                      onChange={e => setFormSheepId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {sheepList.map(s => (
                        <option key={s.id} value={s.id}>{s.earTag} - {s.name} ({s.pen})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">น้ำหนักที่ชั่งได้ (กก.) *</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formWeightKg}
                      onChange={e => setFormWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono font-semibold text-sm"
                    />
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
                        const nextPen = pens.find(p => p.id === nextPenId);
                        const matchedRation = rations?.find(r => r.name === formFeedRationName);
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
                          {p.name} ({p.sheepCount} ตัว)
                        </option>
                      ))}
                    </select>
                  </div>

                  {rations && rations.length > 0 && (
                    <div>
                      <label className="block text-[#5C5346] font-medium mb-1">
                        เลือกจากสูตรอาหารในฟาร์ม (ซิงค์จากหน้า 3)
                      </label>
                      <select
                        value={rations.some(r => r.name === formFeedRationName) ? formFeedRationName : '__custom__'}
                        onChange={e => {
                          if (e.target.value === '__custom__') return;
                          const picked = rations.find(r => r.name === e.target.value);
                          if (picked) {
                            setFormFeedRationName(picked.name);
                            const currentPen = pens.find(p => p.id === formPenId);
                            const headCount = currentPen ? Math.max(1, currentPen.sheepCount) : 1;
                            setFormFeedAmountKg(Number((picked.totalAsFedKg * headCount).toFixed(1)));
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-medium"
                      >
                        {rations.map(r => (
                          <option key={r.id} value={r.name}>
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
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {sheepList.map(s => (
                        <option key={s.id} value={s.id}>{s.earTag} - {s.name} ({s.breed})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ชนิดวัคซีนหรือยา *</label>
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
                      className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#DFCBB3] rounded-xl text-[#24201B] font-medium"
                    >
                      {sheepList.filter(s => s.gender === 'female').map(s => (
                        <option key={s.id} value={s.id}>{s.earTag} - {s.name} ({s.breed})</option>
                      ))}
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
                </div>
              )}

              {formType === 'lambing' && (
                <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
                  <div>
                    <label className="block text-[#5C5346] font-medium mb-1">ตัวแม่ที่คลอด *</label>
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
