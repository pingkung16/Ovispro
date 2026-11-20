/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Globe,
  Copy,
  Check,
  Share2,
  Download,
  Upload,
  Smartphone,
  X,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { FeedIngredient, FormulatedRation, FarmLog, Sheep } from '../types/sheep';

interface SharePublicModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  cloudSyncConfigured?: boolean;
  farmName: string;
  setFarmName: (name: string) => void;
  farmOwner: string;
  setFarmOwner: (owner: string) => void;
  sheepList: Sheep[];
  ingredients: FeedIngredient[];
  rations: FormulatedRation[];
  logs: FarmLog[];
  onImportData: (data: {
    sheep: Sheep[];
    ingredients: FeedIngredient[];
    rations: FormulatedRation[];
    logs: FarmLog[];
  }) => void;
  onResetToDemoData: () => void;
  onClearAllData: () => void;
}

export const SharePublicModal: React.FC<SharePublicModalProps> = ({
  isOpen,
  onClose,
  publicUrl,
  cloudSyncConfigured = false,
  farmName,
  setFarmName,
  farmOwner,
  setFarmOwner,
  sheepList,
  ingredients,
  rations,
  logs,
  onImportData,
  onResetToDemoData,
  onClearAllData,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'unlock' | 'backup' | 'settings' | 'install'>('share');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (publicUrl && publicUrl.trim()) return publicUrl.trim();
    return 'https://ovispro-fawn.vercel.app/';
  }, [publicUrl]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('share');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 3,
      errorCorrectionLevel: 'M',
      color: { dark: '#1E3F2B', light: '#FFFFFF' },
    })
      .then(url => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const lineShareHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(
    `เข้าใช้งานเว็บระบบจัดการฟาร์มแกะขน Ovispro ได้ที่ลิงก์นี้: ${shareUrl}`
  )}`;

  const facebookShareHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}`;

  const handleExportJson = () => {
    const exportData = {
      appName: 'Ovispro',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      farmProfile: {
        name: farmName,
        owner: farmOwner,
      },
      data: {
        sheep: sheepList,
        ingredients,
        rations,
        logs,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ovispro_backup_${farmName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && Array.isArray(parsed.data.sheep) && Array.isArray(parsed.data.ingredients)) {
          onImportData({
            sheep: parsed.data.sheep,
            ingredients: parsed.data.ingredients,
            rations: parsed.data.rations || [],
            logs: parsed.data.logs || [],
          });
          if (parsed.farmProfile?.name) setFarmName(parsed.farmProfile.name);
          if (parsed.farmProfile?.owner) setFarmOwner(parsed.farmProfile.owner);
          setImportSuccess(
            `นำเข้าข้อมูลสำเร็จ: แกะ ${parsed.data.sheep.length} ตัว, วัตถุดิบ ${parsed.data.ingredients.length} ชนิด, สูตรอาหาร ${parsed.data.rations?.length || 0} สูตร`
          );
        } else {
          setImportError('รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ JSON ที่ส่งออกจากระบบ Ovispro');
        }
      } catch {
        setImportError('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-[#1B1712]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-xl border border-[#DFCBB3] max-h-[92vh] overflow-y-auto space-y-5 text-[#24201B]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#EAE2D0]">
          <div>
            <p className="text-xs text-[#9C6B3F] font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#1E3F2B]" />
              <span>แชร์ลิงก์เว็บ & QR Code</span>
            </p>
            <h3 className="text-lg font-semibold text-[#1E3F2B] mt-1">
              แบ่งปันลิงก์แอป Ovispro ให้คนอื่น
            </h3>
            <p className="text-xs text-[#6E6254] mt-0.5">
              สแกน QR Code หรือคัดลอกลิงก์เพื่อเปิดใช้งานระบบจัดการฟาร์มแกะขน
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่างแชร์"
            className="text-[#8C7F6E] hover:text-[#24201B] p-1.5 rounded-lg hover:bg-[#F3ECE0] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#EAE2D0] text-xs font-medium text-[#6E6254] gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('share')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'share'
                ? 'border-[#1E3F2B] text-[#1E3F2B] font-semibold'
                : 'border-transparent hover:text-[#1E3F2B]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>ลิงก์ & QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('unlock')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'unlock'
                ? 'border-[#9C6B3F] text-[#9C6B3F] font-semibold'
                : 'border-transparent hover:text-[#1E3F2B]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>วิธีเปิดให้คนอื่นเข้าได้</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'backup'
                ? 'border-[#1E3F2B] text-[#1E3F2B] font-semibold'
                : 'border-transparent hover:text-[#1E3F2B]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>สำรอง / นำเข้าข้อมูล</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'border-[#1E3F2B] text-[#1E3F2B] font-semibold'
                : 'border-transparent hover:text-[#1E3F2B]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>ชื่อฟาร์ม</span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'install'
                ? 'border-[#1E3F2B] text-[#1E3F2B] font-semibold'
                : 'border-transparent hover:text-[#1E3F2B]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>วิธีลงมือถือ</span>
          </button>
        </div>

        {/* Tab 1: Clean Share Link & QR Code */}
        {activeTab === 'share' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5C5346] mb-1">
                ลิงก์เว็บแอปพลิเคชันสำหรับแชร์:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#1E3F2B] font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#DFCBB3]" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#EDF4EF] hover:bg-[#DCECE1] text-[#1E3F2B] border border-[#C5DEC9] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดลิงก์แชร์สาธารณะในแท็บใหม่</span>
                </a>
                {cloudSyncConfigured && (
                  <p className="text-[11px] text-[#6E6254] leading-relaxed w-full mt-1">
                    ทุกคนที่สแกน QR หรือเปิดลิงก์แชร์จะเข้าใช้งานเว็บ Ovispro และซิงค์ข้อมูลถึงกันแบบเรียลไทม์
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#DFCBB3] shrink-0 text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code ลิงก์เว็บ Ovispro"
                    className="w-36 h-36 mx-auto rounded"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-[#8C7F6E]">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] text-[#2E6B47] block mt-1 font-mono font-semibold">
                  สแกนเปิดเว็บ Ovispro
                </span>
              </div>

              <div className="text-xs space-y-2 text-[#5C5346]">
                <h4 className="font-semibold text-[#1E3F2B] text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#9C6B3F]" />
                  <span>วิธีแชร์และเปิดเข้าใช้งาน:</span>
                </h4>
                <p>1. ใช้กล้องมือถือสแกน QR Code เพื่อเปิดหน้าเว็บ Ovispro ได้ทันที</p>
                <p>2. หรือกดคัดลอกลิงก์แล้วส่งผ่าน LINE / Facebook ให้เพื่อนเกษตรกร</p>
                <p>3. ใช้งานได้ทั้งคอมพิวเตอร์ มือถือ และแท็บเล็ต</p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#5C5346] mb-2">
                แชร์ต่อให้กลุ่มผู้เลี้ยงแกะ:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={lineShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#06C755] hover:bg-[#05b34c] text-white py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>แชร์ไปยัง LINE</span>
                </a>
                <a
                  href={facebookShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>แชร์ไปยัง Facebook</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 0: Unlock */}
        {activeTab === 'unlock' && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#F9F2E4] p-4 rounded-xl border border-[#E5D3B3] space-y-2">
              <div className="flex items-center gap-2 text-[#855828] font-semibold text-sm">
                <AlertCircle className="w-5 h-5 text-[#9C6B3F] shrink-0" />
                <span>วิธีเปิดสิทธิ์ให้คนภายนอกเข้าเว็บได้</span>
              </div>
              <p className="text-[#5C5346] leading-relaxed">
                หากตั้งค่าความปลอดภัยเริ่มต้นของ AI Studio ไว้เป็น <strong>"Restricted"</strong>{' '}
                ให้เปลี่ยนเป็น <strong>"Anyone with the link"</strong> ที่ปุ่ม Share มุมขวาบนก่อนส่งลิงก์หรือ QR Code ให้เพื่อนครับ
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('share')}
                className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>ไปที่แท็บลิงก์ & QR Code</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Backup / Restore */}
        {activeTab === 'backup' && (
          <div className="space-y-4 text-xs">
            {importSuccess && (
              <div className="p-3 bg-[#EDF4EF] text-[#1E3F2B] border border-[#C5DEC9] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E6B47] shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-[#FCEFED] text-[#A63D2E] border border-[#E8C5C0] rounded-xl">
                {importError}
              </div>
            )}

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
              <div>
                <h4 className="font-semibold text-[#1E3F2B] text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#9C6B3F]" />
                  <span>1. ส่งออกไฟล์สำรองข้อมูลฟาร์ม (Backup Data)</span>
                </h4>
                <p className="text-[#6E6254] mt-1">
                  ดาวน์โหลดข้อมูลแกะ {sheepList.length} ตัว, วัตถุดิบ {ingredients.length} ชนิด, สูตรอาหาร{' '}
                  {rations.length} สูตร และบันทึกฟาร์มเก็บไว้ในเครื่อง
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="bg-[#1E3F2B] hover:bg-[#29533A] text-[#FAF6EE] px-4 py-2 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)</span>
              </button>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-3">
              <div>
                <h4 className="font-semibold text-[#1E3F2B] text-sm flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#9C6B3F]" />
                  <span>2. นำเข้าไฟล์ข้อมูลฟาร์ม (Restore / Import Data)</span>
                </h4>
                <p className="text-[#6E6254] mt-1">นำไฟล์ JSON ที่เคยสำรองไว้กลับเข้ามาใช้งานในระบบ</p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFDF9] border border-[#DFCBB3] hover:bg-[#F3ECE0] rounded-xl font-medium text-[#24201B] cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>เลือกไฟล์ JSON เพื่อนำเข้า...</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>

            <div className="pt-3 border-t border-[#EAE2D0] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#6E6254]">จัดการข้อมูลเริ่มต้น:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onResetToDemoData}
                  className="px-3 py-1.5 bg-[#F3ECE0] hover:bg-[#E5DEC9] text-[#24201B] rounded-xl font-medium border border-[#DFCBB3] cursor-pointer"
                >
                  คืนค่าตัวอย่างเริ่มต้นของฟาร์มนี้
                </button>
                <button
                  onClick={onClearAllData}
                  className="px-3 py-1.5 bg-[#FCEFED] hover:bg-[#F7DCD8] text-[#A63D2E] rounded-xl font-medium border border-[#E8C5C0] cursor-pointer"
                >
                  ล้างข้อมูลเริ่มฟาร์มใหม่
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Farm Profile Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#5C5346] mb-1">ชื่อฟาร์ม (Farm Name)</label>
              <input
                type="text"
                value={farmName}
                onChange={e => setFarmName(e.target.value)}
                placeholder="เช่น Ovisfarm"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl font-semibold text-[#1E3F2B] focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#5C5346] mb-1">เจ้าของฟาร์ม / จังหวัด</label>
              <input
                type="text"
                value={farmOwner}
                onChange={e => setFarmOwner(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6EE] border border-[#DFCBB3] rounded-xl text-[#24201B] focus:outline-none focus:border-[#1E3F2B]"
              />
            </div>

            <div className="p-4 bg-[#EDF4EF] rounded-xl border border-[#C5DEC9] text-[#1E3F2B]">
              <span className="font-semibold block mb-1">ความเป็นส่วนตัวของข้อมูลฟาร์ม:</span>
              <p className="text-[#2E6B47] leading-relaxed">
                ข้อมูลของแต่ละฟาร์มแยกจัดเก็บบนฐานข้อมูลอย่างปลอดภัย ฟาร์มอื่นไม่สามารถเข้ามาดูข้อมูลส่วนตัวของคุณได้
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Install to Mobile */}
        {activeTab === 'install' && (
          <div className="space-y-3 text-xs text-[#5C5346]">
            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-2">
              <span className="font-semibold text-[#1E3F2B] text-sm block">
                สำหรับผู้ใช้ iPhone / iPad (Safari):
              </span>
              <ol className="list-decimal pl-5 space-y-1">
                <li>เปิดลิงก์ในเว็บเบราว์เซอร์ Safari</li>
                <li>กดปุ่ม แชร์ (Share) ที่แถบด้านล่าง</li>
                <li>เลือก &quot;เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)&quot;</li>
              </ol>
            </div>

            <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE2D0] space-y-2">
              <span className="font-semibold text-[#1E3F2B] text-sm block">
                สำหรับผู้ใช้ Android (Google Chrome):
              </span>
              <ol className="list-decimal pl-5 space-y-1">
                <li>เปิดลิงก์ใน Google Chrome</li>
                <li>กดจุด 3 จุด (⋮) มุมขวาบน</li>
                <li>เลือก &quot;ติดตั้งแอป (Install app)&quot; หรือ &quot;เพิ่มลงในหน้าจอหลัก&quot;</li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#EAE2D0] flex justify-between items-center text-xs">
          <span className="font-brand italic text-sm font-semibold text-[#9C6B3F]">
            Ovispro Farm Edition
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#F3ECE0] hover:bg-[#E5DEC9] text-[#24201B] rounded-xl font-medium cursor-pointer transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
