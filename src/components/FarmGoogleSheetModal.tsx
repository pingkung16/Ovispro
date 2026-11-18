/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Save,
} from 'lucide-react';
import type {
  FarmLog,
  FarmProfile,
  FeedIngredient,
  FormulatedRation,
  Sheep,
} from '../types/sheep';
import {
  buildFarmSheetTabs,
  buildTsvForGoogleSheets,
  downloadAllSheetsAsWorkbook,
  downloadSheetAsCsv,
} from '../utils/sheetExport';

interface FarmGoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmProfile: FarmProfile;
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
  onProfileUpdated: (profile: FarmProfile) => void;
}

export const FarmGoogleSheetModal: React.FC<FarmGoogleSheetModalProps> = ({
  isOpen,
  onClose,
  farmProfile,
  sheepList,
  ingredients,
  rations,
  logs,
  onProfileUpdated,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState(farmProfile.googleSheetConfig?.sheetUrl || '');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setSheetUrl(farmProfile.googleSheetConfig?.sheetUrl || '');
    setStatusMsg(null);
  }, [farmProfile.farmId, isOpen]);

  const sheetTabs = useMemo(
    () =>
      buildFarmSheetTabs({
        profile: farmProfile,
        sheepList,
        ingredients,
        rations,
        logs,
      }),
    [farmProfile, sheepList, ingredients, rations, logs]
  );

  if (!isOpen) return null;

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      setStatusMsg({ type: 'error', text: 'เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ' });
    }
  };

  const handleSaveSheetLinkOnly = () => {
    const trimmedSheet = sheetUrl.trim();
    if (trimmedSheet && !trimmedSheet.startsWith('https://docs.google.com/spreadsheets/')) {
      setStatusMsg({
        type: 'error',
        text: 'ลิงก์ Google Sheet ต้องขึ้นต้นด้วย https://docs.google.com/spreadsheets/',
      });
      return;
    }
    const updated: FarmProfile = {
      ...farmProfile,
      googleSheetConfig: {
        ...farmProfile.googleSheetConfig,
        sheetUrl: trimmedSheet,
      },
    };
    onProfileUpdated(updated);
    setStatusMsg({
      type: 'success',
      text: 'บันทึกลิงก์ Google Sheet ประจำฟาร์มเรียบร้อยแล้ว',
    });
  };

  const savedSheetUrl = farmProfile.googleSheetConfig?.sheetUrl;

  return (
    <div className="fixed inset-0 bg-[#1B1712]/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-xl border-2 border-[#4A321F]/40 max-h-[92vh] overflow-y-auto space-y-5 text-[#24201B]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#EAE2D0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3F2B]">
              <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" />
              <span>ส่งออกข้อมูลฟาร์ม · {farmProfile.farmName}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3F2B]">
              ส่งออกข้อมูลฟาร์มเป็น Excel / Google Sheets
            </h3>
            <p className="text-xs text-[#6E6254]">
              ทะเบียนแกะ ({sheepList.length} ตัว) · วัตถุดิบ ({ingredients.length}) · สูตรอาหาร (
              {rations.length}) · สมุดบันทึก ({logs.length})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
            aria-label="ปิดหน้าต่างส่งออกข้อมูลฟาร์ม"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-sync reassurance */}
        <div className="bg-[#EDF4EF] border border-[#C5DEC9] rounded-xl px-4 py-3 text-xs text-[#1E3F2B] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            ข้อมูลทุกอย่างของฟาร์ม <strong>{farmProfile.farmName}</strong> ถูกบันทึกและสำรองเข้าสู่ระบบกลางของเว็บโดยอัตโนมัติทุกครั้งที่มีการเพิ่มหรือแก้ไข (รีเฟรชหน้าเว็บหรือเปลี่ยนเครื่องข้อมูลก็ไม่หาย) — หน้านี้ใช้สำหรับดาวน์โหลดไฟล์ไปใช้งานต่อเท่านั้น
          </div>
        </div>

        {statusMsg && (
          <div
            className={`rounded-xl px-4 py-3 text-xs sm:text-sm flex items-start gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-[#EDF4EF] border-[#C5DEC9] text-[#1E3F2B]'
                : 'bg-[#FCEFED] border-[#E8C5C0] text-[#A63D2E]'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Export Cards */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5C5346]">
              เลือกคัดลอกวาง (Ctrl+V) หรือดาวน์โหลดแยกตาราง:
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => downloadAllSheetsAsWorkbook(sheetTabs, farmProfile.farmName)}
                className="text-xs font-semibold bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดรวมทั้งหมด (.xls)</span>
              </button>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] inline-flex items-center gap-1 underline"
              >
                <span>เปิดสร้าง Google Sheet ใหม่</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sheetTabs.map(tab => {
              const isCopied = copiedKey === tab.sheetName;
              return (
                <div
                  key={tab.sheetName}
                  className="bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[#1E3F2B]">{tab.sheetName}</span>
                    <span className="font-mono text-xs text-[#6E4826] tabular-nums">
                      {tab.rows.length} แถว
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(tab.sheetName, buildTsvForGoogleSheets(tab))}
                      className="flex-1 min-h-[36px] bg-[#FFFDF9] hover:bg-[#F3ECE0] text-[#1E3F2B] border border-[#DFCBB3] rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอกวางใน Sheet</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadSheetAsCsv(tab, farmProfile.farmName)}
                      className="min-h-[36px] bg-[#4A321F] hover:bg-[#5E4029] text-[#FAF6EE] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title={`ดาวน์โหลด ${tab.sheetName}.csv`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional Personal Sheet Bookmark */}
        <div className="bg-[#FAF6EE] border border-[#EAE2D0] rounded-xl p-4 space-y-2.5 text-xs">
          <label className="block font-semibold text-[#5C5346]">
            ปักหมุดลิงก์ Google Sheet ส่วนตัวของฟาร์ม (ไม่บังคับ)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              className="flex-1 min-w-[200px] px-3.5 py-2 bg-white border border-[#DFCBB3] rounded-xl text-xs sm:text-sm text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
            />
            <button
              type="button"
              onClick={handleSaveSheetLinkOnly}
              className="min-h-[38px] bg-[#F3ECE0] hover:bg-[#E5DEC9] text-[#4A321F] border border-[#DFCBB3] px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกลิงก์</span>
            </button>
            {savedSheetUrl && (
              <a
                href={savedSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] bg-[#EDF4EF] hover:bg-[#DCECE1] text-[#1E3F2B] border border-[#C5DEC9] px-3.5 py-1.5 rounded-xl font-semibold inline-flex items-center gap-1.5"
              >
                <span>เปิดชีต</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#EAE2D0] flex items-center justify-between text-xs">
          <span className="text-[#6E6254]">
            บัญชีฟาร์ม: <strong className="font-mono text-[#1E3F2B]">@{farmProfile.username}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#F3ECE0] hover:bg-[#E5DEC9] text-[#24201B] rounded-xl font-semibold cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
