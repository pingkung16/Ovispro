/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Send,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Table2,
  Lock,
} from 'lucide-react';
import { SHEEP_BREEDS } from '../data/breedsData';
import type { FarmProfile, WebFormSubmission } from '../types/sheep';
import { fetchWebFormRecords, submitWebFormRecord } from '../utils/api';
import {
  APPS_SCRIPT_TEMPLATE,
  DATABASE_NAME,
  DATABASE_SCHEMA_SPEC,
  WEB_FORM_SHEET_COLUMNS,
  WEB_FORM_SHEET_NAME,
  buildTsvForGoogleSheets,
  buildWebFormSheetTab,
  downloadSheetAsCsv,
} from '../utils/sheetExport';

interface WebFormGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFarmProfile: FarmProfile | null;
  records: WebFormSubmission[];
  onRecordsChange: (records: WebFormSubmission[]) => void;
  isOwnerAuthenticated: boolean;
  initialTab?: 'form' | 'schema' | 'security';
  onOpenOwnerSheet?: () => void;
}

type ModalTab = 'form' | 'schema' | 'security';

export const WebFormGuideModal: React.FC<WebFormGuideModalProps> = ({
  isOpen,
  onClose,
  activeFarmProfile,
  records,
  onRecordsChange,
  isOwnerAuthenticated,
  initialTab = 'form',
  onOpenOwnerSheet,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('form');
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [sheetSyncConfigured, setSheetSyncConfigured] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  // Form fields
  const [farmName, setFarmName] = useState('');
  const [recorderName, setRecorderName] = useState('');
  const [province, setProvince] = useState('');
  const [sheepEarTag, setSheepEarTag] = useState('');
  const [sheepName, setSheepName] = useState('');
  const [breed, setBreed] = useState(SHEEP_BREEDS[0]?.nameTh || 'คอร์ริเดล (Corriedale)');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [ageMonths, setAgeMonths] = useState('18');
  const [weightKg, setWeightKg] = useState('56.0');
  const [woolMicron, setWoolMicron] = useState('21.5');
  const [dailyFeedKg, setDailyFeedKg] = useState('2.2');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!isOwnerAuthenticated) {
      setActiveTab('form');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
    if (activeFarmProfile) {
      setFarmName(prev => prev || activeFarmProfile.farmName);
      setRecorderName(prev => prev || activeFarmProfile.ownerName);
      setProvince(prev => prev || activeFarmProfile.location);
    }

    let cancelled = false;
    setIsLoadingRecords(true);
    fetchWebFormRecords()
      .then(res => {
        if (cancelled) return;
        onRecordsChange(res.records);
        setSheetSyncConfigured(res.sheetSyncConfigured);
        setApiKeyConfigured(res.apiKeyConfigured);
      })
      .catch(() => {
        // Keep existing local list if transient failure occurs
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecords(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isOwnerAuthenticated, initialTab, activeFarmProfile, onRecordsChange]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      r =>
        r.farmName.toLowerCase().includes(q) ||
        r.recorderName.toLowerCase().includes(q) ||
        r.province.toLowerCase().includes(q) ||
        r.sheepEarTag.toLowerCase().includes(q) ||
        r.sheepName.toLowerCase().includes(q) ||
        r.breed.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      setSubmitFeedback({
        type: 'error',
        text: 'เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ กรุณาคลุมดำแล้วคัดลอกด้วยตนเอง',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await submitWebFormRecord({
        farmName: farmName.trim(),
        recorderName: recorderName.trim(),
        province: province.trim(),
        sheepEarTag: sheepEarTag.trim(),
        sheepName: sheepName.trim(),
        breed: breed.trim(),
        gender,
        ageMonths: Number(ageMonths),
        weightKg: Number(weightKg),
        woolMicron: Number(woolMicron),
        dailyFeedKg: Number(dailyFeedKg),
        notes: notes.trim(),
      });

      setSheetSyncConfigured(res.sheetSyncConfigured);
      onRecordsChange(
        records.some(r => r.id === res.record.id) ? records : [res.record, ...records]
      );

      if (res.record.syncedToSheet) {
        setSubmitFeedback({
          type: 'success',
          text: `บันทึกข้อมูล "${res.record.sheepName}" (${res.record.sheepEarTag}) เข้าสู่ระบบกลางเรียบร้อยแล้ว (รีเฟรชหน้าเว็บข้อมูลยังคงอยู่ครบถ้วน)`,
        });
      } else if (isOwnerAuthenticated && res.sheetSyncConfigured && res.sheetError) {
        setSubmitFeedback({
          type: 'success',
          text: `บันทึกลงฐานข้อมูลเซิร์ฟเวอร์เรียบร้อย (${res.record.id}) แต่ Google Sheet ตอบกลับ: ${res.sheetError}`,
        });
      } else {
        setSubmitFeedback({
          type: 'success',
          text: `บันทึกข้อมูล "${res.record.sheepName}" (${res.record.sheepEarTag}) ลงระบบเรียบร้อยแล้ว — ข้อมูลถูกจัดเก็บถาวร รีเฟรชหน้าเว็บข้อมูลยังคงอยู่`,
        });
      }

      setSheepEarTag('');
      setSheepName('');
      setNotes('');
    } catch (err) {
      setSubmitFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลที่กรอก',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCsv = () => {
    const tab = buildWebFormSheetTab(filteredRecords);
    downloadSheetAsCsv(tab, 'Ovispro_WebForm');
  };

  const handleCopyTsv = () => {
    const tab = buildWebFormSheetTab(filteredRecords);
    void handleCopy('tsv', buildTsvForGoogleSheets(tab));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#24201B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="web-form-guide-title"
    >
      <div className="bg-[#FFFDF9] border-2 border-[#4A321F]/40 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-[#1E3F2B] text-[#FAF6EE] px-5 sm:px-7 py-4 border-b border-[#13291C] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="web-form-guide-title"
              className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5 text-[#9FD1AE] shrink-0" />
              <span className="truncate">
                {isOwnerAuthenticated
                  ? 'ฟอร์มบันทึกข้อมูลลงฐานข้อมูล & Google Sheet (คู่มือเจ้าของแอป)'
                  : 'แบบฟอร์มบันทึกข้อมูลแกะขนเข้าสู่ระบบกลาง Ovispro'}
              </span>
            </h2>
            <p className="text-xs text-[#D5E0D7] mt-0.5 truncate">
              {isOwnerAuthenticated
                ? `ฐานข้อมูล: ${DATABASE_NAME} · ชีตปลายทาง: ${WEB_FORM_SHEET_NAME} · ${
                    sheetSyncConfigured ? 'ซิงค์ Google Sheet อัตโนมัติแล้ว' : 'Server DB + Export CSV/TSV'
                  }`
                : 'กรอกข้อมูลเพื่อจัดเก็บลงฐานข้อมูลกลางของแพลตฟอร์มโดยอัตโนมัติ (รีเฟรชหน้าเว็บข้อมูลไม่หาย)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#2A5239] hover:bg-[#356648] text-[#FAF6EE] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            aria-label="ปิดหน้าต่างฟอร์มบันทึกข้อมูล"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (Schema & Apps Script Tabs are strictly App-Owner-Only) */}
        {isOwnerAuthenticated && (
          <div className="bg-[#FAF6EE] border-b border-[#DFCBB3] px-5 sm:px-7 flex items-center gap-2 overflow-x-auto py-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'form'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'text-[#5C5346] hover:bg-[#EFE6D5] hover:text-[#1E3F2B]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1. ฟอร์มบันทึกข้อมูลจริง ({records.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'schema'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'text-[#5C5346] hover:bg-[#EFE6D5] hover:text-[#1E3F2B]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>2. ชื่อฐานข้อมูล & คอลัมน์ Google Sheet (14 คอลัมน์)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'security'
                  ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                  : 'text-[#5C5346] hover:bg-[#EFE6D5] hover:text-[#1E3F2B]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. โค้ด Apps Script, API Key & กฎความปลอดภัย</span>
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* ========================================================== */}
          {/* TAB 1: WORKING WEB FORM + LIVE RECORDED TABLE              */}
          {/* ========================================================== */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              {submitFeedback && (
                <div
                  className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-start gap-2.5 ${
                    submitFeedback.type === 'success'
                      ? 'bg-[#EDF4EF] border-[#B6D7BF] text-[#1E3F2B]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  }`}
                >
                  {submitFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#16A34A]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                  )}
                  <span>{submitFeedback.text}</span>
                </div>
              )}

              {/* Data Entry Form */}
              <form
                onSubmit={handleSubmit}
                className="bg-[#FAF6EE]/70 border border-[#DFCBB3] rounded-xl p-4 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5DEC9]">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[#1E3F2B]">
                      แบบฟอร์มสำรวจและบันทึกข้อมูลแกะขนรายตัว
                    </h3>
                    <p className="text-xs text-[#6E6254]">
                      เมื่อกดบันทึก ข้อมูลจะถูกจัดเก็บลงระบบกลางโดยอัตโนมัติ (รีเฟรชหน้าเว็บหรือเปลี่ยนเครื่องข้อมูลยังคงอยู่ครบถ้วน)
                    </p>
                  </div>
                  <span className="text-xs text-[#6E6254] font-mono tabular-nums">
                    บันทึกอัตโนมัติ · 14 ช่องข้อมูล
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      ชื่อฟาร์ม <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={farmName}
                      onChange={e => setFarmName(e.target.value)}
                      placeholder="เช่น ฟาร์มบ้านดอยเมอริโน"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      ผู้บันทึกข้อมูล <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={recorderName}
                      onChange={e => setRecorderName(e.target.value)}
                      placeholder="ชื่อ-นามสกุลผู้บันทึก"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      จังหวัด / พื้นที่ <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={60}
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                      placeholder="เช่น เชียงใหม่, นครปฐม"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      รหัสเบอร์หูแกะ (Ear Tag)
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={sheepEarTag}
                      onChange={e => setSheepEarTag(e.target.value)}
                      placeholder="เว้นว่างเพื่อให้ระบบสร้างอัตโนมัติ"
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      ชื่อแกะ <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={1}
                      maxLength={80}
                      value={sheepName}
                      onChange={e => setSheepName(e.target.value)}
                      placeholder="เช่น ขนปุย"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      สายพันธุ์แกะขน <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      value={breed}
                      onChange={e => setBreed(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    >
                      {SHEEP_BREEDS.map(b => (
                        <option key={b.id} value={b.nameTh}>
                          {b.nameTh}
                        </option>
                      ))}
                      <option value="ลูกผสมสายพันธุ์ขน (Crossbred Wool)">
                        ลูกผสมสายพันธุ์ขน (Crossbred Wool)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">เพศ</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as 'female' | 'male')}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    >
                      <option value="female">เพศเมีย (Ewe)</option>
                      <option value="male">เพศผู้ (Ram)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      อายุ (เดือน) <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={240}
                      step="0.5"
                      value={ageMonths}
                      onChange={e => setAgeMonths(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      น้ำหนัก (กก.) <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={250}
                      step="0.1"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      ความละเอียดขน (µm) <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={60}
                      step="0.1"
                      value={woolMicron}
                      onChange={e => setWoolMicron(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      ปริมาณอาหาร (กก./วัน) <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={15}
                      step="0.1"
                      value={dailyFeedKg}
                      onChange={e => setDailyFeedKg(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A321F] mb-1">
                      หมายเหตุ / สุขภาพ
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="เช่น ฉีดวัคซีน FMD แล้ว"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#6E6254]">
                    เมื่อกดบันทึก ข้อมูลจะเก็บลงเซิร์ฟเวอร์ทันทีและอัปเดตตารางด้านล่างแบบเรียลไทม์ทุกเครื่อง
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#1E3F2B] hover:bg-[#2A563C] disabled:opacity-60 text-[#FAF6EE] text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลลงฐานข้อมูล'}</span>
                  </button>
                </div>
              </form>

              {/* High-Density Recorded Table */}
              <div className="border border-[#DFCBB3] rounded-xl overflow-hidden bg-white">
                <div className="bg-[#FAF6EE] px-4 py-3 border-b border-[#DFCBB3] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-[#1E3F2B]">
                      ข้อมูลที่บันทึกจากฟอร์มล่าสุด ({filteredRecords.length} รายการ)
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#8A7B68] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาฟาร์ม / แกะ / จังหวัด..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D5C3A8] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyTsv}
                      disabled={filteredRecords.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-[#D5C3A8] bg-white hover:bg-[#F3ECE0] disabled:opacity-50 text-xs font-medium text-[#4A321F] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'tsv' ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'tsv' ? 'คัดลอก TSV แล้ว' : 'คัดลอกวาง Google Sheet'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      disabled={filteredRecords.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-[#1E3F2B] bg-[#1E3F2B] hover:bg-[#2A563C] disabled:opacity-50 text-xs font-medium text-[#FAF6EE] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ส่งออก CSV</span>
                    </button>
                  </div>
                </div>

                {isLoadingRecords && records.length === 0 ? (
                  <div className="p-6 space-y-2">
                    <div className="h-9 bg-[#F3ECE0] rounded animate-pulse" />
                    <div className="h-9 bg-[#F3ECE0] rounded animate-pulse" />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-8 text-center space-y-2 text-xs sm:text-sm text-[#6E6254]">
                    <p className="font-medium text-[#4A321F]">
                      ยังไม่มีข้อมูลที่ส่งจากแบบฟอร์มเว็บในขณะนี้
                    </p>
                    <p>กรอกข้อมูลด้านบนแล้วกด &quot;บันทึกข้อมูลลงฐานข้อมูล&quot; เพื่อทดสอบบันทึกรายการแรก</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#F5EFE3] text-[#4A321F] border-b border-[#DFCBB3]">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">เบอร์หู / ชื่อแกะ</th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ฟาร์ม · จังหวัด</th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">สายพันธุ์</th>
                          <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">น้ำหนัก (กก.)</th>
                          <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">ไมครอน (µm)</th>
                          <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">อาหาร/วัน</th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ผู้บันทึก</th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            {isOwnerAuthenticated ? 'สถานะ Sheet' : 'สถานะการบันทึก'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE6D5]">
                        {filteredRecords.map(rec => (
                          <tr key={rec.id} className="hover:bg-[#FAF6EE]/70 transition-colors">
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="font-mono text-[#1E3F2B] font-semibold">
                                {rec.sheepEarTag}
                              </span>{' '}
                              <span className="text-[#24201B]">· {rec.sheepName}</span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[#4A321F]">
                              {rec.farmName}{' '}
                              <span className="text-[#7A6E5D]">· {rec.province}</span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[#5C5346]">
                              {rec.breed} ({rec.gender === 'male' ? 'ผู้' : 'เมีย'})
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#24201B]">
                              {rec.weightKg.toFixed(1)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#24201B]">
                              {rec.woolMicron.toFixed(1)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#24201B]">
                              {rec.dailyFeedKg.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[#5C5346]">
                              {rec.recorderName}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {isOwnerAuthenticated ? (
                                rec.syncedToSheet ? (
                                  <span className="text-[#16A34A] font-medium">ซิงค์เข้า Sheet แล้ว</span>
                                ) : (
                                  <span className="text-[#D97706] font-medium">บันทึกใน Server DB</span>
                                )
                              ) : (
                                <span className="text-[#16A34A] font-medium">บันทึกเข้าระบบแล้ว</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: DATABASE NAME + TABLE SCHEMA + 14 SHEET COLUMNS     */}
          {/* ========================================================== */}
          {isOwnerAuthenticated && activeTab === 'schema' && (
            <div className="space-y-6">
              {/* Database Summary Box */}
              <div className="bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#6E6254]">ชื่อฐานข้อมูลหลัก (Database Name)</p>
                  <p className="text-sm sm:text-base font-mono font-semibold text-[#1E3F2B] mt-0.5">
                    {DATABASE_NAME}
                  </p>
                  <p className="text-xs text-[#5C5346] mt-1">
                    จัดเก็บบน Node.js Server (Atomic JSON Persistence + Auto Backup)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6E6254]">ฐานข้อมูลบนคลาวด์ (Cloud Mirror)</p>
                  <p className="text-sm sm:text-base font-mono font-semibold text-[#4A321F] mt-0.5">
                    Google Sheets (Apps Script)
                  </p>
                  <p className="text-xs text-[#5C5346] mt-1">
                    ซิงค์อัตโนมัติ 2 ทางผ่าน <span className="font-mono">_OvisproCloudState</span> และชีต{' '}
                    <span className="font-semibold">{WEB_FORM_SHEET_NAME}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6E6254]">จำนวนตารางทั้งหมด</p>
                  <p className="text-sm sm:text-base font-mono tabular-nums font-semibold text-[#1E3F2B] mt-0.5">
                    8 ตาราง (Tables) · 14 คอลัมน์ฟอร์มเว็บ
                  </p>
                  <p className="text-xs text-[#5C5346] mt-1">
                    รองรับทั้งข้อมูลสาธารณะและข้อมูลลับรายฟาร์ม
                  </p>
                </div>
              </div>

              {/* 8 Tables Specification */}
              <div className="border border-[#DFCBB3] rounded-xl overflow-hidden bg-white">
                <div className="bg-[#FAF6EE] px-4 py-3 border-b border-[#DFCBB3] flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-[#1E3F2B]" />
                  <h3 className="text-sm font-semibold text-[#1E3F2B]">
                    ตารางข้อมูลใน {DATABASE_NAME} (8 ตาราง)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F5EFE3] text-[#4A321F] border-b border-[#DFCBB3]">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ชื่อตาราง (Table)</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Primary Key</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ขอบเขตสิทธิ์ (Access)</th>
                        <th className="px-3 py-2.5 font-semibold">คอลัมน์หลัก (Columns)</th>
                        <th className="px-3 py-2.5 font-semibold">หน้าที่ในระบบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE6D5]">
                      {DATABASE_SCHEMA_SPEC.map(tbl => (
                        <tr key={tbl.tableName} className="hover:bg-[#FAF6EE]/70">
                          <td className="px-3 py-2.5 font-mono font-semibold text-[#1E3F2B] whitespace-nowrap">
                            {tbl.tableName}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[#4A321F] whitespace-nowrap">
                            {tbl.primaryKey}
                          </td>
                          <td className="px-3 py-2.5 text-[#5C5346] whitespace-nowrap">
                            {tbl.accessScope}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[#5C5346] min-w-[240px]">
                            {tbl.keyColumns}
                          </td>
                          <td className="px-3 py-2.5 text-[#24201B] min-w-[200px]">{tbl.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exact 14 Google Sheet Columns for Web Form */}
              <div className="border border-[#DFCBB3] rounded-xl overflow-hidden bg-white">
                <div className="bg-[#FAF6EE] px-4 py-3 border-b border-[#DFCBB3] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#1E3F2B]" />
                    <h3 className="text-sm font-semibold text-[#1E3F2B]">
                      โครงสร้างคอลัมน์ Google Sheet ชีต &quot;{WEB_FORM_SHEET_NAME}&quot; (คอลัมน์ A–N)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopy(
                        'headers',
                        WEB_FORM_SHEET_COLUMNS.map(c => c.header).join('\t')
                      )
                    }
                    className="px-3 py-1 rounded-lg border border-[#D5C3A8] bg-white hover:bg-[#F3ECE0] text-xs font-medium text-[#4A321F] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'headers' ? (
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'headers' ? 'คัดลอกหัวตารางแล้ว' : 'คัดลอกหัวคอลัมน์ A–N'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F5EFE3] text-[#4A321F] border-b border-[#DFCBB3]">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">คอลัมน์</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Field Key</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ชื่อหัวตาราง (Google Sheet Header)</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ชนิดข้อมูล</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">ตัวอย่างข้อมูล</th>
                        <th className="px-3 py-2.5 font-semibold">กฎการตรวจสอบ (Validation)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE6D5]">
                      {WEB_FORM_SHEET_COLUMNS.map(col => (
                        <tr key={col.key} className="hover:bg-[#FAF6EE]/70">
                          <td className="px-3 py-2 font-mono font-semibold text-[#1E3F2B] tabular-nums">
                            {col.columnLetter} ({col.colIndex})
                          </td>
                          <td className="px-3 py-2 font-mono text-[#4A321F]">{col.key}</td>
                          <td className="px-3 py-2 font-medium text-[#24201B] whitespace-nowrap">
                            {col.header}
                          </td>
                          <td className="px-3 py-2 font-mono text-[#5C5346] whitespace-nowrap">
                            {col.dataType}
                          </td>
                          <td className="px-3 py-2 text-[#5C5346] whitespace-nowrap">{col.example}</td>
                          <td className="px-3 py-2 text-[#24201B]">{col.validationRule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: API KEY SETUP + APPS SCRIPT CODE + SECURITY RULES   */}
          {/* ========================================================== */}
          {isOwnerAuthenticated && activeTab === 'security' && (
            <div className="space-y-6">
              {/* Step-by-Step Setup Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#DFCBB3] rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1E3F2B]">
                    <KeyRound className="w-4 h-4 text-[#2E6B47]" />
                    <span>วิธีตั้งค่า API Key อย่างปลอดภัย (4 ขั้นตอน)</span>
                  </div>
                  <ol className="text-xs text-[#24201B] space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      สร้าง Google Sheet เปล่า 1 ไฟล์ แล้วเปิดเมนู{' '}
                      <span className="font-mono font-semibold">Extensions → Apps Script</span>
                    </li>
                    <li>
                      วางโค้ด <span className="font-mono">Apps Script</span> ด้านล่างลงในไฟล์{' '}
                      <span className="font-mono">Code.gs</span> แล้วกดบันทึก
                    </li>
                    <li>
                      ตั้งค่า API Key ฝั่ง Google Sheet: ไปที่{' '}
                      <span className="font-semibold">Project Settings → Script Properties</span>{' '}
                      เพิ่ม Property ชื่อ <span className="font-mono font-semibold text-[#1E3F2B]">OVISPRO_API_KEY</span>{' '}
                      พร้อมตั้งรหัสลับของตนเอง (เช่น <span className="font-mono">ovis_secret_2026</span>)
                    </li>
                    <li>
                      ตั้งค่า Secret ชื่อ <span className="font-mono font-semibold text-[#1E3F2B]">OVISPRO_SHEET_API_KEY</span>{' '}
                      ให้ตรงกันในฝั่ง Server (<span className="font-mono">.env</span> / AI Studio Secrets) —{' '}
                      <span className="font-semibold text-[#4A321F]">
                        ห้ามใส่ API Key บนหน้าเว็บเบราว์เซอร์เด็ดขาด
                      </span>
                    </li>
                  </ol>
                  <div className="pt-2 border-t border-[#EFE6D5] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#5C5346]">
                      สถานะฝั่ง Server:{' '}
                      <strong className={apiKeyConfigured ? 'text-[#16A34A]' : 'text-[#D97706]'}>
                        {apiKeyConfigured
                          ? 'ตั้งค่า OVISPRO_SHEET_API_KEY แล้ว'
                          : 'โหมดพัฒนา (ยังไม่ได้บังคับ Key)'}
                      </strong>
                    </span>
                    {onOpenOwnerSheet && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenOwnerSheet();
                        }}
                        className="px-3 py-1 rounded-lg bg-[#4A321F] hover:bg-[#3A2718] text-[#FAF6EE] font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>เปิดหน้าผูก URL เจ้าของแอป</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Security Rules Summary for Professor Q&A */}
                <div className="border border-[#DFCBB3] rounded-xl p-4 bg-white space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1E3F2B]">
                    <ShieldCheck className="w-4 h-4 text-[#2E6B47]" />
                    <span>กฎความปลอดภัยของระบบ (Security Rules — ใช้ตอบอาจารย์)</span>
                  </div>
                  <ul className="text-xs text-[#24201B] space-y-2 leading-relaxed">
                    <li>
                      <strong className="text-[#1E3F2B]">1. แยกเก็บ API Key ฝั่ง Server เท่านั้น:</strong>{' '}
                      Backend Node.js แนบ <span className="font-mono">OVISPRO_SHEET_API_KEY</span> ให้เฉพาะตอนยิงเข้า Apps Script และ Apps Script ตรวจเทียบกับ{' '}
                      <span className="font-mono">PropertiesService</span>
                    </li>
                    <li>
                      <strong className="text-[#1E3F2B]">2. เข้ารหัสรหัสผ่าน (scrypt + Salt):</strong>{' '}
                      รหัสผ่านทุกฟาร์มไม่เก็บเป็น Plain Text แต่แฮชด้วย{' '}
                      <span className="font-mono">crypto.scryptSync</span> 64-byte และเทียบด้วย{' '}
                      <span className="font-mono">timingSafeEqual</span>
                    </li>
                    <li>
                      <strong className="text-[#1E3F2B]">3. แยกสิทธิ์เข้าถึงข้อมูล (RBAC & Cookie):</strong>{' '}
                      ใช้ Token ลงนาม <span className="font-mono">HMAC-SHA256</span> ผ่าน{' '}
                      <span className="font-mono">HttpOnly; Secure; SameSite=None</span> แยกสิทธิ์ Guest / Farm / App Owner ชัดเจน
                    </li>
                    <li>
                      <strong className="text-[#1E3F2B]">4. ป้องกัน SSRF & ตรวจข้อมูลขาเข้า (Input Validation):</strong>{' '}
                      อนุญาตเฉพาะ Webhook โดเมน <span className="font-mono">https://script.google.com/macros/s/*</span> พร้อมตรวจขอบเขตอายุ น้ำหนัก ไมครอน และความยาวข้อความทุกช่อง
                    </li>
                    <li>
                      <strong className="text-[#1E3F2B]">5. ป้องกันข้อมูลชนกัน (Concurrency & No-Store):</strong>{' '}
                      ใช้ <span className="font-mono">LockService</span> บน Google Sheet + Atomic Rename ฝั่ง Server +{' '}
                      <span className="font-mono">Cache-Control: no-store</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Copyable Google Apps Script Code */}
              <div className="border border-[#DFCBB3] rounded-xl overflow-hidden bg-white">
                <div className="bg-[#FAF6EE] px-4 py-3 border-b border-[#DFCBB3] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E3F2B]">
                      โค้ด Google Apps Script (รองรับ API Key Check + เพิ่มแถวจากฟอร์มเว็บ + ซิงค์ 2 ทาง)
                    </h3>
                    <p className="text-xs text-[#6E6254]">
                      Deploy เป็น Web App → Execute as: Me → Who has access: Anyone
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy('apps-script', APPS_SCRIPT_TEMPLATE)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1E3F2B] hover:bg-[#2A563C] text-[#FAF6EE] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'apps-script' ? (
                      <Check className="w-3.5 h-3.5 text-[#86EFAC]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'apps-script' ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Apps Script'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono bg-[#18231C] text-[#E6F0EA] overflow-x-auto max-h-[340px] leading-relaxed">
                  {APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
