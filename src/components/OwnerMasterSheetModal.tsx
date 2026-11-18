/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Lock,
  LogOut,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Code2,
  Save,
} from 'lucide-react';
import type { OwnerMasterSheetData } from '../types/sheep';
import {
  fetchOwnerMasterSheet,
  getStoredOwnerToken,
  loginAppOwner,
  logoutAppOwner,
  saveOwnerSheetConfig,
  syncOwnerMasterSheet,
} from '../utils/api';
import {
  APPS_SCRIPT_TEMPLATE,
  buildTsvForGoogleSheets,
  downloadAllSheetsAsWorkbook,
  downloadSheetAsCsv,
} from '../utils/sheetExport';

interface OwnerMasterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveOwnerData?: OwnerMasterSheetData | null;
  onOwnerAuthStateChange?: (isAuthed: boolean) => void;
  onOpenArchitectGuide?: (tab: 'schema' | 'security') => void;
}

export const OwnerMasterSheetModal: React.FC<OwnerMasterSheetModalProps> = ({
  isOpen,
  onClose,
  liveOwnerData = null,
  onOwnerAuthStateChange,
  onOpenArchitectGuide,
}) => {
  const [ownerData, setOwnerData] = useState<OwnerMasterSheetData | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [sheetUrl, setSheetUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadMasterSheet = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await fetchOwnerMasterSheet();
      setOwnerData(data);
      setSheetUrl(data.ownerSheetConfig?.sheetUrl || '');
      setWebhookUrl(data.ownerSheetConfig?.appsScriptWebhookUrl || '');
      onOwnerAuthStateChange?.(true);
    } catch {
      setOwnerData(null);
      onOwnerAuthStateChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (getStoredOwnerToken()) {
      loadMasterSheet();
    }
  }, [isOpen]);

  // Apply real-time owner master updates seamlessly while preserving active sheet tab & search query
  useEffect(() => {
    if (!liveOwnerData) return;
    setOwnerData(prev => {
      if (!prev) {
        setSheetUrl(liveOwnerData.ownerSheetConfig?.sheetUrl || '');
        setWebhookUrl(liveOwnerData.ownerSheetConfig?.appsScriptWebhookUrl || '');
      }
      return liveOwnerData;
    });
  }, [liveOwnerData]);

  const activeTab = ownerData?.tabs[activeSheetIdx] || ownerData?.tabs[0] || null;

  const filteredRows = useMemo(() => {
    if (!activeTab) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeTab.rows;
    return activeTab.rows.filter(row =>
      row.some(cell => String(cell ?? '').toLowerCase().includes(q))
    );
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      await loginAppOwner(emailInput.trim(), passwordInput);
      setPasswordInput('');
      await loadMasterSheet();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'ไม่มีสิทธิ์เข้าถึง พื้นที่นี้สงวนไว้เฉพาะเจ้าของแอปพลิเคชันเท่านั้น'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerLogout = async () => {
    await logoutAppOwner();
    onOwnerAuthStateChange?.(false);
    setOwnerData(null);
    setEmailInput('');
    setPasswordInput('');
    setStatusMsg(null);
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      setStatusMsg({ type: 'error', text: 'เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ' });
    }
  };

  const handleSaveConfig = async () => {
    setStatusMsg(null);
    try {
      const res = await saveOwnerSheetConfig({
        sheetUrl: sheetUrl.trim(),
        appsScriptWebhookUrl: webhookUrl.trim(),
      });
      setOwnerData(prev => (prev ? { ...prev, ownerSheetConfig: res.ownerSheetConfig } : prev));
      setStatusMsg({
        type: 'success',
        text: 'บันทึกลิงก์ Google Sheet หลังบ้านส่วนตัวของคุณเรียบร้อยแล้ว',
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถบันทึกลิงก์ได้',
      });
    }
  };

  const handleSyncToGoogleSheet = async () => {
    setConfirmSyncOpen(false);
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const res = await syncOwnerMasterSheet({
        sheetUrl: sheetUrl.trim(),
        appsScriptWebhookUrl: webhookUrl.trim(),
      });
      setOwnerData(prev => (prev ? { ...prev, ownerSheetConfig: res.ownerSheetConfig } : prev));
      setStatusMsg({
        type: 'success',
        text: `ซิงค์ข้อมูลหลังบ้านทั้ง ${res.syncedTabs} แท็บขึ้น Google Sheet ของเจ้าของแอปเรียบร้อยแล้ว!`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'ซิงค์ขึ้น Google Sheet ไม่สำเร็จ',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1B1712]/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border-2 border-[#1E3F2B]/50 max-h-[94vh] overflow-y-auto space-y-5 text-[#24201B]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#EAE2D0]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3F2B] bg-[#EDF4EF] border border-[#C5DEC9] px-2.5 py-0.5 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>App-Owner-Only Google Sheets Backend (สิทธิ์เฉพาะเจ้าของแอปเท่านั้น)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3F2B]">
              ระบบ Google Sheet หลังบ้านรวมทั้งแอป Ovispro
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างหลังบ้านเจ้าของแอป"
            className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unauthenticated Gate */}
        {!ownerData ? (
          <form onSubmit={handleOwnerLogin} className="max-w-md mx-auto py-4 space-y-4">
            <div className="bg-[#FAF6EE] border border-[#DFCBB3] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#5C5346]">
              <Lock className="w-5 h-5 text-[#1E3F2B] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-[#1E3F2B] block text-sm mb-0.5">
                  ยืนยันตัวตนเจ้าของแอปพลิเคชัน
                </strong>
                ข้อมูลหลังบ้านรวมทุกฟาร์มและ Onlysheeps จะเปิดให้ดูและส่งออกเป็น Google Sheets
                ได้เฉพาะเจ้าของแอปเท่านั้น (ผู้ใช้ฟาร์มอื่นและบุคคลทั่วไปไม่สามารถเข้าหน้านี้ได้)
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-[#FCEFED] border border-[#E8C5C0] text-xs text-[#A63D2E] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                อีเมลเจ้าของแอป (Owner Google Email) *
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="กรอกอีเมลเจ้าของแอป..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm text-[#1E3F2B] focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5346] mb-1">
                รหัสผ่านเจ้าของแอป (Owner Password) *
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="กรอกรหัสผ่านเจ้าของแอป"
                className="w-full px-3.5 py-2.5 bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-sm text-[#1E3F2B] focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'ปลดล็อกเข้าสู่หลังบ้านเจ้าของแอป'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Authenticated Top Summary */}
            <div className="bg-[#EDF4EF] border border-[#C5DEC9] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-bold text-[#1E3F2B] text-sm">
                    เข้าใช้งานในฐานะเจ้าของแอป: {ownerData.ownerEmail}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#166534] bg-white border border-[#B7DFC2] px-2 py-0.5 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    <span>อัปเดตเรียลไทม์อัตโนมัติ</span>
                  </span>
                </div>
                <div className="text-[#2E6B47] font-mono">
                  รวมทั้งหมด {ownerData.summary.totalFarms} ฟาร์ม · {ownerData.summary.totalSheep} แกะ ·{' '}
                  {ownerData.summary.totalRations} สูตร · {ownerData.summary.totalLogs} บันทึก ·{' '}
                  {ownerData.summary.totalOnlysheeps} Onlysheeps
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadMasterSheet}
                  className="bg-white hover:bg-[#FAF6EE] text-[#1E3F2B] border border-[#C5DEC9] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>รีเฟรชข้อมูลหลังบ้าน</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadAllSheetsAsWorkbook(ownerData.tabs, 'Ovispro_Master_Backend')}
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดทั้ง {ownerData.tabs.length} แท็บ (.xls)</span>
                </button>
                <button
                  type="button"
                  onClick={handleOwnerLogout}
                  className="bg-[#FCEFED] hover:bg-[#F7DCD8] text-[#A63D2E] border border-[#E8C5C0] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ล็อก/ออก</span>
                </button>
              </div>
            </div>

            {statusMsg && (
              <div
                className={`rounded-xl px-4 py-3 text-xs flex items-center gap-2 border ${
                  statusMsg.type === 'success'
                    ? 'bg-[#EDF4EF] border-[#C5DEC9] text-[#1E3F2B]'
                    : 'bg-[#FCEFED] border-[#E8C5C0] text-[#A63D2E]'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Live Spreadsheet Viewer (6 Tabs) */}
            <div className="border border-[#DFCBB3] rounded-2xl overflow-hidden bg-[#FFFDF9]">
              <div className="bg-[#FAF6EE] px-4 py-3 border-b border-[#EAE2D0] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {ownerData.tabs.map((tab, idx) => (
                    <button
                      key={tab.sheetName}
                      type="button"
                      onClick={() => setActiveSheetIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        activeSheetIdx === idx
                          ? 'bg-[#1E3F2B] text-[#FAF6EE]'
                          : 'bg-white border border-[#DFCBB3] text-[#5C5346] hover:text-[#1E3F2B]'
                      }`}
                    >
                      {tab.sheetName} ({tab.rows.length})
                    </button>
                  ))}
                </div>

                {activeTab && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#8C7F6E] absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาในแท็บนี้..."
                        className="pl-8 pr-3 py-1 text-xs bg-white border border-[#DFCBB3] rounded-lg focus:outline-none focus:border-[#1E3F2B]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(`tab-${activeTab.sheetName}`, buildTsvForGoogleSheets(activeTab))
                      }
                      className="px-2.5 py-1 bg-white hover:bg-[#F3ECE0] border border-[#DFCBB3] rounded-lg text-xs font-semibold text-[#1E3F2B] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `tab-${activeTab.sheetName}` ? (
                        <>
                          <Check className="w-3 h-3 text-[#16A34A]" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>คัดลอกวาง Sheet</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSheetAsCsv(activeTab, 'Ovispro_Master')}
                      className="px-2.5 py-1 bg-[#4A321F] text-[#FAF6EE] rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                  </div>
                )}
              </div>

              {activeTab && (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-[#1E3F2B] text-[#FAF6EE] z-10">
                      <tr>
                        <th className="px-3 py-2 font-mono text-[11px] border-r border-[#2E6B47]/60">
                          #
                        </th>
                        {activeTab.headers.map(h => (
                          <th
                            key={h}
                            className="px-3 py-2 font-semibold whitespace-nowrap border-r border-[#2E6B47]/60"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D0]">
                      {filteredRows.slice(0, 120).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#FAF6EE]">
                          <td className="px-3 py-1.5 font-mono text-[11px] text-[#8C7F6E] border-r border-[#EAE2D0]">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3 py-1.5 whitespace-nowrap text-[#24201B] border-r border-[#EAE2D0]/70"
                            >
                              {String(cell ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {filteredRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={activeTab.headers.length + 1}
                            className="px-4 py-6 text-center text-[#8C7F6E]"
                          >
                            ไม่พบข้อมูลที่ตรงกับคำค้นหา
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab && filteredRows.length > 120 && (
                <div className="px-4 py-2 bg-[#FAF6EE] border-t border-[#EAE2D0] text-[11px] text-[#6E6254]">
                  แสดงตัวอย่าง 120 แถวแรกจากทั้งหมด {filteredRows.length} แถว — กดดาวน์โหลด (.xls / CSV) หรือซิงค์ Google Sheet เพื่อดูครบทุกแถว
                </div>
              )}
            </div>

            {/* Owner Private Google Sheet Direct Sync Config */}
            <div className="bg-[#FAF6EE] border border-[#DFCBB3] rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#1E3F2B]">
                  <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" />
                  <span>เชื่อมต่อ Google Sheet ส่วนตัว + ซิงค์กลางทุกหน้าจอ ({ownerData.ownerEmail})</span>
                </div>
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] inline-flex items-center gap-1 underline"
                >
                  <span>เปิดสร้างชีตส่วนตัวใหม่ (sheets.new)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-[11px] text-[#2E6B47] bg-[#EDF4EF] border border-[#C5DEC9] rounded-xl px-3 py-2 leading-relaxed">
                เมื่อบันทึก Apps Script Web App URL (โค้ดเวอร์ชันรองรับ doGet + doPost ด้านล่าง) ระบบจะใช้ชีตนี้เป็นจุดซิงค์กลาง 2 ทางอัตโนมัติ — ข้อมูลฟาร์มใหม่ แกะที่เพิ่ม และ Onlysheeps จากลิงก์แชร์และทุกเครื่องจะรวมถึงกันทันที
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5C5346] mb-1">
                    ลิงก์ไฟล์ Google Sheet ของฉัน (ส่วนตัว)
                  </label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3 py-2 bg-white border border-[#DFCBB3] rounded-xl text-xs focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5C5346] mb-1">
                    Apps Script Web App URL (ซิงค์ {ownerData.tabs.length} แท็บ + ฐานข้อมูลกลาง 2 ทาง)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-white border border-[#DFCBB3] rounded-xl text-xs font-mono focus:outline-none focus:border-[#1E3F2B]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="bg-white hover:bg-[#F3ECE0] text-[#4A321F] border border-[#DFCBB3] px-3 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกลิงก์</span>
                  </button>
                  {ownerData.ownerSheetConfig?.sheetUrl && (
                    <a
                      href={ownerData.ownerSheetConfig.sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#EDF4EF] text-[#1E3F2B] border border-[#C5DEC9] px-3 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>เปิด Google Sheet ของฉัน</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowScriptCode(prev => !prev)}
                    className="text-[#4A321F] underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>
                      {showScriptCode
                        ? 'ซ่อนโค้ด Apps Script'
                        : `ดูโค้ด Apps Script (${ownerData.tabs.length} แท็บ)`}
                    </span>
                  </button>
                  {onOpenArchitectGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenArchitectGuide('security');
                      }}
                      className="text-[#1E3F2B] underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>คู่มือ API Key · คอลัมน์ · กฎความปลอดภัย</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!webhookUrl.trim() || isSyncing}
                  onClick={() => setConfirmSyncOpen(true)}
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncing
                      ? 'กำลังซิงค์...'
                      : `ซิงค์ ${ownerData.tabs.length} แท็บขึ้น Google Sheet`}
                  </span>
                </button>
              </div>

              {ownerData.ownerSheetConfig?.lastSyncedAt && (
                <p className="text-[11px] text-[#2E6B47]">
                  ซิงค์ล่าสุดเมื่อ:{' '}
                  {new Date(ownerData.ownerSheetConfig.lastSyncedAt).toLocaleString('th-TH')}
                </p>
              )}

              {confirmSyncOpen && (
                <div className="bg-[#FFF9EB] border-2 border-[#D97706]/50 rounded-xl p-3.5 space-y-2.5">
                  <p className="text-[#78350F] font-semibold">
                    ยืนยันการเขียนทับและอัปเดตข้อมูลทั้ง {ownerData.tabs.length} แท็บลงใน Google Sheet หลังบ้านของคุณ?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmSyncOpen(false)}
                      className="px-3 py-1 rounded-lg bg-white border border-[#DFCBB3] text-[#5C5346] cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncToGoogleSheet}
                      className="px-3.5 py-1 rounded-lg bg-[#1E3F2B] text-white font-semibold cursor-pointer"
                    >
                      ยืนยันซิงค์
                    </button>
                  </div>
                </div>
              )}

              {showScriptCode && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopy('master-script', APPS_SCRIPT_TEMPLATE)}
                      className="px-2.5 py-1 bg-white border border-[#DFCBB3] rounded-lg font-semibold text-[#1E3F2B] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>คัดลอกโค้ด Apps Script</span>
                    </button>
                  </div>
                  <pre className="bg-[#1B1712] text-[#FAF6EE] p-3 rounded-xl text-[11px] overflow-x-auto font-mono leading-relaxed">
                    {APPS_SCRIPT_TEMPLATE}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
